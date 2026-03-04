<div align="center">
  <h1>🎵 LemonWave</h1>
  <p><strong>Sound preview and code generation tool for Terraria Mobile modding (TL Pro).</strong></p>
  <p>
    <img src="https://img.shields.io/badge/React-19-61dafb?logo=react" alt="React 19"/>
    <img src="https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript" alt="TypeScript"/>
  </p>
</div>

---

## What It Does

LemonWave lets you browse every built-in Terraria `SoundID`, preview it in the browser with custom pitch and volume, and copy a ready-to-use TModLoader snippet — without launching the game.

```csharp
Terraria.ID.SoundID.DD2_BetsyDeath.WithPitchVariance(0.25).WithVolume(1.20);
```

---

## Features

- **300+ sounds** across `Item`, `NPC`, `DD2`, `Liquids`, `Menu`, and `Misc` categories
- **Pitch & volume controls** with sliders and precise number inputs
- **Real-time audio visualizer** powered by the Web Audio API
- **Preset library** — save, rename, and reload configurations; persisted in `localStorage`
- **One-click copy** of the generated C# snippet
- **Favorites** and **search/filter** for quick navigation
- **Light / Dark theme** with persistent preference
- Fully **responsive** with a collapsible sidebar for mobile

---

## Getting Started

```bash
git clone https://github.com/JonataOliveiraa/LemonWave
cd lemon-wave
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Place `.wav` files in `public/sounds/` following the naming in `constants.ts`. Missing files fall back to a synthesized beep so the UI stays functional.

---

## License

Distributed under the **LemonWave Non-Commercial License (NCL)** — free to use and modify, commercial sale not permitted. See [LICENSE](./LICENSE).

Part of the [LemonWave](https://github.com/JonataOliveiraa/-LemonWave) ecosystem by Lemon Studio.
