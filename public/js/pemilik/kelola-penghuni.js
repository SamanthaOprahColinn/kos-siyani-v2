// public/js/pemilik/kelola-penghuni.js

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

    fetch(`${API_URL}/penghuni`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(resData => {
        tbody.innerHTML = '';
        
        // Mengikuti struktur data yang sama dengan kelola-kamar
        const list = resData.data?.data || resData.data || [];

        if (list.length > 0) {
            list.forEach(p => {
                const tr = document.createElement('tr');
                const nomorKamar = p.id_kamar?.nomor_kamar || 'N/A';
                const status = (p.status_penghuni || 'aktif').toLowerCase();
                const statusClass = status === 'aktif' ? 'success' : 'danger';

                tr.innerHTML = `
                    <td class="font-bold">Kamar ${nomorKamar}</td>
                    <td>${p.nama_lengkap || '-'}</td>
                    <td>
                        <div style="font-size: 12px;"><i class="ph ph-phone"></i> ${p.no_hp || '-'}</div>
                        <div style="font-size: 12px;"><i class="ph ph-envelope"></i> ${p.email || '-'}</div>
                    </td>
                    <td><span class="badge badge-${statusClass}">${status.toUpperCase()}</span></td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">Belum ada penghuni terdaftar.</td></tr>';
        }
    })
    .catch(err => {
        console.error("Error:", err);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: red;">Gagal memuat data.</td></tr>';
    });
}