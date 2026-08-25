import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    return NextResponse.json({
      success: true,
      user: {
        id: "mock-user-id",
        name: email.split("@")[0],
        email: email.toLowerCase(),
        role: email.toLowerCase() === "admin@dawa.ai" ? "ADMIN" : "USER"
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
