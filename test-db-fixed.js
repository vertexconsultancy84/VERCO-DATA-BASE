const { MongoClient } = require('mongodb');
const url = 'mongodb+srv://Sostene:sostene123@cluster0.16msskq.mongodb.net/VERTEX_DB?retryWrites=true&w=majority&appName=Cluster0';

(async function () {
  const client = new MongoClient(url, {
    tlsAllowInvalidCertificates: true,
    serverSelectionTimeoutMS: 5000
  });
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected successfully!');
    
    const db = client.db('VERTEX_DB');
    
    // Check collections
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Check products in different collections
    const productsCount = await db.collection('products').countDocuments();
    console.log('Products in "products" collection:', productsCount);
    
    const productCount = await db.collection('Product').countDocuments();
    console.log('Products in "Product" collection (Prisma):', productCount);
    
    // Get some sample products
    if (productsCount > 0) {
      const products = await db.collection('products').find({}).limit(3).toArray();
      console.log('Sample products:');
      products.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.title} - Category: ${p.category}, Hidden: ${p.hidden}, Available: ${p.available}`);
      });
    }
    
    if (productCount > 0) {
      const prismaProducts = await db.collection('Product').find({}).limit(3).toArray();
      console.log('Sample Prisma products:');
      prismaProducts.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.title} - Category: ${p.category}, Hidden: ${p.hidden}, Available: ${p.available}`);
      });
    }
    
  } catch (error) {
    console.error('Database connection error:', error.message);
  } finally {
    await client.close();
  }
})();
