# Verification — September 13, 2026

This record covers the single-page chef portfolio update. The prior source-only checks were insufficient: the reported live behavior was investigated before changing animation strength.

## Root-cause evidence

- The deployed baseline (`3a72de9`) delivered its bundled script and ran without JavaScript errors in Chromium and Firefox. Reveal selectors and IntersectionObserver callbacks matched the rendered DOM; this was not an absent Astro script or broken repository asset prefix.
- Delaying the live hero photograph reproduced an invisible entrance: Chromium finished the animation around 2.04 seconds while its image was still unloaded. Firefox finished around 1.88 seconds; its photograph arrived around 2.13 seconds. The CSS animation was spending its duration before there was a photograph to animate.
- The previous controller armed and exposed initially visible elements without guaranteeing a painted starting state. The new controller waits for decoded lead media and two animation frames. Additional lazy gallery images cannot block the lead image. Slow media has a text fallback; failed decoding cannot strand copy.
- A real browser touch gesture beginning on a baseline photograph ended only 27px from its resting anchor and did not settle. The old handler excluded every anchor, including photograph links. It also canceled on viewport-height changes from Android browser chrome. The replacement permits photograph gestures and only treats width changes as resize interruptions.
- On the physical Pixel 7 Pro, Vanadium explicitly reported `prefers-reduced-motion: reduce`. Its animator duration scale was `0.0`. This correctly disables entrances and soft settling. With the user's permission, the scale was temporarily changed to `1`, the browser then reported normal motion, and physical motion tests ran. The original `0.0` value was restored afterward. The transition animation setting remained unchanged at `0.0`.
- Desktop OS animation settings were disabled, but isolated headful Chromium and Firefox reported normal motion. The user's existing Firefox/Brave profile preferences were not inspected; browser-specific settings may still suppress motion correctly.

## Checks performed

| Area | Evidence |
| --- | --- |
| Build | Production `npm run build` succeeds with zero Astro errors, warnings, or hints; homepage and 404 are the only generated pages. |
| Chromium and Firefox | 34 browser checks passed; four Firefox touch cases are explicitly skipped because those tests use Chromium's touch injection. Both engines visibly animate loaded hero media, dish media, staged text, and the process photograph, then remain still. |
| Hero readiness | A 2.2-second image delay verifies that zoom has not already run; the decoded photograph still starts above 1.025 scale and reaches exactly 1. Screenshots capture the moving composition. |
| Dish reveal | Intermediate transforms/opacity, separate heading and technique delays, stable media anchors, and once-only reveal behavior are asserted. |
| Pixel hero | ADB screen recording captures the title wipe, enlarged photograph, and supporting copy arriving before the final still frame. |
| Pixel soft settle | ADB delivered a 700ms swipe on the burger photograph. The browser logged eligible touch, momentum wait, a 59px correction, then settled. Screen recording shows the correction finishing at the 12% media resting position. |
| Pixel fast swipe | A 100ms swipe passed the pork chop and seasonal dish to the process moment. Diagnostics classified it as a free fast swipe and no settle was imposed. Android's changing viewport height did not interrupt normal scrolling. |
| Native touch | Chromium trusted-touch input on the photograph moves the page under the finger; holding the touch causes no drift. Momentum postpones settling; new touch interrupts correction; reduced motion and fast swipes stay native. |
| Wheel | Repeated discrete 120px steps produce intermediate glide positions and preserve their 240px total. Subsequent fractional 12.5px steps are not canceled. A scroll-call counter verifies the animation actually terminates, including integer scroll rounding. |
| Other input | Page Up/Down, Home/End, Space, anchor navigation, and pointer cancellation pass. A real Chromium scrollbar drag moved to 2728px and remained at 2728px after release. |
| Accessibility | Axe scans report no violations in Chromium or Firefox. Skip link, main focus, lightbox Escape/outside dismissal, focus restoration, image alternatives, reduced motion, and no-JavaScript image navigation pass. |
| Responsive layout | 360, 390, 768, 1024, 1440, and 1920px widths have no horizontal overflow; intrinsic media dimensions reserve layout space. Desktop and phone screenshots inspected. Layout-shift checks stay below 0.05. |
| Content | Minimal frontmatter builds directly into the homepage; duplicate slugs/signatures, missing media, and missing video posters fail clearly. Temporary test content is restored. |
| Video | Generated neutral footage checks native signature/dish/process players, unobstructed controls, transcripts, and reduced-motion autoplay suppression. A separate normal-motion check verifies deferred fetching, intermediate process-player transforms, the final still state, and muted autoplay. Footage is not published. |
| Repository base | Ten Chromium layout/navigation/accessibility/media checks passed with `/FoodFolio/`. The custom-domain `/` build was restored afterward. |
| Production configuration | `astro.config.mjs` remains unchanged: `https://djontheline.com`, base `/`. Existing Pages custom-domain settings are preserved. No production `/djontheline/` prefix. |
| Diagnostics | Development query exposes preference status, replay, resting-anchor outlines, and touch/reveal decisions. Production HTML has no diagnostic controls. |

## Practical limits and choices

No physical precision trackpad or iOS device was available. Trackpad-like browser input was exercised; ambiguous wheel input intentionally stays native. Vanadium supplied the physical Android check; Chromium is the Brave-equivalent engine test, not a claim to have inspected the user's Brave profile.

Reduced-motion preferences intentionally suppress the enhanced experience. The Pixel was restored to its original preference after the initial tests. Homepage fragments remain normal anchors and are not rewritten during scrolling. Process moments use still placeholders until actual footage is supplied. Photographs remain explicitly labeled placeholders; the central contact configuration now contains the owner's email address.

## Follow-up: contact layout and Messenger

- Removed the unused vertical breathing rule after the seasonal dish. The contact underline now belongs to the email text itself, rather than the flex row containing the arrow. The actual configured address stays on one line without horizontal overflow at 320, 360, 390, and 411px; wider layouts were also checked. The production build and 34 Chromium/Firefox checks passed after these changes (four Chromium-only touch cases skipped in Firefox).
- Tested Messenger's actual captive browser on the connected Pixel 7 Pro through ADB screenshots and screen recordings. The temporary HTTPS diagnostic page reported reduced motion **false**, controller **full**, and no reported errors. This follow-up did not change either Android animation setting.
- The embedded real portfolio started its hero at 1.060 scale. Its burger started at opacity 0.65 and translateY 50px; a recorded intermediate frame showed opacity 0.960926 and translateY 10.1653px before the final opacity 1 / no transform state.
- Navigating to the ordinary top-level homepage inside Messenger also visibly animated: the hero recording captured the eyebrow before the title and supporting text, followed by the final composition. Native swipe recordings showed the introduction and dish reveals progressing and then resting. This rules out blanket motion suppression in the tested Messenger session; the original reported failure could not be reproduced, and its cause remains unconfirmed. No speculative Messenger-specific override was added.
- Removed the unlinked, noindex `motion-check.html` after collecting evidence. Normal production visits retain no diagnostic controls. The custom domain and root asset paths remain unchanged.
