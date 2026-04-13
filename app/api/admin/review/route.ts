import { NextRequest, NextResponse } from "next/server";
import { validateSession, SESSION_COOKIE } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token || !validateSession(token)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { id, reviewed } = await request.json();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("uploads")
    .update({ reviewed })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "فشل التحديث" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
