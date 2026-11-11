// Real-Chromium coverage for the Cosmic Worms mode and its six-mode integration.
'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
function rejectTurquoise(){
 const dir=path.resolve(__dirname,'..');
 const names=fs.readdirSync(dir).filter(n=>/\.(css|js|html)$/.test(n));
 const issues=[];
 function check(name,color){
  if(color.some(v=>v<0||v>255||!Number.isFinite(v)))return;
  const [R,G,B]=color.map(v=>v/255),max=Math.max(R,G,B),min=Math.min(R,G,B);
  const delta=max-min;
  if(delta===0)return;
  let hue=max===R?((G-B)/delta)%6:max===G?(B-R)/delta+2:(R-G)/delta+4;
  hue=(hue*60+360)%360;
  const saturation=delta/(max||1);
  // A brightly saturated blue-green shade is explicitly disallowed in the
  // user's five-color game theme; dark neutral backgrounds are unaffected.
  if(hue>=155&&hue<200&&saturation>.30&&max>.20)
   issues.push({file:name,color:color.join(','),hue:Math.round(hue)});
 }
 for(const name of names){
  const src=fs.readFileSync(path.join(dir,name),'utf8');
  for(const m of src.matchAll(/#([0-9a-fA-F]{3,8})\b/g)){
   const val=m[1],r=val.length===3||val.length===4?
    val.slice(0,3).split('').map(ch=>parseInt(ch+ch,16)):
    val.length===6||val.length===8?
    [0,2,4].map(i=>parseInt(val.slice(i,i+2),16)):null;
   if(r)check(name,r);
  }
  for(const m of src.matchAll(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/g))
   check(name,[Number(m[1]),Number(m[2]),Number(m[3])]);
 }
 assert.deepEqual(issues,[],'Turquoise is disallowed in the saturated cosmic palette');
 const palette=fs.readFileSync(path.join(dir,'cosmic-spectrum.css'),'utf8');
 for(const color of ['#ff1744','#27ff40','#ffe500','#9922ff','#2860ff'])
  assert.ok(palette.includes(color),'Missing vivid palette color '+color);
}
rejectTurquoise();
const base=process.env.INFINITI_SMOKE_URL||'http://127.0.0.1:8765';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader-webgl']});
 const failures=[],errors=[];
 try{
  for(const [width,height] of [[390,844],[1280,720],[1920,1080]]){
   const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:width===390,hasTouch:width===390});
   const page=await context.newPage();
   page.on('pageerror',err=>errors.push({width,error:String(err.stack||err).slice(0,450)}));
   await page.addInitScript(()=>{
    localStorage.setItem('infinity-space-player-v1',JSON.stringify({version:1,nickname:'Cosmic QA'}));
    localStorage.setItem('infiniti-space-language','ru');
   });
   try{
    await page.goto(base+'/cosmic-worms.html?tester=1',{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForFunction(()=>!!window.InfinityWormsQA,{timeout:12000});
    let a=await page.evaluate(()=>window.InfinityWormsQA.snapshot());
    assert.equal(a.mode,'worms');
    const saturated=await page.evaluate(()=>{
     const rgb=selector=>getComputedStyle(document.querySelector(selector)).color;
     const root=getComputedStyle(document.documentElement);
     return {
      brand:rgb('.worm-brand em'),
      length:rgb('.worm-metric:nth-child(1) strong'),
      rank:rgb('.worm-metric:nth-child(2) strong'),
      timer:rgb('.worm-metric:nth-child(3) strong'),
      blue:root.getPropertyValue('--space-blue').trim(),
      purple:root.getPropertyValue('--space-purple').trim()
     };
    });
    assert.equal(saturated.brand,'rgb(255, 229, 0)','Bright yellow accent required');
    assert.equal(saturated.length,'rgb(247, 248, 255)','Neutral HUD numbers should not create a rainbow');
    assert.equal(saturated.rank,'rgb(255, 229, 0)','Leaderboard rank should be highlighted in gold');
    assert.equal(saturated.timer,'rgb(224, 229, 248)');
    assert.equal(saturated.blue,'#2860ff');
    assert.equal(saturated.purple,'#9922ff');
    assert.equal(a.world.w,22400);assert.equal(a.world.h,22400);
    assert.equal(a.world.rx,a.world.ry,'Arena boundary must be a circle');
    assert.ok(a.worms>=50&&a.food>=27500,'Circular arena must keep rich food density and bots');
    assert.ok(a.food/(Math.PI*a.world.rx*a.world.ry)>720/(Math.PI*2630*1970),'Food density must increase, not fall with map growth');
    const clearance=await page.evaluate(()=>window.InfinityWormsQA.spawnProbe());
    assert.equal(clearance.safe,true,'No bot can appear inside an existing worm body: '+JSON.stringify(clearance));
    assert.equal((await page.evaluate(()=>window.InfinityWormsQA.skins())).length,12,'All 12 distinct skins must be selectable');
    assert.equal(a.guideOpen,true,'First launch must explain mechanics');
    assert.equal(await page.locator('#worm-guide-counter').textContent(),'01 / 03');
    await page.locator('#worm-guide-next').click();
    await page.locator('#worm-guide-next').click();
    await page.locator('#worm-guide-next').click();
    await page.waitForFunction(()=>window.InfinityWormsQA.snapshot().state==='playing');
    if(width>=1280){
     await page.locator('#worm-pause').hover();
     assert.equal(await page.locator('#worm-pause').evaluate(el=>getComputedStyle(el).borderTopColor),
      'rgb(40, 96, 255)','Blue pause button must glow blue');
     await page.locator('#worm-boost').hover();
     assert.equal(await page.locator('#worm-boost').evaluate(el=>getComputedStyle(el).borderTopColor),
      'rgb(255, 23, 68)','Red boost button must glow red, not purple');
    }
    await page.evaluate(()=>window.InfinityWormsQA.testProtection(90));
    const styles=await page.evaluate(()=>window.InfinityWormsQA.botStyles());
    for(const role of ['afk','newcomer','casual','cautious','hunter','veteran','pro','reckless']){
     assert.ok(styles[role]>=2,'Missing realistic bot behavior: '+role);
    }
    const botsBefore=await page.evaluate(()=>window.InfinityWormsQA.bots());
    await page.waitForTimeout(550);
    const botsAfter=await page.evaluate(()=>window.InfinityWormsQA.bots());
    const beforeById=new Map(botsBefore.map(b=>[b.id,b]));
    const afkBots=botsAfter.filter(b=>b.persona==='afk'&&b.alive&&beforeById.get(b.id)?.alive);
    const activeBots=botsAfter.filter(b=>b.persona==='pro'&&b.alive&&beforeById.get(b.id)?.alive);
    assert.ok(afkBots.length>=2&&activeBots.length>=2,'Need both AFK and active pro bots');
    for(const b of afkBots){
     const before=beforeById.get(b.id);
     assert.ok(Math.hypot(b.x-before.x,b.y-before.y)>5,'Idle rivals must keep gliding forward');
    }
    assert.ok(activeBots.some(b=>{
     const before=beforeById.get(b.id);
     return Math.hypot(b.x-before.x,b.y-before.y)>20;
    }),'Professional rivals should move and react even while idle rivals coast');
    assert.ok(new Set(botsAfter.filter(b=>b.alive).map(b=>Math.round(b.reaction*100))).size>=8,
     'Different rivals must have different reaction times');
    a=await page.evaluate(()=>window.InfinityWormsQA.snapshot());
    const targetAngle=a.angle+Math.PI;
    await page.evaluate(v=>window.InfinityWormsQA.setHeading(v),targetAngle);
    await page.waitForTimeout(80);
    const turning=await page.evaluate(()=>window.InfinityWormsQA.snapshot());
    const distanceToTarget=v=>Math.abs(Math.atan2(Math.sin(targetAngle-v.angle),Math.cos(targetAngle-v.angle)));
    assert.ok(distanceToTarget(turning)>2.55,'180-degree turn must follow a real curved path rather than snapping');
    assert.ok(distanceToTarget(turning)<Math.PI-.08,'Worm must start following the steering input');
    await page.waitForTimeout(470);
    const halfway=await page.evaluate(()=>window.InfinityWormsQA.snapshot());
    assert.ok(distanceToTarget(halfway)>.55 && distanceToTarget(halfway)<2.5,
     'Turn must progress smoothly through a substantial radius');
    await page.waitForTimeout(800);
    const completed=await page.evaluate(()=>window.InfinityWormsQA.snapshot());
    assert.ok(distanceToTarget(completed)<.16,'Worm must finish its turn instead of drifting endlessly');
    assert.ok(a.length>=18,'Worm begins with an actual segmented body');
    await page.evaluate(()=>window.InfinityWormsQA.giveFood(60));
    await page.waitForTimeout(160);
    const growth=await page.evaluate(()=>window.InfinityWormsQA.snapshot());
    assert.ok(growth.mass>a.mass+50&&growth.length>a.length,'Mass pickup must grow tail');
    await page.evaluate(()=>window.InfinityWormsQA.setMass(1000));
    await page.waitForTimeout(700);
    const large=await page.evaluate(()=>window.InfinityWormsQA.snapshot().zoom);
    await page.evaluate(()=>window.InfinityWormsQA.setMass(60));
    await page.waitForTimeout(700);
    const small=await page.evaluate(()=>window.InfinityWormsQA.snapshot().zoom);
    assert.ok(small>large,'Growing must zoom camera out');
    await page.keyboard.down('Space');
    await page.waitForTimeout(170);
    assert.equal(await page.evaluate(()=>window.InfinityWormsQA.snapshot().boosting),true,'Space enables boosting');
    await page.keyboard.up('Space');
    const corpse=await page.evaluate(()=>window.InfinityWormsQA.forceBotDeath());
    assert.ok(corpse&&corpse.dropped>=corpse.segments*2,'Food must drop all along a defeated worm body');
    await page.locator('#worm-pause').click();
    assert.equal(await page.locator('#worm-pause-overlay').isVisible(),true);
    assert.equal(await page.locator('#worm-exit').textContent(),'ВЫХОД В МЕНЮ');
    await page.locator('#worm-settings-open').click();
    assert.equal(await page.locator('#worm-settings').isVisible(),true);
    assert.equal(await page.locator('#worm-skin-grid button').count(),12);
    assert.equal(await page.locator('.worm-skin-preview .worm-preview-stars').count(),12);
    assert.equal(await page.locator('.worm-skin-preview .worm-preview-comet').count(),12);
    assert.equal(await page.locator('.worm-preview-comet').first().evaluate(el=>
     getComputedStyle(el).animationName.includes('worm-preview-comet')),true,
     'All cosmic skin previews must show moving comets');
    await page.locator('#worm-skin-grid [data-skin="aurora"]').click();
    assert.equal(await page.locator('#worm-skin-grid [data-skin="aurora"]').evaluate(
     el=>getComputedStyle(el).borderTopColor),
     'rgb(39, 255, 64)','Selected green skin must have matching green outline');
    if(width>=1280){
     await page.locator('#worm-settings-back').hover();
     assert.equal(await page.locator('#worm-settings-back').evaluate(el=>getComputedStyle(el).borderTopColor),
      'rgb(40, 96, 255)','Settings Back button must glow blue');
    }
    assert.equal(await page.evaluate(()=>window.InfinityWormsQA.snapshot().skin),'aurora');
    await page.locator('#worm-setting-glow').uncheck({force:true});
    await page.locator('#worm-setting-names').uncheck({force:true});
    await page.locator('#worm-setting-zoom').evaluate(el=>{el.value='120';el.dispatchEvent(new Event('input',{bubbles:true}));});
    assert.equal(await page.locator('#worm-zoom-value').textContent(),'120%');
    await page.locator('#worm-settings-back').click();
    assert.equal(await page.locator('#worm-pause-overlay').isVisible(),true,'Settings Back must return to pause');
    await page.locator('#worm-open-guide').click();
    assert.equal(await page.locator('#worm-guide').isVisible(),true);
    await page.locator('#worm-guide-skip').click();
    assert.equal(await page.locator('#worm-pause-overlay').isVisible(),true,'Guide returns to pause');
    await page.locator('#worm-resume').click();
    await page.evaluate(()=>window.InfinityWormsQA.forceDeath());
    let aftermath=await page.evaluate(()=>window.InfinityWormsQA.snapshot());
    assert.equal(aftermath.state,'death-replay','Death should enter live aftermath, not results');
    assert.equal(aftermath.resultVisible,false,'Result modal must remain hidden at impact');
    assert.ok(aftermath.deathDelay>=2.5);
    const observing=await page.evaluate(()=>window.InfinityWormsQA.bots());
    await page.waitForTimeout(800);
    aftermath=await page.evaluate(()=>window.InfinityWormsQA.snapshot());
    assert.equal(aftermath.state,'death-replay','Arena should stay visible for a few seconds');
    assert.equal(aftermath.resultVisible,false,'Death overlay cannot pop up instantly');
    const later=await page.evaluate(()=>window.InfinityWormsQA.bots());
    assert.ok(later.some(bot=>{
     const old=observing.find(x=>x.id===bot.id);
     return old&&old.alive&&bot.alive&&bot.persona!=='afk'&&
      Math.hypot(bot.x-old.x,bot.y-old.y)>12;
    }),'Rivals must continue moving and collecting food during death replay');
    await page.locator('#worm-result').waitFor({state:'visible',timeout:6000});
    assert.equal(await page.evaluate(()=>window.InfinityWormsQA.snapshot().state),'finished');
    assert.equal(await page.locator('#worm-result').evaluate(
     el=>getComputedStyle(el).animationName.includes('worm-cinematic-curtain')),true,
     'Results must fade in smoothly instead of opening abruptly');
    await page.waitForTimeout(950);
    const rec=await page.evaluate(()=>{
     const all=JSON.parse(localStorage.getItem('infinity-space-stats-v1')||'{}');
     return all.worms;
    });
    assert.ok(rec&&rec.matches===1&&rec.objects>=1,'Worms statistics must be persisted separately');
    await page.locator('#worm-restart').click();
    assert.equal(await page.evaluate(()=>window.InfinityWormsQA.snapshot().skin),'aurora','Selected skin should survive death/restart');
    await page.waitForFunction(()=>window.InfinityWormsQA.snapshot().state==='playing');
    const res=await page.evaluate(()=>{
     const canv=document.getElementById('worm-field'),r=canv.getBoundingClientRect();
     return {width:canv.width,height:canv.height,rect:[r.left,r.top,r.right,r.bottom],doc:document.documentElement.scrollWidth};
    });
    assert.ok(res.width>0&&res.height>0,'Canvas must render');
    assert.ok(res.doc<=width+2,'Document must not overflow viewport');
    await page.locator('#worm-pause').click();
    await page.locator('#worm-exit').click();
    await page.waitForURL(/index\.html\?select=worms/,{timeout:9000});
    await page.locator('#hub-mode-story').waitFor({state:'visible',timeout:20000});
    assert.equal(await page.locator('.hub-mode-dots button').count(),6);
    assert.match(await page.locator('.hub-mode-story-title').textContent(),/Космические черви/);
    await page.locator('.hub-story-shortcut[data-shortcut="statistics"]').click();
    await page.locator('.infinity-stats-panel').waitFor({state:'visible',timeout:5000});
    assert.equal(await page.locator('.infinity-stats-tabs button').count(),7);
    assert.equal(await page.locator('.infinity-stats-tabs [data-mode="worms"]').count(),1);
    await page.locator('.infinity-stats-tabs [data-mode="worms"]').click();
    assert.equal(await page.locator('.infinity-stats-tabs [data-mode="worms"]').getAttribute('aria-selected'),'true');
    console.log('PASS: circular arena, compact turn radius, animated comet/star skins, multi-hue UI, cinematic death and AI archetypes at '+width+'x'+height);
   }catch(err){failures.push({width,height,error:String(err.stack||err).slice(0,750)});}
   await context.close();
  }
  // The menu background is an AI-only live match with no visible HUD.
  const ctx=await browser.newContext({viewport:{width:960,height:540}});
  const demo=await ctx.newPage();
  demo.on('pageerror',e=>errors.push({demo:true,error:String(e.stack||e).slice(0,450)}));
  await demo.goto(base+'/cosmic-worms.html?demo=1',{waitUntil:'domcontentloaded',timeout:45000});
  await demo.waitForFunction(()=>!!window.InfinityWormsQA,{timeout:12000});
  const snap=await demo.evaluate(()=>window.InfinityWormsQA.snapshot());
  assert.ok(snap.demo&&snap.alive>0&&snap.food>200&&!snap.guideOpen);
  assert.equal(await demo.locator('#worm-hud').isVisible(),false);
  await ctx.close();
  console.log('WORMS_SMOKE_FAILURES '+JSON.stringify(failures));
  console.log('WORMS_SMOKE_ERRORS '+JSON.stringify(errors));
  assert.equal(failures.length,0,'Cosmic Worms errors: '+JSON.stringify(failures));
  assert.equal(errors.length,0,'Runtime errors: '+JSON.stringify(errors));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
