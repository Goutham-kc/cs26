const mongoose = require('mongoose');
const MONGO_URI = 'mongodb://gouthamkc153_db_user:Test123456@ac-zzdpo3n-shard-00-00.kx4tqfm.mongodb.net:27017,ac-zzdpo3n-shard-00-01.kx4tqfm.mongodb.net:27017,ac-zzdpo3n-shard-00-02.kx4tqfm.mongodb.net:27017/oaq-system?ssl=true&replicaSet=atlas-1k3ma2-shard-0&authSource=admin&appName=Cluster0';

const User = require('./models/User');
const OAQIssue = require('./models/OAQIssue');

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to DB');

  const issue = await OAQIssue.findOne({ issueId: 1031 });
  if (!issue) {
    console.log('Issue #1031 not found.');
    await mongoose.disconnect();
    return;
  }

  const populated = await OAQIssue.findById(issue._id)
    .populate('raisedBy', 'name')
    .populate('communityReplies.repliedBy', 'name');

  console.log('Issue #1031 populated replies:', populated.communityReplies);

  await mongoose.disconnect();
}

run().catch(console.error);
