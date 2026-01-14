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

export function Footer() {
  return (
    <footer className="border-t border-slate-700/30 bg-[#151c28]">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 lg:px-8 lg:py-12">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-between sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg border border-purple-500/20 bg-purple-500/20 text-sm font-bold text-purple-400">
              AI
            </div>
            <div className="leading-tight">
              <div className="text-base font-semibold tracking-tight text-slate-100">IPPAN Explorer</div>
              <div className="text-[11px] font-medium text-slate-500">DevNet</div>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            © 2026 IPPAN. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Network Live
            </span>
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
