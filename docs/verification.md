# Verification — September 13, 2026

The initial portfolio and the stronger entrance-motion update were checked locally before publishing.

| Area | Performed check and result |
| --- | --- |
| Production output | `npm run build`: seven static pages; Astro check reported zero errors, warnings, or hints. Custom-domain defaults remain `https://djontheline.com` and `/`. |
| Browser regression suite | 18 Chromium checks passed at `/`, then the same 18 passed at `/FoodFolio/`. One additional trusted-touch test passed after being added. |
| Second browser engine | 11 Firefox checks passed, covering motion, focus, reduced motion, routes, and layouts. |
| Responsive layout | Homepage, About, and dish study checked at 360, 390, 768, 1024, 1440, and 1920px widths; no horizontal overflow. Desktop and phone screenshots inspected. |
| Routes and local assets | All four dish URLs opened directly. Local page links, résumé, images, responsive sources, and stylesheet requests returned 200. Homepage fragment links reached their dishes. |
| Image delivery and layout shift | Intrinsic dimensions present; hero fills viewport. Tall phone hero selects a 1600px AVIF, ordinary phone dish selects 480px. Desktop layout-shift assertion passed below 0.05. Below-fold images are lazy. |
| Accessibility | Automated axe scan passed. Skip link, keyboard focus, direct anchors, and no-JavaScript study navigation passed. Focusing an unrevealed section immediately exposes it. |
| Motion | Hero resolves in 1.5 seconds. Dish and process motion stops after entering. Intermediate clipping values verified in Chromium and Firefox, preventing a discrete mask jump. The media scroll anchor itself remains untransformed. |
| Reduced motion | Initial and dynamically changed preferences disable transforms, clipping, blur, autoplay, and touch settling. All tested content remains visible. |
| Desktop scrolling | Native 120px wheel and 12px precision deltas remain unchanged; events are not canceled. Page Down, Home, End, and direct scroll-position changes work. An actual scrollbar drag, with Chromium's default scrollbar-hiding flag disabled, moved to 2236px and remained there after release. |
| Mobile scrolling | Browser touch tests confirmed no settle during active touch or continued momentum; small nearby corrections settle afterward. New input interrupts an active animation. Fast swipes and reduced motion remain native. An additional CDP-dispatched touch gesture verified movement under the finger, no drift while held, and proximity settling after release. |
| Content variants | Builds accept omitted optional fields, reject duplicate slugs/signatures and missing local media, and require video posters. Nonfeatured studies return to an existing work anchor. Temporary fixtures were restored after checks. |
| Video | Generated neutral test footage verified playable signature, dish, and process players, accessible controls and transcripts, no link wrapping of players, and the reduced-motion autoplay guard. Test footage is not published. |
| Development controls | `?motionDebug=true` exposes replay only in development. Clicking restarts the hero, which resolves to no blur. The normal development URL hides it; production contains no debug control. |
| Deployment paths | Full browser suite passed under `/FoodFolio/`; the default custom-domain build was restored afterward. Explicit environment overrides remain available without changing the custom-domain defaults. |

Hardware limits: touch and precision-wheel behavior were exercised through browser emulation and event delivery, not a physical iPhone or trackpad. WebKit could not run on this host because its ICU/JPEG system libraries were unavailable. Physical iOS/Safari feel remains a device-review item.

Intentional choices: desktop scrolling stays native; no device-classification heuristics or wheel inertia are imposed. Homepage fragments are not rewritten automatically. The stock photographs, sample notes, contact placeholder, and draft résumé remain clearly marked and must be replaced with final material for applications.
