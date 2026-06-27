import prisma from '@/lib/prisma';
import { verifyAdmin } from '@/lib/adminAuth';

const WORKER_URL = process.env.WHATSAPP_WORKER_URL || 'https://mwarimu-whatsapp.mugishaivanbright250.workers.dev';

export async function POST(request, { params }) {
  const auth = verifyAdmin(request);
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  try {
    const { id } = params;
    const { message, force } = await request.json();

    if (!message) {
      return Response.json({ error: 'message is required' }, { status: 400 });
    }

    const order = await prisma.storeOrder.findUnique({ where: { id } });
    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.lastInvoiceSentAt && !force) {
      return Response.json({
        alreadySent: true,
        lastSentAt: order.lastInvoiceSentAt,
      });
    }

    const phone = order.clientPhone?.replace(/[^0-9]/g, '');
    if (!phone) {
      return Response.json({ error: 'Client has no phone number' }, { status: 400 });
    }

    const res = await fetch(`${WORKER_URL}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return Response.json({ error: err.error || 'Failed to send WhatsApp' }, { status: 502 });
    }

    await prisma.storeOrder.update({
      where: { id },
      data: { lastInvoiceSentAt: new Date() },
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error('send-invoice error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
