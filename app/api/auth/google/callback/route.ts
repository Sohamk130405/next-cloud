import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { googleTokens, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const url = new URL(req.url);
    const code = url.searchParams.get("code");

    if (!code) {
      return new Response(JSON.stringify({ error: "Missing code" }), {
        status: 400,
      });
    }

    // Exchange the code for access + refresh tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${
          process.env.NEXT_PUBLIC_URL || "http://localhost:3000"
        }/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      console.error("Token exchange failed:", tokens);
      return new Response(
        JSON.stringify({ error: "Failed to exchange tokens" }),
        { status: 400 }
      );
    }

    const { access_token, refresh_token, expires_in } = tokens;

    // Fetch user from DB
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    const existingToken = await db.query.googleTokens.findFirst({
      where: eq(googleTokens.userId, user.id),
    });

    const expiresAt = new Date(Date.now() + expires_in * 1000);

    if (existingToken) {
      await db
        .update(googleTokens)
        .set({
          accessToken: access_token,
          refreshToken: refresh_token || existingToken.refreshToken,
          expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(googleTokens.userId, user.id));
    } else {
      await db.insert(googleTokens).values({
        id: nanoid(),
        userId: user.id,
        accessToken: access_token,
        refreshToken: refresh_token || null,
        expiresAt,
      });
    }

    // Redirect back to your dashboard or success page
    return Response.redirect(
      `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/dashboard`
    );
  } catch (error) {
    console.error("Google callback error:", error);
    return new Response(JSON.stringify({ error: "Failed to save tokens" }), {
      status: 500,
    });
  }
}
