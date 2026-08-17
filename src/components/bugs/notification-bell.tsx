"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import {
  Bell,
  Bug as BugIcon,
  CheckCheck,
  MessageSquare,
  Pencil,
  Plus,
  Tags,
  Trash2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useNotificationStore, type AppNotification } from "@/store/notification-store"
import { useBugStore } from "@/store/bug-store"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

const NOTIF_META: Record<
  AppNotification["type"],
  { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  bug_created: { icon: Plus, color: "text-stone-500 dark:text-stone-400", bg: "bg-stone-400" },
  bug_updated: { icon: Pencil, color: "text-stone-500 dark:text-stone-400", bg: "bg-stone-500" },
  bug_closed: { icon: CheckCheck, color: "text-stone-500 dark:text-stone-400", bg: "bg-stone-400" },
  comment_added: { icon: MessageSquare, color: "text-stone-500 dark:text-stone-400", bg: "bg-stone-500" },
  bulk_action: { icon: Tags, color: "text-stone-500 dark:text-stone-400", bg: "bg-stone-400" },
}

export function NotificationBell() {
  const { notifications, unreadCount, markAllRead, markRead, removeNotification, clearAll } =
    useNotificationStore()
  const selectBug = useBugStore((s) => s.selectBug)
  const setView = useBugStore((s) => s.setView)
  const [open, setOpen] = React.useState(false)

  // Auto-mark all as read after the panel is open for 2.5 seconds
  React.useEffect(() => {
    if (!open || unreadCount === 0) return
    const t = setTimeout(() => {
      markAllRead()
    }, 2500)
    return () => clearTimeout(t)
  }, [open, unreadCount, markAllRead])

  const handleClick = (notif: AppNotification) => {
    markRead(notif.id)
    if (notif.bugId) {
      setView("bugs")
      selectBug(notif.bugId)
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative h-9 w-9 flex items-center justify-center rounded-md text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground transition-colors"
          title="Notifications"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        >
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-400 text-white text-[9px] font-bold tabular-nums pulse-dot">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Notifications
            </span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-accent"
                title="Mark all as read"
              >
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="text-[10px] text-muted-foreground hover:text-destructive px-1.5 py-0.5 rounded hover:bg-accent"
                title="Clear all"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* List */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Bell className="h-8 w-8 text-muted-foreground opacity-40 mb-2" />
            <p className="text-xs font-medium text-muted-foreground">No notifications</p>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">
              Actions like creating, updating, or commenting on bugs will appear here.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[360px] scrollbar-thin">
            <div className="divide-y">
              {notifications.map((notif) => {
                const meta = NOTIF_META[notif.type] ?? NOTIF_META.bug_updated
                const Icon = meta.icon
                return (
                  <div
                    key={notif.id}
                    className={cn(
                      "group relative flex items-start gap-2.5 px-3 py-2.5 hover:bg-accent/50 transition-colors cursor-pointer",
                      !notif.read && "bg-primary/5",
                    )}
                    onClick={() => handleClick(notif)}
                  >
                    {/* Unread indicator */}
                    {!notif.read && (
                      <span className="absolute left-1 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-red-400 pulse-dot" />
                    )}
                    <div className={cn("h-7 w-7 rounded-full flex items-center justify-center shrink-0 ml-1", meta.bg + "/10")}>
                      <Icon className={cn("h-3.5 w-3.5", meta.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium leading-snug">{notif.title}</p>
                      <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">
                        {notif.description}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                    {/* Hover delete */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeNotification(notif.id)
                      }}
                      className="absolute top-1 right-1 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-accent"
                      title="Dismiss"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  )
}
