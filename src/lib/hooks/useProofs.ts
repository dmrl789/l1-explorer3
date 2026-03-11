'use client';

import useSWR from 'swr';
import {
  getProofFinality,
  getProofDlcFinality,
  getProofBuild,
  getProofPipeline,
  getProofPerf,
  getProofSizing,
  type ProofFinality,
  type ProofDlcFinality,
  type ProofBuild,
  type ProofPipeline,
  type ProofPerf,
  type ProofSizing,
} from '../api';

const PROOF_REFRESH_INTERVAL = 5000; // 5 seconds

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
    { refreshInterval: 30000, dedupingInterval: 10000 }
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
    { refreshInterval: 10000, dedupingInterval: 5000 }
  );
  return { proof: data ?? null, isLoading, error, refresh: () => mutate() };
}
