# Photo Master AI 📸

> Cinematic AI Portrait Enhancement powered by Claude

A professional web app for AI-driven portrait analysis, enhancement planning, and creative direction. Upload a photo, select a style, and receive a full cinematic enhancement report with Midjourney prompts, creative variations, viral optimization, and quality scores.

---

## Features

- **6 Style Presets** — Auto AI, Cinematic, Fitness, Fashion, Viral, Fantasy
- **Photo Analysis** — Lighting, composition, mood, skin texture, facial features
- **Enhancement Plan** — Eyes, skin, jawline, lighting, color grading
- **Midjourney / DALL-E Prompts** — Ready-to-paste, hyper-detailed prompts
- **3 Creative Variations** — Alternative styles with individual prompts
- **Viral Optimization** — Captions, hashtags, platform strategy
- **Quality Scores** — Original vs enhanced, 5-axis scoring
- **Export** — Copy full report or download as .txt
- **API Key Persistence** — Saved in localStorage

---

## Quick Start

### Prerequisites
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

### Install & Run

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
# → http://localhost:3000

# Build for production
npm run build
npm run preview
```

---

## Usage

1. Open the app in your browser
2. Enter your Anthropic API key in the top banner (`sk-ant-api03-...`)
3. Upload a portrait photo (JPG, PNG, WEBP)
4. Select an enhancement preset
5. Toggle optional sections (Prompt, Variations, Viral, Scores)
6. Click **Enhance & Analyze**
7. Copy prompts, hashtags, or the full report

---

## Deployment

### Vercel
```bash
npm i -g vercel
vercel
```

### Netlify
```bash
npm run build
# Upload /dist folder to Netlify
```

### Any Static Host
```bash
npm run build
# Deploy the /dist folder
```

> **Note:** The app makes direct calls to the Anthropic API from the browser using your API key. For production use, consider proxying API calls through a backend to keep your key secure.

---

## Tech Stack

- **React 18** + **Vite**
- **Anthropic Claude** (claude-opus-4-5)
- **DM Mono** + **Cormorant Garamond** (Google Fonts)
- Pure CSS — no UI framework dependencies

---

## Project Structure

```
photo-master-ai/
├── index.html
├── vite.config.js
├── package.json
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx        # React entry
    ├── App.jsx         # Main app + all components
    ├── index.css       # Full design system
    ├── constants.js    # Styles, prompts, config
    ├── api.js          # Claude API service
    └── parser.js       # Report parsing utilities
```

---

## License

MIT — built with ♦ by Photo Master AI
