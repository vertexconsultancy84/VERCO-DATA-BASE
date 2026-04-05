const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixSpecificImage() {
  try {
    console.log('=== FIXING SPECIFIC IMAGE URL ===');
    
    // Use raw query to bypass Prisma validation
    const result = await prisma.$queryRawUnsafe`
      UPDATE ProductMedia 
      SET mainImage = REPLACE(mainImage, 'https://res.cloudinary.com/dzikttrya/image/upload/v1774510393/products/images/1774510393097-image_0.jpg.jpg', 'https://res.cloudinary.com/dzikttrya/image/upload/v1774510393/products/images/1774510393097-image_0.jpg')
      WHERE productId = '69c4e1396956ff0b8f4ee4e5'
    `;
    
    console.log('Update result:', result);
    console.log('✅ Fixed specific image URL');
    
  } catch (error) {
    console.error('Error fixing image URL:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSpecificImage();
