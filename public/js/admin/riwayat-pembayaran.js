// public/js/admin/riwayat-pembayaran.js

document.addEventListener('DOMContentLoaded', () => {
    const tabelBody = document.getElementById('tabelPembayaranBody');

    // 1. FUNGSI AMBIL DATA & RENDER TABEL
    async function muatRiwayatPembayaran() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/pembayaran', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();

            if (response.ok) {
                let listPembayaran = Array.isArray(result.data) ? result.data : 
                                     (result.data && Array.isArray(result.data.data)) ? result.data.data : 
                                     (result.data && Array.isArray(result.data.docs)) ? result.data.docs : [];

                if (listPembayaran.length === 0) {
                    tabelBody.innerHTML = `<tr><td colspan="7" class="text-center" style="color: var(--n500); padding: 24px;">Belum ada riwayat tagihan apa pun.</td></tr>`;
                    return;
                }
                
                listPembayaran.sort((a, b) => {
                    if (a.status_bayar === 'lunas' && b.status_bayar !== 'lunas') return 1;
                    if (a.status_bayar !== 'lunas' && b.status_bayar === 'lunas') return -1;
                    return new Date(b.tgl_jatuh_tempo) - new Date(a.tgl_jatuh_tempo);
                });

                tabelBody.innerHTML = '';
                listPembayaran.forEach(item => {
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
            } else {
                tabelBody.innerHTML = `<tr><td colspan="7" class="text-center" style="color: red; padding: 24px;">Gagal mengambil data dari server.</td></tr>`;
            }
        } catch (error) {
            console.error('Gagal memuat log pembayaran:', error);
            tabelBody.innerHTML = `<tr><td colspan="7" class="text-center" style="color: red; padding: 24px;">Gagal terhubung dengan server backend.</td></tr>`;
        }
    }

    // 2. DETEKSI KLIK PADA TOMBOL "KONFIRMASI LUNAS"
    tabelBody.addEventListener('click', async (e) => {
        const tombolLunas = e.target.closest('.btn-konfirmasi-lunas');
        
        if (tombolLunas) {
            const idPembayaran = tombolLunas.getAttribute('data-id');
            
            const yakin = confirm("Yakin ingin mengonfirmasi tagihan ini sebagai LUNAS?");
            if (!yakin) return;

            try {
                const token = localStorage.getItem('token');

                // 🟢 PERBAIKAN UTAMA: Sekarang menembak /api/pembayaran/:id/validate sesuai spesifikasi Backend kamu!
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
                    // Panggil ulang fungsi agar tabel otomatis menyusun ulang datanya
                    muatRiwayatPembayaran();
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