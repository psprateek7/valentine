// ---------- View switching ----------
const askView = document.getElementById("askView");
const thanksView = document.getElementById("thanksView");
const yesBtn = document.getElementById("yesBtn");
const replayBtn = document.getElementById("replayBtn");

const confettiCanvas = document.getElementById("confetti");
const ctx = confettiCanvas.getContext("2d");

// ---------- "No" button dodge ----------
const noZone = document.getElementById("noZone");
const noBtn = document.getElementById("noBtn");

let lastMove = { x: 0, y: 0 };

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function moveNoButton() {
  // Allow it to move within a larger invisible range to feel more playful,
  // but still keep it classy (not teleporting across the whole screen).
  const zoneRect = noZone.getBoundingClientRect();

  // Movement bounds relative to initial (0,0)
  const maxX = 190;
  const minX = -70;
  const maxY = 90;
  const minY = -70;

  // Pick a new target far enough from last to feel like it "escapes"
  let x, y, tries = 0;
  do {
    x = rand(minX, maxX);
    y = rand(minY, maxY);
    tries++;
  } while (tries < 12 && Math.hypot(x - lastMove.x, y - lastMove.y) < 80);

  // Small extra bias away from the cursor side if we can guess it
  // (We don't need exact cursor data; the repeated move feels natural.)

  lastMove = { x, y };
  noBtn.style.transform = `translate(${x}px, ${y}px)`;
  noBtn.style.filter = `drop-shadow(0 12px 24px rgba(0,0,0,.25))`;
}

// Make "No" dodge on hover/focus/touch approach
noBtn.addEventListener("mouseenter", moveNoButton);
noBtn.addEventListener("focus", moveNoButton);
noBtn.addEventListener("touchstart", (e) => {
  e.preventDefault(); // prevent actual click on mobile
  moveNoButton();
}, { passive: false });

// Optional: if someone somehow clicks it, still dodge
noBtn.addEventListener("click", (e) => {
  e.preventDefault();
  moveNoButton();
});

// ---------- Confetti / party popper animation ----------
let W = 0, H = 0;
function resize() {
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  W = window.innerWidth;
  H = window.innerHeight;
  confettiCanvas.width = Math.floor(W * dpr);
  confettiCanvas.height = Math.floor(H * dpr);
  confettiCanvas.style.width = W + "px";
  confettiCanvas.style.height = H + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resize);
resize();

const palette = ["#ff3d6e", "#b58cff", "#ffd1dc", "#ffe6b3", "#fbf7f2"];
let particles = [];
let animId = null;

function spawnConfettiBurst(count = 160) {
  const originX = W * 0.5;
  const originY = H * 0.35;

  for (let i = 0; i < count; i++) {
    const angle = rand(-Math.PI, Math.PI);
    const speed = rand(3.5, 9.5);
    particles.push({
      x: originX + rand(-20, 20),
      y: originY + rand(-10, 10),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - rand(2, 6),
      g: rand(0.09, 0.16),
      r: rand(3, 6),
      w: rand(6, 14),
      h: rand(6, 14),
      rot: rand(0, Math.PI),
      vr: rand(-0.18, 0.18),
      life: rand(130, 220),
      color: palette[Math.floor(rand(0, palette.length))]
    });
  }
}

function tick() {
  ctx.clearRect(0, 0, W, H);

  // Subtle vignette overlay for classy look
  ctx.save();
  const grd = ctx.createRadialGradient(W/2, H/2, H*0.1, W/2, H/2, H*0.9);
  grd.addColorStop(0, "rgba(0,0,0,0)");
  grd.addColorStop(1, "rgba(0,0,0,0.25)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  particles = particles.filter(p => p.life > 0);

  for (const p of particles) {
    p.life -= 1;
    p.vy += p.g;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;

    // gentle air drag
    p.vx *= 0.992;
    p.vy *= 0.992;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);

    ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 80));
    ctx.fillStyle = p.color;

    // confetti rectangle
    ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);

    ctx.restore();
  }

  // Keep the party going with occasional mini-bursts
  if (Math.random() < 0.03) spawnConfettiBurst(40);

  animId = requestAnimationFrame(tick);
}

function startParty() {
  confettiCanvas.classList.add("is-on");
  particles = [];
  spawnConfettiBurst(220);

  if (animId) cancelAnimationFrame(animId);
  tick();
}

function stopParty() {
  confettiCanvas.classList.remove("is-on");
  if (animId) cancelAnimationFrame(animId);
  animId = null;
  particles = [];
  ctx.clearRect(0, 0, W, H);
}

// ---------- Button actions ----------
yesBtn.addEventListener("click", () => {
  askView.classList.add("is-hidden");
  thanksView.classList.remove("is-hidden");
  startParty();
});

replayBtn.addEventListener("click", () => {
  stopParty();
  thanksView.classList.add("is-hidden");
  askView.classList.remove("is-hidden");
  // reset no button position
  lastMove = { x: 0, y: 0 };
  noBtn.style.transform = "translate(0px, 0px)";
});

document.querySelectorAll(".idea-card").forEach(card => {
  card.addEventListener("click", () => card.classList.toggle("is-selected"));
});
