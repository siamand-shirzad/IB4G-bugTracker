"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import {
  Bell,
  Database,
  LayoutGrid,
  Moon,
  Palette,
  RotateCcw,
  Save,
  Settings as SettingsIcon,
  Sun,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useSettingsStore } from "@/store/settings-store"
import { useBugStore } from "@/store/bug-store"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function SettingsView() {
  const { theme, setTheme } = useTheme()
  const settings = useSettingsStore()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const handleSaveDefaults = () => {
    useBugStore.setState((s) => ({
      filters: { ...s.filters, pageSize: settings.defaultPageSize },
      groupBy: settings.defaultGroupBy,
    }))
    toast.success("Defaults applied to current session")
  }

  const handleReset = () => {
    settings.resetSettings()
    toast.success("Settings reset to defaults")
  }

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Customize your IB4G BugTracker experience. All preferences are saved locally.
        </p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            Appearance
          </CardTitle>
          <CardDescription className="text-xs">
            Choose how the app looks
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {/* Theme */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Theme</Label>
              <p className="text-xs text-muted-foreground">Switch between light and dark mode</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={mounted && theme === "light" ? "default" : "outline"}
                size="sm"
                className="gap-1.5 h-8"
                onClick={() => setTheme("light")}
              >
                <Sun className="h-3.5 w-3.5" />
                Light
              </Button>
              <Button
                variant={mounted && theme === "dark" ? "default" : "outline"}
                size="sm"
                className="gap-1.5 h-8"
                onClick={() => setTheme("dark")}
              >
                <Moon className="h-3.5 w-3.5" />
                Dark
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bug list defaults */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            Bug List Defaults
          </CardTitle>
          <CardDescription className="text-xs">
            Default settings applied when you open the bug list
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {/* Page size */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Page size</Label>
              <p className="text-xs text-muted-foreground">Number of bugs per page</p>
            </div>
            <Select
              value={String(settings.defaultPageSize)}
              onValueChange={(v) => settings.setDefaultPageSize(Number(v))}
            >
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50].map((n) => (
                  <SelectItem key={n} value={String(n)} className="text-xs">
                    {n} per page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Separator />
          {/* Default group-by */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Default grouping</Label>
              <p className="text-xs text-muted-foreground">How bugs are grouped by default</p>
            </div>
            <Select
              value={settings.defaultGroupBy}
              onValueChange={(v) => settings.setDefaultGroupBy(v as typeof settings.defaultGroupBy)}
            >
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-xs">No grouping</SelectItem>
                <SelectItem value="assignee" className="text-xs">By assignee</SelectItem>
                <SelectItem value="priority" className="text-xs">By priority</SelectItem>
                <SelectItem value="stage" className="text-xs">By stage</SelectItem>
                <SelectItem value="status" className="text-xs">By status</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          {/* Trend chart days */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Trend chart window</Label>
              <p className="text-xs text-muted-foreground">Default date range for dashboard charts</p>
            </div>
            <Select
              value={String(settings.defaultTrendDays)}
              onValueChange={(v) => settings.setDefaultTrendDays(Number(v) as 7 | 14 | 30 | 90)}
            >
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[7, 14, 30, 90].map((n) => (
                  <SelectItem key={n} value={String(n)} className="text-xs">
                    {n} days
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <Button size="sm" className="gap-1.5" onClick={handleSaveDefaults}>
            <Save className="h-3.5 w-3.5" />
            Apply defaults now
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            Notification Preferences
          </CardTitle>
          <CardDescription className="text-xs">
            Control which actions generate in-app notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-1">
          <NotifToggle
            label="Bug report created"
            description="When a new bug is created"
            checked={settings.notifyOnBugCreated}
            onCheckedChange={settings.setNotifyOnBugCreated}
          />
          <NotifToggle
            label="Bug closed"
            description="When a bug's status changes to closed"
            checked={settings.notifyOnBugClosed}
            onCheckedChange={settings.setNotifyOnBugClosed}
          />
          <NotifToggle
            label="Comment added"
            description="When someone comments on a bug"
            checked={settings.notifyOnCommentAdded}
            onCheckedChange={settings.setNotifyOnCommentAdded}
          />
          <NotifToggle
            label="Bulk actions"
            description="When a bulk action is applied to multiple bugs"
            checked={settings.notifyOnBulkAction}
            onCheckedChange={settings.setNotifyOnBulkAction}
          />
        </CardContent>
      </Card>

      {/* Data */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            Data & Storage
          </CardTitle>
          <CardDescription className="text-xs">
            All data is stored locally in your browser
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Settings</span>
            <code className="font-mono">localStorage: ib4g:settings</code>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Notifications</span>
            <code className="font-mono">localStorage: ib4g:notifications</code>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Saved filters</span>
            <code className="font-mono">localStorage: ib4g:saved-filters</code>
          </div>
          <Separator />
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-destructive hover:text-destructive"
            onClick={handleReset}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset all settings to defaults
          </Button>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
        <SettingsIcon className="h-3.5 w-3.5" />
        IB4G BugTracker v1.0.0 · Settings are saved automatically
      </div>
    </div>
  )
}

function NotifToggle({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="space-y-0.5">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
