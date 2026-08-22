"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface AppNotification {
  id: string
  type: "bug_created" | "bug_updated" | "bug_closed" | "comment_added" | "bulk_action"
  title: string
  description: string
  bugId?: string
  timestamp: number
  read: boolean
}

interface NotificationStore {
  notifications: AppNotification[]
  unreadCount: number
  isOpen: boolean
  addNotification: (n: Omit<AppNotification, "id" | "timestamp" | "read">) => void
  markAllRead: () => void
  markRead: (id: string) => void
  removeNotification: (id: string) => void
  clearAll: () => void
  setOpen: (open: boolean) => void
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      notifications: [],
      unreadCount: 0,
      isOpen: false,
      addNotification: (n) =>
        set((state) => {
          const notification: AppNotification = {
            ...n,
            id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            timestamp: Date.now(),
            read: false,
          }
          // Keep last 50 notifications
          const notifications = [notification, ...state.notifications].slice(0, 50)
          return {
            notifications,
            unreadCount: notifications.filter((n) => !n.read).length,
          }
        }),
      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        })),
      markRead: (id) =>
        set((state) => {
          const notifications = state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          )
          return {
            notifications,
            unreadCount: notifications.filter((n) => !n.read).length,
          }
        }),
      removeNotification: (id) =>
        set((state) => {
          const notifications = state.notifications.filter((n) => n.id !== id)
          return {
            notifications,
            unreadCount: notifications.filter((n) => !n.read).length,
          }
        }),
      clearAll: () => set({ notifications: [], unreadCount: 0 }),
      setOpen: (isOpen) => set({ isOpen }),
    }),
    {
      name: "ib4g:notifications",
      // Only persist notifications + read state, not the panel open state
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
      }),
    },
  ),
)
