import prisma from '@/lib/prisma';

const WORKER_URL = process.env.WHATSAPP_WORKER_URL || 'http://localhost:3002';
const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL || 'http://localhost:3001';

export async function POST(request) {
  try {
    const { phone, orderNumber, code } = await request.json();

    let order;

    if (orderNumber && code) {
      order = await prisma.storeOrder.findFirst({
        where: { orderNumber, verificationCode: code, status: 'PENDING' },
        include: { product: true },
      });
    } else if (phone && code) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      order = await prisma.storeOrder.findFirst({
        where: {
          clientPhone: { contains: cleanPhone.slice(-9) },
          verificationCode: code,
          status: 'PENDING',
        },
        include: { product: true },
      });
    } else if (orderNumber) {
      order = await prisma.storeOrder.findFirst({
        where: { orderNumber, status: 'PENDING' },
        include: { product: true },
      });
    } else if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      order = await prisma.storeOrder.findFirst({
        where: {
          clientPhone: { contains: cleanPhone.slice(-9) },
          status: 'PENDING',
        },
        include: { product: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!order) {
      return Response.json({ success: false, error: 'No pending order found' }, { status: 404 });
    }

    await prisma.storeOrder.update({
      where: { id: order.id },
      data: { status: 'CONFIRMED' },
    });

    let jobId = null;
    let fwdClientId = null;

    try {
      const firstOwner = await prisma.owner.findFirst({ include: { workshop: true } });

      if (firstOwner) {
        let client = await prisma.client.findFirst({
          where: { phone: order.clientPhone },
        });

        if (!client) {
          client = await prisma.client.create({
            data: {
              ownerId: firstOwner.id,
              workshopId: firstOwner.workshop.id,
              name: order.clientName,
              phone: order.clientPhone,
              onboardedVia: 'WEB',
            },
          });
        }

        const job = await prisma.job.create({
          data: {
            ownerId: firstOwner.id,
            clientId: client.id,
            description: `[${order.product.name}] x ${order.quantity} - Store Order #${order.orderNumber}`,
            status: 'NEW',
          },
        });

        await prisma.storeOrder.update({
          where: { id: order.id },
          data: { jobId: job.id, clientId: client.id },
        });

        jobId = job.id;
        fwdClientId = client.id;
      }
    } catch (innerErr) {
      console.error('Client/job creation on confirm failed:', innerErr);
    }

    try {
      const confirmMsg = [
        `Murakoze cyane ${order.clientName}!`,
        '',
        `Ikomande #${order.orderNumber} yemejwe neza.`,
        `Igicuruzwa: ${order.product.name} x ${order.quantity}`,
        `Igiteranyo: ${order.totalPrice.toLocaleString()} RWF`,
        '',
        'Tugiye gutangukora. Tuzabamenyesha uko igenda itunganywa.',
        '',
        `*Furaha Furniture Shop* 🏪\nKurikirana: ${STORE_URL}/track?orderNumber=${order.orderNumber}`,
      ].join('\n');

      const sendPhone = order.clientPhone.replace(/[^0-9]/g, '');
      await fetch(`${WORKER_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: sendPhone, message: confirmMsg }),
      });
    } catch (waErr) {
      console.error('Confirmation WhatsApp send failed:', waErr);
    }

    return Response.json({
      success: true,
      orderNumber: order.orderNumber,
      jobId,
      clientId: fwdClientId,
    });
  } catch (err) {
    console.error('Order confirm error:', err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
