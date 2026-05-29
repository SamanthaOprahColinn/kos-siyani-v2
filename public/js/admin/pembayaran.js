// public/js/admin/pembayaran.js

document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('formPembayaran');
    const selectPenghuni = document.getElementById('id_penghuni');
    const inputKamarDisplay = document.getElementById('kamar_display');
    const inputIdKamar = document.getElementById('id_kamar');

    // 1. FUNGSI MENGAMBIL DATA PENGHUNI DARI BACKEND (SUDAH DISESUAIKAN DENGAN STRUKTUR ASLI)
    async function muatDaftarPenghuni() {
        try {
            const token = localStorage.getItem('token');
            
            const response = await fetch('/api/penghuni', { 
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const result = await response.json();

            if (response.ok) {
                // Bersihkan dropdown terlebih dahulu
                selectPenghuni.innerHTML = '<option value="">-- Pilih Penghuni --</option>';
                
                // FIXED: Membongkar data sesuai struktur asli backend kamu (result.data.data)
                const listPenghuni = result.data && Array.isArray(result.data.data) ? result.data.data : [];
                
                if (listPenghuni.length === 0) {
                    selectPenghuni.innerHTML = '<option value="">Tidak ada data penghuni aktif</option>';
                    return;
                }

                listPenghuni.forEach(item => {
                    const detailUser = item.user_id || {};
                    
                    // 🔥 1. TAMBAHKAN PENYARING STATUS DI SINI
                    // Menangkap status penghuni dari backend (bisa berupa teks atau boolean)
                    const statusPenghuni = (item.status || item.status_penghuni || '').toString().toLowerCase();
                    const apakahAktif = item.is_active !== undefined ? item.is_active : true;

                    // Jika terdeteksi statusnya sudah keluar/tidak aktif, langsung SKIP (lewati)
                    if (
                        statusPenghuni === 'keluar' || 
                        statusPenghuni === 'tidak aktif' || 
                        statusPenghuni === 'tidak_aktif' || 
                        statusPenghuni === 'non-aktif' || 
                        apakahAktif === false
                    ) {
                        return; // Perulangan langsung lompat ke data berikutnya
                    }

                    // 2. JIKA LOLOS PENYARING, BARU MASUKKAN KE DROPDOWN
                    if (detailUser.role === 'penghuni') {
                        const option = document.createElement('option');
                        
                        option.value = item._id;
                        
                        // Menyisir kemungkinan nama kolom di database
                        const namaTampil = item.nama_lengkap || item.nama || 
                                           detailUser.nama_lengkap || detailUser.nama || 
                                           detailUser.username || detailUser.email || "Penghuni Kos";
                        
                        option.textContent = namaTampil;
                        
                        // Ambil data kamar
                        const dataKamar = item.id_kamar || item.kamar || {};
                        const nomorKamar = dataKamar.nomor_kamar || '-';
                        const idKamar = dataKamar._id || '';
                        
                        option.dataset.nomorkamar = nomorKamar;
                        option.dataset.idkamar = idKamar;
                        
                        selectPenghuni.appendChild(option);
                    }
                });

                // Hancurkan TomSelect lama jika ada, lalu inisialisasi ulang agar data ter-refresh
                if (selectPenghuni.tomselect) {
                    selectPenghuni.tomselect.destroy();
                }

                // Jalankan Tom-Select pencarian modern
                new TomSelect("#id_penghuni", {
                    create: false,
                    sortField: { field: "text", direction: "asc" },
                    placeholder: "Cari nama penghuni..."
                });

            } else {
                selectPenghuni.innerHTML = '<option value="">Gagal memuat penghuni</option>';
            }
        } catch (error) {
            console.error("Gagal mengambil data penghuni:", error);
            selectPenghuni.innerHTML = '<option value="">Gagal terhubung ke server</option>';
        }
    }

    // 2. OTOMATIS MENGISI INPUT KAMAR SAAT PENGHUNI DIPILIH
    selectPenghuni.addEventListener('change', () => {
        const selectedOption = selectPenghuni.options[selectPenghuni.selectedIndex];
        if (selectedOption && selectedOption.value) {
            const noKamar = selectedOption.dataset.nomorkamar;
            inputKamarDisplay.value = noKamar !== '-' ? `Kamar ${noKamar}` : 'Tidak ada kamar';
            inputIdKamar.value = selectedOption.dataset.idkamar;
        } else {
            inputKamarDisplay.value = '';
            inputIdKamar.value = '';
        }
    });

    // 3. FUNGSI MENGIRIM FORM (BUAT TAGIHAN BARU)
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Cegah halaman reload saat submit
        
        const token = localStorage.getItem('token');
        const id_kamar = inputIdKamar.value;

        if (!id_kamar) {
            alert("⚠️ Penghuni yang dipilih belum memiliki kamar! Tagihan tidak bisa dibuat.");
            return;
        }

        // 🔥 FIXED: Membungkus nilai input dengan Number() agar dikirim sebagai angka asli
        const dataTagihanBaru = {
            id_penghuni: selectPenghuni.value,
            id_kamar: id_kamar,
            bulan_tagihan: Number(document.getElementById('bulan_tagihan').value),
            tahun_tagihan: Number(document.getElementById('tahun_tagihan').value),
            jumlah_tagihan: Number(document.getElementById('jumlah_tagihan').value),
            tgl_jatuh_tempo: document.getElementById('tgl_jatuh_tempo').value,
            status_bayar: 'belum_bayar'
        };

        try {
            const response = await fetch('/api/pembayaran', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dataTagihanBaru)
            });
            
            const result = await response.json();

            console.log("📦 ISI DATA DARI BACKEND:", result);
            
            if (response.ok) {
                alert("✅ Tagihan berhasil diterbitkan ke penghuni!");
                // Langsung tendang/lempar kembali ke halaman riwayat
                window.location.href = 'riwayat-pembayaran.html'; 
            } else {
                // Modifikasi alert agar menampilkan pesan error spesifik jika ada array errors dari backend
                let pesanError = result.message || "Periksa kembali inputan.";
                if (result.errors && Array.isArray(result.errors)) {
                    pesanError = result.errors.map(err => `- ${err.message}`).join('\n');
                }
                alert(`Gagal membuat tagihan:\n${pesanError}`);
            }
        } catch (error) {
            console.error("Error saat submit:", error);
            alert("Gagal terhubung ke server saat mengirim tagihan.");
        }
    });

    // Jalankan fungsi memuat daftar penghuni saat pertama kali halaman dibuka
    muatDaftarPenghuni();
});