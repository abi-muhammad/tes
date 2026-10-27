# 🏃‍♂️🏫 KEJARAN PAK WAHID! — SMA Negeri 1 Pasir Sakti (High-Realism 3D Upgrade)

> *"Nongkrong boleh, ketahuan jangan!"*

**KEJARAN PAK WAHID!** adalah game web 3D *endless runner* tiga jalur berlatar suasana nyata **SMA Negeri 1 Pasir Sakti** pada siang hari yang cerah.

Kamu berperan sebagai seorang siswa yang mengenakan **seragam batik marun bermotif putih dan emas** yang ketahuan nongkrong di koridor belakang kelas **XI A1** saat jam pelajaran oleh **Pak Wahid** (guru bertubuh sedikit berisi dengan kemeja putih polos dan kumis tegas). Berlarilah menyusuri koridor kelas terbuka, menembus area **Kantin Sekolah**, hingga melintasi **Parkiran Sepeda Motor** sambil melompati rintangan, mengumpulkan koin kantin, dan menjaga jarak agar tidak tertangkap!

---

## ✨ Fitur Utama & Peningkatan Realisme 3D

1. **Lingkungan Sekolah Autentik Tiga Zona (`SMA Negeri 1 Pasir Sakti`)**
   - **Koridor Belakang Kelas (`XI A1`, `XI A2`, `XI A3`, `RUANG BK`)**: Dinding atas hijau sekolah & dinding bawah krem dengan tekstur plester alami, kusen pintu/jendela putih, ventilasi jalusi, keset pintu, rak sepatu kayu, papan informasi, serta kolonade tiang kiri terbuka yang menghadap taman sekolah dan plang biru **SMA NEGERI 1 PASIR SAKTI**.
   - **Area Kantin Sekolah**: Paviliun kantin dengan deretan meja kayu berangka besi, bangku panjang, meja pelayanan penjual, etalase kaca aluminium berisi nampan makanan, toples minuman es teh/jeruk, piring, dan botol saus/kecap.
   - **Parkiran Sepeda Motor**: Kanopi rangka baja ringan & spandek, lantai paving block dengan marka parkir putih, serta deretan **Sepeda Motor Matic 3D Proporsional** (lengkap dengan ban karet, velg palang, lampu depan/belakang, spion, jok dua tingkat, standar samping, knalpot, dan plat nomor) di bawah naungan pepohonan tropis.
2. **Karakter Humanoid Berartikulasi Penuh & Animasi Biomekanis**
   - **Siswa Utama**: Model humanoid proporsional dengan kepala oval, telinga, mata, alis, hidung, mulut, rambut berlapis alami, **seragam batik marun motif putih-emas tajam** (PBR katun + *normal map* lipatan kain), tas ransel hitam bertali bahu, celana panjang sekolah abu-kebiruan, dan sepatu kets hitam bersol karet putih.
   - **Pak Wahid**: Siluet tubuh sedikit berisi yang mudah dikenali, **kemeja putih polos lengan pendek** lengkap dengan kerah lipat, saku, papan nama dada, sabuk kulit bergesper logam, celana kain gelap, sepatu pantofel, rambut rapi belah pinggir, dan kumis tebal ikonik.
   - **Sistem Animasi & Blending**: Artikulasi 2-sendi pada paha-lutut-pergelangan kaki dan bahu-siku-tangan dengan transisi halus (*blending*) antara berlari, melompat, kompresi mendarat (*landing squat*), meluncur rendah (*slide*), tersandung, dan tertangkap tanpa kaki menembus lantai.
3. **Sistem Material PBR & Pencahayaan Siang Hari Tropis**
   - *ACES Filmic Tone Mapping*, output `SRGBColorSpace`, dan *Procedural Daylight Environment Map* (`PMREMGenerator`) untuk pantulan lembut alami pada lantai keramik putih bernat tipis, kaca etalase, dan bodi motor.
   - *Directional Sunlight* miring dari arah halaman terbuka + *Hemisphere Bounce Light* + bayangan kontak (*Ambient Occlusion Contact Shadows*) agar seluruh karakter dan objek menempel kokoh di lantai.
4. **Sistem Grafis Adaptif 4 Preset (`Low`, `Medium`, `High`, `Ultra`)**
   - **Low**: Resolusi `1.0x`, tanpa *shadow map* dinamis (mengandalkan bayangan kontak ringan), cocok untuk HP Android RAM terbatas.
   - **Medium**: Resolusi hingga `1.35x`, bayangan `1024x1024`, refleksi lingkungan PBR aktif, LOD vegetasi seimbang.
   - **High**: Resolusi hingga `1.75x`, *Soft Shadows* `2048x2048` (`PCFSoftShadowMap`), *anisotropic filtering* `4x`, detail kantin & parkiran penuh.
   - **Ultra**: Resolusi hingga `2.0x`, *Soft Shadows* `2048x2048`, *anisotropy* maksimum perangkat untuk PC/HP *flagship*.
5. **Kontrol Lengkap & Siap GitHub Pages / PWA**
   - Kontrol **Swipe Layar Sentuh** + **Tombol Virtual Ibu Jari** + **Keyboard Desktop** (`WASD` / `Arrow Keys` / `Spasi`).
   - Seluruh skor tertinggi, total koin, pengaturan grafis, dan audio tersimpan di `localStorage`.

---

## 🛠️ Persyaratan Instalasi Lokal

- **Node.js** versi **18 LTS** atau **20 LTS** (beserta `npm`) untuk menjalankan Vite bundler secara lokal.
- *Catatan:* File `index.html` juga telah dilengkapi `<script type="importmap">` dan folder `dist/` siap pakai, sehingga dapat langsung dijalankan melalui server statis lokal (seperti ekstensi *VS Code Live Server*) bahkan jika Node.js belum terinstal.

---

## 💻 Cara Menjalankan & Membangun Proyek

```bash
cd kejaran-pak-wahid
npm install
npm run dev
```

Untuk membangun bundel produksi statis ke folder `dist/` dan mengujinya:

```bash
npm run build
npm run preview
```

---

## 🚀 Panduan Publikasi ke GitHub Pages

1. Buat repository publik baru di GitHub (misalnya `kejaran-pak-wahid`).
2. Unggah kode sumber dari folder proyek:
   ```bash
   git init
   git add .
   git commit -m "Upgrade realisme 3D SMAN 1 Pasir Sakti: koridor, kantin, parkiran & karakter PBR"
   git branch -M main
   git remote add origin https://github.com/USERNAME_ANDA/kejaran-pak-wahid.git
   git push -u origin main
   ```
3. Buka repository di GitHub → **Settings** → **Pages** → pada bagian **Build and deployment > Source**, pilih **GitHub Actions**.
4. Pantau proses build otomatis pada tab **Actions** hingga selesai (✅), lalu buka URL `https://USERNAME_ANDA.github.io/kejaran-pak-wahid/`.

---

## 📂 Struktur Proyek

```text
kejaran-pak-wahid/
├── .github/workflows/deploy.yml # CI/CD otomatis GitHub Pages
├── public/
│   ├── icons/                   # Ikon PWA 192x192 & 512x512
│   ├── manifest.webmanifest     # Manifest PWA Android
│   └── sw.js                    # Service Worker (Network-first v2.0.0)
├── src/
│   ├── game/
│   │   ├── audio.js             # Synthesizer efek suara Web Audio API
│   │   ├── corridor.js          # Arsitektur 3 zona: Koridor XI A1, Kantin & Parkiran Motor
│   │   ├── obstacles.js         # Rintangan sekolah PBR & deteksi kolisi 3 jalur
│   │   ├── player.js            # Karakter Siswa humanoid (Batik Marun) & animasi 2-sendi
│   │   ├── powerups.js          # Koin emas kantin & model 3D Power-up
│   │   ├── props.js             # Model 3D Motor Matic, Meja/Etalase Kantin & Pohon LOD
│   │   ├── teacher.js           # Karakter Pak Wahid humanoid (Kemeja Putih) & logika kejaran
│   │   ├── textures.js          # Generator tekstur PBR (Albedo, Normal, Roughness, PMREM Env)
│   │   └── ui.js                # Kontrol Swipe Android, Tombol Virtual, Keyboard & HUD FPS
│   ├── main.js                  # Pipeline pencahayaan siang hari, ACES Tone Mapping & Preset Grafis
│   └── style.css                # Antarmuka responsif Portrait/Landscape Android
├── dist/                        # Hasil bundel produksi statis siap rilis
├── index.html
├── package.json
└── vite.config.js
```
