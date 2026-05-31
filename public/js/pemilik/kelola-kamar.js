// public/js/pemilik/kelola-kamar.js

document.addEventListener('DOMContentLoaded', () => {
    // Pengecekan token tetap di sini agar halaman tetap aman
    if (!localStorage.getItem('token')) { 
        window.location.href = '../login.html'; 
        return; 
    }

    fetchKamar();
});

function openModal() { document.getElementById('kamarModal').style.display = 'flex'; }
function closeModal() { 
    document.getElementById('kamarModal').style.display = 'none'; 
    document.getElementById('formKamar').reset(); 
}

function fetchKamar() {
    const token = localStorage.getItem('token');
    const tbody = document.getElementById('kamarTableBody');
    
<<<<<<< Updated upstream
    fetch(`${API_URL}/kamar`, { 
=======
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Memuat data...</td></tr>';

    fetch(`${window.API_URL || 'http://localhost:5000/api'}/kamar`, { 
>>>>>>> Stashed changes
        headers: { 'Authorization': `Bearer ${token}` } 
    })
    .then(res => res.json())
    .then(resData => {
        tbody.innerHTML = '';
        
        const list = resData.data?.data || resData.data || [];

        if (list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Belum ada data kamar.</td></tr>';
            return;
        }

        list.forEach(k => {
            const tr = document.createElement('tr');
            const status = (k.status_kamar || 'tersedia').toLowerCase();
            tr.innerHTML = `
                <td class="font-bold">Kamar ${k.nomor_kamar || '-'}</td>
                <td>${k.tipe_kamar || '-'} / Lt. ${k.lantai || '-'}</td>
                <td>Rp ${Number(k.harga_sewa || 0).toLocaleString('id-ID')}</td>
                <td><span class="badge badge-${status === 'tersedia' ? 'success' : 'warning'}">${status.toUpperCase()}</span></td>
            `;
            tbody.appendChild(tr);
        });
    })
    .catch(err => {
        console.error("Error:", err);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Gagal memuat data. Cek Console.</td></tr>';
    });
}

<<<<<<< Updated upstream
=======
function renderTabelKamar(data) {
    const tbody = document.getElementById('kamarTableBody');
    tbody.innerHTML = '';

    if (data.length === 0) {
        // Colspan diubah menjadi 6 karena ada tambahan kolom Fasilitas & Catatan
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Belum ada data kamar atau pencarian tidak ditemukan.</td></tr>';
        return;
    }

    data.forEach(k => {
        const tr = document.createElement('tr');
        const status = (k.status_kamar || 'tersedia').toLowerCase();
        
        let badgeClass = 'badge-kosong';
        let statusText = 'TERSEDIA';

        if (status === 'terisi' || status === 'tidak tersedia') {
            badgeClass = 'badge-terisi';
            statusText = 'TERISI';
        }

        const fasilitasStr = (Array.isArray(k.fasilitas) && k.fasilitas.length > 0) 
            ? k.fasilitas.join(', ') 
            : (k.fasilitas || '-');

        // Menarik data deskripsi dari backend sebagai Catatan
        const catatanStr = k.deskripsi ? k.deskripsi : '-';

        tr.innerHTML = `
            <td class="font-bold">No. ${k.nomor_kamar || '-'} / Lt. ${k.lantai || '-'}</td>
            <td>Tipe ${k.tipe_kamar || '-'}</td>
            <td style="font-size: 13px; color: var(--n500); max-width: 220px; white-space: normal; line-height: 1.4;">
                ${fasilitasStr}
            </td>
            <td style="font-size: 13px; color: var(--n500); max-width: 220px; white-space: normal; line-height: 1.4; font-style: italic;">
                ${catatanStr}
            </td>
            <td style="color: var(--pink-600); font-weight: 600;">Rp ${Number(k.harga_sewa || 0).toLocaleString('id-ID')}</td>
            <td><span class="badge ${badgeClass}">${statusText}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

// Fungsi Pencarian / Filter 
function filterTabelKamar() {
    const keyword = document.getElementById('searchKamar').value.toLowerCase();
    
    const filteredData = dataKamarGlobal.filter(k => {
        const noKamar = (k.nomor_kamar || '').toString().toLowerCase();
        const tipe = (k.tipe_kamar || '').toLowerCase();
        const harga = (k.harga_sewa || '').toString().toLowerCase();
        
        return noKamar.includes(keyword) || tipe.includes(keyword) || harga.includes(keyword);
    });

    renderTabelKamar(filteredData);
}

>>>>>>> Stashed changes
function addKamar(event) {
    event.preventDefault();
    const token = localStorage.getItem('token');
    
    const fasilitasInput = document.getElementById('fasilitas').value;
    const fasilitasArray = fasilitasInput.split(',').map(item => item.trim());

    const payload = {
        nomor_kamar: parseInt(document.getElementById('nomor_kamar').value),
        lantai: parseInt(document.getElementById('lantai').value),
        tipe_kamar: document.getElementById('tipe_kamar').value,
        harga_sewa: parseInt(document.getElementById('harga_sewa').value),
        fasilitas: fasilitasArray,
        status_kamar: 'tersedia'
    };

    fetch(`${API_URL}/kamar`, { 
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert('Kamar berhasil ditambahkan!');
            closeModal();
            fetchKamar();
        } else {
            alert('Gagal: ' + (data.message || 'Cek kembali input Anda'));
        }
    })
    .catch(err => console.error("Error:", err));
}