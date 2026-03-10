const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testUpdateProduct() {
  try {
    console.log('Testing product update with location fields...');
    
    // Get a sample product
    const product = await prisma.product.findFirst({
      take: 1
    });
    
    if (!product) {
      console.log('No products found to test with');
      return;
    }
    
    console.log('Sample product:', {
      id: product.id,
      title: product.title,
      province: product.province,
      district: product.district,
      sector: product.sector,
      village: product.village
    });
    
    // Test update with location fields
    const updateData = {
      title: product.title,
      description: 'Test update with location fields',
      province: 'Kigali City',
      district: 'Nyarugenge',
      sector: 'Kimihurura',
      village: 'Kacyiru'
    };
    
    console.log('Attempting to update with data:', updateData);
    
    const updated = await prisma.product.update({
      where: { id: product.id },
      data: updateData
    });
    
    console.log('Update successful:', {
      id: updated.id,
      province: updated.province,
      district: updated.district,
      sector: updated.sector,
      village: updated.village
    });
    
  } catch (error) {
    console.error('Update test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUpdateProduct();
