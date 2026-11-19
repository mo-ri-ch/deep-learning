// dl.js — this session's own activities. Each one runs only if its elements are on the page.

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const reset = (el, fn) => { if (typeof addReset === "function" && el) addReset(el, fn); };
const f1 = v => (Math.round(v * 10) / 10).toFixed(1);
const f2 = v => (Math.round(v * 100) / 100).toFixed(2);
const sgn = v => (v < 0 ? `(${v})` : `${v}`);
const still = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

// Colab links
document.querySelectorAll("#colabBtn, #colabLink, .colab-link").forEach(a => { if (window.COURSE && COURSE.colab) a.href = COURSE.colab; });
document.querySelectorAll(".nb-link[data-nb]").forEach(a => { if (window.COURSE && COURSE.notebooks) a.href = COURSE.notebooks[a.dataset.nb]; });

// A row of buttons where one is on
function seg(id, labels, onChange, start = 0) {
  const box = $(id); if (!box) return null;
  box.innerHTML = labels.map((l, i) => `<button type="button" aria-pressed="${i === start}">${esc(l)}</button>`).join("");
  const btns = [...box.querySelectorAll("button")];
  const set = i => { btns.forEach((b, k) => b.setAttribute("aria-pressed", String(k === i))); onChange(i); };
  btns.forEach((b, i) => b.onclick = () => set(i));
  onChange(start);
  return set;
}

// ---------- A small chart in SVG ----------
// plot(box, { x: [min, max], y: [min, max], xLabel, yLabel, ticksX, ticksY }) → { svg, X, Y, layer }
function plot(box, o) {
  const W = 520, H = o.h || 250, L = 44, R = 12, T = 12, B = 38;
  const X = v => L + (v - o.x[0]) / (o.x[1] - o.x[0]) * (W - L - R);
  const Y = v => T + (1 - (v - o.y[0]) / (o.y[1] - o.y[0])) * (H - T - B);
  const ticks = (a, f) => a.map(f).join("");
  box.innerHTML = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label || "chart")}">
    <g class="grid">${ticks(o.ticksY || [], v => `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}"/>`)}</g>
    <line class="axis" x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}"/>
    <line class="axis" x1="${L}" x2="${L}" y1="${T}" y2="${H - B}"/>
    ${ticks(o.ticksX || [], v => `<text class="tick" x="${X(v)}" y="${H - B + 16}" text-anchor="middle">${v}</text>`)}
    ${ticks(o.ticksY || [], v => `<text class="tick" x="${L - 6}" y="${Y(v) + 4}" text-anchor="end">${v}</text>`)}
    <text class="axis-label" x="${(L + W - R) / 2}" y="${H - 4}" text-anchor="middle">${esc(o.xLabel || "")}</text>
    <text class="axis-label" x="12" y="${T + (H - T - B) / 2}" text-anchor="middle" transform="rotate(-90 12 ${T + (H - T - B) / 2})">${esc(o.yLabel || "")}</text>
    <defs><clipPath id="clip-${box.id}"><rect x="${L}" y="${T}" width="${W - L - R}" height="${H - T - B}"/></clipPath></defs>
    <g class="layer" clip-path="url(#clip-${box.id})"></g><g class="top"></g>
  </svg>`;
  const svg = box.querySelector("svg");
  return { svg, X, Y, layer: svg.querySelector(".layer"), top: svg.querySelector(".top") };
}

// The study data: hours studied → test score (exactly score = 2 × hours + 1)
const HOURS = [1, 2, 3, 4, 5], SCORES = [3, 5, 7, 9, 11];
const lossOf = (w, b) => HOURS.reduce((s, x, i) => s + (w * x + b - SCORES[i]) ** 2, 0) / HOURS.length;

function drawFit(p, w, b, gaps = true) {
  const dots = HOURS.map((x, i) => `<circle class="dot" cx="${p.X(x)}" cy="${p.Y(SCORES[i])}" r="6"/>`).join("");
  const gapLines = gaps ? HOURS.map((x, i) => `<line class="gap" x1="${p.X(x)}" x2="${p.X(x)}" y1="${p.Y(SCORES[i])}" y2="${p.Y(w * x + b)}"/>`).join("") : "";
  p.layer.innerHTML = `${gapLines}<line class="fitline" x1="${p.X(0)}" y1="${p.Y(b)}" x2="${p.X(6)}" y2="${p.Y(w * 6 + b)}"/>`;
  p.top.innerHTML = dots;
}
const fitAxes = { x: [0, 6], y: [0, 14], ticksX: [0, 1, 2, 3, 4, 5, 6], ticksY: [0, 4, 8, 12], xLabel: "hours studied", yLabel: "score", label: "Dots for hours studied and test score, with the neuron's line" };

// ---------- A neuron, and the loss: move the weight and bias ----------
function fitWidget(id, showLoss) {
  const box = $(id); if (!box) return;
  const W0 = 0.5, B0 = 1;
  if (showLoss) box.classList.add("with-loss");
  box.innerHTML = `
    <div class="fit-l"><div class="fit-plot" id="${id}-plot"></div>
    <div class="sliders">
      <label>weight <input type="range" min="-1" max="4" step="0.1" value="${W0}" data-k="w"><output></output></label>
      <label>bias <input type="range" min="-3" max="5" step="0.1" value="${B0}" data-k="b"><output></output></label>
    </div></div>
    <div class="fit-r"><p class="worked" aria-live="polite"></p>
    ${showLoss ? '<table class="loss-table"><thead><tr><th>hours</th><th>real</th><th>guess</th><th>gap</th><th>gap²</th></tr></thead><tbody></tbody></table><p class="loss-line" aria-live="polite"></p>' : '<p class="fit-note" aria-live="polite"></p>'}</div>`;
  const p = plot($(id + "-plot"), fitAxes);
  const [sw, sb] = box.querySelectorAll("input");
  function draw() {
    const w = +sw.value, b = +sb.value;
    sw.nextElementSibling.textContent = f1(w); sb.nextElementSibling.textContent = f1(b);
    drawFit(p, w, b);
    box.querySelector(".worked").innerHTML = `score = ${f1(w)} × hours + ${f1(b)}<br>For 3 hours: ${f1(w)} × 3 + ${f1(b)} = <b>${f1(w * 3 + b)}</b> (the real score: 7)`;
    const L = lossOf(w, b);
    if (showLoss) {
      box.querySelector("tbody").innerHTML = HOURS.map((x, i) => {
        const g = w * x + b, d = g - SCORES[i];
        return `<tr><td>${x}</td><td>${SCORES[i]}</td><td>${f1(g)}</td><td>${f1(d)}</td><td>${f2(d * d)}</td></tr>`;
      }).join("");
      box.querySelector(".loss-line").innerHTML = L < 0.005
        ? `loss = <b>0.00</b> ✓ The line goes through every dot.`
        : `loss = average of the gap² column = <b>${f2(L)}</b>`;
    } else {
      box.querySelector(".fit-note").innerHTML = L < 0.005 ? "✓ Through every dot!" : "The red lines show how far off each guess is.";
    }
  }
  sw.oninput = sb.oninput = draw;
  draw();
  reset(box, () => { sw.value = W0; sb.value = B0; draw(); });
}
fitWidget("fitA", false);
fitWidget("fitB", true);

// ---------- Walk downhill: gradient descent, one step at a time ----------
function gradOf(w, b) {
  let gw = 0, gb = 0;
  HOURS.forEach((x, i) => { const d = w * x + b - SCORES[i]; gw += 2 * d * x; gb += 2 * d; });
  return [gw / HOURS.length, gb / HOURS.length];
}
function gdWidget(id, mini) {
  const box = $(id); if (!box) return;
  const RATES = [0.01, 0.05, 0.1];
  let rate = mini ? 0.03 : 0.05, hist = [[0, 0]], timer = null;
  box.innerHTML = `
    ${mini ? "" : '<div class="gd-top"><span class="label-sm">Learning rate</span> <div class="seg" id="' + id + '-rate" role="group" aria-label="Learning rate"></div></div>'}
    <div class="fit-plot" id="${id}-plot"></div>
    <div class="row gd-btns">
      <button type="button" class="back" hidden>◀ Back</button>
      <button type="button" class="primary next">${mini ? "Learn one step" : "Next step →"}</button>
      <button type="button" class="play">▶ Play</button>
    </div>
    <div class="gd-math" aria-live="polite"></div>`;
  const p = plot($(id + "-plot"), { ...fitAxes, h: mini ? 210 : 230 });
  const back = box.querySelector(".back"), next = box.querySelector(".next"), play = box.querySelector(".play"), math = box.querySelector(".gd-math");
  const blown = () => { const [w] = hist[hist.length - 1]; return Math.abs(w) > 40; };
  function stop() { clearInterval(timer); timer = null; play.textContent = "▶ Play"; }
  function draw() {
    const n = hist.length - 1, [w, b] = hist[n];
    drawFit(p, w, b);
    back.hidden = n === 0 || mini;
    next.hidden = play.hidden = blown();
    const L = lossOf(w, b);
    if (mini) {
      math.innerHTML = `Step ${n} · loss <b>${f2(L)}</b>${L < 0.05 ? " · ✓ It found the pattern by itself." : ""}`;
      return;
    }
    if (n === 0) {
      math.innerHTML = `Step 0: weight 0.00, bias 0.00, loss <b>${f2(L)}</b>.<br>Press Next step.`;
      return;
    }
    const [pw, pb] = hist[n - 1], [gw, gb] = gradOf(pw, pb);
    const gap = `<span data-peek="The gradient for the weight is the average of 2 × (guess − real) × hours, over the 5 dots. For the bias, the same without × hours. PyTorch works these out for you.">gradient</span>`;
    math.innerHTML = `Step ${n}:<br>
      ${gap} for weight ${f1(gw)} → new weight = ${f2(pw)} − ${rate} × ${sgn(f1(gw))} = <b>${f2(w)}</b><br>
      gradient for bias ${f1(gb)} → new bias = ${f2(pb)} − ${rate} × ${sgn(f1(gb))} = <b>${f2(b)}</b><br>
      loss ${f2(lossOf(pw, pb))} → <b>${f2(L)}</b>
      ${blown() ? '<br><span class="verdict bad">Each step jumps past the bottom, further every time. The learning rate is too big.</span>'
        : L < 0.05 ? '<br><span class="verdict good">✓ Close to weight 2, bias 1, found by walking downhill.</span>' : ""}`;
  }
  function step() {
    const [w, b] = hist[hist.length - 1], [gw, gb] = gradOf(w, b);
    hist.push([w - rate * gw, b - rate * gb]);
    if (blown() || hist.length > 400) stop();
    draw();
  }
  next.onclick = () => { stop(); step(); };
  back.onclick = () => { stop(); if (hist.length > 1) hist.pop(); draw(); };
  play.onclick = () => {
    if (timer) return stop();
    play.textContent = "⏸ Pause";
    timer = setInterval(step, still() ? 50 : 450);
  };
  function restart() { stop(); hist = [[0, 0]]; draw(); }
  if (!mini) seg(id + "-rate", RATES.map(String), i => { rate = RATES[i]; restart(); }, 1);
  draw();
  reset(box, () => { const s = $(id + "-rate"); if (s) s.querySelectorAll("button")[1].click(); else restart(); });
}
gdWidget("gd", false);

// ---------- Practice: type the answer ----------
function practice(id, problems) {
  const box = $(id); if (!box) return;
  box.innerHTML = problems.map((pr, i) => `
    <div class="prob" data-i="${i}">
      <p class="q"><b>${i + 1}.</b> ${pr.q}</p>
      <div class="row"><input type="text" inputmode="decimal" aria-label="Your answer to problem ${i + 1}" size="8">
        <button type="button" class="check">Check</button>
        <button type="button" class="work">Show working</button></div>
      <p class="fb" aria-live="polite"></p>
    </div>`).join("");
  box.classList.add("activity");
  box.querySelectorAll(".prob").forEach(el => {
    const pr = problems[+el.dataset.i], input = el.querySelector("input"), fb = el.querySelector(".fb");
    const check = () => {
      const v = parseFloat(input.value.replace(/[−–]/g, "-"));
      if (!Number.isFinite(v)) { fb.className = "fb"; fb.textContent = "Type a number first."; return; }
      if (Math.abs(v - pr.a) < 1e-6) { fb.className = "fb good"; fb.innerHTML = "✓ Right."; }
      else { fb.className = "fb bad"; fb.innerHTML = "Not yet. Hint: " + pr.hint; }
    };
    el.querySelector(".check").onclick = check;
    input.onkeydown = e => { if (e.key === "Enter") check(); };
    el.querySelector(".work").onclick = () => { fb.className = "fb"; fb.innerHTML = pr.work; };
  });
  reset(box.querySelector("input"), () => box.querySelectorAll(".prob").forEach(el => { el.querySelector("input").value = ""; el.querySelector(".fb").textContent = ""; el.querySelector(".fb").className = "fb"; }));
}
practice("prac1", [
  { q: "A neuron has weight 3 and bias 2. The input is 4. What is the output?", a: 14,
    hint: "multiply the input by the weight, then add the bias.", work: "3 × 4 + 2<br>= 12 + 2<br>= <b>14</b>" },
  { q: "Two guesses: 5 and 9. The real values: 7 and 8. What is the loss?", a: 2.5,
    hint: "find each gap (guess − real), square it, then take the average.", work: "gaps: 5 − 7 = −2, and 9 − 8 = 1<br>squares: 4 and 1<br>average: (4 + 1) ÷ 2 = <b>2.5</b>" },
  { q: "Weight 1.5, learning rate 0.1, gradient −4. What is the new weight?", a: 1.9,
    hint: "minus a minus is a plus.", work: "1.5 − 0.1 × (−4)<br>= 1.5 + 0.4<br>= <b>1.9</b><br>The gradient was negative, so the weight goes up." },
  { q: "Weight 2, learning rate 0.05, gradient 6. What is the new weight?", a: 1.7,
    hint: "the gradient is positive, so the weight goes down.", work: "2 − 0.05 × 6<br>= 2 − 0.3<br>= <b>1.7</b>" },
]);

// ---------- Layers and ReLU: fit a V ----------
(function relu() {
  const box = $("relu"); if (!box) return;
  const XS = [-3, -2, -1, 0, 1, 2, 3], YS = XS.map(Math.abs);
  const mean = YS.reduce((a, b) => a + b) / YS.length;
  box.innerHTML = `<div class="seg" id="reluSeg" role="group" aria-label="With or without ReLU"></div>
    <div class="fit-plot" id="reluPlot"></div><p class="worked" aria-live="polite"></p>`;
  const p = plot($("reluPlot"), { x: [-3.5, 3.5], y: [-1, 4], ticksX: [-3, -2, -1, 0, 1, 2, 3], ticksY: [0, 1, 2, 3], xLabel: "input", yLabel: "output", label: "Dots in a V shape, with the network's best line", h: 220 });
  const line = (f, cls) => { let d = ""; for (let x = -3.5; x <= 3.51; x += 0.05) d += (d ? "L" : "M") + p.X(x).toFixed(1) + "," + p.Y(f(x)).toFixed(1); return `<path class="${cls}" d="${d}"/>`; };
  seg("reluSeg", ["Two neurons, no ReLU", "Two neurons with ReLU"], i => {
    p.top.innerHTML = XS.map((x, k) => `<circle class="dot" cx="${p.X(x)}" cy="${p.Y(YS[k])}" r="6"/>`).join("");
    const L = YS.reduce((s, y) => s + (y - (i ? y : mean)) ** 2, 0) / YS.length;
    if (i === 0) {
      p.layer.innerHTML = line(() => mean, "fitline");
      box.querySelector(".worked").innerHTML = `Two straight lines added up make another straight line. The best one is flat, at ${f2(mean)}.<br>loss = <b>${f2(L)}</b>: it can't make the bend.`;
    } else {
      p.layer.innerHTML = line(x => Math.max(x, 0), "part a") + line(x => Math.max(-x, 0), "part b") + line(Math.abs, "fitline");
      box.querySelector(".worked").innerHTML = `Neuron 1 gives ReLU(input), neuron 2 gives ReLU(−input). Add them up:<br>input −2: ReLU(−2) + ReLU(2) = 0 + 2 = 2 ✓<br>loss = <b>0.00</b>: the bend fits the V.`;
    }
  });
  reset(box, () => box.querySelector("#reluSeg button").click());
})();

// ---------- The training loop, one line at a time ----------
(function loop() {
  const box = $("loop"); if (!box) return;
  const LINES = [
    ["for images, labels in train_data:", "Take a small group of training examples: 64 pictures, and the right answer for each. This group is called a <b>batch</b>."],
    ["    guesses = model(images)", "<b>1 · Guess.</b> The network (the <code>model</code>) gives 10 scores for each picture, like the neuron gave a score for hours studied."],
    ["    loss = loss_fn(guesses, labels)", "<b>2 · How wrong?</b> One number for the whole batch, like the average of gap² on the dots. For picking one of 10 kinds, PyTorch uses a loss called <i>cross-entropy</i>."],
    ["    optimizer.zero_grad()", "<b>3 · Clear old gradients.</b> PyTorch adds new gradients on top of old ones, so we wipe them first."],
    ["    loss.backward()", "<b>4 · Gradients.</b> PyTorch works out the gradient for every weight, millions of them, in one call."],
    ["    optimizer.step()", "<b>5 · Step downhill.</b> Every weight moves: new weight = weight − learning rate × gradient. The <code>optimizer</code> does this for all of them."],
  ];
  box.innerHTML = `<pre class="loop-code"><code>${LINES.map((l, i) => `<span class="ln" data-i="${i}">${esc(l[0])}</span>`).join("\n")}</code></pre>
    <p class="loop-say" aria-live="polite"></p>
    <div class="row"><button type="button" class="back" hidden>← Back</button><button type="button" class="primary next">Next →</button></div>`;
  let i = 0;
  const lns = box.querySelectorAll(".ln"), back = box.querySelector(".back"), next = box.querySelector(".next"), say = box.querySelector(".loop-say");
  function draw() {
    lns.forEach((l, k) => l.classList.toggle("now", k === i));
    say.innerHTML = LINES[i][1] + (i === LINES.length - 1 ? "<br>Then the loop takes the next batch and does it all again." : "");
    back.hidden = i === 0;
    next.textContent = i === LINES.length - 1 ? "↺ Start again" : "Next →";
  }
  next.onclick = () => { i = i === LINES.length - 1 ? 0 : i + 1; draw(); };
  back.onclick = () => { i = Math.max(0, i - 1); draw(); };
  draw();
  reset(box, () => { i = 0; draw(); });
})();

// ---------- Overfitting: training vs test accuracy ----------
(function over() {
  const box = $("over"); if (!box) return;
  const N = 30, BEST = 8;
  const train = [], test = [];
  for (let e = 1; e <= N; e++) {
    train.push(99 - 29 * Math.exp(-(e - 1) / 5));
    test.push(e <= BEST ? 70 + 19 * (1 - Math.exp(-(e - 1) / 2.6)) / (1 - Math.exp(-(BEST - 1) / 2.6)) : 89 - 9 * (1 - Math.exp(-(e - BEST) / 9)));
  }
  box.innerHTML = `<div class="fit-plot" id="overPlot"></div>
    <label class="slider-row">training round <input type="range" min="1" max="${N}" value="1" id="overIn" data-no-swipe><output id="overOut">1</output></label>
    <p class="worked" aria-live="polite"></p>`;
  const p = plot($("overPlot"), { x: [1, N], y: [65, 100], ticksX: [1, 5, 10, 15, 20, 25, 30], ticksY: [70, 80, 90, 100], xLabel: "training round", yLabel: "% right", label: "Training and test accuracy over training rounds", h: 220 });
  const input = $("overIn");
  const path = (a, n) => a.slice(0, n).map((v, k) => (k ? "L" : "M") + p.X(k + 1).toFixed(1) + "," + p.Y(v).toFixed(1)).join("");
  function draw() {
    const n = +input.value;
    $("overOut").textContent = n;
    p.layer.innerHTML = `<path class="curve train" d="${path(train, n)}"/><path class="curve test" d="${path(test, n)}"/>
      ${n >= BEST ? `<line class="best" x1="${p.X(BEST)}" x2="${p.X(BEST)}" y1="${p.Y(65)}" y2="${p.Y(100)}"/>` : ""}`;
    p.top.innerHTML = `<circle class="dot" cx="${p.X(n)}" cy="${p.Y(train[n - 1])}" r="5"/><circle class="dot test" cx="${p.X(n)}" cy="${p.Y(test[n - 1])}" r="5"/>
      <text class="key train" x="${p.X(N) - 4}" y="${p.Y(train[n - 1]) - 8}" text-anchor="end">training</text>
      <text class="key test" x="${p.X(Math.max(n, 6))}" y="${p.Y(test[n - 1]) + 18}" text-anchor="end">test</text>`;
    let msg = `Round ${n}: training <b>${Math.round(train[n - 1])}%</b>, test <b>${Math.round(test[n - 1])}%</b>`;
    if (n > BEST + 2) msg += `<br><span class="verdict bad">Training still rises, but test falls: it's memorising. Round ${BEST} was the best place to stop.</span>`;
    else if (n >= BEST) msg += `<br>Test is at its best around here.`;
    box.querySelector(".worked").innerHTML = msg;
  }
  input.oninput = draw;
  draw();
  reset(box, () => { input.value = 1; draw(); });
})();

// ---------- Convolution: slide a 3 × 3 filter over a 6 × 6 picture ----------
(function conv() {
  const box = $("conv"); if (!box) return;
  const IMG = Array.from({ length: 6 }, () => [1, 1, 1, 0, 0, 0]);
  const FIL = [[1, 0, -1], [1, 0, -1], [1, 0, -1]];
  const POS = []; for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) POS.push([r, c]);
  const sumAt = (r, c) => FIL.reduce((s, row, i) => s + row.reduce((t, f, j) => t + f * IMG[r + i][c + j], 0), 0);
  box.innerHTML = `<div class="conv-row">
      <div><p class="label-sm">The picture (1 = bright, 0 = dark)</p><div class="grid g6" id="convImg"></div></div>
      <div><p class="label-sm">The filter</p><div class="grid g3" id="convFil"></div></div>
      <div><p class="label-sm">What it found</p><div class="grid g4" id="convOut"></div></div>
    </div>
    <p class="worked conv-sum" aria-live="polite"></p>
    <div class="row"><button type="button" class="back" hidden>◀ Back</button><button type="button" class="primary next">Next step →</button><button type="button" class="play">▶ Play</button></div>`;
  $("convFil").innerHTML = FIL.flat().map(v => `<span class="cell f${v < 0 ? "n" : v > 0 ? "p" : "z"}">${v}</span>`).join("");
  let k = 0, timer = null;
  const back = box.querySelector(".back"), next = box.querySelector(".next"), play = box.querySelector(".play");
  function stop() { clearInterval(timer); timer = null; play.textContent = "▶ Play"; }
  function draw() {
    const [r, c] = POS[k];
    $("convImg").innerHTML = IMG.flat().map((v, i) => {
      const ir = Math.floor(i / 6), ic = i % 6, on = ir >= r && ir < r + 3 && ic >= c && ic < c + 3;
      return `<span class="cell ${v ? "lit" : "dark"}${on ? " win" : ""}">${v}</span>`;
    }).join("");
    $("convOut").innerHTML = POS.map(([pr, pc], i) => {
      if (i > k) return `<span class="cell empty"></span>`;
      const s = sumAt(pr, pc);
      return `<span class="cell ${s ? "hot" : ""}${i === k ? " win" : ""}">${s}</span>`;
    }).join("");
    const rows = FIL.map((row, i) => row.map((f, j) => `${IMG[r + i][c + j]}×${sgn(f)}`).join(" + ")).join(" +<br>");
    const s = sumAt(r, c);
    box.querySelector(".conv-sum").innerHTML = `${rows}<br>= <b>${s}</b> ${s ? "← an edge from bright to dark is here" : "← no edge here"}`;
    back.hidden = k === 0;
    next.hidden = k === POS.length - 1;
    play.textContent = k === POS.length - 1 ? "↺ Start again" : timer ? "⏸ Pause" : "▶ Play";
  }
  next.onclick = () => { stop(); k = Math.min(POS.length - 1, k + 1); draw(); };
  back.onclick = () => { stop(); k = Math.max(0, k - 1); draw(); };
  play.onclick = () => {
    if (k === POS.length - 1) { stop(); k = 0; return draw(); }
    if (timer) { stop(); return draw(); }
    timer = setInterval(() => { k++; if (k >= POS.length - 1) { k = POS.length - 1; stop(); } draw(); }, still() ? 60 : 600);
    draw();
  };
  draw();
  reset(box, () => { stop(); k = 0; draw(); });
})();

// ---------- Transfer learning: from scratch vs fine-tune ----------
(function transfer() {
  const box = $("tl"); if (!box) return;
  const LAYERS = ["edges", "textures", "shapes", "object parts", "3 gestures (new)"];
  const WAYS = [
    { learns: [1, 1, 1, 1, 1], pics: "60 (20 per gesture)", time: "about a minute", acc: "about 60%" },
    { learns: [0, 0, 0, 0, 1], pics: "the same 60", time: "about a minute", acc: "about 90%" },
  ];
  seg("tlSeg", ["Train from scratch", "Fine-tune a pretrained one"], i => {
    const w = WAYS[i];
    box.innerHTML = `<div class="layers">${LAYERS.map((l, k) => `<div class="layer-box ${w.learns[k] ? "learn" : "frozen"}">
        <span>${esc(l)}</span><span class="tag">${w.learns[k] ? "✏️ learns" : "🔒 kept as is"}</span></div>`).join('<span class="arrow" aria-hidden="true">→</span>')}</div>
      <table class="tl-table"><tr><th>Pictures needed</th><td>${w.pics}</td></tr><tr><th>Training time</th><td>${w.time}</td></tr><tr><th>Test accuracy</th><td><b>${w.acc}</b></td></tr></table>
      <p class="worked">${i ? "Only the last layer starts from zero. Everything else was learned from over a million photos." : "Every layer starts from random weights and must learn edges, textures and shapes from 60 photos alone."}</p>`;
  });
  reset($("tlSeg"), () => $("tlSeg").querySelector("button").click());
})();

// ---------- Foundation models: zero-shot with CLIP ----------
(function clip() {
  const box = $("clip"); if (!box) return;
  const LABELS = ["a photo of a cat", "a photo of a dog", "a photo of a car", "a photo of food"];
  const PICS = [
    { icon: "🐱", name: "Cat", scores: [0.91, 0.06, 0.01, 0.02] },
    { icon: "🚗", name: "Car", scores: [0.01, 0.01, 0.96, 0.02] },
    { icon: "🍕", name: "Pizza", scores: [0.02, 0.03, 0.01, 0.94] },
  ];
  seg("clipSeg", PICS.map(p => p.icon + " " + p.name), i => {
    const pic = PICS[i], top = Math.max(...pic.scores);
    box.innerHTML = `<div class="clip-row"><div class="clip-pic" aria-hidden="true">${pic.icon}</div>
      <div class="nw-bars">${LABELS.map((l, k) => `<div class="nw-bar${pic.scores[k] === top ? " top" : ""}"><span class="w">${esc(l)}</span>
        <span class="track"><span class="fill" style="width:${pic.scores[k] * 100}%"></span></span><span class="pc">${Math.round(pic.scores[k] * 100)}%</span></div>`).join("")}</div></div>
      <p class="worked">CLIP turns the picture and each sentence into numbers, then checks which sentence is closest. Change the sentences, and you have a new classifier.</p>`;
  });
  reset($("clipSeg"), () => $("clipSeg").querySelector("button").click());
})();

// ---------- Checklists (ticks saved in this browser) ----------
function checklist(id, items) {
  const list = $(id); if (!list) return;
  const KEY = ((window.COURSE && COURSE.id) || "session") + "-" + id;
  let done = {}; try { done = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) {}
  list.innerHTML = items.map((it, i) => `<li><label><input type="checkbox" data-i="${i}"${done[i] ? " checked" : ""}>
    <span class="day">${esc(it[0])}</span><span>${it[1]}</span></label></li>`).join("");
  list.querySelectorAll("input").forEach(c => c.onchange = () => {
    done[c.dataset.i] = c.checked; try { localStorage.setItem(KEY, JSON.stringify(done)); } catch (e) {}
  });
  list.querySelectorAll("a").forEach(a => { if (a.dataset.nb && window.COURSE) a.href = COURSE.notebooks[a.dataset.nb]; });
  reset(list, () => { done = {}; try { localStorage.removeItem(KEY); } catch (e) {} list.querySelectorAll("input").forEach(c => c.checked = false); });
}
checklist("setup", [
  ["Step 1", "A laptop with Chrome, signed in to any Google account."],
  ["Step 2", 'Open <a data-nb="1" target="_blank" rel="noopener">the notebook in Colab</a>.'],
  ["Step 3", "Turn on the free GPU: <b>Runtime → Change runtime type → T4 GPU</b> → Save."],
  ["Step 4", "Run the first cell, <b>Setup</b> (click ▶ beside it). It should say a GPU was found."],
]);
checklist("ideas", [
  ["Network", 'Another pretrained network: <code>model_name = "mobilenet"</code> or <code>"efficientnet"</code>.'],
  ["Unlock", "Let the last block of the network learn too: <code>unlock = True</code>."],
  ["Flip", "Show mirrored copies of the photos while training, so it sees more variety. This is called <b>data augmentation</b>: <code>flip = True</code>."],
  ["Longer", "More training rounds: <code>rounds = 20</code>. Watch the test score each round."],
  ["Rate", "A smaller or bigger step: <code>lr = 0.0003</code> or <code>0.003</code>."],
]);

// ---------- Home: rock, paper, scissors against an online learner ----------
// An order-2 Markov model of the player, updated after every round. It commits to its move
// before the player's click, using only the moves played so far.
(function rps() {
  const box = $("homeRps"); if (!box) return;
  const MOVES = ["rock", "paper", "scissors"], BEATS = { rock: "paper", paper: "scissors", scissors: "rock" };
  const NAME = { rock: "Rock", paper: "Paper", scissors: "Scissors" };
  let history = [], hits = [], score = { you: 0, ai: 0, draw: 0 };

  // P(next | last two) with add-one smoothing, backing off to P(next | last one) and P(next)
  function predict() {
    const n = history.length, c2 = [1, 1, 1], c1 = [1, 1, 1], c0 = [1, 1, 1];
    for (let i = 0; i < n; i++) {
      const k = MOVES.indexOf(history[i]);
      c0[k]++;
      if (n >= 1 && i >= 1 && history[i - 1] === history[n - 1]) c1[k]++;
      if (n >= 2 && i >= 2 && history[i - 2] === history[n - 2] && history[i - 1] === history[n - 1]) c2[k]++;
    }
    const seen2 = c2.reduce((a, b) => a + b) - 3, seen1 = c1.reduce((a, b) => a + b) - 3;
    const c = seen2 >= 2 ? c2 : seen1 >= 2 ? c1 : c0;
    const ctx = seen2 >= 2 ? `${history[n - 2]} → ${history[n - 1]}` : seen1 >= 2 ? history[n - 1] : "any move";
    const t = c[0] + c[1] + c[2];
    return { p: c.map(v => v / t), ctx };
  }
  const choose = p => { const top = Math.max(...p); return top < 0.4 ? MOVES[Math.floor(Math.random() * 3)] : BEATS[MOVES[p.indexOf(top)]]; };

  box.innerHTML = `
    <div class="rps-moves" role="group" aria-label="Your move">${MOVES.map((m, i) => `<button type="button" data-m="${m}">${NAME[m]} <kbd>${i + 1}</kbd></button>`).join("")}</div>
    <p class="rps-result" aria-live="polite">Your move. The model has already picked.</p>
    <p class="rps-label">P(your next move | <span class="rps-ctx">any move</span>)</p>
    <div class="nw-bars rps-bars"></div>
    <div class="rps-stats">
      <div><span>Rounds</span><b data-k="n">0</b></div>
      <div><span>Prediction accuracy</span><b data-k="acc">—</b></div>
      <div><span>Model win rate</span><b data-k="win">—</b></div>
    </div>
    <svg class="rps-spark" viewBox="0 0 300 54" role="img" aria-label="Prediction accuracy over time, with the 33% chance line">
      <line class="base" x1="0" x2="300" y1="36" y2="36"/><text x="298" y="33" text-anchor="end">chance 33%</text><path class="acc" d=""/>
    </svg>
    <p class="rps-note">An order-2 Markov model, updated online after every round: it learns from your data, with no network yet.</p>`;
  let pred = predict(), aiMove = choose(pred.p);
  const pct = v => (v * 100).toFixed(0) + "%";
  function draw() {
    const top = Math.max(...pred.p), n = history.length;
    box.querySelector(".rps-ctx").textContent = n ? `after ${pred.ctx}` : "any move";
    box.querySelector(".rps-bars").innerHTML = MOVES.map((m, i) => `<div class="nw-bar${pred.p[i] === top && n ? " top" : ""}"><span class="w">${m}</span>
      <span class="track"><span class="fill" style="width:${pred.p[i] * 100}%"></span></span><span class="pc">${pred.p[i].toFixed(2)}</span></div>`).join("");
    const acc = hits.length ? hits.filter(Boolean).length / hits.length : null;
    const played = score.you + score.ai + score.draw;
    box.querySelector('[data-k="n"]').textContent = n;
    box.querySelector('[data-k="acc"]').textContent = acc === null ? "—" : pct(acc);
    box.querySelector('[data-k="win"]').textContent = played ? pct(score.ai / played) : "—";
    // Running accuracy, one point per round
    let d = "", right = 0;
    hits.forEach((h, i) => { right += h; const x = hits.length < 2 ? 0 : (i / (hits.length - 1)) * 300, y = 52 - (right / (i + 1)) * 48; d += (i ? "L" : "M") + x.toFixed(1) + "," + y.toFixed(1); });
    box.querySelector(".rps-spark .acc").setAttribute("d", d);
  }
  function play(you) {
    const it = aiMove, guessed = MOVES[pred.p.indexOf(Math.max(...pred.p))];
    hits.push(history.length ? +(guessed === you) : 0);
    const result = you === it ? "draw" : BEATS[it] === you ? "you" : "ai";
    score[result]++;
    box.querySelector(".rps-result").innerHTML = `You: ${NAME[you]} · Model: ${NAME[it]} · <b>${result === "you" ? "You win" : result === "ai" ? "Model wins" : "Draw"}</b>` +
      (history.length ? ` <span class="rps-guess">(it predicted ${guessed})</span>` : "");
    history.push(you);
    pred = predict(); aiMove = choose(pred.p);   // committed before your next click
    draw();
  }
  box.querySelectorAll(".rps-moves button").forEach(b => b.onclick = () => play(b.dataset.m));
  document.addEventListener("keydown", e => {
    if (e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    const i = ["1", "2", "3"].indexOf(e.key); if (i >= 0) play(MOVES[i]);
  });
  draw();
  reset(box, () => {
    history = []; hits = []; score = { you: 0, ai: 0, draw: 0 }; pred = predict(); aiMove = choose(pred.p);
    box.querySelector(".rps-result").textContent = "Your move. The model has already picked.";
    draw();
  });
})();
