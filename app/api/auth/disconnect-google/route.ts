import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { googleTokens, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST() {
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
    return new Response(JSON.stringify({ error: "User not fpund" }), {
      status: 500,
    });
  }

  await db.delete(googleTokens).where(eq(googleTokens.userId, user.id));

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
