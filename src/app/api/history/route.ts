import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/jwt";

// GET Scan History (with optional search filter)
export async function GET(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const whereClause: any = {
      userId: session.userId,
    };

    if (search) {
      whereClause.OR = [
        { brandName: { contains: search } },
        { manufacturer: { contains: search } },
        { category: { contains: search } },
      ];
    }

    const scans = await prisma.scanHistory.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    // Parse JSON fields back to objects
    const formattedScans = scans.map((scan) => ({
      ...scan,
      activeIngredients: JSON.parse(scan.activeIngredients),
      safetyExplanation: JSON.parse(scan.safetyExplanation),
    }));

    return NextResponse.json({ scans: formattedScans });

  } catch (error: any) {
    console.error("Fetch history error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

// POST Save Scan to History
export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      // Return success but notify that it wasn't saved (Guest scan)
      return NextResponse.json({ success: true, saved: false, message: "Guest Scan - login to save history" });
    }

    const { scannedMedicine, genericAlternative, safetyExplanation } = await request.json();

    if (!scannedMedicine || !safetyExplanation) {
      return NextResponse.json({ error: "Missing required scan data" }, { status: 400 });
    }

    // Save transaction
    const newScan = await prisma.scanHistory.create({
      data: {
        userId: session.userId,
        brandName: scannedMedicine.brandName,
        manufacturer: scannedMedicine.manufacturer || "Unknown",
        category: scannedMedicine.category || "General",
        activeIngredients: JSON.stringify(scannedMedicine.activeIngredients || []),
        genericName: genericAlternative?.genericName || null,
        genericPrice: genericAlternative?.genericPrice || null,
        brandPrice: genericAlternative?.brandPrice || null,
        savingsAmount: genericAlternative ? (genericAlternative.brandPrice - genericAlternative.genericPrice) : null,
        savingsPercent: genericAlternative ? Math.round(((genericAlternative.brandPrice - genericAlternative.genericPrice) / genericAlternative.brandPrice) * 100) : null,
        safetyExplanation: JSON.stringify(safetyExplanation)
      }
    });

    return NextResponse.json({ 
      success: true, 
      saved: true, 
      scanId: newScan.id 
    });

  } catch (error: any) {
    console.error("Save history error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

// DELETE Remove scan(s) from history
export async function DELETE(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scanId = searchParams.get("id");

    if (scanId) {
      // Delete specific record
      const scan = await prisma.scanHistory.findFirst({
        where: { id: scanId, userId: session.userId }
      });

      if (!scan) {
        return NextResponse.json({ error: "Record not found" }, { status: 404 });
      }

      await prisma.scanHistory.delete({
        where: { id: scanId }
      });

      return NextResponse.json({ success: true, message: "Record deleted successfully" });
    } else {
      // Clear entire history for user
      await prisma.scanHistory.deleteMany({
        where: { userId: session.userId }
      });

      return NextResponse.json({ success: true, message: "All history records cleared" });
    }

  } catch (error: any) {
    console.error("Delete history error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
