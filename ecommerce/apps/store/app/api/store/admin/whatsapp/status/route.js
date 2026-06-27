const WORKER_URL = process.env.WHATSAPP_WORKER_URL || 'https://mwarimu-whatsapp.mugishaivanbright250.workers.dev';

export async function GET() {
  try {
    const res = await fetch(`${WORKER_URL}/status`);
    const data = await res.json();
    return Response.json(data);
  } catch {
    return Response.json({ ready: false, hasQr: false, error: 'Worker unreachable' });
  }
}
