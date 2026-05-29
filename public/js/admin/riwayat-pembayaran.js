// public/js/admin/riwayat-pembayaran.js

document.addEventListener('DOMContentLoaded', () => {
    const tabelBody = document.getElementById('tabelPembayaranBody');
    
    // Wadah global untuk menyimpan data asli dari backend agar bisa difilter real-time
    let semuaListPembayaran = []; 

    // 1. FUNGSI AMBIL DATA DARI SERVER (STRUKTUR TETAP SAMA)
    async function muatRiwayatPembayaran() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/pembayaran', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();

            if (response.ok) {
                // Logika pembongkaran array asli kamu tanpa diubah
                semuaListPembayaran = Array.isArray(result.data) ? result.data : 
                                      (result.data && Array.isArray(result.data.data)) ? result.data.data : 
                                      (result.data && Array.isArray(result.data.docs)) ? result.data.docs : [];

                // Jalankan pemrosesan filter dan render tabel
                prosesDanRenderTabel();
                
            } else {
                tabelBody.innerHTML = `<tr><td colspan="7" class="text-center" style="color: red; padding: 24px;">Gagal mengambil data dari server.</td></tr>`;
            }
        } catch (error) {
            console.error('Gagal memuat log pembayaran:', error);
            tabelBody.innerHTML = `<tr><td colspan="7" class="text-center" style="color: red; padding: 24px;">Gagal terhubung dengan server backend.</td></tr>`;
        }
    }

    // 2. FUNGSI UTAMA UNTUK FILTER, SORTING, DAN RENDER (LOGIKA RENDER 100% ASLI KAMU)
    function prosesDanRenderTabel() {
        // Ambil nilai dari element filter di HTML
        const keyword = document.getElementById('cariNama')?.value.toLowerCase().trim() || '';
        const status = document.getElementById('filterStatus')?.value || 'semua';
        const bulan = document.getElementById('filterBulan')?.value || 'semua';
        const tahun = document.getElementById('filterTahun')?.value || 'semua';
        const urutan = document.getElementById('sortData')?.value || 'terbaru';

        // A. PROSES FILTERING DATA
        let listTersaring = semuaListPembayaran.filter(item => {
            const namaUser = item.id_penghuni?.nama_lengkap || 'Kosong/Keluar';
            
            const matchNama = namaUser.toLowerCase().includes(keyword);
            
            // 🔥 FIXED: Jika pilih 'belum_bayar', loloskan semua yang statusnya BUKAN 'lunas' (termasuk menunggu_konfirmasi atau data kosong)
            const matchStatus = status === 'semua' || 
                                (status === 'belum_bayar' && item.status_bayar !== 'lunas') || 
                                item.status_bayar === status;

            const matchBulan = bulan === 'semua' || (item.bulan_tagihan && item.bulan_tagihan.toString() === bulan);
            const matchTahun = tahun === 'semua' || (item.tahun_tagihan && item.tahun_tagihan.toString() === tahun);

            return matchNama && matchStatus && matchBulan && matchTahun;
        });

        // B. PROSES SORTING DATA (MENYESUAIKAN DROPDOWN TANPA MERUSAK DEFAULT KAMU)
        listTersaring.sort((a, b) => {
            if (urutan === 'nama_asc') {
                const namaA = a.id_penghuni?.nama_lengkap || 'Kosong/Keluar';
                const namaB = b.id_penghuni?.nama_lengkap || 'Kosong/Keluar';
                return namaA.localeCompare(namaB);
            } else if (urutan === 'terlama') {
                return new Date(a.tgl_jatuh_tempo) - new Date(b.tgl_jatuh_tempo);
            } else {
                // Urutan Default Asli Kamu: lunas di bawah, lalu berdasarkan tgl_jatuh_tempo terbaru
                if (a.status_bayar === 'lunas' && b.status_bayar !== 'lunas') return 1;
                if (a.status_bayar !== 'lunas' && b.status_bayar === 'lunas') return -1;
                return new Date(b.tgl_jatuh_tempo) - new Date(a.tgl_jatuh_tempo);
            }
        });

        // C. PROSES TAMPILKAN KE HTML (100% COPY PASTE DARI KODE ASLI KAMU)
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
            let tombolAksi = '-';

            if (item.status_bayar === 'lunas') {
                classBadgeClay = 'badge-clay green';
                tombolAksi = `<span class="text-selesai-lunas" style="color: #10b981; font-weight: 600;"><i class="ph ph-check-circle"></i> Selesai</span>`;
            } else {
                if (item.status_bayar === 'menunggu_konfirmasi') {
                    classBadgeClay = 'badge'; 
                }
                tombolAksi = `
                    <button class="btn-success-sm btn-konfirmasi-lunas" data-id="${item._id}">
                        <i class="ph ph-check-square-offset"></i> Konfirmasi Lunas
                    </button>
                `;
            }

            const teksStatusTampil = item.status_bayar ? item.status_bayar.replace('_', ' ') : 'belum bayar';

            tabelBody.innerHTML += `
                <tr>
                  <td class="font-bold">${namaUser}</td>
                  <td>No. ${noKamar}</td>
                  <td>Bulan ${item.bulan_tagihan} / ${item.tahun_tagihan}</td>
                  <td class="font-bold" style="color: var(--pink-600);">${formatRupiah}</td>
                  <td style="color: var(--n500);">${tglJatuhTempo}</td>
                  <td>
                    <span class="${classBadgeClay}" style="text-transform: uppercase; font-size: 10px;">
                      ${teksStatusTampil}
                    </span>
                  </td>
                  <td>${tombolAksi}</td>
                </tr>
            `;
        });
    }

    // 3. PASANG EVENT LISTENER AGAR OTOMATIS BERUBAH SAAT DIKETIK/DIKLIK
    document.getElementById('cariNama')?.addEventListener('input', prosesDanRenderTabel);
    document.getElementById('filterStatus')?.addEventListener('change', prosesDanRenderTabel);
    document.getElementById('filterBulan')?.addEventListener('change', prosesDanRenderTabel);
    document.getElementById('filterTahun')?.addEventListener('change', prosesDanRenderTabel);
    document.getElementById('sortData')?.addEventListener('change', prosesDanRenderTabel);

    // 4. DETEKSI KLIK PADA TOMBOL "KONFIRMASI LUNAS" (ASLI MILIKMU TANPA DIUBAH)
    tabelBody.addEventListener('click', async (e) => {
        const tombolLunas = e.target.closest('.btn-konfirmasi-lunas');
        
        if (tombolLunas) {
            const idPembayaran = tombolLunas.getAttribute('data-id');
            
            const yakin = confirm("Yakin ingin mengonfirmasi tagihan ini sebagai LUNAS?");
            if (!yakin) return;

            try {
                const token = localStorage.getItem('token');

                const response = await fetch(`/api/pembayaran/${idPembayaran}/validate`, {
                    method: 'PATCH',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify({ status_bayar: 'lunas' })
                });

                const result = await response.json();

                if (response.ok) {
                    alert("✅ Tagihan berhasil ditandai LUNAS!");
                    muatRiwayatPembayaran(); // Memuat ulang data dari server
                } else {
                    alert(`Gagal memperbarui: ${result.message || 'Kesalahan server'}`);
                }
            } catch (error) {
                console.error("Gagal mengonfirmasi lunas:", error);
                alert("Gagal terhubung dengan server untuk mengupdate tagihan.");
            }
        }
    });

    // Muat data pertama kali saat halaman dibuka
    muatRiwayatPembayaran();
});