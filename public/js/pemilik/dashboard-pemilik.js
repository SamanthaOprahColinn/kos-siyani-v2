// public\js\pemilik\dashboard-pemilik.js

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
      // Pastikan elemen ID ada sebelum diisi untuk menghindari error script
      const nameEl = document.getElementById('profileName');
      if(nameEl) nameEl.textContent = data.data.nama_lengkap;
      
      const avatarEl = document.getElementById('avatarInitial');
      if(avatarEl) avatarEl.textContent = data.data.nama_lengkap.charAt(0).toUpperCase();
    }
  })
  .catch((err) => {
    console.error("Gagal memuat profil:", err);
    // HANYA hapus token jika error benar-benar karena otorisasi (401/403)
    // Jika karena server mati atau internet, jangan langsung logout!
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
        document.getElementById('statTotalKamar').textContent = data.data.total || '0';
        document.getElementById('statKamarTersedia').textContent = data.data.tersedia || '0';
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

function fetchPembayaran() {
  const token = localStorage.getItem('token');
  const tbody = document.getElementById('paymentTableBody');
  if(!tbody) return; 
  
  tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px;">Menarik ringkasan transaksi...</td></tr>';

  fetch(`${API_URL}/pembayaran`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(data => {
    tbody.innerHTML = '';
    if (data.success && data.data && data.data.length > 0) {
      data.data.forEach(item => {
        const tr = document.createElement('tr');
        
        let statusBadge = '';
        const status = (item.status_pembayaran || '').toLowerCase();
        if(status === 'lunas') {
          statusBadge = '<span class="badge badge-success">Lunas</span>';
        } else if(status === 'tenggat waktu' || status === 'pending') {
          statusBadge = '<span class="badge badge-warning">Tenggat Waktu</span>';
        } else {
          statusBadge = '<span class="badge badge-danger">Belum Bayar</span>';
        }

        tr.innerHTML = `
          <td class="font-bold">Kamar ${item.nomor_kamar || '-'}</td>
          <td>${item.nama_penghuni || '-'}</td>
          <td>${statusBadge}</td>
        `;
        tbody.appendChild(tr);
      });
    } else {
      tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px; color: var(--n500);">Belum ada riwayat pembayaran.</td></tr>';
    }
  })
  .catch(err => {
    console.error(err);
    tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px; color: #dc2626;">Gagal memuat data transaksi.</td></tr>';
  });
}

// FUNGSI MODAL ADMIN
function openAdminModal() {
  document.getElementById('adminErrorBox').classList.remove('show');
  document.getElementById('adminModal').style.display = 'flex';
  document.getElementById('adminName').value = '';
  document.getElementById('adminEmail').value = '';
  const pwInput = document.getElementById('adminPassword');
  pwInput.value = '';
  pwInput.type = 'password';
  document.getElementById('adminPwIcon').className = 'ph ph-eye';
}

function closeAdminModal() {
  document.getElementById('adminModal').style.display = 'none';
}

function toggleAdminPw() {
  const inp = document.getElementById('adminPassword');
  const ico = document.getElementById('adminPwIcon');
  if (inp.type === 'password') {
    inp.type = 'text';
    ico.className = 'ph ph-eye-slash';
  } else {
    inp.type = 'password';
    ico.className = 'ph ph-eye';
  }
}

function saveAdmin() {
  const nama_lengkap = document.getElementById('adminName').value.trim();
  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value;
  const errorBox = document.getElementById('adminErrorBox');
  const errorMsg = document.getElementById('adminErrorMsg');
  const token = localStorage.getItem('token');

  errorBox.classList.remove('show');

  if(!nama_lengkap || !email || !password) {
    errorMsg.textContent = 'Semua kolom formulir wajib diisi.';
    errorBox.classList.add('show');
    return;
  }

  const btn = document.getElementById('btnSaveAdmin');
  btn.style.pointerEvents = 'none';
  btn.textContent = 'Mendaftarkan...';

  fetch(`${API_URL}/auth/create-admin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ nama_lengkap, email, password, role: 'admin' })
  })
  .then(res => res.json())
  .then(data => {
    btn.style.pointerEvents = 'auto';
    btn.textContent = 'Daftarkan Admin';

    if(data.success) {
      alert('Akun Admin operasional baru berhasil didaftarkan!');
      closeAdminModal();
    } else {
      if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        errorMsg.textContent = data.errors[0].message || data.errors[0];
      } else {
        errorMsg.textContent = data.message || 'Gagal mendaftarkan akun admin.';
      }
      errorBox.classList.add('show');
    }
  })
  .catch(err => {
    btn.style.pointerEvents = 'auto';
    btn.textContent = 'Daftarkan Admin';
    errorMsg.textContent = 'Gangguan koneksi jaringan menuju server.';
    errorBox.classList.add('show');
  });
}

function handleLogout() {
  localStorage.removeItem('token');
  window.location.href = '../login.html';
}