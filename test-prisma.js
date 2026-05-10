const { PrismaClient } = require('@prisma/client');

async function testPrismaConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing Prisma connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('Prisma connected successfully!');
    
    // Count products
    const productCount = await prisma.product.count();
    console.log('Total products via Prisma:', productCount);
    
    // Get all published products
    const products = await prisma.product.findMany({
      where: { hidden: false },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        media: true
      },
      orderBy: [
        { available: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    
    console.log('Published products:', products.length);
    
    products.forEach((product, i) => {
      console.log(`  ${i + 1}. ${product.title}`);
      console.log(`     Category: ${product.category}, Subcategory: ${product.subcategory}`);
      console.log(`     Hidden: ${product.hidden}, Available: ${product.available}`);
      console.log(`     User: ${product.user ? product.user.name : 'No user'}`);
      console.log(`     Media: ${product.media && product.media.length > 0 ? 'Yes' : 'No'}`);
    });
    
  } catch (error) {
    console.error('Prisma connection error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaConnection();
