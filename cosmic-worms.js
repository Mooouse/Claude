/* Infinity Space — Cosmic Worms: original single-player .io serpent arena.
   Slither-style growth/boost/body-collision mechanics; all rivals are local AI.
   No external game logic, assets, account or network requests. */
(()=>{'use strict';
const QUERY=new URLSearchParams(location.search);
const HASH_QUERY=new URLSearchParams(location.hash.slice(1));
const DEMO=QUERY.has('demo')||HASH_QUERY.has('demo');
if(DEMO)document.documentElement.classList.add('worm-demo');
const storedLang=(()=>{try{return localStorage.getItem('infiniti-space-language')||''}catch(_){return ''}})();
const language=/^(ru|en|es)$/.test(storedLang)?storedLang:(/^ru/i.test(navigator.language)?'ru':/^es/i.test(navigator.language)?'es':'en');
document.documentElement.lang=language;
const WORDS={
 en:{settings:'SETTINGS',skins:'COSMIC SKINS',skinDesc:'Choose a space-inspired appearance. All skins are free.',visuals:'VISUALS',glow:'Enhanced glow and boost trails',names:'Show rival names',zoom:'Camera distance',backPause:'BACK TO PAUSE',length:'LENGTH',rank:'RANK',time:'TIME',leaders:'LEADERBOARD',radar:'GALAXY RADAR',pause:'PAUSE',
 boost:'BOOST',paused:'PAUSED',pauseDesc:'Resume the flight, review the controls or return to mode selection.',
 resume:'CONTINUE',help:'HOW TO PLAY',menu:'EXIT TO MENU',guideTitle:'COSMIC WORMS',skip:'SKIP',next:'NEXT',start:'START',
 runOver:'FLIGHT COMPLETE',destroyed:'WORM DESTROYED',kills:'ELIMINATIONS',again:'PLAY AGAIN',
 hint:'MOUSE / WASD — TURN  ·  SPACE / CLICK — BOOST',bot:'COSMIC WORMS · SURVIVAL',danger:'THE EDGE OF SPACE!',
 eliminated:'A rival cut off your route.',wall:'You reached the outer boundary.',self:'A head-on collision.',
 lead:'YOU ARE #1',mass:'ORBS COLLECTED',guide:[
 ['GROW A COSMIC TAIL','Move toward glowing stardust. Each orb adds mass and segments to your cosmic serpent.','✦'],
 ['OUTMANEUVER RIVALS','Your head must not touch another worm’s body. Cut opponents off with your own tail; defeated worms drop valuable matter.','◌'],
 ['BOOST WHEN NEEDED','Hold Space or the mouse button to accelerate. Boosting slowly burns mass and drops energy behind you. On phones, steer with the joystick and hold BOOST.','➤']
 ]},
 ru:{settings:'НАСТРОЙКИ',skins:'КОСМИЧЕСКИЕ СКИНЫ',skinDesc:'Выбери космический облик червя. Все скины бесплатны.',visuals:'ГРАФИКА',glow:'Усиленное свечение и след рывка',names:'Показывать имена соперников',zoom:'Дистанция камеры',backPause:'НАЗАД К ПАУЗЕ',length:'ДЛИНА',rank:'МЕСТО',time:'ВРЕМЯ',leaders:'ТАБЛИЦА ЛИДЕРОВ',radar:'РАДАР ГАЛАКТИКИ',pause:'ПАУЗА',
 boost:'РЫВОК',paused:'ПАУЗА',pauseDesc:'Продолжи полёт, посмотри обучение или вернись к выбору режима.',
 resume:'ПРОДОЛЖИТЬ',help:'КАК ИГРАТЬ',menu:'ВЫХОД В МЕНЮ',guideTitle:'КОСМИЧЕСКИЕ ЧЕРВИ',skip:'ПРОПУСТИТЬ',next:'ДАЛЕЕ',start:'ИГРАТЬ',
 runOver:'ПОЛЁТ ЗАВЕРШЁН',destroyed:'ЧЕРВЬ ПОГИБ',kills:'ПОГЛОЩЕНО',again:'СЫГРАТЬ СНОВА',
 hint:'МЫШЬ / WASD — ПОВОРОТ  ·  ПРОБЕЛ / КЛИК — РЫВОК',bot:'КОСМИЧЕСКИЕ ЧЕРВИ · ВЫЖИВАНИЕ',danger:'КРАЙ КОСМОСА!',
 eliminated:'Соперник перекрыл тебе путь.',wall:'Ты достиг границы арены.',self:'Столкновение головами.',
 lead:'ТЫ НА ПЕРВОМ МЕСТЕ',mass:'СОБРАНО ЧАСТИЦ',guide:[
 ['РАСТИ И УДЛИНЯЙСЯ','Собирай светящиеся звёздные частицы. От них космический червь растёт и становится длиннее.','✦'],
 ['ПЕРЕХИТРИ СОПЕРНИКОВ','Не касайся головой тела другого червя. Перекрывай противникам путь собственным хвостом. После их гибели остаётся ценная материя.','◌'],
 ['ИСПОЛЬЗУЙ РЫВОК','Удерживай Пробел или левую кнопку мыши для ускорения. Рывок расходует массу. На телефоне управляй стиком и удерживай кнопку «Рывок».','➤']
 ]},
 es:{settings:'AJUSTES',skins:'ASPECTOS CÓSMICOS',skinDesc:'Elige un aspecto cósmico. Todos son gratuitos.',visuals:'GRÁFICOS',glow:'Brillo y estelas mejorados',names:'Mostrar nombres de rivales',zoom:'Distancia de cámara',backPause:'VOLVER A PAUSA',length:'LONGITUD',rank:'PUESTO',time:'TIEMPO',leaders:'CLASIFICACIÓN',radar:'RADAR GALÁCTICO',pause:'PAUSA',
 boost:'IMPULSO',paused:'PAUSA',pauseDesc:'Continúa, revisa los controles o elige otro modo.',
 resume:'CONTINUAR',help:'CÓMO JUGAR',menu:'SALIR AL MENÚ',guideTitle:'GUSANOS CÓSMICOS',skip:'SALTAR',next:'SIGUIENTE',start:'JUGAR',
 runOver:'VUELO TERMINADO',destroyed:'GUSANO DESTRUIDO',kills:'ELIMINACIONES',again:'JUGAR DE NUEVO',
 hint:'RATÓN / WASD — GIRAR · ESPACIO / CLIC — IMPULSO',bot:'GUSANOS CÓSMICOS · SUPERVIVENCIA',danger:'¡LÍMITE ESPACIAL!',
 eliminated:'Un rival bloqueó tu camino.',wall:'Alcanzaste el borde de la arena.',self:'Choque frontal.',
 lead:'¡VAS PRIMERO!',mass:'PARTÍCULAS RECOGIDAS',guide:[
 ['CRECE TU COLA','Recoge partículas luminosas. Cada esfera añade masa y alarga tu gusano cósmico.','✦'],
 ['ESQUIVA A LOS RIVALES','Tu cabeza no debe tocar el cuerpo de otros gusanos. Bloquea su ruta con tu cola; los derrotados sueltan materia.','◌'],
 ['ACELERA CON CUIDADO','Mantén Espacio o el botón del ratón para acelerar. El impulso consume masa. En el móvil usa el joystick y mantén IMPULSO.','➤']
 ]}
};
const T=WORDS[language],$=id=>document.getElementById(id),canvas=$('worm-field'),ctx=canvas.getContext('2d',{alpha:false}),mini=$('worm-mini'),mc=mini.getContext('2d');
document.querySelectorAll('[data-word]').forEach(e=>{if(T[e.dataset.word])e.textContent=T[e.dataset.word]});
$('worm-mode-label').textContent=T.bot;
$('worm-hint').textContent=T.hint;
const PI=Math.PI,TAU=PI*2;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const rand=(a,b)=>a+Math.random()*(b-a);
const dist=(x,y)=>Math.hypot(x,y);
const normAngle=a=>Math.atan2(Math.sin(a),Math.cos(a));
// Four times wider and taller than the original arena (16× playable area).
const WORLD={w:22400,h:22400,cx:11200,cy:11200,rx:10520,ry:10520};
const FOOD_TARGET=DEMO?9800:28000, BOT_COUNT=DEMO?28:58;
const FOOD_CELL=230,BODY_CELL=180; // broadphase grid: no O(food × bots) scans.
const gridKey=(x,y,size)=>Math.floor(x/size)+Math.floor(y/size)*256;
const SKINS=[
 {id:'nebula',en:'Nebula',ru:'Туманность',es:'Nebulosa',light:'#9922ff',dark:'#39006b',accent:'#ff1744',pattern:'nebula'},
 {id:'aurora',en:'Aurora',ru:'Сияние',es:'Aurora',light:'#27ff40',dark:'#0b5e1e',accent:'#ffe500',pattern:'aurora'},
 {id:'pulsar',en:'Pulsar',ru:'Пульсар',es:'Púlsar',light:'#2860ff',dark:'#071d83',accent:'#ffe500',pattern:'pulsar'},
 {id:'flare',en:'Solar Flare',ru:'Вспышка',es:'Llamarada',light:'#ffe500',dark:'#7d2300',accent:'#ff1744',pattern:'flare'},
 {id:'horizon',en:'Event Horizon',ru:'Горизонт',es:'Horizonte',light:'#9922ff',dark:'#150034',accent:'#2860ff',pattern:'horizon'},
 {id:'supernova',en:'Supernova',ru:'Сверхновая',es:'Supernova',light:'#ff1744',dark:'#75041d',accent:'#ffe500',pattern:'supernova'},
 {id:'comet',en:'Comet Ice',ru:'Лёд кометы',es:'Hielo de cometa',light:'#2860ff',dark:'#081260',accent:'#27ff40',pattern:'comet'},
 {id:'stardust',en:'Stardust',ru:'Звёздная пыль',es:'Polvo estelar',light:'#ffe500',dark:'#695009',accent:'#ff1744',pattern:'stardust'},
 {id:'eclipse',en:'Eclipse',ru:'Затмение',es:'Eclipse',light:'#a928ff',dark:'#05050e',accent:'#ff1744',pattern:'eclipse'},
 {id:'meteor',en:'Meteor',ru:'Метеор',es:'Meteoro',light:'#ff1744',dark:'#601017',accent:'#ffe500',pattern:'meteor'},
 {id:'galaxy',en:'Spiral Galaxy',ru:'Спиральная галактика',es:'Galaxia espiral',light:'#2860ff',dark:'#1c0a6b',accent:'#a928ff',pattern:'galaxy'},
 {id:'crystal',en:'Crystal',ru:'Кристалл',es:'Cristal',light:'#27ff40',dark:'#10255c',accent:'#2860ff',pattern:'crystal'}
];
const SETTINGS_KEY='infinity-space-worms-settings-v2';
function loadSettings(){
 try{const s=JSON.parse(localStorage.getItem(SETTINGS_KEY));if(s&&typeof s==='object')
  return {skin:SKINS.some(v=>v.id===s.skin)?s.skin:'nebula',glow:s.glow!==false,names:s.names!==false,zoom:clamp(Number(s.zoom)||100,75,140)};}catch(_){}
 return {skin:'nebula',glow:true,names:true,zoom:100};
}
const options=loadSettings();
function saveOptions(){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(options));}catch(_){}}
function applySkin(w,id){
 const skin=SKINS.find(s=>s.id===id)||SKINS[0];
 w.skin=skin.id;w.pattern=skin.pattern;w.color=[skin.light,skin.dark];w.accent=skin.accent;
}

const FOOD_COLORS=['#ff1744','#27ff40','#ffe500','#9922ff','#2860ff'];
const NAMES=['Astra','Orbit','Nova','Pulsar','Quasar','Mira','Voidling','Zenith','Vega',
 'Nebula','Kepler','Comet','Krypton','Lumen','Solaris','Aether','Cosmo','Rift','Ion','Rigel','Helix','Antares','Nix','Altair'];
// The lobby has a stable mixture of player archetypes rather than one global AI
// difficulty. Timing, awareness, aim, aggression, speed and AFK habits vary.
const BOT_ROSTER=[
 'newcomer','casual','cautious','hunter','afk','casual','newcomer','veteran',
 'casual','hunter','casual','pro','cautious','newcomer','casual','reckless'
];
const BOT_PERSONAS={
 afk:      {reaction:[1.6,3],    sight:0,   samples:0,  look:[90],            awareness:0,   error:0,    hunt:0,   boost:0,    speed:1},
 newcomer: {reaction:[.55,.95],  sight:360, samples:4,  look:[100],           awareness:.14, error:.65,  hunt:0,   boost:.07,  speed:.83},
 casual:   {reaction:[.25,.44],  sight:680, samples:8,  look:[100,200],       awareness:.48, error:.26,  hunt:.13, boost:.24,  speed:.98},
 cautious: {reaction:[.17,.28],  sight:960, samples:15, look:[90,190,320],    awareness:1.2, error:.09,  hunt:0,   boost:.06,  speed:.91},
 hunter:   {reaction:[.13,.23],  sight:1040,samples:16, look:[85,180,300,440],awareness:.83,error:.10, hunt:.75, boost:.70,  speed:1.04},
 veteran:  {reaction:[.095,.15], sight:1150,samples:22, look:[80,160,280,440],awareness:1.25,error:.035,hunt:.55,boost:.62, speed:1.07},
 pro:      {reaction:[.06,.105], sight:1350,samples:26, look:[80,160,280,440,600],awareness:1.6,error:.012,hunt:.83,boost:.82,speed:1.11},
 reckless: {reaction:[.23,.43],  sight:720, samples:7,  look:[90,200],       awareness:.28,error:.41, hunt:.90, boost:.87, speed:1.08}
};
const DEATH_REPLAY_SECONDS=3.25;
let vw=0,vh=0,dpr=1,last=0,uiClock=0,starTime=0,foodTimer=0,toastTimer=0,guideStep=0,guideReturn='playing';
let game={state:'playing',time:0,food:[],foodGrid:new Map(),bodyGrid:new Map(),worms:[],fx:[],player:null,reported:false,deathElapsed:0,deathPosition:null,deathGhost:null};
const input={mx:0,my:0,mouseMoved:false,mouseDown:false,boostKey:false,boostTouch:false,keys:new Set(),stickAngle:0,stickPower:0,stickPointer:-1,touchAngle:null};
const camera={x:WORLD.cx,y:WORLD.cy,zoom:1};
const stars=Array.from({length:680},(_,i)=>({x:Math.random(),y:Math.random(),r:i%8===0?1.6:rand(.35,1.05),a:rand(.42,1),phase:rand(0,TAU),depth:rand(.04,.17),c:['#ff1744','#27ff40','#ffe500','#ffffff','#9922ff','#2860ff'][i%6]}));
const nebula=Array.from({length:8},(_,i)=>({x:rand(.1,.94),y:rand(.1,.88),r:rand(.18,.40),c:['#9922ff','#2860ff','#ff1744','#27ff40','#ffe500','#2860ff','#9922ff','#ff1744'][i]}));
const skyComets=Array.from({length:10},(_,i)=>({x:rand(0,1),y:rand(0,1),speed:rand(13,37),len:rand(21,51),phase:i*.97,color:['#2860ff','#ff1744','#ffe500','#27ff40','#9922ff'][i%5]}));
function resize(){
 vw=window.innerWidth;vh=window.innerHeight;dpr=Math.min(2,window.devicePixelRatio||1);
 canvas.width=Math.round(vw*dpr);canvas.height=Math.round(vh*dpr);
 canvas.style.width=vw+'px';canvas.style.height=vh+'px';
}
window.addEventListener('resize',resize);resize();
function randomPos(radius=.88){
 const a=rand(0,TAU),r=Math.sqrt(Math.random())*radius;
 return {x:WORLD.cx+Math.cos(a)*r*WORLD.rx,y:WORLD.cy+Math.sin(a)*r*WORLD.ry};
}
function wormRadius(w){return clamp(10+Math.sqrt(w.mass)*.76,14,24)}
function segmentCount(w){return clamp(Math.round(12+w.mass*.31),18,190)}
// Spawn clearance is checked along the entire proposed body — not just the head.
// Also reserve space in front of the new head so it cannot appear on someone's path.
function spawnPosition(angle,count,nearPlayer=false){
 const cx=game.player?.x??WORLD.cx,cy=game.player?.y??WORLD.cy;
 for(let attempt=0;attempt<180;attempt++){
  let pos;
  if(nearPlayer&&attempt<95){
   const a=rand(0,TAU),r=rand(850,3100);
   pos={x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r};
  }else pos=randomPos(.87);
  let safe=true;
  const total=(count+1)*11.8;
  for(let i=0;i<=Math.ceil((total+190)/48);i++){
   // Trace the complete spawn body, from 190px ahead of its head to its tip.
   const offset=i*48-190;
   const x=pos.x-Math.cos(angle)*offset,y=pos.y-Math.sin(angle)*offset;
   const edge=((x-WORLD.cx)/WORLD.rx)**2+((y-WORLD.cy)/WORLD.ry)**2;
   if(edge>.88*.88){safe=false;break;}
   for(const other of game.worms){
    if(!other.alive)continue;
    const headD=Math.hypot(x-other.x,y-other.y);
    if(headD<450){safe=false;break;}
    if(headD>other.segments.length*12+500)continue;
    for(let j=0;j<other.segments.length;j+=2){
     const s=other.segments[j];
     if((x-s.x)**2+(y-s.y)**2<350*350){safe=false;break;}
    }
    if(!safe)break;
   }
   if(!safe)break;
  }
  if(safe)return pos;
 }
 return null; // No unsafe fallback: retry after other worms have moved.
}
function createWorm(name,human,index,preferEncounter=false){
 const angle=human?-.28:rand(0,TAU);
 const mass=human?61:rand(54,171);
 const count=segmentCount({mass});
 const pos=human?{x:WORLD.cx,y:WORLD.cy}:spawnPosition(angle,count,preferEncounter);
 if(!pos)return null;
 const w={name,human,id:index,x:pos.x,y:pos.y,angle,target:angle,
  mass,bestMass:mass,alive:true,invulnerable:human?2.3:2.0,
  segments:[],boost:false,dropClock:0,think:rand(.1,.2),targetFood:null,kills:0,
  foodEaten:0,bestRank:99,leadTime:0,deathDelay:0,
  persona:human?'human':BOT_ROSTER[(Math.max(1,index)-1)%BOT_ROSTER.length],
  wiggle:rand(0,TAU),speed:172,boostFlash:0,afkTimer:0,goalUntil:0};
 if(!human){
  const type=BOT_PERSONAS[w.persona];
  w.reaction=rand(type.reaction[0],type.reaction[1])*rand(.86,1.14);
  w.think=rand(0,w.reaction);
  // AFK rivals coast forward without steering; they never stand still.
  w.afkTimer=w.persona==='afk'?Infinity:0;
 }
 applySkin(w,human?options.skin:SKINS[index%SKINS.length].id);
 for(let i=0;i<count;i++){
  w.segments.push({x:w.x-Math.cos(angle)*11.8*(i+1),
   y:w.y-Math.sin(angle)*11.8*(i+1)});
 }
 return w;
}
function foodBucket(k){
 let bucket=game.foodGrid.get(k);
 if(!bucket){bucket=new Set();game.foodGrid.set(k,bucket);}
 return bucket;
}
function addFood(food){
 const k=gridKey(food.x,food.y,FOOD_CELL);
 food._cell=k;food._index=game.food.length;
 game.food.push(food);foodBucket(k).add(food);
 return food;
}
function removeFood(food){
 const index=food._index;
 if(index===undefined||index<0||game.food[index]!==food)return;
 const bucket=game.foodGrid.get(food._cell);
 if(bucket){bucket.delete(food);if(!bucket.size)game.foodGrid.delete(food._cell);}
 const last=game.food.pop();
 if(last!==food){game.food[index]=last;last._index=index;}
 food._index=-1;
}
function moveFood(food,x,y){
 const next=gridKey(x,y,FOOD_CELL);
 if(next!==food._cell){
  const old=game.foodGrid.get(food._cell);
  if(old){old.delete(food);if(!old.size)game.foodGrid.delete(food._cell);}
  foodBucket(next).add(food);food._cell=next;
 }
 food.x=x;food.y=y;
}
function foodNearby(x,y,r,callback){
 const sx=Math.floor((x-r)/FOOD_CELL),ex=Math.floor((x+r)/FOOD_CELL);
 const sy=Math.floor((y-r)/FOOD_CELL),ey=Math.floor((y+r)/FOOD_CELL);
 for(let iy=sy;iy<=ey;iy++)for(let ix=sx;ix<=ex;ix++){
  const bucket=game.foodGrid.get(ix+iy*256);
  if(bucket)for(const f of bucket)callback(f);
 }
}
function addBodyGrid(){
 const grid=game.bodyGrid;grid.clear();
 for(const w of game.worms){
  if(!w.alive)continue;
  const count=w.segments.length;
  for(let i=-1;i<count;i+=2){
   const p=i<0?w:w.segments[i],key=gridKey(p.x,p.y,BODY_CELL);
   let bucket=grid.get(key);if(!bucket){bucket=[];grid.set(key,bucket);}
   bucket.push({w,x:p.x,y:p.y,head:i<0});
  }
 }
}
function bodiesNearby(x,y,r,callback){
 const sx=Math.floor((x-r)/BODY_CELL),ex=Math.floor((x+r)/BODY_CELL);
 const sy=Math.floor((y-r)/BODY_CELL),ey=Math.floor((y+r)/BODY_CELL);
 for(let iy=sy;iy<=ey;iy++)for(let ix=sx;ix<=ex;ix++){
  const b=game.bodyGrid.get(ix+iy*256);
  if(b)for(const obj of b)callback(obj);
 }
}
function makeFood(x,y,color,value,r){
 return {x,y,color:color||FOOD_COLORS[Math.floor(Math.random()*FOOD_COLORS.length)],
 value:value??rand(1.5,3.2),r:r??rand(2.6,5.4),phase:rand(0,TAU)};
}
function fillFood(amount){
 for(let i=0;i<amount;i++){const p=randomPos(.975);addFood(makeFood(p.x,p.y));}
}

function notify(text){
 if(DEMO)return;
 const el=$('worm-toast');el.textContent=text;el.classList.add('show');toastTimer=1.8;
}
function init(){
 game={state:'playing',time:0,food:[],foodGrid:new Map(),bodyGrid:new Map(),worms:[],fx:[],player:null,reported:false,deathElapsed:0,deathPosition:null,deathGhost:null};
 const human=!DEMO;
 const p=createWorm(DEMO?'Astra':(window.InfinityProfile?.getName()||'PILOT'),human,0);
 game.player=p;game.worms.push(p);
 for(let i=1;i<=BOT_COUNT;i++){
  const label=NAMES[(i-1)%NAMES.length]+(i>NAMES.length?' '+(Math.floor((i-1)/NAMES.length)+1):'');
  const b=createWorm(label,false,i,i<=32);
  if(b)game.worms.push(b);
 }
 fillFood(FOOD_TARGET);
 addBodyGrid();
 camera.x=p.x;camera.y=p.y;camera.zoom=1;
 input.mouseDown=input.boostKey=input.boostTouch=false;
 input.stickPower=0;input.touchAngle=null;input.mouseMoved=false;input.keys.clear();
 document.body.classList.remove('worm-death-replay');
 $('worm-result').classList.remove('is-revealing');
 $('worm-result').hidden=true;$('worm-pause-overlay').hidden=true;
 $('worm-guide').hidden=true;$('worm-settings').hidden=true;
 if(!DEMO){
  if(!window.InfinityProfile?.getName())window.InfinityProfile?.promptName?.(true,name=>{p.name=name;});
  let visited=false;try{visited=localStorage.getItem('infinity-space-mode-guide-v2:worms')==='1'}catch(_){}
  if(!visited)showGuide('playing');
 }
 updateUI();
}
function sortedWorms(){return game.worms.filter(w=>w.alive).sort((a,b)=>b.mass-a.mass)}
function ranking(w){return 1+game.worms.reduce((n,b)=>n+(b.alive&&b!==w&&b.mass>w.mass?1:0),0)}
function steerBot(w,dt){
 const persona=BOT_PERSONAS[w.persona]||BOT_PERSONAS.casual;
 w.think-=dt;w.wiggle+=dt*.7;
 if(w.think>0)return;
 w.think=w.reaction*rand(.83,1.18);
 const sight=persona.sight;
 let goal=null,goalScore=-Infinity;
 // A human would keep chasing a worthwhile target instead of picking a
 // completely different nearest dot every frame. Advanced bots hold a plan
 // longer; newcomers are easily distracted.
 const old=w.targetFood;
 if(old&&old._index>=0){
  const dx=old.x-w.x,dy=old.y-w.y,d=Math.hypot(dx,dy);
  if(d>22&&d<sight){
   goal=old;
   goalScore=(old.value*145+95)/(d+65)+(.08+.32*persona.awareness);
  }
 }
 foodNearby(w.x,w.y,sight,f=>{
  if(f._index<0)return;
  const dx=f.x-w.x,dy=f.y-w.y,d=Math.hypot(dx,dy);
  if(d<18||d>sight)return;
  const dot=(dx*Math.cos(w.angle)+dy*Math.sin(w.angle))/(d||1);
  const score=(f.value*145+95)/(d+65)+(dot>0?.14:0)+(f===old?.2:0);
  if(score>goalScore){goal=f;goalScore=score;}
 });
 w.targetFood=goal;
 let desired=goal?Math.atan2(goal.y-w.y,goal.x-w.x):
  w.angle+Math.sin(w.wiggle*.7+w.id)*.32;
 let chasing=false;
 // Hunters/experts anticipate where a target will be, not where it is now.
 // Reckless players may even challenge larger opponents and lose.
 if(persona.hunt>0&&w.mass>64&&Math.random()<persona.hunt){
  let prey=null,range=Math.min(sight*.80,900),closest=range;
  for(const other of game.worms){
   if(!other.alive||other===w)continue;
   if(other.mass>w.mass*(w.persona==='reckless'?1.38:.94))continue;
   const d=Math.hypot(other.x-w.x,other.y-w.y);
   if(d<closest&&d>125){prey=other;closest=d;}
  }
  if(prey){
   const predictive=(w.persona==='pro'||w.persona==='veteran'||w.persona==='hunter');
   const intercept=predictive?Math.min(310,closest*(w.persona==='pro'?.54:.37)):0;
   desired=Math.atan2(prey.y+Math.sin(prey.angle)*intercept-w.y,
    prey.x+Math.cos(prey.angle)*intercept-w.x);
   chasing=true;
  }
 }
 const edge=Math.hypot((w.x-WORLD.cx)/WORLD.rx,(w.y-WORLD.cy)/WORLD.ry);
 if(edge>.86)desired=Math.atan2(WORLD.cy-w.y,WORLD.cx-w.x);
 // Imperfect human aiming. Rookie reactions are noisy and delayed; experts
 // compute more trajectories and future rival-head positions.
 desired+=rand(-persona.error,persona.error);
 let best=-Infinity,bestAngle=desired,bestClearance=Infinity;
 for(let k=0;k<persona.samples;k++){
  const angle=k===0?desired:k===1?w.angle:(k-2)*TAU/Math.max(1,persona.samples-2);
  const cx=Math.cos(angle),cy=Math.sin(angle);
  let score=Math.cos(angle-desired)*12+Math.cos(angle-w.angle)*(.4+persona.awareness*.35);
  let clearance=Infinity;
  for(const step of persona.look){
   const x=w.x+cx*step,y=w.y+cy*step;
   const border=((x-WORLD.cx)/WORLD.rx)**2+((y-WORLD.cy)/WORLD.ry)**2;
   if(border>.95*.95)score-=(border>1?320:65)*Math.max(.4,persona.awareness);
   bodiesNearby(x,y,130,entry=>{
    if(entry.w===w||!entry.w.alive)return;
    let ox=entry.x,oy=entry.y;
    if(entry.head&&(w.persona==='pro'||w.persona==='veteran'||w.persona==='hunter')){
     const future=Math.min(.75,step/Math.max(150,w.speed));
     ox+=Math.cos(entry.w.angle)*entry.w.speed*future*.54;
     oy+=Math.sin(entry.w.angle)*entry.w.speed*future*.54;
    }
    const d=Math.hypot(x-ox,y-oy);
    const danger=wormRadius(w)+wormRadius(entry.w)+40;
    clearance=Math.min(clearance,d-danger);
    if(d<danger+53)score-=(danger+53-d)*(1+(420-step)/500)*persona.awareness;
    if(d<danger)score-=(220+(danger-d)*2.8)*persona.awareness;
   });
  }
  if(score>best){best=score;bestAngle=angle;bestClearance=clearance;}
 }
 w.target=bestAngle;
 // Players differ in boost discipline: the pro spends mass only with room
 // ahead, while the reckless sprinter often commits to unsafe speed.
 const safe=bestClearance>(w.persona==='reckless'?25:65);
 const urgent=chasing||goalScore>(w.persona==='pro'?1.6:2.2);
 const bias=w.persona==='reckless'? .65:.19;
 w.boost=w.mass>78&&edge<.86&&safe&&urgent&&
  Math.random()<Math.min(.98,persona.boost*(chasing?1.3:1)+bias);
}

function kill(w,killer,reason){
 if(!w.alive||w.invulnerable>0)return;
 const place=ranking(w);
 w.alive=false;w.boost=false;w.deathDelay=DEMO?2.5:rand(4.5,6.5);
 if(killer&&killer!==w){killer.kills++;killer.mass+=Math.min(18,w.mass*.12);}
 // Materialize the ENTIRE corpse before any bot respawns, from head to tip.
 // Never impose a global food cap here: it previously discarded most of a
 // long worm's remains as soon as the ambient field became dense.
 const body=[{x:w.x,y:w.y},...w.segments];
 let dropped=0;
 for(let i=0;i<body.length;i++){
  const node=body[i],before=body[Math.max(i-1,0)],after=body[Math.min(i+1,body.length-1)];
  let dx=after.x-before.x,dy=after.y-before.y,d=Math.hypot(dx,dy)||1;
  const sideX=-dy/d,sideY=dx/d;
  for(let side of [-1,1]){
   const size=rand(3.4,6.3),offset=rand(3,9);
   addFood(makeFood(node.x+sideX*offset+rand(-2,2),
    node.y+sideY*offset+rand(-2,2),i%6===0?w.accent:w.color[0],
    rand(2.8,6),size));
   dropped++;
  }
  if(i%5===0&&game.fx.length<550){
   game.fx.push({x:node.x,y:node.y,vx:rand(-110,110),vy:rand(-110,110),
    t:rand(.4,.95),max:.95,c:w.color[0],r:rand(1.6,4.5)});
  }
 }
 game.lastDeath={name:w.name,segments:body.length,dropped,head:{x:body[0].x,y:body[0].y},
  tip:{x:body[body.length-1].x,y:body[body.length-1].y}};
 if(w.human){
  // Keep the arena fully alive while the player watches rivals collect
  // the wreckage. The results only fade in after the replay window.
  game.state='death-replay';
  game.deathElapsed=0;
  game.deathPosition={x:w.x,y:w.y};
  game.deathGhost={
   x:w.x,y:w.y,r:wormRadius(w),color:w.color[0],accent:w.accent,
   segments:w.segments.map(p=>({x:p.x,y:p.y})),
   life:0,angle:w.angle
  };
  document.body.classList.add('worm-death-replay');
  const won=w.leadTime>=20;
  if(!game.reported){
   game.reported=true;
   window.InfinityProfile?.recordMatch?.('worms',{
    win:won,place:Math.max(1,w.bestRank),kills:w.kills,objects:w.foodEaten,
    mass:w.bestMass,time:game.time
   });
  }
  $('worm-result-length').textContent=Math.round(w.bestMass);
  $('worm-result-place').textContent='#'+Math.min(place,w.bestRank);
  $('worm-result-kills').textContent=w.kills;
  $('worm-result-info').textContent=reason==='wall'?T.wall:reason==='head'?T.self:T.eliminated;
  $('worm-result').hidden=true;
 }
}

function updateWorm(w,dt){
 if(!w.alive)return;
 w.invulnerable=Math.max(0,w.invulnerable-dt);
 if(!w.human){
  // Worms always glide forward. AFK only disables steering and boosting.
  if(w.afkTimer>0){
   if(Number.isFinite(w.afkTimer))w.afkTimer=Math.max(0,w.afkTimer-dt);
   w.target=w.angle;w.boost=false;
  }else{
   const awayRate=w.persona==='newcomer'?.012:w.persona==='casual'?.004:.0008;
   if(Math.random()<dt*awayRate){
    w.afkTimer=rand(w.persona==='newcomer'?3:1,w.persona==='newcomer'?11:4);
    w.target=w.angle;w.boost=false;
   }else steerBot(w,dt);
  }
 }else{
  const keys=input.keys;
  let dx=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);
  let dy=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0);
  if(dx||dy)w.target=Math.atan2(dy,dx);
  else if(input.stickPower>.18)w.target=input.stickAngle;
  else if(input.touchAngle!==null)w.target=input.touchAngle;
  else if(input.mouseMoved){
   // Pointer steering is relative to the ACTUAL projected head, not the
   // screen center: smoothing/zoom no longer makes steering feel offset.
   const sx=vw*.5+(w.x-camera.x)*camera.zoom;
   const sy=vh*.5+(w.y-camera.y)*camera.zoom;
   dx=input.mx-sx;dy=input.my-sy;
   if(dx*dx+dy*dy>15*15)w.target=Math.atan2(dy,dx);
  }
  w.boost=(input.mouseDown||input.boostKey||input.boostTouch)&&w.mass>38;
 }
 const boosting=w.boost&&w.mass>38;
 const targetSpeed=boosting?375:172;
 const scaled=targetSpeed*Math.max(.73,1-Math.log(Math.max(1,w.mass)/60)*.05)*
  (w.human?1:BOT_PERSONAS[w.persona].speed);
 w.speed+=(scaled-w.speed)*Math.min(1,dt*12);
 // Compact but tangible turn radius. A full U-turn takes roughly .23 s;
 // even during boosting the head cannot teleport into a new heading.
 // Noticeable Slither-style turning arc: approximately 50px at cruising speed,
 // widening naturally to approximately 140px while boosting.
 const turnRate=boosting?2.65:3.35;
 w.angle+=clamp(normAngle(w.target-w.angle),-turnRate*dt,turnRate*dt);
 w.boostFlash=(w.boostFlash||0)+dt*(boosting?12:4);
 const advance=w.speed*dt;
 w.x+=Math.cos(w.angle)*advance;
 w.y+=Math.sin(w.angle)*advance;
 const gap=11.8;
 let px=w.x,py=w.y;
 for(const node of w.segments){
  const dx=px-node.x,dy=py-node.y,d=Math.hypot(dx,dy);
  if(d>gap){const factor=1-gap/d;node.x+=dx*factor;node.y+=dy*factor;}
  px=node.x;py=node.y;
 }
 if(boosting){
  w.mass=Math.max(38,w.mass-dt*7.2);
  w.dropClock+=dt;
  if(w.dropClock>.085){w.dropClock=0;
   const tail=w.segments[w.segments.length-1]||w;
   if(game.food.length<FOOD_TARGET+8500)
    addFood(makeFood(tail.x+rand(-2,2),tail.y+rand(-2,2),w.color[0],1.2,2.9));
  }
 }else w.dropClock=0;
 const target=segmentCount(w);
 if(w.segments.length<target){
  const last=w.segments[w.segments.length-1]||w,prev=w.segments[w.segments.length-2]||w;
  w.segments.push({x:last.x+(last.x-prev.x),y:last.y+(last.y-prev.y)});
 }else if(w.segments.length>target)w.segments.length=target;
 w.bestMass=Math.max(w.bestMass,w.mass);
 const border=((w.x-WORLD.cx)/WORLD.rx)**2+((w.y-WORLD.cy)/WORLD.ry)**2;
 if(border>1){w.invulnerable=0;kill(w,null,'wall');return;}
 if(w.human&&border>.91&&Math.random()<dt*.6)notify(T.danger);
}
function collectFood(dt){
 for(const w of game.worms){
  if(!w.alive)continue;
  const radius=wormRadius(w);
  foodNearby(w.x,w.y,66,f=>{
   if(f._index<0)return;
   const dx=w.x-f.x,dy=w.y-f.y,ds=dx*dx+dy*dy;
   if(ds<(radius+f.r+5)**2){
    w.mass+=f.value;w.foodEaten++;
    if(w.human&&game.fx.length<320)
     game.fx.push({x:f.x,y:f.y,vx:rand(-35,35),vy:rand(-60,-5),t:.32,max:.32,c:f.color,r:3});
    removeFood(f);
   }else if(w.human&&ds<53*53&&ds>5){
    const d=Math.sqrt(ds),speed=(53-d)*dt*5;
    moveFood(f,f.x+dx/d*speed,f.y+dy/d*speed);
   }
  });
 }
}
function collisions(){
 // One shared spatial index contains every other worm's full trail. Head-on
 // and body contacts are checked without scanning thousands of distant nodes.
 for(const w of game.worms){
  if(!w.alive||w.invulnerable>0)continue;
  const wr=wormRadius(w);
  bodiesNearby(w.x,w.y,95,entry=>{
   const other=entry.w;
   if(!w.alive||other===w||!other.alive||other.invulnerable>0)return;
   const radius=wormRadius(other),dx=w.x-entry.x,dy=w.y-entry.y;
   const hit=entry.head?wr+radius*.86:wr+radius*.69;
   if(dx*dx+dy*dy>=hit*hit)return;
   if(entry.head){
    kill(w,other,'head');kill(other,w,'head');
   }else kill(w,other,'body');
  });
 }
}
function recycleBots(dt){
 for(const w of game.worms){
  if(w.human||w.alive)continue;
  w.deathDelay-=dt;
  if(w.deathDelay>0)continue;
  const fresh=createWorm(w.name,false,w.id,w.id%3===0);
  if(fresh)Object.assign(w,fresh);
  else w.deathDelay=1.3; // Never force a bot into the player if no safe zone exists.
 }
}
function simulate(dt){
 game.time+=dt;
 for(const w of game.worms)updateWorm(w,dt);
 addBodyGrid();
 collectFood(dt);
 collisions();
 for(let i=game.fx.length-1;i>=0;i--){
  const p=game.fx[i];p.t-=dt;if(p.t<=0){game.fx.splice(i,1);continue;}
  p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.97;p.vy*=.97;
 }
 recycleBots(dt);
 foodTimer+=dt;
 if(foodTimer>.18){
  foodTimer=0;
  if(game.food.length<FOOD_TARGET)
   fillFood(Math.min(180,FOOD_TARGET-game.food.length));
 }
 const p=game.player;
 if(p.alive){
  const place=ranking(p);
  p.bestRank=Math.min(p.bestRank,place);
  if(place===1)p.leadTime+=dt;
  if(place===1&&p.leadTime>2&&p.leadTime-dt<=2)notify(T.lead);
 }
}

function updateUI(){
 const p=game.player;if(!p)return;
 $('worm-length').textContent=Math.round(p.mass).toLocaleString(language);
 $('worm-place').textContent=p.alive?('#'+ranking(p)):'—';
 const sec=Math.floor(game.time);$('worm-time').textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');
 $('worm-boost').disabled=p.mass<=38||game.state!=='playing';
 $('worm-boost').classList.toggle('is-boosting',!!p.boost);
 const rank=sortedWorms().slice(0,6);
 const host=$('worm-ranking');host.replaceChildren();
 for(let i=0;i<rank.length;i++){
  const w=rank[i],el=document.createElement('div');el.className='worm-rank'+(w===p?' mine':'');
  const left=document.createElement('span'),right=document.createElement('b');
  left.textContent=(i+1)+'. '+w.name;right.textContent=Math.round(w.mass);
  el.append(left,right);host.append(el);
 }
 drawRadar();
}
function drawRadar(){
 const w=mini.width,h=mini.height;
 mc.clearRect(0,0,w,h);mc.fillStyle='#08091b';mc.fillRect(0,0,w,h);
 mc.save();mc.translate(w/2,h/2);
 const circle=Math.min(w,h)*.43;
 mc.strokeStyle='#ffe500';mc.globalAlpha=.78;mc.lineWidth=1.3;
 mc.beginPath();mc.arc(0,0,circle,0,TAU);mc.stroke();mc.globalAlpha=1;
 for(const a of game.worms){
  if(!a.alive)continue;
  const x=(a.x-WORLD.cx)/WORLD.rx*circle,y=(a.y-WORLD.cy)/WORLD.ry*circle;
  mc.fillStyle=a===game.player?'#fff1ff':a.color[0];mc.beginPath();
  mc.arc(x,y,a===game.player?3:1.5,0,TAU);mc.fill();
 }
 mc.restore();
}
function backdrop(t){
 ctx.fillStyle='#03050d';ctx.fillRect(0,0,vw,vh);
 for(const n of nebula){
  const x=((n.x*vw-camera.x*.013)%vw+vw)%vw,y=((n.y*vh-camera.y*.009)%vh+vh)%vh;
  const r=Math.max(vw,vh)*n.r;
  const gr=ctx.createRadialGradient(x,y,1,x,y,r);gr.addColorStop(0,n.c+'42');gr.addColorStop(1,n.c+'00');
  ctx.fillStyle=gr;ctx.fillRect(x-r,y-r,r*2,r*2);
 }
 for(const s of stars){
  const x=((s.x*vw-camera.x*s.depth*.1)%vw+vw)%vw;
  const y=((s.y*vh-camera.y*s.depth*.1)%vh+vh)%vh;
  ctx.globalAlpha=s.a*(.8+Math.sin(t*.8+s.phase)*.2);
  ctx.fillStyle=s.c;ctx.fillRect(x,y,s.r,s.r);
 }
 ctx.globalAlpha=1;
 // Sparse, hairline comet streaks reinforce the colourful deep-space field.
 for(const comet of skyComets){
  const x=((comet.x*vw+(t*comet.speed*3)-camera.x*.013)%(vw+160)+vw+160)%(vw+160)-80;
  const y=((comet.y*vh+t*comet.speed*.37-camera.y*.012)%(vh+100)+vh+100)%(vh+100)-50;
  const trail=ctx.createLinearGradient(x-comet.len,y+comet.len*.32,x,y);
  trail.addColorStop(0,comet.color+'00');trail.addColorStop(1,comet.color+'cc');
  ctx.strokeStyle=trail;ctx.lineWidth=.8;
  ctx.beginPath();ctx.moveTo(x-comet.len,y+comet.len*.32);ctx.lineTo(x,y);ctx.stroke();
  ctx.fillStyle=comet.color;ctx.fillRect(x-.7,y-.7,1.5,1.5);
 }
}
function drawFood(t){
 const margin=100,z=camera.zoom;
 const left=camera.x-vw/z/2-margin,right=camera.x+vw/z/2+margin;
 const top=camera.y-vh/z/2-margin,bottom=camera.y+vh/z/2+margin;
 const x1=Math.floor(left/FOOD_CELL),x2=Math.floor(right/FOOD_CELL);
 const y1=Math.floor(top/FOOD_CELL),y2=Math.floor(bottom/FOOD_CELL);
 // Draw ONLY visible grid cells instead of iterating 20,000 world particles.
 for(let iy=y1;iy<=y2;iy++)for(let ix=x1;ix<=x2;ix++){
  const bucket=game.foodGrid.get(ix+iy*256);
  if(!bucket)continue;
  for(const f of bucket){
   if(f.x<left||f.x>right||f.y<top||f.y>bottom)continue;
   const r=f.r*(1+Math.sin(t*3+f.phase)*.08);
   ctx.globalAlpha=.16;ctx.fillStyle=f.color;ctx.beginPath();ctx.arc(f.x,f.y,r*2.9,0,TAU);ctx.fill();
   ctx.globalAlpha=.94;ctx.beginPath();ctx.arc(f.x,f.y,r,0,TAU);ctx.fill();
   ctx.fillStyle='#ffffffd8';ctx.globalAlpha=.7;ctx.beginPath();
   ctx.arc(f.x-r*.2,f.y-r*.2,Math.max(.8,r*.32),0,TAU);ctx.fill();
  }
 }
 ctx.globalAlpha=1;
}
const SKIN_NEBULAE={
 nebula:['#9922ff','#ff1744','#2860ff'],
 aurora:['#27ff40','#ffe500','#2860ff'],
 pulsar:['#2860ff','#9922ff','#ffe500'],
 flare:['#ffe500','#ff1744','#9922ff'],
 horizon:['#9922ff','#2860ff','#ff1744'],
 supernova:['#ff1744','#ffe500','#9922ff'],
 comet:['#2860ff','#27ff40','#9922ff'],
 stardust:['#ffe500','#9922ff','#ff1744'],
 eclipse:['#a928ff','#ff1744','#ffe500'],
 meteor:['#ff1744','#ffe500','#ff1744'],
 galaxy:['#2860ff','#a928ff','#ffe500'],
 crystal:['#27ff40','#2860ff','#ffe500']
};
function drawCosmicInterior(w,t,r){
 const nodes=[w,...w.segments],n=nodes.length;
 if(n<4)return;
 const theme=SKIN_NEBULAE[w.skin]||SKIN_NEBULAE.nebula;
 // Build a real filled silhouette, not a floating star layer: every nebula,
 // bright star and comet is clipped INSIDE the curving worm's body.
 const normals=new Array(n),shape=new Path2D(),half=r*.76;
 for(let i=0;i<n;i++){
  const a=nodes[Math.max(0,i-1)],b=nodes[Math.min(n-1,i+1)];
  const dx=a.x-b.x,dy=a.y-b.y,l=Math.hypot(dx,dy)||1;
  normals[i]={x:-dy/l,y:dx/l};
 }
 for(let i=0;i<n;i++){
  const p=nodes[i],q=normals[i];
  if(i===0)shape.moveTo(p.x+q.x*half,p.y+q.y*half);
  else shape.lineTo(p.x+q.x*half,p.y+q.y*half);
 }
 for(let i=n-1;i>=0;i--){
  const p=nodes[i],q=normals[i];shape.lineTo(p.x-q.x*half,p.y-q.y*half);
 }
 shape.closePath();
 ctx.save();ctx.clip(shape);
 ctx.globalAlpha=.84;
 ctx.fillStyle=w.skin==='horizon'?'#070614':'#071026';
 ctx.fill(shape);
 ctx.globalAlpha=1;
 // Colour clouds remain anchored to segments as the body curves.
 for(let i=3;i<n;i+=17){
  const p=nodes[i],q=normals[i],phase=t*.85+i*.17+w.id;
  const off=Math.sin(phase)*half*.43;
  const size=r*(1.2+.25*Math.sin(i*1.38));
  const grad=ctx.createRadialGradient(p.x+off*q.x,p.y+off*q.y,0,
   p.x+off*q.x,p.y+off*q.y,size);
  const col=theme[Math.floor(i/17+w.id)%theme.length];
  grad.addColorStop(0,col+'aa');grad.addColorStop(.42,col+'54');grad.addColorStop(1,col+'00');
  ctx.fillStyle=grad;ctx.fillRect(p.x-size*1.4,p.y-size*1.4,size*2.8,size*2.8);
 }
 // Compact moving star clusters: seed is deterministic for stable animation.
 for(let i=2;i<n-1;i+=3){
  const p=nodes[i],q=normals[i],seed=i*13.73+w.id*27.19;
  const side=(Math.sin(seed*1.71+t*(.28+(w.id%3)*.09))*.69)*half;
  const x=p.x+side*q.x,y=p.y+side*q.y;
  const twinkle=.5+.5*Math.sin(t*3.3+seed);
  const size=(i%11===0?2.2:1.15)+twinkle*.85;
  ctx.fillStyle=i%7===0?theme[2]:'#fff8ec';
  ctx.globalAlpha=.34+twinkle*.64;
  ctx.beginPath();ctx.arc(x,y,size,0,TAU);ctx.fill();
  if(i%13===0){
   ctx.strokeStyle=theme[2];ctx.lineWidth=.9;
   ctx.beginPath();ctx.moveTo(x-size*2.5,y);ctx.lineTo(x+size*2.5,y);
   ctx.moveTo(x,y-size*2.5);ctx.lineTo(x,y+size*2.5);ctx.stroke();
  }
 }
 ctx.globalAlpha=1;
 // Small icy comets flow from tail towards the head along curved body nodes.
 const cometCount=w.human?4:2;
 for(let j=0;j<cometCount;j++){
  const progress=((t*(6.1+j*1.22)+(j*.31)*n+w.id*7.4)%(n-12));
  const index=Math.max(2,Math.min(n-11,Math.floor(n-4-progress)));
  const head=nodes[index],trail=nodes[index+Math.min(10,Math.floor(n*.17))];
  const gradient=ctx.createLinearGradient(trail.x,trail.y,head.x,head.y);
  gradient.addColorStop(0,'#ffffff00');gradient.addColorStop(.5,theme[j%3]+'90');
  gradient.addColorStop(1,'#ffffff');
  ctx.strokeStyle=gradient;ctx.lineWidth=r*.13+(j%2)*.55;
  ctx.lineCap='round';
  ctx.beginPath();
  for(let k=Math.min(n-1,index+8);k>=index;k--){
   const p=nodes[k];if(k===Math.min(n-1,index+8))ctx.moveTo(p.x,p.y);
   else ctx.lineTo(p.x,p.y);
  }
  ctx.stroke();
  ctx.fillStyle='#ffffff';ctx.shadowBlur=options.glow?9:0;ctx.shadowColor=theme[j%3];
  ctx.beginPath();ctx.arc(head.x,head.y,Math.max(1.6,r*.12),0,TAU);ctx.fill();ctx.shadowBlur=0;
 }
 ctx.restore();
}


/* Every skin has its own outline and materials, not just a new body colour. */
function drawSkinGeometry(w,t,r){
 const ns=w.segments,p=w.pattern;
 ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
 for(let i=4;i<ns.length-2;i+=p==='flare'||p==='meteor'?5:7){
  const a=ns[i-2],b=ns[i+2],node=ns[i];
  const angle=Math.atan2(a.y-b.y,a.x-b.x),pulse=Math.sin(t*2+i*.23+w.id*.4);
  ctx.save();ctx.translate(node.x,node.y);ctx.rotate(angle);
  ctx.lineWidth=Math.max(1.1,r*.1);
  if(p==='aurora'||p==='flare'){
   // Wings for Aurora, pointed flames for Solar Flare.
   for(const side of [-1,1]){
    ctx.fillStyle=p==='aurora'?(i%2?'#27ff40':'#ffe500'):(i%2?'#ff1744':'#ffe500');
    ctx.beginPath();ctx.moveTo(-r*.6,side*r*.43);
    if(p==='aurora')ctx.quadraticCurveTo(-r*.5,side*r*1.6,r*.62,side*r*(1.2+.17*pulse));
    else ctx.lineTo(r*.3,side*r*(1.67+.14*pulse));
    ctx.lineTo(r*.58,side*r*.41);ctx.closePath();ctx.fill();
   }
  }else if(p==='pulsar'||p==='horizon'||p==='eclipse'){
   // Pulsar rings / glowing accretion halos.
   ctx.strokeStyle=p==='pulsar'?(i%2?'#ffe500':'#fff'):p==='eclipse'?'#ff1744':'#9922ff';
   ctx.lineWidth=r*(p==='pulsar'?.18:.14);
   ctx.beginPath();ctx.ellipse(0,0,r*.4,r*1.2,0,0,TAU);ctx.stroke();
   if(p==='eclipse'){
    ctx.fillStyle='#05050d';ctx.beginPath();ctx.arc(0,0,r*.45,0,TAU);ctx.fill();
    ctx.strokeStyle='#ffe500';ctx.lineWidth=r*.1;ctx.stroke();
   }
  }else if(p==='supernova'||p==='stardust'){
   // Starbursts versus luminous golden pentagrams.
   if(p==='stardust'){ctx.fillStyle='#1c103a';ctx.beginPath();ctx.arc(0,0,r*.7,0,TAU);ctx.fill()}
   ctx.fillStyle=p==='stardust'?'#ffe500':i%2?'#ff1744':'#ffe500';
   ctx.beginPath();
   const count=p==='stardust'?10:16;
   for(let j=0;j<count;j++){
    const theta=j*TAU/count-PI/2,rad=j%2?r*.25:r*(p==='stardust'?.58:.98);
    if(!j)ctx.moveTo(Math.cos(theta)*rad,Math.sin(theta)*rad);
    else ctx.lineTo(Math.cos(theta)*rad,Math.sin(theta)*rad);
   }
   ctx.closePath();ctx.fill();
  }else if(p==='comet'||p==='crystal'||p==='meteor'){
   // Ice fins, diamond plates, jagged meteor armour.
   ctx.fillStyle=p==='comet'?'#2860ff':p==='crystal'?(i%2?'#27ff40':'#2860ff'):'#ff1744';
   ctx.strokeStyle=p==='meteor'?'#ffe500':'#f4f7ff';
   ctx.beginPath();
   if(p==='comet'){
    const side=i%2?1:-1;
    ctx.moveTo(-r*.52,side*r*.4);ctx.lineTo(-r*.14,side*r*1.65);
    ctx.lineTo(r*.51,side*r*1.06);ctx.lineTo(r*.6,side*r*.39);
   }else{
    ctx.moveTo(-r*.85,0);ctx.lineTo(-r*.2,-r*1.06);
    ctx.lineTo(r*.62,-r*.72);ctx.lineTo(r*.86,0);
    ctx.lineTo(r*.25,r*1.03);ctx.lineTo(-r*.63,r*.68);
   }
   ctx.closePath();ctx.fill();ctx.stroke();
   if(p==='meteor'){ctx.beginPath();ctx.moveTo(-r*.5,-r*.4);ctx.lineTo(r*.18,r*.16);ctx.lineTo(r*.54,-r*.29);ctx.stroke()}
  }else if(p==='galaxy'){
   // Noticeable rotating galactic spirals.
   ctx.strokeStyle=i%2?'#a928ff':'#ffe500';ctx.lineWidth=r*.14;
   ctx.beginPath();
   for(let j=0;j<=20;j++){
    const theta=j*.51+t*.55+i*.21,rad=r*(.07+j*.039);
    if(!j)ctx.moveTo(Math.cos(theta)*rad,Math.sin(theta)*rad);
    else ctx.lineTo(Math.cos(theta)*rad,Math.sin(theta)*rad);
   }
   ctx.stroke();
  }else{
   // Nebula: four bright gas clusters.
   for(let j=0;j<4;j++){
    const theta=j*PI/2+t*.1;
    ctx.fillStyle=['#9922ff','#ff1744','#2860ff','#fff'][j];
    ctx.beginPath();ctx.arc(Math.cos(theta)*r*.48,Math.sin(theta)*r*.48,r*.23,0,TAU);ctx.fill();
   }
  }
  ctx.restore();
 }
 ctx.restore();
}
function drawSkinHead(w,r){
 const p=w.pattern;ctx.save();ctx.translate(w.x,w.y);ctx.rotate(w.angle);
 ctx.fillStyle=p==='eclipse'||p==='horizon'?'#05050d':w.color[0];
 ctx.strokeStyle=w.accent;ctx.lineWidth=r*.14;
 ctx.shadowColor=w.color[0];ctx.shadowBlur=options.glow?16:0;
 ctx.beginPath();
 if(p==='meteor'||p==='crystal'){
  ctx.moveTo(r*1.35,0);ctx.lineTo(r*.33,-r*1.1);ctx.lineTo(-r*1.02,-r*.7);
  ctx.lineTo(-r*1.12,r*.61);ctx.lineTo(r*.4,r*1.08);ctx.closePath();
 }else ctx.arc(0,0,r*1.12,0,TAU);
 ctx.fill();ctx.stroke();ctx.shadowBlur=0;
 if(['horizon','eclipse','pulsar','galaxy'].includes(p)){
  ctx.strokeStyle=p==='eclipse'?'#ffe500':p==='horizon'?'#2860ff':p==='pulsar'?'#ffe500':'#a928ff';
  ctx.lineWidth=r*.13;ctx.beginPath();ctx.ellipse(-r*.18,0,r*1.3,r*.65,p==='galaxy'?-.42:.35,0,TAU);ctx.stroke();
 }
 if(['aurora','flare','supernova','comet','stardust'].includes(p)){
  for(const side of [-1,1]){
   ctx.fillStyle=p==='comet'?'#2860ff':p==='aurora'?'#27ff40':'#ffe500';
   ctx.beginPath();ctx.moveTo(-r*.2,side*r*.72);
   ctx.lineTo(p==='aurora'?-r*.5:r*.27,side*r*(p==='flare'?1.8:1.5));
   ctx.lineTo(r*.5,side*r*.65);ctx.closePath();ctx.fill();
  }
 }
 for(const side of [-1,1]){
  ctx.fillStyle=p==='eclipse'||p==='horizon'?'#ffe500':'#fff';
  ctx.beginPath();
  if(p==='meteor'||p==='crystal')ctx.ellipse(r*.48,side*r*.53,r*.23,r*.13,side*.2,0,TAU);
  else ctx.arc(r*.48,side*r*.53,r*.27,0,TAU);
  ctx.fill();
  ctx.fillStyle='#11162d';ctx.beginPath();ctx.arc(r*.59,side*r*.53,r*.115,0,TAU);ctx.fill();
 }
 ctx.restore();
}

function drawWorm(w,t){
 if(!w.alive)return;
 const z=camera.zoom;
 if(Math.abs(w.x-camera.x)>vw/z*.8+1700||Math.abs(w.y-camera.y)>vh/z*.8+1700)return;
 const r=wormRadius(w),n=w.segments.length;
 if(!n)return;
 const tip=w.segments[n-1],dark=w.color[1],light=w.color[0],accent=w.accent;
 const boosting=w.boost&&w.mass>38;
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 ctx.beginPath();ctx.moveTo(tip.x,tip.y);
 for(let i=n-2;i>=0;i--)ctx.lineTo(w.segments[i].x,w.segments[i].y);
 ctx.lineTo(w.x,w.y);
 if(boosting){
  // A full-body plasma sheath. Unlike the original tail-only stroke, both
  // the silhouette and travelling energy bands illuminate every segment.
  ctx.save();
  ctx.strokeStyle=accent;ctx.lineWidth=r*2.8;
  ctx.globalAlpha=.33+Math.sin(t*13+w.id)*.10;
  if(options.glow){ctx.shadowColor=accent;ctx.shadowBlur=30;}
  ctx.stroke();ctx.restore();
 }
 ctx.strokeStyle=dark;ctx.lineWidth=r*2.2;ctx.globalAlpha=w.invulnerable>0?.64:1;ctx.stroke();
 ctx.strokeStyle=light;ctx.lineWidth=r*1.63;ctx.globalAlpha=w.invulnerable>0?.6:.88;ctx.stroke();
 ctx.globalAlpha=1;
 drawCosmicInterior(w,t,r);
 drawSkinGeometry(w,t,r);
 if(boosting){
  ctx.save();
  ctx.strokeStyle='#f8f4ff';ctx.lineWidth=Math.max(2.2,r*.33);
  ctx.setLineDash([r*.72,r*1.75]);ctx.lineDashOffset=-t*155-w.id*4;
  ctx.globalAlpha=.55+Math.sin(t*12)*.21;
  if(options.glow){ctx.shadowBlur=15;ctx.shadowColor=accent;}
  ctx.stroke();ctx.restore();
 }
 // Eight individual cosmic skins have distinct dorsal motifs; no external
 // textures are needed, so all variants work in Playgama's compact HTML.
 for(let i=n-1;i>=1;i-=4){
  const node=w.segments[i],prev=w.segments[Math.max(0,i-1)];
  const dx=prev.x-node.x,dy=prev.y-node.y,d=Math.hypot(dx,dy)||1;
  const nx=-dy/d,ny=dx/d,phase=t*2.3+i*.43;
  ctx.globalAlpha=.4+.2*Math.sin(phase);
  ctx.fillStyle=accent;ctx.strokeStyle=accent;ctx.lineWidth=Math.max(1.2,r*.13);
  if(w.pattern==='aurora'){
   const side=Math.sin(phase)*r*.43;
   ctx.beginPath();ctx.ellipse(node.x+nx*side,node.y+ny*side,r*.3,r*.13,
    Math.atan2(dy,dx),0,TAU);ctx.fill();
  }else if(w.pattern==='pulsar'){
   ctx.beginPath();ctx.arc(node.x,node.y,r*(.18+.1*Math.sin(phase)),0,TAU);ctx.stroke();
  }else if(w.pattern==='flare'){
   ctx.globalAlpha=.54;ctx.beginPath();
   ctx.moveTo(node.x+nx*r*.35,node.y+ny*r*.35);
   ctx.lineTo(node.x+nx*r*.70-dx/d*r*.4,node.y+ny*r*.70-dy/d*r*.4);
   ctx.lineTo(node.x-dx/d*r*.3,node.y-dy/d*r*.3);ctx.fill();
  }else if(w.pattern==='horizon'){
   ctx.globalAlpha=.78;ctx.beginPath();ctx.arc(node.x,node.y,r*.20,0,TAU);ctx.fill();
   ctx.globalAlpha=.35;ctx.beginPath();ctx.arc(node.x,node.y,r*.46,0,TAU);ctx.stroke();
  }else if(w.pattern==='supernova'){
   ctx.beginPath();ctx.arc(node.x+nx*r*.28,node.y+ny*r*.28,r*.24,0,TAU);ctx.fill();
   ctx.beginPath();ctx.arc(node.x-nx*r*.22,node.y-ny*r*.22,r*.12,0,TAU);ctx.fill();
  }else if(w.pattern==='comet'){
   ctx.beginPath();ctx.moveTo(node.x+nx*r*.34,node.y+ny*r*.34);
   ctx.lineTo(node.x+dx/d*r*.3,node.y+dy/d*r*.3);
   ctx.lineTo(node.x-nx*r*.34,node.y-ny*r*.34);
   ctx.lineTo(node.x-dx/d*r*.3,node.y-dy/d*r*.3);ctx.closePath();ctx.fill();
  }else if(w.pattern==='stardust'){
   ctx.beginPath();ctx.moveTo(node.x-r*.22,node.y);ctx.lineTo(node.x+r*.22,node.y);
   ctx.moveTo(node.x,node.y-r*.22);ctx.lineTo(node.x,node.y+r*.22);ctx.stroke();
   ctx.beginPath();ctx.arc(node.x+nx*r*.4,node.y+ny*r*.4,r*.07,0,TAU);ctx.fill();
  }else{
   ctx.beginPath();ctx.arc(node.x+nx*r*.21,node.y+ny*r*.21,r*.22,0,TAU);ctx.fill();
  }
  if(boosting&&i%8===1){
   ctx.globalAlpha=.85;ctx.fillStyle='#ffffff';
   ctx.beginPath();ctx.arc(node.x,node.y,Math.max(2.1,r*(.10+.035*Math.sin(t*16+i))),0,TAU);ctx.fill();
  }
 }
 ctx.globalAlpha=1;
 drawSkinHead(w,r);
 if(options.names||w.human){
  ctx.font='900 12px Inter,system-ui,sans-serif';ctx.textAlign='center';
  ctx.fillStyle=w.human?'#fff':'#fff';
  ctx.shadowColor='#03020b';ctx.shadowBlur=8;
  ctx.fillText(w.name,w.x,w.y-r*2.2);ctx.shadowBlur=0;
 }
 ctx.restore();
}

function paintDeathGhost(){
 const ghost=game.deathGhost;
 if(!ghost||game.state!=='death-replay')return;
 const p=clamp(game.deathElapsed/1.65,0,1),a=Math.pow(1-p,2);
 if(a<.005)return;
 const r=ghost.r;
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.globalAlpha=a*.76;
 ctx.beginPath();
 const tail=ghost.segments[ghost.segments.length-1];
 ctx.moveTo(tail.x,tail.y);
 for(let i=ghost.segments.length-2;i>=0;i--){
  const node=ghost.segments[i];ctx.lineTo(node.x,node.y);
 }
 ctx.lineTo(ghost.x,ghost.y);
 ctx.strokeStyle=ghost.color;ctx.lineWidth=r*1.8;
 ctx.shadowColor=ghost.accent;ctx.shadowBlur=26+p*23;ctx.stroke();
 ctx.globalAlpha=a*.55;ctx.strokeStyle='#fff4ff';ctx.lineWidth=r*.72;ctx.stroke();
 ctx.globalAlpha=a;ctx.strokeStyle=ghost.accent;ctx.shadowBlur=10;ctx.lineWidth=2.5;
 for(let j=0;j<2;j++){
  const expansion=(p*.75+j*.33)*r*8;
  ctx.beginPath();ctx.arc(ghost.x,ghost.y,r+expansion,0,TAU);
  ctx.globalAlpha=a*.47*(1-j*.55);ctx.stroke();
 }
 ctx.restore();
}
function paintDeathVignette(){
 if(game.state!=='death-replay')return;
 const elapsed=game.deathElapsed;
 const progress=clamp((elapsed-.2)/(DEATH_REPLAY_SECONDS-.2),0,1);
 const soft=progress*progress*(3-2*progress);
 ctx.save();
 const shade=ctx.createRadialGradient(vw*.5,vh*.5,Math.min(vw,vh)*.13,
  vw*.5,vh*.5,Math.max(vw,vh)*.72);
 shade.addColorStop(0,'rgba(4,9,21,0)');
 shade.addColorStop(1,'rgba(4,8,22,'+(soft*.48).toFixed(3)+')');
 ctx.fillStyle=shade;ctx.fillRect(0,0,vw,vh);
 ctx.restore();
}
function paint(t){
 ctx.setTransform(dpr,0,0,dpr,0,0);
 backdrop(t);
 const p=game.player;if(!p)return;
 const replay=game.state==='death-replay'||game.state==='finished';
 const targetZoom=clamp(((vw<700?.87:1.04)-Math.log(Math.max(1,p.mass)/60)*.115)/
  (options.zoom/100)*(replay?.89:1),.35,1.45);
 camera.zoom+=(targetZoom-camera.zoom)*.045;
 const focus=replay&&game.deathPosition?game.deathPosition:p;
 camera.x+=(focus.x-camera.x)*.09;camera.y+=(focus.y-camera.y)*.09;
 ctx.save();ctx.translate(vw*.5,vh*.5);ctx.scale(camera.zoom,camera.zoom);ctx.translate(-camera.x,-camera.y);
 ctx.strokeStyle='#8555d492';ctx.lineWidth=6;ctx.shadowColor='#8a4eea';ctx.shadowBlur=19;
 ctx.beginPath();ctx.arc(WORLD.cx,WORLD.cy,WORLD.rx,0,TAU);ctx.stroke();
 ctx.shadowBlur=0;
 drawFood(t);
 paintDeathGhost();
 const sorted=game.worms.filter(w=>w.alive).sort((a,b)=>a===p?1:b===p?-1:a.mass-b.mass);
 for(const w of sorted)drawWorm(w,t);
 for(const f of game.fx){ctx.globalAlpha=clamp(f.t/f.max,0,1);ctx.fillStyle=f.c;ctx.fillRect(f.x,f.y,f.r,f.r);}
 ctx.globalAlpha=1;ctx.restore();
 // Soft screen-space vignette leaves HUD labels legible over bright worms.
 const vignette=ctx.createRadialGradient(vw/2,vh/2,Math.min(vw,vh)*.3,
  vw/2,vh/2,Math.max(vw,vh)*.81);
 vignette.addColorStop(0,'#07041100');vignette.addColorStop(1,'#03020ab0');
 ctx.fillStyle=vignette;ctx.fillRect(0,0,vw,vh);
 paintDeathVignette();
}
function renderSkinSettings(){
 const grid=$('worm-skin-grid');grid.replaceChildren();
 for(const skin of SKINS){
  const btn=document.createElement('button');btn.type='button';
  btn.className='worm-skin-card'+(skin.id===options.skin?' active':'');
  btn.style.setProperty('--skin-accent',skin.light);
  btn.dataset.skin=skin.id;btn.setAttribute('aria-pressed',String(skin.id===options.skin));
  const preview=document.createElement('span');preview.className='worm-skin-preview';preview.dataset.previewSkin=skin.id;
  const previewStars=document.createElement('span');previewStars.className='worm-preview-stars';
  const previewComet=document.createElement('i');previewComet.className='worm-preview-comet';
  preview.append(previewStars,previewComet);
  preview.style.setProperty('--swatch-light',skin.light);
  preview.style.setProperty('--swatch-dark',skin.dark);
  preview.style.setProperty('--swatch-accent',skin.accent);
  const title=document.createElement('strong');title.textContent=skin[language];
  btn.append(preview,title);
  btn.onclick=()=>{
   options.skin=skin.id;saveOptions();applySkin(game.player,options.skin);
   renderSkinSettings();
  };
  grid.append(btn);
 }
}
function showSettings(){
 if(DEMO||game.state!=='paused')return;
 game.state='settings';
 $('worm-pause-overlay').hidden=true;
 $('worm-settings').hidden=false;
 $('worm-setting-glow').checked=options.glow;
 $('worm-setting-names').checked=options.names;
 $('worm-setting-zoom').value=String(options.zoom);
 $('worm-zoom-value').textContent=options.zoom+'%';
 renderSkinSettings();
}
function closeSettings(){
 if(game.state!=='settings')return;
 game.state='paused';
 $('worm-settings').hidden=true;
 $('worm-pause-overlay').hidden=false;
}

function revealDeathResult(){
 if(game.state!=='death-replay')return;
 game.state='finished';
 const overlay=$('worm-result');
 overlay.hidden=false;
 overlay.classList.add('is-revealing');
 window.SpacePlatform?.playing?.(false);
 if(!DEMO)updateUI();
}

function pause(){
 if(DEMO)return;
 if(game.state==='settings'){closeSettings();return;}
 if(game.state==='playing'){
  game.state='paused';$('worm-pause-overlay').hidden=false;
  window.SpacePlatform?.playing?.(false);
 }else if(game.state==='paused'){
  game.state='playing';$('worm-pause-overlay').hidden=true;
  window.SpacePlatform?.playing?.(true);
 }
}
function showGuide(returnTo='playing'){
 if(DEMO)return;
 guideReturn=returnTo;guideStep=0;game.state='guide';
 $('worm-pause-overlay').hidden=true;
 $('worm-guide').hidden=false;
 paintGuide();
 window.SpacePlatform?.playing?.(false);
}
function paintGuide(){
 const step=T.guide[guideStep];
 $('worm-guide-step-title').textContent=step[0];
 $('worm-guide-step-copy').textContent=step[1];
 $('worm-guide-counter').textContent=String(guideStep+1).padStart(2,'0')+' / 03';
 $('worm-guide-next').textContent=guideStep===2?T.start:T.next;
 [...$('worm-guide-dots').children].forEach((e,i)=>e.classList.toggle('current',i===guideStep));
}
function closeGuide(){
 try{localStorage.setItem('infinity-space-mode-guide-v2:worms','1')}catch(_){}
 $('worm-guide').hidden=true;game.state=guideReturn;
 if(guideReturn==='paused')$('worm-pause-overlay').hidden=false;
 else window.SpacePlatform?.playing?.(true);
}
function exit(){
 let previous=null;try{previous=sessionStorage.getItem('infinity-space-embedded-return')}catch(_){}
 if(location.protocol==='blob:'){
  if(previous){try{const url=new URL(previous);url.searchParams.set('select','worms');location.assign(url.href);return;}catch(_){}}
  history.back();return;
 }
 location.assign('index.html?select=worms');
}
$('worm-pause').onclick=pause;$('worm-resume').onclick=pause;
$('worm-settings-open').onclick=showSettings;
$('worm-settings-back').onclick=closeSettings;
$('worm-setting-glow').onchange=e=>{options.glow=e.target.checked;saveOptions();};
$('worm-setting-names').onchange=e=>{options.names=e.target.checked;saveOptions();};
$('worm-setting-zoom').oninput=e=>{
 options.zoom=clamp(Number(e.target.value),75,140);
 $('worm-zoom-value').textContent=options.zoom+'%';saveOptions();
};
$('worm-open-guide').onclick=()=>showGuide('paused');$('worm-exit').onclick=exit;
$('worm-guide-skip').onclick=closeGuide;
$('worm-guide-next').onclick=()=>{if(guideStep<2){guideStep++;paintGuide();}else closeGuide();};
$('worm-restart').onclick=()=>{init();window.SpacePlatform?.playing?.(game.state==='playing');};
$('worm-result-menu').onclick=exit;
const boost=$('worm-boost');
boost.addEventListener('pointerdown',e=>{if(game.state!=='playing')return;e.preventDefault();boost.setPointerCapture(e.pointerId);input.boostTouch=true;});
for(const evt of ['pointerup','pointercancel','lostpointercapture'])boost.addEventListener(evt,()=>{input.boostTouch=false;});
const stick=$('worm-stick'),thumb=$('worm-thumb');
function updateStick(e){
 const rect=stick.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
 const dx=e.clientX-cx,dy=e.clientY-cy,d=Math.hypot(dx,dy),max=rect.width*.33;
 const amt=Math.min(max,d);thumb.style.transform='translate('+((dx/(d||1))*amt)+'px,'+((dy/(d||1))*amt)+'px)';
 input.stickPower=clamp(d/(max||1),0,1);if(d>4)input.stickAngle=Math.atan2(dy,dx);
}
stick.addEventListener('pointerdown',e=>{e.preventDefault();input.stickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);updateStick(e);});
stick.addEventListener('pointermove',e=>{if(input.stickPointer===e.pointerId)updateStick(e);});
const stopStick=e=>{if(e.pointerId!==input.stickPointer)return;input.stickPointer=-1;input.stickPower=0;thumb.style.transform='translate(0,0)';};
stick.addEventListener('pointerup',stopStick);stick.addEventListener('pointercancel',stopStick);stick.addEventListener('lostpointercapture',stopStick);
canvas.addEventListener('pointermove',e=>{
 if(e.pointerType==='touch'){if(input.touchAngle!==null)input.touchAngle=Math.atan2(e.clientY-vh/2,e.clientX-vw/2);}
 else{input.mx=e.clientX;input.my=e.clientY;input.mouseMoved=true;}
});
canvas.addEventListener('pointerdown',e=>{
 if(game.state!=='playing')return;
 if(e.pointerType==='mouse'&&e.button===0)input.mouseDown=true;
 if(e.pointerType==='touch')input.touchAngle=Math.atan2(e.clientY-vh/2,e.clientX-vw/2);
});
window.addEventListener('pointerup',e=>{if(e.pointerType==='mouse')input.mouseDown=false;if(e.pointerType==='touch')input.touchAngle=null;});
window.addEventListener('pointercancel',()=>{input.mouseDown=false;input.touchAngle=null;});
window.addEventListener('contextmenu',e=>e.preventDefault());
window.addEventListener('keydown',e=>{
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight'].includes(e.code))e.preventDefault();
 if(e.code==='Escape'||e.code==='KeyP'){
  if(game.state==='guide')closeGuide();else if(game.state==='settings')closeSettings();else pause();return;
 }
 if(e.code==='Space'||e.code==='ShiftLeft'||e.code==='ShiftRight')input.boostKey=true;
 input.keys.add(e.code);
});
window.addEventListener('keyup',e=>{
 if(['Space','ShiftLeft','ShiftRight'].includes(e.code))input.boostKey=false;
 input.keys.delete(e.code);
});
window.addEventListener('blur',()=>{input.mouseDown=false;input.boostKey=false;input.boostTouch=false;input.keys.clear();if(game.state==='playing'&&!DEMO)pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&game.state==='playing'&&!DEMO)pause();});
function frame(now){
 requestAnimationFrame(frame);
 let dt=last?clamp((now-last)/1000,0,.047):.016;last=now;
 starTime=now*.001;
 if(game.state==='playing'||game.state==='death-replay'){
  simulate(dt);
  if(DEMO&&(!game.player.alive||game.time>80))init();
  if(game.state==='death-replay'){
   game.deathElapsed+=dt;
   if(game.deathElapsed>=DEATH_REPLAY_SECONDS)revealDeathResult();
  }
  uiClock+=dt;
  if(uiClock>.15){uiClock=0;if(!DEMO)updateUI();}
 }
 if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)$('worm-toast').classList.remove('show');}
 paint(starTime);
}
init();requestAnimationFrame(frame);
if(QUERY.has('tester')||HASH_QUERY.has('tester')||DEMO){
 window.InfinityWormsQA={
  snapshot:()=>({state:game.state,mode:'worms',demo:DEMO,time:game.time,mass:game.player.mass,
    bestMass:game.player.bestMass,length:game.player.segments.length,angle:game.player.angle,
    targetAngle:game.player.target,x:game.player.x,y:game.player.y,zoom:camera.zoom,
    rank:ranking(game.player),worms:game.worms.length,
    alive:game.worms.filter(w=>w.alive).length,food:game.food.length,
    world:{w:WORLD.w,h:WORLD.h,rx:WORLD.rx,ry:WORLD.ry},
    targetFood:FOOD_TARGET,botCount:BOT_COUNT,gridCells:game.foodGrid.size,
    skin:options.skin,glow:options.glow,names:options.names,zoomSetting:options.zoom,
    lastDeath:game.lastDeath||null,guideOpen:!$('worm-guide').hidden,
    settingsOpen:!$('worm-settings').hidden,boosting:game.player.boost,
    deathElapsed:game.deathElapsed,deathDelay:DEATH_REPLAY_SECONDS,
    deathFocus:game.deathPosition,
    resultVisible:!$('worm-result').hidden,
    resultAnimating:$('worm-result').classList.contains('is-revealing')}),
  bots:()=>game.worms.filter(w=>!w.human).map(w=>({
    id:w.id,persona:w.persona,x:w.x,y:w.y,alive:w.alive,
    speed:w.speed,reaction:w.reaction,afk:w.afkTimer>0,mass:w.mass
  })),
  botStyles:()=>Object.fromEntries(
    Object.keys(BOT_PERSONAS).map(id=>[id,
      game.worms.filter(w=>!w.human&&w.persona===id).length])),
  setMass:value=>{game.player.mass=Math.max(35,Math.min(1900,Number(value)||60));
    game.player.bestMass=Math.max(game.player.bestMass,game.player.mass);updateUI();},
  giveFood:value=>{game.player.mass+=Math.max(1,Number(value)||10);
    game.player.foodEaten++;updateUI();},
  setHeading:angle=>{input.mouseMoved=false;input.keys.clear();input.touchAngle=null;
    input.stickPower=0;game.player.target=Number(angle);},
  // Stable UI smoke tests must not randomly die while inspecting controls.
  testProtection:seconds=>{game.player.invulnerable=clamp(Number(seconds)||30,0,120);},
  forceDeath:()=>{game.player.invulnerable=0;kill(game.player,null,'body');},
  forceBotDeath:()=>{
   const b=game.worms.find(w=>!w.human&&w.alive);
   if(!b)return null;
   b.invulnerable=0;const before=game.food.length;
   kill(b,null,'body');
   return {name:b.name,segments:b.segments.length,dropped:game.food.length-before,
    lastDeath:game.lastDeath};
  },
  spawnProbe:()=>{
   const w=createWorm('SPAWN_QA',false,777,true);
   if(!w)return {safe:false,reason:'no safe candidate'};
   let minimum=Infinity;
   for(const other of game.worms){
    if(!other.alive)continue;
    const otherNodes=[other,...other.segments];
    for(const n of [w,...w.segments]){
     for(const m of otherNodes){
      const d=Math.hypot(n.x-m.x,n.y-m.y);minimum=Math.min(minimum,d);
     }
    }
   }
   return {safe:minimum>=250,minimum,segments:w.segments.length};
  },
  skins:()=>SKINS.map(x=>({id:x.id,ru:x.ru,en:x.en,pattern:x.pattern})),
  pause:()=>pause()
 };
}
document.addEventListener('DOMContentLoaded',()=>{
 Promise.resolve(window.SpacePlatform?.startup).catch(()=>{}).then(()=>{
  if(!DEMO){window.SpacePlatform?.loaded?.();window.SpacePlatform?.playing?.(game.state==='playing');}
 });
});
})();
