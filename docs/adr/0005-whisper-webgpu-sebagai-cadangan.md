# whisper.cpp sebagai jalur utama, whisper-webgpu sebagai cadangan otomatis

Transkripsi VO (`scripts/lib/whisper.ts`) memakai whisper.cpp 1.7.4 (`large-v3-turbo`, bahasa `id`) lewat `@remotion/install-whisper-cpp`. Instalasinya meng-clone repo whisper.cpp lalu mengompilnya dengan `cmake`. Di mesin owner `cmake` tidak terpasang, sehingga build gagal (`make: cmake: No such file or directory`).

## Keputusan

`transcribeAudio(file)` memakai whisper.cpp hanya jika binary `whisper-cli` dan file model `ggml-large-v3-turbo.bin` ada di `~/Library/Caches/jokoding-whisper`. Jika tidak, fungsi yang sama otomatis memakai `@remotion/whisper-webgpu` (model `large-v3-turbo`, bahasa `indonesian`), dengan audio di-decode oleh mediabunny menjadi mono f32 pada `WHISPER_WEBGPU_SAMPLE_RATE`. Signature dan hasil (`HeardWord[]`) tidak berubah.

`ensureWhisper()` / `--install-only`: bila `cmake` tidak ada, build whisper.cpp tidak dicoba. Skrip mencetak `cmake tidak ditemukan — memakai whisper-webgpu. Untuk whisper.cpp: brew install cmake`, menghapus clone setengah jadi di cache (hanya jika tidak ada binary di dalamnya), lalu mengunduh model webgpu. Build yang gagal karena sebab lain diperlakukan sama.

## Consequences

- whisper.cpp tetap lebih disukai: berjalan sebagai proses native, tidak bergantung pada WebGPU, dan hasilnya stabil. Untuk memakainya: `brew install cmake`, hapus `~/Library/Caches/jokoding-whisper`, jalankan `npx tsx scripts/transcribe.ts --install-only`.
- whisper-webgpu butuh dukungan WebGPU di lingkungan Node (dicek lewat `canUseWhisperWebGpu()`); jika tidak ada, transkripsi berhenti dengan pesan jelas. Unduhan model ada di cache terpisah (`@huggingface/transformers`).
- Dua mesin bisa memberi kata dan timestamp yang sedikit berbeda. Penyelarasan ke naskah (`alignTokens`, `MIN_MATCH`) menyerap perbedaan ejaan, tetapi cache transkrip sebaiknya tidak dicampur antar mesin.
- Dependency tambahan (versi sama dengan spike): `@remotion/whisper-webgpu@4.0.539`, `@huggingface/transformers@4.2.0`, `mediabunny@1.62.0`, `@mediabunny/server@1.62.0`.
