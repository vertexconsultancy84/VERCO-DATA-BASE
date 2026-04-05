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
    console.log('Current image data:', {
      image: product.image,
      mainImage: product.mainImage,
      images: product.images
    });

    // Check if there's a media record
    const media = await prisma.productMedia.findFirst({
      where: { productId: product.id }
    });

    if (media) {
      console.log('Found media record:', {
        mainImage: media.mainImage,
        images: media.images
      });

      // Fix the media record
      const updates = {};
      
      if (media.mainImage && media.mainImage.includes('.jpg.jpg')) {
        updates.mainImage = media.mainImage.replace('.jpg.jpg', '.jpg');
        console.log('Fixed media.mainImage:', media.mainImage, '->', updates.mainImage);
      }
      
      if (media.images && media.images.length > 0) {
        updates.images = media.images.map(img => {
          if (img.includes('.jpg.jpg')) {
            console.log('Fixed media.images:', img, '->', img.replace('.jpg.jpg', '.jpg'));
            return img.replace('.jpg.jpg', '.jpg');
          }
          return img;
        });
      }

      if (Object.keys(updates).length > 0) {
        await prisma.productMedia.update({
          where: { productId: product.id },
          data: updates
        });
        console.log('✅ Updated media record for product:', product.title);
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
