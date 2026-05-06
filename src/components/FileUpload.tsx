"use client";

import { useState, useEffect, useRef } from "react";

interface UserFile {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  created_at: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(type: string): string {
  if (type.startsWith("image/")) return "\u{1F5BC}";
  if (type === "application/pdf") return "\u{1F4C4}";
  if (type.startsWith("video/")) return "\u{1F3AC}";
  if (type.startsWith("audio/")) return "\u{1F3B5}";
  if (type.includes("spreadsheet") || type.includes("csv")) return "\u{1F4CA}";
  if (type.includes("zip") || type.includes("compress")) return "\u{1F4E6}";
  return "\u{1F4CE}";
}

export default function FileUpload() {
  const [files, setFiles] = useState<UserFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  async function loadFiles() {
    const res = await fetch("/api/files");
    if (res.ok) {
      setFiles(await res.json());
    }
    setLoading(false);
  }

  async function upload(file: File) {
    setUploading(true);
    setError("");

    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/files", { method: "POST", body: form });
    if (res.ok) {
      await loadFiles();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Upload failed");
    }
    setUploading(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = "";
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/files?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setFiles((prev) => prev.filter((f) => f.id !== id));
    }
  }

  async function handleDownload(id: string) {
    const res = await fetch(`/api/files/download?id=${id}`);
    if (res.ok) {
      const { url, filename } = await res.json();
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.target = "_blank";
      a.click();
    }
  }

  return (
    <section
      className="paper"
      style={{ borderRadius: 3, padding: "28px 24px", marginBottom: 48, position: "relative" }}
    >
      <div className="tape tape-rose" style={{ top: -10, left: 28, transform: "rotate(-5deg)" }} />

      <p
        className="typewriter"
        style={{
          fontSize: 11,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "var(--ink-faded)",
          marginBottom: 6,
        }}
      >
        Your Files
      </p>
      <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6, marginBottom: 16 }}>
        Upload images, PDFs, or any file. Private to you.
      </p>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? "var(--teal)" : "var(--ink-faded)"}`,
          borderRadius: 3,
          padding: "28px 20px",
          textAlign: "center",
          cursor: "pointer",
          background: dragOver ? "rgba(42, 95, 214, 0.06)" : "transparent",
          transition: "all 0.2s",
          marginBottom: 20,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
        {uploading ? (
          <p className="typewriter" style={{ fontSize: 12, color: "var(--teal)", letterSpacing: "0.1em" }}>
            uploading...
          </p>
        ) : (
          <>
            <p className="hand" style={{ fontSize: 20, color: "var(--ink-soft)", marginBottom: 4 }}>
              drop a file here or click to browse
            </p>
            <p className="typewriter" style={{ fontSize: 10, color: "var(--ink-faded)", letterSpacing: "0.08em" }}>
              max 50 MB
            </p>
          </>
        )}
      </div>

      {error && (
        <p className="typewriter" style={{ fontSize: 11, color: "var(--rose)", marginBottom: 12, letterSpacing: "0.08em" }}>
          {error}
        </p>
      )}

      {/* File list */}
      {loading ? (
        <p className="typewriter" style={{ fontSize: 11, color: "var(--ink-faded)", letterSpacing: "0.1em", textAlign: "center" }}>
          loading files...
        </p>
      ) : files.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {files.map((f) => (
            <div
              key={f.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                background: "var(--paper-deep)",
                borderRadius: 2,
                border: "1px solid var(--ink-faded)",
              }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>{fileIcon(f.file_type)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  className="typewriter"
                  style={{
                    fontSize: 12,
                    letterSpacing: "0.04em",
                    color: "var(--ink)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {f.filename}
                </p>
                <p className="typewriter" style={{ fontSize: 9, color: "var(--ink-faded)", letterSpacing: "0.06em", marginTop: 2 }}>
                  {formatSize(f.file_size)} &middot; {new Date(f.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleDownload(f.id)}
                className="btn-ghost"
                style={{ fontSize: 11, padding: "4px 10px", flexShrink: 0 }}
              >
                download
              </button>
              <button
                onClick={() => handleDelete(f.id)}
                className="btn-ghost"
                style={{ fontSize: 11, padding: "4px 10px", flexShrink: 0, color: "var(--rose)", borderColor: "var(--rose)" }}
              >
                delete
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
