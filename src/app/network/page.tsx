'use client';

// Force dynamic rendering to ensure fresh data on refresh
export const dynamic = "force-dynamic";

import { 
  Network, 
  Server, 
  Users,
  RefreshCw,
  Activity,
} from 'lucide-react';
import { useNetworkNodes, useStatus } from '@/lib/hooks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { KpiCard, KpiGrid } from '@/components/kpi-card';
import { PageSkeleton, TableSkeleton } from '@/components/skeletons';
import { ErrorState, EmptyState } from '@/components/error-state';
import { CopyableText } from '@/components/copy-button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { NodeStatus, NodeRole } from '@/lib/schemas';

const statusColors: Record<NodeStatus, string> = {
  online: 'bg-green-500',
  offline: 'bg-red-500',
  syncing: 'bg-yellow-500',
  unknown: 'bg-gray-500',
};

const statusBadgeColors: Record<NodeStatus, string> = {
  online: 'bg-green-500/10 text-green-600 border-green-500/20',
  offline: 'bg-red-500/10 text-red-600 border-red-500/20',
  syncing: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  unknown: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

const roleColors: Record<NodeRole, string> = {
  validator: 'bg-blue-500/10 text-blue-600',
  shadow_verifier: 'bg-purple-500/10 text-purple-600',
  full_node: 'bg-gray-500/10 text-gray-600',
  observer: 'bg-gray-500/10 text-gray-600',
  unknown: 'bg-gray-500/10 text-gray-600',
};

export default function NetworkPage() {
  const { status, isLoading: statusLoading } = useStatus();
  const { 
    nodes, 
    totalNodes, 
    onlineNodes, 
    peerCount,
    isLoading: nodesLoading, 
    error, 
    refresh 
  } = useNetworkNodes();

  if ((statusLoading || nodesLoading) && !status && nodes.length === 0) {
    return <PageSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <ErrorState 
          type="server" 
          message="Failed to load network data" 
          onRetry={refresh} 
        />
      </div>
    );
  }

  // Calculate stats from nodes
  const validators = nodes.filter(n => n.role === 'validator');
  const shadowVerifiers = nodes.filter(n => n.role === 'shadow_verifier');
  const onlineCount = nodes.filter(n => n.status === 'online').length;
  const avgUptime = nodes.length > 0
    ? nodes.reduce((sum, n) => sum + (n.uptime_percent ?? 0), 0) / nodes.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader />
        <Button variant="outline" onClick={refresh}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* KPI Grid */}
      <KpiGrid columns={4}>
        <KpiCard
          title="Total Nodes"
          value={totalNodes || nodes.length}
          icon={<Server className="h-4 w-4" />}
          loading={statusLoading}
        />
        
        <KpiCard
          title="Online Nodes"
          value={
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              {onlineNodes || onlineCount}
            </span>
          }
          subtitle={`${((onlineNodes || onlineCount) / (totalNodes || nodes.length || 1) * 100).toFixed(0)}% online`}
          icon={<Activity className="h-4 w-4" />}
          loading={nodesLoading}
        />
        
        <KpiCard
          title="Active Validators"
          value={status?.active_validators ?? validators.length}
          icon={<Users className="h-4 w-4" />}
          loading={statusLoading}
        />
        
        <KpiCard
          title="Shadow Verifiers"
          value={status?.shadow_verifiers ?? shadowVerifiers.length}
          icon={<Users className="h-4 w-4" />}
          loading={statusLoading}
        />
      </KpiGrid>

      {/* Network Health Banner */}
      <Card className={cn(
        'relative overflow-hidden',
        status?.health === 'healthy' && 'bg-green-500/5 border-green-500/20',
        status?.health === 'degraded' && 'bg-yellow-500/5 border-yellow-500/20',
        status?.health === 'unhealthy' && 'bg-red-500/5 border-red-500/20',
      )}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className={cn(
              'rounded-full p-3',
              status?.health === 'healthy' && 'bg-green-500/10',
              status?.health === 'degraded' && 'bg-yellow-500/10',
              status?.health === 'unhealthy' && 'bg-red-500/10',
              !status?.health && 'bg-gray-500/10',
            )}>
              <Network className={cn(
                'h-6 w-6',
                status?.health === 'healthy' && 'text-green-600',
                status?.health === 'degraded' && 'text-yellow-600',
                status?.health === 'unhealthy' && 'text-red-600',
                !status?.health && 'text-gray-600',
              )} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                Network Status: {' '}
                <span className={cn(
                  'capitalize',
                  status?.health === 'healthy' && 'text-green-600',
                  status?.health === 'degraded' && 'text-yellow-600',
                  status?.health === 'unhealthy' && 'text-red-600',
                )}>
                  {status?.health ?? 'Unknown'}
                </span>
              </h2>
              <p className="text-sm text-muted-foreground">
                {peerCount !== undefined && `${peerCount} peers connected • `}
                Average uptime: {avgUptime.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nodes Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Network Nodes</CardTitle>
          <CardDescription>
            All nodes participating in the network
          </CardDescription>
        </CardHeader>
        <CardContent>
          {nodesLoading && nodes.length === 0 ? (
            <TableSkeleton rows={10} columns={6} />
          ) : nodes.length === 0 ? (
            <EmptyState 
              title="No nodes found" 
              message="Network node information is not available." 
              icon={<Server className="h-6 w-6 text-muted-foreground" />}
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Node ID</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Uptime</TableHead>
                    <TableHead className="text-right">Participation</TableHead>
                    <TableHead>Last Seen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nodes.map((node) => (
                    <TableRow key={node.node_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'h-2 w-2 rounded-full',
                            statusColors[node.status]
                          )} />
                          <CopyableText 
                            value={node.node_id} 
                            display={node.node_id.length > 20 
                              ? `${node.node_id.slice(0, 8)}...${node.node_id.slice(-6)}`
                              : node.node_id}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={cn('capitalize', roleColors[node.role])}
                        >
                          {node.role.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant="outline" 
                          className={cn('capitalize', statusBadgeColors[node.status])}
                        >
                          {node.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {node.uptime_percent !== undefined 
                          ? `${node.uptime_percent.toFixed(1)}%`
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {node.participation_rate !== undefined 
                          ? `${(node.participation_rate * 100).toFixed(1)}%`
                          : '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {node.last_seen 
                          ? formatDistanceToNow(new Date(node.last_seen), { addSuffix: true })
                          : node.last_seen_timestamp
                            ? formatDistanceToNow(new Date(node.last_seen_timestamp), { addSuffix: true })
                            : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Node Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={roleColors.validator}>
                  Validator
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Active consensus participants that propose and vote on rounds. 
                Required for finality.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={roleColors.shadow_verifier}>
                  Shadow Verifier
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Independent verification nodes that replay and verify state 
                without participating in consensus.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PageHeader() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Network</h1>
      <p className="text-muted-foreground mt-1">
        Monitor network nodes and their participation
      </p>
    </div>
  );
}
