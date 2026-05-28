// File: public/js/pemilik/layout-pemilik.js
window.API_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. INJEKSI KOMPONEN SIDEBAR
  // ==========================================
  const sidebarContainer = document.getElementById('sidebar-container');
  if (sidebarContainer) {
    sidebarContainer.innerHTML = `
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="sidebar-brand-logo">KS</div>
          <div>
            <div class="sidebar-brand-name">Kos Siyani</div>
            <div class="sidebar-brand-sub">Admin Panel v2</div>
          </div>
        </div>
        
        <nav class="sidebar-nav">
          <div class="sidebar-section-title">Utama</div>
          <a href="/pages/pemilik/dashboard.html" class="sidebar-link">
            <i class="ph ph-squares-four sidebar-link-icon"></i>
            <span>Dashboard</span>
          </a>
          
          <div class="sidebar-section-title">Manajemen</div>
          <a href="/pages/pemilik/kelola-kamar.html" class="sidebar-link">
            <i class="ph ph-door-open sidebar-link-icon"></i>
            <span>Kelola Kamar</span>
          </a>
          <a href="/pages/pemilik/kelola-penghuni.html" class="sidebar-link">
            <i class="ph ph-users sidebar-link-icon"></i>
            <span>Kelola Penghuni</span>
          </a>
          <a href="/pages/pemilik/transaksi.html" class="sidebar-link" onclick="alert('Modul Transaksi segera hadir')">
            <i class="ph ph-receipt sidebar-link-icon"></i>
            <span>Transaksi</span>
          </a>

          <div class="sidebar-section-title">Sistem</div>
          <a href="#" class="sidebar-link" onclick="openAdminModal()">
            <i class="ph ph-user-plus sidebar-link-icon"></i>
            <span>Tambah Admin Baru</span>
          </a>
          
          <div class="sidebar-section-title">Akun</div>
          <a href="#" class="sidebar-link" onclick="handleLogout()">
            <i class="ph ph-sign-out sidebar-link-icon"></i>
            <span>Keluar</span>
          </a>
        </nav>
      </aside>
    `;

    // Fitur Deteksi Halaman Aktif (Auto-Highlight Sidebar)
    const currentPath = window.location.pathname;
    const sidebarLinks = sidebarContainer.querySelectorAll('.sidebar-link');
    
    sidebarLinks.forEach(link => {
      if (link.getAttribute('href') === currentPath) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // ==========================================
  // 2. INJEKSI KOMPONEN TOPBAR (PROFIL USER)
  // ==========================================
  const topbarContainer = document.getElementById('topbar-container');
  if (topbarContainer) {
    topbarContainer.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="text-right">
          <div class="font-bold text-dark" id="profileName">Memuat...</div>
          <span class="badge badge-pink text-xs" style="background: var(--pink-500); color: white; padding: 2px 6px; border-radius: 4px;">PEMILIK</span>
        </div>
        <div class="avatar" style="width: 36px; height: 36px; border-radius: 50%; background: var(--pink-200); color: var(--pink-700); display: flex; align-items: center; justify-content: center; font-weight: 800;">
          <span id="avatarInitial">-</span>
        </div>
      </div>
    `;
  }

  const footerContainer = document.getElementById('footer-container');
  if (footerContainer) {
    footerContainer.innerHTML = `
      <footer class="main-footer" style="margin-top: 40px; padding: 20px 10px; border-top: 1px dashed rgba(93, 68, 78, 0.1); display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: #8c737d;">
        <div class="footer-text">
          &copy; 2026 <span style="font-weight: 700; color: var(--text-cozy, #5d444e);">Kos Siyani</span>. Hak Cipta Dilindungi Undang-Undang.
        </div>
        <div class="footer-links" style="display: flex; gap: 16px;">
          <a href="#" style="color: #8c737d; text-decoration: none; transition: color 0.2s;" onmouseover="this.style.color='var(--text-cozy)'" onmouseout="this.style.color='#8c737d'">Bantuan Operasional</a>
          <a href="#" style="color: #8c737d; text-decoration: none; transition: color 0.2s;" onmouseover="this.style.color='var(--text-cozy)'" onmouseout="this.style.color='#8c737d'">Hubungi Developer</a>
        </div>
      </footer>
    `;
  }

  // ==========================================
  // 3. FETCH DATA PROFIL (Tambahan)
  // ==========================================
  fetch(`${API_URL}/auth/me`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  })
  .then(res => res.json())
  .then(resData => {
    const user = resData.data; 
    if (user) {
      document.getElementById('profileName').textContent = user.nama || 'Pemilik Kos';
      document.getElementById('avatarInitial').textContent = (user.nama || 'P').charAt(0).toUpperCase();
    }
  })
  .catch(() => {
    document.getElementById('profileName').textContent = 'Pemilik';
    document.getElementById('avatarInitial').textContent = 'P';
  });
});

function handleLogout() {
  localStorage.removeItem('token');
  window.location.href = '../login.html';
}