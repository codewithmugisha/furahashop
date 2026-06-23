import prisma from '@/lib/prisma';
import { verifyAdmin } from '@/lib/adminAuth';

const WORKER_URL = process.env.WHATSAPP_WORKER_URL || 'http://localhost:3002';

export async function PATCH(request, { params }) {
  const auth = verifyAdmin(request);
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });
  try {
    const { id } = params;
    const body = await request.json();
    const { paymentStatus, depositAmount } = body;

    if (!paymentStatus || !['UNPAID', 'DEPOSIT', 'PAID'].includes(paymentStatus)) {
      return Response.json({ error: 'Invalid payment status. Use UNPAID, DEPOSIT, or PAID' }, { status: 400 });
    }

    const updateData = { paymentStatus };
    if (paymentStatus === 'PAID') {
      updateData.paidAt = new Date();
      updateData.depositAmount = null;
    } else if (paymentStatus === 'DEPOSIT') {
      updateData.depositAmount = depositAmount ? parseFloat(depositAmount) : null;
      updateData.paidAt = null;
    } else {
      updateData.depositAmount = null;
      updateData.paidAt = null;
    }

    const order = await prisma.storeOrder.update({
      where: { id },
      data: updateData,
      include: { product: true },
    });

    try {
      const label = paymentStatus === 'PAID' ? 'Cyishuwe' : paymentStatus === 'DEPOSIT' ? 'Amafaranga y\'imbere' : 'Ntacyishuwe';
      const depositLine = paymentStatus === 'DEPOSIT' ? `\n💳 Amafaranga y'imbere: ${depositAmount || 0} RWF` : '';
      const remaining = paymentStatus === 'DEPOSIT' ? `\n💵 Abasigaye: ${(order.totalPrice - (depositAmount || 0)).toLocaleString()} RWF` : '';

      const msg = [
        `Muraho ${order.clientName},`,
        '',
        'Hari impinduka ku mishahara ya Komande yanyu.',
        '',
        `📦 Nimero ya Komande: ${order.orderNumber}`,
        `🪑 Igicuruzwa: ${order.product?.name || ''} x ${order.quantity}`,
        `💳 Ubwishyu: ${label}`,
        depositLine,
        remaining,
        `💰 Igiteranyo: ${order.totalPrice.toLocaleString()} RWF`,
        '',
        'Murakoze!',
        '',
        `*Furaha Furniture Shop* 🏪`,
      ].join('\n');

      const phone = order.clientPhone?.replace(/[^0-9]/g, '');
      if (phone) {
        await fetch(`${WORKER_URL}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, message: msg }),
        });
      }
    } catch (waErr) {
      console.error('Payment WhatsApp notification failed:', waErr);
    }

    return Response.json({ data: order });
  } catch (err) {
    console.error('Error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
