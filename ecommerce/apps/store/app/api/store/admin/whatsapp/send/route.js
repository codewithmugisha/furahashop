import { verifyAdmin } from '@/lib/adminAuth';

const WORKER_URL = process.env.WHATSAPP_WORKER_URL || 'https://mwarimu-whatsapp.mugishaivanbright250.workers.dev';

export async function POST(request) {
  const auth = verifyAdmin(request);
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  try {
    const { phone, message } = await request.json();
    if (!phone || !message) {
      return Response.json({ error: 'phone and message are required' }, { status: 400 });
    }

    const res = await fetch(`${WORKER_URL}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message }),
    });

    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
