const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDataSync() {
  try {
    console.log('=== TESTING DATA SYNC ===');
    
    // Test 1: Check current products
    const products = await prisma.product.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Current products in database: ${products.length}`);
    
    // Test 2: Simulate getAllPublishedProducts logic
    const visibleProducts = products.filter((product) => {
      return !product.hidden || product.hidden === false;
    });

    console.log(`Products that should be visible: ${visibleProducts.length}`);
    
    // Test 3: Check if any products have issues
    products.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.title}`);
      console.log(`   Available: ${product.available}`);
      console.log(`   Hidden: ${product.hidden}`);
      console.log(`   Should show: ${!product.hidden || product.hidden === false}`);
    });
    
    console.log('\n=== DATA SYNC TEST COMPLETE ===');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDataSync();
