// public\js\pemilik\kelola-admin.js

window.API_URL = 'http://localhost:5000/api';

let dataAdminAktif = [];
let dataAdminNonaktif = [];

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

      fetchAdmins();
    }
  })
  .catch((err) => console.error("Gagal memuat profil:", err));
});

// Fitur Mengambil Semua Admin dan Memisahkan Wadahnya
function fetchAdmins() {
  const token = localStorage.getItem('token');
  const tbodyAktif = document.getElementById('adminTableBody');
  const tbodyRiwayat = document.getElementById('riwayatTableBody');
  
  tbodyAktif.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Mengambil data...</td></tr>';

  fetch(`${API_URL}/auth/users`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(data => {
    let users = [];
    if (Array.isArray(data)) users = data;
    else if (data && Array.isArray(data.data)) users = data.data;
    else if (data && typeof data.data === 'object' && data.data !== null) {
        const foundArray = Object.values(data.data).find(item => Array.isArray(item));
        users = foundArray || [];
    }

    const allAdmins = users.filter(u => u.role === 'admin');

    // JURUS SAPU JAGAT: Filter super tangguh untuk mendeteksi berbagai format status dari Backend
    dataAdminAktif = allAdmins.filter(u => 
      u.is_active !== false && 
      u.isActive !== false && 
      u.status !== 'nonaktif' && 
      u.status !== 'inactive' &&
      u.status !== 0
    );
    
    dataAdminNonaktif = allAdmins.filter(u => 
      u.is_active === false || 
      u.isActive === false || 
      u.status === 'nonaktif' || 
      u.status === 'inactive' ||
      u.status === 0
    );

    // Render kedua tabel
    filterTabelAdmin();
    filterSortTabelRiwayat();
  })
  .catch(err => {
    tbodyAktif.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #dc2626;">Gagal memuat data dari server.</td></tr>';
    tbodyRiwayat.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #dc2626;">Gagal memuat data.</td></tr>';
  });
}

function renderTabelAdmin(dataArray) {
  const tbody = document.getElementById('adminTableBody');
  tbody.innerHTML = '';

  if (dataArray.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: var(--n500);">Tidak ada admin aktif yang terdaftar.</td></tr>';
    return;
  }

  dataArray.forEach((admin, index) => {
    const adminId = admin._id || admin.id; 
    const adminName = admin.nama_lengkap || 'Admin';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="font-bold">${index + 1}</td>
      <td style="color: var(--text-cozy); font-weight: 600;">${adminName}</td>
      <td style="color: var(--n500);">${admin.email || '-'}</td>
      <td><span class="badge badge-success badge-kapsul">AKTIF</span></td>
      <td style="text-align: center;">
        <button class="btn btn-ghost btn-sm" onclick="suspendAdmin('${adminId}', '${adminName}')" style="color: #f59e0b;" title="Nonaktifkan Akses">
          <i class="ph ph-prohibit" style="font-size: 20px;"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function filterTabelAdmin() {
  const keyword = document.getElementById('searchAdmin').value.toLowerCase();
  const sortOrder = document.getElementById('sortAdminAktif').value;
  
  let processedData = dataAdminAktif.filter(admin => {
    return (admin.nama_lengkap || '').toLowerCase().includes(keyword) || 
           (admin.email || '').toLowerCase().includes(keyword);
  });

  processedData.sort((a, b) => {
    let dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    let dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    if (dateA === dateB) {
        dateA = a._id ? parseInt(a._id.toString().substring(0, 8), 16) : 0;
        dateB = b._id ? parseInt(b._id.toString().substring(0, 8), 16) : 0;
    }
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  renderTabelAdmin(processedData);
}

function suspendAdmin(id, nama) {
  if (!confirm(`⚠️ KONFIRMASI:\nApakah Anda yakin ingin MENONAKTIFKAN akses operasional untuk akun admin "${nama}"?\n\nAdmin ini akan dipindahkan ke Riwayat Nonaktif.`)) return;

  const token = localStorage.getItem('token');
  fetch(`${window.API_URL}/auth/users/${id}/deactivate`, {
    method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) fetchAdmins();
    else alert('Gagal menonaktifkan admin: ' + (data.message || 'Silakan coba lagi.'));
  })
  .catch(err => alert('Terjadi gangguan jaringan saat mencoba menghubungi server.'));
}

// Handlers for active admin search bar
function handleSearchInput() {
  const input = document.getElementById('searchAdmin');
  const clearBtn = document.getElementById('btnClearSearch');
  clearBtn.style.display = input.value.length > 0 ? 'block' : 'none';
}

function clearSearch() {
  const input = document.getElementById('searchAdmin');
  input.value = '';
  handleSearchInput();
  filterTabelAdmin();
  input.focus();
}

function openRiwayatModal() {
  document.getElementById('riwayatModal').style.display = 'flex';
}

function closeRiwayatModal() {
  document.getElementById('riwayatModal').style.display = 'none';
}

function filterSortTabelRiwayat() {
  const keyword = document.getElementById('searchRiwayat').value.toLowerCase();
  const sortOrder = document.getElementById('sortAdmin').value;
  
  let processedData = dataAdminNonaktif.filter(admin => {
    return (admin.nama_lengkap || '').toLowerCase().includes(keyword) || 
           (admin.email || '').toLowerCase().includes(keyword);
  });

  processedData.sort((a, b) => {
    let dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    let dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    if (dateA === dateB) {
        dateA = a._id ? parseInt(a._id.toString().substring(0, 8), 16) : 0;
        dateB = b._id ? parseInt(b._id.toString().substring(0, 8), 16) : 0;
    }
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  renderTabelRiwayat(processedData);
}

function renderTabelRiwayat(dataArray) {
  const tbody = document.getElementById('riwayatTableBody');
  tbody.innerHTML = '';

  if (dataArray.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: var(--n500);">Tidak ada arsip riwayat admin.</td></tr>';
    return;
  }

  dataArray.forEach((admin, index) => {
    const adminId = admin._id || admin.id; 
    const adminName = admin.nama_lengkap || 'Admin';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="font-bold">${index + 1}</td>
      <td style="color: var(--text-cozy); font-weight: 600;">${adminName}</td>
      <td style="color: var(--n500);">${admin.email || '-'}</td>
      <td><span class="badge badge-kapsul" style="background: #fee2e2; color: #ef4444; border: 1px solid #fca5a5;">NONAKTIF</span></td>
      <td style="text-align: center;">
        <button class="btn btn-ghost btn-sm" onclick="activateAdmin('${adminId}', '${adminName}')" style="color: #10b981;" title="Aktifkan Kembali">
          <i class="ph ph-check-circle" style="font-size: 20px;"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function activateAdmin(id, nama) {
  if (!confirm(`ℹ️ KONFIRMASI:\nApakah Anda yakin ingin MENGAKTIFKAN KEMBALI akses operasional untuk akun admin "${nama}"?`)) return;

  const token = localStorage.getItem('token');
  fetch(`${window.API_URL}/auth/users/${id}/activate`, {
    method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert(`✅ Akses untuk "${nama}" berhasil dipulihkan.`);
      fetchAdmins(); // Segarkan data
    } else {
      alert('Gagal mengaktifkan admin: ' + (data.message || 'Silakan coba lagi.'));
    }
  })
  .catch(err => alert('Terjadi gangguan jaringan.'));
}

// Handlers for modal search bar
function handleSearchRiwayatInput() {
  const input = document.getElementById('searchRiwayat');
  const clearBtn = document.getElementById('btnClearSearchRiwayat');
  clearBtn.style.display = input.value.length > 0 ? 'block' : 'none';
}

function clearSearchRiwayat() {
  const input = document.getElementById('searchRiwayat');
  input.value = '';
  handleSearchRiwayatInput();
  filterSortTabelRiwayat();
  input.focus();
}

function toggleAdminPw() {
  const inp = document.getElementById('adminPassword');
  const ico = document.getElementById('adminPwIcon');
  if (inp.type === 'password') {
    inp.type = 'text'; ico.className = 'ph ph-eye-slash';
  } else {
    inp.type = 'password'; ico.className = 'ph ph-eye';
  }
}

function saveAdmin(event) {
  event.preventDefault();
  const nama_lengkap = document.getElementById('adminName').value.trim();
  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value;
  const errorBox = document.getElementById('adminErrorBox');
  const errorMsg = document.getElementById('adminErrorMsg');
  const token = localStorage.getItem('token');

  errorBox.style.display = 'none';

  if(!nama_lengkap || !email || !password) {
    errorMsg.textContent = 'Semua kolom formulir wajib diisi.';
    errorBox.style.display = 'flex'; return;
  }

  const btn = document.getElementById('btnSaveAdmin');
  btn.style.pointerEvents = 'none'; btn.innerHTML = '⏳ Mendaftarkan...';

  fetch(`${API_URL}/auth/create-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ nama_lengkap, email, password, role: 'admin' })
  })
  .then(res => res.json())
  .then(data => {
    btn.style.pointerEvents = 'auto'; btn.innerHTML = 'Daftarkan Admin';
    if(data.success) {
      document.getElementById('formTambahAdmin').reset();
      fetchAdmins();
    } else {
      errorMsg.textContent = (data.errors && data.errors.length > 0) ? data.errors[0].message || data.errors[0] : data.message || 'Gagal mendaftarkan akun.';
      errorBox.style.display = 'flex';
    }
  })
  .catch(err => {
    btn.style.pointerEvents = 'auto'; btn.innerHTML = 'Daftarkan Admin';
    errorMsg.textContent = 'Gangguan koneksi jaringan menuju server.';
    errorBox.style.display = 'flex';
  });
}

function handleLogout() {
  localStorage.removeItem('token');
  window.location.href = '../login.html';
}