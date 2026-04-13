import { NextRequest, NextResponse } from "next/server";
import { validateSession, SESSION_COOKIE } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase";

const BUCKET = "wedding-uploads";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token || !validateSession(token)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: uploads, error } = await supabase
    .from("uploads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "فشل تحميل البيانات" }, { status: 500 });
  }

  // Generate signed URLs for previews (valid 1 hour)
  const filesWithUrls = await Promise.all(
    (uploads || []).map(async (upload) => {
      const { data: urlData } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(upload.storage_path, 3600);

      return {
        ...upload,
        preview_url: urlData?.signedUrl || null,
      };
    })
  );

  return NextResponse.json({ files: filesWithUrls });
}
