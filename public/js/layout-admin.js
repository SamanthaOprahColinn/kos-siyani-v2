document.addEventListener('DOMContentLoaded', () => {
  // 1. INJEKSI SIDEBAR
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
          <a href="/pages/admin/dashboard.html" class="sidebar-link">
            <i class="ph ph-squares-four sidebar-link-icon"></i>
            <span>Dashboard Admin</span>
          </a>

          <div class="sidebar-section-title">Operasional</div>
          <a href="/pages/admin/kelola-kamar.html" class="sidebar-link">
            <i class="ph ph-door-open sidebar-link-icon"></i>
            <span>Kelola Kamar</span>
          </a>
          <a href="/pages/admin/kelola-penghuni.html" class="sidebar-link">
            <i class="ph ph-users sidebar-link-icon"></i>
            <span>Kelola Penghuni</span>
          </a>
          <a href="#" class="sidebar-link" onclick="alert('Modul Buat Tagihan segera hadir')">
            <i class="ph ph-receipt sidebar-link-icon"></i>
            <span>Buat Tagihan</span>
          </a>

          <div class="sidebar-section-title">Akun</div>
          <a href="#" class="sidebar-link" onclick="handleLogout()">
            <i class="ph ph-sign-out sidebar-link-icon"></i>
            <span>Keluar</span>
          </a>
        </nav>
      </aside>
    `;

    // --- FITUR OTOMATIS MENYALAKAN WARNA HIJAU (ACTIVE MENUS) ---
    const currentPath = window.location.pathname;
    const sidebarLinks = sidebarContainer.querySelectorAll('.sidebar-link');
    
    sidebarLinks.forEach(link => {
      // Jika isi atribut href pada link sama dengan URL halaman yang sedang dibuka
      if (link.getAttribute('href') === currentPath) {
        link.classList.add('active'); // Otomatis beri warna hijau
      } else {
        link.classList.remove('active'); // Pastikan menu lain tidak ikut hijau
      }
    });
  }

  // 2. INJEKSI TOPBAR (HANYA UNTUK PROFIL USER POJOK KANAN)
  const topbarContainer = document.getElementById('topbar-container');
  if (topbarContainer) {
    topbarContainer.innerHTML = `
      <div class="flex items-center gap-3 ml-auto">
        <div class="text-right">
          <div class="font-bold text-dark" id="profileName">Memuat...</div>
          <span class="badge badge-green text-xs" id="profileRole">ADMIN</span>
        </div>
        <div class="avatar avatar-md avatar-green avatar-ring">
          <span id="avatarInitial">-</span>
        </div>
      </div>
    `;
  }

  // 3. INJEKSI FOOTER
  const footerContainer = document.getElementById('footer-container');
  if (footerContainer) {
    footerContainer.innerHTML = `
      <footer class="main-footer">
        <div class="footer-text">
          &copy; 2026 <span>Kos Siyani</span>. Hak cipta dilindungi undang-undang.
        </div>
        <div class="footer-links">
          <a href="#">Bantuan Operasional</a>
          <a href="#">Hubungi Developer</a>
        </div>
      </footer>
    `;
  }
});