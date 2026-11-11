// Real Chromium smoke test for Infinity Space's unified menu and arcade matches.
// Guards against revived legacy selection pages, broken onboarding and pause UI.
'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.INFINITI_SMOKE_URL||'http://127.0.0.1:8765';
const modes=['arena','royale','core','race'];
(async()=>{
 const browser=await chromium.launch({
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader-webgl']
 });
 const context=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
 const page=await context.newPage(),errors=[];
 await page.addInitScript(()=>localStorage.setItem('infinity-space-player-v1',JSON.stringify({version:1,nickname:'QA Pilot'})));
 page.on('pageerror',err=>errors.push(String(err.stack||err)));
 try{
  // Obsolete standalone mode gallery must never be displayed.
  await page.goto(base+'/cosmic-arena.html',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForURL(/index\.html/,{timeout:15000});
  await page.locator('#hub-mode-story').waitFor({state:'visible',timeout:20000});
  assert.equal(await page.locator('#mode-carousel-viewport').count(),0);
  assert.equal(await page.locator('.hub-mode-dots button').count(),6);
  console.log('PASS: standalone legacy mode gallery removed; home is the only selector');
  for(const mode of modes){
   await page.goto(base+'/cosmic-arena.html?mode='+mode+(mode==='arena'?'&tester=1':''),{waitUntil:'domcontentloaded',timeout:45000});
   await page.locator('#hud:not([hidden])').waitFor({state:'visible',timeout:20000});
   await page.waitForFunction(()=>Number(document.getElementById('mass')?.textContent)>0,null,{timeout:15000});
   const tutorial=page.locator('#guide');
   assert.equal(await tutorial.isVisible(),true,mode+' should show a guide on its first launch');
   assert.equal(await page.locator('#guide-step-title').isVisible(),true);
   assert.equal(await page.locator('#guide-counter').textContent(),'01 / 03');
   await page.locator('#guide-next').click();
   await page.locator('#guide-next').click();
   await page.locator('#guide-next').click();
   assert.equal(await tutorial.isVisible(),false,'Tutorial finishes after 3 concise steps');
   assert.equal(await page.locator('#arena-stage-name').textContent()==='Cosmic Dust'||
    await page.locator('#arena-stage-name').textContent()==='Космическая пыль',true,
    mode+' first form should not advance without sufficient collected mass');
   if(mode==='arena'){
    const readings=await page.evaluate(()=>{
     const qa=window.InfinityArenaQA;
     if(!qa)return null;
     const masses=[40,349,350,1049,1050,2449,2450,5099,5100];
     return masses.map(mass=>({mass,form:qa.formForMass(mass)}));
    });
    assert.ok(readings,'Tester mass/zoom diagnostic must be available');
    assert.deepEqual(readings.map(x=>x.form),[0,0,1,1,2,2,3,3,4],
     'Evolution must depend on mass thresholds alone, not elapsed time');
    await page.evaluate(()=>window.InfinityArenaQA.setMass(5100));
    await page.waitForTimeout(1100);
    const largeZoom=await page.evaluate(()=>window.InfinityArenaQA.snapshot().zoom);
    await page.evaluate(()=>window.InfinityArenaQA.setMass(40));
    await page.waitForTimeout(1100);
    const smallZoom=await page.evaluate(()=>window.InfinityArenaQA.snapshot().zoom);
    assert.ok(largeZoom<smallZoom-.25,
     'Camera should zoom out as mass increases: '+JSON.stringify({largeZoom,smallZoom}));
    console.log('PASS: form derives exclusively from mass, camera zoom follows physical growth');
   }
   const snapshot=await page.evaluate(()=>{
    const cvs=document.getElementById('arena'),c=cvs.getContext('2d');
    const w=cvs.width,h=cvs.height,arr=c.getImageData(0,0,w,h).data;
    let bright=0,dark=0,nonblack=0;
    for(let y=0;y<h;y+=17)for(let x=0;x<w;x+=17){
     const i=(y*w+x)*4,total=arr[i]+arr[i+1]+arr[i+2];
     if(total>90)bright++;if(total<50)dark++;if(total>15)nonblack++;
    }
    return {bright,dark,nonblack};
   });
   assert.ok(snapshot.bright>15&&snapshot.dark>80&&snapshot.nonblack>50,
    mode+' must render real space sprites: '+JSON.stringify(snapshot));
   await page.keyboard.press('KeyE');
   await page.keyboard.press('KeyQ');
   await page.keyboard.press('Space');
   await page.locator('#pause').click();
   await page.locator('#paused').waitFor({state:'visible'});
   assert.equal(await page.locator('#paused .arena-dialog-actions button').count(),3);
   await page.locator('#guide-open').click();
   assert.equal(await tutorial.isVisible(),true,'Help must reopen from pause');
   await page.locator('#guide-skip').click();
   assert.equal(await page.locator('#paused').isVisible(),true,'Guide returns to pause, not gameplay');
   await page.locator('#resume').click();
   assert.equal(await page.locator('#paused').isVisible(),false);
   await page.locator('#pause').click();
   await page.locator('#change2').click();
   await page.waitForURL(new RegExp('index\\.html\\?select='+mode),{timeout:15000});
   await page.locator('#hub-mode-story').waitFor({state:'visible',timeout:20000});
   await page.waitForFunction(expected=>window.SpaceMenuSceneMode===expected,mode,{timeout:6000});
   console.log('PASS: '+mode+' resources, tutorial, aligned pause and unified mode switch');
  }
  assert.equal(errors.length,0,'Runtime errors: '+errors.join('\n'));
  await context.close();
  const mobileContext=await browser.newContext({
   viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1
  });
  const mobile=await mobileContext.newPage();
  await mobile.addInitScript(()=>localStorage.setItem('infinity-space-player-v1',JSON.stringify({version:1,nickname:'QA Pilot'})));
  const mobileErrors=[];mobile.on('pageerror',err=>mobileErrors.push(String(err.stack||err)));
  await mobile.goto(base+'/cosmic-arena.html?mode=arena',{waitUntil:'domcontentloaded',timeout:45000});
  await mobile.locator('#guide').waitFor({state:'visible',timeout:18000});
  await mobile.locator('#guide-skip').click();
  await mobile.locator('#hud:not([hidden])').waitFor({state:'visible',timeout:15000});
  assert.equal(await mobile.locator('#touch-stick').isVisible(),true);
  const layout=await mobile.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
  assert.ok(layout.scroll<=layout.width+2,'No horizontal overflow on phone: '+JSON.stringify(layout));
  await mobile.locator('#pause').click();
  assert.equal(await mobile.locator('#paused .arena-dialog-actions button').count(),3);
  await mobile.locator('#resume').click();
  assert.equal(mobileErrors.length,0,mobileErrors.join('\n'));
  console.log('PASS: touch joystick and three-step guides work on mobile');
  await mobileContext.close();
 }finally{await browser.close()}
})().catch(error=>{console.error(error.stack||error);process.exitCode=1});
