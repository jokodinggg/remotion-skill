# Remotion (+ React Three Fiber) sebagai engine video

Semua lini video (2D, 3D, editor) dibangun di atas Remotion, dan untuk 3D ditambah `@remotion/three` dengan React Three Fiber. Ada tiga alasan. Metadata sample Voynan (`Made with Remotion 4.0.539`) membuktikan stack ini sanggup mencapai kualitas target, termasuk 3D. Spike 1 juga sudah membuktikannya di mesin kita. Selain itu, skill Remotion resmi sudah terinstal.

## Considered Options

- **HyperFrames (HeyGen):** HTML + GSAP, sangat ramah agent, tanpa build step. Ditolak sebagai engine utama karena jalur 3D-nya (adapter Three.js) kurang matang dibanding R3F di Remotion, dan karena dua engine berarti dua set komponen.
- **Blender:** kualitas 3D tertinggi, tapi lambat diiterasi dari chat, tidak menyatu dengan caption/UI berbasis web, dan Voynan terbukti tidak membutuhkannya.

## Consequences

- Lisensi Remotion gratis untuk individu dan perusahaan sampai 3 orang. Kalau jasa edit tumbuh lebih dari itu, perlu Company License.
- Semua animasi harus digerakkan oleh `useCurrentFrame()`. `useFrame()` R3F dan CSS animation dilarang.
