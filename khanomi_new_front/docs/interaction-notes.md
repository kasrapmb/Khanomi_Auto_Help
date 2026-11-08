# Interaction design and verification

Reference requested: https://shokrzad.com/ai/icourse/ai-agents-bootcamp

The environment proxy rejected the reference domain with HTTP 403 during CONNECT. The page, its styles and its live hover behavior were not inspected. These changes implement the user's described interaction direction, adapted to the existing Khanomi palette; they are not claimed to reproduce the reference implementation. Direct observation still requires adding `shokrzad.com` to the environment's network allowlist (and inspecting any additional required asset domains). The environment draft read failed, so no unknown network settings were replaced.

## Implemented

- Slow cyan and violet ambient gradients, a subtle grid and breathing hero waves.
- Pointer-positioned card lighting and masked illuminated borders, updated at most once per animation frame; fine pointers only.
- Button hover lift, icon movement, primary-button sheen, tab feedback and a click ripple, including keyboard activation.
- Search focus feedback, visible keyboard focus, dialog entrance and one-time surface/chart entrance animations.
- Header star button toggles motion and stores the preference locally. OS reduced-motion preference takes priority. Touch does not require hover; decorative layers never intercept clicks. Background animations pause while the document is hidden.

## Evidence boundaries

`node scripts/smoke.mjs` verifies existing dashboard controls, browser errors and responsive widths.
`node scripts/effects-smoke.mjs` verifies pointer coordinates, hover activation, ripple creation, motion persistence, OS reduced motion and mobile touch interaction.

REA CLI 6.8.0 also ran `capture_browser_scenario` against the local dashboard, with an owned Chromium process: navigation, a bounded wait and clicking the motion control completed. Evidence ID: `ev_5cb617a0070ad0140963212b5169feee089eb6f7b2443fa9e55c81b1774eacbb`. Browser cleanup: `terminated-owned-process`. Its default reduced-motion mode was active, so this capture establishes action completion, not animation appearance. Visual and motion assertions are supplied by the separate browser test above. Full current-run evidence is retained in ignored `artifacts/rea-local-evidence.json`.
