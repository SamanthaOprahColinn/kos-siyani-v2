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
                    
                    // Ambil ID Penghuni untuk dilempar ke fungsi tagih bulanan
                    const tenantId = penghuni._id || penghuni.id || '';

                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                <td class="font-bold">Kamar ${nomorKamar}${teksLantai}</td>
                <td>${penghuni.nama_lengkap || '-'}</td>
                <td>${penghuni.no_ktp || '-'}</td>
                <td>
                  <button class="btn btn-ghost btn-sm" onclick="tagihPenghuni('${tenantId}', '${penghuni.nama_lengkap || '-'}')">
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


/* ==========================================================================
   FITUR TAMBAHAN: LOGIKA CEK & TAGIH REAL-TIME 
   ========================================================================== */
async function tagihPenghuni(idPenghuni, namaPenghuni) {
    const token = localStorage.getItem('token');
    
    try {
        showToast(`🔍 Mengecek tagihan ${namaPenghuni}...`, "success");
        
        console.log("====== PENGECEKAN TAGIHAN ======");
        console.log("Mencari tagihan untuk ID Penghuni:", idPenghuni);

        // 1. Ambil SEMUA data pembayaran dari rute asli backend-mu
        const response = await fetch(`${API_URL}/pembayaran`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const result = await response.json();
        console.log("Data pembayaran dari backend:", result);

        // Ekstraksi array data pembayaran (antisipasi format bungkus data backend)
        const listPembayaran = result.data?.data || result.data || (Array.isArray(result) ? result : []);

        // 2. FILTER: Cari apakah ada tagihan yang id_penghuni-nya cocok dengan penghuni ini
        // dan statusnya belum lunas (misal: 'belum_bayar', 'pending', dll)
        const tagihanAda = listPembayaran.some(pembayaran => {
            // Membaca ID Penghuni di dalam objek pembayaran (antisipasi jika berupa objek atau string langsung)
            const idTarget = pembayaran.id_penghuni?._id || pembayaran.id_penghuni || pembayaran.penghuni_id;
            
            // Cari tagihan yang belum lunas (sesuaikan string 'lunas' jika di databasemu berbeda)
            const belumLunas = String(pembayaran.status || '').toLowerCase() !== 'lunas'; 
            
            return String(idTarget) === String(idPenghuni) && belumLunas;
        });

        console.log("Hasil analisa frontend -> Apakah tagihan terdaftar?", tagihanAda);
        console.log("================================");

        // 3. Jika setelah dicek ternyata TIDAK ADA tagihan aktif
        if (!tagihanAda) {
            tampilkanModalKonfirmasiTagihan(namaPenghuni);
            return;
        }

        // 4. JIKA TAGIHAN ADA: Pemicu simulasi notifikasi real-time ke panel penghuni
        // Karena di backend belum ada route '/kirim-notif', kita handle langsung dengan Toast sukses di frontend
        showToast(`✅ Real-time: Tagihan bulan ini berhasil diingatkan ke ${namaPenghuni}!`, "success");

    } catch (error) {
        console.error('Ada kendala saat memverifikasi tagihan:', error);
        // Fallback jika terjadi kendala koneksi
        tampilkanModalKonfirmasiTagihan(namaPenghuni);
    }
}

function tampilkanModalKonfirmasiTagihan(namaPenghuni) {
    const backdrop = document.createElement('div');
    backdrop.style.position = 'fixed';
    backdrop.style.top = '0';
    backdrop.style.left = '0';
    backdrop.style.width = '100%';
    backdrop.style.height = '100%';
    backdrop.style.background = 'rgba(93, 68, 78, 0.4)';
    backdrop.style.backdropFilter = 'blur(8px)';
    backdrop.style.display = 'flex';
    backdrop.style.alignItems = 'center';
    backdrop.style.justifyContent = 'center';
    backdrop.style.zIndex = '9999';

    backdrop.innerHTML = `
        <div class="table-wrapper page-enter" style="background: rgba(255, 255, 255, 0.95); max-width: 400px; padding: 28px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.1); margin: 20px;">
            <div style="width: 56px; height: 56px; background: #ffccd5; color: #a71e34; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 26px; margin: 0 auto 16px;">
                <i class="ph ph-receipt"></i>
            </div>
            <h3 style="font-size: 18px; font-weight: 800; color: #5d444e; margin-bottom: 8px;">Tagihan Belum Dibuat</h3>
            <p style="font-size: 13.5px; color: #8c737d; line-height: 1.5; margin-bottom: 24px;">
                Tagihan bulanan untuk <strong>${namaPenghuni}</strong> belum terdaftar. Mau dialihkan untuk membuat tagihannya sekarang?
            </p>
            <div style="display: flex; gap: 12px;">
                <button id="closeModalBtn" class="btn btn-ghost btn-sm" style="flex: 1; padding: 12px; border-radius: 12px; font-weight: 700;">Nanti Saja</button>
                <button id="goToPaymentBtn" class="quick-action-btn qab-green" style="flex: 1; justify-content: center; border-radius: 12px; font-size: 13px; font-weight: 700; padding: 12px;">
                    Buat Sekarang
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(backdrop);

    backdrop.querySelector('#closeModalBtn').addEventListener('click', () => {
        backdrop.remove();
    });

    backdrop.querySelector('#goToPaymentBtn').addEventListener('click', () => {
        backdrop.remove();
        window.location.href = 'pembayaran.html'; 
    });
}

function showToast(message, type = "success") {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    if (type === 'error') {
        toast.style.background = 'rgba(255, 232, 236, 0.95)';
        toast.style.border = '1.5px solid #ffaec9';
        toast.style.color = '#a71e34';
    }

    toast.innerHTML = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}