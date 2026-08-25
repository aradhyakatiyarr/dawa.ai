import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/jwt";

// Helper to assert admin privilege
async function checkAdmin() {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return null;
  }
  return session;
}

// GET admin dashboard stats and users list
export async function GET() {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    // Stats Calculation
    const totalUsers = await prisma.user.count();
    const totalScans = await prisma.scanHistory.count();
    
    // Average savings aggregate
    const savingsAggregate = await prisma.scanHistory.aggregate({
      _avg: {
        savingsPercent: true,
      },
      _sum: {
        savingsAmount: true,
      }
    });

    const avgSavingsPercent = Math.round(savingsAggregate._avg.savingsPercent || 0);
    const totalAmountSaved = Math.round(savingsAggregate._sum.savingsAmount || 0);

    // Fetch list of users with scan counts
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: { scans: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      scanCount: user._count.scans
    }));

    return NextResponse.json({
      stats: {
        totalUsers,
        totalScans,
        avgSavingsPercent,
        totalAmountSaved
      },
      users: formattedUsers
    });

  } catch (error: any) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

// PUT Update user roles
export async function PUT(request: Request) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { targetUserId, newRole } = await request.json();

    if (!targetUserId || !newRole || !["USER", "ADMIN"].includes(newRole)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    // Prevent self demotion
    if (targetUserId === admin.userId) {
      return NextResponse.json({ error: "You cannot change your own admin role" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole }
    });

    return NextResponse.json({ 
      success: true, 
      message: `User ${updatedUser.name} updated to role ${newRole}` 
    });

  } catch (error: any) {
    console.error("Admin role change error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

// DELETE Remove a user from the platform
export async function DELETE(request: Request) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (userId === admin.userId) {
      return NextResponse.json({ error: "You cannot delete your own admin account" }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({ 
      success: true, 
      message: "User and all their history records deleted successfully" 
    });

  } catch (error: any) {
    console.error("Admin delete user error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
