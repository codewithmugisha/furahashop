import prisma from '@/lib/prisma';
import { verifyAdmin } from '@/lib/adminAuth';

const currencyFormatter = new Intl.NumberFormat('en-RW', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
function fmt(n) { return currencyFormatter.format(n || 0); }

export async function GET(request) {
  const auth = verifyAdmin(request);
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });
  try {
    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '12', 10);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const rangeStart = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      inProgressOrders,
      readyOrders,
      deliveredOrders,
      cancelledOrders,
      revenueResult,
      thisMonthOrders,
      lastMonthOrders,
      todayOrders,
      topProducts,
      recentOrders,
      statusBreakdown,
      allYearOrders,
      unaccountedProducts,
    ] = await Promise.all([
      prisma.storeOrder.count(),
      prisma.storeOrder.count({ where: { status: 'PENDING' } }),
      prisma.storeOrder.count({ where: { status: 'CONFIRMED' } }),
      prisma.storeOrder.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.storeOrder.count({ where: { status: 'READY' } }),
      prisma.storeOrder.count({ where: { status: 'DELIVERED' } }),
      prisma.storeOrder.count({ where: { status: 'CANCELLED' } }),
      prisma.storeOrder.aggregate({
        where: { status: 'DELIVERED' },
        _sum: { totalPrice: true },
      }),
      prisma.storeOrder.findMany({
        where: { createdAt: { gte: thisMonthStart }, status: 'DELIVERED' },
        select: { totalPrice: true },
      }),
      prisma.storeOrder.findMany({
        where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart }, status: 'DELIVERED' },
        select: { totalPrice: true },
      }),
      prisma.storeOrder.findMany({
        where: { createdAt: { gte: todayStart } },
        select: { id: true, totalPrice: true, status: true },
      }),
      prisma.storeOrder.groupBy({
        by: ['productId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
      prisma.storeOrder.findMany({
        include: {
          product: {
            include: {
              images: { orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }], take: 1 },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.storeOrder.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.storeOrder.findMany({
        where: { createdAt: { gte: rangeStart } },
        select: { totalPrice: true, status: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.product.findMany({
        where: {
          description: '',
          createdAt: { gte: thirtyDaysAgo },
          isActive: true,
          images: { none: {} },
        },
        select: { id: true, name: true, slug: true, price: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    const thisMonthRevenue = thisMonthOrders.reduce((s, o) => s + o.totalPrice, 0);
    const lastMonthRevenue = lastMonthOrders.reduce((s, o) => s + o.totalPrice, 0);
    const growth = lastMonthRevenue > 0 ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : 0;

    const todayDelivered = todayOrders.filter(o => o.status === 'DELIVERED');
    const todayRevenue = todayDelivered.reduce((s, o) => s + o.totalPrice, 0);

    const unpaidDelivered = await prisma.storeOrder.count({
      where: { status: 'DELIVERED', paymentStatus: { not: 'PAID' } },
    });

    const topProductIds = topProducts.map((tp) => tp.productId);
    let topProductsWithDetails = [];
    if (topProductIds.length > 0) {
      const products = await prisma.product.findMany({
        where: { id: { in: topProductIds } },
        include: {
          images: { orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }], take: 1 },
        },
      });
      const productMap = {};
      for (const p of products) {
        productMap[p.id] = p;
      }
      topProductsWithDetails = topProducts.map((tp) => ({
        product: productMap[tp.productId] || null,
        orderCount: tp._count.id,
      }));
    }

    const statusCounts = {};
    for (const s of statusBreakdown) statusCounts[s.status] = s._count.id;

    const monthlyMap = {};
    for (let i = 0; i < months; i++) {
      const d = new Date(rangeStart.getFullYear(), rangeStart.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[key] = { month: key, revenue: 0, orders: 0, delivered: 0 };
    }
    for (const o of allYearOrders) {
      const key = `${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap[key]) {
        monthlyMap[key].orders += 1;
        if (o.status === 'DELIVERED') { monthlyMap[key].revenue += o.totalPrice; monthlyMap[key].delivered += 1; }
      }
    }

    return Response.json({
      data: {
        totalOrders,
        monthlyHistory: Object.values(monthlyMap),
        pendingOrders,
        confirmedOrders,
        inProgressOrders,
        readyOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue: revenueResult._sum.totalPrice || 0,
        thisMonthRevenue,
        lastMonthRevenue,
        growth,
        today: { revenue: todayRevenue, revenueFormatted: fmt(todayRevenue), orders: todayOrders.length },
        unpaidDelivered,
        statusBreakdown: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
        topProducts: topProductsWithDetails,
        recentOrders: recentOrders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          clientName: o.clientName,
          clientPhone: o.clientPhone,
          quantity: o.quantity,
          totalPrice: o.totalPrice,
          status: o.status,
          paymentStatus: o.paymentStatus,
          deliveryMethod: o.deliveryMethod,
          createdAt: o.createdAt,
          product: {
            id: o.product.id,
            name: o.product.name,
            slug: o.product.slug,
            primaryImage: o.product.images[0] || null,
          },
        })),
        unaccountedProducts: unaccountedProducts.map(p => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: p.price,
          createdAt: p.createdAt,
        })),
      },
    });
  } catch (err) {
    console.error('Error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
