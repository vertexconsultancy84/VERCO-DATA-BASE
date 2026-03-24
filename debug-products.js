const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugProducts() {
  try {
    console.log('=== DEBUGGING PRODUCTS ISSUE ===');
    
    // Get all products from database
    const allProducts = await prisma.product.findMany({
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

    console.log(`Total products in database: ${allProducts.length}`);

    allProducts.forEach((product, index) => {
      console.log(`\n${index + 1}. Product: ${product.title}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Available: ${product.available}`);
      console.log(`   Hidden: ${product.hidden}`);
      console.log(`   Created: ${product.createdAt}`);
      console.log(`   User: ${product.user?.name || 'Unknown'}`);
      console.log(`   Province: ${product.province || 'Not set'}`);
    });

    // Test the filtering logic
    const visibleProducts = allProducts.filter((product) => {
      return !product.hidden || product.hidden === false;
    });

    console.log(`\nVisible products after filtering: ${visibleProducts.length}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugProducts();
