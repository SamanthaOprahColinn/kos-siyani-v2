// public/js/dynamic-layout.js

(function() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = '../login.html'; 
        return;
    } 

    fetch('http://localhost:5000/api/auth/me', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(resData => {
        if (resData.success && resData.data) {
            const role = resData.data.role; // 'pemilik', 'admin', atau 'penghuni'
            
            const layoutScript = document.createElement('script');
            layoutScript.src = `../js/layout-${role}.js`;
            
            layoutScript.onload = () => {
                document.dispatchEvent(new Event('DOMContentLoaded'));
            };
            
            document.body.appendChild(layoutScript);
            
        } else {
            localStorage.removeItem('token');
            window.location.href = '../login.html';
        }
    })
    .catch(err => {
        console.error("Gagal memuat layout:", err);
    });
})();