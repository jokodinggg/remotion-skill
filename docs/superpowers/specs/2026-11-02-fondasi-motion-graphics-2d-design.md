# Spec: Fondasi + Motion Graphics 2D

- **Tanggal:** 2026-11-02
- **Status:** menunggu review pemilik
- **Konteks:** `docs/brainstorm/2026-11-01-voynan-style-pipeline.md`, ADR 0001–0004, glosarium `CONTEXT.md`

## 1. Tujuan

Pipeline di Claude Code yang mengubah **ide atau naskah** menjadi **video vertikal 1080×1920 berdurasi 15–60 detik** untuk brand jokoding. Videonya bergaya motion graphics 2D setara Voynan, tapi dengan identitas jokoding: maskot Joks, palet, dan subtitle sesuai manual brand.

Isi video: storytelling teknologi/AI yang sedang ramai dan dunia joki/koding. Tidak harus jualan.

### Kriteria sukses

1. Dua video nyata selesai lewat pipeline, dengan audio ElevenLabs yang di-generate pemilik:
   - remake "Deadline" (15–30 detik);
   - satu storytelling AI (30–60 detik).
2. Kedua video lolos QA still tanpa pelanggaran safe area, tabrakan elemen, atau teks yang tidak terbaca.
3. Pemilik menilai keduanya layak diunggah.
4. Untuk video kedua dan seterusnya, satu-satunya pekerjaan manual pemilik adalah men-generate audio di ElevenLabs (dan musik, kalau mau).

### Di luar scope

- Lini Video Editor dan Motion 3D (sub-proyek berikutnya).
- Brand Kit klien. Strukturnya disiapkan, tapi hanya ada satu Brand Kit, yaitu jokoding.
- Integrasi API ElevenLabs. Pemilik men-generate audio sendiri.
- Auto-posting ke media sosial.
- Pengecekan bounding box otomatis (lihat §8).

## 2. Keputusan yang sudah diambil

| Topik | Keputusan |
|---|---|
| Engine | Remotion 4.0.539 + React (ADR 0001). R3F tidak dipakai di sub-proyek ini. |
| Input | Ide (Claude riset dan menulis naskah) atau naskah pemilik (kata-katanya dipertahankan). |
| Voiceover | ElevenLabs, di-generate manual oleh pemilik dari `naskah.md` yang ditulis Claude. Naskah memakai audio tag. |
| Voice | Bisa berbeda per Seri. Satu video boleh menimpa voice Seri-nya. |
| Musik/SFX | Gabungan: file dari pemilik (Eleven Music) dan library lokal. |
| Durasi | 15–30 detik (promo/hook) atau 30–60 detik (storytelling), ditentukan per Seri. |
| Review | Sekali jalan. Tidak ada checkpoint manusia di fase produksi. Claude wajib menjalankan QA sendiri sebelum menyerahkan hasil. |
| Klien | Hanya jokoding. Ada abstraksi `BrandKit` supaya klien bisa ditambah nanti. |
| Arsitektur | Hybrid. Fondasi mengunci bagian mekanis. Claude menulis visual tiap scene dengan bahan dari library dan arketipe. |
| Ilustrasi | Komponen SVG gaya stiker. Joks memakai rig vektor (ADR 0004). |
| Caption | Selalu memakai gaya subtitle manual brand (kecil, huruf kecil, pill Thunder). Teks besar di layar adalah elemen scene, bukan caption. |

## 3. Alur kerja

Pipeline punya dua fase dengan serah-terima manual di antaranya.

```
Fase Naskah                  Serah-terima              Fase Produksi
/jokoding-video <input>  →   pemilik generate audio →  /jokoding-video lanjut <slug>
riset, script.json,          di ElevenLabs, taruh      transcribe, align, timeline,
naskah.md (audio tag),       file di videos/<slug>/    Scenes.tsx, QA still, render,
prompt musik                                           laporan
```

### 3.1 Fase Naskah: `/jokoding-video <ide | naskah>`

1. `scripts/new-video.mjs` membuat `videos/<yyyy-mm-dd-slug>/`.
2. **Kalau input berupa ide:**
   - Claude riset dengan web search.
   - Untuk topik AI yang sedang ramai, fakta, tanggal, dan nama produk diverifikasi ke sumber primer bila memungkinkan.
   - Ringkasan dan daftar sumber ditulis ke `research.md`.
3. **Kalau input berupa naskah pemilik:** kata-kata pemilik tidak diubah. Claude hanya:
   - memecahnya per Baris VO;
   - menambahkan audio tag;
   - menandai Kata Kunci.

   Usulan perubahan kata ditulis sebagai saran terpisah di laporan, tidak diterapkan langsung.
4. Claude memilih Seri, lalu menulis `script.json` (§4.1) dan `naskah.md` (§4.2).
5. Claude berhenti dan memberi tahu pemilik:
   - nama file audio yang diharapkan;
   - voice ElevenLabs yang dipakai Seri tersebut;
   - prompt musik.

### 3.2 Serah-terima

Pemilik men-generate audio di ElevenLabs dan menaruh hasilnya di `videos/<slug>/vo/` dalam salah satu dari dua bentuk:

- **satu file utuh** (`vo.mp3` / `vo.wav`). Ini direkomendasikan karena prosodinya paling natural;
- **per baris** (`01.mp3`, `02.mp3`, …), mengikuti nomor Baris VO.

Musik bersifat opsional. Kalau ada, ditaruh di `videos/<slug>/music.mp3`. Kalau tidak ada, musik dipilih dari library.

### 3.3 Fase Produksi: `/jokoding-video lanjut <slug>`

1. **Transkripsi.** `scripts/transcribe.mjs` memakai whisper.cpp lewat `@remotion/install-whisper-cpp`:
   - model `large-v3-turbo`;
   - bahasa Indonesia;
   - menghasilkan timestamp per token/kata ke `videos/<slug>/transcript.json`.
2. **Penyelarasan.** `scripts/align.mjs` (logika murni ada di `src/fondasi/timeline/`):
   - Menyelaraskan kata hasil transkrip dengan kata di naskah. Audio tag dibuang, lalu teks dinormalisasi: huruf kecil, tanpa tanda baca, angka dieja.
   - Untuk file utuh: memotong menjadi Baris VO berdasarkan kecocokan teks dan jeda.
   - Untuk file per baris: offset tiap file dijumlahkan dengan celah antar-baris (default 0,45 detik).
   - Hasil per Baris VO: `start`, `dur`, kata beserta `startMs`/`endMs`, indeks Kata Kunci, dan jeda panjang (≥ 350 ms) sebagai kandidat beat visual.
   - **Caption mengikuti audio, bukan naskah.** Kata yang hilang atau hasil improvisasi dicatat di laporan perbedaan.
3. **Normalisasi audio.** ffmpeg `loudnorm` ke −16 LUFS. Hasilnya disimpan ke `public/videos/<slug>/vo/`.
4. **Musik.** Kalau `music.mp3` ada, dipakai. Kalau tidak, dipilih dari `public/library/music/` berdasarkan mood dan BPM di `script.json`. Musik disalin ke `public/videos/<slug>/music.mp3`.
5. Hasilnya `timeline.json` (§4.3).
6. **Scene.** Claude membaca `MOTION.md`, `timeline.json`, dan katalog arketipe, lalu menulis `videos/<slug>/Scenes.tsx`.
7. **QA still** (§8), maksimal 3 putaran perbaikan.
8. **Render.** `scripts/render.mjs` menghasilkan `out/<slug>.mp4`.
9. **Laporan akhir**, berisi:
   - path MP4, durasi, dan waktu render;
   - perbedaan audio vs naskah;
   - item library baru;
   - peringatan, misalnya durasi di luar rentang Seri.

### 3.4 Revisi: `/jokoding-video revisi <slug> <catatan>`

- **Perubahan visual saja:** ubah `Scenes.tsx`, jalankan QA lagi, lalu render ulang.
- **Perubahan teks:** Claude memperbarui `script.json` dan `naskah.md`, lalu menyebut Baris VO mana yang perlu di-generate ulang. Untuk audio satu file, pemilik men-generate ulang seluruh file atau beralih ke format per baris.

## 4. Format data

### 4.1 `videos/<slug>/script.json`

Sumber kebenaran isi video. Ditulis Claude di Fase Naskah.

```json
{
  "slug": "2026-11-05-deadline",
  "seri": "joki-cepat",
  "voice": null,
  "title": "Deadline besok, progres 0%?",
  "music": { "mood": "tense-to-upbeat", "bpm": 110, "prompt": "tense minimal electronic ... instrumental, no vocals" },
  "lines": [
    {
      "id": "01",
      "speaker": "narator",
      "tag": "panicked",
      "spoken": "Deadline besok... progres masih nol persen?",
      "caption": "deadline besok, progres masih 0%?",
      "keywords": ["deadline", "0%"],
      "visual": "Mahasiswa panik di meja belajar malam, jam 23:52, kartu progres 0%."
    }
  ]
}
```

- `voice: null` berarti voice mengikuti Seri.
- `speaker` berisi `"narator"`, `"joks"`, atau id karakter. Mulut Joks bergerak hanya kalau nilainya `"joks"`.
- `tag` adalah audio tag utama baris itu. Nilai ini juga menentukan ekspresi default (§6.4).
- `spoken` adalah teks yang dibaca ElevenLabs. Angka dieja.
- `caption` opsional. Isinya teks tampilan kalau berbeda dari `spoken`. Kata Kunci merujuk ke kata di `caption`, atau di `spoken` kalau `caption` kosong.
- `visual` adalah catatan arah visual dari Claude untuk dirinya sendiri di Fase Produksi.

Skema divalidasi dengan zod di `src/fondasi/schema.ts`. Skrip gagal dengan pesan jelas kalau skema tidak valid.

### 4.2 `videos/<slug>/naskah.md`

File siap tempel ke ElevenLabs. Satu Baris VO per paragraf, diawali audio tag.

```
[panicked] Deadline besok... progres masih nol persen?

[calm] Tenang. Konsultasi dulu ke jokoding.

[excited] Chat aja lewat WhatsApp, link di bio!
```

Di bawah naskah ada:

- voice Seri;
- model yang disarankan (Eleven v3, atau versi lebih baru kalau sudah tersedia di akun pemilik);
- prompt musik lengkap dengan durasi (= perkiraan durasi video + 2 detik);
- daftar nama file yang diharapkan.

Eleven v3 mendukung bahasa Indonesia dan audio tag berhuruf kecil dalam kurung siku, seperti `[whispers]`, `[sighs]`, dan `[excited]`. Tag yang tidak cocok dengan karakter voice bisa diabaikan. Jeda ditulis dengan `...` atau baris baru, tidak dengan `<break>`. Daftar tag yang disarankan ada di `MOTION.md`.

### 4.3 `videos/<slug>/timeline.json` (dihasilkan otomatis, tidak diedit manual)

```json
{
  "fps": 60,
  "durationMs": 11540,
  "tailMs": 1800,
  "lines": [
    {
      "id": "01",
      "startMs": 0,
      "durMs": 3062,
      "audio": "videos/2026-11-05-deadline/vo/01.mp3",
      "words": [{ "text": "deadline", "startMs": 120, "endMs": 560, "keyword": true }],
      "pauses": [{ "atMs": 1400, "durMs": 420 }]
    }
  ],
  "music": { "src": "videos/2026-11-05-deadline/music.mp3", "loop": false },
  "diffs": [{ "line": "02", "expected": "konsultasi", "heard": "konsul" }]
}
```

- Kalau audio berupa satu file, `audio` dipotong di level komposisi lewat `trimBefore`/`trimAfter`. File tidak dipotong secara fisik.
- `durationMs` = akhir baris terakhir + `tailMs`. Nilai `tailMs` berasal dari Seri dan memberi ruang untuk CTA.

### 4.4 Brand Kit dan Seri

- `src/fondasi/brand/types.ts` mendefinisikan tipe `BrandKit`. Isinya:
  - palet;
  - font;
  - logo (path dan posisi);
  - daftar voice (nama dan voice ID ElevenLabs);
  - gaya caption;
  - konten CTA;
  - safe area.
- `brand/jokoding/brand.ts` mengisi tipe tersebut dengan nilai dari manual brand:
  - Lawn Green `#44AA00`, Thunder `#322F30`, Mint Cream `#F9FDF7`, Hijau Tua `#2E7A00`, Hijau Terang `#7BDB2E`, Layar `#262324`, Glow `#B9FF7A`, Kuning `#FFD400`, Merah `#FF6B57`;
  - font Poppins.
- `brand/jokoding/seri.ts` mendefinisikan daftar Seri. Field per Seri:
  - `id`, `chip` (opsional), `voice`;
  - `musicMood` default;
  - `durationRange`;
  - `cta` (boolean);
  - `tailMs`.
- Seri awal, dengan nama yang bisa diubah pemilik:
  - `joki-cepat`: promo/hook, 15–30 detik, CTA;
  - `kalau-ai`: storytelling AI, 30–60 detik, CTA opsional.

## 5. Struktur repo

```
claude-motion-graphic/
├─ CONTEXT.md
├─ MOTION.md
├─ remotion.config.ts            angle + setBrowserExecutable (ADR 0003)
├─ package.json
├─ .claude/skills/jokoding-video/SKILL.md
├─ brand/jokoding/
│  ├─ brand.ts
│  ├─ seri.ts
│  └─ assets/                    PNG Joks resmi, logo, manual PDF (di-commit)
├─ src/
│  ├─ Root.tsx                   mendaftarkan videos/* dan komposisi QA
│  ├─ fondasi/
│  │  ├─ schema.ts               zod untuk script.json dan timeline.json
│  │  ├─ timeline/               align, pemecahan baris, builder (logika murni + test)
│  │  ├─ audio/                  VoTrack, MusicBed (ducking), Sfx
│  │  ├─ caption/                Subtitle (Caption Kata gaya brand), pemecahan potongan
│  │  ├─ brand/                  types.ts, BrandProvider/useBrand, Logo, SeriChip
│  │  ├─ layout/                 useSafeArea, QaOverlay
│  │  ├─ motion/                 atWord, atKeyword, Pop, SceneExit, Camera, transisi, preset spring
│  │  └─ VideoShell.tsx          membungkus Scenes dengan audio, caption, dan brand overlay
│  ├─ library/
│  │  ├─ joks/                   rig Joks, POSES, lerpPose, JoksCompare
│  │  ├─ characters/             Person, Crowd
│  │  ├─ props/
│  │  ├─ stages/
│  │  └─ LibraryGallery.tsx
│  └─ archetypes/                Hook, Masalah, Perbandingan, Angka, Langkah, JoksSolusi, Diagram, CtaEnd + ArchetypeGallery
├─ videos/<slug>/                script.json, naskah.md, research.md, transcript.json, timeline.json, Scenes.tsx, vo/ (gitignored), music.mp3 (gitignored)
├─ public/
│  ├─ brand/jokoding/            disalin dari brand/jokoding/assets oleh scripts/sync-assets.mjs (gitignored)
│  ├─ videos/<slug>/             audio ternormalisasi (gitignored)
│  └─ library/music|sfx/         library audio + meta.json (mood, BPM, prompt, sumber, lisensi)
├─ scripts/                      new-video, transcribe, align, sync-assets, qa-stills, render
└─ out/                          <slug>.mp4 dan <slug>/qa/*.png (gitignored)
```

- `Root.tsx` mendaftarkan setiap folder `videos/*` yang punya `timeline.json` sebagai satu `Composition`. Pendaftaran memakai `calculateMetadata` yang membaca `timeline.json`, jadi durasi tidak pernah di-hardcode.
- `VideoShell` adalah batas Fondasi. `Scenes.tsx` hanya merender visual dan tidak boleh memuat `<Audio>`, caption, atau logo.
- Library audio di `public/library/` tidak di-commit kalau ukurannya besar. `meta.json` selalu di-commit.
- Kode spike di `spikes/` tidak diimpor. Rig Joks dan kit brand-style ditulis ulang di `src/library/` dengan spike sebagai referensi.

## 6. Komponen

### 6.1 Audio (`src/fondasi/audio/`)

- **VoTrack:** satu `<Audio>` per Baris VO, diposisikan di `startMs`. Untuk file utuh, dipotong lewat trim.
- **MusicBed:** musik dengan ducking. Volume dasar −14 dB relatif terhadap VO. Saat ada ucapan, volume turun ke sekitar −24 dB, dengan attack 120 ms dan release 400 ms. Kurva volume dihitung dari `timeline.lines` sebagai fungsi murni.
  - Musik lebih pendek dari video: di-loop dengan crossfade 1 detik.
  - Musik lebih panjang: dipotong, dengan fade out 1,2 detik.
- **Sfx:** whoosh dan pop dari `public/library/sfx/`, dipicu dari scene lewat helper (`<Sfx name="whoosh" at={...} />`). Ini satu-satunya audio yang boleh dipasang scene.

### 6.2 Caption Kata (`src/fondasi/caption/`)

- Pill Thunder dengan opacity 0,94, radius 18, padding 16/28.
- Poppins 600, sekitar 46 px, huruf kecil semua.
- Warna teks:
  - Kuning `#FFD400` untuk kata biasa;
  - "jokoding" Hijau Terang;
  - **Kata Kunci** Glow `#B9FF7A` dengan scale 1,0→1,08 saat diucapkan.
- Kata yang belum diucapkan tampil dengan opacity 0,45 dan naik ke 1 tepat di `startMs`.
- Maksimal 2 baris. Pemecahan potongan dilakukan per sekitar 6 kata, dengan prioritas di jeda bicara. Potongan berganti dengan fade 80 ms.
- Posisi tengah, lebar maksimal 840 px (x 120–960). Tepi bawah pill di y ≤ 1480.

### 6.3 Brand overlay

- Logo `logo-color.png` di kanan atas (right 60, top 262, lebar 210). Logo tampil sejak frame 0, tanpa animasi, efek, transparansi, rotasi, atau perubahan warna. Pada latar gelap dipakai `logo-light.png`. `Scenes.tsx` mengekspor konstanta `background: "light" | "dark"` (default `"light"`), lalu `VideoShell` memilih varian logo dari nilai itu.
- Chip Seri opsional di kiri atas (left 60, top 262).
- `CtaEnd` dipasang oleh `VideoShell` di `tailMs` terakhir kalau Seri memakai CTA. Isinya: WhatsApp (link di bio), jokoding.id, dan "Apa pilihanmu?".

### 6.4 Library Ilustrasi (`src/library/`)

**Aturan gaya:**

- Outline Thunder: 10 untuk props pada skala 1, 14 untuk Joks pada kanvas native.
- Isian flat dari palet Brand Kit dan netral.
- Satu goresan kilau per volume.
- Tanpa gradien, kecuali glow layar.
- Bayangan hanya offset keras Thunder `0 12px 0`.

**Joks:**

- Rig vektor 9 Ekspresi: netral, halo, senang, kaget, sedih, marah, bingung, jempol, nunjuk.
- Props: `expression`, `pose`, `talk`, `blink`, `width`, `showExtras`. Ada juga `lerpPose` untuk transisi antar-pose.
- `talk` diturunkan dari timeline lewat `useTalk(lineId)`: mulut terbuka di dalam rentang kata dan tertutup di jeda.
- Kedip otomatis dengan seed.
- `JoksCompare` wajib dirender ulang dan dicek setiap kali bentuk Joks berubah (ADR 0004).

**Person:**

- Rambut: pendek, panjang, hijab.
- Warna kulit (4), warna baju (dari palet).
- Aksesori: kacamata, headset.
- Mood: netral, panik, senang, bingung, sedih, kagum.
- Pose: duduk, berdiri, nunjuk, angkat tangan.
- Bisa bicara dan berkedip.

**Crowd:** grid atau kelompok Person mini dengan variasi acak ber-seed.

**Props awal:** meja, laptop (depan/belakang), lampu meja, tumpukan kertas, jam dinding, kalender, jendela malam, HP, bubble chat, jendela kode, server, ikon AI/robot generik, toga, kopi, grafik, centang/silang. Tanpa logo merek pihak ketiga.

**Stage awal:** Meja Belajar (malam/siang), Latar Brand (Mint Cream + glyph), Panggung Iso (lantai isometrik).

**Pertumbuhan:** prop atau karakter baru yang dibutuhkan sebuah video dibuat sesuai aturan gaya di folder yang tepat, lalu ditambahkan ke `LibraryGallery`.

**Pemetaan audio tag ke ekspresi default** (bisa ditimpa di scene):

| Tag | Joks | Person |
|---|---|---|
| `excited`, `happy` | senang / jempol | senang |
| `panicked`, `surprised` | kaget | panik |
| `sighs`, `sad` | sedih | sedih |
| `curious`, `confused` | bingung | bingung |
| `angry`, `frustrated` | marah | panik |
| `calm`, `whispers` | netral / halo | netral |

### 6.5 Arketipe (`src/archetypes/`)

Setiap arketipe adalah komponen dengan slot dan props, dan menjadi titik awal scene. Claude boleh memakainya langsung atau menyalin lalu memodifikasinya di `Scenes.tsx`.

1. **Hook:** pertanyaan/pernyataan besar + reaksi karakter + push kamera.
2. **Masalah:** karakter di stage + prop masalah.
3. **Perbandingan:** A vs B, terbagi kiri-kanan atau atas-bawah.
4. **Angka:** angka besar yang menghitung, atau bar progres.
5. **Langkah:** kartu 1-2-3 yang muncul tepat di Kata Kunci.
6. **JoksSolusi:** Joks masuk dan menjelaskan dengan prop.
7. **Diagram:** alur node dan panah, misalnya cara kerja AI agent.
8. **CtaEnd:** dipasang otomatis oleh `VideoShell` (§6.3).

`ArchetypeGallery` merender setiap arketipe dengan data contoh sebagai still QA.

### 6.6 Helper gerak (`src/fondasi/motion/`)

- `atWord(lineId, text | index)` / `atKeyword(lineId, i)` mengembalikan frame saat kata diucapkan.
- `Pop`, `SceneExit`, `<Camera>` dengan keyframe push/pan, dan transisi antar Baris VO (cut, whip, scale).
- Preset `spring`: `snappy`, `soft`, `bouncy`.

### 6.7 `MOTION.md`

Aturan yang dibaca Claude sebelum menulis scene:

- **Tempo:** ada perubahan visual setiap ≤ 1,5 detik, pergantian scene per Baris VO, dan aksen di setiap Kata Kunci.
- **Komposisi:** subjek di x 120–960, y 300–1350, maksimal 3 fokus per frame.
- **Tipografi:** headline 96–140 px (800), label 36–44 px (600).
- **Warna:** Merah hanya untuk marah atau error.
- **Peran Joks:** teman yang menunjukkan solusi, bukan penjual.
- Daftar audio tag yang disarankan dan pemetaannya ke ekspresi (§6.4).
- Contoh scene yang baik dari video yang sudah lolos.

## 7. Penanganan error

| Kondisi | Perilaku |
|---|---|
| `script.json` tidak valid | Skrip berhenti dan menampilkan error zod per field. |
| Audio tidak ditemukan di `vo/` | Berhenti. Tampilkan nama file yang diharapkan. |
| Format audio campuran (file utuh + per baris) | Berhenti dan minta salah satu. |
| Kecocokan transkrip dengan naskah < 85% kata (total, atau di satu baris) | Berhenti. Tampilkan diff per baris. Pemilik memilih antara membetulkan naskah atau generate ulang. |
| Batas Baris VO tidak bisa ditentukan (file utuh) | Berhenti. Sebutkan baris yang ambigu dan sarankan format per baris. |
| Durasi di luar rentang Seri | Peringatan di laporan, tidak memblokir. |
| whisper.cpp atau model belum terpasang | Instal otomatis di run pertama, ke `~/Library/Caches/` agar tidak berada di bawah `~/Desktop`. |
| Musik tidak ada dan library kosong untuk mood itu | Render tanpa musik dan beri peringatan, sertakan prompt musik. |
| Render gagal karena Chrome | Konfigurasi ADR 0003 sudah terpasang. Kalau tetap gagal, laporkan error asli. |
| QA masih gagal setelah 3 putaran | Tetap render, lalu laporkan masalah yang tersisa secara eksplisit beserta still-nya. |

## 8. QA dan pengujian

### 8.1 QA still (setiap video)

- `scripts/qa-stills.mjs` merender still di titik-titik berikut dengan prop `qaOverlay: true`:
  - awal setiap Baris VO + 300 ms;
  - setiap Kata Kunci;
  - pertengahan setiap baris;
  - frame CTA.

  Still disusun menjadi contact sheet `out/<slug>/qa/sheet.png`.
- `QaOverlay` menggambar:
  - zona terlarang berwarna merah transparan: atas 250 px, bawah 420 px, rail kanan x > 960 di y 900–1500;
  - garis kotak caption dan logo.
- Claude memeriksa contact sheet secara visual, dengan checklist:
  1. Elemen penting masuk zona merah.
  2. Tabrakan dengan caption atau logo.
  3. Joks atau karakter terpotong tanpa sengaja.
  4. Teks terlalu kecil atau kontrasnya rendah.
  5. Frame kosong atau statis lebih dari 1,5 detik.
  6. Ekspresi tidak cocok dengan tag.

### 8.2 Unit test (vitest, TDD)

Semua logika murni di `src/fondasi/` diuji:

- `align`, dengan fixture: angka yang dieja vs angka tulis, kata hilang, improvisasi, satu file vs per baris, dan transkrip dengan kesalahan ejaan kecil;
- pemecahan Baris VO dan deteksi jeda;
- builder timeline, termasuk `tailMs` dan celah antar-baris;
- pemecahan potongan caption;
- pemetaan tag ke ekspresi;
- kurva ducking;
- validasi skema.

### 8.3 QA visual library

- Still `JoksCompare`, `LibraryGallery`, dan `ArchetypeGallery` dirender ulang setiap kali komponen terkait berubah.
- `tsc --noEmit` dan eslint bersih.

### 8.4 Penerimaan

Dua video end-to-end, sesuai kriteria sukses §1.

## 9. Risiko

| Risiko | Mitigasi |
|---|---|
| Whisper salah mendengar istilah teknis ("Hermes Agent", "API") | Align memakai pencocokan fuzzy terhadap naskah. Teks caption diambil dari naskah kalau kata cocok secara fuzzy, dan dari transkrip kalau tidak cocok sama sekali. |
| Pemotongan file utuh salah di baris pendek | Batas baris ditentukan dari kecocokan teks, jeda hanya sebagai pemecah seri. Format per baris tersedia sebagai cadangan. |
| Scene buatan Claude monoton antar video | Arketipe hanya titik awal. `MOTION.md` mengumpulkan contoh baru. Laporan mencatat arketipe yang dipakai supaya variasi bisa dipantau. |
| Gaya ilustrasi baru melenceng dari Joks | Aturan gaya di §6.4, `LibraryGallery` sebagai pembanding, dan QA visual. |
| Lisensi musik | Hanya musik dari paket ElevenLabs berbayar milik pemilik atau sumber berlisensi jelas. `meta.json` mencatat sumber dan lisensinya. |
