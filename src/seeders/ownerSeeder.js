// src/seeders/ownerSeeder.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import connectDB from '../config/database.js';

dotenv.config();

const seedOwner = async () => {
  try {
    // Connect to database
    await connectDB();

    const defaultOwnerEmail = process.env.DEFAULT_OWNER_EMAIL || 'pemilik@kosiyani.com';
    const defaultOwnerPassword = process.env.DEFAULT_OWNER_PASSWORD || 'Admin@123456';
    const defaultOwnerName = process.env.DEFAULT_OWNER_NAME || 'Pemilik Kos Siyani';

    // Check if owner already exists
    const existingOwner = await User.findOne({
      email: defaultOwnerEmail.toLowerCase(),
    });

    if (existingOwner) {
      console.log('✓ Owner account sudah ada');
      console.log(`  Email: ${existingOwner.email}`);
      console.log(`  Role: ${existingOwner.role}`);
      console.log(`  Created at: ${existingOwner.createdAt}`);
      process.exit(0);
    }

    // Create owner account
    const owner = await User.create({
      nama_lengkap: defaultOwnerName,
      email: defaultOwnerEmail.toLowerCase(),
      password: defaultOwnerPassword,
      role: 'pemilik',
      isActive: true,
    });

    console.log('✓ Owner account berhasil dibuat!');
    console.log(`  ID: ${owner._id}`);
    console.log(`  Nama: ${owner.nama_lengkap}`);
    console.log(`  Email: ${owner.email}`);
    console.log(`  Role: ${owner.role}`);
    console.log(`  Created at: ${owner.createdAt}`);
    console.log('\n⚠️  Jangan lupa ubah password default di production!');

    process.exit(0);
  } catch (error) {
    console.error('✗ Error seeding owner account:', error.message);
    if (error.name === 'MongoServerError' && error.code === 11000) {
      console.error('✗ Email sudah terdaftar');
    }
    process.exit(1);
  }
};

seedOwner();