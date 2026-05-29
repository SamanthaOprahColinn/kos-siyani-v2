document.addEventListener('DOMContentLoaded', () => {
// 1. INJEKSI SIDEBAR
  const sidebarContainer = document.getElementById('sidebar-container');
  if (sidebarContainer) {
    sidebarContainer.innerHTML = `
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="sidebar-brand-logo bg-pink-light text-pink-dark font-black">KS</div>
          <div>
            <div class="sidebar-brand-name font-extrabold text-cozy">Kos Siyani</div>
            <div class="sidebar-brand-sub font-semibold text-muted">Admin Panel v2</div>
          </div>
        </div>

        <nav class="sidebar-nav">
          <div class="sidebar-section-title font-extrabold text-muted">Utama</div>
          <a href="/pages/admin/dashboard.html" class="sidebar-link font-bold text-muted">
            <i class="ph ph-squares-four sidebar-link-icon"></i>
            <span>Dashboard Admin</span>
          </a>

          <div class="sidebar-section-title font-extrabold text-muted">Operasional</div>
          <a href="/pages/admin/kelola-kamar.html" class="sidebar-link font-bold text-muted">
            <i class="ph ph-door-open sidebar-link-icon"></i>
            <span>Kelola Kamar</span>
          </a>
          <a href="/pages/admin/kelola-penghuni.html" class="sidebar-link font-bold text-muted">
            <i class="ph ph-users sidebar-link-icon"></i>
            <span>Kelola Penghuni</span>
          </a>
          <a href="/pages/admin/pembayaran.html" class="sidebar-link font-bold text-muted">
            <i class="ph ph-receipt sidebar-link-icon"></i>
            <span>Buat Tagihan</span>
          </a>

          <div class="sidebar-section-title font-extrabold text-muted">Akun</div>
          <a href="#" class="sidebar-link font-bold text-muted" onclick="handleLogout()">
            <i class="ph ph-sign-out sidebar-link-icon"></i>
            <span>Keluar</span>
          </a>
        </nav>
      </aside>
    `;

    // --- FITUR AUTO-HIGHLIGHT MENYALAKAN MENU AKTIF ---
    const currentPath = window.location.pathname;
    const sidebarLinks = sidebarContainer.querySelectorAll('.sidebar-link');
    
    sidebarLinks.forEach(link => {
      if (link.getAttribute('href') === currentPath) {
        // 1. Tambahkan class '.active' untuk struktur utama layout sidebar
        link.classList.add('active'); 
        
        // 2. Tambahkan token warna global.css biar berubah warna hijau pastel empuk!
        link.classList.add('bg-green-light', 'text-green-dark'); 
        
        // 3. Buang warna teks abu-abu redupnya (text-muted) biar kontras
        link.classList.remove('text-muted'); 
      } else {
        // Jika bukan halaman aktif, pastikan kondisinya bersih kembali ke normal
        link.classList.remove('active', 'bg-green-light', 'text-green-dark');
        link.classList.add('text-muted');
      }
    });
  }

  // 2. INJEKSI TOPBAR (HANYA UNTUK PROFIL USER POJOK KANAN)
  const topbarContainer = document.getElementById('topbar-container');
  if (topbarContainer) {
    topbarContainer.innerHTML = `
      <div style="display: flex; align-items: center; gap: 14px; margin-left: auto;">
        <div style="text-align: right;">
          <div id="profileName" style="font-weight: 800; color: var(--text-cozy, #5d444e); font-size: 14px;">Memuat...</div>
          <span id="profileRole" style="display: inline-block; background: #e2f0cb; color: #2d6a4f; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 8px; margin-top: 2px; letter-spacing: 0.5px;">ADMIN</span>
        </div>
        <div id="profileAvatar" style="width: 40px; height: 40px; background: #ffccd5; color: #a71e34; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 15px; border: 2px solid rgba(255,255,255,0.8); box-shadow: 0 4px 10px rgba(223,168,185,0.3);">
          <span id="avatarInitial">-</span>
        </div>
      </div>
    `;

    // --- TAMBAHAN KODE UNTUK MENGGANTI TEKS "MEMUAT..." MENJADI NAMA ADMIN ---
    try {
      // Mengambil data user dari Local Storage (sesuaikan dengan key saat kamu login)
      let namaAdmin = 'Admin Siyani'; // Nama default jika gagal
      const userStr = localStorage.getItem('user'); // Biasanya data user disimpan di key 'user'

      if (userStr) {
        const userData = JSON.parse(userStr);
        // Coba ambil dari properti nama_lengkap, nama, atau username
        namaAdmin = userData.nama_lengkap || userData.nama || userData.username || namaAdmin;
      } else {
        // Alternatif jika nama disimpan langsung tanpa object
        namaAdmin = localStorage.getItem('nama') || localStorage.getItem('username') || namaAdmin;
      }

      // Tembakkan nama ke elemen HTML
      document.getElementById('profileName').textContent = namaAdmin;
      // Ambil huruf pertama untuk Avatar
      document.getElementById('avatarInitial').textContent = namaAdmin.charAt(0).toUpperCase();

    } catch (error) {
      console.error('Gagal mengambil data admin:', error);
      document.getElementById('profileName').textContent = 'Admin';
      document.getElementById('avatarInitial').textContent = 'A';
    }
  }
  
  // 3. INJEKSI FOOTER
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
});