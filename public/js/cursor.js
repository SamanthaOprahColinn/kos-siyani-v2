document.addEventListener('DOMContentLoaded', () => {
      // 1. Suntik/Inject elemen <div> kursor ke dalam DOM secara otomatis
  const kursor = document.createElement('div');
  kursor.classList.add('kursor-kustom');
  document.body.appendChild(kursor);

  // 2. Buat kursor mengikuti koordinat pergerakan mouse secara real-time
  document.addEventListener('mousemove', (e) => {
    kursor.style.left = e.clientX + 'px';
    kursor.style.top = e.clientY + 'px';
  });

  // 3. Picu animasi meletup saat mouse diklik (Mousedown)
  document.addEventListener('mousedown', () => {
    kursor.classList.add('kursor-klik');
  });

  // Hapus class animasi setelah durasi @keyframes selesai agar bisa dipakai klik lagi
  document.addEventListener('animationend', () => {
    kursor.classList.remove('kursor-klik');
  });

  // 4. Deteksi Hover menggunakan Event Delegation (Bekerja otomatis untuk elemen dinamis/baru)
  document.addEventListener('mouseover', (e) => {
    // Jika mouse menyentuh link, tombol, input, select, atau class tombol claymorphism kamu
    if (e.target.closest('a, button, input, select, textarea, .btn-clay-primary, .btn-clay-yellow, [role="button"]')) {
      kursor.classList.add('kursor-hover');
    }
  });

  document.addEventListener('mouseout', (e) => {
    // Lepas efek hover saat mouse keluar dari area elemen tersebut
    if (e.target.closest('a, button, input, select, textarea, .btn-clay-primary, .btn-clay-yellow, [role="button"]')) {
      kursor.classList.remove('kursor-hover');
    }
  });
});