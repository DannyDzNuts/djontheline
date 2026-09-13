# DJ — Cook / FoodFolio

A culinary job-application portfolio built with Astro, TypeScript, and CSS. Static HTML, real dish-study URLs, local responsive photography, and small progressive motion scripts. No React or scrolling library.

## Develop

Use Node **24 LTS** (minimum 22.12).

```sh
npm install
npm run dev
npm run build
npm run preview
```

Astro serves at `http://localhost:4321`. If a restricted environment prevents Astro writing telemetry preferences, prefix commands with `ASTRO_TELEMETRY_DISABLED=1`.

## Add a dish

Create `src/content/dishes/your-dish.md`. Copy an existing entry or start with:

```yaml
---
title: Your Dish
slug: your-dish
order: 5
featured: true
signature: false
category: Grill
shortDescription: Main ingredient · accompaniment · sauce
techniques: [Grilling, Temperature control]
heroMedia:
  type: image
  src: /media/dishes/your-dish/hero.webp
  alt: Describe the actual food and presentation.
layout:
  preferred: auto
---
```

Add your photograph as described below **before building**. Every entry receives `/dishes/your-dish/`; `slug` defaults to the filename. Markdown body content appears after the study media. Lower `order` values appear first. `featured: false` keeps a study off the homepage; `study: false` removes its study route and links.

Optional fields: `season`, `date`, `notes`, `whatWorked`, `nextIteration`, `media`, and `process`. Missing fields are omitted cleanly. `media` accepts any number of image/video objects. `sample: true` adds a study-note disclaimer; `placeholder: true` on each media item marks the image as a placeholder. Remove these flags only after replacing the sample material.

`layout.preferred` accepts `auto`, `left`, `right`, `wide`, or `immersive`. Auto uses orientation/dimensions, with an alternating fallback for ordinary landscape images. Add `width`, `height`, or `orientation: portrait | landscape | square` to guide auto layout. Media retain their intrinsic ratio except the full-viewport signature/process sections, which use cover; `position: 55% 40%` adjusts their focal point. The signature is displayed first, regardless of order. Set `signature: true` on only one featured dish. If none is marked, the first featured dish opens the site. Duplicate slugs/signatures fail with actionable errors.

Extend `src/content.config.ts` to add new optional fields, then consume them in a focused component when needed.

## Images and video

```text
public/media/dishes/your-dish/
  hero.original.jpg
  detail-01.original.jpg
  carving.mp4
  carving-poster.original.jpg
```

Run `npm run media` after adding or changing originals. The script scans `*.original.jpg/jpeg/png/webp`, respects rotation, retains proportions, and generates up to 2200px WebP plus 480/800/1200/1600/2200px WebP/AVIF variants. A generated manifest supplies `srcset` and intrinsic dimensions automatically. Set `src` to the generated `/media/dishes/your-dish/hero.webp` path. Commit the generated derivatives and `src/data/media-manifest.json`; deployment does not recompress every original. Large originals can be kept outside the repository after generation to reduce repository size.

Without the script, supply your own optimized file and **accurate `width` and `height`**. Below-fold images load lazily; only the hero is eager/high priority. Fonts are bundled locally. Nothing fetches stock imagery at runtime. Placeholder credits are in `public/media/CREDITS.md`.

Example additional video:

```yaml
media:
  - type: video
    src: /media/dishes/your-dish/carving.mp4
    poster: /media/dishes/your-dish/carving-poster.webp
    alt: Carving the rested roast across the grain.
    width: 1920
    height: 1080
    caption: Rested before carving, with the juices reserved for the sauce.
    transcript: The roast rests on a board, then is sliced across the grain.
    # captions: /media/dishes/your-dish/carving.vtt
    autoplay: false
```

Use H.264 MP4 for broad browser compatibility. Posters are required, controls are always present, preload is `none`, and sources attach near the viewport. A direct file link also works without JavaScript. `autoplay: true` allows muted inline playback, with reduced motion and data-saving exceptions; avoid audio in decorative footage. Caption spoken/informative audio with a WebVTT file. Process breaks use `process: { title, description, media }`; only the first configured process break is shown on the homepage so it stays exceptional. Study pages display their own process content.

## Profile, résumé, and contact

Edit `src/data/profile.ts` for the bio, skills, email, and résumé link. Blank email shows honest placeholder text rather than a nonfunctional mail link. Add restaurant names/dates in the About component once available.

Replace `public/resume.pdf` with your final résumé and set `resumeIsDraft: false`. The included PDF is clearly labeled as a draft, with no invented employers or credentials. The navigation opens the PDF directly; visitors can use their browser's download control.

## Motion and scrolling

The page uses native desktop wheel, trackpad, keyboard, scrollbar, and touch scrolling. Wheel events are never canceled or rescaled; smooth wheel feel follows the visitor's browser/OS settings. CSS animates a 1.5-second hero zoom and title wipe; IntersectionObserver introduces each composition with a deeper media reveal, image zoom, and grouped text stagger. Process photography has its own slow zoom into place. Everything becomes still after 1.5 seconds; there are no looping decorative effects. Motion lives in `src/styles/motion.css`, and the scroll anchors remain stationary during reveals. Native cross-document view transitions are a progressive enhancement, with standard navigation as fallback. Content works without JavaScript.

On touch devices, an optional 340ms settle can run after 220ms without scrolling. It moves at most 72px / 9% of the viewport, targets media at 12% from the top, skips fast/far swipes and tall media, and cancels on any new interaction. It never changes an active touch drag or native momentum. Reduced motion disables this, entrances, transitions, and autoplay. Homepage IDs support direct `/#your-dish` links; automatic fragment rewriting is deliberately omitted to preserve explicit anchor/history behavior.

In **development only**, open `/?motionDebug=true` for the replay control. Production has no debug UI.

## GitHub Pages

1. Create a GitHub repository, add this project, and push to `main`.
2. In **Settings → Pages**, choose **GitHub Actions** as the source.
3. The included workflow builds and deploys `dist/`. Pull requests build without publishing.

The configured production address is **https://djontheline.com**, with base `/`. All internal links, résumé, fonts, and media respect the base. `SITE_URL` and `BASE_PATH` optionally override these defaults. For a repository-hosted GitHub Pages site, set those repository Actions variables to `https://YOUR-USERNAME.github.io` and `/YOUR-REPOSITORY/` (use `/` for an `OWNER.github.io` repository). For local production verification:

```sh
SITE_URL=https://YOUR-USERNAME.github.io BASE_PATH=/FoodFolio/ npm run build
BASE_PATH=/FoodFolio/ npm run preview
# Open http://localhost:4321/FoodFolio/
```

The current custom domain is already the default in `astro.config.mjs`. To change it, configure the new domain/DNS in GitHub Pages, set repository Actions variables `SITE_URL=https://your-domain.example` and `BASE_PATH=/`, and redeploy. You can also add the domain in `public/CNAME`. With the Actions publishing method, configure the domain in Pages settings as well. Never include `/public` or the repository name in dish frontmatter paths.

References: [Astro content collections](https://docs.astro.build/en/guides/content-collections/) and [Astro GitHub Pages deployment](https://docs.astro.build/en/guides/deploy/github/).

## Verify

```sh
npm run test:unit
npx playwright install chromium
npm run build
npm test
# Optional authoring/video fixtures (requires ffmpeg):
npm run test:content
```

For a repository-path build, run tests with `TEST_BASE=/FoodFolio/ TEST_URL=http://127.0.0.1:4321/FoodFolio/ BASE_PATH=/FoodFolio/ npm test`. Browser checks cover routes/assets, six widths, keyboard/anchors, reduced motion, accessibility, responsive media, scroll behavior, and no-JavaScript access. See `docs/verification.md` for the performed checks and physical-device limits.
