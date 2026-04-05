const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixExistingImageUrls() {
  try {
    console.log('=== FIXING EXISTING IMAGE URLs ===');
    
    // Get the product that has the problematic URL
    const product = await prisma.product.findUnique({
      where: { id: '69c4e1396956ff0b8f4ee4e5' }
    });

    if (!product) {
      console.log('Product not found');
      return;
    }

    console.log('Current product:', product.title);

    // Check if there's a media record
    const media = await prisma.productMedia.findFirst({
      where: { productId: product.id }
    });

    if (media) {
      console.log('Found media record with double extension URLs');
      
      // Fix mainImage
      if (media.mainImage && media.mainImage.includes('.jpg.jpg')) {
        const fixedMainImage = media.mainImage.replace('.jpg.jpg', '.jpg');
        console.log('Fixed mainImage:', media.mainImage, '->', fixedMainImage);
        
        await prisma.productMedia.update({
          where: { productId: product.id },
          data: { mainImage: fixedMainImage }
        });
        console.log('✅ Updated mainImage');
      }
      
      // Fix images array
      if (media.images && media.images.length > 0) {
        const fixedImages = media.images.map(img => {
          if (img.includes('.jpg.jpg')) {
            console.log('Fixed image:', img, '->', img.replace('.jpg.jpg', '.jpg'));
            return img.replace('.jpg.jpg', '.jpg');
          }
          return img;
        });
        
        await prisma.productMedia.update({
          where: { productId: product.id },
          data: { images: fixedImages }
        });
        console.log('✅ Updated images array');
      }
    }

    console.log('=== FIXING COMPLETE ===');
  } catch (error) {
    console.error('Error fixing image URLs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixExistingImageUrls();
