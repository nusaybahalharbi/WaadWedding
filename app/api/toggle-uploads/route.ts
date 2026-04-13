import { NextRequest, NextResponse } from "next/server";
import { validateSession, SESSION_COOKIE } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token || !validateSession(token)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { open } = await request.json();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("settings")
    .upsert({ key: "uploads_open", value: String(open) }, { onConflict: "key" });

  if (error) {
    return NextResponse.json({ error: "فشل التحديث" }, { status: 500 });
  }

  return NextResponse.json({ success: true, open });
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token || !validateSession(token)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "uploads_open")
    .single();

  return NextResponse.json({ open: data?.value !== "false" });
}
