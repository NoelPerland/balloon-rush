
## Mobile repair and AI handoff — 30 October 2026

Use Node24 and npm ci. Preserve existing tower balance, upgrade trees, progress and art. Mobile portrait must remain upright: do not restore CSS 90-degree rotation. Canvas pointerup uses its current client rectangle so real touch purchases align after resizing. Runtime art/audio paths use Vite BASE_URL; vite.config.ts uses a relative base for Pages.

Run npm run build. With the preview running, npm run verify:mobile -- URL checks real touch purchase, upgrade locks, wave start and five viewport sizes; set CHROME_PATH if Chrome is elsewhere. This is not a full20-wave or physical-device completion claim. Source is on main; publish built dist contents and .nojekyll to gh-pages. No secrets needed.

Auto-wave follow-up timers now cancel when Auto is switched off, a wave starts manually, or a run resets. Run npm test for the cancellation regression; the production build and Chrome touch purchase/upgrade/wave/viewport checks pass. Physical-device and full-campaign play remain unverified.

For the existing `npm run smoke` browser check, start the dev server on port5188 or set `SMOKE_URL` to its URL. `CHROME_PATH` overrides browser discovery; standard Chrome and Edge installations are detected. This checks a normal tower purchase, upgrade locking, wave start and another mid-wave purchase, not twenty-wave completion.
