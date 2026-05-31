// public/js/admin/kelola-penghuni.js

const API_URL = 'http://localhost:5000/api';
window.currentPenghuni = [];
window.availableRoomsHtml = '<option value="">-- Pilih Nomor Kamar --</option>';

// Variable penampung timeout untuk fitur search debounce
let searchPenghuniTimeout;

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '../login.html'; return; }

    // Verifikasi User
    fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json()).then(data => {
        if (data.success && data.data) {
            document.getElementById('profileName').textContent = data.data.nama_lengkap;
            document.getElementById('avatarInitial').textContent = data.data.nama_lengkap.charAt(0).toUpperCase();
        }
    }).catch(() => {
        localStorage.removeItem('token');
        window.location.href = '../login.html';
    });

    fetchKamarPilihan();
    fetchPenghuni();
});

// ================= FITUR TAMBAHAN: DEBOUNCE SEARCH =================
function debounceSearchPenghuni() {
    clearTimeout(searchPenghuniTimeout);
    searchPenghuniTimeout = setTimeout(() => {
        fetchPenghuni();
    }, 500); // Eksekusi pencarian 500ms setelah user berhenti mengetik
}

// 1. FETCH DATA KAMAR (Proteksi Ketat: Deteksi 'tidak tersedia' & 'terisi')
function fetchKamarPilihan() {
    const token = localStorage.getItem('token');
    const selectRegister = document.getElementById('tenantRoom');
    const selectRestore = document.getElementById('restoreTenantRoom');

    fetch(`${API_URL}/kamar?status=tersedia`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
        .then(res => res.json())
        .then(resData => {
            const kamarList = resData.data?.data || resData.data || [];
            let optionsHtml = '<option value="">-- Pilih Kamar --</option>';

            if (kamarList.length > 0) {
                kamarList.forEach(k => {
                    const statusKamar = String(k.status_kamar || k.status || '').toLowerCase();

                    if (k.isDeleted === true || statusKamar === 'tidak tersedia' || statusKamar === 'terisi') return;

                    const lantai = k.lantai || k.nomor_lantai || '-';
                    const nomor = k.nomor_kamar || k.no_kamar || '??';
                    const tipe = k.tipe_kamar || k.tipe || 'Standard';

                    optionsHtml += `<option value="${k._id}">Lantai ${lantai} - Kamar ${nomor} - ${tipe}</option>`;
                });
            } else {
                optionsHtml = '<option value="">Tidak ada kamar kosong yang tersedia</option>';
            }

            window.availableRoomsHtml = optionsHtml;
            if (selectRegister) selectRegister.innerHTML = optionsHtml;
            if (selectRestore) selectRestore.innerHTML = optionsHtml;
        })
        .catch(err => console.error('Gagal memuat kamar:', err));
}

// 2. FETCH PENGHUNI (UPDATED: Include Search & Sorting)
function fetchPenghuni() {
    const token = localStorage.getItem('token');
    const tbodyAktif = document.getElementById('tenantTableBody');
    const tbodyHistory = document.getElementById('historyTableBody');

    tbodyAktif.innerHTML = '<tr><td colspan="5" style="text-align:center;">Memuat data aktif...</td></tr>';
    tbodyHistory.innerHTML = '<tr><td colspan="4" style="text-align:center;">Memuat data riwayat...</td></tr>';

    // Ambil nilai filter Search dan Sort dari halaman HTML
    const searchQuery = document.getElementById('searchPenghuni')?.value.trim() || '';
    const sortBy = document.getElementById('sortPenghuni')?.value || 'name_asc';

    // Penentuan Endpoint API berdasarkan query pencarian
    let url = `${API_URL}/penghuni`;
    if (searchQuery) {
        url = `${API_URL}/penghuni/search?q=${encodeURIComponent(searchQuery)}`;
    }

    fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
        .then(res => res.json())
        .then(resData => {
            tbodyAktif.innerHTML = '';
            tbodyHistory.innerHTML = '';

            let penghuniList = resData.data?.data || resData.data || (Array.isArray(resData) ? resData : []);
            window.currentPenghuni = penghuniList;

            // --- PROSES SORTING DATA GLOBAL ---
            if (sortBy === 'name_asc') {
                penghuniList.sort((a, b) => (a.nama_lengkap || '').localeCompare(b.nama_lengkap || ''));
            } else if (sortBy === 'name_desc') {
                penghuniList.sort((a, b) => (b.nama_lengkap || '').localeCompare(a.nama_lengkap || ''));
            } else if (sortBy === 'newest') {
                penghuniList.sort((a, b) => (b.createdAt || b._id || '').localeCompare(a.createdAt || a._id || ''));
            } else if (sortBy === 'oldest') {
                penghuniList.sort((a, b) => (a.createdAt || a._id || '').localeCompare(b.createdAt || b._id || ''));
            }

            let countAktif = 0;
            let countHistory = 0;

            penghuniList.forEach(p => {
                const status = String(p.status_penghuni || 'aktif').toLowerCase();
                const isAktif = status === 'aktif';

                let kamarData = {};
                if (typeof p.id_kamar === 'object' && p.id_kamar !== null) {
                    kamarData = p.id_kamar;
                } else if (typeof p.kamar_id === 'object' && p.kamar_id !== null) {
                    kamarData = p.kamar_id;
                } else {
                    kamarData = p;
                }

                const lantai = kamarData.lantai || kamarData.nomor_lantai || '-';
                const nomorKamar = kamarData.nomor_kamar || kamarData.no_kamar || '??';
                const tipe = kamarData.tipe_kamar || kamarData.tipe || '';

                const teksKamar = nomorKamar !== '??'
                    ? `Lantai ${lantai} - No. ${nomorKamar}`
                    : '<span style="color: #e53e3e; font-size: 12px;">Kamar Kosong / Keluar</span>';

                const teksTipe = tipe ? `<div style="font-size: 11px; color: var(--text-muted);">${tipe}</div>` : '';

                if (isAktif) {
                    countAktif++;
                    tbodyAktif.insertAdjacentHTML('beforeend', `
                        <tr>
                            <td>
                                <div class="font-bold">${teksKamar}</div>
                                ${teksTipe}
                            </td>
                            <td style="font-weight: 600;">${p.nama_lengkap || '-'}</td>
                            <td style="font-size: 12px; color: var(--text-muted);">
                                <div><i class="ph ph-phone"></i> ${p.no_hp || p.nomor_hp || '-'}</div>
                                <div><i class="ph ph-envelope"></i> ${p.email || '-'}</div>
                            </td>
                            <td><span class="status-dot aktif">Aktif</span></td>
                            <td>
                                <div class="action-flex">
                                    <button class="btn btn-ghost btn-sm" style="color: #3182ce;" onclick="openEditModal('${p._id}')" title="Edit Data">
                                        <i class="ph ph-pencil-simple"></i>
                                    </button>
                                    <button class="btn btn-ghost btn-sm" style="color: #e53e3e;" onclick="checkoutTenant('${p._id}')" title="Keluarkan Penghuni">
                                        <i class="ph ph-sign-out"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `);
                } else {
                    countHistory++;
                    tbodyHistory.insertAdjacentHTML('beforeend', `
                        <tr style="opacity: 0.8;">
                            <td style="font-weight: 600;">${p.nama_lengkap || '-'}</td>
                            <td style="font-size: 12px; color: var(--text-muted);">
                                <div><i class="ph ph-phone"></i> ${p.no_hp || p.nomor_hp || '-'}</div>
                            </td>
                            <td>Kamar Terakhir:<br><strong>${teksKamar}</strong></td>
                            <td>
                                <button class="btn btn-ghost btn-sm" style="color: #38a169; width:100%; border: 1px solid #38a169;" onclick="openRestoreModal('${p._id}', '${p.nama_lengkap}')" title="Aktifkan Kembali">
                                    <i class="ph ph-arrow-u-up-left"></i> Pulihkan
                                </button>
                            </td>
                        </tr>
                    `);
                }
            });

            if (countAktif === 0) tbodyAktif.innerHTML = '<tr><td colspan="5"><div class="table-empty"><div class="table-empty-title">Tidak ada penghuni aktif</div></div></td></tr>';
            if (countHistory === 0) tbodyHistory.innerHTML = '<tr><td colspan="4"><div class="table-empty"><div class="table-empty-title">Belum ada riwayat penghuni</div></div></td></tr>';
        })
        .catch((err) => {
            console.error(err);
            tbodyAktif.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Gagal memuat data.</td></tr>';
            tbodyHistory.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Gagal memuat data.</td></tr>';
        });
}

// 3. REGISTRASI PENGHUNI BARU
function saveTenant(event) {
    event.preventDefault();
    const token = localStorage.getItem('token');
    const roomId = document.getElementById('tenantRoom').value;

    if (!roomId) return showToast('Pilih kamar terlebih dahulu!', 'warning');

    const payload = {
        nama_lengkap: document.getElementById('tenantName').value.trim(),
        no_ktp: document.getElementById('tenantKtp').value.trim(),
        no_hp: document.getElementById('tenantHp').value.trim(),
        email: document.getElementById('tenantEmail').value.trim(),
        id_kamar: roomId,
        alamat_asal: document.getElementById('tenantAddress').value.trim()
    };

    const btn = document.getElementById('btnSaveTenant');
    btn.innerHTML = 'Menyimpan...';
    btn.style.pointerEvents = 'none';

    // Cukup 1 kali fetch, karena backend sudah urus update status kamar otomatis!
    fetch(`${API_URL}/penghuni`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
    })
        .then(res => res.json())
        .then(data => {
            if (!data.success) throw new Error(formatApiError(data, 'Gagal mendaftar penghuni.'));

            btn.innerHTML = '<i class="ph ph-floppy-disk"></i> Simpan Data Penghuni';
            btn.style.pointerEvents = 'auto';

            document.getElementById('formPenghuni').reset();
            showToast('Penghuni sukses terdaftar & Kamar otomatis dikunci!', 'success');
            fetchPenghuni();
            fetchKamarPilihan();
        })
        .catch(err => {
            btn.innerHTML = '<i class="ph ph-floppy-disk"></i> Simpan Data Penghuni';
            btn.style.pointerEvents = 'auto';
            showToast('Gagal: ' + err.message, 'error');
        });
}

// 4. CHECKOUT PENGHUNI
function checkoutTenant(id) {
    if (!confirm('Keluarkan penghuni ini? Kamar otomatis diset menjadi tersedia kembali.')) return;

    const token = localStorage.getItem('token');
    const target = window.currentPenghuni.find(p => p._id === id);
    if (!target) return showToast('Data tidak ditemukan!', 'error');

    let roomId = target.id_kamar?._id || target.id_kamar || target.kamar_id?._id || target.kamar_id;

    const payload = {
        nama_lengkap: target.nama_lengkap,
        no_ktp: target.no_ktp ? String(target.no_ktp) : '',
        no_hp: target.no_hp || target.nomor_hp ? String(target.no_hp || target.nomor_hp) : '',
        email: target.email,
        alamat_asal: target.alamat_asal || '-',
        id_kamar: roomId,
        status_penghuni: 'keluar'
    };

    fetch(`${API_URL}/penghuni/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
    })
        .then(res => res.json())
        .then(data => {
            if (!data.success) throw new Error(formatApiError(data, 'Gagal mengubah status.'));

            if (roomId) {
                return fetch(`${API_URL}/kamar/${roomId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        status_kamar: 'tersedia',
                        status: 'tersedia'
                    })
                });
            }
        })
        .then(() => {
            showToast('Penghuni sukses dinonaktifkan!', 'success');
            fetchPenghuni();
            fetchKamarPilihan();
        })
        .catch(err => showToast('Masalah: ' + err.message, 'error'));
}

// 5. MODAL EDIT PENGHUNI
function openEditModal(id) {
    const target = window.currentPenghuni.find(p => p._id === id);
    if (!target) return showToast('Data tidak ditemukan!', 'error');

    const kamarData = target.id_kamar || target.kamar_id || {};
    const roomId = kamarData._id || '';
    const nomorKamar = kamarData.nomor_kamar || '??';
    const lantai = kamarData.lantai || '-';
    const tipe = kamarData.tipe_kamar || 'Standard';

    document.getElementById('editTenantId').value = target._id;
    document.getElementById('editTenantOldRoomId').value = roomId;
    document.getElementById('editTenantName').value = target.nama_lengkap || '';
    document.getElementById('editTenantHp').value = target.no_hp || target.nomor_hp || '';
    document.getElementById('editTenantEmail').value = target.email || '';
    document.getElementById('editTenantAddress').value = target.alamat_asal || '';

    const selectEditRoom = document.getElementById('editTenantRoom');

    let optionsHtml = window.availableRoomsHtml;
    if (roomId) {
        const currentOption = `<option value="${roomId}">Lantai ${lantai} - Kamar ${nomorKamar} - ${tipe} (Kamar Sekarang)</option>`;
        optionsHtml = currentOption + optionsHtml;
    }

    selectEditRoom.innerHTML = optionsHtml;
    selectEditRoom.value = roomId;

    document.getElementById('editTenantModal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('editTenantModal').style.display = 'none';
}

// 6. UPDATE DATA & PROSES MUTASI PINDAH KAMAR
function updateTenant(event) {
    event.preventDefault();
    const token = localStorage.getItem('token');
    const id = document.getElementById('editTenantId').value;
    const oldRoomId = document.getElementById('editTenantOldRoomId').value;
    const newRoomId = document.getElementById('editTenantRoom').value;

    const payload = {
        nama_lengkap: document.getElementById('editTenantName').value.trim(),
        no_hp: document.getElementById('editTenantHp').value.trim(),
        email: document.getElementById('editTenantEmail').value.trim(),
        alamat_asal: document.getElementById('editTenantAddress').value.trim(),
        id_kamar: newRoomId
    };

    const btn = document.getElementById('btnUpdateTenant');
    btn.innerHTML = 'Memperbarui...';
    btn.style.pointerEvents = 'none';

    fetch(`${API_URL}/penghuni/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
    })
        .then(res => res.json())
        .then(data => {
            if (!data.success) throw new Error(formatApiError(data, 'Gagal update data.'));

            if (oldRoomId && newRoomId && oldRoomId !== newRoomId) {
                const releaseOld = fetch(`${API_URL}/kamar/${oldRoomId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ status_kamar: 'tersedia', status: 'tersedia' })
                });

                const occupyNew = fetch(`${API_URL}/kamar/${newRoomId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ status_kamar: 'tidak tersedia', status: 'tidak tersedia' })
                });

                return Promise.all([releaseOld, occupyNew]);
            }
        })
        .then(() => {
            btn.innerHTML = '<i class="ph ph-check"></i> Simpan Perubahan Data';
            btn.style.pointerEvents = 'auto';
            showToast('Perubahan berhasil disimpan!', 'success');
            closeEditModal();
            fetchPenghuni();
            fetchKamarPilihan();
        })
        .catch(err => {
            btn.innerHTML = '<i class="ph ph-check"></i> Simpan Perubahan Data';
            btn.style.pointerEvents = 'auto';
            showToast('Gagal update: ' + err.message, 'error');
        });
}

// 7. PULIHKAN (RESTORE) DATA DENGAN PENGUNCIAN 'tidak tersedia'
function openRestoreModal(id, name) {
    document.getElementById('restoreTenantId').value = id;
    document.getElementById('restoreTenantNameDisplay').textContent = name;

    const selectRestore = document.getElementById('restoreTenantRoom');
    selectRestore.innerHTML = window.availableRoomsHtml;

    document.getElementById('restoreTenantModal').style.display = 'flex';
}

function formatApiError(data, fallback = 'Terjadi kesalahan') {
    if (data.errors && data.errors.length > 0) {
        const unique = [...new Map(data.errors.map(e => [e.message, e])).values()];
        if (unique.length === 1) return unique[0].message;
        const list = unique.map(e => `• ${e.message}`).join('<br>');
        return `Validasi gagal:<br>${list}`;
    }
    return data.message || fallback;
}

// Toast notification
function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: 'ph-check-circle', warning: 'ph-warning', error: 'ph-x-circle', info: 'ph-info' };
    toast.innerHTML = `<i class="ph ${icons[type] || icons.info}" style="font-size:18px;flex-shrink:0;"></i><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function closeRestoreModal() {
    document.getElementById('restoreTenantModal').style.display = 'none';
}

function submitRestoreTenant(event) {
    event.preventDefault();
    const token = localStorage.getItem('token');
    const id = document.getElementById('restoreTenantId').value;
    const newRoomId = document.getElementById('restoreTenantRoom').value;

    if (!newRoomId) return showToast('Wajib memilih kamar baru untuk memulihkan!', 'warning');

    const target = window.currentPenghuni.find(p => p._id === id);
    if (!target) return showToast('Data internal tidak terbaca.', 'error');

    const payload = {
        nama_lengkap: target.nama_lengkap,
        no_ktp: target.no_ktp ? String(target.no_ktp) : '',
        no_hp: target.no_hp || target.nomor_hp ? String(target.no_hp || target.nomor_hp) : '',
        email: target.email,
        alamat_asal: target.alamat_asal || '-',
        id_kamar: newRoomId,
        status_penghuni: 'aktif'
    };

    const btn = document.getElementById('btnRestoreTenant');
    btn.innerHTML = 'Memulihkan...';
    btn.style.pointerEvents = 'none';

    fetch(`${API_URL}/penghuni/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
    })
        .then(res => res.json())
        .then(data => {
            if (!data.success) throw new Error(formatApiError(data, 'Gagal aktivasi data penghuni.'));

            return fetch(`${API_URL}/kamar/${newRoomId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    status_kamar: 'tidak tersedia',
                    status: 'tidak tersedia'
                })
            });
        })
        .then(() => {
            btn.innerHTML = '<i class="ph ph-check"></i> Aktifkan & Simpan';
            btn.style.pointerEvents = 'auto';
            showToast('Penghuni berhasil dipulihkan!', 'success');
            closeRestoreModal();
            fetchPenghuni();
            fetchKamarPilihan();
        })
        .catch(err => {
            btn.innerHTML = '<i class="ph ph-check"></i> Aktifkan & Simpan';
            btn.style.pointerEvents = 'auto';
            showToast('Gagal memulihkan: ' + err.message, 'error');
        });
}