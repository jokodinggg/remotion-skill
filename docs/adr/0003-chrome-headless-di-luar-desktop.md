# Chrome headless Remotion dijalankan dari luar ~/Desktop

Project ini berada di `~/Desktop`, folder yang dilindungi privasi macOS. Chrome headless bawaan Remotion yang terunduh ke `node_modules/.remotion/` crash saat mulai: `icu_util.cc: Check failed` → `GPU process isn't usable` → `Emulation.setDeviceMetricsOverride: Session closed`. Crash ini terjadi juga saat dijalankan di luar sandbox Claude. Karena itu `remotion.config.ts` diarahkan ke salinan browser di `~/Library/Caches/remotion-chrome/` lewat `Config.setBrowserExecutable(...)`. Jangan hapus baris ini dengan anggapan "tidak perlu", karena render akan rusak lagi.

## Consequences

- Setelah upgrade Remotion, salin ulang browser yang baru diunduh ke `~/Library/Caches/remotion-chrome/`.
- Sandbox Bash Claude Code tetap memblokir Chrome. Agar Claude bisa render sendiri, user perlu menambahkan `sandbox.excludedCommands: ["npx remotion *"]` di settings. Tanpa itu, render dijalankan user dengan prefix `!`.
