const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Images
const bg = new Image(); bg.src = "assets/gbg.png";
const rocketImg = new Image(); rocketImg.src = "assets/rocket.png";
const projectileImg = new Image(); projectileImg.src = "assets/projectile.png";
const explosionImg = new Image(); explosionImg.src = "assets/exploded.png";

const asteroidImgs = [
  "assets/ast1.png",
  "assets/ast2.png"
].map(src => { const i = new Image(); i.src = src; return i; });

const clusterImgs = [
  "assets/c1.png",
  "assets/c2.png"
].map(src => { const i = new Image(); i.src = src; return i; });

// State
let running = false;
let gameOver = false;
let score = 0;
let bgY = 0;

// Rocket (SMOOTH TURNING)
const rocket = {
  x: canvas.width / 2,
  y: canvas.height * 0.7,
  angle: -Math.PI / 2,
  vel: 3,
  rotVel: 0
};

let asteroids = [];
let projectiles = [];
let explosions = [];

const keys = {};
addEventListener("keydown", e => {
  keys[e.key] = true;
  if (e.key === "ArrowUp" && running && !gameOver) shoot();
  if (gameOver && e.key.toLowerCase() === "r") reset();
});
addEventListener("keyup", e => keys[e.key] = false);

// Play
document.getElementById("playBtn").onclick = () => {
  document.getElementById("menu").style.display = "none";
  reset();
  running = true;
  loop();
};

// Spawn asteroids + clusters
function spawnObjects() {
  if (Math.random() < 0.02) {
    asteroids.push({
      x: Math.random() * canvas.width,
      y: -100,
      size: 60,
      speed: 2,
      img: asteroidImgs[Math.floor(Math.random() * asteroidImgs.length)],
      cluster: false
    });
  }

  if (Math.random() < 0.008) {
    asteroids.push({
      x: Math.random() * canvas.width,
      y: -150,
      size: 130,
      speed: 1.5,
      img: clusterImgs[Math.floor(Math.random() * clusterImgs.length)],
      cluster: true
    });
  }
}

// Shoot
function shoot() {
  projectiles.push({
    x: rocket.x,
    y: rocket.y,
    angle: rocket.angle,
    speed: 10
  });
}

function spawnExplosion(x, y) {
  explosions.push({ x, y, frame: 0 });
}

function reset() {
  asteroids = [];
  projectiles = [];
  explosions = [];
  score = 0;
  gameOver = false;
  rocket.x = canvas.width / 2;
  rocket.y = canvas.height * 0.7;
  rocket.angle = -Math.PI / 2;
  rocket.rotVel = 0;
  document.getElementById("gameOver").style.display = "none";
}

// Loop
function loop() {
  if (!running) return;
  ctx.clearRect(0,0,canvas.width,canvas.height);

  bgY += 2;
  if (bgY >= canvas.height) bgY = 0;
  ctx.drawImage(bg,0,bgY-canvas.height,canvas.width,canvas.height);
  ctx.drawImage(bg,0,bgY,canvas.width,canvas.height);

  if (!gameOver) update();

  drawRocket();
  drawObjects();
  drawExplosions();
  drawScore();

  requestAnimationFrame(loop);
}

function update() {
  // Smooth turning
  if (keys["ArrowLeft"]) rocket.rotVel -= 0.004;
  if (keys["ArrowRight"]) rocket.rotVel += 0.004;

  rocket.rotVel *= 0.95;
  rocket.angle += rocket.rotVel;

  // Always moving forward
  rocket.x += Math.cos(rocket.angle) * rocket.vel;
  rocket.y += Math.sin(rocket.angle) * rocket.vel;

  if (rocket.x < 0) rocket.x = canvas.width;
  if (rocket.x > canvas.width) rocket.x = 0;

  spawnObjects();

  asteroids.forEach(a => a.y += a.speed);
  projectiles.forEach(p => {
    p.x += Math.cos(p.angle) * p.speed;
    p.y += Math.sin(p.angle) * p.speed;
  });

  // Projectile → asteroid
  asteroids.forEach((a, ai) => {
    projectiles.forEach((p, pi) => {
      if (Math.hypot(a.x-p.x,a.y-p.y) < a.size/2) {
        spawnExplosion(a.x,a.y);
        asteroids.splice(ai,1);
        projectiles.splice(pi,1);
        score += a.cluster ? 50 : 10;
      }
    });

    // Asteroid → rocket (ONLY HERE)
    if (Math.hypot(a.x-rocket.x,a.y-rocket.y) < a.size/2) {
      spawnExplosion(rocket.x,rocket.y);
      endGame();
    }
  });

  asteroids = asteroids.filter(a => a.y < canvas.height + 200);
}

function drawRocket() {
  ctx.save();
  ctx.translate(rocket.x,rocket.y);
  ctx.rotate(rocket.angle + Math.PI/2);
  ctx.drawImage(rocketImg,-40,-40,80,80);
  ctx.restore();
}

function drawObjects() {
  asteroids.forEach(a=>{
    ctx.drawImage(a.img,a.x-a.size/2,a.y-a.size/2,a.size,a.size);
  });
  projectiles.forEach(p=>{
    ctx.drawImage(projectileImg,p.x-6,p.y-12,12,24);
  });
}

function drawExplosions() {
  explosions.forEach((e,i)=>{
    ctx.globalAlpha = 1 - e.frame/20;
    ctx.drawImage(explosionImg,e.x-50,e.y-50,100,100);
    ctx.globalAlpha = 1;
    e.frame++;
    if (e.frame>20) explosions.splice(i,1);
  });
}

function drawScore() {
  ctx.fillStyle="white";
  ctx.font="24px Arial";
  ctx.fillText("Score: "+score,20,40);
}

function endGame() {
  gameOver = true;
  document.getElementById("gameOver").style.display = "flex";
}
