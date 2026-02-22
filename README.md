# RaptorQ: The Black Magic of Liquid Data

<div align="center">

**An interactive visual deep-dive into RaptorQ (RFC 6330) fountain codes — the protocol that turns rigid files into probabilistic streams.**

[![License: MIT](https://img.shields.io/badge/License-MIT%2BOpenAI%2FAnthropic%20Rider-blue.svg)](./LICENSE)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Three.js](https://img.shields.io/badge/Three.js-black?logo=three.js&logoColor=white)](https://threejs.org/)
[![D3.js](https://img.shields.io/badge/D3.js-F9A03C?logo=d3.js&logoColor=white)](https://d3js.org/)

[**Read the Article**](https://dicklesworthstone.github.io/raptorq_article/) · [RFC 6330](https://datatracker.ietf.org/doc/html/rfc6330)

</div>

---

## TL;DR

**The Problem**: RaptorQ is one of the most elegant algorithms in modern networking — it powers 3GPP MBMS, ATSC 3.0, and FLUTE multicast — but RFC 6330 is 60+ pages of dense spec. Most explanations either handwave the math or drown you in notation. There's almost nothing in between.

**The Solution**: This is a single-page interactive article that builds intuition from first principles. It starts with "packets are equations" and ends with inactivation decoding and GF(256) insurance — with 5 hands-on visualizations you can poke at along the way.

### What's Inside

| Section | What You'll Learn |
|---------|-------------------|
| **Packets Are Equations** | Why every received packet is a linear constraint over GF(2) |
| **The Coupon Collector's Tax** | Why sparse random codes need O(K log K) packets — and why that's unacceptable |
| **LT Codes & The Ripple** | How the Soliton distribution keeps the peeling decoder alive |
| **The "Aha!" Moment** | The precode trick: be sloppy (97%), then fix the tail deterministically |
| **Intermediate Symbols** | What the decoder actually solves for (LDPC + HDPC + LT constraints) |
| **Peeling & Inactivation** | How RaptorQ confines cubic cost to a tiny dense core |
| **Engineering Tricks** | Systematic encoding, ESI/ISI, K' padding, permanent inactivation |
| **The Deep Math** | Rank-Nullity, Shamir parallels, GF(256) rank probabilities, stopping sets |

---

## Interactive Visualizations

The article includes 5 interactive visualizations built with D3.js, Three.js, and GSAP:

| # | Visualization | What It Does |
|---|---------------|--------------|
| 1 | **GF(2) Matrix Rank Builder** | Add random equations one at a time and watch the system's rank grow toward full rank |
| 2 | **Degree Distribution & Ripple** | Compare Ideal Soliton, Robust Soliton, and RFC 6330 degree tables; simulate peeling and see the ripple live |
| 3 | **Precode Repair** | Animated walkthrough of how the precode's redundancy recovers symbols the fountain layer missed |
| 4 | **Toy Decode Walkthrough** | Step-by-step end-to-end decode with K=4 symbols — every XOR computed in front of you |
| 5 | **Peeling Cascade** | Bipartite graph visualization of degree-1 resolution cascading through the constraint graph |

Plus a Three.js particle-stream hero animation and GSAP scroll-triggered transitions throughout.

---

## Python Demos

Three standalone Python scripts demonstrate the core concepts numerically:

```bash
# 1. Basic XOR encoding/decoding with Gaussian elimination
python 01_xor_encoding_decoding.py

# 2. LT code simulation with Robust Soliton distribution + belief propagation
python 02_lt_code_simulation.py

# 3. RaptorQ-style precoding: LDPC precode + LT fountain layer
python 03_raptorq_precoding.py
```

Requirements: Python 3.8+ with NumPy (`pip install numpy`).

---

## Running Locally

It's a single HTML file with CDN dependencies. No build step.

```bash
# Clone
git clone https://github.com/Dicklesworthstone/raptorq_article.git
cd raptorq_article

# Serve (any static server works)
python -m http.server 8000
# Then open http://localhost:8000
```

Or just open `index.html` directly in a browser.

---

## Project Structure

```
raptorq_article/
├── index.html                          # The article (single-page, self-contained)
├── visualizations.js                   # All 5 interactive visualizations + hero animation
├── 01_xor_encoding_decoding.py         # Python demo: XOR + Gaussian elimination
├── 02_lt_code_simulation.py            # Python demo: LT codes + Robust Soliton
├── 03_raptorq_precoding.py             # Python demo: precode + fountain composition
├── raptorq_article_research.md         # Primary research notes
├── raptorq_math_foundations.md         # Mathematical foundations deep-dive
├── raptorq_fountain_codes_research.md  # Fountain code family survey
├── raptorq_shamir_connection.md        # Shamir's Secret Sharing parallels
├── raptorq_precoding_section.md        # Precoding section draft notes
├── raptorq_blog_sections.md            # Section planning notes
├── raptorq_conclusion.md               # Conclusion draft notes
├── lt_codes_section.md                 # LT codes section draft notes
└── tools/
    └── scroll_perf_probe.mjs           # Scroll performance diagnostic
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Layout & styling | [Tailwind CSS](https://tailwindcss.com/) (CDN) | Dark-theme editorial design |
| Typography | Bricolage Grotesque, Inter, Crimson Pro, JetBrains Mono | Display, body, math, code |
| 3D animation | [Three.js](https://threejs.org/) | Particle-stream hero |
| Charts | [D3.js v7](https://d3js.org/) | Bar charts, line charts, bipartite graphs |
| Scroll animation | [GSAP + ScrollTrigger](https://gsap.com/) | Section transitions |
| Math rendering | [MathJax 3](https://www.mathjax.org/) | LaTeX equations inline and display |

---

## Key Concepts Explained

For readers unfamiliar with the territory, here's the 30-second version:

**Fountain codes** let a sender generate an endless stream of encoded packets from a file. A receiver collects *any* sufficient subset — order and identity don't matter — and reconstructs the original data. No feedback channel required.

**RaptorQ** (RFC 6330) is the state-of-the-art fountain code. Its key trick: a sparse LT fountain layer handles 97% of recovery cheaply (linear time via peeling), and a small deterministic precode cleans up the remaining 3%. The result is near-optimal overhead (often just K+2 packets for K source symbols) at near-linear decoding speed.

The article walks through every layer of this construction with interactive visualizations.

---

## FAQ

### Is this a RaptorQ implementation?

No. This is an educational article that explains how RaptorQ works. The Python scripts are pedagogical demos, not production encoders/decoders.

### Can I use this to teach a class?

Yes. The article is designed to build intuition progressively — from basic XOR equations to inactivation decoding. The interactive visualizations are particularly useful for live demonstrations.

### What background do I need?

Basic linear algebra (matrix rank, Gaussian elimination) and comfort with XOR. The article introduces everything else — finite fields, bipartite graphs, degree distributions — as it goes.

### Why a single HTML file?

Simplicity. No build tools, no framework, no dependencies to install. Open it in a browser and start reading. The CDN-loaded libraries (Tailwind, Three.js, D3, GSAP, MathJax) handle the heavy lifting.

### Where can I learn more?

- [RFC 6330 — RaptorQ Forward Error Correction Scheme](https://datatracker.ietf.org/doc/html/rfc6330)
- [LT Codes (Luby, 2002)](https://doi.org/10.1109/SFCS.2002.1181950)
- [Raptor Codes (Shokrollahi, 2006)](https://doi.org/10.1109/TIT.2006.874390)

---

## About Contributions

Please don't take this the wrong way, but I do not accept outside contributions for any of my projects. I simply don't have the mental bandwidth to review anything, and it's my name on the thing, so I'm responsible for any problems it causes; thus, the risk-reward is highly asymmetric from my perspective. I'd also have to worry about other "stakeholders," which seems unwise for tools I mostly make for myself for free. Feel free to submit issues, and even PRs if you want to illustrate a proposed fix, but know I won't merge them directly. Instead, I'll have Claude or Codex review submissions via `gh` and independently decide whether and how to address them. Bug reports in particular are welcome. Sorry if this offends, but I want to avoid wasted time and hurt feelings. I understand this isn't in sync with the prevailing open-source ethos that seeks community contributions, but it's the only way I can move at this velocity and keep my sanity.

---

## License

MIT License (with OpenAI/Anthropic Rider). See [LICENSE](LICENSE).
