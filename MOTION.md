# MOTION.md: aturan scene Motion Graphics jokoding

Dokumen ini dibaca Claude di dua titik:

- **Fase Naskah**, saat menulis `script.json`: baca §6 (Audio Tag) dan §7 (angka, simbol, Kata Kunci).
- **Fase Produksi**, sebelum menulis `videos/<slug>/Scenes.tsx`: baca semuanya.

Angka piksel di sini berlaku untuk kanvas 1080×1920, 60 fps. Semua frame di timeline bersifat **absolut** (frame 0 = awal video), termasuk di dalam `LineTransition`.

## 1. Kontrak `Scenes.tsx`

`videos/<slug>/Scenes.tsx` hanya merender visual. `VideoShell` (Fondasi) membungkusnya dan memasang sendiri VO, musik, Caption Kata, logo, chip Seri, dan `CtaEnd`.

- **Ekspor tepat dua hal:** `export const Scenes: React.FC` dan `export const background: "light" | "dark"`. `background` memilih varian logo: `"light"` untuk latar terang (Mint Cream, LatarBrand, PanggungIso, MejaBelajar), `"dark"` untuk latar gelap (Thunder/Layar).
- **Tanpa `<Audio>`, tanpa caption, tanpa logo** di dalam `Scenes`. Teks besar di layar (headline, angka, label) adalah elemen scene dan boleh. Kalimat VO yang ditulis ulang di layar bukan tugas scene, karena Caption Kata sudah menampilkannya.
- **SFX hanya lewat `<Sfx name="..." at={frame} />`** dari `src/fondasi/audio/Sfx`. Nama harus cocok dengan file `public/library/sfx/<name>.mp3` yang benar-benar ada. Saat ini library SFX **kosong** (`public/library/sfx/meta.json` = `[]`), jadi scene belum memakai `<Sfx>` sampai file ditambahkan.
- **Satu `LineTransition` per Baris VO.** Bungkus visual tiap baris dengan `<LineTransition lineId="NN" kind="cut" | "whip" | "scale">`. Komponen ini hanya merender selama baris itu tampil. Arketipe tidak membungkus dirinya sendiri.
- **Latar yang selalu ada.** Pasang latar full-bleed (misalnya `<Backdrop />` dari `src/archetypes/parts`) di luar semua `LineTransition`. Latar ini mengisi celah antar-baris dan `tailMs` di akhir video, tempat `CtaEnd` tampil tanpa latar sendiri. Selama tail, biarkan latar tenang tanpa elemen foreground, supaya kartu CTA (mulai y 820) terbaca.
- **Gerak mengikuti ucapan.** Setiap aksen dikunci ke kata lewat `useAtWord(lineId, kata)` atau ke Kata Kunci lewat `useKeywordFrames(lineId)` (§8). Hindari frame yang ditulis tangan.
- **Import relatif dari `videos/<slug>/`:** `../../src/...`. Jangan impor apa pun dari `spikes/`.
- **Font:** setiap teks memakai `fontFamily: poppins` dari `src/fondasi/brand/fonts`. Warna diambil dari `useBrand().palette` (`lawnGreen`, `thunder`, `mintCream`, `hijauTua`, `hijauTerang`, `layar`, `glow`, `kuning`, `merah`), netral dari `EXTRA_COLORS` di `src/library/style`.

Contoh kerangka. Kata yang dipakai `useAtWord` harus ada di `timeline.json` (§8):

```tsx
import React from "react";
import { AbsoluteFill } from "remotion";
import { Hook } from "../../src/archetypes/Hook";
import { JoksSolusi } from "../../src/archetypes/JoksSolusi";
import { Backdrop, TYPE, useContentBox, useTopClear } from "../../src/archetypes/parts";
import { useBrand } from "../../src/fondasi/brand/BrandProvider";
import { poppins } from "../../src/fondasi/brand/fonts";
import { Pop } from "../../src/fondasi/motion/Pop";
import { LineTransition } from "../../src/fondasi/motion/transitions";
import { useAtWord } from "../../src/fondasi/timeline/TimelineProvider";
import { Person } from "../../src/library/characters/Person";
import { Phone } from "../../src/library/props/Phone";

export const background: "light" | "dark" = "light";

/** Contoh elemen tulisan tangan: angka besar yang muncul tepat saat "nol" diucapkan. */
const AngkaNol: React.FC = () => {
  const box = useContentBox();
  const top = useTopClear();
  const { palette } = useBrand();
  const at = useAtWord("02", "0%");
  return (
    <div style={{ position: "absolute", left: box.x, top, width: box.w, height: box.y + box.h - top, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Pop at={at}>
        <div style={{ fontFamily: poppins, ...TYPE.headline, color: palette.thunder }}>0%</div>
      </Pop>
    </div>
  );
};

export const Scenes: React.FC = () => (
  <AbsoluteFill>
    <Backdrop />
    <LineTransition lineId="01" kind="cut">
      <Hook
        lineId="01"
        headline="Deadline besok?"
        character={<Person look={{ hair: "pendek", skin: 1, outfit: "lawnGreen" }} mood="panik" pose="duduk" width={340} />}
      />
    </LineTransition>
    <LineTransition lineId="02" kind="whip">
      <Backdrop />
      <AngkaNol />
    </LineTransition>
    <LineTransition lineId="03" kind="scale">
      <JoksSolusi lineId="03" prop={<Phone width={150} />} />
    </LineTransition>
  </AbsoluteFill>
);
```

## 2. Tata letak: content box dan zona terlarang

Zona dan kotak yang harus dihormati (nilai Brand Kit jokoding):

| Area | Koordinat | Isi |
|---|---|---|
| Zona terlarang atas | y 0–250 | UI platform |
| Zona terlarang bawah | y 1500–1920 | UI platform |
| Rail kanan | x > 960, y 900–1500 | tombol platform |
| Kotak logo | x 810–1020, y 262–382 | logo (dipasang `VideoShell`) |
| Chip Seri | kiri atas, left 60, top 262, tinggi ±65 px | hanya Seri dengan `chip` (misalnya `kalau-ai`) |
| Pita caption | y 1180–1480, x 120–960 | Caption Kata |

Aturan penempatan:

- **Foreground masuk content box.** `useContentBox()` (dari `src/archetypes/parts`) mengembalikan `{ x: 120, y: 300, w: 840, h: 850 }`, yaitu x 120–960 dan y 300–1150. Subjek, teks, karakter, dan props tinggal di dalamnya.
- **Sepertiga kanan mulai di `useTopClear()`** (y 400). Apa pun yang menjangkau area di bawah logo dimulai dari y ≥ 400. Untuk Seri dengan chip, perlakukan seluruh lebar atas dengan cara yang sama.
- **`useSafeArea()` saja tidak cukup.** Kotaknya (y 300–1350) menabrak pita caption di bawah dan kotak logo di pojok kanan atas. Pakai `useContentBox()` dan `useTopClear()`.
- **Latar full-bleed boleh menyentuh zona terlarang:** stage (`MejaBelajar`, `LatarBrand`, `PanggungIso`), warna latar, glyph yang melayang. Elemen foreground tidak.
- **Maksimal 3 fokus per frame.**
- **Entrance dari dalam box.** Slide pendek (≤ 360 px) dengan fade, supaya elemen tidak menyapu rail kanan atau zona bawah. Frame pertama sebuah baris tidak menampilkan elemen yang setengah masuk.

## 3. Tempo

- **Perubahan visual setiap ≤ 1,5 detik.** Arketipe sudah menjamin ini lewat `useFillerKick`. Elemen tulisan tangan perlu beat sendiri: pop, kick, gerak kamera, atau float.
- **Pergantian scene per Baris VO** (`LineTransition`). Variasikan `kind` antarbaris: `cut`, `whip`, `scale`.
- **Aksen di setiap Kata Kunci:** pop, kick, marker, sparks, atau wiggle tepat di frame kata itu.
- **Gerak idle** supaya tidak ada yang diam mati di antara beat: `float()`, `Camera` push pelan, Joks/Person bicara dan berkedip.

## 4. Tipografi dan warna

- **Headline:** 96–140 px, weight 800. `TYPE.headline` (120) dan `TYPE.headlineS` (96).
- **Label:** 36–44 px, weight 600. `TYPE.label` (44) dan `TYPE.labelS` (36).
- Teks di bawah 36 px tidak terbaca di HP. Kontras teks minimal Thunder di atas Mint Cream/putih, atau Mint Cream/Kuning di atas Thunder.
- **Merah `#FF6B57` hanya untuk marah atau error** (misalnya `CheckCross ok={false}`). Masalah dan aksen memakai Kuning, opsi yang direkomendasikan memakai tint Glow.
- Gaya stiker: outline Thunder, isian flat, bayangan keras `0 12px 0` Thunder (`useSticker()`), tanpa gradien kecuali glow layar.
- Tanpa logo merek pihak ketiga. WhatsApp, ChatGPT, dan sejenisnya digambarkan generik (bubble chat, `AiBadge`).

## 5. Peran Joks dan Ekspresi

- **Joks adalah teman yang menunjukkan solusi, bukan penjual.** Ia menenangkan, menunjuk, dan mengacungkan jempol. Ia tidak berteriak "beli".
- Mulut Joks bergerak hanya kalau `speaker` baris itu `"joks"`: `talk={useTalk(lineId)}`.
- Ekspresi default berasal dari Audio Tag baris (§6): `defaultExpression(tag)` di `src/fondasi/expression`. Scene boleh menimpanya kalau isi kalimat menuntut ekspresi lain, misalnya `nunjuk` saat menunjuk prop.
- Karakter manusia (`Person`) memakai mood dari kolom Person di tabel §6.

## 6. Audio Tag

Format di `spoken` dan `naskah.md`:

- **Bahasa Inggris, huruf kecil, dalam kurung siku:** `[excited]`, `[whispers]`, `[sighs]`.
- **Jeda ditulis dengan `...` atau baris baru.** `<break>` tidak dipakai.
- `tag` di `script.json` adalah tag utama baris itu. `naskah.ts` menaruhnya di depan paragraf. Tag tambahan boleh di tengah `spoken` (misalnya `"Oke... [sighs] ternyata belum."`). Tag di awal `spoken` menggantikan `tag` di `naskah.md`, jadi taruh tag utama di field `tag` saja.
- Tag tidak diucapkan dan dibuang sebelum penyelarasan. Eleven v3 bisa mengabaikan tag yang tidak cocok dengan karakter voice.

Tag yang disarankan dan Ekspresi default yang dipicunya (`src/fondasi/expression.ts`):

| Tag | Joks | Person | Dipakai untuk |
|---|---|---|---|
| `excited`, `happy` | senang | senang | solusi, kabar baik, CTA |
| `panicked`, `surprised` | kaget | panik | hook masalah, fakta mengejutkan |
| `sighs`, `sad` | sedih | sedih | keluhan, kegagalan |
| `curious`, `confused` | bingung | bingung | pertanyaan, "kok bisa?" |
| `angry`, `frustrated` | marah | panik | kesal (jarang; Merah boleh muncul) |
| `calm`, `whispers` | netral | netral | penjelasan tenang, rahasia/tips |

Tag lain tetap boleh dipakai di Naskah, tapi Ekspresi default-nya `netral`. Untuk `jempol`, `halo`, dan `nunjuk`, timpa di scene.

## 7. Angka, simbol, dan Kata Kunci (`spoken` vs `caption`)

`naskah.ts` menjalankan `checkCaption` per baris dan berhenti dengan pesan `Baris NN: token "..." tidak bisa dieja` atau `Caption baris NN tidak cocok dengan spoken`.

- **`spoken` dibaca ElevenLabs, jadi angka ditulis sebagai kata:** "nol persen", "dua koma lima", "seribu lima ratus".
- **`caption` (opsional) adalah teks tampilan** dan boleh memakai angka. Isi `caption` hanya kalau tampilannya berbeda dari `spoken`, biasanya karena ada angka. Tanpa `caption`, Caption Kata memakai `spoken` tanpa tag.
- **Bentuk ucapan `caption` harus sama persis dengan `spoken`.** Keduanya dinormalisasi (huruf kecil, tanpa tanda baca, angka dieja), lalu dibandingkan kata per kata. Jumlah dan urutan kata harus sama.
- **Angka di `caption` yang bisa dieja:**
  - bilangan bulat 0 sampai 999.999.999: `3`, `24`, `2026`;
  - ribuan dengan titik: `1.500` → "seribu lima ratus";
  - desimal dengan koma: `2,5` → "dua koma lima" (setiap digit di belakang koma dieja satu per satu);
  - persen menempel: `92%` → "sembilan puluh dua persen".
- **Token yang membuat `naskah.ts` berhenti** (di `spoken` maupun `caption`):
  - garis miring: `24/7`, `1/2`;
  - huruf dan angka menyatu: `v3`, `GPT-5`, `5G`, `H100`;
  - angka di atas 999.999.999.

  Pisahkan atau tulis sesuai ucapan: `caption` "GPT 5" dengan `spoken` "GPT lima"; "versi 3" dengan "versi tiga"; "24 jam" dengan "dua puluh empat jam".
- Tanda minus di depan angka hilang (`-5` dibaca "lima"). Tulis "minus lima".
- **Kata Kunci (`keywords`):**
  - Setiap entri adalah **satu kata** dari `caption`, atau dari `spoken` kalau `caption` kosong. Pencocokan memakai bentuk ternormalisasi (huruf kecil, hanya a-z0-9), jadi `"0%"` cocok dengan `0%?` dan `"whatsapp"` cocok dengan `WhatsApp,`.
  - Frasa dua kata tidak pernah cocok. Pilih satu kata intinya.
  - Entri yang tidak cocok tidak menghasilkan error, hanya hilang aksennya. Periksa sendiri setiap entri terhadap kata di baris itu.
  - 1–3 Kata Kunci per baris. Kata "jokoding" otomatis berwarna Hijau Terang di caption.

## 8. Timeline dan helper gerak

Baca `videos/<slug>/timeline.json` sebelum menulis scene:

- `lines[].startMs`, `durMs`: rentang Baris VO (ms absolut).
- `lines[].words[]`: `text` (kata tampilan dari `caption`/`spoken`), `startMs`, `endMs`, `keyword`, `inserted`. **Kata yang tidak terdengar di audio tidak ada di sini**, dan kata improvisasi masuk dengan `inserted: true`. Lihat `diffs`.
- `lines[].pauses[]`: jeda ≥ 350 ms, kandidat beat visual.
- `tailMs`, `cta`, `durationMs`.

Helper (frame selalu absolut):

| Helper | Asal | Kegunaan |
|---|---|---|
| `useAtWord(lineId, kata \| indeks)` | `src/fondasi/timeline/TimelineProvider` | Frame saat kata mulai. Pencocokan teks ternormalisasi, kemunculan pertama. Indeks merujuk ke `words[]`. Melempar error kalau kata tidak ada, jadi kunci hanya ke kata yang ada di `timeline.json`. |
| `useKeywordFrames(lineId)` | `src/archetypes/parts` | Frame setiap Kata Kunci di baris itu, berurutan. |
| `useLineFrames(lineId)` | `src/archetypes/parts` | `{ start, end, firstWord, lastWord }` dalam frame. |
| `useLine(id)`, `useTimeline()`, `useTalk(lineId)` | `TimelineProvider` | Data baris, seluruh timeline, bukaan mulut Joks. |
| `Pop({ at, preset?, from? })` | `src/fondasi/motion/Pop` | Entrance scale + opacity di frame `at`. Tak terlihat sebelum `at`. |
| `SceneExit({ at, kind })` | `src/fondasi/motion/SceneExit` | Keluar selama 18 frame (`EXIT_FRAMES`): `fade`, `slide-up`, `scale-down`. |
| `Camera({ keys, origin? })`, `camAt` | `src/fondasi/motion/Camera` | Push/pan dengan keyframe `{ frame, scale, x, y }`, ease-out. |
| `LineTransition({ lineId, kind })` | `src/fondasi/motion/transitions` | Bungkus satu Baris VO: `cut`, `whip` (10 frame), `scale` (12 frame). |
| `SPRINGS` | `src/fondasi/motion/springs` | Preset `snappy`, `soft`, `bouncy`. |
| `useSpringAt(at, preset?)`, `kick`, `wiggle`, `float`, `blinkAt` | `src/archetypes/parts` | Progres spring, aksen 0→1→0, goyang, melayang, kedip ber-seed. |
| `useSticker()`, `Sparks`, `Burst`, `Backdrop`, `TYPE`, `BORDER` | `src/archetypes/parts` | Gaya stiker, ledakan garis, starburst Kuning, latar LatarBrand, skala tipografi. |
| `useContentBox()`, `useTopClear()`, `useLogoBox()` | `src/archetypes/parts` | Tata letak (§2). |
| `defaultExpression(tag)` | `src/fondasi/expression` | `{ joks, person }` dari Audio Tag. |

## 9. Katalog Arketipe

Import dari `../../src/archetypes/<Nama>`. Setiap arketipe merender latarnya sendiri (LatarBrand), kecuali Masalah yang menerima stage. Semuanya mengisi content box dan sudah memenuhi aturan tempo. Pakai langsung, atau salin ke `Scenes.tsx` lalu modifikasi. Laporan akhir mencatat arketipe yang dipakai, jadi variasikan antarvideo.

| Arketipe | Props | Kapan dipakai | Ukuran slot dan perilaku |
|---|---|---|---|
| `Hook` | `{ lineId, headline, character? }` | Baris pembuka: pertanyaan/pernyataan besar. | Headline 120/800 muncul kata per kata. Marker Kuning di kata headline yang cocok dengan Kata Kunci. Kamera push dan punch di Kata Kunci pertama. `character` ±600×360 di bawah headline. Headline ≤ 3 baris. |
| `Masalah` | `{ lineId, stage, character, problem }` | Karakter tertimpa masalah. | `stage` full-bleed (paling cocok `PanggungIso`). `character` 520×680, kaki di y 1150 (pose berdiri). `problem` ±340×360 di starburst kanan atas, pop di Kata Kunci pertama, badge "!" di Kata Kunci kedua. Kurang cocok untuk MejaBelajar + bust duduk: salin dan sejajarkan ke `MEJA_BELAJAR.deskTop`. |
| `Perbandingan` | `{ lineId, left: { label, visual }, right: { label, visual }, layout?: "lr" \| "tb" }` | A vs B. | Sisi kanan/bawah adalah opsi yang direkomendasikan (tint Glow) dan masuk di Kata Kunci terakhir. Visual `lr` ±340×420, `tb` ±360×280. |
| `Angka` | `{ lineId, value, suffix?, label, countAt? }` | Statistik, persentase, hitungan. | Angka menghitung dari 0 dalam 0,7 detik mulai di kata `countAt` (default Kata Kunci pertama). Cincin terisi `value/100` kalau `suffix` `"%"`. `label` ≤ 30 karakter. |
| `Langkah` | `{ lineId, items: { title, at }[] }` | Urutan 1-2-3. | Maks 4 kartu. `title` ≤ 10 karakter (96/800 satu baris). `at` = kata pemicu (pakai Kata Kunci). |
| `JoksSolusi` | `{ lineId, prop?, expression? }` | Joks menjelaskan solusi. | Dengan `prop` (±280×280): Joks di kiri, prop pop di spotlight kanan atas pada Kata Kunci pertama. Tanpa `prop`: Joks di tengah. `expression` default dari tag. |
| `Diagram` | `{ lineId, nodes: { id, label, at }[], edges: [from, to][] }` | Alur: cara kerja AI agent, proses. | 3–5 node, label ≤ 12 karakter. Node pop di kata `at`, panah tergambar 14 frame sebelumnya. |
| `CtaEnd` | (otomatis) | Penutup Seri dengan CTA. | Dipasang `VideoShell` di `tailMs` terakhir. Scene hanya menyediakan latar. |

Semua arketipe menerima `lineId` dan membaca kata dari timeline. String di `at`/`countAt` harus kata yang ada di `timeline.json` baris itu.

## 10. Library Ilustrasi

Import dari `../../src/library/...`. Setiap prop menerima `width?` (default lebar native) dan menjaga rasio native. Tinggi = `width × h/w`.

**Karakter**

- `Joks({ expression?, pose?, talk?, blink?, width = 520, showExtras?, seed?, style? })`, `src/library/joks/Joks`. Rasio 1006:1180 (tinggi ≈ 1,17 × width). Ekspresi: netral, halo, senang, kaget, sedih, marah, bingung, jempol, nunjuk. `POSES` dan `lerpPose(a, b, t)` di `joks/poses` untuk transisi pose.
- `Person({ look, mood, pose, talk?, blink?, width = 440, seed?, style? })`, `src/library/characters/Person`.
  - `look`: `{ hair: "pendek" | "panjang" | "hijab", skin: 0–3, outfit: warna atau kunci palet ("lawnGreen"), accessory?: "kacamata" | "headset" }`.
  - `mood`: netral, panik, senang, bingung, sedih, kagum.
  - `pose` dan ukuran elemen (`personSize(pose, width)` di `characters/variants`): `duduk` 420×460 (bust, terpotong di garis meja), `berdiri` 420×760, `angkat-tangan` 440×760, `nunjuk` 540×760 (menunjuk ke kanan; cermin dengan `scaleX(-1)`).
- `Crowd({ count, seed, area: { w, h }, mood })`, `characters/Crowd`. Bust duduk ber-seed di dalam `area`.

**Props** (`src/library/props/`, rasio native w×h)

| Prop | Props khusus | Native |
|---|---|---|
| `Desk` | | 960×260 |
| `Laptop` | `side: "front" \| "back"`, `glow?` | 340×230 |
| `DeskLamp` | `on?` | 260×300 |
| `PaperStack` | | 200×180 |
| `WallClock` | `minutes` (menit sejak 00:00), `size?` | 200×200 |
| `Calendar` | `label`, `circled?` (indeks sel 0–11) | 220×240 |
| `NightWindow` | `t` (frame), `night?` | 300×330 |
| `Phone` | | 200×380 |
| `ChatBubble` | `text` (≤ 3 baris), `from: "left" \| "right"` | 480×200 |
| `CodeWindow` | `lines`, `typed?` (0–1) | 440×320 |
| `Server` | | 240×360 |
| `AiBadge` | | 240×250 |
| `GradCap` | | 300×220 |
| `Coffee` | | 220×220 |
| `Chart` | `values`, `progress?` (0–1) | 420×300 |
| `CheckCross` | `ok` (`false` = Merah) | 160×160 |

**Stage** (`src/library/stages/`, full-bleed 1080×1920, `children` di atasnya)

- `MejaBelajar({ time: "malam" | "siang" })`. `MEJA_BELAJAR = { floorY: 1180, deskTop: 1250, deskLeft: 60, deskWidth: 960 }`. Meja berada di bawah pita caption, jadi bust yang duduk di meja menutupi sebagian pita. Itu diterima untuk stage.
- `LatarBrand({ t })`: Mint Cream dengan glyph `{ }`, `</>`, `;` yang melayang. `t` = frame. `Backdrop` sudah mengisinya.
- `PanggungIso()`: lantai isometrik berpusat di (540, 1150). `PANGGUNG_ISO` mengekspor geometrinya. Pojok lantai menyentuh rail kanan; itu wajar untuk latar.

**Menambah item.** Prop atau karakter baru dibuat di folder yang tepat dengan gaya §4 (outline Thunder 10 pada skala native, isian palet, bayangan keras), ditambahkan ke `LibraryGallery`, lalu dicek lewat `npx remotion still LibraryGallery out/library/gallery.png`. Catat item baru di laporan akhir.

## 11. Contoh scene yang lolos

Belum ada. Bagian ini diisi dari video penerimaan (remake "Deadline" dan satu storytelling AI) setelah lolos QA: potongan `Scenes.tsx` per Baris VO, arketipe yang dipakai, dan alasan komposisinya berhasil.
