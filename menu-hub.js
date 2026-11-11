/* Infinity Space — main menu experience.
 * Presentation only: original game handlers, saves, language and reward flow
 * stay attached to the EXISTING buttons when they move into the new layout.
 */
(()=>{'use strict';
 const words={
  ru:{modes:'РЕЖИМЫ ИГРЫ',modesSub:'Арена · Выживание · Захват · Гонка · Черви',world:'ТВОЯ ВСЕЛЕННАЯ',
      worldSub:'Прогресс и открытия',bonus:'БОНУСЫ',bonusSub:'Награды каждый день',
      more:'ЕЩЁ',less:'СВЕРНУТЬ',progress:'ТЕКУЩАЯ ЭВОЛЮЦИЯ',newSub:'Начать с начала',
      tabMap:'Карта',tap:'Открыть',progressTitle:'Прогресс'},
  en:{modes:'GAME MODES',modesSub:'Arena · Royale · Conquest · Race · Worms',world:'YOUR UNIVERSE',
      worldSub:'Progress and discoveries',bonus:'BONUSES',bonusSub:'Claim daily rewards',
      more:'MORE',less:'COLLAPSE',progress:'CURRENT EVOLUTION',newSub:'Start over',
      tabMap:'Map',tap:'Open',progressTitle:'Progress'},
  es:{modes:'MODOS DE JUEGO',modesSub:'Arena · Supervivencia · Control · Carrera · Gusanos',
      world:'TU UNIVERSO',worldSub:'Progreso y descubrimientos',bonus:'BONOS',
      bonusSub:'Recompensas diarias',more:'MÁS',less:'CERRAR',
      progress:'EVOLUCIÓN ACTUAL',newSub:'Comenzar de nuevo',tabMap:'Mapa',
      tap:'Abrir',progressTitle:'Progreso'}
 };
 const esc=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const q=(parent,selector)=>parent?.querySelector(selector);

 // A full-screen mode storyboard lives INSIDE the main menu. The background
 // changes on the existing universe canvas; there is no small card wallpaper.
 const modeStories=[
  {id:'endless',title:['Endless Space','Бесконечный космос','Espacio infinito'],
   subtitle:['THE ORIGINAL UNIVERSE','ОСНОВНАЯ ВСЕЛЕННАЯ','EL UNIVERSO ORIGINAL'],
   goal:['Explore and evolve forever','Исследуй и эволюционируй бесконечно','Explora y evoluciona sin límites'],
   desc:['Absorb matter, travel across a vast persistent universe and evolve into a supermassive black hole. Everything you discover remains saved.',
         'Поглощай материю, летай по огромной постоянной Вселенной и вырасти до сверхмассивной чёрной дыры. Исследованные области сохраняются.',
         'Absorbe materia, explora un universo persistente y evoluciona hasta un agujero negro supermasivo. Tu progreso se guarda.'],
   tags:[['∞ UNLIMITED','∞ БЕЗ КОНЦА','∞ SIN LÍMITE'],['SAVED WORLD','СОХРАНЕНИЕ','MUNDO GUARDADO'],['SOLO','ОДИНОЧНЫЙ','SOLO']]},
  {id:'arena',title:['Cosmic Arena','Космическая арена','Arena Cósmica'],
   subtitle:['MASS DUEL · FREE FOR ALL','ПОЕДИНОК ЗА МАССУ','DUELO POR MASA'],
   goal:['Grow bigger than everyone else','Стань массивнее всех','Consigue la mayor masa'],
   desc:['A dense field of drifting minerals, planets and rival organisms. Absorb matter and opponents, use gravity and finish first on the leaderboard.',
         'Поле из летящих минералов, планет и соперников. Поглощай добычу, используй гравитацию и стань первым в таблице лидеров.',
         'Recoge materia en movimiento, absorbe rivales, usa la gravedad y lidera la clasificación.'],
   tags:[['05:00 MATCH','МАТЧ 05:00','05:00 PARTIDA'],['17 RIVALS','17 СОПЕРНИКОВ','17 RIVALES'],['MASS WINS','ПОБЕДА ПО МАССЕ','GANA POR MASA']]},
  {id:'royale',title:['Last Singularity','Последняя сингулярность','Última singularidad'],
   subtitle:['SURVIVAL · COLLAPSING SPACE','ВЫЖИВАНИЕ · СЖАТИЕ','SUPERVIVENCIA'],
   goal:['Survive the collapsing storm','Переживи сжимающийся шторм','Sobrevive a la tormenta'],
   desc:['The safe area shrinks around a black hole. Evade the storm, outgrow opponents and remain the only survivor.',
         'Безопасная зона постепенно сжимается вокруг чёрной дыры. Уходи от шторма, перерастай соперников и останься последним.',
         'La zona segura se reduce alrededor de un agujero negro. Esquiva la tormenta y sé el último superviviente.'],
   tags:[['04:00 MATCH','МАТЧ 04:00','04:00 PARTIDA'],['19 RIVALS','19 СОПЕРНИКОВ','19 RIVALES'],['LAST ONE WINS','ПОСЛЕДНИЙ ПОБЕДИТ','ÚLTIMO EN PIE']]},
  {id:'core',title:['Core Conquest','Захват ядра','Conquista del núcleo'],
   subtitle:['TEAM BATTLE · ZONE CONTROL','КОМАНДНЫЙ БОЙ','COMBATE POR EQUIPOS'],
   goal:['Hold the core and score 100','Удержи ядро и набери 100','Controla el núcleo y suma 100'],
   desc:['Two teams fight over a luminous energy core. Your team earns points while it controls the center; coordinated pressure wins.',
         'Две команды борются за светящееся энергетическое ядро. Захватывай центр и удерживай его, чтобы получить 100 очков.',
         'Dos equipos luchan por el núcleo de energía. Controla el centro hasta alcanzar 100 puntos.'],
   tags:[['04:20 MATCH','МАТЧ 04:20','04:20 PARTIDA'],['2 TEAMS','2 КОМАНДЫ','2 EQUIPOS'],['100 POINTS','100 ОЧКОВ','100 PUNTOS']]},
  {id:'race',title:['Evolution Rush','Гонка эволюции','Carrera evolutiva'],
   subtitle:['EVOLUTION · RACE TO THE HORIZON','ГОНКА ФОРМ','CARRERA EVOLUTIVA'],
   goal:['Become a black hole first','Первым стань чёрной дырой','Sé el primero en ser un agujero negro'],
   desc:['Climb through dust, asteroid, planet and star forms. Every stage takes time. Reach the final black-hole form before the rivals.',
         'Развивайся от пыли через астероид, планету и звезду. Каждая стадия требует времени. Первым превратись в чёрную дыру.',
         'Evoluciona de polvo a asteroide, planeta y estrella. Cada etapa requiere tiempo. Llega primero a agujero negro.'],
   tags:[['04:45 MATCH','МАТЧ 04:45','04:45 PARTIDA'],['15 RIVALS','15 СОПЕРНИКОВ','15 RIVALES'],['5 FORMS','5 ФОРМ','5 FORMAS']]},
  {id:'worms',title:['Cosmic Worms','Космические черви','Gusanos cósmicos'],
   subtitle:['SURVIVAL · COSMIC SERPENTS','ВЫЖИВАНИЕ · КОСМИЧЕСКИЕ ЧЕРВИ','SUPERVIVENCIA · SERPIENTES'],
   goal:['Grow the longest worm in the galaxy','Вырастай в самого длинного червя','Conviértete en el gusano más largo'],
   desc:['Gather glowing stardust, grow a luminous tail, encircle rivals and avoid crashing your head into another worm. Boost by spending your mass. Survive as long as you can.',
         'Собирай светящуюся материю, отращивай длинный космический хвост, перекрывай путь соперникам и не врезайся головой в их тела. Ускоряйся за счёт массы.',
         'Recoge polvo estelar, alarga tu cola, bloquea a los rivales y evita chocar contra sus cuerpos. Usa tu masa para acelerar.'],
   tags:[['ENDLESS SURVIVAL','БЕСКОНЕЧНОЕ ВЫЖИВАНИЕ','SUPERVIVENCIA INFINITA'],['58 RIVALS','58 СОПЕРНИКОВ','58 RIVALES'],['BOOST COSTS MASS','РЫВОК ТРАТИТ МАССУ','IMPULSO GASTA MASA']]}
 ];
 // Each menu background is the actual arcade game running a small AI-only match
 // inside a visual-only iframe. It uses the same physics, sprites and hazards.
 function createLiveModeBackdrop(overlay){
  const host=document.createElement('div');host.className='hub-live-demo';
  host.setAttribute('aria-hidden','true');overlay.prepend(host);
  let serial=0,active=null;
  const setMode=(mode)=>{
   const n=++serial;
   const frames=[...host.children];
   if(mode==='endless'){
    for(const old of frames)old.classList.remove('ready');
    active=null;
    setTimeout(()=>{if(serial===n)host.replaceChildren();},760);
    return;
   }
   const wrap=document.createElement('div');wrap.className='hub-demo-frame';
   const iframe=document.createElement('iframe');iframe.tabIndex=-1;
   iframe.setAttribute('aria-hidden','true');iframe.setAttribute('title','Live '+mode+' demonstration');
   iframe.setAttribute('referrerpolicy','same-origin');
   iframe.setAttribute('loading','eager');
   iframe.allow='autoplay';
   iframe.src=window.SpaceModeDemoURL?.(mode)||(mode==='worms'?'cosmic-worms.html?demo=1&v=12':'cosmic-arena.html?demo='+encodeURIComponent(mode)+'&v=11');
   wrap.append(iframe);host.append(wrap);
   active=wrap;
   const reveal=()=>{
    if(serial!==n){wrap.remove();return;}
    wrap.classList.add('ready');
    for(const old of [...host.children])if(old!==wrap){
     old.classList.remove('ready');
     setTimeout(()=>old.remove(),840);
    }
   };
   iframe.addEventListener('load',()=>{
    // The demo has its own canvas and animation loop; no HUD or controls.
    setTimeout(reveal,160);
   },{once:true});
   setTimeout(()=>{if(serial===n&&!wrap.classList.contains('ready'))reveal();},1900);
   // Rapid successive swipes must not leave several 60-FPS simulations alive.
   if(host.children.length>2){
    for(const old of [...host.children].slice(0,-2))old.remove();
   }
  };
  return {setMode};
 }
 function buildMainMenuModeSelector(root,play,code){
  const langIndex=code==='en'?0:code==='es'?2:1;
  const t=(translations)=>translations[langIndex];
  let current=0,originX=0,originY=0,dragging=false,lastWheel=0,hasSelection=false;
  const overlay=document.createElement('section');
  overlay.id='hub-mode-story';
  overlay.className='hub-mode-story';
  overlay.hidden=false;
  overlay.setAttribute('aria-label',t(['Game mode selection','Выбор режима игры','Elegir modo de juego']));
  overlay.innerHTML='<header class="hub-mode-story-top">'+
    '<span class="hub-mode-story-home">INFINITY SPACE</span>'+
    '<div class="hub-mode-story-brand">INFINITY SPACE <span>/</span> GAME MODES</div>'+
    '<div class="hub-story-quick" aria-label="Daily rewards"></div>'+
    '<button class="hub-profile-chip" type="button" aria-label="Profile"><span aria-hidden="true">✧</span><span class="hub-profile-name">PLAYER</span></button>'+
    '<span class="hub-mode-story-counter"></span></header>'+
    '<div class="hub-mode-story-copy" aria-live="polite">'+
      '<p class="hub-mode-story-kicker"></p>'+
      '<h2 class="hub-mode-story-title"></h2>'+
      '<p class="hub-mode-story-goal"></p>'+
      '<p class="hub-mode-story-description"></p>'+
      '<div class="hub-mode-story-tags"></div>'+
      '<button class="hub-mode-story-play" type="button"><span></span><b aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="square" stroke-linejoin="miter"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></b></button>'+
    '</div>'+
    '<footer class="hub-mode-story-footer">'+
      '<div class="hub-mode-nav-controls"><button class="hub-mode-step" data-dir="-1" type="button" aria-label="Previous mode"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg></button>'+
      '<div class="hub-mode-dots" aria-label="Choose mode"></div>'+
      '<button class="hub-mode-step" data-dir="1" type="button" aria-label="Next mode"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></button></div>'+
      '<span class="hub-mode-gesture"></span>'+
    '</footer><nav class="hub-story-nav" aria-label="Quick access to game sections"></nav>';
  root.append(overlay);
  const demoBackground=createLiveModeBackdrop(overlay);
  const profile=window.InfinityProfile;
  const chip=q(overlay,'.hub-profile-chip');
  const syncNickname=()=>{
   q(chip,'.hub-profile-name').textContent=profile?.getName()||'PLAYER';
   chip.title=(profile?.getName()||'PLAYER')+' · '+(profile?.text?.('edit')||'Change nickname');
  };
  syncNickname();
  chip.onclick=()=>profile?.promptName(false,syncNickname);
  window.addEventListener('infinity-profile-updated',syncNickname);
  if(profile&&!profile.getName())setTimeout(()=>{
   if(root.isConnected&&!document.querySelector('.infinity-nickname-prompt'))profile.promptName(true,syncNickname);
  },0);
  // Daily rewards are visible directly on the home screen. Move the original
  // buttons with their registered reward callbacks, never clone dead controls.
  const quick=q(overlay,'.hub-story-quick');
  for(const kind of ['daily','roulette']){
   const original=q(root,'[data-reward-page="'+kind+'"]');
   if(original){
    original.classList.add('hub-story-reward');
    original.setAttribute('aria-label',kind==='daily'?
      t(['Daily rewards','Ежедневные награды','Recompensas diarias']):
      t(['Roulette','Рулетка','Ruleta']));
    original.title=original.getAttribute('aria-label');
    quick.append(original);
   }
  }
  const setMode=(next)=>{
   const target=Math.max(0,Math.min(modeStories.length-1,next));
   if(hasSelection&&target===current)return;
   const previous=current,changed=hasSelection;
   const direction=target>previous?1:-1;
   if(changed)window.SpaceMenuBeginTransition?.(direction);
   current=target;hasSelection=true;
   const entry=modeStories[current];
   window.SpaceMenuSceneMode=entry.id==='endless'?null:entry.id;
   demoBackground.setMode(entry.id);
   root.dataset.previewMode=entry.id;
   window.SpaceMenuLastSelected=entry.id;
   // Universe map is meaningful only for the original persistent sandbox.
   root.classList.toggle('hub-mode-endless',entry.id==='endless');
   q(overlay,'.hub-mode-story-kicker').textContent=t(entry.subtitle);
   q(overlay,'.hub-mode-story-title').textContent=t(entry.title);
   q(overlay,'.hub-mode-story-goal').textContent=t(entry.goal);
   q(overlay,'.hub-mode-story-description').textContent=t(entry.desc);
   q(overlay,'.hub-mode-story-counter').textContent=String(current+1).padStart(2,'0')+' / '+String(modeStories.length).padStart(2,'0');
   q(overlay,'.hub-mode-story-tags').replaceChildren(...entry.tags.map(tags=>{
    const node=document.createElement('span');node.textContent=t(tags);return node;
   }));
   q(overlay,'.hub-mode-story-play span').textContent=entry.id==='endless'?
    t(['CONTINUE EXPLORING','ПРОДОЛЖИТЬ ПОЛЁТ','CONTINUAR EXPLORANDO']):
    t(['PLAY THIS MODE','ИГРАТЬ В РЕЖИМ','JUGAR ESTE MODO']);
   q(overlay,'[data-dir="-1"]').disabled=current===0;
   q(overlay,'[data-dir="1"]').disabled=current===modeStories.length-1;
   overlay.querySelectorAll('.hub-mode-dots button').forEach((dot,i)=>{
    dot.classList.toggle('current',i===current);
    dot.setAttribute('aria-current',String(i===current));
   });
   // Entering a new mode glides the whole copy rather than teleporting text.
   const copy=q(overlay,'.hub-mode-story-copy');
   if(changed&&copy&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    copy.getAnimations().forEach(a=>a.cancel());
    const slide=window.innerWidth<=800?0:22;
    copy.animate([
      {opacity:.3,transform:'translate3d('+direction*slide+'px,5px,0)'},
      {opacity:.92,transform:'translate3d('+direction*(slide?-2:0)+'px,0,0)'},
      {opacity:1,transform:'translate3d(0,0,0)'}
    ],{duration:510,easing:'cubic-bezier(.22,.8,.2,1)'});
   }
  };
  // Visible bottom dock. Each shortcut delegates to the already wired
  // original button, preserving map, progression, settings and save handlers.
  const nav=q(overlay,'.hub-story-nav');
  const shortcuts=[
   ['map',['Map','Карта','Mapa']],
   ['evolution',['Evolution','Эволюция','Evolución']],
   ['achievements',['Achievements','Достижения','Logros']],
   ['music',['Music','Музыка','Música']],
   ['bestiary',['Bestiary','Бестиарий','Bestiario']],
   ['statistics',['Statistics','Статистика','Estadísticas']],
   ['settings',['Settings','Настройки','Ajustes']],
   ['new',['New universe','Новая игра','Nuevo universo']]
  ];
  for(const [name,labels] of shortcuts){
   const source=name==='new'?q(root,'.hub-new-world'):q(root,'[data-page="'+name+'"].hub-progress-tile, [data-page="'+name+'"].hub-extra-tile');
   if(!source)continue;
   const item=document.createElement('button');
   item.type='button';item.className='hub-story-shortcut';
   item.dataset.shortcut=name;
   const iconSource=q(source,'span:first-child');
   const svg=iconSource?.querySelector('svg');
   const iconMarkup=svg?.outerHTML||'<span class="hub-fallback-icon">✦</span>';
   item.innerHTML='<span class="hub-story-shortcut-icon" aria-hidden="true">'+iconMarkup+'</span>'+
    '<span class="hub-story-shortcut-label">'+esc(t(labels))+'</span>';
   item.setAttribute('aria-label',t(labels));
   item.onclick=()=>source.click();
   nav.append(item);
  }
  const dots=q(overlay,'.hub-mode-dots');
  modeStories.forEach((entry,i)=>{
   const dot=document.createElement('button');dot.type='button';
   dot.setAttribute('aria-label',t(entry.title));
   dot.onclick=()=>setMode(i);dots.append(dot);
  });
  // The left header button opens the utility/navigation drawer.
  q(overlay,'.hub-mode-gesture').textContent=t(['← SWIPE · WHEEL · ARROWS →','← СВАЙП · КОЛЕСО · СТРЕЛКИ →','← DESLIZA · RUEDA · FLECHAS →']);
  // Keep swipe selection permanently visible as the first scene.
  root.classList.add('hub-main-carousel');
  overlay.hidden=false;
  const requested=new URLSearchParams(location.search).get('select')||window.SpaceMenuLastSelected;
  const chosen=modeStories.findIndex(item=>item.id===requested);
  setMode(chosen>=0?chosen:0);
  overlay.querySelectorAll('.hub-mode-step').forEach(b=>b.onclick=()=>setMode(current+Number(b.dataset.dir)));
  q(overlay,'.hub-mode-story-play').onclick=()=>{
   const entry=modeStories[current];
   window.SpaceMenuSceneMode=null;
   if(entry.id==='endless'){play.click();}
   else if(window.SpaceOpenMode?.(entry.id))return;
   else if(entry.id==='worms')location.assign('cosmic-worms.html?mode=worms&v=12');
    else location.assign('cosmic-arena.html?mode='+encodeURIComponent(entry.id)+'&v=8');
  };
  overlay.addEventListener('wheel',ev=>{
   // Scrolling a section, tooltip or button must not change the game mode.
   if(ev.target.closest('button,a,nav,.hub-menu'))return;
   const now=performance.now();
   if(Math.abs(ev.deltaX)+Math.abs(ev.deltaY)<13)return;
   ev.preventDefault();
   if(now-lastWheel<340)return;
   lastWheel=now;
   const delta=Math.abs(ev.deltaX)>Math.abs(ev.deltaY)?ev.deltaX:ev.deltaY;
   setMode(current+(delta>0?1:-1));
  },{passive:false});
  overlay.addEventListener('pointerdown',e=>{
   if(e.target.closest('button,a,nav,.hub-menu'))return;
   originX=e.clientX;originY=e.clientY;dragging=true;
   overlay.classList.add('hub-dragging');
  });
  overlay.addEventListener('pointermove',e=>{
   if(!dragging)return;
   const dx=e.clientX-originX,dy=e.clientY-originY;
   if(Math.abs(dx)>Math.abs(dy)*1.05){
    overlay.style.setProperty('--hub-swipe-offset',Math.max(-90,Math.min(90,dx*.23))+'px');
   }
  },{passive:true});
  const finishSwipe=e=>{
   if(!dragging)return;
   dragging=false;
   overlay.classList.remove('hub-dragging');
   overlay.style.removeProperty('--hub-swipe-offset');
   const dx=e.clientX-originX,dy=e.clientY-originY;
   if(Math.abs(dx)>38&&Math.abs(dx)>Math.abs(dy)*1.15)setMode(current+(dx<0?1:-1));
  };
  overlay.addEventListener('pointerup',finishSwipe);
  overlay.addEventListener('pointercancel',()=>{
   dragging=false;overlay.classList.remove('hub-dragging');
   overlay.style.removeProperty('--hub-swipe-offset');
  });
  // Capturing phase prevents the game's global Escape=resumeGame shortcut
  // from interpreting Close Modes as "launch the game".
  const onKey=(e)=>{
   if(!root.isConnected||!root.classList.contains('active'))return;
   if(e.code==='ArrowLeft'||e.code==='ArrowRight'){
    if(e.target?.closest?.('input,textarea,[contenteditable]'))return;
    e.preventDefault();e.stopImmediatePropagation();
    setMode(current+(e.code==='ArrowRight'?1:-1));
   }
  };
  window.addEventListener('keydown',onKey,true);
  return ()=>{};
 }

 function reshape(root){
  if(!root||root.dataset.hubReady==='true')return;
  const main=q(root,'.menu-main'),grid=q(root,'.menu-grid'),actions=q(root,'.menu-buttons');
  const play=q(actions,'.primary.big-play'),reset=q(actions,'.quiet-btn');
  const daily=q(root,'[data-reward-page="daily"]'),roulette=q(root,'[data-reward-page="roulette"]');
  if(!main||!grid||!actions||!play||!reset||!daily||!roulette)return;
  root.dataset.hubReady='true';
  const code=q(root,'#current-language-code')?.textContent?.trim()?.toLowerCase()||'ru';
  const w=words[code]||words.ru;
  main.classList.add('hub-menu');
  const divider=q(main,'.menu-divider');divider?.remove();
  actions.classList.add('hub-actions');
  play.classList.add('hub-continue');
  reset.classList.add('hub-new-world');
  // No "Game modes" entry: this mode carousel is the start screen.
  // Remove both old arcade tiles to avoid dead or redundant navigation.
  root.querySelectorAll('.modes-menu-entry').forEach(node=>node.remove());
  const description=document.createElement('div');
  description.className='hub-reset-description';
  description.textContent=w.newSub;reset.appendChild(description);
  const footer=q(root,'.menu-foot');
  const epoch=footer?.children?.[1]?.textContent||'';
  const percent=footer?.querySelector('.mint')?.textContent||'0%';
  const fraction=footer?.querySelector('.menuprog > div')?.style.width||'0%';
  const stage=document.createElement('section');
  stage.className='hub-current';
  stage.setAttribute('aria-label',w.progress);
  stage.innerHTML='<div class="hub-current-info"><span class="hub-current-mark">✧</span>'+
   '<div class="hub-current-label"><small>'+esc(w.progress)+'</small><strong>'+esc(epoch)+'</strong></div>'+
   '<b class="hub-current-percent">'+esc(percent)+'</b></div><div class="hub-current-bar"><span></span></div>';
  stage.querySelector('.hub-current-bar span').style.width=fraction;
  actions.insertAdjacentElement('afterend',stage);
  function sectionHead(title,subtitle){
   const el=document.createElement('div');el.className='hub-section-head';
   el.innerHTML='<strong>'+esc(title)+'</strong><small>'+esc(subtitle)+'</small>';return el;
  }
  const progress=document.createElement('section');
  progress.className='hub-progress';
  progress.append(sectionHead(w.world,w.worldSub));
  const progressGrid=document.createElement('div');progressGrid.className='hub-progress-grid';
  for(const name of ['map','evolution','achievements','music']){
   const button=q(grid,'[data-page="'+name+'"]');
   if(button){button.classList.add('hub-progress-tile');progressGrid.append(button);}
  }
  progress.append(progressGrid);main.append(progress);
  const bonuses=document.createElement('section');bonuses.className='hub-bonuses';
  bonuses.append(sectionHead(w.bonus,w.bonusSub));
  const utilityRow=document.createElement('div');utilityRow.className='hub-utility-row';
  daily.classList.add('hub-reward');
  roulette.classList.add('hub-reward');
  utilityRow.append(daily,roulette);
  const extraBtn=document.createElement('button');extraBtn.type='button';
  extraBtn.className='hub-more-button';
  extraBtn.innerHTML='<span class="hub-more-symbol">•••</span><strong>'+esc(w.more)+'</strong><span class="hub-more-caret">⌄</span>';
  extraBtn.setAttribute('aria-controls','hub-more-panel');extraBtn.setAttribute('aria-expanded','false');
  const extraPanel=document.createElement('div');extraPanel.id='hub-more-panel';extraPanel.className='hub-more-panel';extraPanel.hidden=true;
  for(const name of ['bestiary','statistics','settings']){
   const button=q(grid,'[data-page="'+name+'"]');
   if(button){button.classList.add('hub-extra-tile');extraPanel.append(button);}
  }
  extraBtn.onclick=()=>{
   const show=extraPanel.hidden;
   extraPanel.hidden=!show;
   extraBtn.setAttribute('aria-expanded',String(show));
   extraBtn.classList.toggle('open',show);
   q(extraBtn,'strong').textContent=show?w.less:w.more;
  };
  utilityRow.append(extraBtn);bonuses.append(utilityRow,extraPanel);
  // Important: reward entry buttons must be physically on-screen, even at 760px
  // height, so restored menu click hitboxes remain accessible after a spin.
  main.insertBefore(bonuses,progress);
  // The quick "Arena" link was redundant with the modes selector.
  grid.remove();
  main.scrollTop=0;
  main.id='hub-sections-drawer';
  main.dataset.title=code==='en'?'SECTIONS':code==='es'?'SECCIONES':'РАЗДЕЛЫ';
  buildMainMenuModeSelector(root,play,code);
 }
 function refresh(){
  const root=document.querySelector('#modal #screen-menu');
  if(!root||root.dataset.hubReady!=='true')window.SpaceMenuSceneMode=null;
  if(root)reshape(root);
 }
 function init(){
  const modal=document.getElementById('modal');
  if(!modal)return;
  new MutationObserver(refresh).observe(modal,{childList:true,subtree:false});
  refresh();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();
