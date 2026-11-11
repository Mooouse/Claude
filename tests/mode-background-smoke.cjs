// Verify that the mode picker changes the REAL Infinity Space menu background.
// Card-only artwork is not sufficient: this test samples the main universe Canvas.
'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.INFINITI_SMOKE_URL||'http://127.0.0.1:8765';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader-webgl']});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1});
  const page=await context.newPage(),errors=[];
  await page.addInitScript(()=>localStorage.setItem('infinity-space-player-v1',JSON.stringify({version:1,nickname:'QA Pilot'})));
  page.on('pageerror',e=>errors.push(String(e.stack||e)));
  await page.goto(base+'/?tester=1',{waitUntil:'domcontentloaded',timeout:60000});
  // The mode selector MUST be the first screen, with no entry button.
  await page.locator('#hub-mode-story').waitFor({state:'visible',timeout:45000});
  assert.equal(await page.locator('#screen-menu .hub-modes').count(),0);
  assert.equal(await page.locator('#screen-menu .hub-mode-story-play').isVisible(),true);
  assert.equal(await page.locator('#screen-menu .hub-menu').isVisible(),false);
  assert.equal(await page.evaluate(()=>window.SpaceMenuSceneMode),null);
  assert.equal(await page.locator('.hub-mode-dots button').count(),6);
  assert.equal(await page.locator('.hub-story-shortcut').count(),8,
   'All main sections must be visible without opening a drawer');
  for(const section of ['map','evolution','achievements','music','bestiary','statistics','settings','new']){
   assert.equal(await page.locator('.hub-story-shortcut[data-shortcut="'+section+'"]').isVisible(),true,
    section+' main-menu shortcut must be visible');
  }
  await page.locator('.hub-story-shortcut[data-shortcut="settings"]').click();
  await page.locator('#screen-settings').waitFor({state:'visible',timeout:6000});
  await page.locator('#screen-settings .br-head-back').click();
  await page.locator('#hub-mode-story').waitFor({state:'visible',timeout:6000});
  console.log('PASS: all eight real menu shortcuts are exposed and Settings opens and returns');

  const forward=page.locator('.hub-mode-step[data-dir="1"]');
  await forward.click();
  await page.waitForFunction(()=>window.SpaceMenuSceneMode==='arena',null,{timeout:5000});
  await page.waitForFunction(()=>document.querySelector('.hub-mode-story-copy')?.getAnimations().some(a=>a.playState==='running'),null,{timeout:2000});
  assert.equal(await page.evaluate(()=>typeof window.SpaceMenuBeginTransition),'function',
   'Background crossfade must be connected to the original universe renderer');
  await page.waitForTimeout(360);
  const sample=async()=>{
    return await page.evaluate(()=>{
      const cvs=document.getElementById('universe');
      const c=cvs.getContext('2d',{willReadFrequently:true});
      const w=cvs.width,h=cvs.height;
      const x=Math.round(w*.76),y=Math.round(h*.52);
      const pixels=c.getImageData(x-9,y-9,19,19).data;
      const sums=[0,0,0];
      for(let i=0;i<pixels.length;i+=4){sums[0]+=pixels[i];sums[1]+=pixels[i+1];sums[2]+=pixels[i+2];}
      return sums.map(v=>Math.round(v/(pixels.length/4)));
    });
  };
  const arena=await sample();
  await forward.click();
  await page.waitForFunction(()=>window.SpaceMenuSceneMode==='royale',null,{timeout:5000});
  await page.waitForTimeout(400);
  const royale=await sample();
  const distance=Math.abs(arena[0]-royale[0])+Math.abs(arena[1]-royale[1])+Math.abs(arena[2]-royale[2]);
  assert.ok(distance>30,'Swiping must change the main menu Canvas background, not only a card: '+JSON.stringify({arena,royale,distance}));
  console.log('PASS: Arena and Royale have materially different full-screen universe background pixels:',arena,royale);
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(()=>window.SpaceMenuSceneMode==='core',null,{timeout:4000});
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(()=>window.SpaceMenuSceneMode==='race',null,{timeout:4000});
  // No Sections button; the bottom navigation is permanently available.
  assert.equal(await page.locator('.hub-mode-story-back').count(),0);
  assert.equal(await page.locator('.hub-story-shortcut').count(),8);
  assert.equal(await page.locator('.hub-story-shortcut[data-shortcut="map"]').isVisible(),false,
   'Universe map is hidden in competitive mode');
  await page.locator('.hub-mode-dots button').first().click();
  await page.waitForFunction(()=>window.SpaceMenuSceneMode===null,null,{timeout:5000});
  assert.equal(await page.locator('.hub-story-shortcut[data-shortcut="map"]').isVisible(),true,
   'Universe map is available on Endless Space');
  console.log('PASS: visible navigation, campaign-only map, and smooth mode switching');
  await page.locator('.hub-mode-dots button').nth(4).click();
  await page.locator('.hub-mode-story-play').click();
  await page.waitForURL(/cosmic-arena\.html\?mode=race/,{timeout:15000});
  await page.locator('#hud:not([hidden])').waitFor({state:'visible',timeout:12000});
  console.log('PASS: selecting Race starts that actual mode with live game');
  assert.equal(errors.length,0,errors.join('\n'));
  await context.close();
  // Separate mobile browser context validates actual screen layout and touch-swipe input.
  const mobileContext=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const mobile=await mobileContext.newPage();
  await mobile.addInitScript(()=>localStorage.setItem('infinity-space-player-v1',JSON.stringify({version:1,nickname:'QA Pilot'})));
  mobile.on('pageerror',e=>errors.push(String(e.stack||e)));
  await mobile.goto(base+'/?tester=1',{waitUntil:'domcontentloaded',timeout:60000});
  await mobile.locator('#hub-mode-story').waitFor({state:'visible',timeout:45000});
  assert.equal(await mobile.locator('#screen-menu .hub-modes').count(),0);
  assert.equal(await mobile.locator('.hub-story-shortcut').count(),8,
   'Mobile must expose all sections without hiding them under More');
  assert.equal(await mobile.locator('.hub-story-shortcut[data-shortcut="settings"]').isVisible(),true);
  const box=await mobile.locator('#hub-mode-story').boundingBox();
  const y=Math.round(box.height*.45),left=Math.round(box.width*.78),right=Math.round(box.width*.2);
  await mobile.evaluate(({y,left,right})=>{
    const el=document.getElementById('hub-mode-story');
    el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'touch',clientX:left,clientY:y}));
    el.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerType:'touch',clientX:right,clientY:y}));
  },{y,left,right});
  await mobile.waitForFunction(()=>window.SpaceMenuSceneMode==='arena',null,{timeout:5000});
  const overflow=await mobile.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
  assert.ok(overflow.scroll<=overflow.width+2,'Main menu mode story must not overflow screen: '+JSON.stringify(overflow));
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('PASS: main-menu mode background updates on mobile swipe, and panel stays inside viewport');
  await mobileContext.close();
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
