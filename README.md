# DJ — Chef / FoodFolio

A single-page chef portfolio built with Astro, TypeScript, and CSS. The page moves from a signature dish through selected work and occasional process moments to experience, a short introduction, and contact. A charcoal background, warm off-white text, and restrained sage accents support the photography. Spacing and typography carry the presentation; small scripts add motion and photo enlargement.

The production address is **https://djontheline.com**, with base **`/`**. The site includes the homepage and a custom 404 page.

## Develop

Use Node **24 LTS** (minimum 22.12).

```sh
npm install
npm run dev
npm run check
npm run build
npm run preview
```

Astro serves at `http://localhost:4321`. In restricted environments, prefix commands with `ASTRO_TELEMETRY_DISABLED=1` to disable telemetry preference writes.

## Page and content structure

- `src/pages/index.astro` assembles the portfolio.
- `src/components/SignatureHero.astro`, `DishSection.astro`, and `DishMedia.astro` present dishes and their media.
- `ProcessBreak.astro` supplies occasional image or video interludes.
- `ExperienceSection.astro`, `AboutSection.astro`, and `ContactSection.astro` finish the page.
- `src/data/profile.ts` contains identity, experience descriptions, biography, and contact details.
- `src/content/dishes/*.md` contains the dish frontmatter, validated by `src/content.config.ts`.
- `src/lib/dishes.ts` selects the signature, orders work, chooses layouts, and spaces process moments.
- `src/styles/tokens.css` contains the palette, fonts, spacing, and easing tokens; `global.css` contains presentation; `motion.css` owns reveal effects.

The header links to `#work`, `#experience`, `#about`, and `#contact`. Dish slugs are individual homepage anchors, such as `/#prime-rib`. Use frontmatter for dish content; Markdown bodies are not rendered. There are no separate dish or About pages.

## Add a dish

Create `src/content/dishes/your-dish.md`:

```yaml
---
title: Your Dish
slug: your-dish
order: 5
featured: true
signature: false
category: Grill
year: 2026
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

Add the media before building. Lower `order` values appear first. The optional `slug` defaults to the filename and must be unique. Avoid page section IDs (`work`, `experience`, `about`, `contact`, `main`, and `top`). `featured: false` removes a dish from the homepage.

Mark at most one featured dish `signature: true`; it opens the site regardless of order. If none is marked, the first featured dish becomes the signature. Duplicate slugs, multiple signatures, and an unfeatured signature fail validation.

Optional fields are `season`, integer `year`, `media`, and `process`. Titles, concise descriptions, and techniques are shown directly on the homepage. Keep descriptions grounded in the actual dish. Set `placeholder: true` on each image or video that is temporary; the site labels temporary photography openly. Remove the flag after replacing the photograph. Photography credits are in `public/media/CREDITS.md`.

`layout.preferred` accepts `auto`, `left`, `right`, `wide`, or `immersive`. Auto uses media proportions and alternates ordinary landscape compositions. Optional `width`, `height`, and `orientation: portrait | landscape | square` guide layout. Media keep their intrinsic ratio except full-height signature/process images, which use cover. `position: 55% 40%` adjusts the focal point.

## Additional photographs and lightbox

Selected dishes can include a `media` array. It appears alongside the dish as a small editorial arrangement on the homepage. The signature displays only its hero media so the opening flows directly into Selected Work:

```yaml
media:
  - type: image
    src: /media/dishes/your-dish/detail-01.webp
    alt: A close view of the browned crust and sliced interior.
    caption: Rested, then sliced across the grain.
```

Photographs are normal links to their image files. JavaScript progressively enhances anchors marked `data-lightbox` into a simple photo dialog; `data-alt` supplies the full image's alternative text. The hero and full-height process photograph use unobtrusive **Enlarge photo** links so text and navigation remain easy to use. Escape and the close control return to the page. Without JavaScript, the same links open the actual image file. Video stays in a native video player.

## Prepare images

```text
public/media/dishes/your-dish/
  hero.original.jpg
  detail-01.original.jpg
  carving.mp4
  carving-poster.original.jpg
```

Run `npm run media` after adding or changing originals. The script scans `*.original.jpg/jpeg/png/webp`, respects rotation, retains proportions, and generates up to 2200px WebP plus 480/800/1200/1600/2200px WebP/AVIF variants. `src/data/media-manifest.json` supplies responsive sources and intrinsic dimensions. Reference the generated `/media/dishes/your-dish/hero.webp` path in frontmatter.

Commit generated derivatives and the manifest; deployment does not recompress originals. Large originals can be kept outside the repository after generation. If you prepare images yourself, supply optimized files and accurate `width` and `height`. Below-fold photographs load lazily; only the signature is eager/high priority. Fonts are bundled locally. Nothing fetches stock imagery at runtime.

## Video and process moments

Use video in `heroMedia`, the `media` array, or a process moment:

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

Use H.264 MP4 for broad compatibility. Posters are required, controls stay available, preload is `none`, and sources attach near the viewport. Direct video file links work without JavaScript. `autoplay: true` permits muted inline playback subject to reduced-motion and data-saving preferences. Caption spoken or informative audio with a WebVTT file.

Add optional process frontmatter to a featured dish:

```yaml
process:
  title: The work before the plate.
  description: Heat, timing, and a careful rest before carving.
  media:
    type: image
    src: /media/dishes/your-dish/detail-01.webp
    alt: The roast resting on a board before carving.
```

The same `media` schema accepts a video here, including its required poster. Up to three configured process moments are selected in dish order. Short portfolios show fewer: placement allows a moment after every second selected composition (or the only dish in a shorter portfolio), then spreads the selected moments across those available positions. A portfolio with only the signature can show one process moment. Each receives a unique `process-{dish-slug}` anchor. The included still placeholder remains a still photograph until real footage is available.

## Profile and contact

Edit `src/data/profile.ts` to set the name, Chef role, biography, and practical kitchen experience. Experience is organized around actual station work; add employers or dates only when accurate details are available.

The contact address is configured centrally in `src/data/profile.ts`. Set `email` to your address and keep `emailIsPlaceholder: false` for a real address. The contact section uses a normal `mailto:` link. It has no form or external service configuration.

## Motion and scrolling

A small requestAnimationFrame controller smooths confidently identified mouse-wheel detents while preserving their total distance. Line-mode detents and repeated identical 80–160px steps qualify; uncertain, fractional, horizontal, or continuous input remains native. Trackpads, scrollbar dragging, keyboard navigation, and active touch dragging retain native behavior. Reveal effects progressively enhance visible content; media, headlines, and supporting copy use short, staged entrances. The reveal controller and CSS share stable hooks: `.hero-media`, `.hero-copy`, `.dish-visual`, `.media-frame`, `.dish-copy`, and `[data-reveal]`. The `data-snap-anchor` wrapper remains stationary while its contents animate.

`src/scripts/scroll-motion.ts` controls entrances, `mobile-settle.ts` handles optional gentle touch settling, `wheel-motion.ts` handles conservative wheel smoothing, and `scroll-policy.ts` holds scroll decisions. Settle behavior must yield to new input, active momentum, anchor navigation, and reduced-motion preferences. Touch settling waits for scroll-end or a quiet fallback interval, targets media at 12% of viewport height, and only corrects nearby positions (up to 17% of the viewport or 144px). Fast swipes remain free; there is no mandatory snap sequence. Content remains readable with JavaScript disabled, and reduced motion disables decorative entrances, wheel smoothing, autoplay, and settling. Entrances wait for decoded lead photography and two animation frames so they cannot finish before the photograph arrives.

In development, open **`/?motionDebug=true`** for motion diagnostics and replay. The diagnostic UI is excluded from production. Replay is for inspection; normal browsing should leave completed reveals at rest. The photo dialog and video behavior are initialized in `BaseLayout.astro` alongside motion.

## GitHub Pages

The included workflow builds and deploys `dist/` from `main`; pull requests build without publishing. In repository **Settings → Pages**, choose **GitHub Actions** as the source.

`astro.config.mjs` defaults to **https://djontheline.com** and base **`/`**. All public assets and homepage links respect the base. `SITE_URL` and `BASE_PATH` optionally override these defaults. For a repository-hosted GitHub Pages site, set repository Actions variables to `https://YOUR-USERNAME.github.io` and `/YOUR-REPOSITORY/` (use `/` for an `OWNER.github.io` repository).

To verify a repository path locally:

```sh
SITE_URL=https://YOUR-USERNAME.github.io BASE_PATH=/FoodFolio/ npm run build
BASE_PATH=/FoodFolio/ npm run preview
# Open http://localhost:4321/FoodFolio/
```

To change the custom domain, configure its DNS and GitHub Pages settings, set `SITE_URL=https://your-domain.example` and `BASE_PATH=/`, and redeploy. A `public/CNAME` may also record the domain; with Actions publishing, configure Pages settings as well. Never include `/public` or the repository name in frontmatter media paths.

## Verify

```sh
npm run check
npm run test:unit
npx playwright install chromium firefox
npm run build
npm test
# Optional content/video fixtures, requiring ffmpeg:
npm run test:content
```

For a repository-path build, run browser tests with `TEST_BASE=/FoodFolio/ TEST_URL=http://127.0.0.1:4321/FoodFolio/ BASE_PATH=/FoodFolio/ npm test`. Check desktop and narrow-screen layouts, all four navigation anchors, image enlargement and keyboard dismissal, reduced motion, no-JavaScript behavior, and additional image/video content. Physical-device scrolling should be tested separately from browser emulation. See `docs/verification.md` for verification records and device limits.
