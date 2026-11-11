// Verify playable blob-backed competitive modes in the ONE-HTML Playgama build.
// A relative cosmic-arena.html or cosmic-worms.html would 404 in that archive.
'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader-webgl']});
 const errors=[];
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  await page.addInitScript(()=>{
   localStorage.setItem('infinity-space-player-v1',JSON.stringify({version:1,nickname:'One File QA'}));
   localStorage.setItem('infiniti-space-language','en');
  });
  page.on('pageerror',e=>errors.push(String(e.stack||e).slice(0,500)));
  await page.route('https://bridge.playgama.com/**',route=>route.fulfill({
   contentType:'application/javascript',
   body:'window.bridge={initialize:async()=>{},platform:{id:"playgama_sandbox",isPaused:false,isAudioEnabled:true,sendMessage:async()=>{},on:()=>{},off:()=>{}},advertisement:{on:()=>{},off:()=>{},checkAdBlock:async()=>false},storage:{get:async()=>[],set:async()=>{}}};'
  }));
  await page.goto('http://127.0.0.1:8766/playgama/index.html',{waitUntil:'domcontentloaded',timeout:60000});
  await page.locator('#hub-mode-story').waitFor({state:'visible',timeout:30000});
  assert.equal(await page.locator('.hub-mode-dots button').count(),6);
  assert.equal(await page.evaluate(()=>typeof window.SpaceOpenMode),'function','Embedded routing must be present in single HTML');
  await page.locator('.hub-mode-dots button').nth(5).click();
  await page.locator('.hub-mode-story-play').click();
  await page.waitForURL(/blob:.*#mode=worms/,{timeout:15000});
  await page.locator('#worm-field').waitFor({state:'visible',timeout:11000});
  const guide=page.locator('#worm-guide');
  if(await guide.isVisible())await page.locator('#worm-guide-skip').click();
  await page.waitForFunction(()=>document.getElementById('worm-hud')&&document.getElementById('worm-length').textContent!=='0',null,{timeout:15000});
  await page.locator('#worm-pause').click();
  await page.locator('#worm-exit').click();
  await page.waitForURL(/playgama\/index\.html\?select=worms/,{timeout:15000});
  await page.locator('#hub-mode-story').waitFor({state:'visible',timeout:20000});
  assert.match(await page.locator('.hub-mode-story-title').textContent(),/Cosmic Worms/);
  // Existing four modes must also launch without missing local HTML files.
  await page.locator('.hub-mode-dots button').nth(1).click();
  await page.locator('.hub-mode-story-play').click();
  await page.waitForURL(/blob:.*#mode=arena/,{timeout:15000});
  await page.locator('#hud:not([hidden])').waitFor({state:'visible',timeout:16000});
  if(await page.locator('#guide').isVisible())await page.locator('#guide-skip').click();
  await page.locator('#pause').click();
  await page.locator('#change2').click();
  await page.waitForURL(/playgama\/index\.html\?select=arena/,{timeout:15000});
  assert.deepEqual(errors,[],'Embedded game script errors '+JSON.stringify(errors));
  console.log('PASS: single-file Playgama HTML launches Cosmic Worms and Arena from embedded blobs, then returns to mode selector');
 }finally{await browser.close();}
})().catch(err=>{console.error(err.stack||err);process.exitCode=1;});
