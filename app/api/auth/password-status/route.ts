import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, userKeys } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    const userKey = await db.query.userKeys.findFirst({
      where: eq(userKeys.userId, user.id),
    });

    return new Response(JSON.stringify({ hasPassword: Boolean(userKey) }), {
      status: 200,
    });
  } catch (error) {
    console.error("Password status error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to check password status" }),
      { status: 500 },
    );
  }
}
