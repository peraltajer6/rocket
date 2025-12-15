const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;

// Images
const bg = new Image(); bg.src = "assets/gbg.png";
const rocketImg = new Image(); rocketImg.src = "assets/rocket.png";
const projectileImg = new Image(); projectileImg.src = "assets/projectile.png";
const explosionImg = new Image(); explosionImg.src = "assets/exploded.png";
const boImg = new Image(); boImg.src = "assets/bo.png";

const astImgs = ["assets/ast1.png","assets/ast2.png"].map(s=>{let i=new Image();i.src=s;return i});
const clusterImgs = ["assets/c1.png","assets/c2.png"].map(s=>{let i=new Image();i.src=s;return i});

// State
let running=false, gameOver=false, countdown=false;
let score=0, bgY=0, startTime=0;

// Rocket
const rocket={
  x:canvas.width/2,
  y:canvas.height*0.7,
  angle:-Math.PI/2,
  speed:4.8
};

let asteroids=[], projectiles=[], explosions=[];
let lastAst=0, lastCluster=0;

const SCALE = 1.75;

// Controls
const keys={};
addEventListener("keydown",e=>{
  keys[e.key]=true;
  if(e.key==="ArrowUp" && running && !gameOver && !countdown) shoot();
  if(gameOver && e.key.toLowerCase()==="r") restart();
});
addEventListener("keyup",e=>keys[e.key]=false);

// PLAY
document.getElementById("playBtn").onclick=()=>{
  document.getElementById("menu").style.display="none";
  canvas.style.display="block";
  startCountdown();
};

// Restart
function restart(){
  document.getElementById("gameOver").style.display="none";
  startCountdown();
}

// Countdown start
function startCountdown(){
  reset();
  countdown=true;
  running=true;
  startTime=performance.now();
  loop();
}

// Shooting from tip
function shoot(){
  const tipX = rocket.x + Math.cos(rocket.angle)*45;
  const tipY = rocket.y + Math.sin(rocket.angle)*45;
  projectiles.push({ x:tipX, y:tipY, angle:rocket.angle, speed:11 });
}

function reset(){
  asteroids=[]; projectiles=[]; explosions=[];
  score=0; gameOver=false;
  rocket.x=canvas.width/2;
  rocket.angle=-Math.PI/2;
}

// Spawns
function spawnAsteroid(){
  asteroids.push({
    x:Math.random()*canvas.width,
    y:-120,
    size:55*SCALE,
    speed:2.5,
    img:astImgs[Math.random()*astImgs.length|0],
    cluster:false
  });
}

function spawnCluster(){
  asteroids.push({
    x:Math.random()*canvas.width,
    y:-180,
    size:130*SCALE,
    speed:1.6,
    img:clusterImgs[Math.random()*clusterImgs.length|0],
    cluster:true
  });
}

function loop(){
  if(!running) return;

  ctx.clearRect(0,0,canvas.width,canvas.height);

  bgY+=2;
  if(bgY>=canvas.height) bgY=0;
  ctx.drawImage(bg,0,bgY-canvas.height,canvas.width,canvas.height);
  ctx.drawImage(bg,0,bgY,canvas.width,canvas.height);

  const now=performance.now();

  if(countdown){
    if(now-startTime<3000){
      ctx.drawImage(boImg,canvas.width/2-150,canvas.height/2-75,300,150);
    } else {
      countdown=false;
    }
  } else if(!gameOver){
    update(now);
  }

  drawRocket();
  drawObjects();
  drawRocketExplosions();
  drawScore();

  requestAnimationFrame(loop);
}

function update(now){
  if(keys["ArrowLeft"]) rocket.angle-=0.055;
  if(keys["ArrowRight"]) rocket.angle+=0.055;

  rocket.x+=Math.cos(rocket.angle)*rocket.speed;
  rocket.y+=Math.sin(rocket.angle)*rocket.speed;

  if(rocket.x<0) rocket.x=canvas.width;
  if(rocket.x>canvas.width) rocket.x=0;

  if(now-lastAst>800){ spawnAsteroid(); lastAst=now; }
  if(now-lastCluster>2800){ spawnCluster(); lastCluster=now; }

  asteroids.forEach(a=>a.y+=a.speed);
  projectiles.forEach(p=>{
    p.x+=Math.cos(p.angle)*p.speed;
    p.y+=Math.sin(p.angle)*p.speed;
  });

  asteroids.forEach((a,ai)=>{
    projectiles.forEach((p,pi)=>{
      if(Math.hypot(a.x-p.x,a.y-p.y)<a.size/2){
        asteroids.splice(ai,1);
        projectiles.splice(pi,1);
        score+=a.cluster?50:10;
      }
    });

    if(Math.hypot(a.x-rocket.x,a.y-rocket.y)<a.size/2){
      spawnRocketExplosion(rocket.x,rocket.y);
      endGame();
    }
  });
}

// ONLY for rocket
function spawnRocketExplosion(x,y){
  explosions.push({x,y,f:0});
}

function drawRocket(){
  ctx.save();
  ctx.translate(rocket.x,rocket.y);
  ctx.rotate(rocket.angle+Math.PI/2);
  ctx.drawImage(rocketImg,-40,-40,80,80);
  ctx.restore();
}

function drawObjects(){
  asteroids.forEach(a=>{
    ctx.drawImage(a.img,a.x-a.size/2,a.y-a.size/2,a.size,a.size);
  });
  projectiles.forEach(p=>{
    ctx.drawImage(projectileImg,p.x-6,p.y-12,12,24);
  });
}

function drawRocketExplosions(){
  explosions.forEach((e,i)=>{
    ctx.globalAlpha=1-e.f/20;
    ctx.drawImage(explosionImg,e.x-60,e.y-60,120,120);
    ctx.globalAlpha=1;
    e.f++; if(e.f>20) explosions.splice(i,1);
  });
}

function drawScore(){
  ctx.fillStyle="white";
  ctx.font="24px Arial";
  ctx.fillText("Score: "+score,20,40);
}

function endGame(){
  gameOver=true;
  document.getElementById("gameOver").style.display="flex";
}
