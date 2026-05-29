document.getElementById('formAdmin').addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    const payload = {
        nama_lengkap: document.getElementById('nama').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        role: 'admin'
    };

    try {
        const response = await fetch(`${window.API_URL || 'http://localhost:5000/api'}/auth/register`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        if (response.ok) {
            alert('Admin baru berhasil didaftarkan!');
            document.getElementById('formAdmin').reset();
        } else {
            alert('Gagal: ' + result.message);
        }
    } catch (err) {
        alert('Server error.');
    }
});