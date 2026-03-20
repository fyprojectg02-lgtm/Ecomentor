import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const res = await fetch(`${process.env.CARBON_API_URL}/calculate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err.error || "Calculation failed" }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Could not connect to calculator service" }, { status: 503 });
  }
}
