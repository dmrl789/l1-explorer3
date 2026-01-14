'use client';

import Link from 'next/link';
import { ContactForm } from './contact-form';

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/primitives', label: 'Primitives' },
  { href: '/rounds', label: 'Rounds' },
  { href: '/blocks', label: 'Blocks' },
  { href: '/tx', label: 'Transactions' },
  { href: '/network', label: 'Network' },
  { href: '/audit', label: 'Audit' },
  { href: '/evidence', label: 'Evidence' },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-700/30 bg-[#151c28]">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 lg:px-8 lg:py-16">
        {/* Main Footer Content */}
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left Column - About & Navigation */}
          <div className="space-y-8">
            {/* Logo & Description */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-purple-500/20 text-purple-400 font-bold text-sm border border-purple-500/20">
                  AI
                </div>
                <div className="leading-tight">
                  <div className="text-base font-semibold tracking-tight text-slate-100">IPPAN Explorer</div>
                  <div className="text-[11px] text-slate-500 font-medium">DevNet</div>
                </div>
              </div>
              <p className="text-sm text-slate-400 max-w-md leading-relaxed">
                L1 DevNet Explorer — HashTimer™ ordering, IPPAN Time, and deterministic finality. 
                Experience institutional-grade blockchain infrastructure with complete transparency.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
                Quick Links
              </h4>
              <nav className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-sm text-slate-400 hover:text-emerald-400 transition-colors py-1"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* External Links */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <a 
                href="https://ippan.net" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
              >
                ippan.net
              </a>
              <span className="text-slate-700">·</span>
              <span className="text-slate-500">DevNet</span>
            </div>
          </div>

          {/* Right Column - Contact Form */}
          <div className="lg:pl-8 lg:border-l lg:border-slate-700/30">
            <ContactForm />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-8 border-t border-slate-700/30">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <p className="text-xs text-slate-500">
              © 2026 IPPAN. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span>Powered by HashTimer™</span>
              <span className="text-slate-700">·</span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Network Live
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
