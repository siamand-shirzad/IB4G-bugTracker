/**
 * Copies static assets into the Next.js standalone output so the server in
 * .next/standalone can serve them. Replacement for the bash `cp -r` that used
 * to live in the build script (which fails on Windows).
 *
 * Run automatically as part of `bun run build`.
 */
import { cp, mkdir } from "node:fs/promises"
import { join } from "node:path"

const root = join(import.meta.dir, "..")
const standalone = join(root, ".next", "standalone")

await mkdir(join(standalone, ".next"), { recursive: true })
await cp(join(root, ".next", "static"), join(standalone, ".next", "static"), {
  recursive: true,
})
await cp(join(root, "public"), join(standalone, "public"), { recursive: true })

console.log("[copy-standalone] static + public copied into .next/standalone")
