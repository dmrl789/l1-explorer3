import { NextRequest, NextResponse } from 'next/server';

const CONTACT_EMAIL = 'ippanlabs@gmail.com';

// Rate limiting - simple in-memory store (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 5; // 5 requests per minute

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  return ip;
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now - record.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(key, { count: 1, timestamp: now });
    return false;
  }

  if (record.count >= MAX_REQUESTS) {
    return true;
  }

  record.count++;
  return false;
}

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

function validateFormData(data: unknown): data is ContactFormData {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  
  return (
    typeof obj.name === 'string' &&
    obj.name.trim().length > 0 &&
    obj.name.length <= 100 &&
    typeof obj.email === 'string' &&
    obj.email.includes('@') &&
    obj.email.length <= 254 &&
    typeof obj.message === 'string' &&
    obj.message.trim().length > 0 &&
    obj.message.length <= 5000
  );
}

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const rateLimitKey = getRateLimitKey(request);
    if (isRateLimited(rateLimitKey)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    
    if (!validateFormData(body)) {
      return NextResponse.json(
        { error: 'Invalid form data. Please check all fields.' },
        { status: 400 }
      );
    }

    const { name, email, message } = body;

    // Option 1: Use Formspree (if FORMSPREE_ID is set)
    const formspreeId = process.env.FORMSPREE_ID;
    if (formspreeId) {
      const response = await fetch(`https://formspree.io/f/${formspreeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          message,
          _replyto: email,
          _subject: `IPPAN Explorer Contact: ${name}`,
        }),
      });

      if (!response.ok) {
        console.error('Formspree error:', await response.text());
        throw new Error('Failed to send via Formspree');
      }

      return NextResponse.json({ success: true });
    }

    // Option 2: Use Web3Forms (if ACCESS_KEY is set)
    const web3formsKey = process.env.WEB3FORMS_ACCESS_KEY;
    if (web3formsKey) {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          access_key: web3formsKey,
          name,
          email,
          message,
          subject: `IPPAN Explorer Contact: ${name}`,
          from_name: 'IPPAN Explorer',
          to: CONTACT_EMAIL,
        }),
      });

      if (!response.ok) {
        console.error('Web3Forms error:', await response.text());
        throw new Error('Failed to send via Web3Forms');
      }

      return NextResponse.json({ success: true });
    }

    // Option 3: Use SendGrid (if API key is set)
    const sendgridKey = process.env.SENDGRID_API_KEY;
    if (sendgridKey) {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sendgridKey}`,
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: CONTACT_EMAIL }] }],
          from: { email: 'noreply@ippan.net', name: 'IPPAN Explorer' },
          reply_to: { email, name },
          subject: `IPPAN Explorer Contact: ${name}`,
          content: [
            {
              type: 'text/plain',
              value: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        console.error('SendGrid error:', await response.text());
        throw new Error('Failed to send via SendGrid');
      }

      return NextResponse.json({ success: true });
    }

    // Fallback: Log the message (for development/demo purposes)
    // In production, ensure one of the above services is configured
    console.log('='.repeat(50));
    console.log('CONTACT FORM SUBMISSION');
    console.log('='.repeat(50));
    console.log(`To: ${CONTACT_EMAIL}`);
    console.log(`From: ${name} <${email}>`);
    console.log(`Message: ${message}`);
    console.log('='.repeat(50));
    console.log('\nNote: Configure FORMSPREE_ID, WEB3FORMS_ACCESS_KEY, or SENDGRID_API_KEY to enable email delivery');

    // For demo purposes, we'll return success even without email configuration
    return NextResponse.json({ 
      success: true,
      note: 'Email service not configured. Message logged to console.'
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to send message. Please try again.' },
      { status: 500 }
    );
  }
}
