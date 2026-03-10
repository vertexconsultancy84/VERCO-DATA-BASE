// Simple test to check if location fields are working
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkLocationFields() {
  try {
    console.log('Checking location fields in products...');
    
    const products = await prisma.product.findMany({
      take: 3,
      select: {
        id: true,
        title: true,
        province: true,
        district: true,
        sector: true,
        village: true,
        createdAt: true
      }
    });

    console.log('Products with location data:');
    products.forEach(product => {
      console.log(`\n${product.title}:`);
      console.log(`  Province: ${product.province || 'Not set'}`);
      console.log(`  District: ${product.district || 'Not set'}`);
      console.log(`  Sector: ${product.sector || 'Not set'}`);
      console.log(`  Village: ${product.village || 'Not set'}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkLocationFields();
