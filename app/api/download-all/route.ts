import { NextRequest, NextResponse } from "next/server";
import { validateSession, SESSION_COOKIE } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase";
import archiver from "archiver";
import { PassThrough } from "stream";

const BUCKET = "wedding-uploads";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token || !validateSession(token)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Get all uploads
  const { data: uploads, error } = await supabase
    .from("uploads")
    .select("*")
    .order("created_at", { ascending: true });

  if (error || !uploads?.length) {
    return NextResponse.json(
      { error: "لا توجد ملفات للتحميل" },
      { status: 404 }
    );
  }

  // Create zip stream
  const archive = archiver("zip", { zlib: { level: 5 } });
  const passthrough = new PassThrough();
  archive.pipe(passthrough);

  // Add each file to the zip
  for (const upload of uploads) {
    try {
      const { data: fileData } = await supabase.storage
        .from(BUCKET)
        .download(upload.storage_path);

      if (fileData) {
        const buffer = Buffer.from(await fileData.arrayBuffer());
        const safeName = upload.guest_name?.replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, "_") || "guest";
        const ext = upload.original_name?.split(".").pop() || "jpg";
        const fileName = `${safeName}_${upload.id}.${ext}`;
        archive.append(buffer, { name: fileName });
      }
    } catch (err) {
      console.error(`Failed to add file ${upload.storage_path}:`, err);
    }
  }

  archive.finalize();

  // Convert PassThrough stream to ReadableStream for Response
  const readable = new ReadableStream({
    start(controller) {
      passthrough.on("data", (chunk) => controller.enqueue(chunk));
      passthrough.on("end", () => controller.close());
      passthrough.on("error", (err) => controller.error(err));
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="wedding-photos-waad-mohammed.zip"`,
    },
  });
}
