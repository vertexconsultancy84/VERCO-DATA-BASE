const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestOrder() {
  try {
    console.log('=== CREATING TEST ORDER ===');
    
    // Create a test order with valid MongoDB ObjectId
    const order = await prisma.order.create({
      data: {
        productId: '507f1f77bcf86cd799439011', // Valid 24-character hex string
        productTitle: 'Test Food Product',
        productPrice: 2999.99,
        userId: '507f1f77bcf86cd799439012', // Valid 24-character hex string
        userName: 'Test Customer',
        userEmail: 'test@example.com',
        category: 'Food',
        subcategory: 'restaurant',
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    });

    console.log('✅ Test order created:', order);
    
    // Fetch all orders to verify
    const allOrders = await prisma.order.findMany();
    console.log('📊 Total orders in database:', allOrders.length);
    
    console.log('=== TEST COMPLETE ===');
  } catch (error) {
    console.error('Error creating test order:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestOrder();
