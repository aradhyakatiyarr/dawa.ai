import { NextResponse } from "next/server";

export async function GET() {
  // Return unauthenticated so the client-side localStorage session takes over
  return NextResponse.json({ authenticated: false });
}
