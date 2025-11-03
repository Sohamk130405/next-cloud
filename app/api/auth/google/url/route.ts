import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${
      process.env.NEXTAUTH_URL || "http://localhost:3000"
    }/api/auth/google/callback`;

    // ✅ Updated scopes
    const scopes = [
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/drive.appdata",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "openid",
    ];

    const params = new URLSearchParams({
      client_id: clientId!,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: scopes.join(" "),
      access_type: "offline", // request refresh token
      prompt: "consent", // always show consent screen (ensures refresh token)
    });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return new Response(JSON.stringify({ url }), { status: 200 });
  } catch (error) {
    console.error("Google URL error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate URL" }), {
      status: 500,
    });
  }
}
