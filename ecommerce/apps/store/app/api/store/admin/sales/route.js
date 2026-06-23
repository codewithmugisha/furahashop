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
    const typeFilter = searchParams.get('type'); // 'DAILY_SALE', 'ORDER', or null (all)

    const since = new Date();
    since.setMonth(since.getMonth() - months);
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const baseWhere = typeFilter ? { createdAt: { gte: since }, orderType: typeFilter } : { createdAt: { gte: since } };
    const thisMonthWhere = typeFilter ? { createdAt: { gte: thisMonthStart }, orderType: typeFilter } : { createdAt: { gte: thisMonthStart } };
    const lastMonthWhere = typeFilter ? { createdAt: { gte: lastMonthStart, lt: thisMonthStart }, orderType: typeFilter } : { createdAt: { gte: lastMonthStart, lt: thisMonthStart } };
    const todayWhere = typeFilter ? { createdAt: { gte: todayStart }, orderType: typeFilter } : { createdAt: { gte: todayStart } };

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      allOrders,
      thisMonthOrders,
      lastMonthOrders,
      todayOrders,
      statusBreakdown,
      paymentStats,
      topProductsData,
      productOrderData,
      clientData,
      storeClients,
      dailySaleOrders,
      regularOrders,
      unaccountedProducts,
    ] = await Promise.all([
      prisma.storeOrder.findMany({
        where: baseWhere,
        orderBy: { createdAt: 'asc' },
        include: {
          product: { select: { id: true, name: true, slug: true, price: true } },
        },
      }),
      prisma.storeOrder.findMany({
        where: thisMonthWhere,
        include: {
          product: { select: { id: true, name: true, slug: true, priceTierId: true, productTypeId: true } },
        },
      }),
      prisma.storeOrder.findMany({
        where: lastMonthWhere,
        include: {
          product: { select: { id: true, name: true, slug: true, priceTierId: true, productTypeId: true } },
        },
      }),
      prisma.storeOrder.findMany({
        where: todayWhere,
        select: { id: true, totalPrice: true, status: true, orderType: true },
      }),
      prisma.storeOrder.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.storeOrder.groupBy({
        by: ['paymentStatus'],
        _count: { id: true },
        _sum: { totalPrice: true },
        where: { orderType: 'ORDER' },
      }),
      prisma.storeOrder.groupBy({
        by: ['productId'],
        _count: { id: true },
        _sum: { totalPrice: true },
        orderBy: { _count: { id: 'desc' } },
        take: 20,
      }),
      prisma.storeOrder.groupBy({
        by: ['productId'],
        _max: { createdAt: true },
        _count: { id: true },
        _sum: { totalPrice: true },
      }),
      prisma.storeOrder.groupBy({
        by: ['clientPhone', 'clientName'],
        _count: { id: true },
        _sum: { totalPrice: true },
        _max: { createdAt: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      prisma.storeClient.findMany({
        orderBy: { createdAt: 'desc' },
        include: { orders: { select: { totalPrice: true, createdAt: true, status: true, paymentStatus: true } } },
      }),
      prisma.storeOrder.findMany({
        where: { createdAt: { gte: since }, orderType: 'DAILY_SALE' },
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true, slug: true, price: true } },
        },
        take: 50,
      }),
      prisma.storeOrder.findMany({
        where: { createdAt: { gte: since }, orderType: 'ORDER' },
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true, slug: true, price: true } },
        },
        take: 50,
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

    // ===== SECTION 1: Overview =====
    const thisMonthDelivered = thisMonthOrders.filter(o => o.status === 'DELIVERED');
    const lastMonthDelivered = lastMonthOrders.filter(o => o.status === 'DELIVERED');
    const thisMonthRevenue = thisMonthDelivered.reduce((s, o) => s + o.totalPrice, 0);
    const lastMonthRevenue = lastMonthDelivered.reduce((s, o) => s + o.totalPrice, 0);

    const tierIds = [...new Set(thisMonthOrders.map(o => o.product?.priceTierId).filter(Boolean))];
    const typeIds = [...new Set(thisMonthOrders.map(o => o.product?.productTypeId).filter(Boolean))];
    const [tiers, types] = await Promise.all([
      tierIds.length ? prisma.priceTier.findMany({ where: { id: { in: tierIds } }, select: { id: true, name: true, slug: true } }) : [],
      typeIds.length ? prisma.productType.findMany({ where: { id: { in: typeIds } }, select: { id: true, name: true, slug: true } }) : [],
    ]);
    const tierMap = {}; for (const t of tiers) tierMap[t.id] = t;
    const typeMap = {}; for (const t of types) typeMap[t.id] = t;

    const revenueByTier = {};
    const revenueByType = {};
    for (const o of thisMonthDelivered) {
      const tid = o.product?.priceTierId;
      if (tid) {
        const name = tierMap[tid]?.name || 'Unknown';
        revenueByTier[name] = (revenueByTier[name] || 0) + o.totalPrice;
      }
      const pid = o.product?.productTypeId;
      if (pid) {
        const name = typeMap[pid]?.name || 'Unknown';
        revenueByType[name] = (revenueByType[name] || 0) + o.totalPrice;
      }
    }

    const totalDeliveredRevenue = allOrders.filter(o => o.status === 'DELIVERED').reduce((s, o) => s + o.totalPrice, 0);
    const totalDelivered = allOrders.filter(o => o.status === 'DELIVERED').length;
    const avgOrderValue = totalDelivered > 0 ? totalDeliveredRevenue / totalDelivered : 0;

    const todayDelivered = todayOrders.filter(o => o.status === 'DELIVERED');
    const todayRevenue = todayDelivered.reduce((s, o) => s + o.totalPrice, 0);

    const growth = lastMonthRevenue > 0 ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : 0;

    const statusCounts = {};
    for (const s of statusBreakdown) statusCounts[s.status] = s._count.id;

    const ordersOnly = allOrders.filter(o => o.orderType === 'ORDER');
    const unpaidDelivered = ordersOnly.filter(o => o.status === 'DELIVERED' && o.paymentStatus !== 'PAID').length;

    // ===== SECTION 2: Orders & Payments =====
    const outstandingAmount = ordersOnly
      .filter(o => o.paymentStatus !== 'PAID')
      .reduce((s, o) => s + o.totalPrice - (o.paymentStatus === 'DEPOSIT' ? (o.depositAmount || 0) : 0), 0);

    // ===== SECTION 3: Monthly History =====
    const monthlyMap = {};
    for (let i = 0; i < months; i++) {
      const d = new Date(since.getFullYear(), since.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[key] = { month: key, orders: 0, revenue: 0, delivered: 0 };
    }
    for (const o of allOrders) {
      const key = `${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap[key]) {
        monthlyMap[key].orders += 1;
        if (o.status === 'DELIVERED') { monthlyMap[key].revenue += o.totalPrice; monthlyMap[key].delivered += 1; }
      }
    }

    // ===== SECTION 4: Product Performance =====
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newProducts = await prisma.product.findMany({
      where: { createdAt: { gte: sevenDaysAgo }, isActive: true },
      select: { id: true, name: true, price: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const topProductIds = topProductsData.map(p => p.productId);
    const products = topProductIds.length
      ? await prisma.product.findMany({ where: { id: { in: topProductIds } }, select: { id: true, name: true, slug: true, price: true, createdAt: true } })
      : [];
    const prodMap = {}; for (const p of products) prodMap[p.id] = p;

    const allProductIds = [...new Set(allOrders.map(o => o.productId))];
    const neverOrderedProducts = allProductIds.length
      ? await prisma.product.findMany({
          where: { id: { notIn: allProductIds }, isActive: true },
          select: { id: true, name: true, slug: true, price: true, createdAt: true },
          take: 20,
        })
      : [];

    // ===== SECTION 5: Client Value =====
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const orderDerivedClients = clientData.map(c => ({
      phone: c.clientPhone,
      name: c.clientName,
      totalOrders: c._count.id,
      totalSpent: c._sum.totalPrice || 0,
      totalSpentFormatted: fmt(c._sum.totalPrice || 0),
      lastOrderDate: c._max.createdAt,
      isInactive: c._max.createdAt && new Date(c._max.createdAt) < threeMonthsAgo,
      isManuallyAdded: false,
    }));

    const manualClients = storeClients.map(c => {
      const totalSpent = c.orders.reduce((s, o) => s + o.totalPrice, 0);
      const orderCount = c.orders.length;
      const lastDate = orderCount > 0 ? c.orders.reduce((latest, o) => o.createdAt > latest ? o.createdAt : latest, c.orders[0].createdAt) : null;
      return {
        phone: c.phone,
        name: c.name,
        totalOrders: orderCount,
        totalSpent,
        totalSpentFormatted: fmt(totalSpent),
        lastOrderDate: lastDate,
        isInactive: lastDate && lastDate < threeMonthsAgo,
        isManuallyAdded: true,
      };
    });

    const mergedPhones = new Set(orderDerivedClients.map(c => c.phone));
    const allClients = [...orderDerivedClients, ...manualClients.filter(c => !mergedPhones.has(c.phone))];
    allClients.sort((a, b) => b.totalSpent - a.totalSpent);

    return Response.json({
      data: {
        overview: {
          thisMonth: { revenue: thisMonthRevenue, revenueFormatted: fmt(thisMonthRevenue), orders: thisMonthOrders.length },
          lastMonth: { revenue: lastMonthRevenue, revenueFormatted: fmt(lastMonthRevenue), orders: lastMonthOrders.length },
          avgOrderValue: fmt(avgOrderValue),
          totalRevenue: fmt(totalDeliveredRevenue),
          totalOrders: allOrders.length,
          today: { revenue: todayRevenue, revenueFormatted: fmt(todayRevenue), orders: todayOrders.length },
          growth,
          statusBreakdown: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
          unpaidDelivered,
          revenueByTier: Object.entries(revenueByTier).map(([name, value]) => ({ name, value, formatted: fmt(value) })),
          revenueByType: Object.entries(revenueByType).map(([name, value]) => ({ name, value, formatted: fmt(value) })),
          dailySalesCount: allOrders.filter(o => o.orderType === 'DAILY_SALE').length,
          ordersCount: ordersOnly.length,
          unaccountedProducts: unaccountedProducts.map(p => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: p.price,
            createdAt: p.createdAt,
          })),
          recentOrders: allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10).map(o => ({
            id: o.id,
            orderNumber: o.orderNumber,
            clientName: o.clientName,
            totalPrice: o.totalPrice,
            totalPriceFormatted: fmt(o.totalPrice),
            status: o.status,
            paymentStatus: o.paymentStatus,
            orderType: o.orderType,
            createdAt: o.createdAt,
            productName: o.product?.name || 'Unknown',
          })),
        },
        payments: {
          outstandingAmount: fmt(outstandingAmount),
          byStatus: paymentStats.map(s => ({
            status: s.paymentStatus,
            count: s._count.id,
            total: s._sum.totalPrice || 0,
            formatted: fmt(s._sum.totalPrice || 0),
          })),
          orders: ordersOnly
            .filter(o => o.paymentStatus !== 'PAID')
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 50)
            .map(o => ({
              id: o.id,
              orderNumber: o.orderNumber,
              clientName: o.clientName,
              clientPhone: o.clientPhone,
              totalPrice: o.totalPrice,
              totalPriceFormatted: fmt(o.totalPrice),
              paymentStatus: o.paymentStatus,
              depositAmount: o.depositAmount,
              depositFormatted: o.depositAmount ? fmt(o.depositAmount) : null,
              status: o.status,
              createdAt: o.createdAt,
              productName: o.product?.name || 'Unknown',
            })),
        },
        dailySales: {
          items: dailySaleOrders.map(o => ({
            id: o.id,
            orderNumber: o.orderNumber,
            clientName: o.clientName,
            clientPhone: o.clientPhone,
            totalPrice: o.totalPrice,
            totalPriceFormatted: fmt(o.totalPrice),
            paymentStatus: o.paymentStatus,
            depositAmount: o.depositAmount,
            depositFormatted: o.depositAmount ? fmt(o.depositAmount) : null,
            status: o.status,
            createdAt: o.createdAt,
            productName: o.product?.name || 'Unknown',
          })),
        },
        orders: {
          items: regularOrders.map(o => ({
            id: o.id,
            orderNumber: o.orderNumber,
            clientName: o.clientName,
            clientPhone: o.clientPhone,
            totalPrice: o.totalPrice,
            totalPriceFormatted: fmt(o.totalPrice),
            paymentStatus: o.paymentStatus,
            depositAmount: o.depositAmount,
            depositFormatted: o.depositAmount ? fmt(o.depositAmount) : null,
            status: o.status,
            createdAt: o.createdAt,
            productName: o.product?.name || 'Unknown',
          })),
        },
        history: {
          monthly: Object.values(monthlyMap),
        },
        productPerformance: {
          topProducts: topProductsData.map(p => ({
            product: prodMap[p.productId] ? { id: prodMap[p.productId].id, name: prodMap[p.productId].name, slug: prodMap[p.productId].slug } : null,
            orderCount: p._count.id,
            totalRevenue: p._sum.totalPrice || 0,
            totalRevenueFormatted: fmt(p._sum.totalPrice || 0),
            lastOrdered: productOrderData.find(d => d.productId === p.productId)?._max?.createdAt || null,
          })),
          neverOrdered: neverOrderedProducts.map(p => ({
            id: p.id, name: p.name, slug: p.slug, price: p.price, priceFormatted: fmt(p.price),
          })),
        },
        clientValue: {
          clients: allClients,
        },
      },
    });
  } catch (err) {
    console.error('Error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
