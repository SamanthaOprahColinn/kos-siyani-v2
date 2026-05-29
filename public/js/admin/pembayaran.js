// public/js/admin/pembayaran.js

document.addEventListener('DOMContentLoaded', () => {
    const formPembayaran = document.getElementById('formPembayaran');
    const selectPenghuni = document.getElementById('id_penghuni');
    const inputKamarDisplay = document.getElementById('kamar_display'); // 🟢 Menangkap input readonly
    const inputIdKamarHidden = document.getElementById('id_kamar');     // 🟢 Menangkap input hidden
    const tabelBody = document.getElementById('tabelPembayaranBody');

    // Variabel untuk menyimpan instance library pencarian agar bisa di-reset nanti
    let selectLibrary; 
    let masterDaftarPenghuni = [];

    // Isi otomatis default tahun saat ini
    document.getElementById('tahun_tagihan').value = new Date().getFullYear();

    // 1. LOAD DATA PENGHUNI UNTUK DROP-DOWN SEARCH
    async function ambilDataPenghuniDropdown() {
        try {
            const token = localStorage.getItem('token');
            // Hanya ambil penghuni yang aktif
            const response = await fetch('/api/penghuni?status=aktif', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();

            if (response.ok) {
                // 🟢 DEFENSIVE CODING: Deteksi array dengan aman
                let listPenghuni = [];
                if (Array.isArray(result.data)) {
                    listPenghuni = result.data;
                } else if (result.data && Array.isArray(result.data.data)) {
                    listPenghuni = result.data.data;
                } else if (result.data && Array.isArray(result.data.docs)) {
                    listPenghuni = result.data.docs;
                }

                masterDaftarPenghuni = listPenghuni;
                selectPenghuni.innerHTML = '<option value="">-- Cari atau Pilih Penghuni --</option>';

                masterDaftarPenghuni.forEach(p => {
                    const noKamar = p.id_kamar?.nomor_kamar || 'Tanpa Kamar';
                    selectPenghuni.innerHTML += `<option value="${p._id}">${p.nama_lengkap} (Kamar: ${noKamar})</option>`;
                });

                // 🟢 AKTIFKAN FITUR SEARCH (TOM SELECT)
                if (selectLibrary) {
                    selectLibrary.destroy(); // Hancurkan sisa cache jika dipanggil ulang
                }
                selectLibrary = new TomSelect(selectPenghuni, {
                    create: false,
                    sortField: { field: "text", direction: "asc" }
                });
            }
        } catch (error) {
            console.error('Gagal memuat daftar penghuni:', error);
        }
    }

    // 2. DETEKSI PILIHAN PENGHUNI UNTUK AUTO-FILL DATA KAMAR & HARGA
    selectPenghuni.addEventListener('change', (e) => {
        const idPenghuniTerpilih = e.target.value;
        const infoPenghuni = masterDaftarPenghuni.find(p => p._id === idPenghuniTerpilih);

        if (infoPenghuni && infoPenghuni.id_kamar) {
            const kamarObj = infoPenghuni.id_kamar;
            const idKamar = kamarObj._id || kamarObj;
            const nomorKamar = kamarObj.nomor_kamar || 'Terdaftar';

            // 🟢 PERBAIKAN: Isi teks kamar ke input readonly, dan ID ke input hidden
            inputIdKamarHidden.value = idKamar;
            inputKamarDisplay.value = `Kamar No. ${nomorKamar}`;

            // Auto-fill harga sewa kamar ke input nominal tagihan
            if (kamarObj.harga_sewa) {
                document.getElementById('jumlah_tagihan').value = kamarObj.harga_sewa;
            }
        } else {
            // Reset jika penghuni tidak punya kamar / batal pilih
            inputIdKamarHidden.value = '';
            inputKamarDisplay.value = '';
            document.getElementById('jumlah_tagihan').value = '';
        }
    });

    // 3. LOAD SEMUA LOG TRANSAKSI/PEMBAYARAN DARI BACKEND
    async function muatRiwayatPembayaran() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/pembayaran', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();

            if (response.ok) {
                let listPembayaran = [];
                if (Array.isArray(result.data)) {
                    listPembayaran = result.data;
                } else if (result.data && Array.isArray(result.data.data)) {
                    listPembayaran = result.data.data;
                } else if (result.data && Array.isArray(result.data.docs)) {
                    listPembayaran = result.data.docs;
                }

                if (listPembayaran.length === 0) {
                    tabelBody.innerHTML = `<tr><td colspan="6" class="text-center" style="color: var(--n500); padding: 24px;">Belum ada riwayat tagihan terbit.</td></tr>`;
                    return;
                }

                tabelBody.innerHTML = '';
                listPembayaran.forEach(item => {
                    const namaUser = item.id_penghuni?.nama_lengkap || 'Kosong/Keluar';
                    const noKamar = item.id_kamar?.nomor_kamar || '-';
                    const formatRupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.jumlah_tagihan);
                    const tglJatuhTempo = new Date(item.tgl_jatuh_tempo).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

                    let classBadgeClay = 'badge-clay pink'; 
                    if (item.status_bayar === 'lunas') {
                        classBadgeClay = 'badge-clay green';
                    } else if (item.status_bayar === 'menunggu konfirmasi') {
                        classBadgeClay = 'badge'; 
                    }

                    tabelBody.innerHTML += `
                        <tr>
                          <td class="font-bold">${namaUser}</td>
                          <td>No. ${noKamar}</td>
                          <td>Bulan ${item.bulan_tagihan} / ${item.tahun_tagihan}</td>
                          <td class="font-bold" style="color: var(--pink-600);">${formatRupiah}</td>
                          <td style="color: var(--n500);">${tglJatuhTempo}</td>
                          <td>
                            <span class="${classBadgeClay}" style="text-transform: uppercase; font-size: 10px;">
                              ${item.status_bayar}
                            </span>
                          </td>
                        </tr>
                    `;
                });
            }
        } catch (error) {
            console.error('Gagal memuat log pembayaran:', error);
            tabelBody.innerHTML = `<tr><td colspan="6" class="text-center" style="color: red; padding: 24px;">Gagal terhubung dengan server backend.</td></tr>`;
        }
    }

    // 4. LOGIKA SUBMIT DAN POST DATA KE API
    formPembayaran.addEventListener('submit', async (e) => {
        e.preventDefault();

        const dataPayload = {
            id_penghuni: document.getElementById('id_penghuni').value,
            id_kamar: inputIdKamarHidden.value, // Ambil dari input hidden
            bulan_tagihan: parseInt(document.getElementById('bulan_tagihan').value, 10),
            tahun_tagihan: parseInt(document.getElementById('tahun_tagihan').value, 10),
            jumlah_tagihan: parseInt(document.getElementById('jumlah_tagihan').value, 10),
            tgl_jatuh_tempo: document.getElementById('tgl_jatuh_tempo').value
        };

        // Validasi ekstra kalau id_kamar kosong
        if (!dataPayload.id_kamar) {
            return alert('Penghuni ini belum ditugaskan ke kamar mana pun!');
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/pembayaran', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dataPayload)
            });

            const result = await response.json();

            if (response.ok) {
                alert('🎉 Tagihan Pembayaran berhasil terbit!');
                
                // 🟢 Reset form dan library search
                formPembayaran.reset();
                document.getElementById('tahun_tagihan').value = new Date().getFullYear();
                if (selectLibrary) selectLibrary.clear(); // Bersihkan pilihan dropdown
                inputKamarDisplay.value = '';
                inputIdKamarHidden.value = '';
                
                // Refresh tabel log otomatis
                muatRiwayatPembayaran();
            } else {
                alert(`Gagal menerbitkan: ${result.message || 'Kesalahan validasi'}`);
            }
        } catch (error) {
            console.error('Koneksi HTTP Error:', error);
            alert('Gagal mengirimkan data, server backend tidak merespons.');
        }
    });

    // Jalankan fungsi otomatis saat halaman siap
    ambilDataPenghuniDropdown();
    muatRiwayatPembayaran();
});