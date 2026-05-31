// public/js/pemilik/kelola-kamar.js

window.API_URL = window.API_URL || 'http://localhost:5000/api';
let dataKamarGlobal = [];

document.addEventListener('DOMContentLoaded', () => {
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
    
    // Tampilkan indikator loading yang bersih
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Memuat data kamar...</td></tr>';

    fetch(`${window.API_URL}/kamar`, { 
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` } 
    })
    .then(res => res.json())
    .then(resData => {
        // Ultimate Array Finder: Menangani berbagai format respon backend
        const rawData = resData.data || resData;
        dataKamarGlobal = Array.isArray(rawData) ? rawData : (rawData.data || []);
        
        renderTabelKamar(dataKamarGlobal);
    })
    .catch(err => {
        console.error("Error fetching kamar:", err);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #dc2626; padding: 20px;">Gagal memuat data. Cek koneksi server!</td></tr>';
    });
}

function renderTabelKamar(data) {
    const tbody = document.getElementById('kamarTableBody');
    tbody.innerHTML = '';

    if (!Array.isArray(data) || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: var(--n500);">Belum ada data kamar atau pencarian tidak ditemukan.</td></tr>';
        return;
    }

    data.forEach(k => {
        const tr = document.createElement('tr');
        const status = (k.status_kamar || 'tersedia').toLowerCase();
        
        let badgeClass = 'badge-kosong'; // Pastikan class ini ada di CSS-mu
        let statusText = 'TERSEDIA';

        if (status === 'terisi' || status === 'tidak tersedia') {
            badgeClass = 'badge-terisi';
            statusText = 'TERISI';
        }

        const fasilitasStr = (Array.isArray(k.fasilitas) && k.fasilitas.length > 0) 
            ? k.fasilitas.join(', ') 
            : (k.fasilitas || '-');

        tr.innerHTML = `
            <td class="font-bold">No. ${k.nomor_kamar || '-'} / Lt. ${k.lantai || '-'}</td>
            <td>Tipe ${k.tipe_kamar || '-'}</td>
            <td style="font-size: 13px; color: var(--n500); max-width: 220px; line-height: 1.4;">
                ${fasilitasStr}
            </td>
            <td style="color: var(--pink-600); font-weight: 600;">Rp ${Number(k.harga_sewa || 0).toLocaleString('id-ID')}</td>
            <td><span class="badge ${badgeClass}">${statusText}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

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

    fetch(`${window.API_URL}/kamar`, { 
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
            alert('🎉 Kamar berhasil ditambahkan!');
            closeModal();
            fetchKamar(); 
        } else {
            alert('Gagal: ' + (data.message || 'Cek kembali input Anda'));
        }
    })
    .catch(err => console.error("Error adding kamar:", err));
}