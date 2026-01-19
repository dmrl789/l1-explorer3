"use client";

import React from "react";

type Props = {
  // Must return an IPPAN Time sample in integer microseconds.
  // Prefer string over number to avoid precision loss > 2^53.
  fetchStatus: () => Promise<{ ippan_time_us: string | number }>;
  pollMs?: number; // network poll cadence
  tickMs?: number; // UI tick cadence
};

function toBigIntUs(x: string | number): bigint {
  if (typeof x === "number") {
    if (!Number.isSafeInteger(x)) {
      throw new Error("ippan_time_us must be a safe integer when provided as number");
    }
    return BigInt(x);
  }
  return BigInt(x);
}

export default function IppanTimeTicker({
  fetchStatus,
  pollMs = 750,
  tickMs = 100,
}: Props) {
  const lastRenderedUsRef = React.useRef<bigint>(0n);
  const lastSampleUsRef = React.useRef<bigint>(0n);
  const lastSampleAtPerfMsRef = React.useRef<number>(0);

  const [renderUs, setRenderUs] = React.useState<bigint>(0n);

  // Poll network for a fresh sample
  React.useEffect(() => {
    let stopped = false;

    async function pollOnce() {
      try {
        const s = await fetchStatus();
        const sampleUs = toBigIntUs(s.ippan_time_us);

        if (stopped) return;

        const nowPerf = performance.now();
        // Monotonic sample clamp: never accept a sample lower than the last sample we accepted
        const clampedSampleUs =
          sampleUs >= lastSampleUsRef.current ? sampleUs : lastSampleUsRef.current;

        lastSampleUsRef.current = clampedSampleUs;
        lastSampleAtPerfMsRef.current = nowPerf;
      } catch {
        // ignore transient failures
      }
    }

    pollOnce();
    const id = window.setInterval(pollOnce, pollMs);

    return () => {
      stopped = true;
      window.clearInterval(id);
    };
  }, [fetchStatus, pollMs]);

  // Smooth UI ticker (never goes backwards)
  React.useEffect(() => {
    const id = window.setInterval(() => {
      const baseUs = lastSampleUsRef.current;
      const basePerf = lastSampleAtPerfMsRef.current;
      if (baseUs === 0n || basePerf === 0) return;

      const elapsedMs = performance.now() - basePerf;
      const elapsedUs = BigInt(Math.max(0, Math.trunc(elapsedMs))) * 1000n;

      let candidate = baseUs + elapsedUs;

      // Hard monotonic render clamp: never render lower than last rendered
      if (candidate <= lastRenderedUsRef.current) {
        candidate = lastRenderedUsRef.current + 1n;
      }

      lastRenderedUsRef.current = candidate;
      setRenderUs(candidate);
    }, tickMs);

    return () => window.clearInterval(id);
  }, [tickMs]);

  // Render: format without floats
  const seconds = renderUs / 1_000_000n;
  const micros = renderUs % 1_000_000n;

  return (
    <span title={`${renderUs.toString()} µs`}>
      {seconds.toString()}.{micros.toString().padStart(6, "0")}
    </span>
  );
}

