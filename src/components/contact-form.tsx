'use client';

import { useState, FormEvent } from 'react';
import Image from 'next/image';
import { Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface FormData {
  name: string;
  email: string;
  message: string;
}

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

interface ContactFormProps {
  showHeader?: boolean;
}

export function ContactForm({ showHeader = true }: ContactFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: '',
  });
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send message');
      }

      setStatus('success');
      setFormData({ name: '', email: '', message: '' });
      
      // Reset success state after 5 seconds
      setTimeout(() => setStatus('idle'), 5000);
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send message. Please try again.');
      
      // Reset error state after 5 seconds
      setTimeout(() => {
        setStatus('idle');
        setErrorMessage('');
      }, 5000);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isDisabled = status === 'submitting' || status === 'success';

  return (
    <div className="w-full">
      {showHeader && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-100">Get in Touch</h3>
          <p className="text-sm text-slate-400 mt-1">
            Have questions about IPPAN? We&apos;d love to hear from you.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-xs font-medium text-slate-400 mb-1.5">
              Name
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Your name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isDisabled}
              className="bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-slate-400 mb-1.5">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isDisabled}
              className="bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        <div>
          <label htmlFor="message" className="block text-xs font-medium text-slate-400 mb-1.5">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            placeholder="Your message..."
            value={formData.message}
            onChange={handleChange}
            required
            disabled={isDisabled}
            rows={4}
            className={cn(
              "w-full rounded-lg px-3 py-2 text-sm resize-none",
              "bg-slate-800/50 border border-slate-700/50 text-slate-200",
              "placeholder:text-slate-500",
              "focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          />
        </div>

        {/* Status Messages */}
        {status === 'success' && (
          <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <span>Message sent successfully! We&apos;ll get back to you soon.</span>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <Button
          type="submit"
          disabled={isDisabled}
          className="w-full sm:w-auto bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/25 hover:border-emerald-500/40"
        >
          {status === 'submitting' ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : status === 'success' ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Sent!
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </>
          )}
        </Button>

        <a
          href="https://formspree.io"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition"
        >
          <Image
            src="/formspree-mark.svg"
            alt="Formspree logo mark"
            width={16}
            height={16}
            className="h-4 w-4"
          />
          <span>Formspree</span>
        </a>
      </form>
    </div>
  );
}
