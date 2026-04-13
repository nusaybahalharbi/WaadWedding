import { NextRequest, NextResponse } from "next/server";
import {
  validateCredentials,
  generateSessionToken,
  createSession,
  destroySession,
  validateSession,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/auth";

// POST: Login
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!validateCredentials(username, password)) {
      // Delay to prevent brute force timing attacks
      await new Promise((r) => setTimeout(r, 1000));
      return NextResponse.json(
        { error: "بيانات الدخول غير صحيحة" },
        { status: 401 }
      );
    }

    const token = generateSessionToken();
    createSession(token);

    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

// DELETE: Logout
export async function DELETE(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) destroySession(token);

  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

// GET: Check session
export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const valid = token ? validateSession(token) : false;
  return NextResponse.json({ authenticated: valid });
}
