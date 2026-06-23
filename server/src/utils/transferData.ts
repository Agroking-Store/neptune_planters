import mongoose from 'mongoose';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const SOURCE_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neptune_planters';
const DEST_URI = process.env.DEST_MONGODB_URI;

async function transferData() {
  if (!DEST_URI) {
    console.error('❌ DEST_MONGODB_URI is not defined in your environment variables.');
    console.error('Please set DEST_MONGODB_URI in your .env file or export it in your terminal.');
    process.exit(1);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const confirm = await new Promise((resolve) => {
    rl.question(`\n⚠️ WARNING: This will transfer data:\n\nFROM (Source): ${SOURCE_URI}\nTO (Destination): ${DEST_URI}\n\nExisting data in the destination collections will be overwritten.\nDo you want to proceed? (yes/no): `, resolve);
  });

  if (confirm !== 'yes') {
    console.log('Transfer cancelled.');
    process.exit(0);
  }

  try {
    console.log('\nConnecting to Source Database...');
    const sourceConn = await mongoose.createConnection(SOURCE_URI).asPromise();
    console.log('✅ Connected to Source');

    console.log('Connecting to Destination Database...');
    const destConn = await mongoose.createConnection(DEST_URI).asPromise();
    console.log('✅ Connected to Destination');

    // Access the raw native MongoDB driver database objects
    const sourceDb = sourceConn.db;
    const destDb = destConn.db;

    if (!sourceDb || !destDb) {
      throw new Error("Failed to get database references");
    }

    const collections = await sourceDb.listCollections().toArray();

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;

      // Skip system collections
      if (collectionName.startsWith('system.')) continue;

      console.log(`\n📦 Processing collection: ${collectionName}`);

      const sourceCollection = sourceDb.collection(collectionName);
      const destCollection = destDb.collection(collectionName);

      const documents = await sourceCollection.find({}).toArray();

      if (documents.length > 0) {
        console.log(`Clearing existing data in destination ${collectionName}...`);
        await destCollection.deleteMany({});

        console.log(`Transferring ${documents.length} documents...`);
        await destCollection.insertMany(documents);
        console.log(`✅ Completed ${collectionName}`);
      } else {
        console.log(`⚠️ Collection ${collectionName} is empty. Skipping.`);
      }
    }

    console.log('\n🎉 All data transferred successfully!');

    await sourceConn.close();
    await destConn.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error transferring data:', error);
    process.exit(1);
  }
}

transferData();









// How to use it
// To use this script, make sure you provide the production database connection string via an environment variable called DEST_MONGODB_URI.

// The MONGODB_URI from your .env file (or mongodb://localhost:27017/neptune_planters by default) will be used as the source.

// You can run this directly in PowerShell like so:

// powershell
// cd server
// # Set your production URI as an environment variable in PowerShell
// $env:DEST_MONGODB_URI="mongodb+srv://<username>:<password>@cluster.mongodb.net/neptune_planters?retryWrites=true&w=majority"
// # Run the transfer script
// npm run transfer:data