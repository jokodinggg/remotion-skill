# Library ilustrasi berupa komponen SVG, dengan Joks dibuat ulang sebagai rig vektor

Ilustrasi 2D dibangun sebagai komponen React/SVG parametrik yang ditulis sendiri (opsi A di log brainstorming). Gayanya diturunkan dari maskot Joks: outline Thunder, isian flat, dan satu kilau per volume. Gaya Voynan yang tanpa outline tidak dipakai. Joks sendiri dibuat ulang sebagai rig vektor per bagian (kepala, visor, mata, mulut, tangan, badan), supaya bisa berkedip, bicara, dan berganti pose. Brand manual sebenarnya menulis "jangan menggambar ulang maskot". Pemilik brand jokoding tetap menyetujui pembuatan ulang ini pada 2026-11-01, karena tidak ada file sumber vektor (Figma/SVG) dan animasi per bagian tidak mungkin dibuat dari PNG.

## Considered Options

- **PNG resmi apa adanya:** patuh manual, tapi animasinya hanya tukar pose, bob, dan squash. Tidak bisa kedip, bicara, atau menggerakkan tangan.
- **Desain di Figma oleh ilustrator:** belum ada desainer. Tetap terbuka sebagai upgrade nanti tanpa mengubah cara pakai komponen.
- **Library open-source / gambar AI:** gayanya tidak menyatu dengan Joks.

## Consequences

- Rig Joks wajib dicek berdampingan dengan PNG resmi (komposisi `JoksCompare`) setiap kali bentuknya diubah. Warna dan proporsi mengikuti manual halaman 06/08.
- PNG resmi di `brand/jokoding/assets/joks/` tetap menjadi acuan kebenaran untuk bentuk Joks.
