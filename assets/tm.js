// tm.js — the home page's mini "teachable machine": train a rock / paper / scissors model on your
// own hand, in the browser. A network already trained on millions of photos (MobileNet, through
// MediaPipe) turns each camera frame into a list of numbers; holding a button stores those numbers
// with a label; to guess, it looks for your stored examples that are closest to the new frame.
// Nothing leaves the laptop. The library and model load only when you press Start camera.
// If the camera or the model isn't available, it offers Teachable Machine instead.

const LIB = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3";
const MODEL = "https://storage.googleapis.com/mediapipe-models/image_embedder/mobilenet_v3_small/float32/1/mobilenet_v3_small.tflite";
const TM_URL = "https://teachablemachine.withgoogle.com/train/image";
const CLASSES = [["rock", "Rock"], ["paper", "Paper"], ["scissors", "Scissors"]];
const NEED = 10;        // examples per class before it starts guessing
const MAX = 120;        // examples kept per class
const K = 7;            // neighbours that vote

const box = document.getElementById("homeTm");
if (box) setup();

function setup() {
  box.innerHTML = `
    <div class="tm-stage">
      <video class="tm-video" playsinline muted aria-label="Your camera"></video>
      <div class="tm-cover">
        <button type="button" class="primary tm-start">Start camera</button>
        <p class="tm-small">Runs on this laptop. No photos are sent anywhere.</p>
      </div>
      <div class="tm-guess" aria-live="polite"></div>
      <button type="button" class="tm-stop" hidden aria-label="Turn the camera off">■ Camera off</button>
    </div>
    <p class="tm-step">Then hold each button while you show that hand, about 3 seconds each.</p>
    <div class="tm-classes">${CLASSES.map(([k, name], i) => `
      <button type="button" class="tm-hold" data-k="${k}" disabled>
        <span class="tm-name">${name} <kbd>${i + 1}</kbd></span><span class="tm-count">0 examples</span>
        <span class="tm-bar"><span class="tm-fill"></span></span><span class="tm-pc">—</span>
      </button>`).join("")}
    </div>
    <p class="tm-status" aria-live="polite"></p>
    <p class="tm-how"><span class="peekword" data-peek="A network already trained on millions of photos (MobileNet) turns each camera frame into a list of 1,024 numbers that describe what it sees. Holding a button stores those numbers with your label. To guess, it finds the ${K} stored examples closest to the new frame and lets them vote. That's transfer learning in its simplest form. In Lab 3 you train a real last layer instead.">How does it learn so fast? 🤔</span></p>`;

  const video = box.querySelector(".tm-video"), cover = box.querySelector(".tm-cover"), start = box.querySelector(".tm-start");
  const stopBtn = box.querySelector(".tm-stop");
  const status = box.querySelector(".tm-status"), guessEl = box.querySelector(".tm-guess");
  const holds = [...box.querySelectorAll(".tm-hold")];
  const examples = { rock: [], paper: [], scissors: [] };
  let embedder = null, stream = null, holding = null, running = false, lastTs = 0;

  const say = (t) => { status.textContent = t; };
  function fallback(why) {
    cover.innerHTML = `<p>${why}</p><p><a class="btn" href="${TM_URL}" target="_blank" rel="noopener">Try it on Teachable Machine ↗</a></p>`;
    cover.hidden = false;
    holds.forEach((h) => (h.disabled = true));
    say("");
  }

  start.onclick = async () => {
    start.disabled = true;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return fallback("This browser can't use the camera here.");
    try {
      say("Asking for the camera…");
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
    } catch (e) {
      return fallback("The camera is blocked or not available.");
    }
    video.srcObject = stream;
    try { await video.play(); } catch (e) { /* autoplay rules: it's muted and started by a click */ }
    cover.hidden = true;
    stopBtn.hidden = false;
    if (embedder) return resume();
    try {
      say("Loading the pretrained network (a few seconds)…");
      const { FilesetResolver, ImageEmbedder } = await import(`${LIB}/vision_bundle.mjs`);
      const files = await FilesetResolver.forVisionTasks(`${LIB}/wasm`);
      embedder = await ImageEmbedder.createFromOptions(files, {
        baseOptions: { modelAssetPath: MODEL }, runningMode: "VIDEO", l2Normalize: true, quantize: false,
      });
    } catch (e) {
      stop();
      return fallback("The pretrained network couldn't load on this connection.");
    }
    say("Ready. Hold Rock while you show a fist.");
    resume();
  };
  function resume() {
    holds.forEach((h) => (h.disabled = false));
    running = true;
    draw();
    requestAnimationFrame(loop);
  }

  function stop() {
    running = false; holding = null;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null;
    video.srcObject = null;
  }
  // Camera off: the light goes out; what it learned stays, so Start camera carries on
  function cameraOff(why) {
    if (!stream) return;
    stop();
    stopBtn.hidden = true;
    holds.forEach((h) => (h.disabled = true));
    guessEl.textContent = "";
    start.disabled = false; start.textContent = "Start camera";
    cover.querySelector(".tm-small").textContent = why || "Camera off. What it learned is kept.";
    cover.hidden = false;
    say("");
  }
  stopBtn.onclick = () => cameraOff();
  // Switching to another tab (say, Colab) turns the camera off too
  document.addEventListener("visibilitychange", () => { if (document.hidden) cameraOff("Camera turned off while you were away. What it learned is kept."); });

  // One embedding about every 100 ms: store it while a button is held, otherwise guess
  function loop(now) {
    if (!running) return;
    if (now - lastTs > 100 && video.readyState >= 2) {
      lastTs = now;
      let vec = null;
      try { vec = embedder.embedForVideo(video, Math.round(now)).embeddings[0].floatEmbedding; } catch (e) { vec = null; }
      if (vec) {
        if (holding) { const list = examples[holding]; list.push(Float32Array.from(vec)); if (list.length > MAX) list.shift(); }
        else predict(vec);
        draw();
      }
    }
    requestAnimationFrame(loop);
  }

  let chances = null;
  function predict(vec) {
    const ready = CLASSES.every(([k]) => examples[k].length >= NEED);
    if (!ready) { chances = null; return; }
    const near = [];
    for (const [k] of CLASSES) for (const e of examples[k]) {
      let dot = 0; for (let i = 0; i < e.length; i++) dot += e[i] * vec[i];   // both are length 1, so this is the cosine similarity
      near.push([dot, k]);
    }
    near.sort((a, b) => b[0] - a[0]);
    const votes = { rock: 0, paper: 0, scissors: 0 };
    near.slice(0, K).forEach(([, k]) => votes[k]++);
    chances = CLASSES.map(([k]) => (votes[k] + 0.1) / (K + 0.3));
  }

  function draw() {
    const counts = CLASSES.map(([k]) => examples[k].length);
    const top = chances ? chances.indexOf(Math.max(...chances)) : -1;
    holds.forEach((h, i) => {
      h.querySelector(".tm-count").textContent = `${counts[i]} example${counts[i] === 1 ? "" : "s"}`;
      h.querySelector(".tm-fill").style.width = chances ? `${chances[i] * 100}%` : "0%";
      h.querySelector(".tm-pc").textContent = chances ? `${Math.round(chances[i] * 100)}%` : "—";
      h.classList.toggle("top", i === top);
      h.classList.toggle("on", holding === CLASSES[i][0]);
    });
    if (holding) { guessEl.textContent = `Adding ${holding}…`; return; }
    if (chances) {
      guessEl.textContent = `I see: ${CLASSES[top][1]}`;
      say("Now change your hand and watch it guess. Hold a button again to add more examples.");
    } else {
      guessEl.textContent = "";
      const missing = CLASSES.find(([k]) => examples[k].length < NEED);
      if (missing && embedder) say(`Hold ${missing[1]} while you show ${missing[0] === "rock" ? "a fist" : missing[0] === "paper" ? "a flat hand" : "two fingers"}.`);
    }
  }

  // Press and hold (mouse, touch or keys 1 2 3)
  const begin = (k) => { if (!embedder) return; holding = k; draw(); };
  const end = () => { if (holding) { holding = null; draw(); } };
  holds.forEach((h) => {
    h.addEventListener("pointerdown", (e) => { e.preventDefault(); h.setPointerCapture(e.pointerId); begin(h.dataset.k); });
    h.addEventListener("pointerup", end);
    h.addEventListener("pointercancel", end);
    h.addEventListener("contextmenu", (e) => e.preventDefault());
  });
  document.addEventListener("keydown", (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    const i = ["1", "2", "3"].indexOf(e.key); if (i >= 0 && embedder) { e.preventDefault(); begin(CLASSES[i][0]); }
  });
  document.addEventListener("keyup", (e) => { if (["1", "2", "3"].includes(e.key)) end(); });

  if (typeof addReset === "function") addReset(box, () => {
    for (const [k] of CLASSES) examples[k].length = 0;
    chances = null; holding = null; draw();
    if (embedder) say("Cleared. Hold Rock while you show a fist.");
  });
  window.addEventListener("pagehide", () => cameraOff());
}
