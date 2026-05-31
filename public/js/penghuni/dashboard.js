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
    if (!data.success || !data.data) {
      localStorage.removeItem('token');
      window.location.href = '../login.html';
      return;
    }
    if (data.data.role !== 'penghuni') {
      window.location.href = '../login.html';
      return;
    }
    fetchTagihanSingkat();
  })
  .catch(() => {
    localStorage.removeItem('token');
    window.location.href = '../login.html';
  });
});

function fetchTagihanSingkat() {
  const token = localStorage.getItem('token');
  const tbody = document.getElementById('tagihanTableBody');

  fetch(`${API_URL}/pembayaran/my-bills`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(resData => {
    const list = resData.data?.data || resData.data || [];
    const recent = Array.isArray(list) ? list.slice(0, 3) : [];

    if (recent.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="4">
          <div class="table-empty">
            <i class="ph ph-receipt"></i>
            <div class="table-empty-title">Belum ada tagihan</div>
            <div class="table-empty-sub">Tagihan akan muncul setelah diterbitkan oleh pengelola</div>
          </div>
        </td></tr>`;
      document.getElementById('statTagihan').textContent = 'Rp -';
      document.getElementById('statStatusBayar').textContent = '-';
      document.getElementById('statNomorKamar').textContent = '-';
      return;
    }

    const latest = recent[0];

    const nomorKamar = latest.id_kamar?.nomor_kamar || '-';
    document.getElementById('statNomorKamar').textContent = `Kamar ${nomorKamar}`;
    document.getElementById('statTagihan').textContent = 'Rp ' + Number(latest.jumlah_tagihan || 0).toLocaleString('id-ID');

    const statusRaw = (latest.status_bayar || '').toLowerCase();
    let statusLabel = '-';
    if (statusRaw === 'lunas') statusLabel = 'Lunas';
    else if (statusRaw === 'belum bayar' || statusRaw === 'belum_bayar') statusLabel = 'Belum Bayar';
    else if (statusRaw === 'terlambat') statusLabel = 'Terlambat';
    else if (statusRaw === 'menunggu verifikasi' || statusRaw === 'menunggu_verifikasi') statusLabel = 'Menunggu Verifikasi';
    document.getElementById('statStatusBayar').textContent = statusLabel;

    const bulanMap = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];

    tbody.innerHTML = '';
    recent.forEach(t => {
      const bulan = bulanMap[(t.bulan_tagihan || 1) - 1] || '-';
      const tahun = t.tahun_tagihan || '-';
      const nominal = 'Rp ' + Number(t.jumlah_tagihan || 0).toLocaleString('id-ID');
      const jatuhTempo = t.tgl_jatuh_tempo ? new Date(t.tgl_jatuh_tempo).toLocaleDateString('id-ID') : '-';
      const status = (t.status_bayar || '').toLowerCase();

      let badgeClass = 'badge-warning';
      let badgeLabel = 'Belum Bayar';
      if (status === 'lunas') { badgeClass = 'badge-success'; badgeLabel = 'Lunas'; }
      else if (status === 'terlambat') { badgeClass = 'badge-danger'; badgeLabel = 'Terlambat'; }
      else if (status.includes('menunggu')) { badgeClass = 'badge-info'; badgeLabel = 'Menunggu Verifikasi'; }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${bulan} ${tahun}</td>
        <td>${nominal}</td>
        <td>${jatuhTempo}</td>
        <td><span class="badge ${badgeClass}">${badgeLabel}</span></td>
      `;
      tbody.appendChild(tr);
    });
  })
  .catch(() => {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:20px;color:#dc2626;">Gagal memuat data tagihan.</td></tr>`;
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
