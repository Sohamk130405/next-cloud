import { db } from "@/lib/db";
import { activityLogs } from "@/db/schema";

export interface ActivityLogData {
  userId: string;
  actionType:
    | "upload"
    | "download"
    | "delete"
    | "share"
    | "view"
    | "settings"
    | "login"
    | "logout"
    | "password_change"
    | "account_delete";
  fileId?: string | null;
  shareId?: string | null;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function logActivity(data: ActivityLogData) {
  try {
    await db.insert(activityLogs).values({
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(),
      userId: data.userId,
      actionType: data.actionType,
      fileId: data.fileId || null,
      shareId: data.shareId || null,
      description: data.description || null,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
    });
  } catch (error) {
    console.error("[ACTIVITY-LOG] Failed to log activity:", error);
    // Don't throw - logging should not break the main operation
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "unknown";
}

export function getUserAgent(request: Request): string {
  return request.headers.get("user-agent") || "unknown";
}
