# Sleepyani - Digital Kos Management System 🌸

**Sleepyani** (Kos Siyani) adalah solusi manajemen kos-kosan berbasis web yang dirancang untuk mendigitalisasi operasional kos agar lebih cerdas, efisien, dan aman. Platform ini mempermudah pemilik, admin, dan penghuni dalam mengelola administrasi, transaksi, serta ketersediaan kamar secara *real-time* dalam satu platform terintegrasi.

---

## 📊 Masalah & Solusi

### 📌 Masalah yang Sering Dihadapi
* Operasional dan manajemen kos masih manual, tidak praktis, dan tidak efisien.
* Sulit memantau ketersediaan kamar dan data penghuni secara cepat (*real-time*).
* Proses administrasi dan pencatatan keuangan rawan terjadi kesalahan pengetikan (*human error*).
* Adanya risiko kebocoran data penting terkait informasi pribadi penghuni dan keuangan kos.

### 💡 Solusi & Manfaat Sleepyani
* **Manajemen Terintegrasi:** Mengelola ketersediaan kamar, data penghuni, dan administrasi dalam satu platform terpusat.
* **Akses Real-Time:** Memantau seluruh aktivitas operasional kos kapan saja dan di mana saja secara instan.
* **Antarmuka Nyaman (User-Friendly):** Desain sistem yang modern, simpel, dan sangat mudah digunakan oleh siapa pun.
* **Keamanan Data Maksimal:** Dilengkapi sistem otentikasi tingkat lanjut dan validasi ketat untuk menjamin keamanan data bisnis Anda.

---

## 🚀 Fitur Utama & Hak Akses (User Flow)

### 👑 Pemilik (Owner)
* **Dashboard Pemilik:** Memantau ringkasan (*summary*) total kamar aktif dan jumlah penghuni kos secara *real-time*.
* **Kelola Kamar:** Menambahkan unit kamar baru lengkap dengan detail nomor, lantai, tipe, harga sewa, dan fasilitas.
* **Kelola Penghuni:** Meninjau daftar seluruh penghuni kos dengan dukungan fitur pencarian (*searching*) yang cepat.
* **Transaksi:** Memeriksa foto bukti transfer dari penghuni dan melakukan validasi akhir status pembayaran.
* **Kelola Admin:** Mendaftarkan dan mengontrol hak akses satu atau lebih Admin untuk membantu operasional kos.

### ⚙️ Admin
* **Dashboard Admin:** Memantau ringkasan kos dan memicu fitur **"Tagih"** untuk mengirim pengingat bayar ke halaman penghuni.
* **Kelola Kamar:** Memantau, mengedit, atau menghapus data kamar, lengkap dengan fitur *Restore* (pemulihan) dari tong sampah.
* **Kelola Penghuni:** Mendaftarkan penghuni baru serta mengelola riwayat data penghuni yang sewaktu-waktu bisa dipulihkan kembali.
* **Buat Tagihan:** 
  * Membuat tagihan baru dan mengedit/menghapusnya jika belum lunas (didukung fitur *Restore*).
  * Mengubah status menjadi **"Lunas"** hanya setelah mendapat konfirmasi dari Pemilik. Tagihan yang sudah lunas otomatis terkunci (tidak bisa diedit).

### 📱 Penghuni (Resident)
* **Dashboard Penghuni:** Mengakses informasi nomor kamar pribadi, status tagihan bulanan terkini, dan riwayat pembayaran terdahulu.
* **Status Tagihan Real-Time:** Melihat rincian nominal dan daftar tagihan bulanan yang harus dibayarkan secara instan.
* **Upload Bukti Bayar:** Memilih tagihan aktif, mengunggah foto bukti transfer bank, dan menunggu proses verifikasi oleh Pemilik.

---

## 🛠️ Setup Awal Backend (Hanya 4 Langkah)

### 1. Install Dependency
```bash
cd backend
npm install
```

### 2. Buat File `.env`
Copy file `.env.example` menjadi `.env` dan isi dengan:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/kos_siyani
JWT_SECRET=secret123
```

**Alternatif:** Jika menggunakan MongoDB Atlas (cloud)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kos_siyani
```

### 3. Setup Database
Pastikan layanan MongoDB sudah berjalan di sistem kamu:
```bash
# Windows/macOS/Linux
mongod
```

### 4. Jalankan Seeder (Buat User Pemilik)
```bash
npm run seed
```
**Kredensial Default:**
* **Email:** `pemilik@kossiyani.com`
* **Password:** `Pemilik@123`

---

## 💻 Jalankan Backend

**Development (Auto reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Jika sukses, akan muncul pesan:
```text
✅ Server running on http://localhost:5000
✅ Database connected
```

---

## 🧪 Test API

Buka browser dan akses URL berikut untuk memastikan server berjalan dengan baik:
```text
http://localhost:5000/api/health
```
*Atau kamu bisa meng-import file `postman_collection.json` ke Postman untuk mengetes semua endpoint API yang tersedia.*

---

## 📂 Struktur Folder

```text
backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── index.js
├── .env
├── package.json
└── postman_collection.json
```

---

## 🛠️ Troubleshooting

| Masalah | Solusi |
| :--- | :--- |
| `"Cannot find module"` | Jalankan perintah `npm install` kembali |
| `MongoDB not connected` | Pastikan service `mongod` sudah berjalan di latar belakang |
| `Port 5000 sudah dipakai` | Ganti nilai `PORT` di dalam file `.env` (misal: 5001) |
| `Connection refused` | Periksa kembali susunan string `MONGODB_URI` di file `.env` |

---

## ⏱️ Quick Reference

```bash
# Install seluruh dependensi
npm install

# Jalankan seeder data awal
npm run seed

# Jalankan mode development
npm run dev

# Jalankan mode production  
npm start
```
Default URL: `http://localhost:5000`

---

## 📜 Lisensi
Proyek ini dilindungi di bawah lisensi **MIT License**.

*Dibuat dengan penuh dedikasi untuk efisiensi manajemen hunian masa kini.*
