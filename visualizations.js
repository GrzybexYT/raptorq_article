
// ============================================
// RAPTORQ VISUALIZATIONS - OMNI-ENHANCED
// ============================================

gsap.registerPlugin(ScrollTrigger);

const COLORS = {
    bg: '#020204',
    cyan: '#22d3ee',
    purple: '#a855f7',
    blue: '#3b82f6',
    white: '#f1f5f9',
    slate: '#64748b',
    emerald: '#10b981',
    red: '#ef4444',
    amber: '#f59e0b'
};

// Helper: Gaussian over GF(2) Rank
function getMatrixRank(rows, unknowns) {
    let matrix = rows.map(r => [...r.data]);
    let pivotRow = 0;
    let pivotMap = []; // track which row provided which pivot
    for (let col = 0; col < unknowns && pivotRow < matrix.length; col++) {
        let sel = pivotRow;
        while (sel < matrix.length && matrix[sel][col] === 0) sel++;
        if (sel < matrix.length) {
            [matrix[sel], matrix[pivotRow]] = [matrix[pivotRow], matrix[sel]];
            pivotMap.push({ row: pivotRow, col: col });
            for (let i = 0; i < matrix.length; i++) {
                if (i !== pivotRow && matrix[i][col] === 1) {
                    for (let j = col; j < unknowns; j++) matrix[i][j] ^= matrix[pivotRow][j];
                }
            }
            pivotRow++;
        }
    }
    return { rank: pivotRow, pivotMap };
}

// ============================================
// 1. HERO ANIMATION (THREE.JS) - CINEMATIC SYMBOL FLOW
// ============================================
window.initHero = function() {
    const container = document.getElementById('hero-canvas');
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;
    camera.position.y = 10;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Dynamic Symbol Points
    const count = 4000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = new Float32Array(count);
    
    const colorA = new THREE.Color(COLORS.cyan);
    const colorB = new THREE.Color(COLORS.purple);

    function resetPoint(i) {
        positions[i * 3] = (Math.random() - 0.5) * 100;
        positions[i * 3 + 1] = 60 + Math.random() * 40;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
        velocities[i] = 0.4 + Math.random() * 1.2;
        const mix = colorA.clone().lerp(colorB, Math.random());
        colors[i * 3] = mix.r;
        colors[i * 3 + 1] = mix.g;
        colors[i * 3 + 2] = mix.b;
    }

    for (let i = 0; i < count; i++) {
        resetPoint(i);
        positions[i * 3 + 1] = (Math.random() * 120) - 60;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Subtle ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

    function animate() {
        requestAnimationFrame(animate);
        const pos = particles.geometry.attributes.position.array;
        for (let i = 0; i < count; i++) {
            pos[i * 3 + 1] -= velocities[i];
            pos[i * 3] += Math.sin(Date.now() * 0.0005 + i) * 0.02;
            if (pos[i * 3 + 1] < -60) resetPoint(i);
        }
        particles.geometry.attributes.position.needsUpdate = true;
        particles.rotation.y += 0.001;
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
};

// ============================================
// 2. MATRIX VIZ - REAL-TIME GAUSSIAN REDUCTION
// ============================================
window.matrixViz = {
    unknowns: 4,
    rows: [],
    rank: 0,
    pivots: [],
    
    init() { this.render(); },
    reset() { this.rows = []; this.rank = 0; this.pivots = []; this.render(); },

    step() {
        if (this.rows.length >= 8) return; 
        const rowData = Array.from({length: this.unknowns}, () => Math.random() > 0.6 ? 1 : 0);
        if (rowData.every(x => x === 0)) rowData[Math.floor(Math.random()*this.unknowns)] = 1;
        
        const id = 'row-' + Date.now();
        this.rows.push({ data: rowData, id });
        const analysis = getMatrixRank(this.rows, this.unknowns);
        this.rank = analysis.rank;
        this.pivots = analysis.pivotMap;
        this.render();
        
        // GSAP entry
        gsap.from(`#${id}`, { x: -60, opacity: 0, scale: 0.9, duration: 0.7, ease: "back.out(1.5)" });
        gsap.from(`#${id} .data-grid-cell`, { 
            scale: 0, rotateY: 90, stagger: 0.08, duration: 0.5, delay: 0.2, ease: "expo.out" 
        });
    },

    render() {
        const container = document.getElementById('matrix-render-area');
        const status = document.getElementById('rank-status');
        
        if (status) {
            status.innerHTML = `RANK: ${this.rank} / ${this.unknowns}`;
            status.className = this.rank >= this.unknowns 
                ? "stat-value text-cyan-400 drop-shadow-[0_0_30px_rgba(34,211,238,0.5)] animate-pulse"
                : "stat-value text-slate-800 transition-all duration-1000";
        }

        let html = '';
        this.rows.forEach((row, rIdx) => {
            const hasPivot = this.pivots.some(p => p.row === rIdx);
            html += `<div id="${row.id}" class="flex items-center gap-10 mb-8 group relative">`;
            
            // Grid
            html += `<div class="flex gap-4 p-3 bg-white/[0.02] rounded-2xl border border-white/5 transition-all group-hover:border-white/10 shadow-xl backdrop-blur-md">`;
            row.data.forEach((val, cIdx) => {
                const isPivot = this.pivots.some(p => p.row === rIdx && p.col === cIdx);
                const cellClass = val ? 'cell-1' : 'cell-0';
                const pivotClass = isPivot ? 'cell-pivot' : '';
                html += `<div class="data-grid-cell ${cellClass} ${pivotClass}">${val}</div>`;
            });
            html += `</div>`;
            
            // Equation Status
            html += `<div class="flex flex-col gap-1 min-w-[140px]">
                <span class="text-[10px] font-mono text-slate-600 font-black uppercase tracking-[0.3em]">Packet ${rIdx+1}</span>
                <span class="text-[9px] font-mono ${hasPivot ? 'text-cyan-400' : 'text-red-500'} font-bold uppercase tracking-widest">
                    ${hasPivot ? 'Information Gain' : 'Rank Deficient'}
                </span>
            </div>`;
            html += `</div>`;
        });
        
        if (this.rows.length === 0) {
            html = `<div class="flex flex-col items-center justify-center py-32 opacity-20 border-2 border-dashed border-white/5 rounded-[3rem]">
                <div class="text-sm font-mono uppercase tracking-[0.8em] animate-pulse">Awaiting Stream...</div>
            </div>`;
        }
        container.innerHTML = html;
    }
};

// ============================================
// 3. DEGREE RIPPLE - CASCADE SIMULATION
// ============================================
window.degreeRippleViz = {
    dist: 'rfc6330',
    K: 800,
    overheadPct: 5,

    init() {
        this.statsEl = document.getElementById('degree-ripple-stats');
        this.simulate();
    },

    setDist(v) { this.dist = v; this.simulate(); },
    setK(k) { this.K = k; this.simulate(); },
    setOverhead(pct) { this.overheadPct = pct; this.simulate(); },

    simulate() {
        const dist = this.getDistribution();
        const sim = this.runSimulation(dist);
        this.render(dist, sim);
        if (this.statsEl) {
            const mCount = Math.ceil(this.K * (1 + this.overheadPct / 100));
            this.statsEl.innerHTML = `Variables: ${this.K} | Equations: ${mCount} | overhead: ${this.overheadPct}% | success: <span class="text-white font-black">${sim.recoveredPct.toFixed(1)}%</span>`;
        }
    },

    getDistribution() {
        const labels = d3.range(1, 16).map(String);
        let p = [];
        if (this.dist === 'rfc6330') {
            p = [0.005, 0.49, 0.16, 0.08, 0.05, 0.04, 0.03, 0.02, 0.015, 0.01, 0.01, 0.01, 0.01, 0.01, 0.06];
        } else if (this.dist === 'robust') {
            p = labels.map(d => (1/d) * Math.exp(-d/6));
            const s = d3.sum(p);
            p = p.map(v => v/s);
        } else {
            p = labels.map(d => d === '1' ? 1/this.K : 1/(d*(d-1)));
            const s = d3.sum(p);
            p = p.map(v => v/s);
        }
        return { p, labels };
    },

    runSimulation(dist) {
        const steps = 100;
        const ripple = [];
        let currentRipple = Math.ceil(this.K * dist.p[0] * 1.8);
        let solved = 0;
        for (let i = 0; i < steps; i++) {
            const progress = i / steps;
            if (progress < 0.85) {
                currentRipple += (Math.random() - 0.45) * (this.K / 35);
            } else {
                currentRipple *= 0.7; 
            }
            if (currentRipple < 0) currentRipple = 0;
            ripple.push({ step: i * (this.K / steps), ripple: currentRipple });
            if (currentRipple > 0) solved += (this.K / steps);
        }
        return { rippleSeries: ripple, recoveredPct: Math.min(100, (solved / this.K) * 100) };
    },

    render(dist, sim) {
        const b = document.getElementById('degree-ripple-bar');
        const l = document.getElementById('degree-ripple-line');
        if (!b || !l) return;
        
        // Bars
        b.innerHTML = '';
        const wB = b.clientWidth, hB = b.clientHeight;
        const svgB = d3.select(b).append("svg").attr("width", wB).attr("height", hB);
        const xB = d3.scaleBand().domain(dist.labels).range([60, wB-20]).padding(0.4);
        const yB = d3.scaleLinear().domain([0, d3.max(dist.p)]).range([hB-60, 30]);
        svgB.append("g").attr("transform", `translate(0, ${hB-60})`).call(d3.axisBottom(xB)).attr("color", "#222");
        svgB.selectAll("rect").data(dist.p).enter().append("rect")
            .attr("x", (d,i) => xB(dist.labels[i])).attr("y", d => yB(d))
            .attr("width", xB.bandwidth()).attr("height", d => Math.max(0, hB-60-yB(d)))
            .attr("fill", COLORS.cyan).attr("rx", 6).attr("opacity", 0.8);

        // Line
        l.innerHTML = '';
        const wL = l.clientWidth, hL = l.clientHeight;
        const svgL = d3.select(l).append("svg").attr("width", wL).attr("height", hL);
        const xL = d3.scaleLinear().domain([0, this.K]).range([60, wL-20]);
        const yL = d3.scaleLinear().domain([0, d3.max(sim.rippleSeries, d => d.ripple)]).range([hL-60, 30]);
        const line = d3.line().x(d => xL(d.step)).y(d => yL(d.ripple)).curve(d3.curveBasis);
        svgL.append("path").datum(sim.rippleSeries).attr("fill", "none").attr("stroke", COLORS.purple).attr("stroke-width", 4).attr("d", line)
            .attr("stroke-linecap", "round").attr("class", "ripple-path shadow-lg");
        const total = svgL.select(".ripple-path").node().getTotalLength();
        svgL.select(".ripple-path").attr("stroke-dasharray", total).attr("stroke-dashoffset", total)
            .transition().duration(2000).ease(d3.easeCubicInOut).attr("stroke-dashoffset", 0);
    }
};

// ============================================
// 4. PEELING VIZ - HIGH-FIDELITY GRAPH PHYSICS
// ============================================
window.peelingViz = {
    init() {
        const c = document.getElementById('peeling-canvas');
        if (!c) return;
        this.w = c.clientWidth; this.h = c.clientHeight;
        this.svg = d3.select(c).append("svg").attr("width", "100%").attr("height", "100%");
        this.reset();
    },

    reset() {
        this.svg.selectAll("*").remove();
        this.nodes = []; this.links = [];
        const K = 12, M = 18;
        for(let i=0; i<K; i++) this.nodes.push({ id: `s${i}`, type: 'src', solved: false, x: 200, y: Math.random() * this.h });
        for(let i=0; i<M; i++) {
            const d = Math.random() > 0.8 ? 1 : (Math.random() > 0.5 ? 2 : 3);
            const n = { id: `p${i}`, type: 'pkt', deg: d, x: this.w-200, y: Math.random() * this.h };
            this.nodes.push(n);
            d3.shuffle(d3.range(K)).slice(0, d).forEach(s => this.links.push({ source: `s${s}`, target: n.id }));
        }
        this.simulation = d3.forceSimulation(this.nodes)
            .force("link", d3.forceLink(this.links).id(d => d.id).distance(90))
            .force("charge", d3.forceManyBody().strength(-500))
            .force("center", d3.forceCenter(this.w / 2, this.h / 2))
            .on("tick", () => this.render());
    },

    render() {
        const link = this.svg.selectAll(".link").data(this.links, d => d.source.id + d.target.id);
        link.enter().append("line").attr("class", "link").attr("stroke", "#1e293b").attr("stroke-width", 2.5).attr("opacity", 0.4).merge(link)
            .attr("x1", d => d.source.x).attr("y1", d => d.source.y).attr("x2", d => d.target.x).attr("y2", d => d.target.y);
        link.exit().remove();

        const node = this.svg.selectAll(".node").data(this.nodes, d => d.id);
        const nodeEnter = node.enter().append("g").attr("class", "node");
        nodeEnter.append("circle").attr("r", d => d.type==='src'? 20 : 14).attr("stroke", "#334155").attr("stroke-width", 3);
        const merged = nodeEnter.merge(node);
        merged.attr("transform", d => `translate(${d.x}, ${d.y})`);
        merged.select("circle")
            .attr("fill", d => d.type==='src' ? (d.solved ? COLORS.emerald : COLORS.bg) : (d.deg === 1 ? COLORS.cyan : COLORS.blue))
            .attr("stroke", d => (d.deg === 1 || d.solved) ? COLORS.white : "#334155")
            .attr("opacity", d => d.type==='pkt' && d.deg===0 ? 0 : 1)
            .style("filter", d => (d.deg===1||d.solved) ? `drop-shadow(0 0 10px ${d.solved?COLORS.emerald:COLORS.cyan})` : 'none');
        node.exit().remove();
    },

    step() {
        const pivot = this.nodes.find(n => n.type === 'pkt' && n.deg === 1);
        if (!pivot) return;
        const edge = this.links.find(l => l.target.id === pivot.id);
        const source = edge.source;
        source.solved = true;
        gsap.to(`.link`, { opacity: 1, stroke: COLORS.white, duration: 0.2, repeat: 1, yoyo: true });
        this.links.filter(l => l.source.id === source.id).forEach(l => l.target.deg--);
        this.links = this.links.filter(l => l.source.id !== source.id);
        pivot.deg = 0;
        this.simulation.alpha(0.5).restart();
    }
};

// ============================================
// 5. PRECODE VISUALIZATION - INTERACTIVE REPAIR
// ============================================
window.precodeViz = {
    init() { this.svg = d3.select("#precode-svg"); this.reset(); },
    reset() { this.svg.selectAll("*").remove(); },
    animate() {
        this.reset();
        const K = 30, P = 6, L = K+P, size = 10, step = 14;
        const g = this.svg.append("g").attr("transform", "translate(80, 40)");
        
        // Symbols
        const data = d3.range(L).map(i => ({ i, type: i<K?'src':'par' }));
        const rects = g.selectAll("rect").data(data).enter().append("rect")
            .attr("y", d => d.i * step).attr("width", size).attr("height", size)
            .attr("fill", d => d.type==='src'?COLORS.blue:COLORS.purple).attr("rx", 3).attr("opacity", 0);
        rects.transition().duration(400).delay(d => d.i * 20).attr("opacity", 1);

        // Stalled Channel
        setTimeout(() => {
            const rx = g.selectAll(".rx").data(data.filter(d=>d.i!==12 && d.i!==22)).enter().append("rect")
                .attr("class", "rx").attr("x", 400).attr("y", d => d.i * step).attr("width", size).attr("height", size)
                .attr("fill", d => d.type==='src'?COLORS.blue:COLORS.purple).attr("rx", 3).attr("opacity", 0);
            rx.transition().duration(600).delay(d => d.i * 10).attr("opacity", 1);
            
            [12, 22].forEach(i => {
                g.append("rect").attr("x", 400).attr("y", i*step).attr("width", size).attr("height", size)
                    .attr("fill", "none").attr("stroke", COLORS.red).attr("stroke-width", 2).attr("stroke-dasharray", "4,2").attr("class", "pulse-red");
            });
            gsap.to(".pulse-red", { opacity: 0.2, repeat: -1, yoyo: true, duration: 0.5 });
        }, 1500);

        // Repair Sequence
        setTimeout(() => {
            // Repair path 1
            const path1 = g.append("path").attr("d", `M 15 ${K*step} C 250 ${K*step}, 250 ${12*step}, 400 ${12*step+5}`).attr("fill", "none").attr("stroke", COLORS.emerald).attr("stroke-width", 3).attr("stroke-dasharray", "10,5").attr("opacity", 0);
            path1.transition().duration(800).attr("opacity", 1);
            g.append("rect").attr("x", 400).attr("y", 12*step).attr("width", size).attr("height", size).attr("fill", COLORS.emerald).attr("rx", 3).attr("opacity", 0).transition().delay(600).duration(400).attr("opacity", 1);
            
            // Repair path 2
            const path2 = g.append("path").attr("d", `M 15 ${(K+1)*step} C 250 ${(K+1)*step}, 250 ${22*step}, 400 ${22*step+5}`).attr("fill", "none").attr("stroke", COLORS.emerald).attr("stroke-width", 3).attr("stroke-dasharray", "10,5").attr("opacity", 0);
            path2.transition().delay(800).duration(800).attr("opacity", 1);
            g.append("rect").attr("x", 400).attr("y", 22*step).attr("width", size).attr("height", size).attr("fill", COLORS.emerald).attr("rx", 3).attr("opacity", 0).transition().delay(1400).duration(400).attr("opacity", 1);
        }, 3000);
    }
};

// ============================================
// 6. TOY DECODE - CINEMATIC MATH TRACE
// ============================================
window.toyDecodeViz = {
    stepIdx: 0,
    init() { this.build(); this.render(); },
    build() {
        const A=0x41, B=0x42, C=0x43, D=0x44, P=0x02;
        this.steps = [
            { t: "K=4 block initialized. Precode generates insurance parity P = A ⊕ C = 0x02.", k: {}, eqs: [] },
            { t: "Packet 1 arrives: Systematic symbol B = 0x42 is added to memory.", k: { B }, a: 'B', eqs: ["B = 0x42"] },
            { t: "Packet 2 arrives: Systematic symbol D = 0x44 is added to memory.", k: { B, D }, a: 'D', eqs: ["B = 0x42", "D = 0x44"] },
            { t: "Packet 3 (Repair) arrives: y3 = P ⊕ D = 0x46. Since D is known, we solve P = y3 ⊕ D = 0x02.", k: { B, D, P }, a: 'P', eqs: ["B = 0x42", "D = 0x44", "y3 = P ⊕ D = 0x46"] },
            { t: "Packet 4 (Repair) arrives: y4 = A ⊕ B = 0x03. Since B is known, we solve A = y4 ⊕ B = 0x41.", k: { A, B, D, P }, a: 'A', eqs: ["B = 0x42", "D = 0x44", "y3 = P ⊕ D = 0x46", "y4 = A ⊕ B = 0x03"] },
            { t: "DECODE FINAL: Using Precode P = A ⊕ C, we solve C = A ⊕ P = 0x43. File reconstructed.", k: { A, B, C, D, P }, a: 'C', eqs: ["B = 0x42", "D = 0x44", "y3 = P ⊕ D = 0x46", "y4 = A ⊕ B = 0x03", "P = A ⊕ C = 0x02"] }
        ];
    },
    render() {
        const s = this.steps[this.stepIdx];
        document.getElementById('toy-decode-step').innerHTML = s.t;
        let h = '<div class="grid grid-cols-5 gap-8">';
        ['A','B','C','D','P'].forEach(k => {
            const v = s.k[k] !== undefined;
            const active = s.a === k;
            const bg = active ? 'bg-cyan-400/10 border-cyan-400 shadow-[0_0_50px_rgba(34,211,238,0.25)] scale-105' : (v ? 'bg-emerald-500/5 border-emerald-500/30 shadow-inner' : 'bg-white/[0.02] border-white/5');
            h += `<div class="p-10 rounded-[3rem] border-2 ${bg} transition-all duration-1000 flex flex-col items-center justify-center">
                <div class="text-[12px] text-slate-500 font-black tracking-[0.5em] mb-6 uppercase">${k}</div>
                <div class="font-mono text-3xl ${v ? 'text-white' : 'text-slate-800'} font-bold">${v ? '0x'+s.k[k].toString(16).toUpperCase() : '??'}</div>
            </div>`;
        });
        h += '</div>';
        document.getElementById('toy-decode-symbols').innerHTML = h;
        let eqH = '<div class="flex flex-wrap gap-4 mt-12">';
        s.eqs.forEach(eq => eqH += `<div class="px-8 py-4 rounded-3xl bg-white/[0.02] border border-white/10 text-sm text-slate-400 font-mono font-black tracking-widest uppercase shadow-xl backdrop-blur-md hover:border-cyan-500/30 transition-all">${eq}</div>`);
        eqH += '</div>';
        document.getElementById('toy-decode-equations').innerHTML = eqH;
        document.getElementById('toy-decode-status').innerHTML = `TRACE CYCLE: ${this.stepIdx + 1} / ${this.steps.length}`;
    },
    next() { if(this.stepIdx < this.steps.length-1) { this.stepIdx++; this.render(); } },
    prev() { if(this.stepIdx > 0) { this.stepIdx--; this.render(); } },
    auto() { 
        if(this.timer) { clearInterval(this.timer); this.timer=null; document.getElementById('btn-toy-auto').innerText = "Auto Play"; }
        else { 
            document.getElementById('btn-toy-auto').innerText = "Stop";
            this.timer = setInterval(() => { if(this.stepIdx >= this.steps.length-1) this.stepIdx=-1; this.next(); }, 2000); 
        }
    }
};

window.addEventListener('load', () => {
    initHero(); matrixViz.init(); precodeViz.init(); peelingViz.init(); degreeRippleViz.init(); toyDecodeViz.init();
});
