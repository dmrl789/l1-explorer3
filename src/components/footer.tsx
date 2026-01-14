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
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-xs text-slate-500">
            © 2026 IPPAN - All Rights Reserved.
          </p>
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
