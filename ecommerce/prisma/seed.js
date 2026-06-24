const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding ForwardIQ Store...');

  // ── PRICE TIERS ─────────────────────────────────────────────────────────────
  const tiers = await Promise.all([
    prisma.priceTier.upsert({
      where: { slug: 'low-price' },
      update: {},
      create: {
        name: 'Low Price',
        slug: 'low-price',
        description: 'Quality furniture at accessible prices for every home',
        order: 1,
        isActive: true
      }
    }),
    prisma.priceTier.upsert({
      where: { slug: 'medium-price' },
      update: {},
      create: {
        name: 'Medium Price',
        slug: 'medium-price',
        description: 'Premium craftsmanship at fair value',
        order: 2,
        isActive: true
      }
    }),
    prisma.priceTier.upsert({
      where: { slug: 'master' },
      update: {},
      create: {
        name: 'Master',
        slug: 'master',
        description: 'Exceptional handcrafted pieces for discerning homes',
        order: 3,
        isActive: true
      }
    })
  ]);

  const [lowTier, mediumTier, masterTier] = tiers;
  console.log('✓ Price tiers seeded');

  // ── PRODUCT TYPES ───────────────────────────────────────────────────────────
  const types = await Promise.all([
    prisma.productType.upsert({
      where: { slug: 'beds' },
      update: { imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400' },
      create: {
        name: 'Beds',
        slug: 'beds',
        description: 'Handcrafted bed frames built for comfort and durability',
        imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400',
        order: 1,
        isActive: true
      }
    }),
    prisma.productType.upsert({
      where: { slug: 'sofas' },
      update: { imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400' },
      create: {
        name: 'Sofas',
        slug: 'sofas',
        description: 'Comfortable sofas crafted for Rwandan living rooms',
        imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
        order: 2,
        isActive: true
      }
    }),
    prisma.productType.upsert({
      where: { slug: 'cupboards' },
      update: { imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400' },
      create: {
        name: 'Cupboards',
        slug: 'cupboards',
        description: 'Solid wood wardrobes and storage solutions',
        imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
        order: 3,
        isActive: true
      }
    }),
    prisma.productType.upsert({
      where: { slug: 'chairs' },
      update: { imageUrl: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400' },
      create: {
        name: 'Chairs',
        slug: 'chairs',
        description: 'Dining chairs, office chairs, and accent seating',
        imageUrl: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400',
        order: 4,
        isActive: true
      }
    }),
    prisma.productType.upsert({
      where: { slug: 'tables' },
      update: { imageUrl: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=400' },
      create: {
        name: 'Tables',
        slug: 'tables',
        description: 'Dining tables, coffee tables, and work desks',
        imageUrl: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=400',
        order: 5,
        isActive: true
      }
    })
  ]);

  const [bedsType, sofasType, cupboardsType, chairsType, tablesType] = types;
  console.log('✓ Product types seeded');

  // ── PRODUCTS ────────────────────────────────────────────────────────────────
  function slugify(text) {
    return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  }

  const products = [
    // ── BEDS ──
    {
      name: 'Single Bed Frame',
      slug: slugify('Single Bed Frame'),
      description: "A sturdy single bed frame crafted from solid pine wood. Perfect for children's rooms, guest rooms, or small spaces. Simple clean design that fits any interior. Easy to assemble and built to last years of daily use.",
      price: 85000,
      productTypeId: bedsType.id,
      priceTierId: lowTier.id,
      material: 'Pine Wood',
      dimensions: '90cm × 190cm × 45cm',
      availability: 'MADE_TO_ORDER',
      estimatedDays: 7,
      allowCustomNotes: true,
      isActive: true,
      isFeatured: false,
      images: [
        { url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800', primary: true },
        { url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800', primary: false },
      ]
    },
    {
      name: 'Queen Size Bed',
      slug: slugify('Queen Size Bed'),
      description: 'A beautiful queen size bed frame with an upholstered headboard. Made from high-quality mahogany with smooth finish. The padded headboard adds comfort for reading in bed. Includes side rails and central support beam for extra durability.',
      price: 220000,
      productTypeId: bedsType.id,
      priceTierId: mediumTier.id,
      material: 'Mahogany Wood',
      dimensions: '160cm × 200cm × 120cm',
      availability: 'MADE_TO_ORDER',
      estimatedDays: 14,
      allowCustomNotes: true,
      isActive: true,
      isFeatured: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800', primary: true },
        { url: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800', primary: false },
        { url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800', primary: false },
      ]
    },
    {
      name: 'Master King Bed',
      slug: slugify('Master King Bed'),
      description: 'The pinnacle of our bed collection. A hand-carved king size bed frame in solid African mahogany with intricate headboard detailing. This piece is built as a lifetime investment. Includes matching bedside tables. Custom dimensions available. Each piece is unique and signed by the craftsman.',
      price: 450000,
      productTypeId: bedsType.id,
      priceTierId: masterTier.id,
      material: 'African Mahogany',
      dimensions: '200cm × 200cm × 140cm',
      availability: 'MADE_TO_ORDER',
      estimatedDays: 21,
      allowCustomNotes: true,
      isActive: true,
      isFeatured: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800', primary: true },
        { url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800', primary: false },
        { url: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800', primary: false },
      ]
    },
    // ── SOFAS ──
    {
      name: '2-Seater Sofa',
      slug: slugify('2-Seater Sofa'),
      description: 'A compact 2-seater sofa perfect for small living rooms, offices, or waiting areas. Solid wood frame with foam cushions covered in durable fabric. Available in multiple fabric colors on request. Easy to clean and maintain.',
      price: 120000,
      productTypeId: sofasType.id,
      priceTierId: lowTier.id,
      material: 'Pine Wood Frame, Foam Cushions, Fabric Cover',
      dimensions: '140cm × 80cm × 85cm',
      availability: 'MADE_TO_ORDER',
      estimatedDays: 10,
      allowCustomNotes: true,
      isActive: true,
      isFeatured: false,
      images: [
        { url: 'https://images.unsplash.com/photo-1550254478-ead40cc54513?w=800', primary: true },
        { url: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800', primary: false },
      ]
    },
    {
      name: '3-Seater Sofa',
      slug: slugify('3-Seater Sofa'),
      description: 'Our most popular sofa. A full 3-seater with deep cushions and solid mahogany legs. The high-density foam ensures lasting comfort. The fabric is stain-resistant and easy to maintain. Available in beige, grey, or dark brown fabric.',
      price: 280000,
      productTypeId: sofasType.id,
      priceTierId: mediumTier.id,
      material: 'Mahogany Frame, High-Density Foam, Stain-Resistant Fabric',
      dimensions: '210cm × 90cm × 90cm',
      availability: 'MADE_TO_ORDER',
      estimatedDays: 14,
      allowCustomNotes: true,
      isActive: true,
      isFeatured: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800', primary: true },
        { url: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800', primary: false },
        { url: 'https://images.unsplash.com/photo-1550254478-ead40cc54513?w=800', primary: false },
      ]
    },
    {
      name: 'L-Shaped Master Sofa',
      slug: slugify('L-Shaped Master Sofa'),
      description: 'A commanding L-shaped sofa that transforms any living room into a luxury space. Built on a solid hardwood frame with premium goose-down cushions. The chaise longue section extends 160cm for full body relaxation. Custom upholstery options available in leather or premium fabric. This piece defines the room.',
      price: 580000,
      productTypeId: sofasType.id,
      priceTierId: masterTier.id,
      material: 'Hardwood Frame, Goose-Down Cushions, Premium Fabric or Leather',
      dimensions: '280cm × 180cm × 90cm',
      availability: 'MADE_TO_ORDER',
      estimatedDays: 28,
      allowCustomNotes: true,
      isActive: true,
      isFeatured: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800', primary: true },
        { url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800', primary: false },
      ]
    },
    // ── CUPBOARDS ──
    {
      name: 'Small Wardrobe',
      slug: slugify('Small Wardrobe'),
      description: 'A practical 2-door wardrobe with one hanging rail and two internal shelves. Made from MDF with a smooth laminate finish. Ideal for smaller bedrooms or as a second storage unit. Simple handles and concealed hinges for a clean look.',
      price: 95000,
      productTypeId: cupboardsType.id,
      priceTierId: lowTier.id,
      material: 'MDF with Laminate Finish',
      dimensions: '90cm × 55cm × 180cm',
      availability: 'MADE_TO_ORDER',
      estimatedDays: 7,
      allowCustomNotes: true,
      isActive: true,
      isFeatured: false,
      images: [
        { url: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800', primary: true },
        { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', primary: false },
      ]
    },
    {
      name: '3-Door Wardrobe',
      slug: slugify('3-Door Wardrobe'),
      description: 'A spacious 3-door wardrobe with a full-length mirror on the center door. Solid wood construction with two hanging sections and four shelves. Smooth sliding drawers at the bottom. This wardrobe is a complete bedroom storage solution built to last.',
      price: 195000,
      productTypeId: cupboardsType.id,
      priceTierId: mediumTier.id,
      material: 'Solid Wood with MDF Panels',
      dimensions: '150cm × 60cm × 200cm',
      availability: 'MADE_TO_ORDER',
      estimatedDays: 14,
      allowCustomNotes: true,
      isActive: true,
      isFeatured: false,
      images: [
        { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', primary: true },
        { url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', primary: false },
        { url: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800', primary: false },
      ]
    },
    {
      name: 'Master Wardrobe with Dressing Area',
      slug: slugify('Master Wardrobe with Dressing Area'),
      description: 'Our finest wardrobe. A fully fitted 4-door master wardrobe with integrated dressing table, full-length mirrors, and interior LED lighting. Built from solid African mahogany with dovetail joinery. Features velvet-lined jewelry drawers, tie and belt racks, and shoe shelves. This wardrobe is a statement piece crafted for those who expect the best.',
      price: 380000,
      productTypeId: cupboardsType.id,
      priceTierId: masterTier.id,
      material: 'African Mahogany, Beveled Mirror Glass, LED Lighting',
      dimensions: '220cm × 65cm × 210cm',
      availability: 'MADE_TO_ORDER',
      estimatedDays: 30,
      allowCustomNotes: true,
      isActive: true,
      isFeatured: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', primary: true },
        { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', primary: false },
      ]
    },
    // ── CHAIRS ──
    {
      name: 'Dining Chair',
      slug: slugify('Dining Chair'),
      description: 'A simple solid wood dining chair with a comfortable backrest. Lightweight and stackable. Perfect for dining rooms, kitchens, or outdoor use under a covered area. Sold individually — can be ordered in sets. Durable and easy to maintain.',
      price: 25000,
      productTypeId: chairsType.id,
      priceTierId: lowTier.id,
      material: 'Pine Wood',
      dimensions: '45cm × 45cm × 90cm',
      availability: 'IN_STOCK',
      estimatedDays: 3,
      allowCustomNotes: false,
      isActive: true,
      isFeatured: false,
      images: [
        { url: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800', primary: true },
        { url: 'https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=800', primary: false },
      ]
    },
    {
      name: 'Dining Chair Set (4 Chairs)',
      slug: slugify('Dining Chair Set 4 Chairs'),
      description: 'A matched set of 4 dining chairs with padded seats and solid mahogany frames. The padded seat cushions are upholstered in easy-clean fabric. Ergonomic backrest design ensures comfort during long meals. All 4 chairs are built from the same batch of wood for perfect color matching.',
      price: 140000,
      productTypeId: chairsType.id,
      priceTierId: mediumTier.id,
      material: 'Mahogany Frame, Foam Seat, Fabric Upholstery',
      dimensions: '48cm × 52cm × 95cm each',
      availability: 'MADE_TO_ORDER',
      estimatedDays: 10,
      allowCustomNotes: true,
      isActive: true,
      isFeatured: false,
      images: [
        { url: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800', primary: true },
        { url: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800', primary: false },
        { url: 'https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=800', primary: false },
      ]
    },
    {
      name: 'Executive Office Chair',
      slug: slugify('Executive Office Chair'),
      description: 'A premium executive office chair with full lumbar support, adjustable armrests, and 360-degree swivel. Upholstered in genuine leather with high-density foam. The solid wood base gives it a distinguished look that stands out in any executive office. Built for 8-hour comfort.',
      price: 260000,
      productTypeId: chairsType.id,
      priceTierId: masterTier.id,
      material: 'Genuine Leather, High-Density Foam, Solid Wood Base',
      dimensions: '65cm × 70cm × 115-125cm (adjustable)',
      availability: 'MADE_TO_ORDER',
      estimatedDays: 14,
      allowCustomNotes: true,
      isActive: true,
      isFeatured: false,
      images: [
        { url: 'https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=800', primary: true },
        { url: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800', primary: false },
      ]
    },
    // ── TABLES ──
    {
      name: 'Coffee Table',
      slug: slugify('Coffee Table'),
      description: 'A clean and simple coffee table with a lower storage shelf. Made from pine with a natural wood finish. Lightweight enough to move easily. Pairs well with any sofa in our collection. The lower shelf is perfect for magazines, remotes, or decorative items.',
      price: 55000,
      productTypeId: tablesType.id,
      priceTierId: lowTier.id,
      material: 'Pine Wood',
      dimensions: '100cm × 55cm × 45cm',
      availability: 'IN_STOCK',
      estimatedDays: 3,
      allowCustomNotes: false,
      isActive: true,
      isFeatured: false,
      images: [
        { url: 'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?w=800', primary: true },
        { url: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=800', primary: false },
      ]
    },
    {
      name: 'Dining Table (6 Seater)',
      slug: slugify('Dining Table 6 Seater'),
      description: 'A solid mahogany dining table that seats 6 comfortably, expandable to 8 with the leaf extension. The thick tabletop is hand-sanded to a smooth finish and treated with food-safe oil. Sturdy turned legs with cross-bracing for stability. This table becomes the center of family life.',
      price: 185000,
      productTypeId: tablesType.id,
      priceTierId: mediumTier.id,
      material: 'Solid Mahogany',
      dimensions: '180cm × 90cm × 76cm',
      availability: 'MADE_TO_ORDER',
      estimatedDays: 14,
      allowCustomNotes: true,
      isActive: true,
      isFeatured: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=800', primary: true },
        { url: 'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?w=800', primary: false },
        { url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800', primary: false },
      ]
    },
    {
      name: 'Master Dining Set',
      slug: slugify('Master Dining Set'),
      description: 'The complete statement dining experience. A hand-carved 8-seater dining table in African mahogany with matching upholstered chairs. The table features an inlaid centerpiece pattern carved by hand. Each chair has a high backrest with leather upholstery. This set commands any dining room and is built as a generational piece. Delivery and setup included.',
      price: 420000,
      productTypeId: tablesType.id,
      priceTierId: masterTier.id,
      material: 'African Mahogany, Leather Upholstery, Brass Inlay',
      dimensions: 'Table: 240cm × 100cm × 78cm | Chairs: 50cm × 55cm × 110cm',
      availability: 'MADE_TO_ORDER',
      estimatedDays: 35,
      allowCustomNotes: true,
      isActive: true,
      isFeatured: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=800', primary: true },
        { url: 'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?w=800', primary: false },
      ]
    },
  ];

  for (const productData of products) {
    const { images, ...data } = productData;
    const existing = await prisma.product.findUnique({ where: { slug: data.slug } });
    if (existing) {
      console.log(`  → Skipping existing product: ${data.name}`);
      continue;
    }
    const product = await prisma.product.create({ data });
    for (let i = 0; i < images.length; i++) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          imageUrl: images[i].url,
          isPrimary: images[i].primary,
          order: i,
          altText: `${product.name} — image ${i + 1}`
        }
      });
    }
    console.log(`  ✓ ${product.name} (${images.length} images)`);
  }

  console.log('✓ All products seeded');
  console.log('\nSeed complete! Summary:');
  console.log('  3 price tiers');
  console.log('  5 product types');
  console.log('  15 products with images');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
