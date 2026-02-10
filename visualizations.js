
// ============================================
// RAPTORQ VISUALIZATIONS - ULTRA ENHANCED
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
    red: '#ef4444'
};

// ============================================
// 1. HERO ANIMATION (THREE.JS) - THE DATA RAIN
// ============================================
window.initHero = function() {
    const container = document.getElementById('hero-canvas');
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 60;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Geometry for symbols
    const count = 3000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    
    const colorA = new THREE.Color(COLORS.cyan);
    const colorB = new THREE.Color(COLORS.purple);

    for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 120;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 120;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
        
        velocities[i] = 0.1 + Math.random() * 0.4;
        
        const mix = colorA.clone().lerp(colorB, Math.random());
        colors[i * 3] = mix.r;
        colors[i * 3 + 1] = mix.g;
        colors[i * 3 + 2] = mix.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Subtle Grid Floor
    const grid = new THREE.GridHelper(200, 40, COLORS.cyan, '#111');
    grid.position.y = -50;
    grid.material.opacity = 0.1;
    grid.material.transparent = true;
    scene.add(grid);

    function animate() {
        requestAnimationFrame(animate);
        const pos = points.geometry.attributes.position.array;
        for (let i = 0; i < count; i++) {
            pos[i * 3 + 1] -= velocities[i];
            if (pos[i * 3 + 1] < -60) {
                pos[i * 3 + 1] = 60;
            }
        }
        points.geometry.attributes.position.needsUpdate = true;
        points.rotation.y += 0.001;
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
// 2. MATRIX VISUALIZATION - GAUSSIAN PIVOTING
// ============================================
window.matrixViz = {
    unknowns: 4,
    rows: [],
    rank: 0,
    pivots: [],
    
    init() {
        this.render();
    },

    reset() {
        this.rows = [];
        this.rank = 0;
        this.pivots = [];
        this.render();
    },

    step() {
        if (this.rows.length >= 8) return; 
        const row = Array.from({length: this.unknowns}, () => Math.random() > 0.6 ? 1 : 0);
        if (row.every(x => x === 0)) row[Math.floor(Math.random() * this.unknowns)] = 1;
        
        const id = 'row-' + Date.now();
        this.rows.push({ data: row, id });
        this.calculateRank();
        this.render();
        
        // GSAP reveal
        gsap.from(`#${id}`, { x: -40, opacity: 0, duration: 0.6, ease: "expo.out" });
        gsap.from(`#${id} .data-grid-cell`, { 
            scale: 0, rotate: -45, stagger: 0.05, duration: 0.5, ease: "back.out(2)" 
        });
    },

    calculateRank() {
        let matrix = this.rows.map(r => [...r.data]);
        let pivotRow = 0;
        this.pivots = [];
        for (let col = 0; col < this.unknowns && pivotRow < matrix.length; col++) {
            let sel = pivotRow;
            while (sel < matrix.length && matrix[sel][col] === 0) sel++;
            if (sel < matrix.length) {
                [matrix[sel], matrix[pivotRow]] = [matrix[pivotRow], matrix[sel]];
                this.pivots.push({ row: pivotRow, col: col });
                for (let i = 0; i < matrix.length; i++) {
                    if (i !== pivotRow && matrix[i][col] === 1) {
                        for (let j = col; j < this.unknowns; j++) matrix[i][j] ^= matrix[pivotRow][j];
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
        
        if (status) {
            status.innerHTML = `RANK: ${this.rank} / ${this.unknowns}`;
            status.className = this.rank >= this.unknowns 
                ? "text-6xl font-black text-cyan-400 drop-shadow-[0_0_30px_rgba(34,211,238,0.5)] animate-pulse"
                : "text-6xl font-black text-slate-800 tracking-tighter transition-all duration-700";
        }

        let html = '';
        this.rows.forEach((row, rIdx) => {
            html += `<div id="${row.id}" class="flex items-center gap-8 mb-6 group">`;
            html += `<div class="flex gap-3 p-2 bg-white/[0.02] rounded-2xl border border-white/5 transition-all group-hover:border-white/10 shadow-inner">`;
            row.data.forEach((val, cIdx) => {
                const isPivot = this.pivots.some(p => p.row === rIdx && p.col === cIdx);
                const cellClass = val ? 'cell-1' : 'cell-0';
                const pivotClass = isPivot ? 'ring-4 ring-cyan-400 ring-offset-4 ring-offset-black z-10' : '';
                html += `<div class="data-grid-cell ${cellClass} ${pivotClass}">${val}</div>`;
            });
            html += `</div>`;
            html += `
                <div class="flex flex-col gap-1">
                    <span class="text-[10px] font-mono text-slate-600 font-bold uppercase tracking-[0.2em]">Packet ${rIdx+1}</span>
                    <span class="text-[9px] font-mono text-cyan-500/50 uppercase tracking-widest">${this.pivots.some(p=>p.row===rIdx)?'Linearly Independent':'Dependent'}</span>
                </div>`;
            html += `</div>`;
        });
        
        if (this.rows.length === 0) {
            html = `<div class="flex flex-col items-center justify-center py-32 opacity-20 border-2 border-dashed border-white/5 rounded-[3rem]">
                <div class="text-sm font-mono uppercase tracking-[0.6em] animate-pulse">Waiting for Data...</div>
            </div>`;
        }
        container.innerHTML = html;
    }
};

// ============================================
// 3. DEGREE RIPPLE - REAL-TIME GRAPH SIM
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
            this.statsEl.innerHTML = `SYMBOLS: ${this.K} | PACKETS: ${mCount} | RECOVERED: <span class="text-cyan-400 font-bold">${sim.recoveredPct.toFixed(1)}%</span>`;
        }
    },

    getDistribution() {
        const labels = d3.range(1, 13).map(String);
        let p = [];
        if (this.dist === 'rfc6330') {
            p = [0.005, 0.49, 0.16, 0.08, 0.05, 0.04, 0.03, 0.02, 0.015, 0.01, 0.01, 0.09];
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
        const M = Math.ceil(this.K * (1 + this.overheadPct / 100));
        let solved = 0;
        const ripple = [];
        let currentRipple = Math.ceil(this.K * dist.p[0] * (M/this.K)); // rough initial degree-1
        
        for (let i = 0; i < 100; i++) {
            const progress = i / 100;
            // Simulated Soliton cascade
            if (progress < 0.9) {
                currentRipple += (Math.random() - 0.4) * (this.K / 50);
            } else {
                currentRipple *= 0.8;
            }
            if (currentRipple < 0) currentRipple = 0;
            ripple.push({ step: i * (this.K/100), ripple: currentRipple });
            if (currentRipple > 0) solved += (this.K / 100);
        }
        
        return { rippleSeries: ripple, recoveredPct: Math.min(100, (solved / this.K) * 100) };
    },

    render(dist, sim) {
        const b = document.getElementById('degree-ripple-bar');
        const l = document.getElementById('degree-ripple-line');
        if (!b || !l) return;
        
        this.renderBars(b, dist);
        this.renderLine(l, sim);
    },

    renderBars(el, dist) {
        el.innerHTML = '';
        const w = el.clientWidth, h = el.clientHeight;
        const svg = d3.select(el).append("svg").attr("width", w).attr("height", h);
        const x = d3.scaleBand().domain(dist.labels).range([60, w-20]).padding(0.4);
        const y = d3.scaleLinear().domain([0, d3.max(dist.p)]).range([h-60, 30]);

        svg.append("g").attr("transform", `translate(0, ${h-60})`).call(d3.axisBottom(x)).attr("color", "#222");
        svg.selectAll("rect").data(dist.p).enter().append("rect")
            .attr("x", (d,i) => x(dist.labels[i])).attr("y", d => y(d))
            .attr("width", x.bandwidth()).attr("height", d => Math.max(0, h-60-y(d)))
            .attr("fill", COLORS.cyan).attr("rx", 6).attr("opacity", 0.8);
    },

    renderLine(el, sim) {
        el.innerHTML = '';
        const w = el.clientWidth, h = el.clientHeight;
        const svg = d3.select(el).append("svg").attr("width", w).attr("height", h);
        const x = d3.scaleLinear().domain([0, this.K]).range([60, w-20]);
        const y = d3.scaleLinear().domain([0, d3.max(sim.rippleSeries, d => d.ripple)]).range([h-60, 30]);

        const line = d3.line().x(d => x(d.step)).y(d => y(d.ripple)).curve(d3.curveBasis);
        svg.append("path").datum(sim.rippleSeries).attr("fill", "none").attr("stroke", COLORS.purple).attr("stroke-width", 4).attr("d", line)
            .attr("stroke-linecap", "round").attr("class", "ripple-path");
            
        const total = svg.select(".ripple-path").node().getTotalLength();
        svg.select(".ripple-path").attr("stroke-dasharray", total).attr("stroke-dashoffset", total)
            .transition().duration(2000).ease(d3.easeCubicInOut).attr("stroke-dashoffset", 0);
    }
};

// ============================================
// 4. PEELING VISUALIZATION - FORCE-DIRECTED
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
        
        for(let i=0; i<K; i++) this.nodes.push({ id: `s${i}`, type: 'src', solved: false, x: 200, y: this.h/2 });
        for(let i=0; i<M; i++) {
            const d = Math.random() > 0.8 ? 1 : (Math.random() > 0.5 ? 2 : 3);
            const n = { id: `p${i}`, type: 'pkt', deg: d, x: this.w-200, y: this.h/2 };
            this.nodes.push(n);
            d3.shuffle(d3.range(K)).slice(0, d).forEach(s => this.links.push({ source: `s${s}`, target: n.id }));
        }

        this.simulation = d3.forceSimulation(this.nodes)
            .force("link", d3.forceLink(this.links).id(d => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(this.w / 2, this.h / 2))
            .on("tick", () => this.render());
    },

    render() {
        const link = this.svg.selectAll(".link").data(this.links, d => d.source.id + d.target.id);
        link.enter().append("line")
            .attr("class", "link")
            .attr("stroke", "#1e293b")
            .attr("stroke-width", 2)
            .attr("opacity", 0.4)
            .merge(link)
            .attr("x1", d => d.source.x).attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
        link.exit().remove();

        const node = this.svg.selectAll(".node").data(this.nodes, d => d.id);
        const nodeEnter = node.enter().append("g").attr("class", "node");
        
        nodeEnter.append("circle").attr("r", d => d.type==='src'? 16 : 12)
            .attr("stroke", "#334155").attr("stroke-width", 3);
            
        const merged = nodeEnter.merge(node);
        merged.attr("transform", d => `translate(${d.x}, ${d.y})`);
        merged.select("circle")
            .attr("fill", d => {
                if(d.type==='src') return d.solved ? COLORS.emerald : COLORS.bg;
                return d.deg === 1 ? COLORS.cyan : COLORS.blue;
            })
            .attr("stroke", d => (d.deg === 1 || d.solved) ? COLORS.white : "#334155")
            .attr("opacity", d => d.type==='pkt' && d.deg===0 ? 0 : 1);
            
        node.exit().remove();
    },

    step() {
        const pivot = this.nodes.find(n => n.type === 'pkt' && n.deg === 1);
        if (!pivot) return;
        
        const edge = this.links.find(l => l.target.id === pivot.id);
        const source = edge.source;
        source.solved = true;
        
        // Peel logic
        this.links.filter(l => l.source.id === source.id).forEach(l => {
            l.target.deg--;
        });
        
        this.links = this.links.filter(l => l.source.id !== source.id);
        pivot.deg = 0;
        
        this.simulation.alpha(0.3).restart();
    }
};

// ============================================
// 5. PRECODE VISUALIZATION
// ============================================
window.precodeViz = {
    init() { this.svg = d3.select("#precode-svg"); this.reset(); },
    reset() { this.svg.selectAll("*").remove(); },
    animate() {
        this.reset();
        const K = 30, P = 6, L = K+P, size = 10, step = 14;
        const g = this.svg.append("g").attr("transform", "translate(80, 40)");
        
        // Matrix Block
        const data = d3.range(L).map(i => ({ i, type: i<K?'src':'par' }));
        const rects = g.selectAll("rect").data(data).enter().append("rect")
            .attr("y", d => d.i * step).attr("width", size).attr("height", size)
            .attr("fill", d => d.type==='src'?COLORS.blue:COLORS.purple).attr("rx", 3).attr("opacity", 0);
            
        rects.transition().duration(400).delay(d => d.i * 20).attr("opacity", 1);

        // Simulated Transfer
        setTimeout(() => {
            const rx = g.selectAll(".rx").data(data.filter(d=>d.i!==15)).enter().append("rect")
                .attr("class", "rx").attr("x", 400).attr("y", d => d.i * step).attr("width", size).attr("height", size)
                .attr("fill", d => d.type==='src'?COLORS.blue:COLORS.purple).attr("rx", 3).attr("opacity", 0);
            rx.transition().duration(600).delay(d => d.i * 10).attr("opacity", 1);
            
            g.append("rect").attr("x", 400).attr("y", 15*step).attr("width", size).attr("height", size).attr("fill", "none").attr("stroke", COLORS.red).attr("stroke-width", 2).attr("stroke-dasharray", "4,2");
        }, 1500);

        // Repair Path
        setTimeout(() => {
            g.append("path").attr("d", `M 15 ${K*step} C 250 ${K*step}, 250 ${15*step}, 400 ${15*step+5}`).attr("fill", "none").attr("stroke", COLORS.emerald).attr("stroke-width", 3).attr("stroke-dasharray", "6,3").attr("opacity", 0)
                .transition().duration(1000).attr("opacity", 1);
            g.append("rect").attr("x", 400).attr("y", 15*step).attr("width", size).attr("height", size).attr("fill", COLORS.emerald).attr("rx", 3).attr("opacity", 0)
                .transition().delay(800).duration(500).attr("opacity", 1);
        }, 3000);
    }
};

// ============================================
// 6. TOY DECODE
// ============================================
window.toyDecodeViz = {
    stepIdx: 0,
    init() { this.build(); this.render(); },
    build() {
        const A=0x41, B=0x42, C=0x43, D=0x44, P=0x02;
        this.steps = [
            { t: "K=4 block initialized. Precode P = A ⊕ C = 0x02 generated.", k: {}, eqs: [] },
            { t: "Packet 1 received: Systematic B = 0x42.", k: { B }, a: 'B', eqs: ["B = 0x42"] },
            { t: "Packet 2 received: Systematic D = 0x44.", k: { B, D }, a: 'D', eqs: ["B = 0x42", "D = 0x44"] },
            { t: "Repair y3 = P ⊕ D = 0x46 received. Solve P = y3 ⊕ D = 0x02.", k: { B, D, P }, a: 'P', eqs: ["B = 0x42", "D = 0x44", "y3 = P ⊕ D = 0x46"] },
            { t: "Repair y4 = A ⊕ B = 0x03 received. Solve A = y4 ⊕ B = 0x41.", k: { A, B, D, P }, a: 'A', eqs: ["B = 0x42", "D = 0x44", "y3 = P ⊕ D = 0x46", "y4 = A ⊕ B = 0x03"] },
            { t: "Apply Precode: P = A ⊕ C. Solve C = A ⊕ P = 0x43.", k: { A, B, C, D, P }, a: 'C', eqs: ["B = 0x42", "D = 0x44", "y3 = P ⊕ D = 0x46", "y4 = A ⊕ B = 0x03", "P = A ⊕ C = 0x02"] }
        ];
    },
    render() {
        const s = this.steps[this.stepIdx];
        document.getElementById('toy-decode-step').innerHTML = s.t;
        let h = '<div class="grid grid-cols-5 gap-4">';
        ['A','B','C','D','P'].forEach(k => {
            const v = s.k[k] !== undefined;
            const active = s.a === k;
            h += `<div class="p-6 rounded-3xl border-2 ${active ? 'border-cyan-400 bg-cyan-400/10 shadow-[0_0_30px_rgba(34,211,238,0.3)]' : (v ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/5 bg-white/5')} transition-all duration-700">
                <div class="text-[10px] text-slate-500 font-black tracking-[0.3em] mb-2">${k}</div>
                <div class="font-mono text-xl ${v ? 'text-white' : 'text-slate-800'}">${v ? '0x'+s.k[k].toString(16).toUpperCase() : '??'}</div>
            </div>`;
        });
        h += '</div>';
        document.getElementById('toy-decode-symbols').innerHTML = h;
        
        let eqH = '<div class="flex flex-wrap gap-3">';
        s.eqs.forEach(eq => eqH += `<div class="px-4 py-2 rounded-full bg-white/[0.03] border border-white/5 text-[10px] text-slate-400 font-mono font-bold tracking-widest uppercase">${eq}</div>`);
        eqH += '</div>';
        document.getElementById('toy-decode-equations').innerHTML = eqH;
        document.getElementById('toy-decode-status').innerHTML = `TRACE: STEP ${this.stepIdx + 1} / ${this.steps.length}`;
    },
    next() { if(this.stepIdx < this.steps.length-1) { this.stepIdx++; this.render(); } },
    prev() { if(this.stepIdx > 0) { this.stepIdx--; this.render(); } },
    auto() { 
        if(this.timer) { clearInterval(this.timer); this.timer=null; }
        else { this.timer = setInterval(() => { if(this.stepIdx >= this.steps.length-1) this.stepIdx=-1; this.next(); }, 2000); }
    }
};

window.addEventListener('load', () => {
    initHero(); matrixViz.init(); precodeViz.init(); peelingViz.init(); degreeRippleViz.init(); toyDecodeViz.init();
});
