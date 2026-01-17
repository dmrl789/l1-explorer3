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
  const half = Math.floor(len / 2);
  return `${id.slice(0, half)}…${id.slice(-half)}`;
}

export default function Dashboard() {
  const { status, isLoading: statusLoading, error: statusError } = useStatus();
  const { blocks, isLoading: blocksLoading, error: blocksError } = useBlocks(10);
  const { transactions, isLoading: txLoading, error: txError } = useTransactions(10);

  // Determine network connectivity: connected if we have blocks OR status data
  // Don't show "unable to connect" if just one widget fails
  const hasStatusData = status && !status.warming_up;
  const hasBlocksData = blocks && blocks.length > 0;
  const isConnected = hasStatusData || hasBlocksData;
  const showConnectionError = statusError && blocksError && !statusLoading && !blocksLoading;

  // Handle warming_up state gracefully
  const isWarmingUp = status?.warming_up === true;
  const health = status?.health ?? "unknown";
  const healthLabel = isWarmingUp 
    ? "Initializing" 
    : health === "healthy" ? "Healthy" 
    : health === "degraded" ? "Degraded" 
    : health === "unhealthy" ? "Unhealthy" 
    : isConnected ? "Healthy" // If we have data, assume healthy
    : "Unknown";
  
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
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
            DevNet Dashboard
          </h1>
          <p className="text-slate-400 mt-1.5 sm:mt-2 text-sm sm:text-base max-w-2xl">
            L1 Explorer focused on deterministic primitives: HashTimer™ ordering, IPPAN Time, and round finality.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs px-2 sm:px-3 py-1">
            <span className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full mr-1.5 sm:mr-2 ${
              showConnectionError ? "bg-red-500" : 
              isWarmingUp ? "bg-yellow-500 animate-pulse" : 
              "bg-emerald-500 animate-pulse"
            }`} />
            {showConnectionError ? "Offline" : isWarmingUp ? "Initializing" : "Live"}
          </Badge>
        </div>
      </div>

      {/* Error Banner - only show if BOTH status and blocks fail */}
      {showConnectionError && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm text-amber-300">
            Unable to connect to the network. Please check your connection.
          </p>
        </div>
      )}

      {/* Warming Up Banner - show when status is initializing but blocks work */}
      {isWarmingUp && !showConnectionError && (
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
          <p className="text-sm text-blue-300">
            Network status is initializing. Data will appear shortly.
          </p>
        </div>
      )}

      {/* KPI Grid */}
      <KpiGrid columns={3}>
        <KpiCard
          title="Network Health"
          value={healthLabel}
          subtitle="Real-time status"
          icon={<Activity className="h-4 w-4" />}
          loading={statusLoading}
        />
        <KpiCard
          title="IPPAN Time"
          value={ippanTime !== undefined ? String(ippanTime) : "—"}
          subtitle={`Monotonic: ${monotonic !== undefined ? String(monotonic) : "—"} · Drift: ${fmt(driftMs)}ms`}
          icon={<Clock className="h-4 w-4" />}
          loading={statusLoading}
        />
        <KpiCard
          title="Finality"
          value={p95 !== undefined ? `${fmt(p95)}ms` : "—"}
          subtitle={`p50: ${fmt(p50)}ms · p99: ${fmt(p99)}ms`}
          icon={<Zap className="h-4 w-4" />}
          loading={statusLoading}
        />
        <KpiCard
          title="Accepted TPS"
          value={fmt(acceptedTps)}
          subtitle="Transactions per second"
          loading={statusLoading}
        />
        <KpiCard
          title="Finalized TPS"
          value={fmt(finalizedTps)}
          subtitle="Confirmed transactions"
          loading={statusLoading}
        />
        <KpiCard
          title="Active Validators"
          value={fmt(validators)}
          subtitle={verifiers ? `${fmt(verifiers)} verifiers` : "Network consensus"}
          icon={<Users className="h-4 w-4" />}
          loading={statusLoading}
        />
      </KpiGrid>

      {/* Recent Activity */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Recent Blocks */}
        <div className="rounded-lg sm:rounded-xl border border-slate-700/50 bg-[#1e2736] overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-700/50 px-3 py-3 sm:px-5 sm:py-4">
            <h3 className="font-semibold text-sm sm:text-base text-slate-100 flex items-center gap-2">
              <Box className="h-4 w-4 text-purple-400" />
              Recent Blocks
            </h3>
            <Link href="/blocks" className="text-[11px] sm:text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
              View all →
            </Link>
          </div>
          <div className="p-3 sm:p-5">
            {blocksError && (
              <p className="text-xs text-amber-400 mb-3 px-2 sm:px-3 py-2 bg-amber-500/10 rounded-lg">
                Blocks data temporarily unavailable
              </p>
            )}
            <div className="space-y-0.5 sm:space-y-1">
              {blocksLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 sm:py-3 px-2 sm:px-3">
                    <Skeleton className="h-4 w-28 sm:w-36" />
                    <Skeleton className="h-4 w-12 sm:w-14" />
                  </div>
                ))
              ) : blocks.length === 0 ? (
                <p className="text-sm text-slate-500 py-6 sm:py-8 text-center">
                  No blocks available
                </p>
              ) : (
                blocks.slice(0, 6).map((block) => (
                  <Link
                    key={block.block_id}
                    href={`/blocks/${block.block_id}`}
                    className="flex items-center justify-between py-2.5 sm:py-3 px-2 sm:px-3 hover:bg-slate-700/30 active:bg-slate-700/40 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <code className="text-xs sm:text-sm font-mono text-slate-300 group-hover:text-emerald-300 transition-colors truncate">
                        {truncateId(block.block_id, 12)}
                      </code>
                      {block.finalized && (
                        <Badge variant="success" className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 shrink-0">
                          Finalized
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs sm:text-sm text-slate-500 shrink-0 ml-2">
                      {block.tx_count} tx
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="rounded-lg sm:rounded-xl border border-slate-700/50 bg-[#1e2736] overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-700/50 px-3 py-3 sm:px-5 sm:py-4">
            <h3 className="font-semibold text-sm sm:text-base text-slate-100 flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-emerald-400" />
              Recent Transactions
            </h3>
            <Link href="/tx" className="text-[11px] sm:text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
              View all →
            </Link>
          </div>
          <div className="p-3 sm:p-5">
            {txError && (
              <p className="text-xs text-amber-400 mb-3 px-2 sm:px-3 py-2 bg-amber-500/10 rounded-lg">
                Transaction data temporarily unavailable
              </p>
            )}
            <div className="space-y-0.5 sm:space-y-1">
              {txLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 sm:py-3 px-2 sm:px-3">
                    <Skeleton className="h-4 w-28 sm:w-36" />
                    <Skeleton className="h-4 w-14 sm:w-16" />
                  </div>
                ))
              ) : transactions.length === 0 ? (
                <p className="text-sm text-slate-500 py-6 sm:py-8 text-center">
                  No transactions available
                </p>
              ) : (
                transactions.slice(0, 6).map((tx) => (
                  <Link
                    key={tx.tx_id}
                    href={`/tx/${tx.tx_id}`}
                    className="flex items-center justify-between py-2.5 sm:py-3 px-2 sm:px-3 hover:bg-slate-700/30 active:bg-slate-700/40 rounded-lg transition-colors group"
                  >
                    <code className="text-xs sm:text-sm font-mono text-slate-300 group-hover:text-emerald-300 transition-colors truncate min-w-0">
                      {truncateId(tx.tx_id, 12)}
                    </code>
                    <Badge 
                      variant={tx.finalized ? "success" : "secondary"}
                      className="text-[9px] sm:text-[10px] shrink-0 ml-2"
                    >
                      {tx.finalized ? "Finalized" : tx.type || "Pending"}
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
