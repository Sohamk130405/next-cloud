import { auth } from "@clerk/nextjs/server";
import { getReEncryptionJobStatus } from "@/lib/utils/file-reencryption";

export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { jobId } = params;

    if (!jobId) {
      return new Response(JSON.stringify({ error: "Job ID is required" }), {
        status: 400,
      });
    }

    const job = getReEncryptionJobStatus(jobId);

    if (!job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404,
      });
    }

    // Verify job belongs to authenticated user
    if (job.userId !== userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
      });
    }

    return new Response(JSON.stringify(job), { status: 200 });
  } catch (error) {
    console.error("[Re-encryption Status] Error:", error);
    return new Response(JSON.stringify({ error: "Failed to get job status" }), {
      status: 500,
    });
  }
}
