// public/js/pemilik/kelola-admin.js

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
  .then(res => res.json())
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
});

// Fitur Lihat Password
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

// Fitur Simpan Admin Baru
function saveAdmin(event) {
  event.preventDefault(); // Mencegah reload halaman
  
  const nama_lengkap = document.getElementById('adminName').value.trim();
  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value;
  const errorBox = document.getElementById('adminErrorBox');
  const errorMsg = document.getElementById('adminErrorMsg');
  const token = localStorage.getItem('token');

  errorBox.style.display = 'none';

  if(!nama_lengkap || !email || !password) {
    errorMsg.textContent = 'Semua kolom formulir wajib diisi.';
    errorBox.style.display = 'flex';
    return;
  }

  const btn = document.getElementById('btnSaveAdmin');
  btn.style.pointerEvents = 'none';
  btn.innerHTML = ' Mendaftarkan...';

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
    btn.innerHTML = 'Daftarkan Admin';

    if(data.success) {
      alert('🎉 Akun Admin operasional baru berhasil didaftarkan!');
      document.getElementById('formTambahAdmin').reset(); // Kosongkan formulir setelah sukses
    } else {
      if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        errorMsg.textContent = data.errors[0].message || data.errors[0];
      } else {
        errorMsg.textContent = data.message || 'Gagal mendaftarkan akun admin.';
      }
      errorBox.style.display = 'flex';
    }
  })
  .catch(err => {
    btn.style.pointerEvents = 'auto';
    btn.innerHTML = 'Daftarkan Admin';
    errorMsg.textContent = 'Gangguan koneksi jaringan menuju server.';
    errorBox.style.display = 'flex';
  });
}

function handleLogout() {
  localStorage.removeItem('token');
  window.location.href = '../login.html';
}