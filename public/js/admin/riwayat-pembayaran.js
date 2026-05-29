// public/js/admin/riwayat-pembayaran.js

// Fungsi Global Pembantu Modal agar bisa dipanggil dari HTML onclick
function tutupModal(idModal) {
    document.getElementById(idModal).classList.remove('show');
}

document.addEventListener('DOMContentLoaded', () => {
    const tabelBody = document.getElementById('tabelPembayaranBody');
    const tabelTrashBody = document.getElementById('tabelTrashBody');
    
    let semuaListPembayaran = []; 
    const token = localStorage.getItem('token');

    // 1. FUNGSI AMBIL DATA (Bebas dari Cache Browser)
    async function muatRiwayatPembayaran() {
        try {
            // 🔥 Trik Cache-Buster: Tambahkan ?_t=waktu_sekarang di akhir URL
            const timestamp = new Date().getTime(); 
            const response = await fetch(`/api/pembayaran?_t=${timestamp}`, {
                method: 'GET',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache' 
                },
                cache: 'no-store'
            });
            const result = await response.json();

            if (response.ok) {
                semuaListPembayaran = Array.isArray(result.data) ? result.data : 
                                      (result.data && Array.isArray(result.data.data)) ? result.data.data : 
                                      (result.data && Array.isArray(result.data.docs)) ? result.data.docs : [];
                prosesDanRenderTabel();
            } else {
                tabelBody.innerHTML = `<tr><td colspan="7" class="text-error-state">Gagal mengambil data dari server.</td></tr>`;
            }
        } catch (error) {
            console.error('Gagal memuat log pembayaran:', error);
        }
    }

    // 2. RENDER TABEL UTAMA
    function prosesDanRenderTabel() {
        const keyword = document.getElementById('cariNama')?.value.toLowerCase().trim() || '';
        const status = document.getElementById('filterStatus')?.value || 'semua';
        const bulan = document.getElementById('filterBulan')?.value || 'semua';
        const tahun = document.getElementById('filterTahun')?.value || 'semua';
        const urutan = document.getElementById('sortData')?.value || 'terbaru';

        let listTersaring = semuaListPembayaran.filter(item => {
            const namaUser = item.id_penghuni?.nama_lengkap || 'Kosong/Keluar';
            const matchNama = namaUser.toLowerCase().includes(keyword);
            const matchStatus = status === 'semua' || 
                                (status === 'belum_bayar' && item.status_bayar !== 'lunas') || 
                                item.status_bayar === status;
            const matchBulan = bulan === 'semua' || (item.bulan_tagihan && item.bulan_tagihan.toString() === bulan);
            const matchTahun = tahun === 'semua' || (item.tahun_tagihan && item.tahun_tagihan.toString() === tahun);

            return matchNama && matchStatus && matchBulan && matchTahun;
        });

        // Sorting
        listTersaring.sort((a, b) => {
            if (urutan === 'nama_asc') {
                return (a.id_penghuni?.nama_lengkap || '').localeCompare(b.id_penghuni?.nama_lengkap || '');
            } else if (urutan === 'terlama') {
                return new Date(a.tgl_jatuh_tempo) - new Date(b.tgl_jatuh_tempo);
            } else {
                if (a.status_bayar === 'lunas' && b.status_bayar !== 'lunas') return 1;
                if (a.status_bayar !== 'lunas' && b.status_bayar === 'lunas') return -1;
                return new Date(b.tgl_jatuh_tempo) - new Date(a.tgl_jatuh_tempo);
            }
        });

        tabelBody.innerHTML = '';
        if (listTersaring.length === 0) {
            tabelBody.innerHTML = `<tr><td colspan="7" class="text-center" style="color: var(--n500); padding: 24px;">Data tagihan tidak ditemukan.</td></tr>`;
            return;
        }
        
        listTersaring.forEach(item => {
            const namaUser = item.id_penghuni?.nama_lengkap || 'Kosong/Keluar';
            const noKamar = item.id_kamar?.nomor_kamar || '-';
            const formatRupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.jumlah_tagihan);
            const tglJatuhTempo = new Date(item.tgl_jatuh_tempo).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

            let classBadgeClay = 'badge-clay pink'; 
            let statusDanKonfirmasi = '';

            // 🔥 PERUBAHAN: Hanya tampilkan tombol edit jika status BELUM lunas
            const tombolEditHtml = item.status_bayar !== 'lunas' 
                ? `<button class="btn-edit" data-id="${item._id}" style="color: #3b82f6; background:none; border:none; cursor:pointer;"><i class="ph ph-pencil-simple" style="font-size:18px;"></i></button>`
                : '';

            const tombolEditHapus = `
                <div style="display: flex; gap: 4px; margin-left: 8px; border-left: 1px solid #e2e8f0; padding-left: 8px;">
                    ${tombolEditHtml}
                    <button class="btn-hapus" data-id="${item._id}" style="color: #ef4444; background:none; border:none; cursor:pointer;"><i class="ph ph-trash" style="font-size:18px;"></i></button>
                </div>
            `;

            if (item.status_bayar === 'lunas') {
                classBadgeClay = 'badge-clay green';
                statusDanKonfirmasi = `<span style="color: #10b981; font-weight: 600;"><i class="ph ph-check-circle"></i> Selesai</span>`;
            } else {
                if (item.status_bayar === 'menunggu_konfirmasi') classBadgeClay = 'badge'; 
                statusDanKonfirmasi = `<button class="btn-success-sm btn-konfirmasi-lunas" data-id="${item._id}"><i class="ph ph-check-square-offset"></i> Konf Lunas</button>`;
            }

            tabelBody.innerHTML += `
                <tr>
                  <td class="font-bold">${namaUser}</td>
                  <td>No. ${noKamar}</td>
                  <td>Bulan ${item.bulan_tagihan} / ${item.tahun_tagihan}</td>
                  <td class="font-bold" style="color: var(--pink-600);">${formatRupiah}</td>
                  <td style="color: var(--n500);">${tglJatuhTempo}</td>
                  <td><span class="${classBadgeClay}" style="text-transform: uppercase; font-size: 10px;">${item.status_bayar?.replace('_', ' ') || 'belum bayar'}</span></td>
                  <td><div style="display: flex; align-items: center;">${statusDanKonfirmasi} ${tombolEditHapus}</div></td>
                </tr>
            `;
        });
    }

    // 3. TONG SAMPAH: AMBIL & RENDER DATA YANG DIHAPUS (SOFT DELETED)
    async function muatTongSampah() {
        tabelTrashBody.innerHTML = `<tr><td colspan="4" class="text-center" style="padding:16px;">Memuat tong sampah...</td></tr>`;
        try {
            const response = await fetch('/api/pembayaran/deleted/all', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            
            const dataSampah = Array.isArray(result.data) ? result.data : 
                               (result.data && Array.isArray(result.data.data)) ? result.data.data : 
                               (result.data && Array.isArray(result.data.docs)) ? result.data.docs : 
                               (Array.isArray(result) ? result : []);

            tabelTrashBody.innerHTML = '';
            if (dataSampah.length === 0) {
                tabelTrashBody.innerHTML = `<tr><td colspan="4" class="text-center" style="color: #64748b; padding:16px;">Tong sampah kosong.</td></tr>`;
                return;
            }

            dataSampah.forEach(item => {
                const nama = item.id_penghuni?.nama_lengkap || 'Kosong/Keluar';
                const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.jumlah_tagihan);
                
                tabelTrashBody.innerHTML += `
                    <tr>
                        <td style="padding:10px;" class="font-bold">${nama}</td>
                        <td style="padding:10px;">Bulan ${item.bulan_tagihan}/${item.tahun_tagihan}</td>
                        <td style="padding:10px; color:#ef4444;">${rupiah}</td>
                        <td style="padding:10px; text-align:center;">
                            <button class="btn-restore" data-id="${item._id}" style="color:#10b981; background:none; border:none; cursor:pointer; font-weight:600; display:inline-flex; align-items:center; gap:4px;">
                                <i class="ph ph-arrow-counter-clockwise" style="font-size:16px;"></i> Pulihkan
                            </button>
                        </td>
                    </tr>
                `;
            });
        } catch (error) {
            console.error('Gagal mengambil data tong sampah:', error);
            tabelTrashBody.innerHTML = `<tr><td colspan="4" class="text-center" style="color:red; padding:16px;">Gagal memuat sampah.</td></tr>`;
        }
    }

    // 4. EVENT CLICKS DI TABEL UTAMA (KONFIRMASI, EDIT, HAPUS)
    tabelBody.addEventListener('click', async (e) => {
        // --- AKSI: SOFT DELETE ---
        const tombolHapus = e.target.closest('.btn-hapus');
        if (tombolHapus) {
            const id = tombolHapus.getAttribute('data-id');
            if (!confirm("⚠️ Pindahkan tagihan ini ke Tong Sampah?")) return;

            try {
                const response = await fetch(`/api/pembayaran/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    alert("🗑️ Tagihan berhasil dibuang ke Tong Sampah!");
                    muatRiwayatPembayaran();
                }
            } catch (error) { console.error(error); }
        }

        // --- AKSI: EDIT (OPEN MODAL & GET DATA BY ID) ---
        const tombolEdit = e.target.closest('.btn-edit');
        if (tombolEdit) {
            const id = tombolEdit.getAttribute('data-id');
            try {
                const response = await fetch(`/api/pembayaran/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await response.json();
                const data = result.data || result;

                if (response.ok) {
                    // Isi values ke form modal edit (Status sudah dihapus)
                    document.getElementById('editId').value = data._id;
                    document.getElementById('editNama').value = data.id_penghuni?.nama_lengkap || 'Kosong';
                    document.getElementById('editNominal').value = data.jumlah_tagihan;
                    document.getElementById('editBulan').value = data.bulan_tagihan;
                    document.getElementById('editTahun').value = data.tahun_tagihan;
                    
                    // Format tanggal biar pas dengan input[type=date] (YYYY-MM-DD)
                    if (data.tgl_jatuh_tempo) {
                        document.getElementById('editJatuhTempo').value = data.tgl_jatuh_tempo.split('T')[0];
                    }

                    // Tampilkan Modalnya
                    document.getElementById('modalEdit').classList.add('show');
                }
            } catch (error) { console.error('Gagal mengambil detail data:', error); }
        }

        // --- AKSI: KONFIRMASI LUNAS ---
        const tombolLunas = e.target.closest('.btn-konfirmasi-lunas');
        if (tombolLunas) {
            const id = tombolLunas.getAttribute('data-id');
            if (!confirm("Yakin ingin mengonfirmasi tagihan ini sebagai LUNAS?")) return;
            
            // Berikan efek loading
            const teksAsli = tombolLunas.innerHTML;
            tombolLunas.innerHTML = '⏳ Proses...';
            tombolLunas.disabled = true;

            try {
                const response = await fetch(`/api/pembayaran/${id}/validate`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ status_bayar: 'lunas' })
                });
                
                // Ambil respons dari backend untuk mengecek error
                const result = await response.json(); 

                if (response.ok) { 
                    alert("✅ Status berhasil diubah menjadi LUNAS!"); 
                    await muatRiwayatPembayaran(); 
                } else {
                    // Jika backend menolak, tampilkan alasannya!
                    alert(`❌ Gagal Konfirmasi: ${result.message || result.error || 'Cek console untuk detail'}`);
                    console.error("Backend Error:", result);
                }
            } catch (error) { 
                console.error("Gagal Fetch:", error); 
                alert("Terjadi kesalahan jaringan atau server mati.");
            } finally {
                tombolLunas.innerHTML = teksAsli;
                tombolLunas.disabled = false;
            }
        }
    });

    // 5. EVENT SUBMIT FORM EDIT
    document.getElementById('formEditPembayaran').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editId').value;
        const btnSubmit = e.target.querySelector('button[type="submit"]');
        
        btnSubmit.innerHTML = '⏳ Menyimpan...';
        btnSubmit.disabled = true;
        
        // 🔥 PERUBAHAN: Data yang dikirim hanya nominal, bulan, tahun, jatuh_tempo
        const dataUpdate = {
            jumlah_tagihan: Number(document.getElementById('editNominal').value),
            bulan_tagihan: Number(document.getElementById('editBulan').value),
            tahun_tagihan: Number(document.getElementById('editTahun').value),
            tgl_jatuh_tempo: document.getElementById('editJatuhTempo').value
        };

        console.log("Data yang akan dikirim ke server:", dataUpdate); 

        try {
            const response = await fetch(`/api/pembayaran/${id}`, {
                method: 'PATCH', 
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(dataUpdate)
            });

            const result = await response.json();

            if (response.ok) {
                alert("✨ Detail tagihan berhasil diperbarui!");
                tutupModal('modalEdit');
                await muatRiwayatPembayaran();
            } else {
                alert(`❌ Gagal Menyimpan: ${result.message || result.error || 'Validasi backend gagal'}`);
                console.error("Backend Error:", result);
            }
        } catch (error) { 
            console.error("Error API:", error); 
            alert("Terjadi kesalahan koneksi saat menyimpan data.");
        } finally {
            btnSubmit.innerHTML = '💾 Simpan Perubahan';
            btnSubmit.disabled = false;
        }
    });

    // 6. EVENT RESTORE DATA DARI TONG SAMPAH
    tabelTrashBody.addEventListener('click', async (e) => {
        const tombolRestore = e.target.closest('.btn-restore');
        if (tombolRestore) {
            const id = tombolRestore.getAttribute('data-id');
            try {
                const response = await fetch(`/api/pembayaran/${id}/restore`, {
                    method: 'PATCH',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    alert("✅ Tagihan berhasil dipulihkan kembali!");
                    muatTongSampah(); // Refresh tabel sampah
                    muatRiwayatPembayaran(); // Refresh tabel utama
                }
            } catch (error) { console.error(error); }
        }
    });

    // 7. EVENT TRIGGER BUKA TONG SAMPAH
    document.getElementById('btnBukaTrash').addEventListener('click', () => {
        document.getElementById('modalTrash').classList.add('show');
        muatTongSampah();
    });

    // Event Listener Filter otomatis
    document.getElementById('cariNama')?.addEventListener('input', prosesDanRenderTabel);
    document.getElementById('filterStatus')?.addEventListener('change', prosesDanRenderTabel);
    document.getElementById('filterBulan')?.addEventListener('change', prosesDanRenderTabel);
    document.getElementById('filterTahun')?.addEventListener('change', prosesDanRenderTabel);
    document.getElementById('sortData')?.addEventListener('change', prosesDanRenderTabel);

    // Jalankan load data pertama kali
    muatRiwayatPembayaran();
});