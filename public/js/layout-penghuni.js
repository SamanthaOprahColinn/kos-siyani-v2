window.API_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
  injectProfileDropdownStyles();

  const sidebarContainer = document.getElementById('sidebar-container');
  if (sidebarContainer) {
    sidebarContainer.innerHTML = `
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="sidebar-brand-logo">KS</div>
          <div>
            <div class="sidebar-brand-name">Kos Siyani</div>
            <div class="sidebar-brand-sub">Portal Penghuni</div>
          </div>
        </div>
        <nav class="sidebar-nav">
          <div class="sidebar-section-title">Utama</div>
          <a href="/pages/penghuni/dashboard.html" class="sidebar-link">
            <i class="ph ph-squares-four sidebar-link-icon"></i>
            <span>Dashboard</span>
          </a>
          <div class="sidebar-section-title">Pembayaran</div>
          <a href="/pages/penghuni/status-tagihan.html" class="sidebar-link">
            <i class="ph ph-receipt sidebar-link-icon"></i>
            <span>Status Tagihan</span>
          </a>
          <a href="/pages/penghuni/upload-bukti.html" class="sidebar-link">
            <i class="ph ph-upload-simple sidebar-link-icon"></i>
            <span>Upload Bukti Bayar</span>
          </a>
          <div class="sidebar-section-title">Akun</div>
          <a href="#" class="sidebar-link" onclick="handleLogout()">
            <i class="ph ph-sign-out sidebar-link-icon"></i>
            <span>Keluar</span>
          </a>
        </nav>
      </aside>
    `;

    const currentPath = window.location.pathname;
    sidebarContainer.querySelectorAll('.sidebar-link').forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === currentPath);
    });
  }

  const topbarContainer = document.getElementById('topbar-container');
  if (topbarContainer) {
    topbarContainer.innerHTML = `
      <div style="display: flex; align-items: center; gap: 14px; margin-left: auto; position: relative;">
        <div style="text-align: right;">
          <div id="profileName" style="font-weight: 800; color: var(--text-cozy); font-size: 14px;">Memuat...</div>
          <span style="display: inline-block; background: var(--green-100); color: var(--green-600); font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 8px; margin-top: 2px; letter-spacing: 0.5px;">PENGHUNI</span>
        </div>
        <div id="profileAvatar" onclick="toggleProfileDropdown(event)" style="width: 40px; height: 40px; background: var(--pink-100); color: var(--pink-700); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 15px; border: 2px solid rgba(255,255,255,0.8); box-shadow: 0 4px 10px rgba(232,60,127,0.15); cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='scale(1.08)';this.style.boxShadow='0 6px 16px rgba(232,60,127,0.25)'" onmouseout="this.style.transform='scale(1)';this.style.boxShadow='0 4px 10px rgba(232,60,127,0.15)'">
          <span id="avatarInitial">-</span>
        </div>

        <div id="profileDropdown" class="profile-dropdown" style="display:none;">
          <div class="pd-header">
            <div class="pd-avatar-lg" id="pdAvatarLg">-</div>

            <div class="pd-name-row">
              <div class="pd-name" id="pdName">-</div>
              <button class="pd-edit-btn" onclick="toggleRenameMode()" title="Ubah nama">
                <i class="ph ph-pencil-simple" id="pdEditIcon"></i>
              </button>
            </div>

            <div class="pd-rename-form" id="pdRenameForm" style="display:none;">
              <input type="text" id="pdRenameInput" class="pd-rename-input" placeholder="Nama baru..." maxlength="100" />
              <div class="pd-rename-actions">
                <button class="pd-rename-save" onclick="saveRename()">
                  <i class="ph ph-check"></i> Simpan
                </button>
                <button class="pd-rename-cancel" onclick="toggleRenameMode()">
                  <i class="ph ph-x"></i>
                </button>
              </div>
              <div class="pd-rename-feedback" id="pdRenameFeedback"></div>
            </div>

            <div class="pd-email" id="pdEmail">-</div>
            <span class="pd-badge">PENGHUNI</span>
          </div>
          <div class="pd-body">
            <div class="pd-row">
              <i class="ph ph-door"></i>
              <div>
                <div class="pd-row-label">Nomor Kamar</div>
                <div class="pd-row-value" id="pdKamar">-</div>
              </div>
            </div>
            <div class="pd-row">
              <i class="ph ph-stack"></i>
              <div>
                <div class="pd-row-label">Lantai</div>
                <div class="pd-row-value" id="pdLantai">-</div>
              </div>
            </div>
            <div class="pd-row">
              <i class="ph ph-calendar-check"></i>
              <div>
                <div class="pd-row-label">Tanggal Masuk</div>
                <div class="pd-row-value" id="pdTanggalMasuk">-</div>
              </div>
            </div>
            <div class="pd-row">
              <i class="ph ph-phone"></i>
              <div>
                <div class="pd-row-label">Nomor HP</div>
                <div class="pd-row-value" id="pdNoHp">-</div>
              </div>
            </div>
            <div class="pd-row">
              <i class="ph ph-check-circle"></i>
              <div>
                <div class="pd-row-label">Status</div>
                <div class="pd-row-value" id="pdStatus">-</div>
              </div>
            </div>
          </div>
          <div class="pd-footer">
            <button class="pd-logout-btn" onclick="handleLogout()">
              <i class="ph ph-sign-out"></i> Keluar dari Akun
            </button>
          </div>
        </div>
      </div>
    `;
  }

  const footerContainer = document.getElementById('footer-container');
  if (footerContainer) {
    footerContainer.innerHTML = `
      <footer style="margin-top: 40px; padding: 20px 10px; border-top: 1px dashed rgba(93,68,78,0.1); display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: #8c737d;">
        <div>&copy; 2026 <span style="font-weight: 700; color: var(--text-cozy);">Kos Siyani</span>. Hak Cipta Dilindungi Undang-Undang.</div>
        <div style="display: flex; gap: 16px;">
          <a href="#" style="color: #8c737d; text-decoration: none;" onmouseover="this.style.color='var(--text-cozy)'" onmouseout="this.style.color='#8c737d'">Bantuan</a>
          <a href="#" style="color: #8c737d; text-decoration: none;" onmouseover="this.style.color='var(--text-cozy)'" onmouseout="this.style.color='#8c737d'">Hubungi Pengelola</a>
        </div>
      </footer>
    `;
  }

  fetchAndPopulateProfile();

  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('profileDropdown');
    const avatar = document.getElementById('profileAvatar');
    if (dropdown && avatar && !avatar.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
      cancelRenameMode();
    }
  });
});

function fetchAndPopulateProfile() {
  const token = localStorage.getItem('token');

  fetch(`${window.API_URL}/auth/me`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(resData => {
    const user = resData.data;
    if (!user) return;

    const nama = user.nama_lengkap || user.nama || 'Penghuni';
    const email = user.email || '-';
    const initial = nama.charAt(0).toUpperCase();

    document.getElementById('profileName').textContent = nama;
    document.getElementById('avatarInitial').textContent = initial;
    document.getElementById('pdName').textContent = nama;
    document.getElementById('pdEmail').textContent = email;
    document.getElementById('pdAvatarLg').textContent = initial;

    const input = document.getElementById('pdRenameInput');
    if (input) input.value = nama;

    return fetch(`${window.API_URL}/penghuni/search?q=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  })
  .then(res => res && res.json())
  .then(resData => {
    if (!resData || !resData.data) return;
    const list = resData.data?.data || (Array.isArray(resData.data) ? resData.data : []);
    const penghuni = list[0];
    if (!penghuni) return;

    const kamar = penghuni.id_kamar;
    const nomorKamar = (typeof kamar === 'object' ? kamar?.nomor_kamar : null) || '-';
    const lantai = (typeof kamar === 'object' ? kamar?.lantai : null) || '-';
    const tglMasuk = penghuni.tanggal_masuk
      ? new Date(penghuni.tanggal_masuk).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : '-';
    const noHp = penghuni.no_hp || '-';
    const statusRaw = (penghuni.status_penghuni || '').toLowerCase();
    const statusLabel = statusRaw === 'aktif' ? 'Aktif' : statusRaw === 'keluar' ? 'Sudah Keluar' : statusRaw || '-';

    document.getElementById('pdKamar').textContent = `Kamar ${nomorKamar}`;
    document.getElementById('pdLantai').textContent = `Lantai ${lantai}`;
    document.getElementById('pdTanggalMasuk').textContent = tglMasuk;
    document.getElementById('pdNoHp').textContent = noHp;

    const pdStatus = document.getElementById('pdStatus');
    pdStatus.textContent = statusLabel;
    pdStatus.style.color = statusRaw === 'aktif' ? 'var(--green-600)' : 'var(--pink-600)';
  })
  .catch(() => {
    const el = document.getElementById('profileName');
    if (el) el.textContent = 'Penghuni';
    const av = document.getElementById('avatarInitial');
    if (av) av.textContent = 'P';
  });
}

function toggleRenameMode() {
  const form = document.getElementById('pdRenameForm');
  const nameEl = document.getElementById('pdName');
  const input = document.getElementById('pdRenameInput');
  const feedback = document.getElementById('pdRenameFeedback');
  const icon = document.getElementById('pdEditIcon');

  const isOpen = form.style.display !== 'none';
  if (isOpen) {
    cancelRenameMode();
  } else {
    if (input) input.value = nameEl.textContent;
    if (feedback) feedback.textContent = '';
    form.style.display = 'block';
    nameEl.style.display = 'none';
    icon.className = 'ph ph-x';
    setTimeout(() => input && input.focus(), 50);
  }
}

function cancelRenameMode() {
  const form = document.getElementById('pdRenameForm');
  const nameEl = document.getElementById('pdName');
  const icon = document.getElementById('pdEditIcon');
  if (!form) return;
  form.style.display = 'none';
  if (nameEl) nameEl.style.display = '';
  if (icon) icon.className = 'ph ph-pencil-simple';
}

function saveRename() {
  const token = localStorage.getItem('token');
  const input = document.getElementById('pdRenameInput');
  const feedback = document.getElementById('pdRenameFeedback');
  const newName = (input?.value || '').trim();

  if (!newName || newName.length < 3) {
    feedback.textContent = 'Nama minimal 3 karakter.';
    feedback.style.color = 'var(--pink-600)';
    return;
  }

  feedback.textContent = 'Menyimpan...';
  feedback.style.color = 'var(--n400)';

  fetch(`${window.API_URL}/auth/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ nama_lengkap: newName })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      const initial = newName.charAt(0).toUpperCase();
      document.getElementById('pdName').textContent = newName;
      document.getElementById('profileName').textContent = newName;
      document.getElementById('avatarInitial').textContent = initial;
      document.getElementById('pdAvatarLg').textContent = initial;

      feedback.textContent = '✓ Nama berhasil diperbarui!';
      feedback.style.color = 'var(--green-600)';

      setTimeout(() => cancelRenameMode(), 1200);
    } else {
      feedback.textContent = data.message || 'Gagal menyimpan nama.';
      feedback.style.color = 'var(--pink-600)';
    }
  })
  .catch(() => {
    feedback.textContent = 'Koneksi ke server gagal.';
    feedback.style.color = 'var(--pink-600)';
  });
}

function toggleProfileDropdown(e) {
  e.stopPropagation();
  const dropdown = document.getElementById('profileDropdown');
  if (!dropdown) return;
  const isOpen = dropdown.style.display !== 'none';
  if (isOpen) {
    dropdown.style.display = 'none';
    cancelRenameMode();
  } else {
    dropdown.style.display = 'block';
  }
}

function handleLogout() {
  localStorage.removeItem('token');
  window.location.href = '../login.html';
}

function injectProfileDropdownStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .profile-dropdown {
      position: absolute;
      top: calc(100% + 12px);
      right: 0;
      width: 290px;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1.5px solid rgba(255, 255, 255, 0.85);
      border-radius: 20px;
      box-shadow: 0 16px 48px rgba(232, 60, 127, 0.14), 0 4px 16px rgba(0,0,0,0.06);
      z-index: 999;
      overflow: hidden;
      animation: pd-in 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    @keyframes pd-in {
      from { opacity: 0; transform: translateY(-8px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    .pd-header {
      background: linear-gradient(135deg, var(--pink-50), rgba(255,214,231,0.5));
      padding: 24px 20px 16px;
      text-align: center;
      border-bottom: 1px solid rgba(232,60,127,0.08);
    }
    .pd-avatar-lg {
      width: 60px; height: 60px;
      background: linear-gradient(135deg, var(--pink-200), var(--pink-400));
      color: #fff;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-family: var(--fd); font-weight: 900; font-size: 22px;
      margin: 0 auto 12px;
      box-shadow: 0 6px 16px rgba(232,60,127,0.28);
    }
    .pd-name-row {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      margin-bottom: 3px;
    }
    .pd-name {
      font-family: var(--fd); font-weight: 800;
      font-size: 15px; color: var(--n900);
    }
    .pd-edit-btn {
      background: none; border: none; cursor: pointer;
      color: var(--pink-400); font-size: 14px;
      padding: 2px 4px; border-radius: 6px;
      transition: color 0.15s, background 0.15s;
      display: flex; align-items: center;
    }
    .pd-edit-btn:hover { color: var(--pink-600); background: rgba(232,60,127,0.08); }
    .pd-rename-form {
      margin: 8px 0 6px;
    }
    .pd-rename-input {
      width: 100%;
      padding: 8px 12px;
      border: 1.5px solid var(--pink-200);
      border-radius: 10px;
      font-family: var(--fb); font-size: 13px;
      color: var(--n800); font-weight: 600;
      background: rgba(255,255,255,0.85);
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.18s, box-shadow 0.18s;
    }
    .pd-rename-input:focus {
      border-color: var(--pink-400);
      box-shadow: 0 0 0 3px rgba(232,60,127,0.10);
    }
    .pd-rename-actions {
      display: flex; gap: 6px; margin-top: 6px;
    }
    .pd-rename-save {
      flex: 1;
      padding: 7px 10px;
      background: var(--pink-500); color: #fff;
      border: none; border-radius: 9px;
      font-family: var(--fd); font-weight: 800; font-size: 12px;
      cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px;
      transition: background 0.18s, transform 0.18s;
    }
    .pd-rename-save:hover { background: var(--pink-600); transform: translateY(-1px); }
    .pd-rename-cancel {
      padding: 7px 10px;
      background: rgba(0,0,0,0.05); color: var(--n600);
      border: none; border-radius: 9px;
      font-size: 14px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.18s;
    }
    .pd-rename-cancel:hover { background: rgba(0,0,0,0.10); }
    .pd-rename-feedback {
      font-size: 11.5px; font-weight: 600;
      margin-top: 4px; min-height: 16px;
      text-align: left;
    }
    .pd-email {
      font-size: 12px; color: var(--n500);
      font-weight: 500; margin-bottom: 8px;
      word-break: break-all;
    }
    .pd-badge {
      display: inline-block;
      background: var(--green-100); color: var(--green-600);
      font-size: 10px; font-weight: 800;
      padding: 3px 10px; border-radius: 20px;
      letter-spacing: 0.6px;
    }
    .pd-body {
      padding: 12px 16px;
      display: flex; flex-direction: column; gap: 4px;
    }
    .pd-row {
      display: flex; align-items: center; gap: 12px;
      padding: 9px 10px;
      border-radius: 12px;
      transition: background 0.15s;
    }
    .pd-row:hover { background: rgba(232,60,127,0.04); }
    .pd-row > i {
      font-size: 17px; color: var(--pink-400);
      width: 20px; text-align: center; flex-shrink: 0;
    }
    .pd-row-label {
      font-size: 10.5px; color: var(--n400);
      font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.4px; margin-bottom: 1px;
    }
    .pd-row-value {
      font-size: 13.5px; font-weight: 700; color: var(--n800);
    }
    .pd-footer {
      padding: 10px 16px 14px;
      border-top: 1px solid rgba(232,60,127,0.07);
    }
    .pd-logout-btn {
      width: 100%;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: 10px 16px;
      background: var(--pink-50);
      color: var(--pink-600);
      border: 1.5px solid var(--pink-100);
      border-radius: 12px;
      font-family: var(--fd); font-weight: 800; font-size: 13px;
      cursor: pointer;
      transition: all 0.18s ease;
    }
    .pd-logout-btn:hover {
      background: var(--pink-100);
      border-color: var(--pink-200);
      transform: translateY(-1px);
    }
  `;
  document.head.appendChild(style);
}
