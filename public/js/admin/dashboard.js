// public/js/admin/dashboard.js

const API_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../login.html';
        return;
    }

    // 1. Ambil Data Auth User
    fetch(`${API_URL}/auth/me`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.data) {
                if (data.data.role === 'pemilik') {
                    window.location.href = '../pemilik/dashboard.html';
                    return;
                }

                const elName = document.getElementById('profileName');
                const elAvatar = document.getElementById('avatarInitial');
                if (elName) elName.textContent = data.data.nama_lengkap;
                if (elAvatar) elAvatar.textContent = data.data.nama_lengkap.charAt(0).toUpperCase();
            }
        })
        .catch(() => {
            localStorage.removeItem('token');
            window.location.href = '../login.html';
        });

    // 2. Jalankan penarikan data dashboard awal
    fetchPenghuni();
    fetchDashboardStats();
});

// Ambil Statistik Kamar Kosong
function fetchDashboardStats() {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };

    fetch(`${API_URL}/kamar/stats/summary`, { method: 'GET', headers })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.data) {
                // Ambil data kamar tersedia (kosong)
                document.getElementById('statKamarKosong').textContent = data.data.tersedia ?? '0';

                // Jika backend summary menyediakan info kamar terisi, kita pakai juga sebagai backup alternatif
                if (data.data.terisi !== undefined) {
                    document.getElementById('statKamarTerisi').textContent = data.data.terisi;
                }
            }
        })
        .catch(() => {
            document.getElementById('statKamarKosong').textContent = 'Error';
        });
}

// Ambil Semua List Penghuni Aktif & Hitung Statistik Kamar Terisi / Total Penghuni
function fetchPenghuni() {
    const token = localStorage.getItem('token');
    const tbody = document.getElementById('tenantTableBody');

    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">Menarik data dari database...</td></tr>';

    fetch(`${API_URL}/penghuni`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    })
        .then(res => res.json())
        .then(resData => {
            tbody.innerHTML = '';

            // Normalisasi array data (antisipasi perbedaan format bungkus data backend)
            const penghuniList = resData.data?.data || resData.data || (Array.isArray(resData) ? resData : []);

            // FIX: Hanya proses & hitung penghuni yang statusnya benar-benar 'aktif'
            const penghuniAktif = penghuniList.filter(p => String(p.status_penghuni || 'aktif').toLowerCase() === 'aktif');

            // Hitung total penghuni aktif
            document.getElementById('statTotalPenghuni').textContent = penghuniAktif.length;

            // Hitung total kamar terisi unik berdasarkan penghuni aktif
            const kamarTerisiSet = new Set();
            penghuniAktif.forEach(p => {
                const roomId = p.id_kamar?._id || p.id_kamar || p.kamar_id?._id || p.kamar_id;
                if (roomId) kamarTerisiSet.add(roomId);
            });

            // Tampilkan jumlah kamar terisi (jika Set kosong, fallback ke jumlah penghuni aktif)
            document.getElementById('statKamarTerisi').textContent = kamarTerisiSet.size || penghuniAktif.length;

            if (penghuniAktif.length > 0) {
                penghuniAktif.forEach(penghuni => {

                    // PROTEKSI KETAT: Membaca skema objek kamar (Sama persis seperti kelola-penghuni.js)
                    let kamarData = {};
                    if (typeof penghuni.id_kamar === 'object' && penghuni.id_kamar !== null) {
                        kamarData = penghuni.id_kamar;
                    } else if (typeof penghuni.kamar_id === 'object' && penghuni.kamar_id !== null) {
                        kamarData = penghuni.kamar_id;
                    } else {
                        kamarData = penghuni;
                    }

                    const nomorKamar = kamarData.nomor_kamar || kamarData.no_kamar || '??';
                    const lantai = kamarData.lantai || kamarData.nomor_lantai || '';
                    const teksLantai = lantai ? ` (Lt. ${lantai})` : '';

                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                <td class="font-bold">Kamar ${nomorKamar}${teksLantai}</td>
                <td>${penghuni.nama_lengkap || '-'}</td>
                <td>${penghuni.no_ktp || '-'}</td>
                <td>
                  <button class="btn btn-ghost btn-sm" onclick="alert('Fitur tagih untuk ${penghuni.nama_lengkap} segera hadir')">
                    <i class="ph ph-receipt"></i> Tagih
                  </button>
                </td>
              `;
                    tbody.appendChild(tr);
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: var(--text-muted);">Belum ada data penghuni aktif yang terdaftar.</td></tr>';
            }
        })
        .catch(err => {
            console.error('Error memuat penghuni:', err);
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #dc2626;">Koneksi ke backend gagal atau data tidak valid.</td></tr>';
        });
}

function handleLogout() {
    localStorage.removeItem('token');
    window.location.href = '../login.html';
}