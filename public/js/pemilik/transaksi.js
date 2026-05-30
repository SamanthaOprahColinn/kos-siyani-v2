// public/js/pemilik/transaksi.js

let idTagihanTerpilih = null;

document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('token')) { 
        window.location.href = '../login.html'; 
        return; 
    }
    fetchTransaksi();
});

// 1. MENGAMBIL SELURUH DATA TRANSAKSI
function fetchTransaksi() {
    const tbody = document.getElementById('transaksiTableBody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Memuat data transaksi...</td></tr>';

    // Tambahkan parameter timestamp untuk mencegah cache browser
    const timestamp = new Date().getTime();
    fetch(`${window.API_URL || 'http://localhost:5000/api'}/pembayaran?_t=${timestamp}`, {
        method: 'GET',
        headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Cache-Control': 'no-cache'
        },
        cache: 'no-store'
    })
    .then(res => res.json())
    .then(resData => {
        tbody.innerHTML = '';
        
        const list = Array.isArray(resData.data) ? resData.data : 
                     (resData.data && Array.isArray(resData.data.data)) ? resData.data.data : 
                     (resData.data && Array.isArray(resData.data.docs)) ? resData.data.docs : [];

        if (list.length > 0) {
            list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            list.forEach(t => {
                const tr = document.createElement('tr');
                
                const namaPenghuni = t.id_penghuni?.nama_lengkap || 'Kosong/Keluar';
                
                // --- PENARIKAN DATA NOMOR KAMAR DAN LANTAI ---
                const nomorKamar = t.id_kamar?.nomor_kamar || '-';
                const lantaiKamar = t.id_kamar?.lantai || '-';
                
                // --- FORMAT TANGGAL PEMBUATAN ---
                const tanggalDibuat = new Date(t.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'short', year: 'numeric'
                });
                
                const formatRupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(t.jumlah_tagihan);
                const statusStr = (t.status_bayar || 'belum_bayar').toLowerCase();
                
                // Pewarnaan Badge Status
                let badgeClass = 'warning';
                let statusLabel = statusStr.replace('_', ' ').toUpperCase();
                
                if (statusStr === 'lunas') badgeClass = 'success';
                else if (statusStr === 'ditolak') badgeClass = 'danger';
                else if (statusStr === 'menunggu_konfirmasi') badgeClass = 'info';

                // Kolom Aksi (Tombol hanya muncul saat status = menunggu_konfirmasi)
                let aksiHtml = `<span style="color: var(--n400); font-size: 13px;">-</span>`;
                
                if (statusStr === 'menunggu_konfirmasi') {
                    aksiHtml = `
                        <button class="btn btn-sm" onclick="openVerifikasiModal('${t._id}')" style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600; transition: transform 0.2s;">
                            <i class="ph ph-shield-check"></i> Periksa Bukti
                        </button>
                    `;
                }

                // --- EFEK VISUAL UNTUK LUNAS ---
                if (statusStr === 'lunas') {
                    tr.style.backgroundColor = '#f8fafc';
                    tr.style.opacity = '0.65';
                }

                // --- UPDATE TAMPILAN TABEL ---
                tr.innerHTML = `
                    <td class="font-bold">${namaPenghuni}</td>
                    <td>No. ${nomorKamar} / Lt. ${lantaiKamar}</td>
                    <td>
                        Bln ${t.bulan_tagihan} / ${t.tahun_tagihan}<br>
                        <span style="font-size: 11.5px; color: #94a3b8; font-weight: normal;">Dibuat: ${tanggalDibuat}</span>
                    </td>
                    <td class="font-bold" style="color: var(--pink-600);">${formatRupiah}</td>
                    <td><span class="badge badge-${badgeClass}">${statusLabel}</span></td>
                    <td style="text-align: center;">${aksiHtml}</td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Belum ada riwayat transaksi.</td></tr>';
        }
    })
    .catch(err => {
        console.error("Error Fetch Pembayaran:", err);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Gagal terhubung ke server.</td></tr>';
    });
}

// 2. MEMBUKA MODAL & MENARIK GAMBAR BUKTI TRANSFER
function openVerifikasiModal(id) {
    idTagihanTerpilih = id;
    const modal = document.getElementById('verifikasiModal');
    const loadingText = document.getElementById('loadingBukti');
    const imgElement = document.getElementById('previewBukti');
    
    modal.style.display = 'flex';
    loadingText.style.display = 'block';
    loadingText.innerHTML = '<i class="ph ph-spinner-gap spin-icon"></i> Memuat bukti...';
    imgElement.style.display = 'none';
    imgElement.src = '';

    fetch(`${window.API_URL || 'http://localhost:5000/api'}/pembayaran/${id}/bukti`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(resData => {
        if (resData.success && resData.data?.bukti_bayar) {
            imgElement.src = resData.data.bukti_bayar; 
            loadingText.style.display = 'none';
            imgElement.style.display = 'block';
        } else {
            loadingText.innerHTML = '<span style="color: #ef4444;">Bukti transfer rusak atau tidak ditemukan.</span>';
        }
    })
    .catch(err => {
        console.error("Gagal menarik gambar bukti:", err);
        loadingText.innerHTML = '<span style="color: #ef4444;">Gagal mengambil gambar dari server.</span>';
    });
}

function closeVerifikasiModal() {
    idTagihanTerpilih = null;
    document.getElementById('verifikasiModal').style.display = 'none';
}

// 3. PROSES VALIDASI (TERIMA / TOLAK)
function prosesVerifikasi(keputusan) {
    if (!idTagihanTerpilih) return;
    
    const konfirmasiPesan = keputusan === 'lunas' 
        ? "Yakin ingin menyatakan pembayaran ini LUNAS?" 
        : "Yakin ingin MENOLAK bukti pembayaran ini?";
        
    if (!confirm(konfirmasiPesan)) return;

    const btnTolak = document.getElementById('btnTolak');
    const btnSetuju = document.getElementById('btnSetuju');
    btnTolak.disabled = true;
    btnSetuju.disabled = true;
    btnSetuju.textContent = '⏳ Memproses...';
    
    const payload = {
        status_bayar: keputusan,
        catatan_admin: keputusan === 'ditolak' ? 'Bukti transfer tidak valid/buram. Harap unggah ulang yang benar.' : ''
    };

    fetch(`${window.API_URL || 'http://localhost:5000/api'}/pembayaran/${idTagihanTerpilih}/validate`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(resData => {
        if (resData.success) {
            alert(keputusan === 'lunas' ? '✅ Tagihan berhasil dilunaskan!' : '❌ Pembayaran ditolak.');
            closeVerifikasiModal();
            fetchTransaksi(); 
        } else {
            alert(`Gagal memproses: ${resData.message || resData.error}`);
        }
    })
    .catch(err => {
        console.error("Error API Validasi:", err);
        alert('Terjadi kesalahan koneksi saat verifikasi.');
    })
    .finally(() => {
        btnTolak.disabled = false;
        btnSetuju.disabled = false;
        btnSetuju.textContent = 'Valid (Lunas)';
    });
}