// public\js\pemilik\transaksi.js

document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('token')) { window.location.href = '../login.html'; return; }
    fetchTransaksi();
});

function fetchTransaksi() {
    const tbody = document.getElementById('transaksiTableBody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Memuat data...</td></tr>';

    fetch(`${window.API_URL}/transaksi`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(resData => {
        tbody.innerHTML = '';
        const list = resData.data || [];

        if (list.length > 0) {
            list.forEach(t => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${new Date(t.tanggal).toLocaleDateString('id-ID')}</td>
                    <td>${t.nama_penghuni || '-'}</td>
                    <td>Kamar ${t.nomor_kamar || '-'}</td>
                    <td class="font-bold">Rp ${Number(t.jumlah).toLocaleString('id-ID')}</td>
                    <td><span class="badge badge-${t.status === 'lunas' ? 'success' : 'warning'}">${t.status.toUpperCase()}</span></td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Belum ada transaksi.</td></tr>';
        }
    })
    .catch(() => {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Gagal memuat data.</td></tr>';
    });
}
