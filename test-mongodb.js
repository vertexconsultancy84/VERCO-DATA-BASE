const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  try {
    console.log('=== TESTING MONGODB CONNECTION ===');
    
    // Test with the working URL from .env
    const DATABASE_URL = "mongodb+srv://Sostene:sostene123@cluster0.16msskq.mongodb.net/VERTEX_DB?retryWrites=true&w=majority&appName=Cluster0";
    
    console.log('Testing connection to:', DATABASE_URL.replace(/:.*@/, ':***@')); // Hide credentials
    
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: DATABASE_URL
        }
      }
    });

    // Test basic connection
    await prisma.$connect();
    console.log('✅ Connected to MongoDB successfully');
    
    // Test a simple query
    const count = await prisma.product.count();
    console.log(`✅ Found ${count} products in database`);
    
    await prisma.$disconnect();
    console.log('✅ Disconnected successfully');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Full error:', error);
  }
}

testConnection();
