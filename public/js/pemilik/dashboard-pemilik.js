// public/js/pemilik/dashboard-pemilik.js

window.API_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '../login.html';
    return;
  }
  
  fetch(`${API_URL}/auth/me`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => {
    if (!res.ok) throw new Error('Token tidak valid');
    return res.json();
  })
  .then(data => {
    if (data.success && data.data) {
      if (data.data.role === 'admin') {
        window.location.href = '../admin/dashboard.html';
        return;
      }
      const nameEl = document.getElementById('profileName');
      if(nameEl) nameEl.textContent = data.data.nama_lengkap;
      
      const avatarEl = document.getElementById('avatarInitial');
      if(avatarEl) avatarEl.textContent = data.data.nama_lengkap.charAt(0).toUpperCase();
    }
  })
  .catch((err) => {
    console.error("Gagal memuat profil:", err);
  });

  fetchDashboardStats();
  fetchPembayaran();
});

function fetchDashboardStats() {
  const token = localStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}` };

  fetch(`${API_URL}/kamar/stats/summary`, { method: 'GET', headers })
    .then(res => res.json())
    .then(data => {
      if(data.success && data.data) {
        const total = data.data.total || 0;
        const tersedia = data.data.tersedia || 0;
        
        document.getElementById('statTotalKamar').textContent = total;
        document.getElementById('statKamarTersedia').textContent = tersedia;

        // Kalkulasi Okupansi
        const terisi = total - tersedia;
        const persentase = total > 0 ? Math.round((terisi / total) * 100) : 0;
        const elOkupansi = document.getElementById('statOkupansi');
        elOkupansi.textContent = `Okupansi: ${persentase}%`;
        elOkupansi.className = 'okupansi-label ' + (persentase >= 80 ? 'okupansi-high' : (persentase >= 50 ? 'okupansi-med' : 'okupansi-low'));
      }
    }).catch(() => {
      document.getElementById('statTotalKamar').textContent = 'Error';
      document.getElementById('statKamarTersedia').textContent = 'Error';
    });

  fetch(`${API_URL}/penghuni/stats/summary`, { method: 'GET', headers })
    .then(res => res.json())
    .then(data => {
      if(data.success && data.data) {
        document.getElementById('statPenghuniAktif').textContent = data.data.aktif || '0';
      }
    }).catch(() => document.getElementById('statPenghuniAktif').textContent = 'Error');

  fetch(`${API_URL}/pembayaran/stats/summary`, { method: 'GET', headers })
    .then(res => res.json())
    .then(data => {
      if(data.success && data.data) {
        const nominal = data.data.totalPemasukan || 0;
        document.getElementById('statPemasukan').textContent = 'Rp ' + nominal.toLocaleString('id-ID');
      }
    }).catch(() => document.getElementById('statPemasukan').textContent = '-');
}

async function fetchPembayaran() {
  const token = localStorage.getItem('token');
  const tbody = document.getElementById('paymentTableBody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="3" class="widget-loading" style="padding: 20px;">Menyelaraskan data...</td></tr>';

  try {
    const headers = { 'Authorization': `Bearer ${token}` };

    const [resP, resB] = await Promise.all([
      fetch(`${window.API_URL || 'http://localhost:5000/api'}/penghuni?limit=100`, { headers }),
      fetch(`${window.API_URL || 'http://localhost:5000/api'}/pembayaran?limit=100`, { headers })
    ]);

    const jsonP = await resP.json();
    const jsonB = await resB.json();

    const arrPenghuni = jsonP.data?.data || [];
    const arrBayar = jsonB.data?.data || [];

    const activeIds = new Set();
    arrPenghuni.forEach(p => {
      if (p.status_penghuni === 'aktif') {
        activeIds.add(p._id.toString());
      }
    });

    let validList = arrBayar.filter(item => {
      if (!item.id_kamar || !item.id_penghuni) return false;
      const penghuniId = item.id_penghuni._id.toString();
      return activeIds.has(penghuniId);
    });

    validList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const finalTagihan = [];
    const kamarTerpakai = new Set();

    for (const item of validList) {
      const kamarId = item.id_kamar._id.toString();
      if (!kamarTerpakai.has(kamarId)) {
        kamarTerpakai.add(kamarId);
        finalTagihan.push(item);
      }
    }

    const antreanKonfirmasi = finalTagihan.filter(t => t.status_bayar === 'menunggu konfirmasi').length;
    const alertBox = document.getElementById('alertKonfirmasi');
    if (antreanKonfirmasi > 0) {
      document.getElementById('countKonfirmasi').textContent = antreanKonfirmasi;
      alertBox.style.display = 'flex';
    } else {
      alertBox.style.display = 'none';
    }

    const listTunggakan = document.getElementById('tunggakanList');
    const dataTunggakan = finalTagihan.filter(t => t.status_bayar === 'belum bayar');
    
    if (dataTunggakan.length > 0) {
      listTunggakan.innerHTML = '';
      dataTunggakan.slice(0, 5).forEach(t => {
        const nama = t.id_penghuni.nama_lengkap || '-';
        const kamar = t.id_kamar.nomor_kamar || '-';
        listTunggakan.innerHTML += `
          <div class="widget-item tunggakan">
            <div class="widget-item-title">${nama}</div>
            <div class="widget-item-sub">Km. ${kamar}</div>
          </div>
        `;
      });
    } else {
      listTunggakan.innerHTML = '<div class="widget-empty">Semua penghuni lunas bulan ini! 🎉</div>';
    }

    tbody.innerHTML = '';
    const recentList = finalTagihan.slice(0, 5);

    if (recentList.length > 0) {
      recentList.forEach(item => {
        const tr = document.createElement('tr');
        
        const nomor = item.id_kamar.nomor_kamar || '-';
        const lantai = item.id_kamar.lantai ? ` / Lt. ${item.id_kamar.lantai}` : '';
        const nama = item.id_penghuni.nama_lengkap || '-';
        
        const statusStr = (item.status_bayar || 'belum bayar').toLowerCase();
        let badgeClass = 'warning';
        let statusLabel = statusStr.replace(/_/g, ' ').toUpperCase();

        if (statusStr === 'lunas') badgeClass = 'success';
        else if (statusStr === 'ditolak') badgeClass = 'danger';
        else if (statusStr === 'menunggu konfirmasi') badgeClass = 'info';

        tr.innerHTML = `
          <td class="font-bold">No. ${nomor}${lantai}</td>
          <td style="color: var(--text-cozy); font-weight: 600;">${nama}</td>
          <td><span class="badge badge-${badgeClass} badge-kapsul">${statusLabel}</span></td>
        `;
        tbody.appendChild(tr);
      });
    } else {
      tbody.innerHTML = '<tr><td colspan="3" class="widget-loading" style="padding: 20px;">Belum ada riwayat pembayaran dari penghuni aktif.</td></tr>';
    }

  } catch (err) {
    console.error("Kesalahan Sistem Dashboard:", err);
    tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px; color: #dc2626;">Gagal memuat data transaksi dari server.</td></tr>';
  }
}

function handleLogout() {
  localStorage.removeItem('token');
  window.location.href = '../login.html';
}