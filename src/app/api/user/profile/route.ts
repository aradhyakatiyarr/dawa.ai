import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  try {
    const { name, email } = await request.json();
    return NextResponse.json({
      success: true,
      user: {
        id: "mock-user-id",
        name,
        email: email.toLowerCase(),
        role: email.toLowerCase() === "admin@dawa.ai" ? "ADMIN" : "USER"
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
