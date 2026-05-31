// src/seeders/ownerSeeder.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import connectDB from '../config/database.js';

dotenv.config();

const seedAccounts = async () => {
  try {
    // Koneksi ke database
    await connectDB();

    // OWNER
    const defaultOwnerEmail = process.env.DEFAULT_OWNER_EMAIL || 'pemilik@kosiyani.com';
    const defaultOwnerPassword = process.env.DEFAULT_OWNER_PASSWORD || 'Admin@123456';
    const defaultOwnerName = process.env.DEFAULT_OWNER_NAME || 'Pemilik Sleepyani?';

    const existingOwner = await User.findOne({ email: defaultOwnerEmail.toLowerCase() });

    if (!existingOwner) {
      const owner = await User.create({
        nama_lengkap: defaultOwnerName,
        email: defaultOwnerEmail.toLowerCase(),
        password: defaultOwnerPassword,
        role: 'pemilik',
        isActive: true,
      });
      console.log(`✓ Akun Pemilik berhasil dibuat! (${owner.email})`);
    } else {
      console.log(`✓ Akun Pemilik sudah tersedia (${existingOwner.email})`);
    }

    // ADMIN
    const defaultAdminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@kosiyani.com';
    const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123456';
    const defaultAdminName = process.env.DEFAULT_ADMIN_NAME || 'Admin Sleepyani?';

    const existingAdmin = await User.findOne({ email: defaultAdminEmail.toLowerCase() });

    if (!existingAdmin) {
      const admin = await User.create({
        nama_lengkap: defaultAdminName,
        email: defaultAdminEmail.toLowerCase(),
        password: defaultAdminPassword,
        role: 'admin',
        isActive: true,
      });
      console.log(`✓ Akun Admin bawaan berhasil dibuat! (${admin.email})`);
    } else {
      console.log(`✓ Akun Admin bawaan sudah tersedia (${existingAdmin.email})`);
    }

    console.log('\n⚠️  Proses seeding selesai. Jalankan aplikasi menggunakan npm run dev');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error saat menjalankan seeding akun:', error.message);
    process.exit(1);
  }
};

seedAccounts();