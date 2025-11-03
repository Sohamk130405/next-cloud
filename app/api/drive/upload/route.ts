import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { googleTokens, users } from "@/db/schema"
import { eq } from "drizzle-orm"

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

    // Get user's Google tokens
    const googleToken = await db.query.googleTokens.findFirst({
      where: eq(googleTokens.userId, user.id),
    })

    if (!googleToken) {
      return new Response(JSON.stringify({ error: "Google Drive not connected" }), { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const fileName = formData.get("fileName") as string

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), { status: 400 })
    }

    // Create multipart form data for Google Drive API
    const metadata = {
      name: fileName || file.name,
      parents: ["appDataFolder"], // Store in app data folder for privacy
    }

    const driveFormData = new FormData()
    driveFormData.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }))
    driveFormData.append("file", file)

    // Upload to Google Drive
    const driveResponse = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${googleToken.accessToken}`,
      },
      body: driveFormData,
    })

    if (!driveResponse.ok) {
      const error = await driveResponse.text()
      console.error("Google Drive upload error:", error)
      return new Response(JSON.stringify({ error: "Google Drive upload failed" }), { status: 500 })
    }

    const driveFile = await driveResponse.json()

    return new Response(
      JSON.stringify({
        success: true,
        driveFileId: driveFile.id,
      }),
      { status: 200 },
    )
  } catch (error) {
    console.error("Drive upload error:", error)
    return new Response(JSON.stringify({ error: "Upload to Drive failed" }), { status: 500 })
  }
}
