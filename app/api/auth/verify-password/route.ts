import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, userKeys } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/crypto-utils";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const { password } = await request.json();

    if (!password) {
      return Response.json({ error: "Password is required" }, { status: 400 });
    }

    // Get user's stored encryption key
    const userKey = await db.query.userKeys.findFirst({
      where: eq(userKeys.userId, user.id),
    });

    if (!userKey) {
      return Response.json(
        { error: "No encryption password set. Please set one in settings." },
        { status: 400 }
      );
    }

    // Decode stored salt
    const storedSalt = new Uint8Array(
      atob(userKey.salt || "")
        .split("")
        .map((c) => c.charCodeAt(0))
    );

    // Hash the provided password with the stored salt
    const providedPasswordHash = await hashPassword(password, storedSalt);

    // Compare hashes
    const isPasswordValid = providedPasswordHash === userKey.keyHash;

    return Response.json({
      success: true,
      isValid: isPasswordValid,
    });
  } catch (error) {
    console.error("[VERIFY-PASSWORD] Error:", error);
    return Response.json(
      { error: "Failed to verify password" },
      { status: 500 }
    );
  }
}
