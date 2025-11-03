import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { users, userKeys } from "@/db/schema"
import { eq } from "drizzle-orm"
import { hashPassword, generateSalt } from "@/lib/crypto-utils"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    })

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 })
    }

    const { newPassword } = await request.json()

    if (!newPassword || newPassword.length < 8) {
      return new Response(JSON.stringify({ error: "Password must be at least 8 characters" }), { status: 400 })
    }

    // Generate new salt and hash
    const newSalt = generateSalt()
    const newKeyHash = await hashPassword(newPassword, newSalt)

    // Update user key
    const existingKey = await db.query.userKeys.findFirst({
      where: eq(userKeys.userId, user.id),
    })

    if (existingKey) {
      await db
        .update(userKeys)
        .set({
          salt: btoa(String.fromCharCode(...newSalt)),
          keyHash: newKeyHash,
          updatedAt: new Date(),
        })
        .where(eq(userKeys.userId, user.id))
    }

    // Note: In a real implementation, all files would need to be re-encrypted with new password
    // This is a complex operation that should be done in a background job

    return new Response(
      JSON.stringify({
        success: true,
        message: "Password changed successfully",
      }),
      { status: 200 },
    )
  } catch (error) {
    console.error("Password change error:", error)
    return new Response(JSON.stringify({ error: "Failed to change password" }), { status: 500 })
  }
}
