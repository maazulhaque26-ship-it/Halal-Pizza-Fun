const { MongoClient } = require('mongodb');
const uri = 'mongodb://127.0.0.1:27017/hpf?directConnection=true&serverSelectionTimeoutMS=3000';
MongoClient.connect(uri).then(async client => {
  const db = client.db('hpf');
  const res = await db.collection('settings').updateOne(
    {},
    { $set: { 'delivery.pricePerKm': 3, 'delivery.baseDeliveryFee': 9, 'delivery.freeDeliveryAbove': 500 } },
    { upsert: false }
  );
  console.log('Patched:', res.matchedCount, 'doc(s) matched,', res.modifiedCount, 'modified');
  await client.close();
}).catch(e => { console.error('Error:', e.message); process.exit(1); });
