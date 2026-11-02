---
name: jokoding-video
description: Video Motion Graphics jokoding lewat pipeline Remotion di repo ini, dari ide atau naskah sampai MP4. Use for `/jokoding-video <ide | naskah>`, `lanjut <slug>` setelah audio ElevenLabs ditaruh, dan `revisi <slug> <catatan>`.
argument-hint: <ide | naskah> | lanjut <slug> | revisi <slug> <catatan>
---

# /jokoding-video

Argumen: $ARGUMENTS

Bicara ke pemilik dalam bahasa Indonesia. Pakai istilah `CONTEXT.md`: Baris VO, Kata Kunci, Caption Kata, Arketipe, Naskah, Audio Tag, Fase Naskah, Fase Produksi, Seri. Semua perintah dijalankan dari root repo.

## Pilih mode

| Argumen | Mode |
|---|---|
| `lanjut <slug>` | Fase Produksi |
| `revisi <slug> <catatan>` | Revisi |
| teks lain | Fase Naskah. Teks pendek berupa topik adalah **ide**. Kalimat utuh yang siap dibacakan adalah **naskah pemilik**. Kalau ragu, tanya pemilik. |

Kalau sebuah perintah gagal karena dependensi (Chrome, whisper, cmake, sandbox), buka bagian **Setup sekali** di bawah.

## Fase Naskah: `/jokoding-video <ide | naskah>`

1. **Buat folder video.** Jalankan `npx tsx scripts/new-video.ts "<judul>"`, dengan judul pendek berbahasa Indonesia. Selesai ketika skrip mencetak slug (`yyyy-mm-dd-judul`, ditambah `-2`, `-3` kalau sudah ada) dan `videos/<slug>/script.json` berisi kerangka.
2. **Riset (hanya untuk ide).** Riset dengan web search. Untuk topik AI yang sedang ramai, verifikasi fakta, tanggal, dan nama produk ke sumber primer (pengumuman resmi, dokumentasi, paper). Tulis `videos/<slug>/research.md`: ringkasan, lalu daftar sumber dengan URL. Selesai ketika setiap klaim faktual yang akan masuk naskah punya sumber di `research.md`. Untuk naskah pemilik, lewati langkah ini.
3. **Tulis `script.json`.** Baca dulu `MOTION.md` §5–§7 (Joks, Audio Tag, angka dan Kata Kunci). Isi:
   - `slug`: biarkan sesuai keluaran langkah 1. `voice`: `null` (ikut Seri).
   - `seri`: `joki-cepat` untuk promo/hook (15–30 detik, CTA), atau `kalau-ai` untuk storytelling AI (30–60 detik, tanpa CTA; tambahkan `"cta": true` kalau perlu CTA).
   - `title`: judul tampilan. `music`: `mood`, `bpm`, dan `prompt` musik dalam bahasa Inggris, diakhiri `instrumental, no vocals`.
   - `lines`: satu objek per Baris VO, `id` dua digit berurutan (`"01"`, `"02"`, …):
     - `speaker`: `"narator"`, `"joks"` (mulut Joks bergerak), atau id karakter;
     - `tag`: Audio Tag utama, tanpa kurung siku (`"panicked"`);
     - `spoken`: teks yang dibacakan, angka dieja, tag tambahan boleh di tengah;
     - `caption`: hanya kalau tampilan beda dari `spoken`, biasanya karena angka;
     - `keywords`: 1–3 kata tunggal dari `caption` (atau `spoken`);
     - `visual`: catatan arah visual untuk Fase Produksi, sebut arketipe yang dibayangkan.
   - **Panjang:** `naskah.ts` memperkirakan 380 ms per kata plus 450 ms per celah antarbaris. Durasi video = perkiraan itu + `tailMs` (2,5 detik dengan CTA, 0,8 detik tanpa). Untuk `joki-cepat`, targetkan ±30–65 kata dalam 3–6 baris. Untuk `kalau-ai`, ±75–145 kata.
   - **Naskah pemilik:** kata-kata pemilik tidak berubah. Pecah per kalimat menjadi Baris VO, lalu tambahkan hanya Audio Tag, Kata Kunci, dan pasangan `spoken`/`caption` untuk angka (angka tulisan pemilik masuk `caption` apa adanya, `spoken` mengejanya). Setiap usulan perubahan kata dicatat untuk laporan, tidak diterapkan.

   Selesai ketika setiap baris punya semua field, `spoken` tanpa digit, dan setiap Kata Kunci sudah dicocokkan dengan satu kata di baris itu.
4. **Buat Naskah.** Jalankan `npx tsx scripts/naskah.ts <slug>`. Kalau gagal (error zod per field, `token "..." tidak bisa dieja`, atau `Caption baris NN tidak cocok dengan spoken`), perbaiki `script.json` lalu jalankan lagi. Selesai ketika skrip mencetak path `naskah.md` dan "Perkiraan durasi" + `tailMs` masuk rentang Seri. Kalau tidak masuk, sesuaikan jumlah kata (untuk naskah pemilik, cukup catat peringatannya).
5. **Serahkan ke pemilik, lalu berhenti.** Sampaikan:
   - path `videos/<slug>/naskah.md` (bagian di atas `---` siap tempel ke ElevenLabs);
   - voice dan model dari `naskah.md`;
   - prompt musik beserta durasinya, dan bahwa musik opsional (`videos/<slug>/music.mp3`);
   - nama file audio: `videos/<slug>/vo/vo.mp3` (satu file, disarankan) **atau** `vo/01.mp3` … `vo/NN.mp3` (per baris), tidak keduanya;
   - untuk naskah pemilik: daftar saran perubahan kata;
   - langkah berikutnya: `/jokoding-video lanjut <slug>` setelah audio ditaruh.

   Fase Naskah selesai di sini. Fase Produksi menunggu pemilik.

## Fase Produksi: `/jokoding-video lanjut <slug>`

1. **Salin aset brand.** Jalankan `npx tsx scripts/sync-assets.ts`.
2. **Siapkan timeline.** Jalankan `npx tsx scripts/prepare.ts <slug>`. Skrip ini mentranskrip (whisper, cache per hash audio), menyelaraskan, menormalkan audio, memasang musik, menulis `timeline.json`, membuat kerangka `Scenes.tsx` kalau belum ada, dan memperbarui `src/videos.generated.ts`. Run pertama memasang whisper dan butuh beberapa menit.
   - **Exit 1:** tampilkan keluarannya ke pemilik apa adanya, lalu berhenti:
     - diff per baris (kecocokan < 85%): pemilik memilih membetulkan naskah atau generate ulang audio;
     - nama file yang diharapkan: audio hilang, format campuran, atau nama tidak dikenal;
     - baris ambigu pada file utuh: sarankan format per baris.
   - **Exit 0:** simpan laporan yang tercetak (durasi, musik, perbedaan audio vs naskah, peringatan) untuk laporan akhir.
3. **Baca bahan scene.** Baca `MOTION.md` seluruhnya, `videos/<slug>/timeline.json`, dan field `visual` di `script.json`. Pilih satu Arketipe (atau scene tulisan tangan) per Baris VO, dan variasikan antarbaris.
4. **Tulis `videos/<slug>/Scenes.tsx`** sesuai kontrak `MOTION.md` §1. Lalu jalankan `npm run lint`. tsc ikut memeriksa `Scenes.tsx` lewat `src/videos.generated.ts`. Selesai ketika lint exit 0.
5. **Render QA still.** Jumlah halaman = `ceil(jumlah frame QA / 6)`. Hitung dari `timeline.json`:

   ```bash
   npx tsx -e 'import("./src/fondasi/qa/frames.ts").then(({ qaFrames, qaPages }) => console.log(qaPages(qaFrames(JSON.parse(require("node:fs").readFileSync(process.argv[1], "utf8")))).length))' videos/<slug>/timeline.json
   ```

   Lalu untuk setiap `n` dari 0 sampai jumlah halaman − 1:

   ```bash
   npx remotion still v-<slug>-qa out/<slug>/qa/sheet-<n>.png --props='{"page":<n>}' --frame=0
   ```

   Kalau penghitungan gagal, render halaman 0, 1, 2, … sampai sebuah halaman kosong. Kalau komposisi `v-<slug>-qa` atau `v-<slug>` tidak ditemukan, berarti `VideoShell`/`QaSheet`/registri di `src/Root.tsx` belum ada di branch ini. Laporkan ke pemilik dan berhenti. Pakai hanya ID `v-<slug>` dan `v-<slug>-qa`.
6. **Periksa dan perbaiki.** Buka setiap PNG dan periksa setiap tile terhadap checklist:
   1. elemen penting masuk zona merah;
   2. tabrakan dengan caption atau logo;
   3. Joks atau karakter terpotong tanpa sengaja;
   4. teks terlalu kecil atau kontrasnya rendah;
   5. frame kosong atau statis lebih dari 1,5 detik;
   6. ekspresi tidak cocok dengan Audio Tag.

   Satu putaran = perbaiki `Scenes.tsx`, lint, lalu render ulang halaman yang terdampak. Maksimal 3 putaran. Selesai ketika semua tile lolos. Kalau setelah putaran ke-3 masih ada pelanggaran, lanjut render dan catat setiap masalah yang tersisa beserta path still-nya.
7. **Render video.** Catat waktu mulai dan selesai:

   ```bash
   npx remotion render v-<slug> out/<slug>.mp4
   ```

   Cek durasinya dengan `ffprobe -v error -show_entries format=duration -of csv=p=0 out/<slug>.mp4`. Hasilnya harus sama dengan `timeline.durationMs` dalam selisih 1 frame.
8. **Laporan akhir** ke pemilik:
   - path MP4, durasi, dan waktu render;
   - perbedaan audio vs naskah (dari langkah 2);
   - Arketipe yang dipakai per Baris VO;
   - item library baru;
   - peringatan: durasi di luar rentang Seri, tanpa musik (sertakan prompt musik), dan masalah QA yang tersisa beserta path still.

## Revisi: `/jokoding-video revisi <slug> <catatan>`

Pilah catatan menjadi perubahan teks dan perubahan visual.

- **Perubahan teks** (ditangani lebih dulu kalau ada keduanya):
  1. Perbarui `script.json`. Aturan naskah pemilik tetap berlaku untuk kata-kata pemilik.
  2. Jalankan `npx tsx scripts/naskah.ts <slug>`.
  3. Sebutkan Baris VO yang perlu di-generate ulang (id-nya). Untuk audio satu file, pemilik men-generate ulang seluruh file, atau beralih ke per baris dengan menghapus `vo/vo.*` dan menaruh semua `NN.mp3`.
  4. Berhenti. Setelah audio baru ditaruh, pemilik menjalankan `/jokoding-video lanjut <slug>`. Transkrip lama tidak terpakai karena cache-nya berbasis hash audio.
- **Perubahan visual saja:** ubah `Scenes.tsx`, jalankan langkah 4–8 Fase Produksi (lint, QA maksimal 3 putaran, render, laporan).

## Setup sekali

Dibutuhkan di mesin baru atau saat perintah gagal karena dependensi:

- **Dependensi:** `npm install`. File `.npmrc` berisi `legacy-peer-deps=true` sebagai solusi sementara untuk crash arborist npm 10.8.2. Biarkan sampai npm diperbarui.
- **Chrome headless** (ADR 0003): `remotion.config.ts` memakai `~/Library/Caches/remotion-chrome/chrome-headless-shell-mac-arm64/chrome-headless-shell`, karena Chrome yang berada di bawah `~/Desktop` crash. Kalau file itu belum ada:

  ```bash
  node -e "require('@remotion/renderer').ensureBrowser()"
  mkdir -p ~/Library/Caches/remotion-chrome
  cp -R node_modules/.remotion/chrome-headless-shell/mac-arm64/chrome-headless-shell-mac-arm64 ~/Library/Caches/remotion-chrome/
  ```

  Ulangi setelah upgrade Remotion.
- **whisper.cpp:** `brew install cmake` sekali, lalu `npx tsx scripts/transcribe.ts --install-only`. Instalasi dan model `large-v3-turbo` masuk ke `~/Library/Caches/jokoding-whisper`. Kalau instalasi sebelumnya gagal di tengah, hapus folder itu dulu.
- **ffmpeg:** skrip memakai `/opt/homebrew/bin/ffmpeg` dan `ffprobe` (`brew install ffmpeg`).
- **Sandbox Claude Code:** `npx remotion *` harus berjalan di luar sandbox, karena sandbox memblokir Chrome. `.claude/settings.local.json` (tidak di-commit) memuat `"sandbox": { "excludedCommands": ["npx remotion *"] }` beserta izin `Bash(npx remotion *)`. Di clone baru, minta pemilik menambahkannya sendiri. Sampai itu ada, minta pemilik menjalankan perintah render dengan prefix `!`.
