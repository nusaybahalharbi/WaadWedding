import { NextRequest, NextResponse } from "next/server";
import { validateSession, SESSION_COOKIE } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase";

const BUCKET = "wedding-uploads";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token || !validateSession(token)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { ids, storagePaths } = await request.json();

  if (!ids?.length || !storagePaths?.length) {
    return NextResponse.json({ error: "لا توجد ملفات محددة" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove(storagePaths);

  if (storageError) {
    console.error("Storage delete error:", storageError);
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from("uploads")
    .delete()
    .in("id", ids);

  if (dbError) {
    console.error("DB delete error:", dbError);
    return NextResponse.json({ error: "فشل الحذف" }, { status: 500 });
  }

  return NextResponse.json({ success: true, deleted: ids.length });
}
