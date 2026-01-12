export const dynamic = "force-dynamic";

export default function Home() {
  const sha =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.VERCEL_GITHUB_COMMIT_SHA ||
    "unknown";

  return (
    <main style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
        IPPAN L1 Explorer 3 — Online ✅
      </h1>

      <p style={{ marginBottom: 16, color: "#555", maxWidth: 760 }}>
        If you can see this page, Vercel is serving the repository code correctly.
        Next step: wire the real DevNet RPC and pages.
      </p>

      <div
        style={{
          border: "1px solid #eee",
          borderRadius: 16,
          padding: 16,
          background: "white",
          maxWidth: 760,
        }}
      >
        <div style={{ fontSize: 12, color: "#777" }}>Deployment</div>
        <div style={{ marginTop: 6, fontFamily: "ui-monospace, SFMono-Regular" }}>
          commit: {sha}
        </div>
        <div style={{ marginTop: 6, fontFamily: "ui-monospace, SFMono-Regular" }}>
          api base: {process.env.NEXT_PUBLIC_IPPAN_API_BASE || "(not set)"}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <a
          href="/api/ping"
          style={{
            display: "inline-block",
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #ddd",
            textDecoration: "none",
            color: "#111",
            background: "#fafafa",
          }}
        >
          Open /api/ping
        </a>
      </div>
    </main>
  );
}
