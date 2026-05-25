const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI not set'); process.exit(1); }
  await mongoose.connect(uri);
  console.log('Connected to Atlas hpf database');
  const db = mongoose.connection.db;

  const adminExists = await db.collection('users').findOne({ email: 'admin@hpf.com' });
  if (adminExists) {
    console.log('Super admin already exists, role:', adminExists.role);
  } else {
    const pwd = await bcrypt.hash('admin123', 10);
    await db.collection('users').insertOne({
      name: 'Super Admin',
      email: 'admin@hpf.com',
      password: pwd,
      role: 'SUPER_ADMIN',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Super admin created: admin@hpf.com / admin123');
  }

  const managerExists = await db.collection('users').findOne({ email: 'manager@hpf.com' });
  if (!managerExists) {
    const pwd2 = await bcrypt.hash('manager123', 10);
    await db.collection('users').insertOne({
      name: 'Branch Manager',
      email: 'manager@hpf.com',
      password: pwd2,
      role: 'BRANCH_MANAGER',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Branch manager created: manager@hpf.com / manager123');
  }

  await mongoose.disconnect();
  console.log('Seed complete.');
}

seed().catch(e => { console.error(e); process.exit(1); });
