'use client';

import Link from 'next/link';
import { 
  Timer, 
  Clock, 
  GitBranch, 
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Info,
} from 'lucide-react';
import { useStatus, useRounds, useBlocks, useTransactions } from '@/lib/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useState } from 'react';

interface PrimitiveCardProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  features: string[];
  example?: {
    label: string;
    href: string;
    value?: string;
  };
  learnMoreHref?: string;
  learnMoreDialog?: React.ReactNode;
  onLearnMoreClick?: () => void;
}

function PrimitiveCard({ 
  title, 
  icon, 
  description, 
  features, 
  example,
  learnMoreHref,
  onLearnMoreClick,
}: PrimitiveCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
            {icon}
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <ul className="space-y-2 flex-1 mb-4">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          {example && (
            <Button variant="default" size="sm" asChild>
              <Link href={example.href}>
                {example.label}
                {example.value && (
                  <Badge variant="secondary" className="ml-2 font-mono text-xs">
                    {example.value}
                  </Badge>
                )}
                <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          )}
          {onLearnMoreClick && (
            <Button variant="outline" size="sm" onClick={onLearnMoreClick}>
              Learn more
              <Info className="h-3 w-3 ml-1" />
            </Button>
          )}
          {learnMoreHref && !onLearnMoreClick && (
            <Button variant="outline" size="sm" asChild>
              <a href={learnMoreHref} target="_blank" rel="noopener noreferrer">
                Learn more
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function HashTimerLearnMoreDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">HashTimer™ <span className="text-sm font-normal text-muted-foreground">(patent pending)</span></DialogTitle>
          <DialogDescription>
            Cryptographic timestamping for deterministic transaction ordering
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground leading-relaxed">
            <strong className="text-foreground">HashTimer™</strong> is IPPAN&apos;s cryptographic timestamping primitive that assigns every transaction a <strong className="text-foreground">unique hash-based time marker</strong> and produces a <strong className="text-foreground">single canonical ordering</strong> that every node can verify independently—reducing front-running incentives and minimizing MEV.
          </p>

          <div className="rounded-lg bg-muted/50 p-4 border">
            <p className="font-medium text-foreground mb-2">Format (conceptual):</p>
            <code className="block bg-background rounded px-3 py-2 font-mono text-xs">
              HT = (IPPAN Time, TxHash, SequencingProof)
            </code>
            <p className="text-muted-foreground mt-2 text-xs">
              Where <strong className="text-foreground">IPPAN Time</strong> anchors ordering, <strong className="text-foreground">TxHash</strong> binds identity, and <strong className="text-foreground">SequencingProof</strong> makes the position <strong className="text-foreground">deterministic and verifiable</strong> across the network.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-3">Why it matters</h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  <strong className="text-foreground">Unique per transaction:</strong> each transaction receives a HashTimer™ that cannot be duplicated or arbitrarily rewritten.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  <strong className="text-foreground">Deterministic &amp; verifiable ordering:</strong> nodes derive the same order from the same inputs—no subjective mempool rules.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  <strong className="text-foreground">Front-running / MEV resistance:</strong> canonical ordering removes discretionary reordering and collapses common MEV paths.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  <strong className="text-foreground">Perfect replayability:</strong> re-compute history exactly from genesis or any checkpoint, because ordering is deterministic.
                </span>
              </li>
            </ul>
          </div>

          <div className="pt-2 border-t">
            <p className="text-muted-foreground italic">
              <strong className="text-foreground not-italic">In short:</strong> HashTimer™ makes ordering a cryptographic fact—fair, auditable, and reproducible.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PrimitivesPage() {
  const [hashTimerDialogOpen, setHashTimerDialogOpen] = useState(false);
  const { status, isLoading: statusLoading } = useStatus();
  const { rounds } = useRounds(1);
  const { blocks } = useBlocks(1);
  const { transactions } = useTransactions(1);

  const latestRound = rounds[0];
  const latestBlock = blocks[0];
  const latestTx = transactions[0];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">IPPAN Primitives</h1>
        <p className="text-muted-foreground mt-1">
          Core building blocks that enable deterministic, verifiable consensus on IPPAN L1
        </p>
      </div>

      {/* Introduction */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <div>
              <h2 className="font-semibold text-lg">Innovation + Verifiable Evidence</h2>
              <p className="text-muted-foreground text-sm mt-1">
                IPPAN L1 introduces novel primitives that ensure transaction ordering is 
                deterministic, finality is fast, and the entire history is replayable.
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-background">
                {statusLoading ? (
                  <Skeleton className="h-4 w-16" />
                ) : (
                  `${status?.active_validators ?? 0} Validators`
                )}
              </Badge>
              <Badge variant="outline" className="bg-background">
                {statusLoading ? (
                  <Skeleton className="h-4 w-20" />
                ) : (
                  status?.hashtimer_ordering === 'canonical' ? 'HashTimer™ ON' : 'HashTimer™ Partial'
                )}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Primitives Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <PrimitiveCard
          title="HashTimer™"
          icon={<Timer className="h-5 w-5" />}
          description="Cryptographic timestamping that provides canonical ordering for all transactions, eliminating MEV and ensuring fairness."
          features={[
            'Every transaction receives a unique hash-based timestamp',
            'Ordering is deterministic and verifiable',
            'Eliminates front-running and MEV attacks',
            'Enables perfect replay from any point in history',
          ]}
          example={
            latestTx ? {
              label: 'View Transaction',
              href: `/tx/${latestTx.tx_id}`,
              value: latestTx.tx_id.slice(0, 8) + '...',
            } : undefined
          }
          onLearnMoreClick={() => setHashTimerDialogOpen(true)}
        />
        <HashTimerLearnMoreDialog 
          open={hashTimerDialogOpen} 
          onOpenChange={setHashTimerDialogOpen} 
        />

        <PrimitiveCard
          title="IPPAN Time"
          icon={<Clock className="h-5 w-5" />}
          description="A monotonically increasing logical clock that provides a consistent view of time across all network participants."
          features={[
            'Monotonic: always increasing, never goes backward',
            'Drift detection against wall-clock time',
            'Used as the primary ordering dimension',
            'Enables deterministic state transitions',
          ]}
          example={{
            label: 'View Status',
            href: '/',
            value: status?.ippan_time?.value?.toString() ?? 'Loading...',
          }}
          learnMoreHref="https://docs.ippan.uk/primitives/ippan-time"
        />

        <PrimitiveCard
          title="Deterministic Ordering"
          icon={<GitBranch className="h-5 w-5" />}
          description="All nodes agree on the exact same transaction order, enabling perfect state replication without ambiguity."
          features={[
            'Global consensus on transaction sequence',
            'No ordering ambiguity between validators',
            'Enables parallel verification',
            'Foundation for auditability and compliance',
          ]}
          example={
            latestBlock ? {
              label: 'View Block',
              href: `/blocks/${latestBlock.block_id}`,
              value: latestBlock.block_id.slice(0, 8) + '...',
            } : undefined
          }
          learnMoreHref="https://docs.ippan.uk/primitives/ordering"
        />

        <PrimitiveCard
          title="Rounds & Finality"
          icon={<CheckCircle2 className="h-5 w-5" />}
          description="Transaction batches are finalized in rounds, providing fast and provable finality with threshold signatures."
          features={[
            'Sub-second finality (p95 targets)',
            'Threshold signature proofs',
            'Round-based state commitments',
            'Shadow verifier validation',
          ]}
          example={
            latestRound ? {
              label: 'View Round',
              href: `/rounds/${latestRound.round_id}`,
              value: `#${latestRound.round_id}`,
            } : undefined
          }
          learnMoreHref="https://docs.ippan.uk/primitives/rounds"
        />
      </div>

      {/* Why This Matters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Why This Matters for Investors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Regulatory Compliance</h3>
              <p className="text-sm text-muted-foreground">
                Full audit trail with cryptographic proofs. Every transaction can be traced 
                and verified from genesis.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Institutional-Grade Security</h3>
              <p className="text-sm text-muted-foreground">
                Deterministic execution means no surprises. What validators commit is 
                exactly what executes.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Operational Transparency</h3>
              <p className="text-sm text-muted-foreground">
                Real-time metrics, provable finality, and complete state replayability 
                for any compliance requirement.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
