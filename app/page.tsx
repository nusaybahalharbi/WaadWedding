"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const ACCESS_CODE = process.env.NEXT_PUBLIC_ACCESS_CODE || "";

type UploadState =
  | "access-gate"
  | "ready"
  | "uploading"
  | "success"
  | "closed"
  | "error";

export default function GuestUploadPage() {
  const [state, setState] = useState<UploadState>(
    ACCESS_CODE ? "access-gate" : "ready"
  );
  const [accessInput, setAccessInput] = useState("");
  const [accessError, setAccessError] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [guestName, setGuestName] = useState("");
  const [consent, setConsent] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isClosed, setIsClosed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if uploads are open
  useEffect(() => {
    fetch("/api/upload", { method: "GET" })
      .then((r) => r.json())
      .then((data) => {
        if (data.closed) {
          setState("closed");
          setIsClosed(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleAccessSubmit = () => {
    if (accessInput.trim() === ACCESS_CODE) {
      setState("ready");
      setAccessError(false);
    } else {
      setAccessError(true);
    }
  };

  const handleFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const allowed = [
        "image/jpeg",
        "image/png",
        "image/heic",
        "image/heif",
        "image/webp",
        "video/mp4",
        "video/quicktime",
        "video/x-msvideo",
        "video/webm",
        "video/3gpp",
      ];
      const maxSize = 50 * 1024 * 1024; // 50MB
      const maxFiles = 10;

      const validFiles = Array.from(newFiles).filter((f) => {
        if (!allowed.includes(f.type)) return false;
        if (f.size > maxSize) return false;
        return true;
      });

      const combined = [...files, ...validFiles].slice(0, maxFiles);
      setFiles(combined);
    },
    [files]
  );

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleUpload = async () => {
    if (files.length === 0 || !consent) return;

    setState("uploading");
    setUploadProgress(0);

    try {
      const totalFiles = files.length;
      let uploaded = 0;

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        if (guestName.trim()) {
          formData.append("guestName", guestName.trim());
        }

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          if (data.closed) {
            setState("closed");
            return;
          }
          throw new Error(data.error || "Upload failed");
        }

        uploaded++;
        setUploadProgress(Math.round((uploaded / totalFiles) * 100));
      }

      setState("success");
    } catch (err: any) {
      setErrorMsg(err.message || "حدث خطأ أثناء الرفع");
      setState("error");
    }
  };

  const resetUpload = () => {
    setFiles([]);
    setConsent(false);
    setUploadProgress(0);
    setErrorMsg("");
    setState("ready");
  };

  // ─── Access Gate ───
  if (state === "access-gate") {
    return (
      <Shell>
        <div className="animate-fade-in text-center space-y-6">
          <WeddingHeader />
          <div className="space-y-3">
            <p className="font-arabic text-lg text-wedding-charcoal/80">
              أدخل رمز الدخول
            </p>
            <p className="text-sm text-wedding-taupe font-body">
              Enter access code
            </p>
            <input
              type="text"
              value={accessInput}
              onChange={(e) => {
                setAccessInput(e.target.value);
                setAccessError(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleAccessSubmit()}
              placeholder="رمز الدخول"
              className="w-full max-w-[240px] mx-auto block text-center text-lg tracking-widest py-3 px-4 bg-white/60 border border-wedding-gold-light rounded-xl focus:outline-none focus:border-wedding-gold font-body"
              dir="ltr"
              autoFocus
            />
            {accessError && (
              <p className="text-red-400 text-sm font-arabic">
                رمز الدخول غير صحيح
              </p>
            )}
            <button
              onClick={handleAccessSubmit}
              className="mt-2 px-8 py-3 bg-wedding-gold text-white rounded-xl font-arabic text-base hover:bg-wedding-gold-dark transition-colors"
            >
              دخول
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  // ─── Closed ───
  if (state === "closed" || isClosed) {
    return (
      <Shell>
        <div className="animate-fade-in text-center space-y-6">
          <WeddingHeader />
          <div className="space-y-3 py-8">
            <p className="font-arabic text-xl text-wedding-charcoal/80">
              تم إغلاق استقبال الصور
            </p>
            <p className="text-sm text-wedding-taupe font-body">
              Photo uploads have been closed
            </p>
            <p className="font-arabic text-base text-wedding-gold mt-4">
              شكراً لمشاركتكم فرحتنا
            </p>
            <p className="text-sm text-wedding-taupe font-body">
              Thank you for sharing our joy
            </p>
          </div>
        </div>
      </Shell>
    );
  }

  // ─── Success ───
  if (state === "success") {
    return (
      <Shell>
        <div className="animate-fade-in text-center space-y-6">
          <WeddingHeader />
          <div className="space-y-4 py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-wedding-gold/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-wedding-gold"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="font-arabic text-xl text-wedding-charcoal">
              تم رفع الصور بنجاح
            </p>
            <p className="text-sm text-wedding-taupe font-body">
              Your photos have been uploaded successfully
            </p>
            <p className="font-arabic text-base text-wedding-gold">
              جزاكم الله خيراً على مشاركتنا هذه اللحظات
            </p>
            <p className="text-sm text-wedding-taupe font-body">
              Thank you for sharing these moments with us
            </p>
            <button
              onClick={resetUpload}
              className="mt-6 px-6 py-2.5 border border-wedding-gold text-wedding-gold rounded-xl font-arabic text-sm hover:bg-wedding-gold/5 transition-colors"
            >
              رفع المزيد
              <span className="block text-xs text-wedding-taupe font-body mt-0.5">
                Upload more
              </span>
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  // ─── Error ───
  if (state === "error") {
    return (
      <Shell>
        <div className="animate-fade-in text-center space-y-6">
          <WeddingHeader />
          <div className="space-y-4 py-8">
            <p className="font-arabic text-lg text-red-500">
              حدث خطأ أثناء الرفع
            </p>
            <p className="text-sm text-wedding-taupe font-body">{errorMsg}</p>
            <button
              onClick={resetUpload}
              className="mt-4 px-6 py-2.5 bg-wedding-gold text-white rounded-xl font-arabic text-sm hover:bg-wedding-gold-dark transition-colors"
            >
              حاول مرة أخرى
              <span className="block text-xs text-white/80 font-body mt-0.5">
                Try again
              </span>
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  // ─── Uploading ───
  if (state === "uploading") {
    return (
      <Shell>
        <div className="animate-fade-in text-center space-y-6">
          <WeddingHeader />
          <div className="space-y-4 py-8">
            <p className="font-arabic text-lg text-wedding-charcoal">
              جاري رفع الصور...
            </p>
            <p className="text-sm text-wedding-taupe font-body">
              Uploading your photos...
            </p>
            <div className="w-full max-w-[280px] mx-auto progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-wedding-gold font-body">
              {uploadProgress}%
            </p>
          </div>
        </div>
      </Shell>
    );
  }

  // ─── Ready (Main Upload Form) ───
  return (
    <Shell>
      <div className="animate-fade-in space-y-6">
        <WeddingHeader />

        {/* Privacy Notice */}
        <div className="bg-wedding-gold/5 border border-wedding-gold-light rounded-2xl p-4 space-y-2">
          <p className="font-arabic text-sm text-wedding-charcoal/80 leading-relaxed">
            ⚠️ نرجو عدم رفع صور النساء إلا بإذن صريح منهن
          </p>
          <p className="text-xs text-wedding-taupe font-body leading-relaxed">
            Please do not upload photos of women without their explicit
            permission
          </p>
          <div className="ornament my-2">✦</div>
          <p className="font-arabic text-sm text-wedding-charcoal/80 leading-relaxed">
            يُرجى عدم مشاركة هذا الرابط مع أي شخص خارج الحفل
          </p>
          <p className="text-xs text-wedding-taupe font-body leading-relaxed">
            Please do not share this link with anyone outside the event
          </p>
        </div>

        {/* Guest Name (Optional) */}
        <div className="space-y-1.5">
          <label className="block font-arabic text-sm text-wedding-charcoal/70">
            اسمك (اختياري)
            <span className="text-xs text-wedding-taupe font-body mr-2">
              Your name (optional)
            </span>
          </label>
          <input
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="ضيف كريم"
            className="w-full py-2.5 px-4 bg-white/60 border border-wedding-gold-light/50 rounded-xl focus:outline-none focus:border-wedding-gold text-sm font-arabic"
          />
        </div>

        {/* Drop Zone */}
        <div
          className={`drop-zone p-6 text-center cursor-pointer ${
            dragActive ? "active" : ""
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/heic,image/heif,image/webp,video/mp4,video/quicktime,video/webm,video/3gpp"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
          />
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-wedding-gold/10 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-wedding-gold"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
            </div>
            <div>
              <p className="font-arabic text-base text-wedding-charcoal/80">
                اضغط لاختيار الصور أو اسحبها هنا
              </p>
              <p className="text-xs text-wedding-taupe font-body mt-1">
                Tap to select photos or drag & drop
              </p>
              <p className="text-xs text-wedding-taupe/60 font-body mt-2">
                صور وفيديو • حتى 10 ملفات • حد أقصى 50 ميغا للملف
              </p>
              <p className="text-xs text-wedding-taupe/60 font-body">
                Photos & videos • Up to 10 files • Max 50MB each
              </p>
            </div>
          </div>
        </div>

        {/* Selected Files */}
        {files.length > 0 && (
          <div className="space-y-2">
            <p className="font-arabic text-sm text-wedding-charcoal/70">
              الملفات المختارة ({files.length})
            </p>
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
              {files.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {file.type.startsWith("image/") ? (
                      <svg
                        className="w-4 h-4 text-wedding-gold shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4 text-wedding-gold shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
                        />
                      </svg>
                    )}
                    <span className="text-xs text-wedding-charcoal/70 truncate font-body">
                      {file.name}
                    </span>
                    <span className="text-xs text-wedding-taupe/50 font-body shrink-0">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(i);
                    }}
                    className="mr-2 text-wedding-taupe/40 hover:text-red-400 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Consent */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 w-4 h-4 accent-wedding-gold rounded"
          />
          <div>
            <p className="font-arabic text-sm text-wedding-charcoal/80 leading-relaxed">
              أقر بأن الصور المرفوعة لا تحتوي على ما يخالف خصوصية الحضور، وأوافق
              على رفعها للعروسين فقط
            </p>
            <p className="text-xs text-wedding-taupe font-body leading-relaxed mt-0.5">
              I confirm these photos respect guests' privacy and consent to
              sharing them with the couple only
            </p>
          </div>
        </label>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={files.length === 0 || !consent}
          className="w-full py-3.5 rounded-xl font-arabic text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-wedding-gold text-white hover:bg-wedding-gold-dark active:scale-[0.98]"
        >
          رفع الصور
          <span className="block text-xs text-white/80 font-body mt-0.5">
            Upload Photos
          </span>
        </button>
      </div>
    </Shell>
  );
}

// ─── Shared Components ───

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-wedding-cream flex items-start justify-center px-4 py-8">
      <div className="w-full max-w-[420px]">{children}</div>
    </main>
  );
}

function WeddingHeader() {
  return (
    <div className="text-center space-y-3 pt-4 pb-2">
      <div className="ornament">✦ ✦ ✦</div>
      <h1 className="font-arabic text-3xl text-wedding-charcoal font-bold leading-snug">
        وعد & محمد
      </h1>
      <p
        className="font-display text-lg text-wedding-taupe italic"
        dir="ltr"
      >
        Waad & Mohammed
      </p>
      <div className="ornament">✦</div>
      <div className="space-y-1">
        <p className="font-arabic text-base text-wedding-charcoal/70">
          شاركونا لحظات الفرح
        </p>
        <p className="text-sm text-wedding-taupe font-body">
          Share your joyful moments with us
        </p>
      </div>
    </div>
  );
}
