# MUSIC LEGEND LIVE — THE BONTOT RADIO
**Tagline:** *ONE LIVE. ONE CHAMPION.*

Aplikasi game kuis musik interaktif TikTok LIVE untuk THE BONTOT RADIO dengan visualisasi 3D WebGL (Three.js), kontrol host manual lengkap, sistem skor transparan, session management, dan layout portrait 9:16 (1080x1920) siap OBS Studio.

---

## 🚀 Panduan Memulai Cepat

### 1. Menjalankan Aplikasi (Satu Perintah)
```bash
# Jalankan server produksi terpadu (Host Dashboard + OBS Overlay + REST API + WebSocket)
npm start
```
Aplikasi akan aktif di:
- **Host Dashboard:** [http://localhost:3000/](http://localhost:3000/)
- **OBS Browser Source:** [http://localhost:3000/overlay](http://localhost:3000/overlay)

### 2. Mode Pengembangan (Hot Reload)
```bash
npm run dev
```

### 3. Menjalankan Seluruh Pengujian (20 Pengujian Wajib)
```bash
npm test
```

### 4. Menjalankan Uji Integrasi End-to-End (E2E)
```bash
npx tsx scripts/verify_server.ts
```

---

## 📺 Pengaturan OBS Browser Source (Portrait 9:16)

1. Buka **OBS Studio**.
2. Tambahkan Source baru bertipe **Browser**.
3. Beri nama: `TBR - Music Legend Live`.
4. Masukkan URL: `http://localhost:3000/overlay`.
5. Atur resolusi:
   - **Width:** `1080`
   - **Height:** `1920`
   - **FPS:** `60` (atau `30` untuk hemat GPU)
6. Centang opsi:
   - *Shutdown source when not visible* (opsional untuk efisiensi)
   - *Refresh browser when scene becomes active*

---

## 🎮 Cara Bermain & Perintah Kuis

Penonton TikTok LIVE berpartisipasi dengan mengetik di kolom komentar:
```text
!jawab <judul lagu> <penyanyi>
```
*Contoh:*
- `!jawab separuh aku noah`
- `!jawab noah separuh aku` (urutan terbalik didukung)
- `!jawab "Separuh Aku" - Noah!` (tanda baca dinormalisasi)

### Sistem Penentuan Pemenang
- **Satu pemenang per soal:** Penonton pertama yang masuk ke server dengan jawaban benar langsung mengunci soal (*atomic winner locking*).
- **Non-AI deterministik:** Validasi dilakukan di server secara matematis berbasis Levenshtein distance dan kamus alias.
- **Toleransi typo ringan:** Kesalahan 1-2 huruf tetap diterima, sedangkan jawaban berbeda/jauh langsung ditolak.
- **Command `!play` BUKAN perintah game:** Diabaikan dan tidak diambil alih.

---

## 🏆 Sistem Skor Transparan

| Komponen | Poin |
|---|---:|
| Soal Normal | 100 VP |
| Soal Hard | 200 VP |
| Soal Expert | 300 VP |
| Soal Special Challenge | 250 VP |
| Bonus Jawaban Tercepat (First Answer) | +50 VP |
| Bonus Kemenangan Beruntun (Streak 3x) | +100 VP |
| Bonus Round (Host Triggered) | +100 VP |
| **Tap2 Point** | `FLOOR(Total Tap2 / 100)` |
| **Total Viewer Point (Total VP)** | `Quiz Point + Tap2 Point` |

### Hierarki Pemecah Seri (Tie-Breaker):
1. Total Viewer Point (Total VP) tertinggi.
2. Total Tap2 mentah tertinggi.
3. Quiz Point tertinggi.
4. Jumlah kemenangan soal terbanyak.
5. Sudden Death (opsi host).

---

## 🎛️ Kendali Host (Dashboard)

1. **START GAME:** Memulai sesi live baru dari skor 0.
2. **START ROUND:** Memulai soal berikutnya (Stage GUESSING).
3. **BONUS ROUND:** Memulai ronde bonus berhadiah poin ekstra.
4. **NEXT SOAL:** Pergantian soal manual sepenuhnya di bawah kendali host. Host bebas mengobrol tanpa terburu-buru oleh timer otomatis.
5. **REVEAL JAWABAN:** Membuka jawaban tanpa pemenang jika waktu habis.
6. **SKIP ROUND:** Melewati soal tanpa memberikan poin.
7. **PAUSE / RESUME:** Menjeda dan melanjutkan sesi live.
8. **FINAL SHOW:** Memasuki panggung juara dengan podium 3D untuk Juara 1, 2, dan 3.
9. **END SESSION & ARSIP:** Mengakhiri live dan menyimpan rekap ke database SQLite lokal.
10. **SLIDER SAFE ZONE & CHAT EXCLUSION:** Mengatur posisi dan area aman live 9:16 langsung dari dashboard tanpa edit kode.

---

## 🔊 Sistem Dua Jalur Audio

- **Jalur A (Game Backsound):** Rhythmic retro-futuristic synth ambient via Web Audio API bawaan browser (Windows default output). Host dapat play/pause dan mengatur volume. **Otomatis menjeda saat pemenang ditemukan, dan otomatis melanjutkan saat Host menekan NEXT.**
- **Jalur B (Answer Song Playback Bridge):** Disiapkan dengan interface adapter modular untuk BONTOT STUDIO playback engine (`http://127.0.0.1:8999/api/playback`). Jika offline, status dilaporkan `DISCONNECTED` secara jujur dan transparan tanpa mengganggu pemberian poin kuis.

---

## 📁 Struktur Folder Proyek

```text
C:\SOFTWARE\BONTOT MUSIC LEGEND
├── data/                           # Database SQLite (music_legend.db)
├── dist/client/                    # Hasil build frontend teroptimasi
├── scripts/
│   └── verify_server.ts            # Skrip verifikasi E2E otomatis
├── src/
│   ├── client/                     # Frontend React + Three.js
│   │   ├── audio/
│   │   │   └── SoundSystem.ts      # Web Audio API Synth & SFX
│   │   ├── components/
│   │   │   ├── dashboard/          # Host Dashboard Panels
│   │   │   │   ├── ArchiveViewer.tsx
│   │   │   │   ├── AudioControlPanel.tsx
│   │   │   │   ├── BridgeStatusPanel.tsx
│   │   │   │   ├── HostControls.tsx
│   │   │   │   ├── HostDashboard.tsx
│   │   │   │   ├── LeaderboardTable.tsx
│   │   │   │   ├── SafeZoneConfigModal.tsx
│   │   │   │   └── SimulatorPanel.tsx
│   │   │   └── overlay/            # 4 Mode Visual OBS 9:16
│   │   │       ├── OverlayView.tsx
│   │   │       ├── SafeZoneGuides.tsx
│   │   │       ├── StageChampion.tsx
│   │   │       ├── StageGuessing.tsx
│   │   │       ├── StageIdle.tsx
│   │   │       └── StageWinner.tsx
│   │   ├── three/
│   │   │   └── ThreeStageEngine.ts # Engine 3D Three.js WebGL
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   └── server/                     # Backend Node.js + Express + WebSocket
│       ├── adapters/
│       │   ├── BontotStudioPlaybackBridge.ts
│       │   ├── IPlaybackBridge.ts
│       │   ├── ITikTokConnector.ts
│       │   ├── MockPlaybackBridge.ts
│       │   ├── MockTikTokConnector.ts
│       │   └── TikTokLiveConnector.ts
│       ├── catalog/
│       │   └── questions.ts        # Katalog kuis musik Indonesia & retro
│       ├── engine/
│       │   ├── AnswerValidator.ts  # Normalisasi & Levenshtein typo tolerance
│       │   ├── GameEngine.ts       # Core state machine & coordinator
│       │   ├── PlayerIdentity.ts   # Player registry & avatar generator
│       │   ├── RoundManager.ts     # Atomic locking & round lifecycle
│       │   ├── ScoringEngine.ts    # Hitungan poin, streak, & tie-breaker
│       │   ├── SessionManager.ts   # Start, pause, resume, end session
│       │   └── Tap2Aggregator.ts   # Deduplikasi & delta like aggregator
│       ├── storage/
│       │   ├── Database.ts         # SQLite wrapper (node:sqlite bawaan Node 24)
│       │   └── SessionArchive.ts   # DAO arsip & safe zone settings
│       ├── index.ts                # Server entry point (REST + WebSocket)
│       └── types.ts                # Type definitions
├── tests/
│   └── music_legend.test.ts        # 20 Unit & Integration Tests Wajib
├── index.html                      # HTML template + typography fonts
├── package.json
├── tsconfig.json
└── vite.config.ts
```

