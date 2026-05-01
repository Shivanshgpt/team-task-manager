import { NextResponse } from "next/server";

export function ok(data, init) {
  return NextResponse.json(data, init);
}

export function err(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleZod(parsed) {
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    return err(msg, 422);
  }
  return null;
}

export async function safeRoute(fn) {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof Response) return e;
    console.error(e);
    return err(e?.message || "Server error", 500);
  }
}
