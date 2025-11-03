import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, activityLogs } from "@/db/schema";
import { eq, and, sql, desc, gte } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const days = Number.parseInt(searchParams.get("days") || "30");
    const limit = Number.parseInt(searchParams.get("limit") || "50");

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);

    const activities = await db
      .select()
      .from(activityLogs)
      .where(
        and(
          eq(activityLogs.userId, user.id),
          gte(activityLogs.createdAt, daysAgo)
        )
      )
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);

    const summaryResult = await db
      .select({
        actionType: activityLogs.actionType,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(activityLogs)
      .where(
        and(
          eq(activityLogs.userId, user.id),
          gte(activityLogs.createdAt, daysAgo)
        )
      )
      .groupBy(activityLogs.actionType);

    const summary = Object.fromEntries(
      summaryResult.map((s) => [
        s.actionType || "unknown",
        typeof s.count === "number" ? s.count : Number.parseInt(s.count as any),
      ])
    );

    return Response.json({ activities, summary });
  } catch (error) {
    console.error("[v0] Activity fetch error:", error);
    return Response.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { actionType, fileId, shareId, description } = await request.json();

    if (!actionType) {
      return Response.json({ error: "Missing actionType" }, { status: 400 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const activityId = crypto.randomUUID();
    await db.insert(activityLogs).values({
      id: activityId,
      userId: user.id,
      actionType,
      fileId: fileId || null,
      shareId: shareId || null,
      description: description || null,
    });

    return Response.json({ success: true, activityId }, { status: 201 });
  } catch (error) {
    console.error("[v0] Activity log error:", error);
    return Response.json({ error: "Failed to log activity" }, { status: 500 });
  }
}
