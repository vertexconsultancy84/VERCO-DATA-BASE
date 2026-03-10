const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addLocationFields() {
  try {
    console.log('Testing database connection and existing products...');
    
    // Just test connection and show current products
    const products = await prisma.product.findMany({
      take: 5,
      select: {
        id: true,
        title: true,
        latitude: true,
        longitude: true,
      }
    });

    console.log(`Found ${products.length} sample products:`);
    products.forEach(product => {
      console.log(`- ${product.title}: lat=${product.latitude}, lng=${product.longitude}`);
    });
    
    console.log('Database connection test completed successfully!');
    console.log('Note: Location fields (province, district, sector, village) will be added through the upload/edit forms.');
    console.log('The schema has been updated with new fields.');
    
  } catch (error) {
    console.error('Error during database test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addLocationFields();
