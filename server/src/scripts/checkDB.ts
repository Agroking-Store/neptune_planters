import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/neptune_planters';

async function check() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  if (!db) throw new Error('Database connection failed.');

  const products = await db.collection('products').find({}).toArray();
  console.log(`Found ${products.length} products.`);
  products.forEach(p => {
    console.log(`Product: ${p.productName}`);
    console.log(` Images:`, p.productImages?.map((i: any) => `{ type: ${i.type}, url: ${i.url} }`));
  });

  const quotations = await db.collection('quotations').find({}).toArray();
  console.log(`\nFound ${quotations.length} quotations.`);
  const lastQ = quotations[quotations.length - 1];
  if (lastQ) {
    console.log(`Last Quotation ID: ${lastQ.quotationId}`);
    console.log(`Items:`, lastQ.items.map((i: any) => ({
      productId: i.productId,
      selectedTexture: i.selectedTexture
    })));
  }

  await mongoose.disconnect();
}
check();
