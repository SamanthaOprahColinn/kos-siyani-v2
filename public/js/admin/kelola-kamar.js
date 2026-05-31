// public/js/admin/kelola-kamar.js

const API_URL = 'http://localhost:5000/api';
let searchTimeout;

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/pages/login.html';
        return;
    }

    fetch(`${API_URL.replace('/v1', '')}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.data) {
                setTimeout(() => {
                    const profileEl = document.getElementById('profileName');
                    if (profileEl) profileEl.textContent = data.data.nama_lengkap;
                }, 150);
            }
        }).catch(err => console.log(err));

    fetchKamar();
});

function fetchKamar() {
    const token = localStorage.getItem('token');
    const container = document.getElementById('kamarGridContainer');
    container.innerHTML = '<div class="grid-status-message">Memuat data kamar...</div>';

    // Membaca nilai Search dan Sort langsung dari elemen DOM aktif
    const searchQuery = document.getElementById('searchKamar').value.trim();
    const sortBy = document.getElementById('sortKamar')?.value || 'num_asc';

    let url = `${API_URL}/kamar`;
    if (searchQuery) {
        url = `${API_URL}/kamar/search?q=${encodeURIComponent(searchQuery)}`;
    }

    fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
        .then(res => res.json())
        .then(resData => {
            container.innerHTML = '';
            container.classList.remove('room-grid');

            let daftar = resData.data?.data || resData.data || [];

            if (daftar && daftar.length > 0) {

                // --- 1. LOGIKA EKSEKUSI SORTING DATA UTAMA ---
                if (sortBy === 'num_asc') {
                    // Urutkan nomor kamar terkecil ke terbesar
                    daftar.sort((a, b) => Number(a.nomor_kamar) - Number(b.nomor_kamar));
                } else if (sortBy === 'num_desc') {
                    // Urutkan nomor kamar terbesar ke terkecil
                    daftar.sort((a, b) => Number(b.nomor_kamar) - Number(a.nomor_kamar));
                } else if (sortBy === 'newest') {
                    // Menggunakan createdAt backend / ID MongoDB (Hex ID MongoDB otomatis membesar seiring waktu)
                    daftar.sort((a, b) => (b.createdAt || b._id || '').localeCompare(a.createdAt || a._id || ''));
                } else if (sortBy === 'oldest') {
                    // Kebalikan dari terbaru
                    daftar.sort((a, b) => (a.createdAt || a._id || '').localeCompare(b.createdAt || b._id || ''));
                }

                // --- 2. SEPARASI DATA SESUAI BARIS (Tersedia & Terisi) ---
                // Data yang sudah di-sort di atas akan mempertahankan urutannya di kelompok masing-masing
                const kamarTersedia = daftar.filter(k => String(k.status_kamar || k.status || '').toLowerCase() === 'tersedia');
                const kamarTerisi = daftar.filter(k => String(k.status_kamar || k.status || '').toLowerCase() !== 'tersedia');

                function generateCardHtml(k) {
                    const isTersedia = String(k.status_kamar || k.status || '').toLowerCase() === 'tersedia';
                    const badgeClass = isTersedia ? 'green' : 'pink';
                    const doorIconClass = isTersedia ? 'available' : 'occupied';
                    const doorIcon = isTersedia ? 'ph-door-open' : 'ph-door';
                    const statusText = isTersedia ? 'TERSEDIA' : 'TERISI';
                    const catatanKamar = k.deskripsi ? k.deskripsi : '<span class="no-notes">Tidak ada catatan</span>';

                    const fasilitasKamar = (k.fasilitas && k.fasilitas.length > 0)
                        ? k.fasilitas.join(', ')
                        : '<span class="no-notes">Tidak ada data fasilitas</span>';

                    return `
                                <div class="room-card">
                                    <div class="room-card-header">
                                        <span class="room-number">Kamar ${k.nomor_kamar}</span>
                                        <span class="badge-clay ${badgeClass}">${statusText}</span>
                                    </div>
                                    
                                    <div class="door-container">
                                        <i class="ph ${doorIcon} door-3d-icon ${doorIconClass}"></i>
                                        <div class="room-meta-container">
                                            <div>
                                                <div class="room-meta-label">LANTAI</div>
                                                <div class="room-meta-value">${k.lantai}</div>
                                            </div>
                                            <div>
                                                <div class="room-meta-label">TIPE</div>
                                                <div class="room-meta-value">${k.tipe_kamar}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="room-details">
                                        <span>Harga Sewa / Bln</span>
                                        <span class="room-price-value">Rp ${Number(k.harga_sewa).toLocaleString('id-ID')}</span>
                                    </div>

                                    <div class="room-notes" style="margin-bottom: 8px; border-bottom: 1px dashed #eee; padding-bottom: 8px;">
                                        <strong>Fasilitas:</strong> <span style="text-transform: capitalize;">${fasilitasKamar}</span>
                                    </div>

                                    <div class="room-notes">
                                        <strong>Catatan:</strong> ${catatanKamar}
                                    </div>

                                    <div class="room-actions">
                                        <button class="btn-icon-clay edit" onclick="openEditModal('${k._id}')" title="Ubah Kamar">
                                            <i class="ph ph-pencil-simple"></i>
                                        </button>
                                        <button class="btn-icon-clay delete" onclick="deleteKamar('${k._id}')" title="Hapus Kamar">
                                            <i class="ph ph-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            `;
                }

                let HTMLHasilSorting = '';

                // Baris Kamar Tersedia
                if (kamarTersedia.length > 0) {
                    HTMLHasilSorting += `
                                <div class="section-group-kamar" style="margin-bottom: 32px;">
                                    <div style="display: inline-flex; align-items: center; background: #e6fffa; color: #234e52; padding: 8px 18px; border-radius: 20px; box-shadow: 6px 6px 12px rgba(165, 215, 210, 0.4), inset -3px -3px 7px rgba(140, 200, 190, 0.7), inset 3px 3px 6px #ffffff; font-weight: 700; font-size: 13px; letter-spacing: 0.5px; margin-bottom: 16px; gap: 8px; text-transform: uppercase;">
                                        <i class="ph ph-circle-wavy-check" style="font-size: 18px;"></i>
                                        <span>Kamar Tersedia</span>
                                        <span style="background: #234e52; color: #ffffff; padding: 2px 9px; border-radius: 12px; font-size: 11px; font-weight: 800; box-shadow: inset 1px 1px 3px rgba(0,0,0,0.2);">${kamarTersedia.length}</span>
                                    </div>
                                    <div class="room-grid">
                                        ${kamarTersedia.map(k => generateCardHtml(k)).join('')}
                                    </div>
                                </div>
                            `;
                }

                if (kamarTersedia.length > 0 && kamarTerisi.length > 0) {
                    HTMLHasilSorting += '<hr style="border: 0; border-top: 1px dashed var(--border-clay, #eee); margin: 24px 0;" />';
                }

                // Baris Kamar Terisi
                if (kamarTerisi.length > 0) {
                    HTMLHasilSorting += `
                                <div class="section-group-kamar">
                                    <div style="display: inline-flex; align-items: center; background: #fff5f5; color: #9b2c2c; padding: 8px 18px; border-radius: 20px; box-shadow: 6px 6px 12px rgba(245, 215, 215, 0.5), inset -3px -3px 7px rgba(230, 190, 190, 0.7), inset 3px 3px 6px #ffffff; font-weight: 700; font-size: 13px; letter-spacing: 0.5px; margin-bottom: 16px; gap: 8px; text-transform: uppercase;">
                                        <i class="ph ph-user-focus" style="font-size: 18px;"></i>
                                        <span>Kamar Terisi / Tidak Tersedia</span>
                                        <span style="background: #9b2c2c; color: #ffffff; padding: 2px 9px; border-radius: 12px; font-size: 11px; font-weight: 800; box-shadow: inset 1px 1px 3px rgba(0,0,0,0.2);">${kamarTerisi.length}</span>
                                    </div>
                                    <div class="room-grid">
                                        ${kamarTerisi.map(k => generateCardHtml(k)).join('')}
                                    </div>
                                </div>
                            `;
                }

                container.innerHTML = HTMLHasilSorting;
            } else {
                container.className = 'room-grid';
                container.innerHTML = '<div class="grid-status-message">Tidak ada data kamar ditemukan.</div>';
            }
        })
        .catch(err => {
            console.error(err);
            container.className = 'room-grid';
            container.innerHTML = '<div class="grid-status-message error-msg">Gagal terhubung ke API Kamar.</div>';
        });
}

function debounceSearchKamar() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        fetchKamar(); // Mengosongkan parameter agar dibaca langsung di dalam fungsi fetchKamar
    }, 500);
}

function openEditModal(id) {
    const token = localStorage.getItem('token');

    fetch(`${API_URL}/kamar/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
        .then(res => res.json())
        .then(resData => {
            const k = resData.data;

            document.getElementById('modalTitle').textContent = 'Ubah Detail Kamar ✨';
            document.getElementById('btnSubmitKamar').textContent = 'Update Data Kamar';

            document.getElementById('kamarId').value = k._id;
            document.getElementById('kNomor').value = k.nomor_kamar;
            document.getElementById('kLantai').value = k.lantai;
            document.getElementById('kTipe').value = k.tipe_kamar;
            document.getElementById('kHarga').value = k.harga_sewa;

            document.getElementById('kFasilitas').value = k.fasilitas ? k.fasilitas.join(', ') : '';
            document.getElementById('kDeskripsi').value = k.deskripsi || '';

            document.getElementById('kamarModal').classList.add('active');
        })
        .catch(err => {
            console.error(err);
            alert('Gagal mengambil data kamar untuk diedit.');
        });
}

function saveKamar(event) {
    event.preventDefault();
    const token = localStorage.getItem('token');
    const btn = document.getElementById('btnSubmitKamar');

    const kamarId = document.getElementById('kamarId').value;
    const isEdit = kamarId !== "";

    const nomorRaw = document.getElementById('kNomor').value;
    const lantaiRaw = document.getElementById('kLantai').value;
    const tipeRaw = document.getElementById('kTipe').value;
    const hargaRaw = document.getElementById('kHarga').value;
    const fasilitasRaw = document.getElementById('kFasilitas').value;
    const deskripsiRaw = document.getElementById('kDeskripsi').value.trim();

    if (!nomorRaw || !lantaiRaw || !tipeRaw) {
        alert("Nomor Kamar, Lantai, dan Tipe Kamar wajib diisi!");
        return;
    }

    const payload = {
        nomor_kamar: Number(nomorRaw),
        lantai: Number(lantaiRaw),
        tipe_kamar: tipeRaw,
    };

    if (hargaRaw !== "") {
        payload.harga_sewa = Number(hargaRaw);
    }

    const arrayFasilitas = fasilitasRaw.split(',')
        .map(f => f.trim())
        .filter(f => f !== "");
    if (arrayFasilitas.length > 0) {
        payload.fasilitas = arrayFasilitas;
    }

    if (deskripsiRaw !== "") {
        payload.deskripsi = deskripsiRaw;
    }

    btn.style.pointerEvents = 'none';
    btn.textContent = isEdit ? 'Updating...' : 'Menyimpan...';

    if (!isEdit) {
        alert("Admin hanya berhak mengubah data kamar yang sudah ada.");
        return;
    }
    const url = `${API_URL}/kamar/${kamarId}`;
    const method = 'PATCH';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    })
        .then(async (res) => {
            const data = await res.json();
            return { status: res.status, data };
        })
        .then(({ status, data }) => {
            btn.style.pointerEvents = 'auto';
            btn.textContent = 'Simpan Kamar';

            if (status === 201 || status === 200 || data.success) {
                alert(isEdit ? 'Data kamar berhasil diperbarui! 💖' : 'Kamar baru berhasil ditambahkan! 🎉');
                closeKamarModal();
                fetchKamar();
            } else {
                console.error("❌ DETAIL ERROR BACKEND:", data);
                if (data.errors && Array.isArray(data.errors)) {
                    const listError = data.errors.map(err => `- [Kolom ${err.field}]: ${err.message}`).join('\n');
                    alert(`Gagal Validasi Backend:\n\n${listError}`);
                } else {
                    alert(`Gagal Menyimpan: ${data.message || 'Periksa kembali isian data Anda.'}`);
                }
            }
        })
        .catch(err => {
            btn.style.pointerEvents = 'auto';
            btn.textContent = 'Simpan Kamar';
            alert('Terjadi kesalahan jaringan.');
        });
}

// --- KEMBALI KE SOFT DELETE ---
function deleteKamar(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus kamar ini? (Data akan dipindahkan ke Tong Sampah)')) return;

    const token = localStorage.getItem('token');

    fetch(`${API_URL}/kamar/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    })
        .then(res => res.json())
        .then(data => {
            if (data.success || data.statusCode === 200) {
                alert('Kamar berhasil dipindahkan ke Tong Sampah!');
                fetchKamar(); // Refresh data utama
                if (!document.getElementById('trashSection').classList.contains('hidden')) {
                    fetchDeletedKamar(); // Refresh tabel tong sampah jika sedang dibuka
                }
            } else {
                alert(data.message || 'Gagal menghapus kamar.');
            }
        })
        .catch(err => {
            console.error(err);
            alert('Terjadi kesalahan jaringan.');
        });
}

function closeKamarModal() {
    document.getElementById('kamarModal').classList.remove('active');
}

// --- FUNGSI TONG SAMPAH (RESTORE) ---
function toggleTrashSection() {
    const section = document.getElementById('trashSection');
    if (section.classList.contains('hidden')) {
        section.classList.remove('hidden');
        fetchDeletedKamar();
    } else {
        section.classList.add('hidden');
    }
}

function fetchDeletedKamar() {
    const token = localStorage.getItem('token');
    const tbody = document.getElementById('deletedKamarBody');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Mengambil data...</td></tr>';

    fetch(`${API_URL}/kamar/deleted/all`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    })
        .then(res => res.json())
        .then(data => {
            if (data.success || data.statusCode === 200) {
                renderDeletedKamar(data.data.data || data.data);
            } else {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Gagal mengambil data.</td></tr>';
            }
        })
        .catch(err => {
            console.error(err);
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Terjadi kesalahan jaringan.</td></tr>';
        });
}

function renderDeletedKamar(kamarList) {
    const tbody = document.getElementById('deletedKamarBody');
    tbody.innerHTML = '';

    if (!kamarList || kamarList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #666;">Tidak ada kamar yang terhapus.</td></tr>';
        return;
    }

    kamarList.forEach(kamar => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
                    <td><strong>${kamar.nomor_kamar}</strong></td>
                    <td>${kamar.tipe_kamar}</td>
                    <td>Rp ${Number(kamar.harga_sewa).toLocaleString('id-ID')}</td>
                    <td>
                        <button class="btn-restore" onclick="restoreKamar('${kamar._id}')">
                            <i class="ph ph-recycle"></i> Restore
                        </button>
                    </td>
                `;
        tbody.appendChild(tr);
    });
}

function restoreKamar(id) {
    if (!confirm('Apakah Anda yakin ingin memulihkan kamar ini ke daftar aktif?')) return;

    const token = localStorage.getItem('token');

    fetch(`${API_URL}/kamar/${id}/restore`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
    })
        .then(res => res.json())
        .then(data => {
            if (data.success || data.statusCode === 200) {
                alert('Kamar berhasil dipulihkan!');
                fetchDeletedKamar(); // Refresh tabel tong sampah
                fetchKamar();        // Refresh grid utama
            } else {
                alert(data.message || 'Gagal memulihkan kamar.');
            }
        })
        .catch(err => {
            console.error(err);
            alert('Terjadi kesalahan jaringan.');
        });
}