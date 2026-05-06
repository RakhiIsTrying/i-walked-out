import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/supabase/admin";

/* ──────────────────────────────────────────
   Supabase setup (run once in dashboard):

   -- 1. Create storage bucket
   INSERT INTO storage.buckets (id, name, public)
   VALUES ('user-files', 'user-files', false);

   -- 2. RLS policies for storage
   CREATE POLICY "Users can upload own files"
     ON storage.objects FOR INSERT
     WITH CHECK (bucket_id = 'user-files' AND (storage.foldername(name))[1] = auth.uid()::text);

   CREATE POLICY "Users can read own files"
     ON storage.objects FOR SELECT
     USING (bucket_id = 'user-files' AND (storage.foldername(name))[1] = auth.uid()::text);

   CREATE POLICY "Users can delete own files"
     ON storage.objects FOR DELETE
     USING (bucket_id = 'user-files' AND (storage.foldername(name))[1] = auth.uid()::text);

   -- 3. Metadata table
   CREATE TABLE user_files (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
     filename TEXT NOT NULL,
     file_type TEXT,
     file_size BIGINT,
     storage_path TEXT NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ALTER TABLE user_files ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Users can read own files" ON user_files
     FOR SELECT USING (auth.uid() = user_id);
   CREATE POLICY "Users can insert own files" ON user_files
     FOR INSERT WITH CHECK (auth.uid() = user_id);
   CREATE POLICY "Users can delete own files" ON user_files
     FOR DELETE USING (auth.uid() = user_id);
   ────────────────────────────────────────── */

const BUCKET = "user-files";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function ensureBucket() {
  const admin = getAdmin();
  const { data } = await admin.storage.getBucket(BUCKET);
  if (!data) {
    await admin.storage.createBucket(BUCKET, { public: false });
  }
}

// GET — list user's files
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getAdmin();
  const { data, error } = await admin
    .from("user_files")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST — upload a file
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large (max 50 MB)" }, { status: 400 });
  }

  await ensureBucket();

  const admin = getAdmin();
  const ext = file.name.split(".").pop() || "bin";
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${user.id}/${Date.now()}_${safeName}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: row, error: dbError } = await admin
    .from("user_files")
    .insert({
      user_id: user.id,
      filename: file.name,
      file_type: file.type || "application/octet-stream",
      file_size: file.size,
      storage_path: storagePath,
    })
    .select()
    .single();

  if (dbError) {
    await admin.storage.from(BUCKET).remove([storagePath]);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(row, { status: 201 });
}

// DELETE — delete a file
export async function DELETE(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing file id" }, { status: 400 });

  const admin = getAdmin();
  const { data: file } = await admin
    .from("user_files")
    .select("storage_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });

  await admin.storage.from(BUCKET).remove([file.storage_path]);
  await admin.from("user_files").delete().eq("id", id).eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
