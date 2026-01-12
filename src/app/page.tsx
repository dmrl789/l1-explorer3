"use client";

import Link from "next/link";
import { Activity, Clock, Zap, Users, Box, ArrowRightLeft } from "lucide-react";
import { useStatus, useBlocks, useTransactions } from "@/lib/hooks";
import { KpiCard, KpiGrid } from "@/components/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function fmt(n: number | undefined | null): string {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  return n.toLocaleString();
}

function truncateId(id: string, len = 16): string {
  if (!id || id.length <= len) return id || "—";
  return `${id.slice(0, len)}…`;
}

export default function Dashboard() {
  const { status, isLoading: statusLoading, error: statusError } = useStatus();
  const { blocks, isLoading: blocksLoading, error: blocksError } = useBlocks(10);
  const { transactions, isLoading: txLoading, error: txError } = useTransactions(10);

  const health = status?.health ?? "unknown";
  const healthLabel = health === "healthy" ? "Healthy" : health === "degraded" ? "Degraded" : health === "unhealthy" ? "Unhealthy" : "Unknown";
  
  const ippanTime = status?.ippan_time?.value;
  const monotonic = status?.ippan_time?.monotonic;
  const driftMs = status?.ippan_time?.drift_ms;

  const p50 = status?.finality?.p50_ms;
  const p95 = status?.finality?.p95_ms;
  const p99 = status?.finality?.p99_ms;

  const acceptedTps = status?.accepted_tps;
  const finalizedTps = status?.finalized_tps;
  const validators = status?.active_validators;
  const verifiers = status?.shadow_verifiers;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="ippan-title">DevNet Dashboard</h1>
          <p className="ippan-subtitle mt-1">
            L1-only explorer focused on deterministic primitives: HashTimer™ ordering, IPPAN Time, round finality.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            API: <code className="ml-1 font-mono">{process.env.NEXT_PUBLIC_IPPAN_API_BASE ?? "not set"}</code>
          </Badge>
        </div>
      </div>

      {/* Error Banner */}
      {statusError && (
        <div className="ippan-card border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Failed to load <code>/status</code>. Check Vercel env var <code>NEXT_PUBLIC_IPPAN_API_BASE</code>.
          </p>
        </div>
      )}

      {/* KPI Grid */}
      <KpiGrid columns={3}>
        <KpiCard
          title="Network Health"
          value={healthLabel}
          subtitle="polled every ~3s"
          icon={<Activity className="h-4 w-4" />}
          loading={statusLoading}
        />
        <KpiCard
          title="IPPAN Time (authoritative)"
          value={ippanTime !== undefined ? String(ippanTime) : "—"}
          subtitle={`monotonic: ${monotonic !== undefined ? String(monotonic) : "—"} · drift: ${fmt(driftMs)}ms`}
          icon={<Clock className="h-4 w-4" />}
          loading={statusLoading}
        />
        <KpiCard
          title="Finality (ms)"
          value={p95 !== undefined ? `p95 ${fmt(p95)}` : "—"}
          subtitle={`p50 ${fmt(p50)} · p99 ${fmt(p99)}`}
          icon={<Zap className="h-4 w-4" />}
          loading={statusLoading}
        />
        <KpiCard
          title="Throughput (Accepted TPS)"
          value={fmt(acceptedTps)}
          subtitle="ingress accepted"
          loading={statusLoading}
        />
        <KpiCard
          title="Throughput (Finalized TPS)"
          value={fmt(finalizedTps)}
          subtitle="finality confirmed"
          loading={statusLoading}
        />
        <KpiCard
          title="Validators (active)"
          value={fmt(validators)}
          subtitle={verifiers ? `${fmt(verifiers)} shadow verifiers` : "shadow verifiers when exposed"}
          icon={<Users className="h-4 w-4" />}
          loading={statusLoading}
        />
      </KpiGrid>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Blocks */}
        <div className="ippan-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Box className="h-4 w-4 text-muted-foreground" />
              Recent Blocks
            </h3>
            <Link href="/blocks" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              View all →
            </Link>
          </div>
          <div className="p-4">
            {blocksError && (
              <p className="text-xs text-amber-600 mb-2">
                Blocks list unavailable — API may not expose this endpoint yet.
              </p>
            )}
            <div className="divide-y divide-border">
              {blocksLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))
              ) : blocks.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  No blocks available
                </p>
              ) : (
                blocks.slice(0, 8).map((block) => (
                  <Link
                    key={block.block_id}
                    href={`/blocks/${block.block_id}`}
                    className="flex items-center justify-between py-2 hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono">{truncateId(block.block_id)}</code>
                      {block.finalized && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">
                          final
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {block.tx_count} tx
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="ippan-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
              Recent Transactions
            </h3>
            <Link href="/tx" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              View all →
            </Link>
          </div>
          <div className="p-4">
            {txError && (
              <p className="text-xs text-amber-600 mb-2">
                Transactions list unavailable — API may not expose this endpoint yet.
              </p>
            )}
            <div className="divide-y divide-border">
              {txLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))
              ) : transactions.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  No transactions available
                </p>
              ) : (
                transactions.slice(0, 8).map((tx) => (
                  <Link
                    key={tx.tx_id}
                    href={`/tx/${tx.tx_id}`}
                    className="flex items-center justify-between py-2 hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <code className="text-xs font-mono">{truncateId(tx.tx_id)}</code>
                    <Badge 
                      variant={tx.finalized ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {tx.finalized ? "finalized" : tx.type || "pending"}
                    </Badge>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
