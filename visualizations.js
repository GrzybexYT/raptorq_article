
// ============================================
// RAPTORQ VISUALIZATIONS - ENHANCED EDITION
// ============================================

gsap.registerPlugin(ScrollTrigger);

const COLORS = {
    bg: 0x030305,
    cyan: 0x06b6d4,
    purple: 0xa855f7,
    blue: 0x3b82f6,
    white: 0xffffff,
    slate: 0x94a3b8
};

// ============================================
// 1. HERO ANIMATION (THREE.JS)
// ============================================
window.initHero = function() {
    const container = document.getElementById('hero-canvas');
    if (!container) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(COLORS.bg, 0.02);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;
    camera.position.y = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Particle Stream
    const geometry = new THREE.BufferGeometry();
    const count = 2000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const speeds = new Float32Array(count);

    const color1 = new THREE.Color(COLORS.cyan);
    const color2 = new THREE.Color(COLORS.purple);

    for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 50;     // x
        positions[i * 3 + 1] = Math.random() * 100 - 50;   // y
        positions[i * 3 + 2] = (Math.random() - 0.5) * 20; // z

        const mixedColor = color1.clone().lerp(color2, Math.random());
        colors[i * 3] = mixedColor.r;
        colors[i * 3 + 1] = mixedColor.g;
        colors[i * 3 + 2] = mixedColor.b;

        sizes[i] = Math.random() * 0.2;
        speeds[i] = 0.1 + Math.random() * 0.2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
        size: 0.3,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX - window.innerWidth / 2) * 0.05;
        mouseY = (e.clientY - window.innerHeight / 2) * 0.05;
    });

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);

        const positions = particles.geometry.attributes.position.array;
        
        for (let i = 0; i < count; i++) {
            positions[i * 3 + 1] -= speeds[i]; // Fall down
            
            // Reset if too low
            if (positions[i * 3 + 1] < -20) {
                positions[i * 3 + 1] = 40;
                positions[i * 3] = (Math.random() - 0.5) * 50;
            }

            // Mouse sway
            positions[i * 3] += (mouseX - positions[i * 3]) * 0.005;
        }

        particles.geometry.attributes.position.needsUpdate = true;
        
        // Gentle rotation
        particles.rotation.y += 0.001;
        
        renderer.render(scene, camera);
    }
    animate();

    // Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
};

// ============================================
// 2. MATRIX VISUALIZATION (Interactive 01)
// ============================================
window.matrixViz = {
    unknowns: 4,
    rows: [],
    rank: 0,
    
    init() {
        this.render();
    },

    reset() {
        this.rows = [];
        this.rank = 0;
        this.render();
    },

    step() {
        if (this.rows.length >= 8) return; // Cap at 8 rows for UI
        
        // Generate random row
        const row = Array.from({length: this.unknowns}, () => Math.random() > 0.5 ? 1 : 0);
        // Ensure not all zeros (simple check)
        if (row.every(x => x === 0)) row[0] = 1;
        
        this.rows.push({
            data: row,
            id: Date.now() + Math.random(),
            isNew: true
        });

        this.calculateRank();
        this.render();
    },

    calculateRank() {
        // Simple Gaussian elimination to count rank
        let matrix = this.rows.map(r => [...r.data]);
        let pivotRow = 0;
        let col = 0;
        
        const rowCount = matrix.length;
        const colCount = this.unknowns;

        for (col = 0; col < colCount && pivotRow < rowCount; col++) {
            let sel = pivotRow;
            while (sel < rowCount && matrix[sel][col] === 0) sel++;

            if (sel < rowCount) {
                // Swap
                [matrix[sel], matrix[pivotRow]] = [matrix[pivotRow], matrix[sel]];
                
                // Eliminate
                for (let i = 0; i < rowCount; i++) {
                    if (i !== pivotRow && matrix[i][col] === 1) {
                        for (let j = col; j < colCount; j++) {
                            matrix[i][j] ^= matrix[pivotRow][j];
                        }
                    }
                }
                pivotRow++;
            }
        }
        this.rank = pivotRow;
    },

    render() {
        const container = document.getElementById('matrix-render-area');
        const status = document.getElementById('rank-status');
        
        // Update Status
        status.innerHTML = `Rank: ${this.rank} / ${this.unknowns}`;
        status.className = this.rank >= this.unknowns ? "text-green-400 font-bold" : "text-cyan-400 font-bold";

        // Render Rows
        let html = '';
        this.rows.forEach((row, idx) => {
            const rowClass = row.isNew ? 'highlight-row' : '';
            if(row.isNew) row.isNew = false; // Remove flag after render

            html += `<div class="flex gap-4 mb-2 p-2 rounded border border-white/5 bg-white/5 ${rowClass}">`;
            
            // Equation
            html += `<div class="flex-1 flex gap-2">`;
            row.data.forEach((val, i) => {
                const color = val ? 'text-cyan-400 font-bold' : 'text-slate-600';
                html += `<span class="${color}">${val}·x${i+1}</span>`;
                if (i < this.unknowns - 1) html += `<span class="text-slate-700">+</span>`;
            });
            html += `</div>`;
            
            // Packet ID
            html += `<span class="text-slate-500 text-xs tracking-widest uppercase">PKT ${idx+1}</span>`;
            html += `</div>`;
        });
        
        if (this.rows.length === 0) {
            html = `<div class="text-slate-500 italic text-center py-10">No packets received yet.<br>Click "Add Packet" to start streaming.</div>`;
        } else if (this.rank >= this.unknowns) {
             html += `<div class="mt-4 p-4 border border-green-500/30 bg-green-500/10 rounded text-green-400 text-center font-bold animate-pulse">
                SYSTEM SOLVABLE! NULLITY = 0
             </div>`;
        }

        container.innerHTML = html;
    }
};

// ============================================
// 3. PRECODE VISUALIZATION (Interactive 03)
// ============================================
window.precodeViz = {
    init() {
        this.svg = d3.select("#precode-svg");
        this.width = 800;
        this.height = 400;
        this.reset();
    },
    
    reset() {
        this.svg.selectAll("*").remove();
        // Setup Groups
        this.sourceG = this.svg.append("g").attr("transform", "translate(50, 100)");
        this.interG = this.svg.append("g").attr("transform", "translate(300, 100)");
        this.bucketG = this.svg.append("g").attr("transform", "translate(600, 100)");
        
        // Labels
        this.svg.append("text").attr("x", 50).attr("y", 50).attr("fill", "#94a3b8").text("SOURCE (K)");
        this.svg.append("text").attr("x", 300).attr("y", 50).attr("fill", "#94a3b8").text("INTERMEDIATE (L)");
        this.svg.append("text").attr("x", 600).attr("y", 50).attr("fill", "#94a3b8").text("RECOVERED");
    },

    animate() {
        this.reset();

        // Use a larger block so "97%" isn't a rounding joke.
        const K = 30;
        const P = 3;
        const L = K + P;

        const step = Math.max(8, Math.floor((this.height - 80) / L));
        const size = Math.max(6, step - 2);

        const absY = (i) => 100 + i * step + size / 2;
        const relY = (i) => i * step;

        // 1. Draw Source Symbols
        const sourceData = d3.range(K).map(i => ({ i }));

        this.sourceG.selectAll("rect")
            .data(sourceData)
            .enter().append("rect")
            .attr("x", 0)
            .attr("y", d => relY(d.i))
            .attr("width", size)
            .attr("height", size)
            .attr("rx", 2)
            .attr("fill", "#3b82f6")
            .attr("opacity", 0)
            .transition().duration(500).delay((d, i) => i * 20)
            .attr("opacity", 1);

        // 2. Precode Expansion (Source -> Intermediate)
        setTimeout(() => {
            const interData = d3.range(L).map(i => ({
                i,
                type: i < K ? "source" : "parity",
                color: i < K ? "#3b82f6" : "#a855f7"
            }));

            this.interG.selectAll("rect")
                .data(interData)
                .enter().append("rect")
                .attr("x", 0)
                .attr("y", d => relY(d.i))
                .attr("width", size)
                .attr("height", size)
                .attr("rx", 2)
                .attr("fill", d => d.color)
                .attr("opacity", 0)
                .transition().duration(500).delay((d, i) => i * 12)
                .attr("opacity", 1);

            // Connect lines (lightly; it's just the "expansion" vibe)
            this.svg.append("g").selectAll("line")
                .data(d3.range(K))
                .enter().append("line")
                .attr("x1", 50 + size + 6)
                .attr("y1", d => absY(d))
                .attr("x2", 300)
                .attr("y2", d => absY(d))
                .attr("stroke", "#3b82f6")
                .attr("stroke-width", 1)
                .attr("opacity", 0.15);
        }, 900);

        // 3. Simulation: Fountain Recovery (≈97%)
        setTimeout(() => {
            const missingIdx = 24; // a single stubborn source symbol
            const recoveredIndices = d3.range(L).filter(i => i !== missingIdx);
            const recoveredPct = Math.round((recoveredIndices.length / L) * 100);

            this.bucketG.selectAll("rect")
                .data(recoveredIndices)
                .enter().append("rect")
                .attr("x", 0)
                .attr("y", d => relY(d))
                .attr("width", size)
                .attr("height", size)
                .attr("rx", 2)
                .attr("fill", d => d < K ? "#3b82f6" : "#a855f7")
                .attr("opacity", 0)
                .transition().duration(700).delay((d, i) => i * 10)
                .attr("opacity", 1);

            // Ghost missing block
            this.bucketG.append("rect")
                .attr("x", 0)
                .attr("y", relY(missingIdx))
                .attr("width", size)
                .attr("height", size)
                .attr("rx", 2)
                .attr("fill", "transparent")
                .attr("stroke", "#ef4444")
                .attr("stroke-width", 1.5)
                .attr("stroke-dasharray", "4,4")
                .attr("opacity", 0.8);

            this.svg.append("text")
                .attr("x", 600)
                .attr("y", this.height - 24)
                .text(`LT STALLED at ${recoveredPct}%`)
                .attr("fill", "#ef4444")
                .attr("font-weight", "bold")
                .attr("opacity", 0)
                .transition().delay(800).attr("opacity", 1);
        }, 2200);

        // 4. Precode Repair (fills the last gap)
        setTimeout(() => {
            const missingIdx = 24;
            const parityIdx = K; // first parity block

            this.bucketG.append("path")
                .attr("d", () => {
                    const sourceY = parityIdx * step + size / 2;
                    const targetY = missingIdx * step + size / 2;
                    const x0 = size + 6;
                    const x1 = size + 70;
                    return `M ${x0} ${sourceY} C ${x1} ${sourceY}, ${x1} ${targetY}, ${x0} ${targetY}`;
                })
                .attr("fill", "none")
                .attr("stroke", "#a855f7")
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "5,5")
                .attr("opacity", 0)
                .transition().duration(900)
                .attr("opacity", 1);

            this.bucketG.append("rect")
                .attr("x", 0)
                .attr("y", relY(missingIdx))
                .attr("width", size)
                .attr("height", size)
                .attr("rx", 2)
                .attr("fill", "#06b6d4") // cyan for repaired
                .attr("opacity", 0)
                .transition().delay(700).duration(500)
                .attr("opacity", 1);

            this.svg.append("text")
                .attr("x", 600)
                .attr("y", this.height - 6)
                .text("PRECODE REPAIRED TAIL")
                .attr("fill", "#06b6d4")
                .attr("font-weight", "bold")
                .attr("opacity", 0)
                .transition().delay(900).attr("opacity", 1);
        }, 3600);
    }
};

// ============================================
// 4. PEELING VISUALIZATION (Interactive 05)
// ============================================
window.peelingViz = {
    nodes: [],
    links: [],
    
    init() {
        this.container = document.getElementById('peeling-canvas');
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        
        this.svg = d3.select("#peeling-canvas").append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", `0 0 ${this.width} ${this.height}`);
            
        this.reset();
    },

    reset() {
        this.svg.selectAll("*").remove();
        this.nodes = [];
        this.links = [];
        
        // Generate Graph
        const K = 8;
        const M = 12; // packets
        
        // Left: Source
        for(let i=0; i<K; i++) {
            this.nodes.push({id: `s${i}`, x: 100, y: (i+1)*(this.height/(K+1)), type: 'source', solved: false});
        }
        // Right: Packets
        for(let i=0; i<M; i++) {
            this.nodes.push({id: `p${i}`, x: this.width-100, y: (i+1)*(this.height/(M+1)), type: 'packet', degree: 0});
        }

        // Random Connections (ensure at least some degree 1)
        this.nodes.filter(n=>n.type==='packet').forEach(p => {
            const degree = Math.random() > 0.7 ? 1 : (Math.random() > 0.5 ? 2 : 3);
            p.degree = degree;
            const sources = d3.shuffle(d3.range(K)).slice(0, degree);
            sources.forEach(sIdx => {
                this.links.push({source: `s${sIdx}`, target: p.id});
            });
        });

        this.render();
    },

    render() {
        const t = d3.transition().duration(500);

        // Links
        const lines = this.svg.selectAll("line")
            .data(this.links, d => d.source + "-" + d.target);
            
        lines.enter().append("line")
            .attr("stroke", "#334155")
            .attr("stroke-width", 1)
            .attr("x1", d => this.nodes.find(n=>n.id==d.source).x)
            .attr("y1", d => this.nodes.find(n=>n.id==d.source).y)
            .attr("x2", d => this.nodes.find(n=>n.id==d.target).x)
            .attr("y2", d => this.nodes.find(n=>n.id==d.target).y);
            
        lines.exit().transition(t).style("opacity", 0).remove();

        // Nodes
        const circles = this.svg.selectAll("circle")
            .data(this.nodes, d => d.id);
            
        circles.enter().append("circle")
            .attr("r", d => d.type==='source'? 12 : 8)
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .merge(circles)
            .transition(t)
            .attr("fill", d => {
                if(d.type==='source') return d.solved ? "#22c55e" : "#1e293b";
                return d.degree===1 ? "#facc15" : "#3b82f6"; // Yellow for degree 1 (Pivot)
            })
            .attr("stroke", d => d.type==='source' && d.solved ? "#22c55e" : "#475569");
    },

    step() {
        // 1. Find degree 1 packet
        const pivot = this.nodes.find(n => n.type === 'packet' && n.degree === 1);
        
        if (!pivot) {
            // Flash red ?
            return;
        }

        // 2. Find connected source
        const link = this.links.find(l => l.target === pivot.id);
        if (!link) return; // Should not happen
        
        const sourceNode = this.nodes.find(n => n.id === link.source);
        
        // 3. Mark source solved
        sourceNode.solved = true;
        
        // 4. "Peel" - remove all links connected to this source
        const linksToRemove = this.links.filter(l => l.source === sourceNode.id);
        
        // Update degrees of connected packets
        linksToRemove.forEach(l => {
            const pkt = this.nodes.find(n => n.id === l.target);
            if (pkt) pkt.degree--;
        });
        
        // Remove links from data
        this.links = this.links.filter(l => l.source !== sourceNode.id);
        
        // Remove pivot packet (it's used up)
        this.nodes = this.nodes.filter(n => n.id !== pivot.id);
        this.links = this.links.filter(l => l.target !== pivot.id);

        this.render();
    }
};

// ============================================
// 5. DEGREE DISTRIBUTION + RIPPLE (Interactive 02)
// ============================================
window.degreeRippleViz = {
    dist: 'rfc6330',
    K: 800,
    overheadPct: 5,
    cInt: 5,
    c: 0.05,
    delta: 0.05, // Fixed for the demo; robust soliton parameter.

    _simTimer: null,
    _renderTimer: null,
    last: null,

    init() {
        const container = document.getElementById('viz-degree-ripple');
        if (!container) return;

        this.distSel = document.getElementById('degree-ripple-dist');
        this.kSlider = document.getElementById('degree-ripple-k');
        this.overheadSlider = document.getElementById('degree-ripple-overhead');
        this.cSlider = document.getElementById('degree-ripple-c');

        this.kLabel = document.getElementById('degree-ripple-k-label');
        this.overheadLabel = document.getElementById('degree-ripple-overhead-label');
        this.cLabel = document.getElementById('degree-ripple-c-label');

        this.statsEl = document.getElementById('degree-ripple-stats');

        // Pull defaults from the DOM (so HTML remains the source of truth).
        if (this.distSel) this.dist = this.distSel.value || this.dist;
        if (this.kSlider) this.K = parseInt(this.kSlider.value, 10) || this.K;
        if (this.overheadSlider) this.overheadPct = parseInt(this.overheadSlider.value, 10) || this.overheadPct;
        if (this.cSlider) this.cInt = parseInt(this.cSlider.value, 10) || this.cInt;

        this.c = this.cInt / 100;

        this.updateLabels();
        this.simulate();

        window.addEventListener('resize', () => {
            this.scheduleRender();
        });
    },

    updateLabels() {
        if (this.kLabel) this.kLabel.textContent = `K = ${this.K}`;
        const M = Math.ceil(this.K * (1 + this.overheadPct / 100));
        if (this.overheadLabel) this.overheadLabel.textContent = `+${this.overheadPct}% → M = ${M}`;
        if (this.cLabel) {
            const suffix = this.dist === 'robust' ? '' : ' (robust only)';
            this.cLabel.textContent = `c = ${this.c.toFixed(2)}${suffix}`;
        }
    },

    scheduleSimulate() {
        clearTimeout(this._simTimer);
        this._simTimer = setTimeout(() => this.simulate(), 180);
    },

    scheduleRender() {
        clearTimeout(this._renderTimer);
        this._renderTimer = setTimeout(() => this.renderFromLast(), 80);
    },

    setDist(v) {
        this.dist = v;
        this.updateLabels();
        this.simulate();
    },

    setK(k) {
        if (!Number.isFinite(k)) return;
        this.K = Math.max(50, Math.min(2000, k));
        this.updateLabels();
        this.scheduleSimulate();
    },

    setOverhead(pct) {
        if (!Number.isFinite(pct)) return;
        this.overheadPct = Math.max(0, Math.min(50, pct));
        this.updateLabels();
        this.scheduleSimulate();
    },

    setC(ci) {
        if (!Number.isFinite(ci)) return;
        this.cInt = Math.max(1, Math.min(20, ci));
        this.c = this.cInt / 100;
        this.updateLabels();
        if (this.dist === 'robust') this.scheduleSimulate();
    },

    simulate() {
        if (!document.getElementById('viz-degree-ripple')) return;

        const distObj = this.computeDistribution();
        const sim = this.runPeelingSimulation(distObj);
        const barData = this.computeBarData(distObj);

        this.last = { distObj, sim, barData };
        this.renderFromLast();
    },

    resample() {
        // Same parameters, new random bipartite graph.
        if (!this.last || !this.last.distObj) return this.simulate();
        const sim = this.runPeelingSimulation(this.last.distObj);
        this.last = { ...this.last, sim };
        this.renderFromLast();
    },

    computeDistribution() {
        if (this.dist === 'ideal') {
            const p = this.idealSoliton(this.K);
            const cdf = this.cdfFromP(p);
            return { type: 'ideal', K: this.K, maxD: this.K, p, cdf, meanDegree: this.meanFromP(p) };
        }

        if (this.dist === 'robust') {
            const p = this.robustSoliton(this.K, this.c, this.delta);
            const cdf = this.cdfFromP(p);
            const R = this.c * Math.log(this.K / this.delta) * Math.sqrt(this.K);
            const kOverR = Math.max(1, Math.min(this.K, Math.floor(this.K / R)));
            return {
                type: 'robust',
                K: this.K,
                maxD: this.K,
                p,
                cdf,
                meanDegree: this.meanFromP(p),
                meta: { c: this.c, delta: this.delta, R, kOverR }
            };
        }

        // RFC 6330 degree table (Table 1): cumulative thresholds out of 2^20.
        const thresholds = [
            0,
            5243,
            529531,
            704294,
            791675,
            844104,
            879057,
            904023,
            922747,
            937311,
            948962,
            958494,
            966438,
            973160,
            978921,
            983914,
            988283,
            992138,
            995565,
            998631,
            1001391,
            1003887,
            1006157,
            1008229,
            1010129,
            1011876,
            1013490,
            1014983,
            1016370,
            1017662,
            1048576
        ];

        const maxD = 30;
        const denom = 1048576;
        const p = new Array(maxD + 1).fill(0);
        for (let d = 1; d <= maxD; d++) {
            p[d] = (thresholds[d] - thresholds[d - 1]) / denom;
        }
        const cdf = this.cdfFromP(p);
        return { type: 'rfc6330', K: this.K, maxD, p, cdf, meanDegree: this.meanFromP(p) };
    },

    idealSoliton(K) {
        const p = new Array(K + 1).fill(0);
        p[1] = 1 / K;
        for (let d = 2; d <= K; d++) p[d] = 1 / (d * (d - 1));
        return p;
    },

    robustSoliton(K, c, delta) {
        const rho = this.idealSoliton(K);
        const R = c * Math.log(K / delta) * Math.sqrt(K);

        let kOverR = Math.floor(K / R);
        kOverR = Math.max(1, Math.min(K, kOverR));

        const tau = new Array(K + 1).fill(0);
        for (let d = 1; d < kOverR; d++) tau[d] = 1 / (d * kOverR); // ≈ R/(dK)
        if (kOverR <= K) tau[kOverR] = Math.log(R / delta) / kOverR; // ≈ R ln(R/delta) / K

        const mu = new Array(K + 1).fill(0);
        let Z = 0;
        for (let d = 1; d <= K; d++) {
            mu[d] = rho[d] + tau[d];
            Z += mu[d];
        }
        for (let d = 1; d <= K; d++) mu[d] /= Z;
        return mu;
    },

    cdfFromP(p) {
        const cdf = new Array(p.length).fill(0);
        let s = 0;
        for (let d = 1; d < p.length; d++) {
            s += p[d];
            cdf[d] = s;
        }
        cdf[cdf.length - 1] = 1; // guard against rounding drift
        return cdf;
    },

    meanFromP(p) {
        let m = 0;
        for (let d = 1; d < p.length; d++) m += d * p[d];
        return m;
    },

    sampleDegree(cdf) {
        const r = Math.random();
        let lo = 1;
        let hi = cdf.length - 1;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (cdf[mid] >= r) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    },

    sampleNeighborsFloyd(n, k) {
        // Floyd's algorithm: O(k), uniform sample without replacement.
        k = Math.max(1, Math.min(n, k));
        const selected = new Set();
        for (let j = n - k; j < n; j++) {
            const t = Math.floor(Math.random() * (j + 1));
            if (selected.has(t)) selected.add(j);
            else selected.add(t);
        }
        return Array.from(selected);
    },

    computeBarData(distObj) {
        const p = distObj.p;
        const K = distObj.K;

        const maxShow = Math.min(30, p.length - 1);
        const bars = [];
        for (let d = 1; d <= maxShow; d++) {
            bars.push({ label: String(d), degree: d, p: p[d], kind: 'degree' });
        }

        if (distObj.type === 'rfc6330') return bars;

        // Aggregate tail beyond 30 for readability.
        if (K > maxShow) {
            let tail = 0;
            for (let d = maxShow + 1; d < p.length; d++) tail += p[d];

            if (distObj.type === 'robust') {
                const kOverR = distObj.meta?.kOverR;
                if (kOverR && kOverR > maxShow && kOverR < p.length) {
                    const spike = p[kOverR] || 0;
                    const rest = Math.max(0, tail - spike);
                    bars.push({ label: `d=${kOverR}`, degree: kOverR, p: spike, kind: 'spike' });
                    bars.push({ label: `> ${maxShow}`, degree: null, p: rest, kind: 'tail' });
                    return bars;
                }
            }

            bars.push({ label: `> ${maxShow}`, degree: null, p: tail, kind: 'tail' });
        }

        return bars;
    },

    runPeelingSimulation(distObj) {
        const K = distObj.K;
        const M = Math.ceil(K * (1 + this.overheadPct / 100));

        const varToChecks = Array.from({ length: K }, () => []);
        const checks = new Array(M);
        const deg = new Array(M);

        let edgeCount = 0;

        for (let j = 0; j < M; j++) {
            let d = this.sampleDegree(distObj.cdf);
            d = Math.max(1, Math.min(K, d));

            const neighbors = this.sampleNeighborsFloyd(K, d);
            checks[j] = neighbors;
            deg[j] = neighbors.length;
            edgeCount += neighbors.length;

            for (let t = 0; t < neighbors.length; t++) {
                varToChecks[neighbors[t]].push(j);
            }
        }

        const solved = new Array(K).fill(false);
        let solvedCount = 0;

        const queue = [];
        let rippleSize = 0;
        for (let j = 0; j < M; j++) {
            if (deg[j] === 1) {
                rippleSize++;
                queue.push(j);
            }
        }

        const rippleSeries = [{ step: 0, ripple: rippleSize }];
        let stallAt = null;

        let qHead = 0;
        while (solvedCount < K) {
            while (qHead < queue.length && deg[queue[qHead]] !== 1) qHead++;
            if (qHead >= queue.length) {
                stallAt = solvedCount;
                break;
            }

            const chk = queue[qHead++];
            const neigh = checks[chk];

            // Find the single remaining unknown neighbor (degree==1 implies it exists).
            let v = -1;
            for (let i = 0; i < neigh.length; i++) {
                const cand = neigh[i];
                if (!solved[cand]) {
                    v = cand;
                    break;
                }
            }
            if (v === -1) {
                // Defensive: deg bookkeeping says 1, but all neighbors are already solved.
                deg[chk] = 0;
                rippleSize = Math.max(0, rippleSize - 1);
                rippleSeries.push({ step: solvedCount, ripple: rippleSize });
                continue;
            }

            solved[v] = true;
            solvedCount++;

            const incident = varToChecks[v];
            for (let i = 0; i < incident.length; i++) {
                const cId = incident[i];
                const old = deg[cId];
                if (old <= 0) continue;
                const neu = old - 1;
                deg[cId] = neu;

                if (old === 1) rippleSize -= 1;
                else if (old === 2) {
                    rippleSize += 1;
                    queue.push(cId);
                }
            }

            rippleSeries.push({ step: solvedCount, ripple: rippleSize });
        }

        const recoveredPct = (solvedCount / K) * 100;
        const maxRipple = rippleSeries.reduce((m, p) => Math.max(m, p.ripple), 0);
        const initRipple = rippleSeries[0]?.ripple ?? 0;

        return {
            K,
            M,
            edgeCount,
            solvedCount,
            recoveredPct,
            stallAt,
            rippleSeries,
            initRipple,
            maxRipple,
            realizedMeanDegree: edgeCount / M
        };
    },

    renderFromLast() {
        if (!this.last) return;
        const { distObj, sim, barData } = this.last;

        this.renderBarChart(barData, distObj.meanDegree);
        this.renderRippleChart(sim);

        if (this.statsEl) {
            const overheadSym = sim.M - sim.K;
            const overheadPct = ((sim.M / sim.K) - 1) * 100;
            const done = sim.solvedCount >= sim.K;
            const stallTxt = done
                ? `peeling completed (100%)`
                : `stalled at step ${sim.stallAt} (${sim.recoveredPct.toFixed(1)}% recovered)`;

            const distTxt = distObj.type === 'robust'
                ? `robust soliton (c=${distObj.meta.c.toFixed(2)}, δ=${distObj.meta.delta.toFixed(2)}, spike≈d=${distObj.meta.kOverR})`
                : (distObj.type === 'ideal' ? 'ideal soliton' : 'RFC 6330 degree table');

            this.statsEl.textContent =
                `${distTxt} · E[d]≈${distObj.meanDegree.toFixed(2)} (sample≈${sim.realizedMeanDegree.toFixed(2)}) · ` +
                `M=${sim.M} (=K+${overheadSym}, +${overheadPct.toFixed(1)}%) · ` +
                `ripple start=${sim.initRipple}, max=${sim.maxRipple} · ${stallTxt}`;
        }
    },

    renderBarChart(barData, meanDegree) {
        const el = document.getElementById('degree-ripple-bar');
        if (!el) return;

        el.innerHTML = '';

        const width = el.clientWidth || 420;
        const height = el.clientHeight || 260;

        const margin = { top: 10, right: 14, bottom: 34, left: 46 };
        const innerW = Math.max(10, width - margin.left - margin.right);
        const innerH = Math.max(10, height - margin.top - margin.bottom);

        const svg = d3.select(el).append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${width} ${height}`);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const labels = barData.map(d => d.label);
        const x = d3.scaleBand().domain(labels).range([0, innerW]).padding(0.18);
        const yMax = (d3.max(barData, d => d.p) || 0) * 1.15;
        const y = d3.scaleLinear().domain([0, yMax || 1]).range([innerH, 0]).nice();

        const meanRounded = (() => {
            const nums = barData
                .filter(d => d.kind === 'degree')
                .map(d => d.degree)
                .filter(d => typeof d === 'number');
            if (nums.length === 0) return null;
            const maxNumeric = Math.max(...nums);
            return Math.max(1, Math.min(maxNumeric, Math.round(meanDegree)));
        })();

        g.append('g')
            .attr('transform', `translate(0,${innerH})`)
            .call(d3.axisBottom(x).tickSizeOuter(0))
            .call(ax => {
                ax.selectAll('.domain').attr('stroke', '#334155').attr('opacity', 0.8);
                ax.selectAll('.tick line').attr('stroke', '#1f2937');
                ax.selectAll('.tick text').attr('fill', '#64748b').attr('font-size', '10px');
            });

        g.append('g')
            .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('.0%')))
            .call(ax => {
                ax.selectAll('.domain').attr('stroke', '#334155').attr('opacity', 0.8);
                ax.selectAll('.tick line').attr('stroke', '#1f2937');
                ax.selectAll('.tick text').attr('fill', '#64748b').attr('font-size', '10px');
            });

        g.selectAll('rect')
            .data(barData)
            .enter()
            .append('rect')
            .attr('x', d => x(d.label))
            .attr('y', d => y(d.p))
            .attr('width', x.bandwidth())
            .attr('height', d => innerH - y(d.p))
            .attr('rx', 3)
            .attr('fill', d => {
                if (d.kind === 'tail') return '#475569';
                if (d.kind === 'spike') return '#10b981';
                if (d.kind === 'degree' && meanRounded && d.degree === meanRounded) return '#a855f7';
                return '#06b6d4';
            })
            .attr('opacity', 0.9);

        if (meanRounded) {
            const meanBar = barData.find(d => d.kind === 'degree' && d.degree === meanRounded);
            if (meanBar) {
                g.append('text')
                    .attr('x', (x(meanBar.label) ?? 0) + x.bandwidth() / 2)
                    .attr('y', Math.max(12, y(meanBar.p) - 6))
                    .attr('text-anchor', 'middle')
                    .attr('fill', '#a855f7')
                    .attr('font-size', 10)
                    .attr('font-family', 'monospace')
                    .text('mean');
            }
        }
    },

    renderRippleChart(sim) {
        const el = document.getElementById('degree-ripple-line');
        if (!el) return;

        el.innerHTML = '';

        const width = el.clientWidth || 420;
        const height = el.clientHeight || 260;

        const margin = { top: 10, right: 14, bottom: 34, left: 46 };
        const innerW = Math.max(10, width - margin.left - margin.right);
        const innerH = Math.max(10, height - margin.top - margin.bottom);

        const svg = d3.select(el).append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${width} ${height}`);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const series = sim.rippleSeries;
        const x = d3.scaleLinear().domain([0, sim.K]).range([0, innerW]);
        const yMax = (d3.max(series, d => d.ripple) || 0) * 1.15;
        const y = d3.scaleLinear().domain([0, yMax || 1]).range([innerH, 0]).nice();

        g.append('g')
            .attr('transform', `translate(0,${innerH})`)
            .call(d3.axisBottom(x).ticks(5).tickSizeOuter(0))
            .call(ax => {
                ax.selectAll('.domain').attr('stroke', '#334155').attr('opacity', 0.8);
                ax.selectAll('.tick line').attr('stroke', '#1f2937');
                ax.selectAll('.tick text').attr('fill', '#64748b').attr('font-size', '10px');
            });

        g.append('g')
            .call(d3.axisLeft(y).ticks(5))
            .call(ax => {
                ax.selectAll('.domain').attr('stroke', '#334155').attr('opacity', 0.8);
                ax.selectAll('.tick line').attr('stroke', '#1f2937');
                ax.selectAll('.tick text').attr('fill', '#64748b').attr('font-size', '10px');
            });

        const line = d3.line()
            .x(d => x(d.step))
            .y(d => y(d.ripple))
            .curve(d3.curveMonotoneX);

        g.append('path')
            .datum(series)
            .attr('fill', 'none')
            .attr('stroke', '#06b6d4')
            .attr('stroke-width', 2.2)
            .attr('opacity', 0.95)
            .attr('d', line);

        // Stall marker (if any)
        const done = sim.solvedCount >= sim.K;
        if (!done && sim.stallAt !== null) {
            const stallX = x(sim.stallAt);

            g.append('line')
                .attr('x1', stallX)
                .attr('x2', stallX)
                .attr('y1', 0)
                .attr('y2', innerH)
                .attr('stroke', '#ef4444')
                .attr('stroke-width', 1.5)
                .attr('stroke-dasharray', '4,4')
                .attr('opacity', 0.8);

            g.append('circle')
                .attr('cx', stallX)
                .attr('cy', y(0))
                .attr('r', 4.5)
                .attr('fill', '#ef4444')
                .attr('opacity', 0.95);

            g.append('text')
                .attr('x', Math.min(innerW - 4, stallX + 6))
                .attr('y', 12)
                .attr('fill', '#ef4444')
                .attr('font-size', 10)
                .attr('font-family', 'monospace')
                .text('stall');
        }
    }
};

// ============================================
// 6. TOY END-TO-END WALKTHROUGH (Interactive 04)
// ============================================
window.toyDecodeViz = {
    stepIdx: 0,
    steps: [],
    equations: [],
    _timer: null,

    init() {
        const container = document.getElementById('viz-toy-decode');
        if (!container) return;

        this.stepEl = document.getElementById('toy-decode-step');
        this.symbolsEl = document.getElementById('toy-decode-symbols');
        this.eqEl = document.getElementById('toy-decode-equations');
        this.statusEl = document.getElementById('toy-decode-status');

        this.buildScenario();
        this.stepIdx = 0;
        this.render();
    },

    hex(n) {
        return `0x${n.toString(16).toUpperCase().padStart(2, '0')}`;
    },

    buildScenario() {
        const A = 0x41; // 65
        const B = 0x42; // 66
        const C = 0x43; // 67
        const D = 0x44; // 68

        const P = A ^ C;       // precode parity: P = A ⊕ C
        const y3 = P ^ D;      // repair: y3 = P ⊕ D
        const y4 = A ^ B;      // repair: y4 = A ⊕ B

        this.equations = [
            { id: 'sysB', kind: 'systematic', text: `B = ${this.hex(B)} (${B})` },
            { id: 'sysD', kind: 'systematic', text: `D = ${this.hex(D)} (${D})` },
            { id: 'y3', kind: 'repair', text: `y3 = P ⊕ D = ${this.hex(y3)} (${y3})` },
            { id: 'y4', kind: 'repair', text: `y4 = A ⊕ B = ${this.hex(y4)} (${y4})` },
            { id: 'precode', kind: 'precode', text: `P = A ⊕ C` }
        ];

        // Snapshot-style steps (keeps rendering simple and audit-friendly).
        this.steps = [
            {
                activeEq: null,
                newSym: null,
                known: {},
                text:
                    `We want to recover the 4 one-byte source symbols A,B,C,D. ` +
                    `The sender also created a precode parity P = A ⊕ C. ` +
                    `We will receive a mix of systematic packets and repair packets, then combine them to solve everything.`
            },
            {
                activeEq: 'sysB',
                newSym: 'B',
                known: { B },
                text:
                    `Step 1: We receive a systematic packet that directly reveals B. ` +
                    `So B is now known: B = ${this.hex(B)} (${B}).`
            },
            {
                activeEq: 'sysD',
                newSym: 'D',
                known: { B, D },
                text:
                    `Step 2: We receive another systematic packet that directly reveals D. ` +
                    `Now we know B and D.`
            },
            {
                activeEq: 'y3',
                newSym: 'P',
                known: { B, D, P },
                text:
                    `Step 3: We receive a repair packet y3 = P ⊕ D = ${this.hex(y3)} (${y3}). ` +
                    `Because D is known, we can solve: ` +
                    `P = y3 ⊕ D = ${this.hex(y3)} ⊕ ${this.hex(D)} = ${this.hex(P)} (${P}).`
            },
            {
                activeEq: 'y4',
                newSym: 'A',
                known: { B, D, P, A },
                text:
                    `Step 4: We receive a repair packet y4 = A ⊕ B = ${this.hex(y4)} (${y4}). ` +
                    `Because B is known, we can solve: ` +
                    `A = y4 ⊕ B = ${this.hex(y4)} ⊕ ${this.hex(B)} = ${this.hex(A)} (${A}).`
            },
            {
                activeEq: 'precode',
                newSym: 'C',
                known: { B, D, P, A, C },
                text:
                    `Step 5: Now we use the precode constraint P = A ⊕ C. ` +
                    `Since A and P are known, we can solve: ` +
                    `C = A ⊕ P = ${this.hex(A)} ⊕ ${this.hex(P)} = ${this.hex(C)} (${C}). ` +
                    `We recovered C without ever receiving it directly.`
            },
            {
                activeEq: null,
                newSym: null,
                known: { B, D, P, A, C },
                text:
                    `Done: All source symbols A,B,C,D are known. ` +
                    `This is the "tail repair" idea in miniature: the fountain layer gives you most symbols cheaply, and the precode fills in the gaps.`
            }
        ];
    },

    render() {
        const step = this.steps[this.stepIdx];
        if (!step) return;

        if (this.stepEl) {
            this.stepEl.textContent = step.text;
        }

        const known = step.known || {};
        const symOrder = ['A', 'B', 'C', 'D', 'P'];

        if (this.symbolsEl) {
            const rows = symOrder.map(sym => {
                const val = known[sym];
                const isKnown = typeof val === 'number';
                const isNew = step.newSym === sym;
                const valTxt = isKnown ? `${this.hex(val)} (${val})` : '??';

                const rowCls = isNew
                    ? 'border border-emerald-500/30 bg-emerald-500/10'
                    : 'border border-white/5 bg-white/5';

                const symCls = isKnown ? 'text-white' : 'text-slate-500';
                const valCls = isKnown ? 'text-cyan-300' : 'text-slate-600';

                return `
                    <div class="flex items-center justify-between gap-4 px-3 py-2 rounded-lg ${rowCls}">
                        <div class="${symCls} font-bold">${sym}</div>
                        <div class="${valCls}">${valTxt}</div>
                    </div>
                `;
            }).join('');
            this.symbolsEl.innerHTML = `<div class="space-y-2">${rows}</div>`;
        }

        if (this.eqEl) {
            const eqHtml = this.equations.map(eq => {
                const isActive = step.activeEq === eq.id;
                const isUsed = this.isEquationUsed(eq.id);

                const border = isActive
                    ? 'border border-cyan-500/40'
                    : (isUsed ? 'border border-emerald-500/20' : 'border border-white/5');

                const bg = isActive
                    ? 'bg-cyan-500/10'
                    : (isUsed ? 'bg-emerald-500/5' : 'bg-white/5');

                const tag = eq.kind === 'systematic'
                    ? '<span class="text-[10px] uppercase tracking-widest text-slate-400">sys</span>'
                    : (eq.kind === 'precode'
                        ? '<span class="text-[10px] uppercase tracking-widest text-slate-400">pre</span>'
                        : '<span class="text-[10px] uppercase tracking-widest text-slate-400">rep</span>');

                const statusDot = isUsed
                    ? '<span class="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>'
                    : '<span class="w-2 h-2 rounded-full bg-slate-600 inline-block"></span>';

                return `
                    <div class="flex items-start justify-between gap-3 px-3 py-2 rounded-lg ${border} ${bg}">
                        <div class="flex items-center gap-2">${statusDot}${tag}</div>
                        <div class="flex-1 text-slate-200">${eq.text}</div>
                    </div>
                `;
            }).join('');
            this.eqEl.innerHTML = `<div class="space-y-2">${eqHtml}</div>`;
        }

        if (this.statusEl) {
            const knownCount = Object.keys(known).length;
            const total = 5;
            const done = knownCount >= total;
            const autoTxt = this._timer ? 'auto: ON' : 'auto: off';
            this.statusEl.textContent = `step ${this.stepIdx + 1}/${this.steps.length} · known ${knownCount}/${total} · ${done ? 'recovered all symbols' : 'still missing some'} · ${autoTxt}`;
        }
    },

    isEquationUsed(eqId) {
        // "Used" means it was the active equation at some previous step.
        for (let i = 0; i <= this.stepIdx; i++) {
            if (this.steps[i]?.activeEq === eqId) return true;
        }
        return false;
    },

    next() {
        if (this.stepIdx < this.steps.length - 1) {
            this.stepIdx++;
            this.render();
            return;
        }

        // If auto mode is running, stop at the end.
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
            this.render();
        }
    },

    prev() {
        if (this.stepIdx > 0) {
            this.stepIdx--;
            this.render();
        }
    },

    reset() {
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }
        this.stepIdx = 0;
        this.render();
    },

    auto() {
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
            this.render();
            return;
        }

        this._timer = setInterval(() => {
            if (this.stepIdx >= this.steps.length - 1) {
                clearInterval(this._timer);
                this._timer = null;
                this.render();
                return;
            }
            this.stepIdx++;
            this.render();
        }, 850);

        this.render();
    }
};
