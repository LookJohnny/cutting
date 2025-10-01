# 石头人板材裁切方案计算器

Board Cutting Solution Calculator - A tool to optimize material cutting and minimize waste.

## Features

- 📏 Custom board dimensions
- ✂️ Multiple cutting requirements
- 📊 Visual cutting plan display
- 📉 Waste rate calculation
- 💾 History tracking (up to 20 records)

## Build for H5 (Web)

### Using HBuilderX (Recommended)

1. Open project in HBuilderX
2. Click **Run** → **Run to Browser** → **Chrome** (for testing)
3. Click **Build** → **Website - H5**
4. Build output: `unpackage/dist/build/h5/`

### Manual Build Steps

If HBuilderX is not available:

1. Install dependencies (if needed):
```bash
npm install
```

2. Build H5 version:
```bash
npm run build:h5
```

## Deploy to Web

### Option 1: Netlify (Free)

1. Build the H5 version in HBuilderX
2. Go to [netlify.com](https://netlify.com)
3. Drag & drop the `unpackage/dist/build/h5` folder
4. Done! Your app is live

### Option 2: Vercel (Free)

1. Install Vercel CLI: `npm i -g vercel`
2. Build the H5 version in HBuilderX
3. Run in terminal:
```bash
cd unpackage/dist/build/h5
vercel --prod
```

### Option 3: GitHub Pages (Free)

1. Build the H5 version in HBuilderX
2. Push the `unpackage/dist/build/h5` folder to a GitHub repo
3. Enable GitHub Pages in repo settings
4. Set source to the main branch

### Option 4: Any Static Host

Upload the contents of `unpackage/dist/build/h5/` to any static hosting service:
- Firebase Hosting
- Cloudflare Pages
- AWS S3 + CloudFront
- Your own server

## Development

- Platform: uni-app (Vue 2)
- Targets: H5, WeChat Mini Program, App
- IDE: HBuilderX

## License

MIT
