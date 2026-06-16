# Galactic Chronology — Star Wars Interactive 3D Timeline

A dark-themed, WebGL-powered 3D timeline of the Star Wars galaxy. Films, series, games, novels, and deep lore events plotted along BBY/ABY (Before/After Battle of Yavin).

## Features

- **3D WebGL rendering** via Three.js with bloom post-processing
- **40+ curated events** spanning 25,000 BBY to 35 ABY
- **Deep lore panels** with connected events, canon/legends tags, and era context
- **Interactive controls** — orbit, zoom, click nodes, search archives
- **Fly-through mode** — auto-tour the timeline (press Space or ▶ Fly)
- **Type filters** — films, series, games, lore, comics, books
- **Keyboard shortcuts** — ←/→ navigate, Space fly, Esc reset

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build

```bash
npm run build
npm run preview
```

## Tech Stack

- [Vite](https://vitejs.dev/) — dev server & bundler
- [Three.js](https://threejs.org/) — WebGL 3D scene, orbit controls, bloom
- TypeScript — type-safe timeline data & scene logic

## Timeline Scale

Ancient history (25,000+ BBY) uses logarithmic compression so the "modern" era (-1000 BBY → 35 ABY) is explorable in detail. Year 0 ABY marks the Battle of Yavin — the galactic calendar reference point.
