"use client"

import * as React from "react"
import {
  Boxes,
  CheckCircle2,
  Clipboard,
  ClipboardCopy,
  Code2,
  Database,
  GitBranch,
  Hash,
  Info,
  Server,
  Settings,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useAppInfo } from "@/hooks/use-bugs"
import type { EndpointInfo } from "@/lib/types"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900",
  POST: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-900",
  PUT: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900",
  DELETE: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900",
}

export function InfoView() {
  const { data: info, isLoading } = useAppInfo()

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text)
    toast.success("Copied to clipboard")
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Endpoints</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Application metadata, API reference, and setup guide.
        </p>
      </div>

      {/* App info cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <InfoCard icon={Info} label="App Name" value={info?.name} loading={isLoading} />
        <InfoCard icon={Hash} label="Version" value={info?.version} loading={isLoading} mono />
        <InfoCard icon={Code2} label="Framework" value={info?.framework} loading={isLoading} />
        <InfoCard icon={Database} label="Database" value={info?.database} loading={isLoading} />
        <InfoCard icon={Boxes} label="ORM" value={info?.orm} loading={isLoading} />
        <InfoCard icon={GitBranch} label="Template" value={info?.template} loading={isLoading} />
      </div>

      {/* Endpoints table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Server className="h-4 w-4 text-muted-foreground" />
            API Endpoints
          </CardTitle>
          <CardDescription className="text-xs">
            {info?.endpoints.length ?? 0} routes available
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="border-y bg-muted/40">
                <tr>
                  <th className="text-left font-medium px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground w-[90px]">Method</th>
                  <th className="text-left font-medium px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground">Path</th>
                  <th className="text-left font-medium px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">Description</th>
                  <th className="w-[40px] px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="px-4 py-2.5"><Skeleton className="h-5 w-16" /></td>
                        <td className="px-4 py-2.5"><Skeleton className="h-5 w-40" /></td>
                        <td className="px-4 py-2.5 hidden md:table-cell"><Skeleton className="h-5 w-full max-w-xs" /></td>
                        <td className="px-4 py-2.5"><Skeleton className="h-5 w-5" /></td>
                      </tr>
                    ))
                  : (info?.endpoints ?? []).map((ep: EndpointInfo, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-accent/50 transition-colors group">
                        <td className="px-4 py-2.5">
                          <Badge variant="outline" className={cn("font-mono text-[10px] font-semibold", METHOD_COLORS[ep.method])}>
                            {ep.method}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5">
                          <code className="text-xs font-mono text-foreground">{ep.path}</code>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground hidden md:table-cell">
                          {ep.description}
                        </td>
                        <td className="px-4 py-2.5">
                          <button
                            onClick={() => copyToClipboard(ep.path)}
                            className="p-1 rounded hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Copy path"
                          >
                            <ClipboardCopy className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Env vars */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            Environment Variables
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {(info?.envVars ?? []).map((v) => (
              <div key={v.name} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3 min-w-0">
                  <code className="text-xs font-mono font-semibold">{v.name}</code>
                  <span className="text-xs text-muted-foreground truncate">{v.description}</span>
                </div>
                {v.required ? (
                  <Badge variant="outline" className="text-[10px] bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900">
                    Required
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px]">
                    Optional
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Setup guide */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            Database Setup Guide
          </CardTitle>
          <CardDescription className="text-xs">
            Get the project running locally in 5 steps.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <ol className="space-y-3">
            <Step
              n={1}
              title="Configure the database URL"
              body={
                <p className="text-xs text-muted-foreground">
                  This project ships with a SQLite database. The default{" "}
                  <code className="font-mono text-foreground bg-muted px-1 py-0.5 rounded">DATABASE_URL</code>{" "}
                  points to a local file — no external service required.
                </p>
              }
            />
            <Step
              n={2}
              title="Push the Prisma schema"
              body={
                <CodeBlock>bun run db:push</CodeBlock>
              }
            />
            <Step
              n={3}
              title="(Optional) Seed sample data"
              body={
                <CodeBlock>bun run scripts/seed.ts</CodeBlock>
              }
            />
            <Step
              n={4}
              title="Start the dev server"
              body={
                <CodeBlock>bun run dev</CodeBlock>
              }
            />
            <Step
              n={5}
              title="Open the app"
              body={
                <p className="text-xs text-muted-foreground">
                  Navigate to the <strong>Bug Reports</strong> view, click{" "}
                  <strong>New bug</strong>, paste an IB4G Jira template, and watch the
                  fields auto-parse.
                </p>
              }
            />
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}

function InfoCard({
  icon: Icon,
  label,
  value,
  loading,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value?: string
  loading?: boolean
  mono?: boolean
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            {label}
          </p>
        </div>
        {loading ? (
          <Skeleton className="h-5 w-24" />
        ) : (
          <p className={cn("text-sm font-medium truncate", mono && "font-mono")}>
            {value ?? "—"}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function Step({
  n,
  title,
  body,
}: {
  n: number
  title: string
  body: React.ReactNode
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold shrink-0">
        {n}
      </span>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-sm font-medium mb-1">{title}</p>
        <div>{body}</div>
      </div>
    </li>
  )
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 mt-1.5 p-2.5 rounded-md bg-muted/60 dark:bg-muted/30 border font-mono text-xs">
      <code className="text-foreground">
        <span className="text-muted-foreground">$ </span>
        {children}
      </code>
      <button
        onClick={() => {
          if (typeof children === "string") {
            navigator.clipboard?.writeText(children)
            toast.success("Copied")
          }
        }}
        className="p-1 rounded hover:bg-accent shrink-0"
        title="Copy"
      >
        <Clipboard className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    </div>
  )
}
