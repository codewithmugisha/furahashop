import prisma from '@/lib/prisma';
import { verifyAdmin } from '@/lib/adminAuth';

const R_STATUS = {
  CONFIRMED: 'Yemejwe',
  IN_PROGRESS: 'Irakorwa',
  READY: 'Irateze',
  DELIVERED: 'Yujujwe',
  CANCELLED: 'Yahagaritswe',
};

const R_DESC = {
  CONFIRMED: 'Ikomande yanyu yemejwe. Turi gutegura ibikoresho byo gutangiza akazi kuri komande yanyu.',
  IN_PROGRESS: 'Ikomande yanyu iri gukorwa. Dukorera ku bicuruzwa byanyu kandi tuzabamenyesha iyo birangiye.',
  READY: 'Ikomande yanyu irateze gutumizwa cyangwa gukururwa. Murabasha kuza kuyikuraho cyangwa turategereje amakuru y\'ubutumire.',
  DELIVERED: 'Ikomande yanyu yujujwe kandi yagezweho. Murakoze kutwizera kandi tubashimira ubufatanye bwanyu. Turabifurije umunsi mwiza.',
  CANCELLED: 'Ikomande yanyu yahagaritswe.',
};

const SHOP_NAME = 'Furaha Furniture Shop';
const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL || 'https://mwarimu.pages.dev';
const WORKER_URL = process.env.WHATSAPP_WORKER_URL || 'https://mwarimu-whatsapp.mugishaivanbright250.workers.dev';

async function sendStatusNotification(order, newStatus, cancelReason) {
  const desc = R_DESC[newStatus];
  const statusLabel = R_STATUS[newStatus];
  if (!desc || !statusLabel) return;

  const cancelLine = newStatus === 'CANCELLED' && cancelReason
    ? `\n\n Impamvu: ${cancelReason}` : '';

  const message = [
    `Muraho neza ${order.clientName},`,
    '',
    'Murakoze kuba umwe mu bakiliya bacu b\'ingenzi.',
    '',
    'Twifuje kubamenyesha ko hari impinduka ku komande yanyu.',
    '',
    `📦 Nimero ya Komande: ${order.orderNumber}`,
    `🪑 Igicuruzwa: ${order.product?.name || ''} x ${order.quantity}`,
    `📅 Itariki ya Komande: ${new Date(order.createdAt).toLocaleDateString('en-RW')}`,
    `🔄 Icyiciro Irimo: ${statusLabel}`,
    '',
    '📝 Ibisobanuro:',
    desc + cancelLine,
    '',
    'Turakomeza kubamenyesha uko komande yanyu igenda itunganywa kugeza igihe muyakiriye.',
    '',
    'Niba hari icyo mwifuza kutubaza cyangwa ubundi bufasha mukeneye, mwisanzure kutwandikira.',
    '',
    'Murakoze ku cyizere mudufitiye.',
    '',
    `*${SHOP_NAME}* 🏪\n${STORE_URL}\nKurikirana: ${STORE_URL}/track`,
  ].join('\n');

  const phone = order.clientPhone?.replace(/[^0-9]/g, '');
  if (!phone) return;

  try {
    await fetch(`${WORKER_URL}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message }),
    });
  } catch (err) {
    console.error('WhatsApp notification failed:', err);
  }
}

export async function PATCH(request, { params }) {
  const auth = verifyAdmin(request);
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });
  try {
    const { id } = params;
    const body = await request.json();
    const { status, cancelReason } = body;

    if (!status) {
      return Response.json({ error: 'Status is required' }, { status: 400 });
    }

    const validStatuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'READY', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return Response.json({ error: 'Invalid status' }, { status: 400 });
    }

    const order = await prisma.storeOrder.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    const prevStatus = order.status;

    const updateData = { status };
    if (status === 'CANCELLED' && cancelReason) {
      updateData.cancelReason = cancelReason;
    }

    if (status === 'DELIVERED' && order.paymentStatus === 'UNPAID') {
      updateData.paymentStatus = 'PAID';
      updateData.paidAt = new Date();
    }

    const updatedOrder = await prisma.storeOrder.update({
      where: { id },
      data: updateData,
    });

    if (status !== prevStatus) {
      sendStatusNotification(updatedOrder, status, cancelReason);
    }

    return Response.json({ data: updatedOrder });
  } catch (err) {
    console.error('Error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
