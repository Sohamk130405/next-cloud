import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, userKeys } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { generateSalt, hashPassword } from "@/lib/crypto-utils";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (existingUser) {
      return new Response(JSON.stringify({ user: existingUser }), {
        status: 200,
      });
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return new Response(
        JSON.stringify({ error: "User not found in Clerk" }),
        { status: 404 }
      );
    }

    const newUserId = nanoid();
    const salt = generateSalt();
    const randomPassword = nanoid(32);
    const keyHash = await hashPassword(randomPassword, salt);

    // Create user
    await db.insert(users).values({
      id: newUserId,
      clerkId: userId,
      email: clerkUser.emailAddresses[0]?.emailAddress || "user@example.com",
      name: clerkUser.firstName || "User",
    });

    // Store encryption key
    await db.insert(userKeys).values({
      id: nanoid(),
      userId: newUserId,
      salt: btoa(String.fromCharCode(...salt)),
      keyHash,
    });

    return new Response(
      JSON.stringify({
        success: true,
        userId: newUserId,
        message: "User initialized",
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("[v0] User init error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to initialize user" }),
      { status: 500 }
    );
  }
}
