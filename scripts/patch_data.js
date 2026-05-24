const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  await db.collection('settings').updateOne({}, { $set: { 'payment.codEnabled': true } }, { upsert: true });
  await db.collection('branches').updateMany({}, { $set: { 'operatingHours.close': '23:59' } });
  console.log('Patched settings and branches.');
  process.exit(0);
});
