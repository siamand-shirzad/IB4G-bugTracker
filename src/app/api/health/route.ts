import { NextResponse } from "next/server"

// Stable healthcheck target for Docker / load balancers.
// Deliberately does not touch the database — "process is up" is the signal we want.
export async function GET() {
  return NextResponse.json({ ok: true })
}
