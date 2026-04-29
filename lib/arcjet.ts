import arcjet, { fixedWindow, shield } from "@arcjet/next";

type RateLimitProfile = "auth" | "download" | "share" | "upload" | "analytics";

const profiles: Record<
  RateLimitProfile,
  {
    window: `${number}s` | `${number}m` | `${number}h`;
    max: number;
  }
> = {
  auth: { window: "60s", max: 8 },
  download: { window: "60s", max: 25 },
  share: { window: "60s", max: 40 },
  upload: { window: "1h", max: 30 },
  analytics: { window: "60s", max: 80 },
};

const clients = new Map<RateLimitProfile, ReturnType<typeof createClient>>();

function createClient(profile: RateLimitProfile) {
  const key = process.env.ARCJET_KEY;

  if (!key) {
    return null;
  }

  const rateLimit = profiles[profile];

  return arcjet({
    key,
    characteristics: ["identity"],
    rules: [
      shield({ mode: "LIVE" }),
      fixedWindow({
        mode: "LIVE",
        window: rateLimit.window,
        max: rateLimit.max,
      }),
    ],
  });
}

function getClient(profile: RateLimitProfile) {
  if (!clients.has(profile)) {
    clients.set(profile, createClient(profile));
  }

  return clients.get(profile) || null;
}

export async function protectWithArcjet(
  request: Request,
  profile: RateLimitProfile,
  identity = "anonymous",
) {
  const client = getClient(profile);

  if (!client) {
    return null;
  }

  const decision = await client.protect(request, { identity });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return Response.json(
        {
          error: "Too many requests. Please wait before trying again.",
        },
        { status: 429 },
      );
    }

    return Response.json({ error: "Request blocked by security policy" }, { status: 403 });
  }

  return null;
}
