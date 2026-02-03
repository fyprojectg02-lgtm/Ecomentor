import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function middleware(req) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: req.headers.get("Authorization") } } }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user && req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}
