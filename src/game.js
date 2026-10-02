import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

const VEHICLES = [
  {name:'Aruanã S',class:'Street',hp:190,top:215,acc:7.2,grip:.92,color:'#22d3ee'},
  {name:'Tucuna RS',class:'Street',hp:245,top:238,acc:6.1,grip:.96,color:'#fb7185'},
  {name:'Anhanguera GT',class:'Grand Tourer',hp:330,top:268,acc:5.1,grip:1.01,color:'#f59e0b'},
  {name:'Bandeira R',class:'Sport',hp:410,top:286,acc:4.4,grip:1.08,color:'#a78bfa'},
  {name:'Tietê Turbo',class:'Sport',hp:365,top:278,acc:4.8,grip:1.04,color:'#34d399'},
  {name:'Capivara XR',class:'Rally',hp:305,top:248,acc:5.0,grip:1.13,color:'#f97316'},
  {name:'Jatobá 4X',class:'Rally',hp:350,top:252,acc:4.7,grip:1.18,color:'#84cc16'},
  {name:'Pirajuí V6',class:'Muscle',hp:455,top:274,acc:4.6,grip:.94,color:'#ef4444'},
  {name:'Cana Brava',class:'Muscle',hp:520,top:292,acc:4.2,grip:.92,color:'#eab308'},
  {name:'Mogiana R',class:'Track',hp:460,top:302,acc:3.9,grip:1.22,color:'#60a5fa'},
  {name:'Moreto RS',class:'Track',hp:510,top:315,acc:3.6,grip:1.25,color:'#f472b6'},
  {name:'Elisa GT4',class:'Track',hp:540,top:321,acc:3.5,grip:1.27,color:'#2dd4bf'},
  {name:'Flamboyant X',class:'Super',hp:610,top:338,acc:3.1,grip:1.29,color:'#c084fc'},
  {name:'São João V10',class:'Super',hp:690,top:352,acc:2.9,grip:1.31,color:'#38bdf8'},
  {name:'Morada R1',class:'Super',hp:720,top:361,acc:2.7,grip:1.34,color:'#fb7185'},
  {name:'Monjolinho EV',class:'Electric',hp:760,top:335,acc:2.4,grip:1.30,color:'#22c55e'},
  {name:'Capivari E-X',class:'Electric',hp:830,top:354,acc:2.2,grip:1.33,color:'#06b6d4'},
  {name:'Horizonte 900',class:'Hyper',hp:900,top:382,acc:2.1,grip:1.36,color:'#f43f5e'},
  {name:'Paulista H1',class:'Hyper',hp:980,top:405,acc:1.9,grip:1.39,color:'#8b5cf6'},
  {name:'Rio Capivari X',class:'Hyper',hp:1080,top:425,acc:1.8,grip:1.42,color:'#10b981'}
];

const DISTRICTS = [
  {name:'Centro',x:0,z:0},
  {name:'Moreto',x:-420,z:-180},
  {name:'Jardim Elisa',x:350,z:-250},
  {name:'Morada do Sol',x:420,z:260},
  {name:'São João',x:-310,z:300},
  {name:'Flamboyant',x:110,z:430}
];

const TRACK = [
  new THREE.Vector3(-34,0,60), new THREE.Vector3(120,0,20), new THREE.Vector3(270,0,-105),
  new THREE.Vector3(390,0,-245), new THREE.Vector3(470,0,-70), new THREE.Vector3(420,0,170),
  new THREE.Vector3(250,0,335), new THREE.Vector3(60,0,430), new THREE.Vector3(-145,0,385),
  new THREE.Vector3(-340,0,265), new THREE.Vector3(-430,0,60), new THREE.Vector3(-290,0,-120),
  new THREE.Vector3(-120,0,-170), new THREE.Vector3(-20,0,-60)
];

const UI = {};
[
  'boot','bootText','bootBar','menu','raceBtn','freeBtn','garageBtn','selectedCarLabel','garage',
  'garageClose','garageGrid','hud','position','lap','checkpoint','district','modeLabel','minimap',
  'speedValue','gearValue','countdown','pauseBtn','pause','resumeBtn','restartBtn','menuBtn',
  'finish','finishTitle','finishText','podium','againBtn','finishMenuBtn','toast','touch',
  'fatal','fatalMessage','gameMount'
].forEach(function(id){ UI[id] = document.getElementById(id); });

let renderer, scene, camera, clock;
let player, playerVisual, checkpointGroup;
let selectedVehicle = Math.max(0, Math.min(VEHICLES.length - 1, Number(localStorage.getItem('ch_vehicle') || 0)));
let gameMode = null;
let running = false;
let paused = false;
let raceFinished = false;
let speed = 0;
let yaw = 0;
let steer = 0;
let lap = 1;
let checkpointIndex = 1;
let raceStart = 0;
let countdownEnd = 0;
let frameCount = 0;
let aiCars = [];
let lastToast = 0;

const keys = {gas:false,brake:false,left:false,right:false,handbrake:false};
const playerStart = TRACK[0].clone();

window.addEventListener('error', function(e){ showFatal(e.message || 'Erro inesperado ao carregar o jogo.'); });
window.addEventListener('unhandledrejection', function(e){ showFatal((e.reason && e.reason.message) || 'Falha ao inicializar o jogo.'); });

function showFatal(message){
  if (!UI.fatal) return;
  UI.fatal.hidden = false;
  UI.fatalMessage.textContent = message;
}

function show(el){ if(el) el.classList.add('is-visible'); }
function hide(el){ if(el) el.classList.remove('is-visible'); }
function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
function lerp(a,b,t){ return a + (b-a)*t; }

function toast(text){
  const now = performance.now();
  if(now - lastToast < 500) return;
  lastToast = now;
  UI.toast.textContent = text;
  UI.toast.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(function(){ UI.toast.classList.remove('show'); },1700);
}

function seeded(seed){
  let s = seed >>> 0;
  return function(){ s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function buildGarage(){
  UI.garageGrid.innerHTML = '';
  VEHICLES.forEach(function(car,i){
    const card = document.createElement('article');
    card.className = 'car-card' + (i === selectedVehicle ? ' selected' : '');
    card.innerHTML =
      '<div class="eyebrow">' + car.class + '</div>' +
      '<h3>' + car.name + '</h3>' +
      '<small>' + car.hp + ' cv • ' + car.top + ' km/h</small>' +
      '<div class="stats">' +
        '<div class="stat">0–100<b>' + car.acc.toFixed(1) + ' s</b></div>' +
        '<div class="stat">Aderência<b>' + Math.round(car.grip*100) + '</b></div>' +
      '</div>' +
      '<div class="swatch" style="background:' + car.color + '"></div>';
    card.addEventListener('click', function(){
      selectedVehicle = i;
      localStorage.setItem('ch_vehicle', String(i));
      updateSelectedCarLabel();
      buildGarage();
      toast(car.name + ' selecionado');
      if(playerVisual) recolorCar(playerVisual, car.color);
    });
    UI.garageGrid.appendChild(card);
  });
}

function updateSelectedCarLabel(){
  UI.selectedCarLabel.textContent = VEHICLES[selectedVehicle].name;
}

function carMesh(color, scale){
  const group = new THREE.Group();
  group.userData.bodyMaterials = [];
  const bodyMat = new THREE.MeshStandardMaterial({color:color,roughness:.28,metalness:.52});
  const darkMat = new THREE.MeshStandardMaterial({color:0x091019,roughness:.32,metalness:.35});
  const glassMat = new THREE.MeshStandardMaterial({color:0x10263b,roughness:.08,metalness:.3,transparent:true,opacity:.83});
  const lightMat = new THREE.MeshStandardMaterial({color:0xe7fbff,emissive:0xbbeeff,emissiveIntensity:1.8});

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.05,.48,4.45),bodyMat);
  chassis.position.y = .58;
  chassis.castShadow = true;
  group.add(chassis); group.userData.bodyMaterials.push(bodyMat);

  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.9,.30,1.30),bodyMat);
  hood.position.set(0,.86,1.18); hood.rotation.x = -.04; hood.castShadow = true; group.add(hood);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.62,.58,1.85),glassMat);
  cabin.position.set(0,1.05,-.28); cabin.rotation.x = -.02; group.add(cabin);

  const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.72,.08,.38),darkMat);
  spoiler.position.set(0,.98,-2.03); group.add(spoiler);

  const wheelGeo = new THREE.CylinderGeometry(.38,.38,.28,14);
  const wheelPositions = [[-.98,.42,1.38],[.98,.42,1.38],[-.98,.42,-1.35],[.98,.42,-1.35]];
  wheelPositions.forEach(function(p){
    const w = new THREE.Mesh(wheelGeo,darkMat);
    w.rotation.z = Math.PI/2; w.position.set(p[0],p[1],p[2]); w.castShadow = true; group.add(w);
  });

  [-.63,.63].forEach(function(x){
    const l = new THREE.Mesh(new THREE.BoxGeometry(.38,.12,.07),lightMat);
    l.position.set(x,.67,2.24); group.add(l);
  });

  group.scale.setScalar(scale || 1);
  return group;
}

function recolorCar(group,color){
  if(!group || !group.userData.bodyMaterials) return;
  group.userData.bodyMaterials.forEach(function(m){ m.color.set(color); });
}

function roadBetween(a,b,width,material,y){
  const dx = b.x-a.x, dz = b.z-a.z;
  const len = Math.hypot(dx,dz);
  const road = new THREE.Mesh(new THREE.BoxGeometry(width,.10,len),material);
  road.position.set((a.x+b.x)/2,y || .04,(a.z+b.z)/2);
  road.rotation.y = Math.atan2(dx,dz);
  road.receiveShadow = true;
  scene.add(road);
  return road;
}

function createWorld(){
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8fc7e8);
  scene.fog = new THREE.FogExp2(0x9dcbe4,.00078);

  camera = new THREE.PerspectiveCamera(66,innerWidth/innerHeight,.1,2500);
  camera.position.set(0,9,-15);

  renderer = new THREE.WebGLRenderer({antialias:!matchMedia('(pointer:coarse)').matches,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
  renderer.setSize(innerWidth,innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.shadowMap.enabled = !matchMedia('(pointer:coarse)').matches;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = 'webgl';
  UI.gameMount.appendChild(renderer.domElement);

  const hemi = new THREE.HemisphereLight(0xd9f4ff,0x5b6d44,2.1);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0d5,3.2);
  sun.position.set(-260,420,-180);
  sun.castShadow = renderer.shadowMap.enabled;
  sun.shadow.mapSize.set(2048,2048);
  sun.shadow.camera.left = -700; sun.shadow.camera.right = 700;
  sun.shadow.camera.top = 700; sun.shadow.camera.bottom = -700;
  scene.add(sun);

  const groundMat = new THREE.MeshStandardMaterial({color:0x729967,roughness:1});
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1800,1800),groundMat);
  ground.rotation.x = -Math.PI/2; ground.position.y = -.07; ground.receiveShadow = true; scene.add(ground);

  const roadMat = new THREE.MeshStandardMaterial({color:0x252b31,roughness:.87});
  const avenueMat = new THREE.MeshStandardMaterial({color:0x20262c,roughness:.82});
  for(let i=0;i<TRACK.length;i++) roadBetween(TRACK[i],TRACK[(i+1)%TRACK.length],22,avenueMat,.02);

  const gridXs = [-480,-360,-240,-120,0,120,240,360,480];
  const gridZs = [-420,-300,-180,-60,60,180,300,420];
  gridXs.forEach(function(x){ roadBetween(new THREE.Vector3(x,0,-520),new THREE.Vector3(x,0,520),10,roadMat,.015); });
  gridZs.forEach(function(z){ roadBetween(new THREE.Vector3(-540,0,z),new THREE.Vector3(540,0,z),10,roadMat,.015); });

  const lineMat = new THREE.MeshBasicMaterial({color:0xe8e0a6});
  for(let i=0;i<TRACK.length;i++){
    const a=TRACK[i], b=TRACK[(i+1)%TRACK.length];
    const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);
    const line = new THREE.Mesh(new THREE.BoxGeometry(.35,.025,Math.max(0,len-6)),lineMat);
    line.position.set((a.x+b.x)/2,.09,(a.z+b.z)/2);
    line.rotation.y=Math.atan2(dx,dz); scene.add(line);
  }

  createRiver();
  createBuildings();
  createTrees();
  createDistrictMarkers();
  createCheckpoints();

  player = new THREE.Group();
  playerVisual = carMesh(VEHICLES[selectedVehicle].color,1);
  player.add(playerVisual);
  scene.add(player);
  resetPlayer();

  createAI();
}

function createRiver(){
  const waterMat = new THREE.MeshStandardMaterial({color:0x3f93ad,roughness:.22,metalness:.04,transparent:true,opacity:.88});
  const pts = [
    new THREE.Vector3(-620,0,-430),new THREE.Vector3(-420,0,-300),new THREE.Vector3(-220,0,-250),
    new THREE.Vector3(0,0,-300),new THREE.Vector3(210,0,-390),new THREE.Vector3(520,0,-350),
    new THREE.Vector3(680,0,-250)
  ];
  for(let i=0;i<pts.length-1;i++) roadBetween(pts[i],pts[i+1],34,waterMat,-.02);
}

function createBuildings(){
  const rnd = seeded(20261002);
  const geom = new THREE.BoxGeometry(1,1,1);
  const palette = [0xd9d4c8,0xc7b7a1,0xbfcbd2,0xe0c2a2,0xaeb8b6,0xd8d8d5];
  const mats = palette.map(function(c){return new THREE.MeshStandardMaterial({color:c,roughness:.82});});
  const count = 360;
  const meshes = mats.map(function(m){const im=new THREE.InstancedMesh(geom,m,Math.ceil(count/mats.length)+10); im.castShadow=renderer.shadowMap.enabled; im.receiveShadow=true; return im;});
  const used = new Array(meshes.length).fill(0);
  const matrix = new THREE.Matrix4();

  for(let i=0;i<count;i++){
    let x = -520 + rnd()*1040;
    let z = -500 + rnd()*1000;
    const nearGridX = Math.min.apply(null,[-480,-360,-240,-120,0,120,240,360,480].map(function(v){return Math.abs(x-v);}));
    const nearGridZ = Math.min.apply(null,[-420,-300,-180,-60,60,180,300,420].map(function(v){return Math.abs(z-v);}));
    if(nearGridX < 13 || nearGridZ < 13){ i--; continue; }
    if(distanceToTrack(x,z) < 22){ i--; continue; }
    const w=10+rnd()*18,d=10+rnd()*19,h=5+rnd()*24*(Math.hypot(x,z)<220?1.45:1);
    const p = new THREE.Vector3(x,h/2,z);
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0,(rnd()-.5)*.08,0));
    matrix.compose(p,q,new THREE.Vector3(w,h,d));
    const mi=i%mats.length, idx=used[mi]++;
    meshes[mi].setMatrixAt(idx,matrix);
  }
  meshes.forEach(function(m){m.count=used[meshes.indexOf(m)];m.instanceMatrix.needsUpdate=true;scene.add(m);});
}

function createTrees(){
  const rnd = seeded(88);
  const trunkMat = new THREE.MeshStandardMaterial({color:0x6f5338,roughness:1});
  const leafMat = new THREE.MeshStandardMaterial({color:0x3f7447,roughness:1});
  for(let i=0;i<90;i++){
    const x=-620+rnd()*1240,z=-560+rnd()*1120;
    if(distanceToTrack(x,z)<32) continue;
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.5,.7,4.4,7),trunkMat);
    trunk.position.set(x,2,z);scene.add(trunk);
    const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(2.8+rnd()*1.5,1),leafMat);
    crown.position.set(x,5.1,z);scene.add(crown);
  }
}

function createDistrictMarkers(){
  DISTRICTS.forEach(function(d){
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,7,8),new THREE.MeshStandardMaterial({color:0x394653}));
    pole.position.set(d.x,3.5,d.z); scene.add(pole);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.2,.15,10,28),new THREE.MeshBasicMaterial({color:0x25e6d4}));
    ring.position.set(d.x,7.5,d.z); ring.rotation.x=Math.PI/2; scene.add(ring);
  });
}

function createCheckpoints(){
  checkpointGroup = new THREE.Group();
  TRACK.forEach(function(p,i){
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({color:0x25e6d4,emissive:0x0a4b48,emissiveIntensity:.9});
    const left=new THREE.Mesh(new THREE.BoxGeometry(.35,5,.35),mat);
    const right=new THREE.Mesh(new THREE.BoxGeometry(.35,5,.35),mat);
    const top=new THREE.Mesh(new THREE.BoxGeometry(13,.35,.35),mat);
    left.position.set(-6.5,2.5,0);right.position.set(6.5,2.5,0);top.position.set(0,5,0);
    g.add(left,right,top);g.position.copy(p);g.userData.material=mat;
    const next=TRACK[(i+1)%TRACK.length],dx=next.x-p.x,dz=next.z-p.z;
    g.rotation.y=Math.atan2(dx,dz);
    checkpointGroup.add(g);
  });
  scene.add(checkpointGroup);
  updateCheckpointVisuals();
}

function updateCheckpointVisuals(){
  if(!checkpointGroup) return;
  checkpointGroup.children.forEach(function(g,i){
    const active = gameMode==='race' && i===checkpointIndex;
    g.visible = gameMode==='race';
    g.userData.material.color.set(active?0xffd34f:0x25e6d4);
    g.userData.material.emissiveIntensity = active?3.5:.6;
  });
}

function createAI(){
  aiCars.forEach(function(a){ scene.remove(a.group); });
  aiCars=[];
  const names=['Nando','Bia','Caio','Luna','Rafa','Theo','Maya'];
  const colors=['#ef4444','#f59e0b','#8b5cf6','#14b8a6','#3b82f6','#ec4899','#84cc16'];
  for(let i=0;i<7;i++){
    const group=carMesh(colors[i],.92);
    scene.add(group);
    aiCars.push({
      name:names[i],group:group,progress:-.13*(i+1),lap:0,
      pace:.87+i*.018+(i%3)*.01,lane:(i%2?1:-1)*(2.2+Math.floor(i/2)*.7),finished:false,finishTime:null
    });
  }
}

function distanceToTrack(x,z){
  let best=1e9;
  for(let i=0;i<TRACK.length;i++){
    const a=TRACK[i],b=TRACK[(i+1)%TRACK.length];
    const abx=b.x-a.x,abz=b.z-a.z,apx=x-a.x,apz=z-a.z;
    const den=abx*abx+abz*abz;
    const t=clamp((apx*abx+apz*abz)/den,0,1);
    const dx=x-(a.x+abx*t),dz=z-(a.z+abz*t);
    best=Math.min(best,Math.hypot(dx,dz));
  }
  return best;
}

function resetPlayer(){
  if(!player) return;
  const next=TRACK[1];
  player.position.copy(playerStart);
  player.position.y=.05;
  yaw=Math.atan2(next.x-playerStart.x,next.z-playerStart.z);
  player.rotation.y=yaw;
  speed=0;steer=0;
}

function resetRaceState(){
  lap=1;checkpointIndex=1;raceFinished=false;
  createAI();
  aiCars.forEach(function(a,i){a.progress=-.13*(i+1);a.lap=0;a.finished=false;a.finishTime=null;});
  updateCheckpointVisuals();
}

function startGame(mode){
  gameMode=mode;
  hide(UI.menu);hide(UI.garage);hide(UI.pause);hide(UI.finish);
  show(UI.hud);
  UI.touch.classList.toggle('active',matchMedia('(pointer:coarse)').matches);
  UI.modeLabel.textContent=mode==='race'?'CORRIDA • CIRCUITO CAPIVARI':'PASSEIO LIVRE';
  resetPlayer();resetRaceState();
  paused=false;running=true;
  raceStart=performance.now()+3100;
  countdownEnd=raceStart;
  if(mode==='free'){raceStart=performance.now();countdownEnd=0;checkpointGroup.visible=false;}
  updateCheckpointVisuals();
  renderer.domElement.focus();
}

function exitToMenu(){
  running=false;paused=false;gameMode=null;speed=0;
  hide(UI.hud);hide(UI.pause);hide(UI.finish);
  UI.touch.classList.remove('active');
  show(UI.menu);
  if(checkpointGroup) checkpointGroup.visible=false;
}

function togglePause(force){
  if(!running||raceFinished)return;
  paused=typeof force==='boolean'?force:!paused;
  if(paused) show(UI.pause); else hide(UI.pause);
}

function nearestDistrict(){
  let best=DISTRICTS[0],dist=Infinity;
  DISTRICTS.forEach(function(d){
    const dd=Math.hypot(player.position.x-d.x,player.position.z-d.z);
    if(dd<dist){dist=dd;best=d;}
  });
  return best.name;
}

function updatePlayer(dt,now){
  const car=VEHICLES[selectedVehicle];
  const locked=gameMode==='race'&&now<countdownEnd;
  const gas=!locked&&keys.gas, brake=!locked&&keys.brake;
  const maxSpeed=car.top/3.6;
  const reverseMax=13;

  const accelPower=(100/car.acc)*.72;
  if(gas) speed += accelPower*dt;
  if(brake){
    if(speed>1) speed -= 25*dt;
    else speed -= 10*dt;
  }

  const drag=1.15 + Math.abs(speed)*.016;
  if(!gas&&!brake){
    if(Math.abs(speed)<.18)speed=0;
    else speed -= Math.sign(speed)*drag*dt;
  }

  const offroad=distanceToTrack(player.position.x,player.position.z)>30;
  if(offroad){
    speed -= Math.sign(speed)*Math.min(Math.abs(speed),6.5*dt);
  }

  speed=clamp(speed,-reverseMax,maxSpeed*(offroad?.58:1));

  const steerInput=(keys.left?1:0)-(keys.right?1:0);
  steer=lerp(steer,steerInput,Math.min(1,dt*7));
  const velocityFactor=clamp(Math.abs(speed)/10,0,1);
  let turnRate=1.55*car.grip*velocityFactor;
  if(keys.handbrake) turnRate*=1.45;
  if(Math.abs(speed)>.2) yaw += steer*turnRate*dt*Math.sign(speed);
  player.rotation.y=yaw;

  const fwd=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw));
  player.position.addScaledVector(fwd,speed*dt);

  player.position.x=clamp(player.position.x,-760,760);
  player.position.z=clamp(player.position.z,-690,690);

  if(gameMode==='race'&&!locked) updateRaceProgress(now);
}

function updateRaceProgress(now){
  const target=TRACK[checkpointIndex];
  if(player.position.distanceTo(target)<27){
    checkpointIndex++;
    if(checkpointIndex>=TRACK.length){
      checkpointIndex=1;
      lap++;
      if(lap>2){
        finishRace(now);
        return;
      }
      toast('VOLTA ' + lap + ' / 2');
    } else {
      toast('Checkpoint ' + checkpointIndex + ' / ' + TRACK.length);
    }
    updateCheckpointVisuals();
  }
}

function playerProgress(){
  if(gameMode!=='race')return 0;
  const prevIndex=(checkpointIndex-1+TRACK.length)%TRACK.length;
  const prev=TRACK[prevIndex],next=TRACK[checkpointIndex];
  const seg=prev.distanceTo(next);
  const along=seg?clamp(1-player.position.distanceTo(next)/seg,0,1):0;
  return (lap-1)*TRACK.length+prevIndex+along;
}

function sampleTrack(progress,lane){
  let p=progress;
  while(p<0)p+=TRACK.length;
  const idx=Math.floor(p)%TRACK.length;
  const t=p-Math.floor(p);
  const a=TRACK[idx],b=TRACK[(idx+1)%TRACK.length];
  const pos=a.clone().lerp(b,t);
  const tangent=b.clone().sub(a).normalize();
  const side=new THREE.Vector3(tangent.z,0,-tangent.x);
  pos.addScaledVector(side,lane||0);
  return {pos:pos,yaw:Math.atan2(tangent.x,tangent.z)};
}

function updateAI(dt,now){
  if(!running||paused||gameMode!=='race'||now<countdownEnd)return;
  const targetSegmentsPerSec=.42;
  aiCars.forEach(function(ai,i){
    if(ai.finished)return;
    const variability=1+Math.sin(now*.0011+i*2.7)*.035;
    ai.progress+=targetSegmentsPerSec*ai.pace*variability*dt;
    if(ai.progress>=TRACK.length){
      ai.progress-=TRACK.length;
      ai.lap++;
      if(ai.lap>=2){ai.finished=true;ai.finishTime=now-raceStart;}
    }
    const s=sampleTrack(ai.progress,ai.lane);
    ai.group.position.copy(s.pos);ai.group.position.y=.04;ai.group.rotation.y=s.yaw;
  });
}

function raceOrder(){
  const entries=aiCars.map(function(a){
    return {name:a.name,progress:a.finished?9999-a.finishTime/100000:a.lap*TRACK.length+a.progress,player:false,finish:a.finishTime};
  });
  entries.push({name:'VOCÊ',progress:raceFinished?10000-(performance.now()-raceStart)/100000:playerProgress(),player:true,finish:raceFinished?performance.now()-raceStart:null});
  entries.sort(function(a,b){return b.progress-a.progress;});
  return entries;
}

function finishRace(now){
  if(raceFinished)return;
  raceFinished=true;speed=0;
  const elapsed=now-raceStart;
  const standings=aiCars.map(function(a){
    return {name:a.name,progress:a.finished?10000-a.finishTime/100000:a.lap*TRACK.length+a.progress,finish:a.finishTime};
  });
  standings.push({name:'VOCÊ',progress:10000-elapsed/100000,finish:elapsed});
  standings.sort(function(a,b){return b.progress-a.progress;});
  const place=standings.findIndex(function(s){return s.name==='VOCÊ';})+1;
  UI.finishTitle.textContent=place===1?'VITÓRIA EM CAPIVARI!':'CHEGADA EM ' + place + 'º';
  UI.finishText.textContent='Tempo: ' + formatTime(elapsed) + ' • ' + VEHICLES[selectedVehicle].name;
  UI.podium.innerHTML='';
  standings.slice(0,3).forEach(function(s,i){
    const d=document.createElement('div');
    d.innerHTML='<b>'+(i+1)+'º</b><span>'+s.name+'</span>';
    UI.podium.appendChild(d);
  });
  setTimeout(function(){show(UI.finish);},450);
}

function formatTime(ms){
  const total=Math.max(0,ms)/1000;
  const min=Math.floor(total/60),sec=total-min*60;
  return min+':'+sec.toFixed(3).padStart(6,'0');
}

function updateCamera(dt){
  if(!player)return;
  const fwd=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw));
  const desired=player.position.clone().addScaledVector(fwd,-10.8).add(new THREE.Vector3(0,5.5,0));
  const look=player.position.clone().addScaledVector(fwd,7).add(new THREE.Vector3(0,1.1,0));
  camera.position.lerp(desired,1-Math.pow(.001,dt));
  const target=new THREE.Vector3();
  camera.getWorldDirection(target);
  const currentLook=camera.position.clone().add(target.multiplyScalar(12));
  currentLook.lerp(look,1-Math.pow(.0005,dt));
  camera.lookAt(currentLook);
}

function updateHUD(now){
  const kmh=Math.round(Math.abs(speed)*3.6);
  UI.speedValue.textContent=String(kmh);
  UI.gearValue.textContent=speed<-.5?'R':kmh<3?'N':String(clamp(Math.ceil(kmh/48),1,7));
  UI.district.textContent=nearestDistrict();

  if(gameMode==='race'){
    const order=raceOrder();
    const pos=order.findIndex(function(e){return e.player;})+1;
    UI.position.textContent=pos+'/8';
    UI.lap.textContent='VOLTA '+Math.min(lap,2)+'/2';
    UI.checkpoint.textContent='CHECKPOINT '+checkpointIndex+'/'+TRACK.length;
    if(now<countdownEnd){
      const n=Math.ceil((countdownEnd-now)/1000);
      UI.countdown.textContent=n>0?String(n):'VAI!';
    } else if(UI.countdown.textContent){
      UI.countdown.textContent=now-countdownEnd<700?'VAI!':'';
    }
  }else{
    UI.position.textContent='LIVRE';
    UI.lap.textContent='EXPLORE';
    UI.checkpoint.textContent=VEHICLES[selectedVehicle].name;
    UI.countdown.textContent='';
  }
}

function drawMinimap(){
  const c=UI.minimap,ctx=c.getContext('2d');
  const w=c.width,h=c.height,scale=.19,ox=w/2,oy=h/2;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle='rgba(5,10,16,.72)';ctx.fillRect(0,0,w,h);
  ctx.strokeStyle='rgba(255,255,255,.28)';ctx.lineWidth=5;ctx.lineJoin='round';
  ctx.beginPath();
  TRACK.forEach(function(p,i){
    const x=ox+p.x*scale,y=oy+p.z*scale;
    if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  });
  ctx.closePath();ctx.stroke();

  DISTRICTS.forEach(function(d){
    ctx.fillStyle='rgba(255,255,255,.35)';
    ctx.beginPath();ctx.arc(ox+d.x*scale,oy+d.z*scale,2.2,0,Math.PI*2);ctx.fill();
  });

  if(gameMode==='race'){
    aiCars.forEach(function(a){
      ctx.fillStyle='#ff5a66';
      ctx.beginPath();ctx.arc(ox+a.group.position.x*scale,oy+a.group.position.z*scale,2.4,0,Math.PI*2);ctx.fill();
    });
    const cp=TRACK[checkpointIndex];
    ctx.strokeStyle='#ffd34f';ctx.lineWidth=2;ctx.beginPath();ctx.arc(ox+cp.x*scale,oy+cp.z*scale,6,0,Math.PI*2);ctx.stroke();
  }
  ctx.fillStyle='#25e6d4';ctx.beginPath();ctx.arc(ox+player.position.x*scale,oy+player.position.z*scale,4.3,0,Math.PI*2);ctx.fill();
}

function animate(){
  requestAnimationFrame(animate);
  if(!clock)return;
  const dt=Math.min(clock.getDelta(),.05),now=performance.now();
  if(running&&!paused&&!raceFinished){
    updatePlayer(dt,now);updateAI(dt,now);updateCamera(dt);updateHUD(now);
    if(++frameCount%2===0)drawMinimap();
  }else if(player){
    updateCamera(dt);
  }
  renderer.render(scene,camera);
}

function resetCurrent(){
  resetPlayer();
  if(gameMode==='race'){
    resetRaceState();
    raceStart=performance.now()+3100;countdownEnd=raceStart;
  }
  hide(UI.finish);raceFinished=false;paused=false;hide(UI.pause);
}

function bindControls(){
  const map={ArrowUp:'gas',KeyW:'gas',ArrowDown:'brake',KeyS:'brake',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'handbrake'};
  window.addEventListener('keydown',function(e){
    if(map[e.code]){keys[map[e.code]]=true;e.preventDefault();}
    if(e.code==='KeyR'&&running)resetPlayer();
    if(e.code==='Escape'&&running)togglePause();
  },{passive:false});
  window.addEventListener('keyup',function(e){
    if(map[e.code]){keys[map[e.code]]=false;e.preventDefault();}
  },{passive:false});

  document.querySelectorAll('#touch [data-control]').forEach(function(btn){
    const c=btn.dataset.control;
    const on=function(e){e.preventDefault();keys[c]=true;try{btn.setPointerCapture(e.pointerId);}catch(_){}};
    const off=function(e){e.preventDefault();keys[c]=false;};
    btn.addEventListener('pointerdown',on,{passive:false});
    btn.addEventListener('pointerup',off,{passive:false});
    btn.addEventListener('pointercancel',off,{passive:false});
    btn.addEventListener('lostpointercapture',off,{passive:false});
    btn.addEventListener('pointerleave',function(e){if(e.buttons===0)off(e);},{passive:false});
  });

  window.addEventListener('blur',function(){Object.keys(keys).forEach(function(k){keys[k]=false;});if(running&&!raceFinished)togglePause(true);});
  document.addEventListener('visibilitychange',function(){if(document.hidden&&running&&!raceFinished)togglePause(true);});
}

function bindUI(){
  UI.raceBtn.addEventListener('click',function(){startGame('race');});
  UI.freeBtn.addEventListener('click',function(){startGame('free');});
  UI.garageBtn.addEventListener('click',function(){hide(UI.menu);show(UI.garage);});
  UI.garageClose.addEventListener('click',function(){hide(UI.garage);show(UI.menu);});
  UI.pauseBtn.addEventListener('click',function(){togglePause();});
  UI.resumeBtn.addEventListener('click',function(){togglePause(false);});
  UI.restartBtn.addEventListener('click',function(){resetCurrent();});
  UI.menuBtn.addEventListener('click',exitToMenu);
  UI.finishMenuBtn.addEventListener('click',exitToMenu);
  UI.againBtn.addEventListener('click',function(){hide(UI.finish);startGame('race');});
}

function onResize(){
  if(!camera||!renderer)return;
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
}
window.addEventListener('resize',onResize);

async function boot(){
  try{
    UI.bootBar.style.width='16%';
    if(!window.WebGLRenderingContext) throw new Error('Este navegador não oferece suporte a WebGL.');
    UI.bootText.textContent='Montando ruas e bairros...';
    UI.bootBar.style.width='38%';
    buildGarage();updateSelectedCarLabel();bindUI();bindControls();
    createWorld();
    clock=new THREE.Clock();
    UI.bootBar.style.width='78%';
    try{
      const res=await fetch('./data/capivari.json',{cache:'no-store'});
      if(res.ok) await res.json();
    }catch(_){}
    UI.bootText.textContent='Ligando os motores...';
    UI.bootBar.style.width='100%';
    animate();
    setTimeout(function(){hide(UI.boot);show(UI.menu);},350);
  }catch(err){
    console.error(err);
    showFatal(err && err.message ? err.message : 'Falha ao iniciar Capivari Horizon.');
  }
}

boot();

window.CapivariHorizon = {
  version:'0.2.0',
  vehicles:VEHICLES,
  districts:DISTRICTS,
  start:startGame,
  reset:resetCurrent
};
