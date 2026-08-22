"use client"

import * as React from "react"
import {
  Bold,
  Code,
  Code2,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  MessageSquare,
  Quote,
  Send,
  Trash2,
  Pencil,
  X,
  Check,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  useBugComments,
  useCreateComment,
  useDeleteComment,
  useUpdateComment,
} from "@/hooks/use-bugs"
import type { BugComment } from "@/lib/types"
import { Markdown } from "@/components/bugs/markdown"
import { format, formatDistanceToNow, isToday } from "date-fns"
import { cn } from "@/lib/utils"

const AVATAR_COLORS = [
  "bg-red-400",
  "bg-stone-400",
  "bg-stone-500",
  "bg-stone-400",
  "bg-stone-400",
  "bg-stone-400",
  "bg-stone-400",
  "bg-stone-400",
]

function avatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function CommentsSection({ bugId }: { bugId: string }) {
  const { data, isLoading } = useBugComments(bugId)
  const createMut = useCreateComment(bugId)

  const [body, setBody] = React.useState("")
  const [author, setAuthor] = React.useState("")
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const comments = data?.data ?? []

  // Markdown formatting helper — wraps/inserts syntax around the selection
  const formatMarkdown = (type: "bold" | "italic" | "code" | "codeblock" | "link" | "ul" | "ol" | "quote") => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = body.slice(start, end)
    const before = body.slice(0, start)
    const after = body.slice(end)
    let wrapped = selected
    let cursorOffset = 0
    let cursorEnd = 0
    switch (type) {
      case "bold":
        wrapped = `**${selected || "bold text"}**`
        cursorOffset = 2; cursorEnd = wrapped.length - 2
        break
      case "italic":
        wrapped = `*${selected || "italic text"}*`
        cursorOffset = 1; cursorEnd = wrapped.length - 1
        break
      case "code":
        wrapped = `\`${selected || "code"}\``
        cursorOffset = 1; cursorEnd = wrapped.length - 1
        break
      case "codeblock":
        wrapped = `\n\`\`\`\n${selected || "code block"}\n\`\`\`\n`
        cursorOffset = 5; cursorEnd = wrapped.length - 5
        break
      case "link":
        wrapped = `[${selected || "link text"}](https://)`
        cursorOffset = 0; cursorEnd = wrapped.length - 9
        break
      case "ul":
        wrapped = selected
          ? selected.split("\n").map((l) => `- ${l}`).join("\n")
          : "- list item"
        cursorOffset = 0; cursorEnd = wrapped.length
        break
      case "ol":
        wrapped = selected
          ? selected.split("\n").map((l, i) => `${i + 1}. ${l}`).join("\n")
          : "1. list item"
        cursorOffset = 0; cursorEnd = wrapped.length
        break
      case "quote":
        wrapped = selected
          ? selected.split("\n").map((l) => `> ${l}`).join("\n")
          : "> quote"
        cursorOffset = 0; cursorEnd = wrapped.length
        break
    }
    const next = before + wrapped + after
    setBody(next)
    requestAnimationFrame(() => {
      ta.focus()
      const selStart = start + cursorOffset
      const selEnd = start + cursorEnd
      ta.setSelectionRange(selStart, Math.max(selStart, selEnd))
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return
    createMut.mutate(
      { body: body.trim(), author: author.trim() || undefined },
      {
        onSuccess: () => {
          setBody("")
        },
      },
    )
  }

  return (
    <Card className="no-print">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              Discussion
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {comments.length === 0
                ? "No comments yet — start the discussion"
                : `${comments.length} comment${comments.length === 1 ? "" : "s"}`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Comment list */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            <MessageSquare className="h-7 w-7 mx-auto opacity-40 mb-2" />
            <p className="font-medium">No comments yet</p>
            <p className="text-xs mt-0.5">Be the first to comment on this bug.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <CommentItem key={comment.id} bugId={bugId} comment={comment} />
            ))}
          </div>
        )}

        {/* New comment form */}
        <form onSubmit={handleSubmit} className="space-y-2 pt-3 border-t">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Your name (optional)"
                className="h-8 text-xs"
                maxLength={60}
              />
            </div>
          </div>
          {/* Markdown toolbar */}
          <div className="flex items-center gap-0.5 flex-wrap rounded-md border bg-muted/30 p-0.5">
            <MarkdownToolbarBtn onClick={() => formatMarkdown("bold")} title="Bold (⌘B)">
              <Bold className="h-3.5 w-3.5" />
            </MarkdownToolbarBtn>
            <MarkdownToolbarBtn onClick={() => formatMarkdown("italic")} title="Italic (⌘I)">
              <Italic className="h-3.5 w-3.5" />
            </MarkdownToolbarBtn>
            <span className="w-px h-4 bg-border mx-0.5" />
            <MarkdownToolbarBtn onClick={() => formatMarkdown("code")} title="Inline code">
              <Code className="h-3.5 w-3.5" />
            </MarkdownToolbarBtn>
            <MarkdownToolbarBtn onClick={() => formatMarkdown("codeblock")} title="Code block">
              <Code2 className="h-3.5 w-3.5" />
            </MarkdownToolbarBtn>
            <MarkdownToolbarBtn onClick={() => formatMarkdown("link")} title="Link">
              <LinkIcon className="h-3.5 w-3.5" />
            </MarkdownToolbarBtn>
            <MarkdownToolbarBtn onClick={() => formatMarkdown("quote")} title="Blockquote">
              <Quote className="h-3.5 w-3.5" />
            </MarkdownToolbarBtn>
            <span className="w-px h-4 bg-border mx-0.5" />
            <MarkdownToolbarBtn onClick={() => formatMarkdown("ul")} title="Bullet list">
              <List className="h-3.5 w-3.5" />
            </MarkdownToolbarBtn>
            <MarkdownToolbarBtn onClick={() => formatMarkdown("ol")} title="Numbered list">
              <ListOrdered className="h-3.5 w-3.5" />
            </MarkdownToolbarBtn>
            <span className="ml-auto text-[10px] text-muted-foreground pr-1.5 hidden sm:block">
              Markdown supported
            </span>
          </div>
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write a comment…"
              className="min-h-[72px] text-sm resize-y scrollbar-thin pr-24"
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault()
                  if (body.trim()) handleSubmit(e)
                } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
                  e.preventDefault()
                  formatMarkdown("bold")
                } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "i") {
                  e.preventDefault()
                  formatMarkdown("italic")
                }
              }}
            />
            <Button
              type="submit"
              size="sm"
              className="absolute bottom-2 right-2 h-7 gap-1.5 text-xs"
              disabled={!body.trim() || createMut.isPending}
            >
              {createMut.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Comment
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Press <kbd className="rounded border bg-muted px-1 py-0.5 font-mono">⌘+Enter</kbd> to send
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

function CommentItem({ bugId, comment }: { bugId: string; comment: BugComment }) {
  const deleteMut = useDeleteComment(bugId)
  const updateMut = useUpdateComment(bugId)
  const [editing, setEditing] = React.useState(false)
  const [editBody, setEditBody] = React.useState(comment.body)

  const handleSaveEdit = () => {
    if (!editBody.trim() || editBody === comment.body) {
      setEditing(false)
      setEditBody(comment.body)
      return
    }
    updateMut.mutate(
      { commentId: comment.id, body: editBody.trim() },
      { onSuccess: () => setEditing(false) },
    )
  }

  const handleCancelEdit = () => {
    setEditing(false)
    setEditBody(comment.body)
  }

  const isEdited = comment.updatedAt !== comment.createdAt

  return (
    <div className="flex items-start gap-3 group animate-fade-in">
      {/* Avatar */}
      <div
        className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center text-white text-[11px] font-semibold shrink-0",
          avatarColor(comment.author),
        )}
        title={comment.author}
      >
        {initials(comment.author)}
      </div>

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold">{comment.author}</span>
          <span className="text-[10px] text-muted-foreground">
            {isToday(new Date(comment.createdAt))
              ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })
              : format(new Date(comment.createdAt), "MMM d 'at' HH:mm")}
          </span>
          {isEdited && (
            <span className="text-[10px] text-muted-foreground italic">(edited)</span>
          )}
        </div>

        {/* Body / edit form */}
        {editing ? (
          <div className="space-y-2">
            <Textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              className="min-h-[72px] text-sm resize-y scrollbar-thin"
              autoFocus
            />
            <div className="flex items-center justify-end gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={handleCancelEdit}
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={handleSaveEdit}
                disabled={!editBody.trim() || updateMut.isPending}
              >
                {updateMut.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative rounded-lg bg-muted/50 border px-3 py-2 leading-relaxed break-words">
            <Markdown>{comment.body}</Markdown>
            {/* Hover actions */}
            <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setEditing(true)}
                className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                title="Edit comment"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-destructive"
                    title="Delete comment"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this comment?</AlertDialogTitle>
                    <AlertDialogDescription>
                      The comment will be permanently removed. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteMut.mutate(comment.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MarkdownToolbarBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
    >
      {children}
    </button>
  )
}
