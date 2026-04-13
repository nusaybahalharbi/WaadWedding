import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { isAllowedFileType, isFileTooLarge, UPLOAD_CONFIG } from "@/lib/upload-config";
import { randomBytes } from "crypto";

const BUCKET = "wedding-uploads";

// Rate limiting: simple in-memory tracker
const uploadTracker = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30; // max uploads per IP per hour
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const tracker = uploadTracker.get(ip);
  if (!tracker || now > tracker.resetAt) {
    uploadTracker.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (tracker.count >= RATE_LIMIT) return false;
  tracker.count++;
  return true;
}

// GET: Check if uploads are open
export async function GET() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "uploads_open")
    .single();

  const isOpen = data?.value !== "false";
  return NextResponse.json({ closed: !isOpen });
}

// POST: Handle file upload
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "تم تجاوز الحد المسموح. حاول لاحقاً." },
        { status: 429 }
      );
    }

    const supabase = createAdminClient();

    // Check if uploads are open
    const { data: setting } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "uploads_open")
      .single();

    if (setting?.value === "false") {
      return NextResponse.json(
        { error: "تم إغلاق استقبال الصور", closed: true },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const guestName = (formData.get("guestName") as string) || "ضيف كريم";

    if (!file) {
      return NextResponse.json(
        { error: "لم يتم اختيار ملف" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!isAllowedFileType(file.type)) {
      return NextResponse.json(
        { error: "نوع الملف غير مدعوم" },
        { status: 400 }
      );
    }

    // Validate file size
    if (isFileTooLarge(file.size)) {
      return NextResponse.json(
        {
          error: `حجم الملف يتجاوز الحد المسموح (${UPLOAD_CONFIG.maxFileSizeMB} MB)`,
        },
        { status: 400 }
      );
    }

    // Generate unique filename to prevent enumeration
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const uniqueId = randomBytes(16).toString("hex");
    const timestamp = Date.now();
    const storagePath = `${timestamp}_${uniqueId}.${ext}`;

    // Upload to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "فشل في رفع الملف. حاول مرة أخرى." },
        { status: 500 }
      );
    }

    // Record in database
    const { error: dbError } = await supabase.from("uploads").insert({
      storage_path: storagePath,
      original_name: file.name,
      file_type: file.type,
      file_size: file.size,
      guest_name: guestName.slice(0, 100), // limit name length
      ip_address: ip,
      reviewed: false,
    });

    if (dbError) {
      console.error("Database insert error:", dbError);
      // Still a success from user perspective - file is uploaded
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}
