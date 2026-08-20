# Project workflow

- Install dependencies with `npm ci`.
- Run the complete local check with `npm run check`.
- Run the real-browser suite with `npm run test:e2e`; it uses Chromium desktop and Pixel 7 emulation.
- Inspect original and optimized GLB metrics with `npm run assets:inspect`.
- Regenerate optimized copies with `npm run assets:optimize`; originals remain in `models/` and are ignored by Git.
- Validate optimized assets with `npm run assets:validate`.
- Start local development with `npm run dev`.
- Production builds derive the GitHub Pages base path from `GITHUB_REPOSITORY`; the intended repository name is `gsapweb`.
- GitHub Pages deploys from `.github/workflows/deploy-pages.yml` on `main` after the repository is connected.
