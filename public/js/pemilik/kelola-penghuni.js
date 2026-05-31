let dataPenghuniGlobal = []; // Menyimpan data tarikan awal agar filter berjalan instan (Zero-Lag)

document.addEventListener('DOMContentLoaded', () => {
    // Pengecekan token tetap di sini agar halaman tetap aman
    if (!localStorage.getItem('token')) { 
        window.location.href = '../login.html'; 
        return; 
    }

    // Profil pemilik sudah diurus oleh layout-pemilik.js, 
    // jadi kita hanya perlu fokus pada fungsi monitoring data
    fetchPenghuni();
});

function fetchPenghuni() {
    const token = localStorage.getItem('token');
    const tbody = document.getElementById('tenantTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">Memuat data...</td></tr>';

    fetch(`${window.API_URL}/penghuni`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(resData => {
        // Simpan data ke variabel global, lalu panggil fungsi render
        dataPenghuniGlobal = resData.data?.data || resData.data || [];
        renderTable(); 
    })
    .catch(err => {
        console.error("Error:", err);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: red;">Gagal memuat data.</td></tr>';
    });
}

function renderTable() {
    const tbody = document.getElementById('tenantTableBody');
    const filterElement = document.getElementById('filterStatus');
    const filterValue = filterElement ? filterElement.value : 'aktif'; // Default ke aktif
    tbody.innerHTML = '';

    // 1. Logika Pemfilteran Data
    let filteredData = dataPenghuniGlobal;
    if (filterValue === 'aktif') {
        filteredData = dataPenghuniGlobal.filter(p => (p.status_penghuni || 'aktif').toLowerCase() !== 'keluar');
    } else if (filterValue === 'keluar') {
        filteredData = dataPenghuniGlobal.filter(p => (p.status_penghuni || 'aktif').toLowerCase() === 'keluar');
    }

    // 2. Logika Pengurutan (Sorting): Aktif di atas, Keluar di bawah
    filteredData.sort((a, b) => {
        const statusA = (a.status_penghuni || 'aktif').toLowerCase();
        const statusB = (b.status_penghuni || 'aktif').toLowerCase();
        
        if (statusA === 'aktif' && statusB === 'keluar') return -1;
        if (statusA === 'keluar' && statusB === 'aktif') return 1;
        
        const kamarA = a.id_kamar?.nomor_kamar || 999; 
        const kamarB = b.id_kamar?.nomor_kamar || 999;
        return kamarA - kamarB;
    });

    // 3. Render ke Tabel
    if (filteredData.length > 0) {
        filteredData.forEach(p => {
            const tr = document.createElement('tr');
            const status = (p.status_penghuni || 'aktif').toLowerCase();
            const statusClass = status === 'aktif' ? 'success' : 'danger';

            // --- PENARIKAN DATA KAMAR, LANTAI, DAN TIPE ---
            const nomorKamar = p.id_kamar?.nomor_kamar || '-';
            const lantaiKamar = p.id_kamar?.lantai || '-';
            const tipeKamar = p.id_kamar?.tipe_kamar || '-';

            // Efek visual: Jika keluar, baris agak redup
            if (status === 'keluar') {
                tr.style.backgroundColor = '#f8fafc';
                tr.style.opacity = '0.75';
            }

            tr.innerHTML = `
                <td class="font-bold">
                    No. ${nomorKamar} / Lt. ${lantaiKamar}<br>
                    <span style="font-size: 11.5px; color: #94a3b8; font-weight: normal;">Tipe ${tipeKamar}</span>
                </td>
                <td class="font-bold" style="color: var(--text-cozy);">${p.nama_lengkap || '-'}</td>
                <td>
                    <div style="font-size: 12px; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                        <i class="ph ph-phone"></i> ${p.no_hp || '-'}
                    </div>
                    <div style="font-size: 12px; display: flex; align-items: center; gap: 6px;">
                        <i class="ph ph-envelope"></i> ${p.email || '-'}
                    </div>
                </td>
                <td><span class="badge badge-${statusClass}">${status.toUpperCase()}</span></td>
            `;
            tbody.appendChild(tr);
        });
    } else {
        const teksStatus = filterValue === 'semua' ? 'terdaftar' : filterValue;
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px;">Belum ada penghuni dengan status ${teksStatus}.</td></tr>`;
    }
}