const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;

const menu = document.getElementById("menu");
const playBtn = document.getElementById("playBtn");
const menuMsg = document.getElementById("menuMsg");
const gameOverUI = document.getElementById("gameOver");

/* ---------- image loading ---------- */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(src);
    img.src = src;
  });
}

function safeDraw(img, ...args) {
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, ...args);
  }
}

const PATHS = {
  bg: "assets/gbg.png",
  rocket: "assets/rocket.png",
  projectile: "assets/projectile.png",
  exploded: "assets/exploded.png",
  bo: "assets/bo.png",
  ast1: "assets/ast1.png",
  ast2: "assets/ast2.png",
  c1: "assets/c1.png",
  c2: "assets/c2.png",
};

let IMG = {};

/* ---------- preload ---------- */
async function preloadAll() {
  menuMsg.textContent = "Loading...";
  try {
    const imgs = await Promise.all(
      Object.values(PATHS).map(loadImage)
    );
    const keys = Object.keys(PATHS);
    keys.forEach((k, i) => (IMG[k] = imgs[i]));
    menuMsg.textContent = "";
    return true;
  } catch (missing) {
    menuMsg.textContent = `Missing file: ${missing}`;
    return false;
  }
}

/* ---------- game state ---------- */
const SCALE = 1.75;

let running = false;
let inCountdown = false;
let gameOver = false;
let startedLoop = false;

let score = 0;
let bgY = 0;
let countdownStart = 0;

const rocket = {
  x: canvas.width / 2,
  y: canvas.height * 0.7,
  angle: -Math.PI / 2,
  speed: 3.2,        // slowed
  turnSpeed: 0.055   // snappy but controlled
};

let asteroids = [];
let projectiles = [];
let rocketExplosions = [];

let lastAst = 0;
let lastCluster = 0;

/* ---------- controls ---------- */
const keys = {};
addEventListener("keydown", e => {
  keys[e.key] = true;

  if (e.key === "ArrowUp" && running && !inCountdown && !gameOver) {
    shoot();
  }

  if (gameOver && e.key.toLowerCase() === "r") {
    restartWithCountdown();
  }
});
addEventListener("keyup", e => (keys[e.key] = false));

/* ---------- start ---------- */
playBtn.onclick = async () => {
  const ok = await preloadAll();
  if (!ok) return;

  menu.style.display = "none";
  canvas.style.display = "block";

  startCountdown();
  if (!startedLoop) {
    startedLoop = true;
    requestAnimationFrame(loop);
  }
};

function startCountdown() {
  resetGame();
  running = true;
  inCountdown = true;
  countdownStart = performance.now();
}

function restartWithCountdown() {
  gameOverUI.style.display = "none";
  startCountdown();
}

function resetGame() {
  asteroids = [];
  projectiles = [];
  rocketExplosions = [];
  score = 0;
  gameOver = false;

  rocket.x = canvas.width / 2;
  rocket.y = canvas.height * 0.7;
  rocket.angle = -Math.PI / 2;

  lastAst = performance.now();
  lastCluster = performance.now();
}

/* ---------- spawns ---------- */
function spawnAsteroid() {
  asteroids.push({
    x: Math.random() * canvas.width,
    y: -160,
    size: 55 * SCALE,
    speed: 2.5,
    img: Math.random() < 0.5 ? IMG.ast1 : IMG.ast2,
    cluster: false
  });
}

function spawnCluster() {
  asteroids.push({
    x: Math.random() * canvas.width,
    y: -220,
    size: 130 * SCALE,
    speed: 1.6,
    img: Math.random() < 0.5 ? IMG.c1 : IMG.c2,
    cluster: true
  });
}

/* ---------- shooting ---------- */
function shoot() {
  const tipX = rocket.x + Math.cos(rocket.angle) * 45;
  const tipY = rocket.y + Math.sin(rocket.angle) * 45;

  projectiles.push({
    x: tipX,
    y: tipY,
    angle: rocket.angle,
    speed: 11
  });
}

/* ---------- explosions ---------- */
function spawnRocketExplosion(x, y) {
  rocketExplosions.push({ x, y, f: 0 });
}

function endGame() {
  gameOver = true;
  gameOverUI.style.display = "flex";
}

/* ---------- loop ---------- */
function loop(now) {
  if (!running) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  bgY += 2;
  if (bgY >= canvas.height) bgY = 0;
  safeDraw(IMG.bg, 0, bgY - canvas.height, canvas.width, canvas.height);
  safeDraw(IMG.bg, 0, bgY, canvas.width, canvas.height);

  if (inCountdown) {
    if (now - countdownStart < 3000) {
      safeDraw(IMG.bo, canvas.width / 2 - 150, canvas.height / 2 - 75, 300, 150);
    } else {
      inCountdown = false;
    }
  } else if (!gameOver) {
    update(now);
  }

  drawRocket();
  drawAsteroids();
  drawProjectiles();
  drawRocketExplosions();
  drawScore();

  requestAnimationFrame(loop);
}

/* ---------- update ---------- */
function update(now) {
  if (keys["ArrowLeft"]) rocket.angle -= rocket.turnSpeed;
  if (keys["ArrowRight"]) rocket.angle += rocket.turnSpeed;

  rocket.x += Math.cos(rocket.angle) * rocket.speed;
  rocket.y += Math.sin(rocket.angle) * rocket.speed;

  // keep rocket visible
  if (rocket.x < 0) rocket.x = canvas.width;
  if (rocket.x > canvas.width) rocket.x = 0;
  rocket.y = Math.max(80, Math.min(canvas.height - 120, rocket.y));

  if (now - lastAst > 850) {
    spawnAsteroid();
    lastAst = now;
  }
  if (now - lastCluster > 2800) {
    spawnCluster();
    lastCluster = now;
  }

  asteroids.forEach(a => (a.y += a.speed));
  projectiles.forEach(p => {
    p.x += Math.cos(p.angle) * p.speed;
    p.y += Math.sin(p.angle) * p.speed;
  });

  for (let ai = asteroids.length - 1; ai >= 0; ai--) {
    const a = asteroids[ai];

    for (let pi = projectiles.length - 1; pi >= 0; pi--) {
      const p = projectiles[pi];
      if (Math.hypot(a.x - p.x, a.y - p.y) < a.size / 2) {
        asteroids.splice(ai, 1);
        projectiles.splice(pi, 1);
        score += a.cluster ? 50 : 10;
        break;
      }
    }

    if (!gameOver && Math.hypot(a.x - rocket.x, a.y - rocket.y) < a.size / 2) {
      spawnRocketExplosion(rocket.x, rocket.y);
      endGame();
      break;
    }
  }

  asteroids = asteroids.filter(a => a.y < canvas.height + 300);
  projectiles = projectiles.filter(p => p.y > -100 && p.y < canvas.height + 100);
}

/* ---------- draw ---------- */
function drawRocket() {
  ctx.save();
  ctx.translate(rocket.x, rocket.y);
  ctx.rotate(rocket.angle + Math.PI / 2);
  safeDraw(IMG.rocket, -40, -40, 80, 80);
  ctx.restore();
}

function drawAsteroids() {
  asteroids.forEach(a =>
    safeDraw(a.img, a.x - a.size / 2, a.y - a.size / 2, a.size, a.size)
  );
}

function drawProjectiles() {
  projectiles.forEach(p =>
    safeDraw(IMG.projectile, p.x - 6, p.y - 12, 12, 24)
  );
}

function drawRocketExplosions() {
  for (let i = rocketExplosions.length - 1; i >= 0; i--) {
    const e = rocketExplosions[i];
    ctx.globalAlpha = 1 - e.f / 20;
    safeDraw(IMG.exploded, e.x - 60, e.y - 60, 120, 120);
    ctx.globalAlpha = 1;
    e.f++;
    if (e.f > 20) rocketExplosions.splice(i, 1);
  }
}

function drawScore() {
  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
  ctx.fillText("Score: " + score, 20, 40);
}
