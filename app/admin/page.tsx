"use client";

import { useState, useEffect, useCallback } from "react";

interface UploadFile {
  id: string;
  storage_path: string;
  original_name: string;
  file_type: string;
  file_size: number;
  guest_name: string;
  created_at: string;
  reviewed: boolean;
  preview_url: string | null;
}

type View = "login" | "dashboard";
type Filter = "all" | "images" | "videos" | "reviewed" | "unreviewed";

export default function AdminPage() {
  const [view, setView] = useState<View>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [files, setFiles] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadsOpen, setUploadsOpen] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [previewFile, setPreviewFile] = useState<UploadFile | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Check existing session on mount
  useEffect(() => {
    fetch("/api/admin")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) setView("dashboard");
      })
      .catch(() => {});
  }, []);

  // Load files when dashboard is shown
  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/files");
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error("Failed to load files:", err);
    }
    setLoading(false);
  }, []);

  const loadUploadStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/toggle-uploads");
      if (res.ok) {
        const data = await res.json();
        setUploadsOpen(data.open);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (view === "dashboard") {
      loadFiles();
      loadUploadStatus();
    }
  }, [view, loadFiles, loadUploadStatus]);

  // Login
  const handleLogin = async () => {
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        setView("dashboard");
      } else {
        setLoginError("اسم المستخدم أو كلمة المرور غير صحيحة");
      }
    } catch {
      setLoginError("خطأ في الاتصال");
    }
    setLoginLoading(false);
  };

  // Logout
  const handleLogout = async () => {
    await fetch("/api/admin", { method: "DELETE" });
    setView("login");
    setFiles([]);
  };

  // Toggle uploads
  const toggleUploads = async () => {
    setActionLoading(true);
    const newState = !uploadsOpen;
    await fetch("/api/toggle-uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ open: newState }),
    });
    setUploadsOpen(newState);
    setActionLoading(false);
  };

  // Delete files
  const deleteFiles = async (ids: string[], paths: string[]) => {
    if (!confirm(`هل أنت متأكد من حذف ${ids.length} ملف(ات)؟`)) return;
    setActionLoading(true);
    await fetch("/api/delete-file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, storagePaths: paths }),
    });
    setSelected(new Set());
    await loadFiles();
    setActionLoading(false);
  };

  // Toggle reviewed
  const toggleReviewed = async (file: UploadFile) => {
    await fetch("/api/admin/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: file.id, reviewed: !file.reviewed }),
    });
    setFiles((prev) =>
      prev.map((f) =>
        f.id === file.id ? { ...f, reviewed: !f.reviewed } : f
      )
    );
  };

  // Filter files
  const filteredFiles = files.filter((f) => {
    if (filter === "images") return f.file_type.startsWith("image/");
    if (filter === "videos") return f.file_type.startsWith("video/");
    if (filter === "reviewed") return f.reviewed;
    if (filter === "unreviewed") return !f.reviewed;
    return true;
  });

  // Selection helpers
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filteredFiles.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredFiles.map((f) => f.id)));
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ar-SA", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ─── Login View ───
  if (view === "login") {
    return (
      <div className="min-h-screen bg-wedding-cream flex items-center justify-center px-4">
        <div className="w-full max-w-[360px] space-y-6">
          <div className="text-center space-y-2">
            <h1 className="font-arabic text-2xl text-wedding-charcoal">
              لوحة التحكم
            </h1>
            <p className="text-sm text-wedding-taupe font-body">
              Admin Dashboard
            </p>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="اسم المستخدم"
              className="w-full py-3 px-4 bg-white border border-wedding-gold-light rounded-xl focus:outline-none focus:border-wedding-gold font-body text-sm"
              dir="ltr"
              autoComplete="username"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="كلمة المرور"
              className="w-full py-3 px-4 bg-white border border-wedding-gold-light rounded-xl focus:outline-none focus:border-wedding-gold font-body text-sm"
              dir="ltr"
              autoComplete="current-password"
            />
            {loginError && (
              <p className="text-red-500 text-sm font-arabic text-center">
                {loginError}
              </p>
            )}
            <button
              onClick={handleLogin}
              disabled={loginLoading}
              className="w-full py-3 bg-wedding-charcoal text-white rounded-xl font-arabic text-sm hover:bg-wedding-charcoal/90 transition-colors disabled:opacity-50"
            >
              {loginLoading ? "جاري الدخول..." : "دخول"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Dashboard View ───
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-arabic text-lg text-wedding-charcoal font-bold">
              لوحة التحكم
            </h1>
            <span className="text-xs text-wedding-taupe font-body">
              وعد & محمد
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Upload Toggle */}
            <button
              onClick={toggleUploads}
              disabled={actionLoading}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-body transition-colors ${
                uploadsOpen
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  uploadsOpen ? "bg-green-500" : "bg-red-500"
                }`}
              />
              {uploadsOpen ? "الرفع مفتوح" : "الرفع مغلق"}
            </button>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-500 hover:text-gray-700 font-body"
            >
              خروج
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard
            label="إجمالي الملفات"
            value={files.length}
            sub="Total files"
          />
          <StatCard
            label="الصور"
            value={files.filter((f) => f.file_type.startsWith("image/")).length}
            sub="Photos"
          />
          <StatCard
            label="الفيديوهات"
            value={files.filter((f) => f.file_type.startsWith("video/")).length}
            sub="Videos"
          />
          <StatCard
            label="الحجم الإجمالي"
            value={formatSize(files.reduce((s, f) => s + f.file_size, 0))}
            sub="Total size"
          />
        </div>

        {/* Actions Bar */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {/* Filters */}
          {(
            [
              ["all", "الكل"],
              ["images", "صور"],
              ["videos", "فيديو"],
              ["reviewed", "تمت المراجعة"],
              ["unreviewed", "لم تراجع"],
            ] as [Filter, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-arabic transition-colors ${
                filter === key
                  ? "bg-wedding-charcoal text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
              }`}
            >
              {label}
            </button>
          ))}

          <div className="flex-1" />

          {/* Bulk actions */}
          {selected.size > 0 && (
            <button
              onClick={() => {
                const selectedFiles = files.filter((f) => selected.has(f.id));
                deleteFiles(
                  selectedFiles.map((f) => f.id),
                  selectedFiles.map((f) => f.storage_path)
                );
              }}
              className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-arabic hover:bg-red-100"
            >
              حذف المحدد ({selected.size})
            </button>
          )}

          <button
            onClick={selectAll}
            className="px-3 py-1.5 bg-white text-gray-600 border border-gray-200 rounded-lg text-xs font-arabic hover:border-gray-300"
          >
            {selected.size === filteredFiles.length ? "إلغاء التحديد" : "تحديد الكل"}
          </button>

          <a
            href="/api/download-all"
            className="px-3 py-1.5 bg-wedding-gold text-white rounded-lg text-xs font-arabic hover:bg-wedding-gold-dark transition-colors inline-flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            تحميل الكل ZIP
          </a>

          <button
            onClick={loadFiles}
            disabled={loading}
            className="px-3 py-1.5 bg-white text-gray-600 border border-gray-200 rounded-lg text-xs font-arabic hover:border-gray-300"
          >
            {loading ? "..." : "تحديث"}
          </button>
        </div>

        {/* Files Grid */}
        {loading && files.length === 0 ? (
          <div className="text-center py-20 text-gray-400 font-arabic">
            جاري التحميل...
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-20 text-gray-400 font-arabic">
            لا توجد ملفات
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredFiles.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                isSelected={selected.has(file.id)}
                onSelect={() => toggleSelect(file.id)}
                onPreview={() => setPreviewFile(file)}
                onDelete={() =>
                  deleteFiles([file.id], [file.storage_path])
                }
                onToggleReviewed={() => toggleReviewed(file)}
                formatSize={formatSize}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </main>

      {/* Preview Modal */}
      {previewFile && (
        <PreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          formatSize={formatSize}
          formatDate={formatDate}
        />
      )}
    </div>
  );
}

// ─── Sub-Components ───

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <p className="font-arabic text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-wedding-charcoal mt-1 font-body">
        {value}
      </p>
      <p className="text-xs text-gray-400 font-body">{sub}</p>
    </div>
  );
}

function FileCard({
  file,
  isSelected,
  onSelect,
  onPreview,
  onDelete,
  onToggleReviewed,
  formatSize,
  formatDate,
}: {
  file: UploadFile;
  isSelected: boolean;
  onSelect: () => void;
  onPreview: () => void;
  onDelete: () => void;
  onToggleReviewed: () => void;
  formatSize: (n: number) => string;
  formatDate: (s: string) => string;
}) {
  const isImage = file.file_type.startsWith("image/");
  const isVideo = file.file_type.startsWith("video/");

  return (
    <div
      className={`bg-white rounded-xl border overflow-hidden group relative transition-all ${
        isSelected ? "border-wedding-gold ring-2 ring-wedding-gold/20" : "border-gray-100"
      }`}
    >
      {/* Selection checkbox */}
      <button
        onClick={onSelect}
        className="absolute top-2 right-2 z-10 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors bg-white/80 backdrop-blur-sm"
        style={{
          borderColor: isSelected ? "#C9A96E" : "#d1d5db",
          backgroundColor: isSelected ? "#C9A96E" : "rgba(255,255,255,0.8)",
        }}
      >
        {isSelected && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Reviewed badge */}
      {file.reviewed && (
        <span className="absolute top-2 left-2 z-10 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </span>
      )}

      {/* Thumbnail / Preview Area */}
      <div
        className="aspect-square bg-gray-50 relative cursor-pointer overflow-hidden"
        onClick={onPreview}
      >
        {isImage && file.preview_url ? (
          <img
            src={file.preview_url}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : isVideo ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </div>
      </div>

      {/* File Info */}
      <div className="p-2.5 space-y-1">
        <p className="text-xs text-gray-800 font-arabic truncate">
          {file.guest_name || "ضيف كريم"}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 font-body">
            {formatSize(file.file_size)}
          </span>
          <span className="text-xs text-gray-400 font-body" dir="ltr">
            {formatDate(file.created_at)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 pt-1">
          {file.preview_url && (
            <a
              href={file.preview_url}
              download={file.original_name}
              className="flex-1 text-center py-1 text-xs text-wedding-gold hover:bg-wedding-gold/5 rounded transition-colors font-arabic"
              onClick={(e) => e.stopPropagation()}
            >
              تحميل
            </a>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleReviewed();
            }}
            className={`flex-1 text-center py-1 text-xs rounded transition-colors font-arabic ${
              file.reviewed
                ? "text-green-600 hover:bg-green-50"
                : "text-gray-400 hover:bg-gray-50"
            }`}
          >
            {file.reviewed ? "تمت ✓" : "مراجعة"}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="flex-1 text-center py-1 text-xs text-red-400 hover:bg-red-50 rounded transition-colors font-arabic"
          >
            حذف
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewModal({
  file,
  onClose,
  formatSize,
  formatDate,
}: {
  file: UploadFile;
  onClose: () => void;
  formatSize: (n: number) => string;
  formatDate: (s: string) => string;
}) {
  const isImage = file.file_type.startsWith("image/");
  const isVideo = file.file_type.startsWith("video/");

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Preview content */}
        <div className="bg-gray-100 flex items-center justify-center min-h-[300px] max-h-[60vh] overflow-hidden">
          {isImage && file.preview_url ? (
            <img
              src={file.preview_url}
              alt=""
              className="max-w-full max-h-[60vh] object-contain"
            />
          ) : isVideo && file.preview_url ? (
            <video
              src={file.preview_url}
              controls
              className="max-w-full max-h-[60vh]"
            />
          ) : (
            <p className="text-gray-400 font-arabic">معاينة غير متاحة</p>
          )}
        </div>

        {/* Info */}
        <div className="p-4 space-y-2" dir="rtl">
          <div className="flex items-center justify-between">
            <p className="font-arabic text-sm text-gray-800">
              {file.guest_name || "ضيف كريم"}
            </p>
            <p className="text-xs text-gray-400 font-body" dir="ltr">
              {formatDate(file.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500 font-body">
            <span>{file.original_name}</span>
            <span>{formatSize(file.file_size)}</span>
            <span>{file.file_type}</span>
          </div>
          <div className="flex items-center gap-2 pt-2">
            {file.preview_url && (
              <a
                href={file.preview_url}
                download={file.original_name}
                className="px-4 py-2 bg-wedding-gold text-white rounded-lg text-xs font-arabic hover:bg-wedding-gold-dark transition-colors"
              >
                تحميل الملف
              </a>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-arabic hover:bg-gray-200 transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
