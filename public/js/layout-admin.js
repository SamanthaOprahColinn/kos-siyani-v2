document.addEventListener('DOMContentLoaded', () => {
  // 1. INJEKSI SIDEBAR (ASLI TANPA DIUBAH)
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
          <a href="#" class="sidebar-link active">
            <i class="ph ph-squares-four sidebar-link-icon"></i>
            <span>Dashboard Admin</span>
          </a>

          <div class="sidebar-section-title">Operasional</div>
          <a href="#" class="sidebar-link" onclick="alert('Modul Kelola Kamar segera hadir')">
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
  }

  // 3. INJEKSI FOOTER (ASLI TANPA DIUBAH)
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