const API_URL = 'http://localhost:5000/api';

let selectedFile = null;

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
    fetchTagihanBelumBayar();
  })
  .catch(() => {
    localStorage.removeItem('token');
    window.location.href = '../login.html';
  });

  const zone = document.getElementById('uploadZone');
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) applyFile(e.dataTransfer.files[0]);
  });
});

function fetchTagihanBelumBayar() {
  const token = localStorage.getItem('token');
  const select = document.getElementById('selectTagihan');

  fetch(`${API_URL}/pembayaran/my-bills`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(resData => {
    const list = resData.data?.data || resData.data || [];
    const belumBayar = Array.isArray(list)
      ? list.filter(t => {
          const s = (t.status_bayar || '').toLowerCase();
          return s !== 'lunas';
        })
      : [];

    select.innerHTML = '';
    if (belumBayar.length === 0) {
      select.innerHTML = '<option value="">-- Tidak ada tagihan yang perlu dibayar --</option>';
      return;
    }

    const bulanMap = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    belumBayar.forEach(t => {
      const periode = `${bulanMap[(t.bulan_tagihan || 1) - 1]} ${t.tahun_tagihan || ''}`;
      const nominal = 'Rp ' + Number(t.jumlah_tagihan || 0).toLocaleString('id-ID');
      const opt = document.createElement('option');
      opt.value = t._id || t.id;
      opt.textContent = `${periode} — ${nominal}`;
      select.appendChild(opt);
    });
  })
  .catch(() => {
    select.innerHTML = '<option value="">-- Gagal memuat tagihan --</option>';
  });
}

function handleFileChange(input) {
  if (input.files.length > 0) applyFile(input.files[0]);
}

function applyFile(file) {
  const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
  const maxSize = 5 * 1024 * 1024;
  const errorBox = document.getElementById('errorBox');
  const errorMsg = document.getElementById('errorMsg');

  errorBox.classList.remove('show');

  if (!allowed.includes(file.type)) {
    errorMsg.textContent = 'Format file tidak didukung. Gunakan JPG, PNG, atau PDF.';
    errorBox.classList.add('show');
    selectedFile = null;
    return;
  }

  if (file.size > maxSize) {
    errorMsg.textContent = 'Ukuran file melebihi 5 MB. Pilih file yang lebih kecil.';
    errorBox.classList.add('show');
    selectedFile = null;
    return;
  }

  selectedFile = file;
  document.getElementById('uploadFileName').textContent = `✓ ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
}

function handleUpload() {
  const token = localStorage.getItem('token');
  const idTagihan = document.getElementById('selectTagihan').value;
  const errorBox = document.getElementById('errorBox');
  const errorMsg = document.getElementById('errorMsg');

  errorBox.classList.remove('show');

  if (!idTagihan) {
    errorMsg.textContent = 'Pilih tagihan yang ingin dibayar terlebih dahulu.';
    errorBox.classList.add('show');
    return;
  }

  if (!selectedFile) {
    errorMsg.textContent = 'Pilih file bukti pembayaran terlebih dahulu.';
    errorBox.classList.add('show');
    return;
  }

  const formData = new FormData();
  formData.append('bukti_transfer', selectedFile);

  fetch(`${API_URL}/pembayaran/${idTagihan}/upload`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    if (data.success || data.statusCode === 200) {
      document.getElementById('modal-sukses').style.display = 'flex';
    } else {
      errorMsg.textContent = data.message || 'Gagal mengirim bukti. Coba lagi.';
      errorBox.classList.add('show');
    }
  })
  .catch(() => {
    errorMsg.textContent = 'Terjadi kesalahan koneksi ke server.';
    errorBox.classList.add('show');
  });
}

function tutupModalSukses() {
  document.getElementById('modal-sukses').style.display = 'none';
  window.location.href = '/pages/penghuni/dashboard.html';
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
