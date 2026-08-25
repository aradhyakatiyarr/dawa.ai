import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ scans: [] });
}

export async function POST() {
  return NextResponse.json({ success: true, saved: true });
}

export async function DELETE() {
  return NextResponse.json({ success: true });
}
