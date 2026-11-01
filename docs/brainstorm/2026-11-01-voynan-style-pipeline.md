# Brainstorm: Pipeline Video ala Voynan untuk jokoding

- **Tanggal:** 2026-11-01
- **Status:** Brainstorming selesai, Spike 1 selesai. Mini spike ilustrasi masih menunggu keputusan.
- **Jalur proses:** Architectural (proyek baru). Spec Fondasi belum ditulis.
- **Keputusan terkait:** [ADR-0001](../adr/0001-remotion-sebagai-engine-video.md), [ADR-0002](../adr/0002-bangun-sendiri-bukan-beli-voynan.md), [ADR-0003](../adr/0003-chrome-headless-di-luar-desktop.md)

## 1. Tujuan

**Kata user:**
- Membuat konten video untuk **jokoding**, brand joki koding milik user.
- Ke depan kemungkinan dijadikan **jasa edit konten** untuk klien.
- Dibangun sendiri, tidak membeli paket Voynan, karena tech stack dan resource-nya sudah diketahui.
- Waktu dan token tidak dibatasi. Prioritasnya kualitas.
- Tema konten: dunia joki/koding dan storytelling teknologi AI yang sedang ramai (misalnya Hermes Agent). Tidak harus jualan jasa.

**Asumsi (belum dikoreksi user):**
- Platform: TikTok, Reels, dan Shorts. Format 9:16, 1080×1920, 60fps, bahasa Indonesia.
- Sistemnya harus bisa dipakai ulang: brand dan gaya bisa diganti per klien, bukan kode sekali pakai per video.
- Kriteria berhasil: hasil setara sample Voynan, dan bisa dibuat dari chat (script/ide → MP4).

## 2. Referensi: analisis Voynan

Sumber: https://voynanlandingpage.pages.dev/. Ke-28 MP4 sample sudah diunduh dan dicek frame per frame.

- **Temuan kunci:** metadata MP4 berisi `comment=Made with Remotion 4.0.539`. Tag ini ada di lini Motion Graphics **dan** Motion 3D. Kesimpulannya, 3D-nya dibuat dengan Remotion + Three.js, bukan Blender.
- Lini Video Editor tidak punya tag. Kemungkinan di-encode ulang.
- Ketiga lini produk Voynan:

| Lini | Contoh gaya | Teknik yang terlihat |
|---|---|---|
| Motion Graphics | Peluang Sukses, Stalking, Rating | Explainer 2D/2.5D flat, kartu UI, ring persen, pulau isometrik, kerumunan karakter kecil, caption per kata sinkron VO, branding seri |
| Motion 3D | Voxelverse, Worldforge Roma, Innerworks, Timeforge, Paperworld | Dunia low-poly prosedural, soft shadow, bloom, DOF, kamera dolly, callout berlabel |
| Video Editor | Impact, Depth, Lumen, Poster, dan lain-lain | Talking head + caption besar + overlay UI + B-roll + zoom |

- **Pola bersama:** 9:16, 60fps, voiceover dengan caption per kata (kata kunci diberi warna aksen), musik + SFX.

## 3. Evaluasi skill/tool yang dikumpulkan user

| Sumber | Inti | Dipakai untuk |
|---|---|---|
| [remotion-dev/remotion](https://github.com/remotion-dev/remotion) | Engine React → MP4. Stack yang dipakai Voynan. Skill `remotion-*` sudah terinstal. | **Engine utama** |
| [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) | HTML + GSAP → MP4, sangat ramah agent, Apache-2.0 | Alternatif. Tidak dipilih (lihat ADR-0001) |
| [charlie947/motion-graphics-skills](https://github.com/charlie947/motion-graphics-skills) | Paket proses: brand-intake → `MOTION.md`, daftar default yang dilarang, brief | Diambil **aturan prosesnya** |
| [buildwithhanif/claude-animation-skill](https://github.com/buildwithhanif/claude-animation-skill) | Animasi gaya hand-drawn dengan node-canvas | Diambil **disiplinnya**: "beats before code", "look at pixels every pass" |
| [Kimeur motion-3d](https://www.skillsdirectory.com/skills/kimeur-motion-3d) | Teks 3D looping dengan WebGL2 buatan sendiri | Tidak relevan, cakupannya terlalu sempit |

## 4. Pemecahan sub-proyek

Urutan disetujui user: **0 → 1 → 2 → 3**.

0. **Fondasi:** project Remotion, render 9:16 60fps, voiceover, caption per kata (whisper), musik/SFX, brand kit jokoding, library ilustrasi.
1. **Motion Graphics 2D/2.5D:** explainer gaya "simulasi".
2. **Video Editor:** talking head. Ditunda karena user belum punya footage.
3. **Motion 3D:** dunia R3F. Paling berat.

Sebelum membangun dengan benar, user memilih **eksplorasi dulu lewat spike per lini**.

## 5. Spike 1: hasil

- **Pertanyaan:** apakah Remotion (+ R3F) yang dijalankan dari Claude Code sanggup menghasilkan video setara Voynan?
- **Kode:** `spikes/remotion-spike/` (throwaway, tidak dilanjutkan).
- **Topik:** Hermes Agent (Nous Research). Faktanya dari repo GitHub resmi; 259K star per 2026-11-01.

| Output | Isi | Spesifikasi |
|---|---|---|
| `out/Agent2D.mp4` | 7 scene simulasi: "joki yang nggak pernah tidur" → Hermes Agent → memori + skill baru → Telegram/server → pilihan PAKAI/TERGANTIKAN | 38 detik, 1080×1920, 60fps, audio |
| `out/Agent3D.mp4` | Diorama ala Innerworks "Inside an AI Agent": inti LLM, tools, memori, rak skill, ring loop | 27 detik, sama. Render ±2 menit di M2 dengan N8AO + bloom |

**Jawaban spike: bisa.** Gaya 2D, sinkron VO per kata, dan diorama 3D berkualitas sudah tercapai.

**Pipeline yang terbukti jalan:**
1. Script per kalimat diubah ke voiceover dengan `say -v Damayanti`, lalu dinormalisasi ffmpeg (loudnorm −16 LUFS).
2. Timestamp per kata dari `@remotion/whisper-webgpu` model `large-v3-turbo`, bahasa indonesian. Ke-13 klip berhasil disejajarkan. Teks script dipakai sebagai acuan, whisper hanya untuk timing.
3. Durasi scene = durasi VO + jeda 0,45 detik. Animasi diberi kunci ke timestamp kata.
4. 3D: kamera dibuat sebagai fungsi murni `camAt(frame)`. Fungsi yang sama dipakai untuk memproyeksikan callout HTML ke titik 3D.

**Kekurangan yang menjadi isi Fondasi:**
1. **Suara.** TTS Damayanti robotik. Ini jarak terbesar ke Voynan. Perlu ElevenLabs atau rekaman suara user.
2. **Musik latar** belum ada, baru SFX.
3. **Caption di atas 3D yang terang kurang kontras.** Perlu pill gelap di belakang teks.
4. **Callout 3D bisa keluar layar.** Perlu dijepit ke safe area.
5. **Ilustrasi 2D kecil dan sederhana.** Lihat bagian 6.
6. Bug: buku skill di 3D melayang, belum masuk rak (anchor tidak memperhitungkan rotasi rak).
7. Claude belum bisa render sendiri karena terblokir sandbox. Lihat ADR-0003.

## 6. Keputusan terbuka: ilustrasi 2D

**Masalah:** objek mengisi sekitar 40% lebar frame, detailnya minim, dan karakter digambar ulang per video.

**Dua akar masalah:**
- **Komposisi.** Solusinya aturan di `MOTION.md`: satu objek utama 60–80% lebar frame, tiga lapis kedalaman, kamera push-in terus, detail ambient yang padat, dan QA contact sheet di setiap iterasi.
- **Library aset.** Opsinya:

| Opsi | Ringkas | Catatan |
|---|---|---|
| **A. Komponen SVG/React parametrik buatan Claude** | `<Person>`, props, stage isometrik, `<Crowd seed>`. Style spec ketat: 3 tone per material, tanpa outline, rim light | **Rekomendasi.** Bebas lisensi, bisa dianimasikan per bagian, tumbuh jadi aset bisnis. Butuh investasi awal |
| B. Library SVG open-source | Icon Phosphor/Lucide lewat Iconify (MIT). Karakter Open Peeps/unDraw | Dipakai untuk icon saja. Karakter jadi gayanya tidak menyatu dan lisensinya perlu dicek untuk klien |
| C. Didesain di Figma, lalu dikonversi ke komponen | Ilustrator atau user menggambar, plugin Figma membaca file | Paling premium. Jalur upgrade nanti tanpa mengubah cara pakai komponen A |
| D. Gambar AI lalu di-vector-kan | Detail kaya | Tidak disarankan untuk karakter: tidak konsisten, sulit dianimasikan |

**Usulan berikutnya (belum disetujui):** mini spike untuk opsi A. Isinya 1 karakter parametrik (3 ekspresi, 2 pose) + 4 props + 1 stage isometrik → 1 adegan ala "Peluang Sukses" yang memenuhi frame, dibandingkan berdampingan dengan frame Voynan.

**Keputusan (2026-11-01):** opsi A. Joks dibuat ulang sebagai rig vektor. Lihat [ADR-0004](../adr/0004-library-ilustrasi-svg-dan-rig-joks.md).

## 7. Brand jokoding (dari `assets/Jokoding-Graphic-Standard-Manual.pdf`)

- **Palet:** Lawn Green `#44AA00`, Thunder `#322F30`, Mint Cream `#F9FDF7`. Pendukung: Hijau Tua `#2E7A00`, Hijau Terang `#7BDB2E`, Layar `#262324`, Glow `#B9FF7A`, Kuning `#FFD400`, Merah `#FF6B57` (khusus ekspresi marah).
- **Font:** Poppins. 700 untuk hook, 600 untuk subjudul, 500 untuk label, 400 untuk teks isi.
- **Maskot Joks:** 9 ekspresi (netral, halo, senang, kaget, sedih, marah, bingung, jempol, nunjuk). Ekspresi hanya berubah di layar wajah dan gerak tangan. Joks berperan sebagai teman yang menunjukkan solusi, bukan penjual.
- **Reels 9:16:**
  - Area kosong 250 px di atas dan 420 px di bawah. Hindari kolom kanan (x > 960, y 900–1500).
  - Logo kecil di kanan atas, tepat di bawah UI Instagram.
  - Subtitle kecil, kuning, huruf kecil, di atas pill Thunder. Kata "jokoding" berwarna hijau.
  - CTA ke WhatsApp (link di bio) dan jokoding.id. Video ditutup dengan "Apa pilihanmu?".
- **Konflik yang perlu diputuskan di spec:** subtitle brand yang kecil berbeda dengan Caption Kata besar ala Voynan. Untuk konten jokoding, aturan brand menang. Untuk klien lain, gaya caption mengikuti Brand Kit masing-masing.

## 8. Mini spike ilustrasi: hasil

**Kode:** `spikes/remotion-spike/src/joks/` (throwaway).

- **`JoksCompare`:** rig vektor vs PNG resmi untuk ke-9 ekspresi. Hasilnya hampir identik, setelah 1 iterasi koreksi arah miring dan posisi tangan. Rig mendukung kedip, mulut bicara (`talk`), interpolasi pose antar ekspresi (`lerpPose`), serta dekorasi (bintang, !, ?, air mata, uap).
- **Kit gaya brand:** `Person` (chibi dengan mood panik/senang/netral), meja, laptop, lampu, tumpukan kertas, jam dinding, kalender, dan jendela malam. Semuanya dengan outline Thunder dan palet resmi.
- **`out/Deadline.mp4`:** adegan 11,5 detik "deadline besok, progres 0%?" → Joks muncul kaget → halo "konsultasi dulu ke jokoding" → nunjuk ke CTA WhatsApp → jempol. Progres naik ke 100%, subtitle mengikuti gaya brand, logo di kanan atas. Render 16 detik di M2, dijalankan sendiri oleh Claude setelah `sandbox.excludedCommands` aktif.
- **Pelajaran komposisi:** iterasi pertama terlalu kecil (objek ±40% frame). Setelah kamera di-scale 1,16–1,26, Joks diperbesar ke 520 px, dan objek yang menumpuk dipindah, frame terasa penuh. Ini mengonfirmasi bahwa aturan komposisi di `MOTION.md` dan QA contact sheet wajib ada.
- **Sisa kekurangan:**
  - Karakter manusia baru 1 varian. Butuh variasi rambut, kulit, outfit, dan pose.
  - Belum ada stage isometrik maupun `<Crowd>`.
  - Garis lantai dan meja belum rapi saat kamera bergerak.
  - Suara masih TTS robotik.

## 9. Langkah berikutnya

1. Menulis **spec Fondasi + Motion Graphics 2D** di `docs/superpowers/specs/`, lalu menyusun implementation plan. Rig Joks dan kit gaya brand dari mini spike menjadi titik awal desain library, tapi kodenya ditulis ulang dengan rapi.
2. Keputusan suara (ElevenLabs atau rekaman user) dan sumber musik bebas royalti.
