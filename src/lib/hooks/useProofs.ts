'use client';

import useSWR from 'swr';
import {
  getProofFinality,
  getProofDlcFinality,
  getProofBuild,
  getProofPipeline,
  getProofPerf,
  getProofSizing,
  getFinalityCertificate,
  getFinalityProofBundle,
  type ProofFinality,
  type ProofDlcFinality,
  type ProofBuild,
  type ProofPipeline,
  type ProofPerf,
  type ProofSizing,
  type FinalityCertificate,
  type FinalityProofBundle,
} from '../api';

const PROOF_REFRESH_INTERVAL = 3000; // 3 seconds

export function useProofFinality() {
  const { data, error, isLoading, mutate } = useSWR<ProofFinality | null>(
    'proof/finality',
    () => getProofFinality(),
    { refreshInterval: PROOF_REFRESH_INTERVAL, dedupingInterval: 3000 }
  );
  return { proof: data ?? null, isLoading, error, refresh: () => mutate() };
}

export function useProofDlcFinality() {
  const { data, error, isLoading, mutate } = useSWR<ProofDlcFinality | null>(
    'proof/dlc_finality',
    () => getProofDlcFinality(),
    { refreshInterval: PROOF_REFRESH_INTERVAL, dedupingInterval: 3000 }
  );
  return { proof: data ?? null, isLoading, error, refresh: () => mutate() };
}

export function useProofBuild() {
  const { data, error, isLoading, mutate } = useSWR<ProofBuild | null>(
    'proof/build',
    () => getProofBuild(),
    { refreshInterval: PROOF_REFRESH_INTERVAL, dedupingInterval: 3000 }
  );
  return { proof: data ?? null, isLoading, error, refresh: () => mutate() };
}

export function useProofPipeline() {
  const { data, error, isLoading, mutate } = useSWR<ProofPipeline | null>(
    'proof/pipeline',
    () => getProofPipeline(),
    { refreshInterval: PROOF_REFRESH_INTERVAL, dedupingInterval: 3000 }
  );
  return { proof: data ?? null, isLoading, error, refresh: () => mutate() };
}

export function useProofPerf() {
  const { data, error, isLoading, mutate } = useSWR<ProofPerf | null>(
    'proof/perf',
    () => getProofPerf(),
    { refreshInterval: PROOF_REFRESH_INTERVAL, dedupingInterval: 3000 }
  );
  return { proof: data ?? null, isLoading, error, refresh: () => mutate() };
}

export function useProofSizing() {
  const { data, error, isLoading, mutate } = useSWR<ProofSizing | null>(
    'proof/sizing',
    () => getProofSizing(),
    { refreshInterval: PROOF_REFRESH_INTERVAL, dedupingInterval: 3000 }
  );
  return { proof: data ?? null, isLoading, error, refresh: () => mutate() };
}

export function useFinalityCertificate(blockId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<FinalityCertificate | null>(
    blockId ? ['finality-certificate', blockId] : null,
    () => getFinalityCertificate(blockId!),
    { refreshInterval: PROOF_REFRESH_INTERVAL, dedupingInterval: 3000 }
  );

  return { certificate: data ?? null, isLoading, error, refresh: () => mutate() };
}

export function useFinalityProofBundle(kind: 'block' | 'tx', id: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<FinalityProofBundle | null>(
    id ? ['finality-proof-bundle', kind, id] : null,
    () => getFinalityProofBundle(kind, id!),
    { refreshInterval: PROOF_REFRESH_INTERVAL, dedupingInterval: 3000 }
  );

  return { bundle: data ?? null, isLoading, error, refresh: () => mutate() };
}
