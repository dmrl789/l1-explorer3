'use client';

import { ContactForm } from './contact-form';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { getApiBase } from '@/lib/env';

export function Footer() {
  const apiBase = getApiBase();
  const upstreams =
    (process.env.UPSTREAM_V1_BASES ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean) || [];
  const upstream =
    upstreams[0] ??
    process.env.NEXT_PUBLIC_UPSTREAM_RPC_BASE ??
    process.env.UPSTREAM_RPC_BASE ??
    "https://gateway.ippan.net";

  return (
    <footer className="border-t border-slate-700/30 bg-[#151c28]">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 lg:px-8 lg:py-12">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="text-xs text-slate-500">© 2026 IPPAN - All Rights Reserved.</p>
            <p className="mt-1 text-[11px] text-slate-600">
              API base: <code className="font-mono">{apiBase === '' ? '(same-origin)' : apiBase}</code>
              {' · '}
              upstream: <code className="font-mono">{upstream}</code>
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                type="button"
                className="bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/25 hover:border-emerald-500/40"
              >
                Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#151c28] border border-slate-700/50 text-slate-100">
              <DialogHeader>
                <DialogTitle>Get in Touch</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Have questions about IPPAN? We&apos;d love to hear from you.
                </DialogDescription>
              </DialogHeader>
              <ContactForm showHeader={false} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </footer>
  );
}
