const { MongoClient } = require('mongodb');
const url = 'mongodb+srv://Sostene:sostene123@cluster0.16msskq.mongodb.net/VERTEX_DB?retryWrites=true&w=majority&appName=Cluster0';
(async function () {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db('VERTEX_DB');
    const products = await db.collection('products').aggregate([
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'productMedia', localField: '_id', foreignField: 'productId', as: 'media' } },
      { $sort: { available: -1, createdAt: -1 } }
    ]).toArray();
    console.log('Total products directly from DB:', products.length);
    for (let i = 0; i < products.length; i++) {
      console.log(`Product ${i + 1}: Cat -> ${products[i].category}, Sub -> ${products[i].subcategory}, Hidden -> ${products[i].hidden}`);
      const media = products[i].media && products[i].media.length > 0 ? products[i].media[0] : null;
      console.log('  Media:', media ? 'Found' : 'Null');
    }
    const prismaProds = await db.collection('Product').countDocuments();
    console.log('Products in "Product" collection (Prisma):', prismaProds);
  } finally {
    await client.close();
  }
})();
