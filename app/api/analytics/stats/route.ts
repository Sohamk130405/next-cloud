import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import {
  users,
  files,
  shareLinks,
  storageStats,
  activityLogs,
} from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const fileStatsResult = await db
      .select({
        totalFiles: sql<number>`count(*)`,
        totalSize: sql<number>`COALESCE(SUM(${files.fileSize}), 0)`,
      })
      .from(files)
      .where(eq(files.userId, user.id));

    const fileStats = fileStatsResult[0] || { totalFiles: 0, totalSize: 0 };

    const shareStatsResult = await db
      .selectDistinct({ fileId: shareLinks.fileId })
      .from(shareLinks)
      .where(eq(shareLinks.ownerId, user.id));

    const filesShared = shareStatsResult.length;

    const activityStatsResult = await db
      .select({
        actionType: activityLogs.actionType,
        count: sql<number>`count(*)`,
      })
      .from(activityLogs)
      .where(eq(activityLogs.userId, user.id))
      .groupBy(activityLogs.actionType);

    const activities = Object.fromEntries(
      activityStatsResult.map((a) => [a.actionType, a.count])
    );

    const storageTrendResult = await db
      .select({
        date: sql<string>`DATE(${storageStats.recordedAt})`,
        totalSize: storageStats.totalSize,
        totalFiles: storageStats.totalFiles,
      })
      .from(storageStats)
      .where(
        and(
          eq(storageStats.userId, user.id),
          sql`${storageStats.recordedAt} >= NOW() - INTERVAL '30 days'`
        )
      )
      .orderBy((stats) => [stats.date]);

    const storageTrend = storageTrendResult.map((s) => ({
      date: s.date,
      size: s.totalSize,
      files: s.totalFiles,
    }));

    return Response.json({
      storage: {
        totalFiles: fileStats.totalFiles,
        totalSize: fileStats.totalSize,
        filesShared,
      },
      activities,
      storageTrend,
    });
  } catch (error) {
    console.error("[v0] Stats fetch error:", error);
    return Response.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
