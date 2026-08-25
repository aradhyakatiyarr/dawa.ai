import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    stats: {
      totalUsers: 0,
      totalScans: 0,
      avgSavingsPercent: 0,
      totalAmountSaved: 0
    },
    users: []
  });
}

export async function PUT() {
  return NextResponse.json({ success: true });
}

export async function DELETE() {
  return NextResponse.json({ success: true });
}
