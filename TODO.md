# RaptorQ Article Expansion TODO

This checklist is intentionally granular so we don't lose track of anything.

## A) Toy End-to-End Walkthrough (Small Numbers)

- [x] A1. Decide the toy scenario (K, symbol size, precode equation, received packets).
- [x] A2. Write the toy scenario spec in plain English (what is sent, what is lost, what is received).
- [x] A3. Choose concrete byte values for symbols (decimal + hex) and compute all XOR results.
- [x] A4. Add a new `index.html` section: "Walkthrough: Toy Block" (educational + cohesive).
- [x] A5. Add a new interactive container in `index.html` (`viz-container`) for the walkthrough UI.
- [x] A6. Add DOM nodes for:
- [x] A6.1. Known/unknown symbols table.
- [x] A6.2. Received packets list (each with equation + value).
- [x] A6.3. Precode constraint display.
- [x] A6.4. Step description text.
- [x] A6.5. Controls: `Next`, `Back`, `Reset`, `Auto`.
- [x] A7. Implement `window.toyDecodeViz` in `visualizations.js`.
- [x] A7.1. Define step-by-step state snapshots (symbols known + which equation applied).
- [x] A7.2. Render function (diff-friendly updates; minimal DOM thrash).
- [x] A7.3. Button handlers (next/back/reset/auto).
- [x] A7.4. Highlighting (active equation + newly solved symbol).
- [x] A8. Wire `toyDecodeViz.init()` on page load in `index.html`.
- [x] A9. Sanity-check math in the walkthrough (all XORs correct).
- [ ] A10. Verify on load: no console errors; buttons work; layout responsive.

## B) Degree Distribution + Ripple Visualization (Interactive)

- [x] B1. Decide the exact UX: controls + what charts appear.
- [x] B2. Add new `index.html` container in the LT section for "Degrees & Ripple".
- [x] B3. Add UI controls in HTML:
- [x] B3.1. Distribution selector (Ideal Soliton / Robust Soliton / RFC6330 degree table).
- [x] B3.2. Slider for `K` (graph size for simulation).
- [x] B3.3. Slider for overhead (extra checks as %).
- [x] B3.4. Slider for robust-soliton `c` (and optionally `delta`).
- [x] B3.5. Buttons: `Simulate`, `Resample`.
- [x] B4. Add chart containers:
- [x] B4.1. Degree distribution bar chart (D3).
- [x] B4.2. Ripple-over-time line chart (D3).
- [x] B4.3. Summary stats area (expected degree, solved fraction, stall step).
- [x] B5. Implement `window.degreeRippleViz` in `visualizations.js`.
- [x] B5.1. Implement degree distributions:
- [x] B5.1.1. Ideal Soliton ρ(d).
- [x] B5.1.2. Robust Soliton μ(d) (parameterized by K, c, delta).
- [x] B5.1.3. RFC 6330 degree table distribution from thresholds (degrees 1..30).
- [x] B5.2. Implement a sampler (CDF + `Math.random()`).
- [x] B5.3. Implement peeling simulation (bipartite graph):
- [x] B5.3.1. Generate checks with degrees sampled from distribution.
- [x] B5.3.2. Track degrees/unknown counts efficiently.
- [x] B5.3.3. Run peeling; record ripple size vs steps; compute recovered fraction.
- [x] B5.4. Render bar chart; highlight mean degree.
- [x] B5.5. Render ripple line; mark stall point.
- [x] B5.6. Debounce sliders so UI stays responsive.
- [x] B6. Wire `degreeRippleViz.init()` on page load in `index.html`.
- [ ] B7. Verify: no console errors, charts scale on resize, simulation completes quickly.

## C) Polish + Validation

- [x] C1. Ensure new sections match the existing narrative voice and style.
- [x] C2. Ensure all math statements are consistent with earlier sections.
- [x] C3. Remove/avoid misleading absolutes ("any K packets") unless properly qualified.
- [x] C4. Run `node --check visualizations.js`.
- [x] C5. Validate tag balance (sections/divs) and ensure page loads end-to-end.
- [x] C6. Quick manual scan for typos, broken links, inconsistent numbering ("Interactive 04", etc.).

## D) Article Math Audit + Research Blend

- [x] D1. Scan `index.html` for every hard numeric claim (probabilities, overheads, expectations) and sanity-check them.
- [x] D2. Coupon collector: verify the harmonic-number approximation + example numbers.
- [x] D3. Random-matrix rank: verify GF(2) and GF(256) limiting probabilities + formula.
- [x] D4. LT degrees: verify Ideal/Robust soliton formulas and make sure the narrative matches the formulas.
- [x] D5. RFC 6330 degree table: ensure the narrative matches Table 1 thresholds and expected degree (~4.82).
- [x] D6. Check that any "K + O(1)" / "+2 packets" phrasing is clearly qualified as typical/probabilistic (not adversarial).
- [x] D7. Review the whole article for internal consistency (K vs K′ vs L; source vs intermediate symbols).
- [x] D8. Re-skim `raptorq_article_research.md` for any remaining high-signal sections that are still missing, then blend them into `index.html` cleanly (no copy-paste dump).
