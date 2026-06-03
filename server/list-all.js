const mongoose = require('mongoose');
const MONGO_URI = 'mongodb://gouthamkc153_db_user:Test123456@ac-zzdpo3n-shard-00-00.kx4tqfm.mongodb.net:27017,ac-zzdpo3n-shard-00-01.kx4tqfm.mongodb.net:27017,ac-zzdpo3n-shard-00-02.kx4tqfm.mongodb.net:27017/oaq-system?ssl=true&replicaSet=atlas-1k3ma2-shard-0&authSource=admin&appName=Cluster0';

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to DB');
  
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  console.log('Collections:', collections.map(c => c.name));

  // Let's count documents in 'users' collection if it exists
  const hasUsers = collections.some(c => c.name === 'users');
  if (hasUsers) {
    const count = await db.collection('users').countDocuments();
    console.log('Total documents in users:', count);
    const sample = await db.collection('users').find().limit(3).toArray();
    console.log('Sample users:', sample.map(u => ({ email: u.email, name: u.name })));
  }

  await mongoose.disconnect();
}

run().catch(console.error);
