# VibeSpace (Spatial Canvas) 🌌

A modern spatial workspace and infinite canvas desktop application built with **React**, **Tauri v2**, **TypeScript**, and **Tailwind CSS**.

---

## ✨ Features

- 🎨 **Infinite Spatial Canvas**: Pan, zoom, and organize tasks and widgets freely in 2D space.
- 📝 **Productivity Suite**:
  - Rich Note Cards & Markdown
  - Interactive Todo Lists
  - Code Editor powered by offline Monaco Editor & Code Runner
  - Full-featured PDF Document Viewer
  - In-canvas Web Browser & search view
- 🎵 **Media & Entertainment**:
  - Vinyl-style Music Player Widget with ambient audio
  - Native Video and Audio players
  - Image gallery cards
- ⚡ **Offline First & Ultra Fast**: Lightweight Rust backend powered by Tauri v2 with automatic state persistence and crash recovery guards.
- 📦 **Zero Installation Option**: Portable executable available for instant testing.

---

## 🚀 Download & Run

### Portable Version (No Installation Required)
You can directly download and run the standalone portable executable:
- [SpatialCanvas-Portable.exe](release/SpatialCanvas-Portable.exe) (~9.6 MB)

### Installer Version
- [SpatialCanvas-Setup.exe](release/SpatialCanvas-Setup.exe) (~6.8 MB)

---

## 🛠️ Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Rust & Cargo](https://rustup.rs/) (latest stable)
- Visual Studio C++ Build Tools (on Windows)

### Installation
```bash
# Clone the repository
git clone https://github.com/5aled-jpeg/Vibespace.git

# Navigate to project directory
cd Vibespace

# Install dependencies
npm install
```

### Running in Development
```bash
npm run tauri dev
```

### Building for Production
```bash
npm run tauri build
```
Built binaries will be located in `src-tauri/target/release/`.

---

## 📄 License
MIT License.
