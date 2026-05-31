const API_URL = 'http://localhost:5000/api';

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
  .then(res => res.json())
  .then(data => {
    if (!data.success || !data.data || data.data.role !== 'penghuni') {
      localStorage.removeItem('token');
      window.location.href = '../login.html';
      return;
    }
    fetchTagihan();
  })
  .catch(() => {
    localStorage.removeItem('token');
    window.location.href = '../login.html';
  });
});

function fetchTagihan() {
  const token = localStorage.getItem('token');
  const tbody = document.getElementById('tagihanBody');
  tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:24px;color:var(--n400);">Memuat data tagihan...</td></tr>`;

  fetch(`${API_URL}/pembayaran/my-bills`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(resData => {
    const list = resData.data?.data || resData.data || [];
    const tagihan = Array.isArray(list) ? list : [];

    if (tagihan.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:32px;color:var(--n400);">Belum ada tagihan. Tagihan akan muncul setelah diterbitkan oleh pengelola.</td></tr>`;
      return;
    }

    const bulanMap = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

    tbody.innerHTML = '';
    tagihan.forEach(t => {
      const namaPenghuni = t.id_penghuni?.nama_lengkap || '-';
      const nomorKamar = t.id_kamar?.nomor_kamar ? `Kamar ${t.id_kamar.nomor_kamar}` : '-';
      const periode = `${bulanMap[(t.bulan_tagihan || 1) - 1]} ${t.tahun_tagihan || ''}`;
      const nominal = 'Rp ' + Number(t.jumlah_tagihan || 0).toLocaleString('id-ID');
      const jatuhTempo = t.tgl_jatuh_tempo ? new Date(t.tgl_jatuh_tempo).toLocaleDateString('id-ID') : '-';
      const status = (t.status_bayar || '').toLowerCase();

      let badgeClass = 'badge-warning';
      let badgeLabel = 'Belum Bayar';
      if (status === 'lunas') { badgeClass = 'badge-success'; badgeLabel = 'Lunas'; }
      else if (status === 'terlambat') { badgeClass = 'badge-danger'; badgeLabel = 'Terlambat'; }
      else if (status.includes('menunggu')) { badgeClass = 'badge-info'; badgeLabel = 'Menunggu Verifikasi'; }

      const aksi = status !== 'lunas'
        ? `<button class="btn btn-ghost btn-sm" onclick="window.location.href='/pages/penghuni/upload-bukti.html'"><i class="ph ph-upload-simple"></i> Bayar</button>`
        : `<span style="color:var(--green-500);font-size:13px;font-weight:700;">&#10003; Lunas</span>`;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${namaPenghuni}</td>
        <td>${nomorKamar}</td>
        <td>${periode}</td>
        <td>${nominal}</td>
        <td>${jatuhTempo}</td>
        <td><span class="badge ${badgeClass}">${badgeLabel}</span></td>
        <td>${aksi}</td>
      `;
      tbody.appendChild(tr);
    });
  })
  .catch(() => {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:24px;color:#dc2626;">Gagal memuat data tagihan.</td></tr>`;
  });
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: 'ph-check-circle', warning: 'ph-warning', info: 'ph-info' };
  toast.innerHTML = `<i class="ph ${icons[type] || icons.info}" style="font-size:18px;flex-shrink:0;"></i><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}
