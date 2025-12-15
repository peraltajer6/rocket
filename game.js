const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Images
const bg = new Image();
bg.src = "assets/gbg.png";

const rocketImg = new Image();
rocketImg.src = "assets/rocket.png";

const projectileImg = new Image();
projectileImg.src = "assets/projectile.png";

const explosionImg = new Image();
explosionImg.src = "assets/exploded.png";

const astImgs = ["assets/ast1.png", "assets/ast2.png"].map(src => {
  const i = new Image();
  i.src = src;
  return i;
});

// State
let running = false;
let gameOver = false;
let score = 0;

// Background loop
let bgY = 0;

// Rocket
const rocket = {
  x: canvas.width / 2,
  y: canvas.height * 0.75,
  speed: 7
};

// Objects
let asteroids = [];
let projectiles = [];
let explosions = [];

// Controls
const keys = {};
window.addEventListener("keydown", e => {
  keys[e.key] = true;

  if (e.key === "ArrowUp" && running && !gameOver) shoot();
  if (gameOver && e.key.toLowerCase() === "r") reset();
});
window.addEventListener("keyup", e => keys[e.key] = false);

// ▶️ PLAY BUTTON FIX
document.getElementById("playBtn").onclick = () => {
  document.getElementById("menu").style.display = "none";
  reset();
  running = true;
  loop();
};

// Spawn asteroid clusters (RANDOM)
function spawnAsteroidCluster() {
  const count = 2 + Math.floor(Math.random() * 3);

  for (let i = 0; i < count; i++) {
    asteroids.push({
      x: Math.random() * canvas.width,
      y: -100 - Math.random() * 200,
      size: 50 + Math.random() * 30,
      speed: 3 + Math.random() * 2,
      img: astImgs[Math.floor(Math.random() * astImgs.length)]
    });
  }
}

// Shooting
function shoot() {
  projectiles.push({
    x: rocket.x,
    y: rocket.y - 40,
    speed: 12
  });
}

// Explosion
function spawnExplosion(x, y) {
  explosions.push({ x, y, frame: 0 });
}

// Reset game
function reset() {
  asteroids = [];
  projectiles = [];
  explosions = [];
  score = 0;
  gameOver = false;
  rocket.x = canvas.width / 2;
  document.getElementById("gameOver").style.display = "none";
}

// Main loop
function loop() {
  if (!running) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Infinite background
  bgY += 2;
  if (bgY >= canvas.height) bgY = 0;

  if (bg.complete) {
    ctx.drawImage(bg, 0, bgY - canvas.height, canvas.width, canvas.height);
    ctx.drawImage(bg, 0, bgY, canvas.width, canvas.height);
  }

  if (!gameOver) update();

  drawRocket();
  drawProjectiles();
  drawAsteroids();
  drawExplosions();
  drawScore();

  requestAnimationFrame(loop);
}

// Game logic
function update() {
  if (keys["ArrowLeft"]) rocket.x -= rocket.speed;
  if (keys["ArrowRight"]) rocket.x += rocket.speed;

  rocket.x = Math.max(40, Math.min(canvas.width - 40, rocket.x));

  // Spawn randomly
  if (Math.random() < 0.03) spawnAsteroidCluster();

  asteroids.forEach(a => a.y += a.speed);
  projectiles.forEach(p => p.y -= p.speed);

  asteroids.forEach((a, ai) => {
    projectiles.forEach((p, pi) => {
      if (Math.hypot(a.x - p.x, a.y - p.y) < a.size / 2) {
        spawnExplosion(a.x, a.y);
        asteroids.splice(ai, 1);
        projectiles.splice(pi, 1);
        score += 10;
      }
    });

    // 🚀 ROCKET EXPLOSION FIX
    if (Math.hypot(a.x - rocket.x, a.y - rocket.y) < a.size / 2) {
      spawnExplosion(rocket.x, rocket.y);
      endGame();
    }
  });

  asteroids = asteroids.filter(a => a.y < canvas.height + 200);
  projectiles = projectiles.filter(p => p.y > -50);
}

// Draws
function drawRocket() {
  if (rocketImg.complete) {
    ctx.drawImage(rocketImg, rocket.x - 40, rocket.y - 40, 80, 80);
  }
}

function drawAsteroids() {
  asteroids.forEach(a => {
    if (a.img.complete) {
      ctx.drawImage(a.img, a.x - a.size/2, a.y - a.size/2, a.size, a.size);
    }
  });
}

function drawProjectiles() {
  projectiles.forEach(p => {
    if (projectileImg.complete) {
      ctx.drawImage(projectileImg, p.x - 8, p.y - 16, 16, 32);
    }
  });
}

function drawExplosions() {
  explosions.forEach((e, i) => {
    ctx.globalAlpha = 1 - e.frame / 20;
    if (explosionImg.complete) {
      ctx.drawImage(explosionImg, e.x - 50, e.y - 50, 100, 100);
    }
    ctx.globalAlpha = 1;

    e.frame++;
    if (e.frame > 20) explosions.splice(i, 1);
  });
}

function drawScore() {
  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
  ctx.fillText("Score: " + score, 20, 40);
}

function endGame() {
  gameOver = true;
  document.getElementById("gameOver").style.display = "flex";
}
