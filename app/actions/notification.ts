"use server";

import { prisma } from "@/lib/prisma";
import { getAdminSession, getUserSession } from "./auth";

export interface NotificationItem {
  id: string;
  title: string | null;
  message: string;
  read: boolean;
  createdAt: string;
}

// ─── Admin: send a message to a single user ────────────────────────────────
export async function sendNotificationToUser(
  userId: string,
  message: string,
  title?: string
) {
  const admin = await getAdminSession();
  if (!admin || admin.role !== "admin") {
    return { success: false, message: "Unauthorized" };
  }
  if (!userId || !message?.trim()) {
    return { success: false, message: "User and message are required." };
  }

  try {
    // Make sure the recipient actually exists before writing.
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) return { success: false, message: "User not found." };

    await prisma.notification.create({
      data: { userId, message: message.trim(), title: title?.trim() || null },
    });
    return { success: true, message: "Message sent." };
  } catch (error) {
    console.error("sendNotificationToUser:", error);
    return { success: false, message: "Failed to send message." };
  }
}

// ─── Admin: broadcast a message to every user ──────────────────────────────
export async function broadcastNotification(message: string, title?: string) {
  const admin = await getAdminSession();
  if (!admin || admin.role !== "admin") {
    return { success: false, message: "Unauthorized" };
  }
  if (!message?.trim()) return { success: false, message: "Message is required." };

  try {
    const users = await prisma.user.findMany({ select: { id: true } });
    if (users.length === 0) return { success: false, message: "No users to notify." };

    await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        message: message.trim(),
        title: title?.trim() || null,
      })),
    });
    return { success: true, message: `Message sent to ${users.length} user(s).` };
  } catch (error) {
    console.error("broadcastNotification:", error);
    return { success: false, message: "Failed to broadcast message." };
  }
}

// ─── User: read their own notifications ────────────────────────────────────
export async function getMyNotifications(): Promise<NotificationItem[]> {
  const user = await getUserSession();
  if (!user) return [];

  try {
    const items = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return items.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("getMyNotifications:", error);
    return [];
  }
}

export async function getMyUnreadCount(): Promise<number> {
  const user = await getUserSession();
  if (!user) return 0;
  try {
    return await prisma.notification.count({ where: { userId: user.id, read: false } });
  } catch {
    return 0;
  }
}

export async function markNotificationRead(id: string) {
  const user = await getUserSession();
  if (!user) return { success: false };
  try {
    // updateMany scopes by userId so a user can only mark their own as read.
    await prisma.notification.updateMany({
      where: { id, userId: user.id },
      data: { read: true },
    });
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function markAllNotificationsRead() {
  const user = await getUserSession();
  if (!user) return { success: false };
  try {
    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function deleteNotification(id: string) {
  const user = await getUserSession();
  if (!user) return { success: false };
  try {
    await prisma.notification.deleteMany({ where: { id, userId: user.id } });
    return { success: true };
  } catch {
    return { success: false };
  }
}
