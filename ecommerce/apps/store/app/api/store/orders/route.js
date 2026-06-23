import prisma from '@/lib/prisma';

function normalizePhone(phone) {
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('250')) return '+' + cleaned;
  const withoutPrefix = cleaned.replace(/^0+/, '');
  return '+250' + withoutPrefix;
}

function generateOrderNumber() {
  const ts = Date.now().toString();
  const suffix = ts.slice(-6);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 3; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return 'FQ-' + suffix + rand;
}

function generateVerificationCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { productId, clientName, clientPhone, clientEmail, quantity, customNotes, deliveryMethod, deliveryAddress } = body;

    if (!productId || !clientName || !clientPhone) {
      return Response.json({ error: 'Missing required fields: productId, clientName, clientPhone' }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(clientPhone);
    const qty = quantity || 1;
    const orderNumber = generateOrderNumber();

    const product = await prisma.product.findUnique({ where: { id: productId } });

    if (!product || !product.isActive) {
      return Response.json({ error: 'Product not found or inactive' }, { status: 404 });
    }

    const totalPrice = product.price * qty;
    const verificationCode = generateVerificationCode();

    const order = await prisma.storeOrder.create({
      data: {
        orderNumber,
        productId: product.id,
        clientName,
        clientPhone: normalizedPhone,
        clientEmail: clientEmail || null,
        quantity: qty,
        unitPrice: product.price,
        totalPrice,
        verificationCode,
        customNotes: customNotes || null,
        deliveryMethod: deliveryMethod || 'PICKUP',
        deliveryAddress: deliveryAddress || null,
      },
    });

    // Job creation deferred until customer confirms via WhatsApp

    try {
      const WORKER_URL = process.env.WHATSAPP_WORKER_URL || 'http://localhost:3002';
      const message = [
        `Muraho ${clientName},`,
        '',
        'Murakoze kubika ikomande yanyu kuri Furaha Furniture Shop!',
        '',
        `📦 Nimero ya Komande: ${orderNumber}`,
        `🪑 Igicuruzwa: ${product.name}`,
        `🔢 Ubwinshi: ${qty}`,
        `💰 Igiteranyo: ${totalPrice.toLocaleString()} RWF`,
        `📅 Itaragereranyo: ${product.estimatedDays || '2-5'} iminsi`,
        '',
        `Kode yo kwemeza: ${verificationCode}`,
        '',
        `Kanda hano ukoreze: ${process.env.STORE_URL || 'http://localhost:3001'}/confirm?code=${verificationCode}&order=${orderNumber}`,
        '',
        'Cyangwa subiza ubu butumwa ukanjye kode yanditswe harugongo ukoreze ikomande yawe.',
        '',
        'Niba hari ikibazo, muduhamagara kuri telephone 0793100072.',
        '',
        `*Furaha Furniture Shop* 🏪`,
      ].join('\n');

      const phone = normalizedPhone.replace(/[^0-9]/g, '');
      await fetch(`${WORKER_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message }),
      });
    } catch (waErr) {
      console.error('Order WhatsApp notification failed:', waErr);
    }

    return Response.json({
      data: {
        success: true,
        orderNumber,
        verificationCode,
        estimatedDays: product.estimatedDays,
      },
    }, { status: 201 });
  } catch (err) {
    console.error('Error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
