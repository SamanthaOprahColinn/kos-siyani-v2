// public/js/admin/pembayaran.js

document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('formPembayaran');
    
    // Perubahan selector: Kita tangkap input cari, datalist, dan hidden ID
    const inputCariPenghuni = document.getElementById('cari_penghuni');
    const datalistPenghuni = document.getElementById('list_penghuni');
    const inputIdPenghuni = document.getElementById('id_penghuni'); 
    
    const inputKamarDisplay = document.getElementById('kamar_display');
    const inputIdKamar = document.getElementById('id_kamar');

    // Array global untuk menyimpan data sementara agar bisa dicari
    let semuaPenghuni = [];

    // 1. FUNGSI MENGAMBIL DATA PENGHUNI DARI BACKEND
    async function muatDaftarPenghuni() {
        try {
            const token = localStorage.getItem('token');
            
            const response = await fetch('/api/penghuni', { 
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const result = await response.json();

            if (response.ok) {
                datalistPenghuni.innerHTML = ''; // Bersihkan datalist
                semuaPenghuni = []; // Reset array
                
                const listPenghuni = result.data && Array.isArray(result.data.data) ? result.data.data : [];
                
                if (listPenghuni.length === 0) {
                    inputCariPenghuni.placeholder = 'Tidak ada data penghuni aktif';
                    inputCariPenghuni.disabled = true;
                    return;
                }

                listPenghuni.forEach(item => {
                    const detailUser = item.user_id || {};
                    const statusPenghuni = (item.status || item.status_penghuni || '').toString().toLowerCase();
                    const apakahAktif = item.is_active !== undefined ? item.is_active : true;

                    // Lewati jika tidak aktif / keluar
                    if (
                        statusPenghuni === 'keluar' || 
                        statusPenghuni === 'tidak aktif' || 
                        statusPenghuni === 'tidak_aktif' || 
                        statusPenghuni === 'non-aktif' || 
                        apakahAktif === false
                    ) {
                        return;
                    }

                    if (detailUser.role === 'penghuni') {
                        // Tentukan nama yang tampil
                        const namaTampil = item.nama_lengkap || item.nama || 
                                           detailUser.nama_lengkap || detailUser.nama || 
                                           detailUser.username || detailUser.email || "Penghuni Kos";
                        
                        // Simpan data lengkapnya ke array global
                        semuaPenghuni.push({
                            _id: item._id,
                            nama_tampil: namaTampil,
                            data_kamar: item.id_kamar || item.kamar || {}
                        });

                        // Masukkan hanya namanya ke opsi datalist
                        const option = document.createElement('option');
                        option.value = namaTampil;
                        datalistPenghuni.appendChild(option);
                    }
                });

                // Tom Select sudah dihapus sepenuhnya di sini!
                
            } else {
                inputCariPenghuni.placeholder = 'Gagal memuat penghuni';
                inputCariPenghuni.disabled = true;
            }
        } catch (error) {
            console.error("Gagal mengambil data penghuni:", error);
            inputCariPenghuni.placeholder = 'Gagal terhubung ke server';
            inputCariPenghuni.disabled = true;
        }
    }

    // 2. EVENT LISTENER PENCARIAN & OTOMATIS ISI KAMAR
    // (Menggantikan selectPenghuni.addEventListener('change'))
    inputCariPenghuni.addEventListener('input', (e) => {
        const namaDiketik = e.target.value;
        
        // Cari apakah nama yang diketik persis ada di array data kita
        const penghuniTerpilih = semuaPenghuni.find(p => p.nama_tampil === namaDiketik);

        if (penghuniTerpilih) {
            // Jika ketemu, isi hidden ID dan info kamar
            inputIdPenghuni.value = penghuniTerpilih._id;
            
            const nomorKamar = penghuniTerpilih.data_kamar.nomor_kamar || '-';
            inputIdKamar.value = penghuniTerpilih.data_kamar._id || '';
            inputKamarDisplay.value = nomorKamar !== '-' ? `Kamar ${nomorKamar}` : 'Tidak ada kamar';
        } else {
            // Jika diketik ngasal / belum lengkap, kosongkan semua
            inputIdPenghuni.value = '';
            inputIdKamar.value = '';
            inputKamarDisplay.value = '';
        }
    });

    // 3. FUNGSI MENGIRIM FORM (BUAT TAGIHAN BARU)
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        const token = localStorage.getItem('token');
        const id_penghuni = inputIdPenghuni.value;
        const id_kamar = inputIdKamar.value;

        // Validasi ekstra: pastikan ID Penghuni tidak kosong (artinya user milih dari list, bukan ngetik ngasal)
        if (!id_penghuni) {
            alert("⚠️ Silakan pilih nama penghuni yang sesuai dari daftar pencarian!");
            inputCariPenghuni.focus();
            return;
        }

        if (!id_kamar) {
            alert("⚠️ Penghuni yang dipilih belum memiliki kamar! Tagihan tidak bisa dibuat.");
            return;
        }

        const dataTagihanBaru = {
            id_penghuni: id_penghuni, // Diambil dari hidden input
            id_kamar: id_kamar,
            bulan_tagihan: Number(document.getElementById('bulan_tagihan').value),
            tahun_tagihan: Number(document.getElementById('tahun_tagihan').value),
            jumlah_tagihan: Number(document.getElementById('jumlah_tagihan').value),
            tgl_jatuh_tempo: document.getElementById('tgl_jatuh_tempo').value,
            status_bayar: 'belum_bayar'
        };

        // UI Feedback: Ubah tombol saat loading
        const btnSubmit = form.querySelector('button[type="submit"]');
        const teksAwalBtn = btnSubmit.innerHTML;
        btnSubmit.innerHTML = '⏳ Menerbitkan...';
        btnSubmit.disabled = true;

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
            
            if (response.ok) {
                alert("✅ Tagihan berhasil diterbitkan ke penghuni!");
                window.location.href = 'riwayat-pembayaran.html'; 
            } else {
                let pesanError = result.message || "Periksa kembali inputan.";
                if (result.errors && Array.isArray(result.errors)) {
                    pesanError = result.errors.map(err => `- ${err.message}`).join('\n');
                }
                alert(`Gagal membuat tagihan:\n${pesanError}`);
            }
        } catch (error) {
            console.error("Error saat submit:", error);
            alert("Gagal terhubung ke server saat mengirim tagihan.");
        } finally {
            btnSubmit.innerHTML = teksAwalBtn;
            btnSubmit.disabled = false;
        }
    });

    // Jalankan fungsi memuat daftar penghuni saat pertama kali halaman dibuka
    muatDaftarPenghuni();
});