import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { googleTokens, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new Response(JSON.stringify({ connected: false }), { status: 401 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  });

  if (!user) {
    return new Response(JSON.stringify({ error: "User not fpund" }), {
      status: 500,
    });
  }

  const token = await db
    .select()
    .from(googleTokens)
    .where(eq(googleTokens.userId, user.id))
    .limit(1);

  return new Response(JSON.stringify({ connected: token.length > 0 }), {
    status: 200,
  });
}
