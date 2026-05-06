import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing file id" }, { status: 400 });

  const admin = getAdmin();
  const { data: file } = await admin
    .from("user_files")
    .select("storage_path, filename")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });

  const { data: signed, error } = await admin.storage
    .from("user-files")
    .createSignedUrl(file.storage_path, 3600);

  if (error || !signed) {
    return NextResponse.json({ error: "Could not generate URL" }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl, filename: file.filename });
}
