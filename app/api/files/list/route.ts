import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { files, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Get user from database
    let user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 500,
      });
    }

    // Get all files for the user
    const userFiles = await db.query.files.findMany({
      where: eq(files.userId, user.id),
    });

    return new Response(JSON.stringify({ files: userFiles }), { status: 200 });
  } catch (error) {
    console.error("[v0] List files error:", error);
    return new Response(JSON.stringify({ error: "Failed to list files" }), {
      status: 500,
    });
  }
}
