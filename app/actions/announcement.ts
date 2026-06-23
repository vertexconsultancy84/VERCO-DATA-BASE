"use server";

import { prisma } from "@/lib/prisma";
import { getAdminSession } from "./auth";

export interface AnnouncementItem {
  id: string;
  message: string;
  active: boolean;
  createdAt: string;
}

// ─── Public: active announcements for the home page (no auth) ───────────────
export async function getActiveAnnouncements(): Promise<AnnouncementItem[]> {
  try {
    const items = await prisma.announcement.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
    });
    return items.map((a) => ({
      id: a.id,
      message: a.message,
      active: a.active,
      createdAt: a.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("getActiveAnnouncements:", error);
    return [];
  }
}

// ─── Admin: full list (active + hidden) ────────────────────────────────────
export async function getAllAnnouncements(): Promise<AnnouncementItem[]> {
  const admin = await getAdminSession();
  if (!admin || admin.role !== "admin") return [];
  try {
    const items = await prisma.announcement.findMany({ orderBy: { createdAt: "desc" } });
    return items.map((a) => ({
      id: a.id,
      message: a.message,
      active: a.active,
      createdAt: a.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("getAllAnnouncements:", error);
    return [];
  }
}

export async function createAnnouncement(message: string) {
  const admin = await getAdminSession();
  if (!admin || admin.role !== "admin") return { success: false, message: "Unauthorized" };
  if (!message?.trim()) return { success: false, message: "Message is required." };
  try {
    await prisma.announcement.create({ data: { message: message.trim() } });
    return { success: true, message: "Announcement posted." };
  } catch (error) {
    console.error("createAnnouncement:", error);
    return { success: false, message: "Failed to post announcement." };
  }
}

export async function toggleAnnouncement(id: string, active: boolean) {
  const admin = await getAdminSession();
  if (!admin || admin.role !== "admin") return { success: false, message: "Unauthorized" };
  try {
    await prisma.announcement.update({ where: { id }, data: { active } });
    return { success: true };
  } catch (error) {
    console.error("toggleAnnouncement:", error);
    return { success: false, message: "Failed to update announcement." };
  }
}

export async function deleteAnnouncement(id: string) {
  const admin = await getAdminSession();
  if (!admin || admin.role !== "admin") return { success: false, message: "Unauthorized" };
  try {
    await prisma.announcement.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("deleteAnnouncement:", error);
    return { success: false, message: "Failed to delete announcement." };
  }
}
