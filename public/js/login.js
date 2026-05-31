// public/js/login.js

document.addEventListener('DOMContentLoaded', () => {
  fetchPublicStats();
});

function fetchPublicStats() {
  const elKamar = document.getElementById('statLoginKamar');
  const elPenghuni = document.getElementById('statLoginPenghuni');

  let totalKamar = 0;
  let aktifPenghuni = 0;

  Promise.all([
    fetch('http://localhost:5000/api/public/stats/kamar').then(r => r.json()),
    fetch('http://localhost:5000/api/public/stats/penghuni').then(r => r.json())
  ])
  .then(([kamarData, penghuniData]) => {
    if (kamarData.success && kamarData.data) {
      totalKamar = kamarData.data.total ?? 0;
    }
    if (penghuniData.success && penghuniData.data) {
      aktifPenghuni = penghuniData.data.aktif ?? 0;
    }
    elPenghuni.textContent = aktifPenghuni;
    elKamar.textContent = Math.max(0, totalKamar - aktifPenghuni);
  })
  .catch(() => {
    elKamar.textContent = '-';
    elPenghuni.textContent = '-';
  });
}

function setRole(r){
  document.getElementById('roleOwner').classList.toggle('active', r === 'owner');
  document.getElementById('rolePenghuni').classList.toggle('active', r === 'penghuni');
  document.getElementById('emailInput').placeholder = (r === 'owner') ? 'nama@email.com' : 'penghuni@email.com';
}

function togglePw(){
  const inp = document.getElementById('pwInput');
  const ico = document.getElementById('pwIcon');
  if(inp.type === 'password'){
    inp.type = 'text';
    ico.className = 'ph ph-eye-slash';
  } else {
    inp.type = 'password';
    ico.className = 'ph ph-eye';
  }
}

function handleLogin(){
  const email = document.getElementById('emailInput').value.trim();
  const pw = document.getElementById('pwInput').value;
  const box = document.getElementById('errorBox');
  const msg = document.getElementById('errorMsg');
  
  box.classList.remove('show');
  
  if(!email){
    msg.textContent = 'Email tidak boleh kosong.';
    box.classList.add('show');
    return;
  }
  
  if(!pw){
    msg.textContent = 'Password tidak boleh kosong.';
    box.classList.add('show');
    return;
  }
  
  const btn = document.getElementById('loginBtn');
  btn.innerHTML = '<div style="width:18px;height:18px;border:2.5px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;"></div> Memproses...';
  btn.style.pointerEvents = 'none';

  // Request ke API Backend
  fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email: email, password: pw })
  })
  .then(response => response.json())
  .then(data => {
    btn.innerHTML = '<i class="ph ph-sign-in"></i> Masuk Sekarang';
    btn.style.pointerEvents = '';

    if(data.success) {
      localStorage.setItem('token', data.data.token);
      
      const userRole = data.data.user.role;
      if (userRole === 'pemilik') {
        window.location.href = 'pemilik/dashboard.html';
      } else if (userRole === 'admin') {
        window.location.href = 'admin/dashboard.html';
      } else if (userRole === 'penghuni') {
        window.location.href = 'penghuni/dashboard.html';
      } else {
        alert('Akses tidak diizinkan untuk role ini.');
      }
    } else {
      msg.textContent = data.message || 'Email atau password salah.';
      box.classList.add('show');
    }
  })
  .catch(error => {
    btn.innerHTML = '<i class="ph ph-sign-in"></i> Masuk Sekarang';
    btn.style.pointerEvents = '';
    msg.textContent = 'Terjadi kesalahan koneksi ke server.';
    box.classList.add('show');
    console.error('Error:', error);
  });
}