export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    ok: true,
    now: new Date().toISOString(),
    commit:
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.VERCEL_GITHUB_COMMIT_SHA ||
      "unknown",
  });
}
