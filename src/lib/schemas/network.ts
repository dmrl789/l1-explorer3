import { z } from 'zod';

/**
 * Schema for network nodes
 */
export const NodeStatusSchema = z.enum(['online', 'offline', 'syncing', 'unknown']);

export const NodeRoleSchema = z.enum(['validator', 'shadow_verifier', 'full_node', 'observer', 'unknown']);

export const NetworkNodeSchema = z.object({
  node_id: z.string(),
  role: NodeRoleSchema.optional().default('unknown'),
  status: NodeStatusSchema.optional().default('unknown'),
  uptime_percent: z.number().optional(),
  uptime_seconds: z.number().optional(),
  participation_rate: z.number().optional(),
  last_seen: z.string().optional(),
  last_seen_timestamp: z.number().optional(),
  version: z.string().optional(),
  address: z.string().optional(),
  region: z.string().optional(),
  rounds_participated: z.number().optional(),
  blocks_proposed: z.number().optional(),
});

export const NetworkNodesResponseSchema = z.object({
  nodes: z.array(NetworkNodeSchema),
  total_nodes: z.number().optional(),
  online_nodes: z.number().optional(),
  peer_count: z.number().optional(),
});

export type NodeStatus = z.infer<typeof NodeStatusSchema>;
export type NodeRole = z.infer<typeof NodeRoleSchema>;
export type NetworkNode = z.infer<typeof NetworkNodeSchema>;
export type NetworkNodesResponse = z.infer<typeof NetworkNodesResponseSchema>;

/**
 * Normalize network nodes response
 */
export function normalizeNetworkNodes(raw: unknown): NetworkNodesResponse {
  const data = raw as Record<string, unknown>;
  
  // Handle array response
  if (Array.isArray(data)) {
    const normalizedNodes = data.map(normalizeNode);
    return {
      nodes: normalizedNodes,
      total_nodes: normalizedNodes.length,
      online_nodes: normalizedNodes.filter((n) => n.status === 'online' || n.status === 'syncing').length,
    };
  }
  
  // Handle object with nodes array
  const nodesRaw = data.nodes ?? data.validators ?? data.peers ?? data.items ?? [];
  const nodes = Array.isArray(nodesRaw) ? nodesRaw.map(normalizeNode) : [];
  
  return {
    nodes,
    total_nodes: (data.total_nodes ?? data.total ?? nodes.length) as number | undefined,
    online_nodes: (data.online_nodes ?? data.online) as number | undefined,
    peer_count: (data.peer_count ?? data.peers) as number | undefined,
  };
}

function normalizeNode(raw: unknown): NetworkNode {
  const data = raw as Record<string, unknown>;
  
  // Handle is_connected boolean field from IPPAN API
  const isConnected = data.is_connected;
  const statusStr = String(data.status ?? data.state ?? '').toLowerCase();
  let status: NodeStatus = 'unknown';
  
  // Check is_connected first (IPPAN API format)
  if (isConnected === true) {
    status = 'online';
  } else if (isConnected === false) {
    status = 'offline';
  } else if (statusStr === 'online' || statusStr === 'up' || statusStr === 'active' || statusStr === 'connected') {
    status = 'online';
  } else if (statusStr === 'offline' || statusStr === 'down' || statusStr === 'inactive' || statusStr === 'disconnected') {
    status = 'offline';
  } else if (statusStr === 'syncing' || statusStr === 'synchronizing' || statusStr === 'catching_up') {
    status = 'syncing';
  }
  
  const roleStr = String(data.role ?? data.type ?? '').toLowerCase();
  let role: NodeRole = 'unknown';
  
  if (roleStr.includes('validator')) {
    role = 'validator';
  } else if (roleStr.includes('shadow') || roleStr.includes('verifier')) {
    role = 'shadow_verifier';
  } else if (roleStr.includes('full')) {
    role = 'full_node';
  } else if (roleStr.includes('observer') || roleStr.includes('light')) {
    role = 'observer';
  }
  
  return {
    node_id: String(data.node_id ?? data.id ?? data.address ?? data.peer_id ?? ''),
    role,
    status,
    uptime_percent: (data.uptime_percent ?? data.uptime) as number | undefined,
    uptime_seconds: data.uptime_seconds as number | undefined,
    participation_rate: (data.participation_rate ?? data.participation) as number | undefined,
    last_seen: (data.last_seen ?? data.lastSeen ?? data.last_activity) as string | undefined,
    last_seen_timestamp: data.last_seen_timestamp as number | undefined,
    version: data.version as string | undefined,
    address: (data.address ?? data.ip ?? data.endpoint) as string | undefined,
    region: data.region as string | undefined,
    rounds_participated: (data.rounds_participated ?? data.rounds) as number | undefined,
    blocks_proposed: (data.blocks_proposed ?? data.blocks) as number | undefined,
  };
}
