/* Infinity Space: persistent nickname and unified, per-mode statistics.
   Shared by the endless world, four arcade modes and Cosmic Worms. */
(function(){
'use strict';
const PROFILE_KEY='infinity-space-player-v1', STATS_KEY='infinity-space-stats-v1';
const MODE_IDS=['endless','arena','royale','core','race','worms'];
const NAMES={ru:['Общая','Бесконечный космос','Космическая арена','Последняя сингулярность','Захват ядра','Гонка эволюции','Космические черви'],en:['Overall','Endless Space','Cosmic Arena','Last Singularity','Core Conquest','Evolution Rush','Cosmic Worms'],es:['General','Espacio infinito','Arena Cósmica','Última singularidad','Conquista del núcleo','Carrera evolutiva','Gusanos cósmicos']};
const dict={
 ru:{nickname:'ТВОЙ ПОЗЫВНОЙ',prompt:'Введи никнейм — он будет виден в матчах и результатах.',placeholder:'Никнейм',save:'СОХРАНИТЬ',edit:'Сменить никнейм',error:'От 2 до 18 символов.',stats:'СТАТИСТИКА',close:'ЗАКРЫТЬ',matches:'Матчей',wins:'Побед',winrate:'Побед, %',kills:'Поглощено соперников',objects:'Поглощено объектов',mass:'Максимальная масса',time:'Время в игре',best:'Лучшее место',top3:'Топ-3',points:'Очки ядра',finish:'Лучшее время',stage:'Максимальная стадия',matter:'Всего материи',rare:'Реликвии',blackholes:'Поглощено чёрных дыр',deaths:'Поражений',forms:'Достигнуто форм',empty:'Пока нет матчей',profile:'ПРОФИЛЬ'},
 en:{nickname:'YOUR CALLSIGN',prompt:'Choose your nickname. It appears in matches, results and statistics.',placeholder:'Nickname',save:'SAVE',edit:'Change nickname',error:'Use 2–18 characters.',stats:'STATISTICS',close:'CLOSE',matches:'Matches',wins:'Wins',winrate:'Win rate',kills:'Rivals absorbed',objects:'Objects absorbed',mass:'Highest mass',time:'Time played',best:'Best rank',top3:'Top-3 finishes',points:'Core points',finish:'Best finish',stage:'Highest stage',matter:'Matter collected',rare:'Relics',blackholes:'Black holes absorbed',deaths:'Defeats',forms:'Forms reached',empty:'No matches recorded',profile:'PROFILE'},
 es:{nickname:'TU ALIAS',prompt:'Escribe tu apodo para partidas, resultados y estadísticas.',placeholder:'Apodo',save:'GUARDAR',edit:'Cambiar apodo',error:'Entre 2 y 18 caracteres.',stats:'ESTADÍSTICAS',close:'CERRAR',matches:'Partidas',wins:'Victorias',winrate:'Victorias, %',kills:'Rivales absorbidos',objects:'Objetos absorbidos',mass:'Masa máxima',time:'Tiempo jugado',best:'Mejor puesto',top3:'Top-3',points:'Puntos del núcleo',finish:'Mejor tiempo',stage:'Fase máxima',matter:'Materia recogida',rare:'Reliquias',blackholes:'Agujeros negros absorbidos',deaths:'Derrotas',forms:'Formas alcanzadas',empty:'Sin partidas',profile:'PERFIL'}
};
function language(){
 const s=window.SpaceI18n?.language || document.documentElement.lang || navigator.language || 'en';
 return /^ru\b/i.test(s)?'ru':/^es\b/i.test(s)?'es':'en';
}
const text=(key)=>dict[language()][key]||dict.en[key]||key;
function read(key,fallback){try{const v=JSON.parse(localStorage.getItem(key));return v&&typeof v==='object'?v:fallback;}catch(_){return fallback;}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch(_){}}
function safeCount(x){const n=Number(x);return Number.isFinite(n)?Math.max(0,n):0;}
function basic(){return {matches:0,wins:0,kills:0,objects:0,maxMass:0,time:0,bestPlace:null,placeSum:0,top3:0,points:0,bestPoints:0,bestFinish:null,maxStage:0,forms:[0,0,0,0,0],matter:0,rare:0,blackholes:0,deaths:0};}
function empty(){const s={version:2,order:MODE_IDS.slice()};for(const mode of MODE_IDS)s[mode]=basic();s.endless._last=null;return s;}
function getStats(){const s=read(STATS_KEY,empty());for(const mode of MODE_IDS)s[mode]=Object.assign(basic(),s[mode]||{});return s;}
function saveStats(s){write(STATS_KEY,s);window.dispatchEvent(new Event('infinity-stats-updated'));}
function getName(){const o=read(PROFILE_KEY,{});return typeof o.nickname==='string'?o.nickname.trim().slice(0,18):'';}
function setName(value){
 const name=String(value||'').trim().replace(/[<>]/g,'').replace(/\s{2,}/g,' ').slice(0,18);
 if([...name].length<2)return false;
 write(PROFILE_KEY,{version:1,nickname:name});
 window.dispatchEvent(new CustomEvent('infinity-profile-updated',{detail:{nickname:name}}));
 return true;
}
function recordMatch(mode,result){
 if(!MODE_IDS.includes(mode)||mode==='endless')return;
 const s=getStats(),b=s[mode],r=result||{};
 b.matches++;if(r.win)b.wins++;
 b.kills+=safeCount(r.kills);b.objects+=safeCount(r.objects);
 b.maxMass=Math.max(b.maxMass,safeCount(r.mass));
 b.time+=safeCount(r.time);
 const place=Math.max(1,Math.round(safeCount(r.place)||99));
 b.bestPlace=b.bestPlace===null?place:Math.min(b.bestPlace,place);
 b.placeSum+=place;if(place<=3)b.top3++;
 b.points+=safeCount(r.points);
 b.bestPoints=Math.max(b.bestPoints,safeCount(r.points));
 if(r.win && mode==='race'&&safeCount(r.time)>0)
  b.bestFinish=b.bestFinish===null?r.time:Math.min(b.bestFinish,r.time);
 b.maxStage=Math.max(b.maxStage,safeCount(r.stage));
 for(let stage=0;stage<5;stage++)if(safeCount(r.stage)>=stage)b.forms[stage]=(b.forms[stage]||0)+1;
 b.deaths+=r.win?0:1;
 saveStats(s);
}
function syncEndless(snapshot){
 if(!snapshot||typeof snapshot!=='object')return;
 const s=getStats(),b=s.endless;
 const now={
  time:safeCount(snapshot.time),objects:safeCount(snapshot.objects),matter:safeCount(snapshot.matter),
  rare:safeCount(snapshot.rare),blackholes:safeCount(snapshot.blackholes),
  deaths:safeCount(snapshot.deaths),stage:safeCount(snapshot.stage)
 };
 const before=b._last||{time:0,objects:0,matter:0,rare:0,blackholes:0,deaths:0,stage:0};
 if(now.time<before.time || now.objects<before.objects){
  // A new saved universe started; keep lifetime totals, reset the baseline.
  b._last={time:0,objects:0,matter:0,rare:0,blackholes:0,deaths:0,stage:0};
 }
 const prev=b._last||before;
 if(!prev.time && now.time>0)b.matches++;
 b.time+=Math.max(0,now.time-prev.time);
 b.objects+=Math.max(0,now.objects-prev.objects);
 b.matter+=Math.max(0,now.matter-prev.matter);
 b.rare+=Math.max(0,now.rare-prev.rare);
 b.blackholes+=Math.max(0,now.blackholes-prev.blackholes);
 b.deaths+=Math.max(0,now.deaths-prev.deaths);
 b.maxMass=Math.max(b.maxMass,now.matter,safeCount(snapshot.mass));
 b.maxStage=Math.max(b.maxStage,now.stage);
 b._last=now;
 saveStats(s);
}
function total(s){
 const r=basic();
 for(const mode of MODE_IDS){
  const b=s[mode]||basic();
  for(const k of ['matches','wins','kills','objects','time','placeSum','top3','points','matter','rare','blackholes','deaths'])r[k]+=safeCount(b[k]);
  r.maxMass=Math.max(r.maxMass,safeCount(b.maxMass));
  r.maxStage=Math.max(r.maxStage,safeCount(b.maxStage));
  r.bestPlace=b.bestPlace===null?r.bestPlace:r.bestPlace===null?b.bestPlace:Math.min(r.bestPlace,b.bestPlace);
  r.bestFinish=b.bestFinish===null?r.bestFinish:r.bestFinish===null?b.bestFinish:Math.min(r.bestFinish,b.bestFinish);
 }
 return r;
}
const num=v=>new Intl.NumberFormat(language()==='ru'?'ru-RU':'en-US',{maximumFractionDigits:0}).format(safeCount(v));
function clock(s){
 s=Math.floor(safeCount(s));const h=Math.floor(s/3600),m=Math.floor(s/60)%60,sec=s%60;
 return h?String(h)+'h '+String(m).padStart(2,'0')+'m':String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0');
}
let statsNode=null,statsMode='overall';
function showStats(selected){
 statsMode=(selected&&MODE_IDS.includes(selected))?selected:'overall';
 if(statsNode)statsNode.remove();
 const node=document.createElement('div');statsNode=node;
 node.className='infinity-profile-overlay';node.setAttribute('role','dialog');
 node.setAttribute('aria-modal','true');node.setAttribute('aria-label',text('stats'));
 node.innerHTML='<section class="infinity-profile-panel infinity-stats-panel">'+
  '<div class="infinity-panel-top"><div><small>INFINITY SPACE / '+text('profile')+'</small><h2>'+text('stats')+'</h2></div>'+
  '<button class="infinity-overlay-close" type="button" aria-label="'+text('close')+'">×</button></div>'+
  '<div class="infinity-stats-player"><span class="infinity-profile-avatar">✧</span>'+
  '<strong class="infinity-stats-player-name"></strong><button class="infinity-stats-change-name" type="button">'+text('edit')+'</button></div>'+
  '<div class="infinity-stats-tabs" role="tablist"></div><div class="infinity-stats-detail"></div></section>';
 document.body.appendChild(node);
 node.querySelector('.infinity-stats-player-name').textContent=getName()||'PLAYER';
 const tabs=node.querySelector('.infinity-stats-tabs'),labels=NAMES[language()];
 ['overall',...MODE_IDS].forEach((id,i)=>{
  const b=document.createElement('button');b.type='button';b.dataset.mode=id;
  b.textContent=labels[i];b.setAttribute('role','tab');
  b.onclick=()=>{statsMode=id;paint();};
  tabs.appendChild(b);
 });
 node.querySelector('.infinity-overlay-close').onclick=()=>{node.remove();if(statsNode===node)statsNode=null;};
 node.querySelector('.infinity-stats-change-name').onclick=()=>promptName(false,()=>{node.querySelector('.infinity-stats-player-name').textContent=getName();});
 node.addEventListener('pointerdown',ev=>{if(ev.target===node)node.querySelector('.infinity-overlay-close').click();});
 const key=e=>{if(!node.isConnected){document.removeEventListener('keydown',key,true);return;}
  if(e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();node.querySelector('.infinity-overlay-close').click();document.removeEventListener('keydown',key,true);}};
 document.addEventListener('keydown',key,true);
 function paint(){
  const s=getStats(),b=statsMode==='overall'?total(s):s[statsMode];
  [...tabs.children].forEach(button=>{const active=button.dataset.mode===statsMode;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active));});
  const list=[
   ['matches',b.matches],['wins',b.wins],['winrate',(statsMode==='overall'?MODE_IDS.slice(1).reduce((sum,id)=>sum+s[id].matches,0):b.matches)?Math.round(b.wins/(statsMode==='overall'?MODE_IDS.slice(1).reduce((sum,id)=>sum+s[id].matches,0):b.matches)*100)+'%':'0%'],
   ['kills',b.kills],['objects',b.objects],['mass',b.maxMass],['time',clock(b.time)]
  ];
  if(statsMode==='endless'||statsMode==='overall')list.push(['stage',b.maxStage+1],['matter',b.matter],['rare',b.rare],['blackholes',b.blackholes]);
  if(['arena','royale','worms','overall'].includes(statsMode))list.push(['best',b.bestPlace===null?'—':'#'+b.bestPlace],['top3',b.top3]);
  if(statsMode==='core'||statsMode==='overall')list.push(['points',b.points]);
  if(statsMode==='race'||statsMode==='overall')list.push(['finish',b.bestFinish===null?'—':clock(b.bestFinish)]);
  if(statsMode==='race')list.push(['forms',b.forms.slice(1).join(' / ')]);
  const detail=node.querySelector('.infinity-stats-detail');detail.replaceChildren();
  for(const [key,value] of list){
   const card=document.createElement('div');card.className='infinity-stats-card';
   const label=document.createElement('small');label.textContent=text(key);
   const strong=document.createElement('strong');strong.textContent=typeof value==='number'?num(value):String(value);
   card.append(label,strong);detail.append(card);
  }
 }
 paint();
 return node;
}
function promptName(required=true,onSave){
 const current=document.querySelector('.infinity-nickname-prompt');if(current){current.querySelector('input')?.focus();return current;}
 const node=document.createElement('div');node.className='infinity-profile-overlay infinity-nickname-prompt';
 node.setAttribute('role','dialog');node.setAttribute('aria-modal','true');
 node.innerHTML='<section class="infinity-profile-panel infinity-nickname-panel">'+
  '<div class="infinity-panel-top"><div><small>INFINITY SPACE / '+text('profile')+'</small><h2>'+text('nickname')+'</h2></div>'+
  (required?'':'<button class="infinity-overlay-close" type="button" aria-label="'+text('close')+'">×</button>')+
  '</div><p>'+text('prompt')+'</p><form><label for="infinity-nick-input">'+text('nickname')+'</label>'+
  '<input id="infinity-nick-input" name="nickname" type="text" maxlength="18" minlength="2" spellcheck="false" required autocomplete="nickname" placeholder="'+text('placeholder')+'">'+
  '<div class="infinity-nickname-error" aria-live="polite"></div>'+
  '<button class="infinity-nickname-save" type="submit">'+text('save')+'</button></form></section>';
 document.body.append(node);
 const input=node.querySelector('input');input.value=getName();
 const close=()=>node.remove();
 if(!required)node.querySelector('.infinity-overlay-close').onclick=close;
 node.querySelector('form').onsubmit=e=>{
  e.preventDefault();
  if(!setName(input.value)){node.querySelector('.infinity-nickname-error').textContent=text('error');input.focus();return;}
  close();if(typeof onSave==='function')onSave(getName());
 };
 const key=e=>{if(!node.isConnected){document.removeEventListener('keydown',key,true);return;}
  if(e.code==='Escape'){e.stopImmediatePropagation();e.preventDefault();if(!required){close();document.removeEventListener('keydown',key,true);}}
 };
 document.addEventListener('keydown',key,true);
 input.focus();
 return node;
}
window.InfinityProfile={getName,setName,promptName,showStats,getStats,recordMatch,syncEndless,total,language,text};
})();