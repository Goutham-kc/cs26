const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const http = require('http');

const MONGO_URI = 'mongodb://gouthamkc153_db_user:Test123456@ac-zzdpo3n-shard-00-00.kx4tqfm.mongodb.net:27017,ac-zzdpo3n-shard-00-01.kx4tqfm.mongodb.net:27017,ac-zzdpo3n-shard-00-02.kx4tqfm.mongodb.net:27017/oaq-system?ssl=true&replicaSet=atlas-1k3ma2-shard-0&authSource=admin&appName=Cluster0';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['intern', 'mentor', 'admin', 'superadmin'], default: 'intern' },
  sp: { type: Number, default: 0 }
});

const User = mongoose.model('User', UserSchema);

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to DB');

  const user = await User.findOne({ email: 'intern@cs26.com' });
  if (!user) {
    console.error('User not found');
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log('Found user:', user.name);

  // Generate a JWT token
  const token = jwt.sign({ id: user._id }, 'your_jwt_secret_here', { expiresIn: '1d' });

  // Make the PATCH request
  const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/oaq/issues/6a1ff05bfc99e0f344c8b159/replies/6a1ff0dffc99e0f344c8b3cc/vote',
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('Response Status:', res.statusCode);
      const json = JSON.parse(data);
      console.log('Response JSON:', JSON.stringify(json, null, 2));
      mongoose.disconnect();
    });
  });

  req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
    mongoose.disconnect();
  });

  req.write(JSON.stringify({ type: 'up' }));
  req.end();
}

run().catch(console.error);
