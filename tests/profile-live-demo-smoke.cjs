// Real-browser profile / statistics / live AI demo acceptance test.
'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.INFINITI_SMOKE_URL||'http://127.0.0.1:8765';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader-webgl']});
 const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',err=>errors.push(String(err.stack||err)));
 try{
  await page.goto(base+'/index.html?tester=1',{waitUntil:'domcontentloaded',timeout:45000});
  const prompt=page.locator('.infinity-nickname-prompt');
  await prompt.waitFor({state:'visible',timeout:45000});
  assert.equal(await prompt.locator('input').count(),1,'First run requires a nickname');
  await prompt.locator('input').fill('Nova Pilot');
  await prompt.locator('button[type=submit]').click();
  await prompt.waitFor({state:'hidden',timeout:8000});
  assert.equal(await page.evaluate(()=>window.InfinityProfile?.getName()),'Nova Pilot');
  assert.equal(await page.locator('.hub-profile-name').textContent(),'Nova Pilot');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('.hub-profile-name').waitFor({state:'visible',timeout:30000});
  assert.equal(await page.locator('.infinity-nickname-prompt').count(),0,'Profile persists across visits');
  // The background is an actual same-origin instance of the arcade engine,
  // with AI actors and material, not a looping video or a decorative still.
  await page.locator('.hub-mode-step[data-dir="1"]').click();
  await page.waitForFunction(()=>window.SpaceMenuSceneMode==='arena',null,{timeout:6000});
  const active=page.locator('.hub-demo-frame.ready iframe[src*="demo=arena"]');
  await active.waitFor({state:'attached',timeout:20000});
  await page.waitForFunction(()=>{
   const f=document.querySelector('.hub-demo-frame.ready iframe[src*="demo=arena"]');
   return f?.contentWindow?.InfinityDemoQA?.snapshot()?.elapsed>.35;
  },null,{timeout:22000});
  const frame=await page.evaluate(()=>{
   const iframe=document.querySelector('.hub-demo-frame.ready iframe');
   const win=iframe.contentWindow;
   const snapshot=win.InfinityDemoQA.snapshot();
   return {...snapshot,pixels:win.document.getElementById('arena').width,
      visibleHUD:win.getComputedStyle(win.document.getElementById('hud')).display};
  });
  assert.equal(frame.mode,'arena');
  assert.ok(frame.actors>=8&&frame.food>=100&&frame.elapsed>.35,'Live bot simulation: '+JSON.stringify(frame));
  assert.equal(frame.guideOpen,false);
  assert.equal(frame.visibleHUD,'none','Background must never show gameplay controls');
  console.log('PASS: real animated AI match runs behind main-menu mode text, without guide or HUD');
  await page.locator('.hub-mode-step[data-dir="1"]').click();
  await page.waitForFunction(()=>window.SpaceMenuSceneMode==='royale',null,{timeout:6000});
  await page.waitForFunction(()=>document.querySelector('.hub-demo-frame.ready iframe[src*="demo=royale"]')?.contentWindow?.InfinityDemoQA?.snapshot()?.actors>=8,null,{timeout:22000});
  assert.equal(await page.locator('.hub-demo-frame.ready iframe[src*="demo=royale"]').count(),1);
  assert.ok(await page.locator('.hub-demo-frame').count()<=2,'No accumulation of obsolete simulations');
  // Profile remains editable directly in the header.
  await page.locator('.hub-profile-chip').click();
  await page.locator('.infinity-nickname-prompt input').fill('Comet Captain');
  await page.locator('.infinity-nickname-prompt button[type=submit]').click();
  assert.equal(await page.evaluate(()=>window.InfinityProfile.getName()),'Comet Captain');
  // End-to-end arena record: use the QA-only finish hook to avoid a long match.
  await page.goto(base+'/cosmic-arena.html?mode=arena&tester=1',{waitUntil:'domcontentloaded'});
  await page.locator('#hud:not([hidden])').waitFor({state:'visible',timeout:15000});
  if(await page.locator('#guide').isVisible())await page.locator('#guide-skip').click();
  assert.equal(await page.locator('#ranks .rank.mine').count()>0,true,'Player appears on leaderboard');
  assert.ok((await page.locator('#ranks .rank.mine').textContent()).includes('Comet Captain'),'Nickname used during matches');
  await page.waitForFunction(()=>window.InfinityArenaQA?.snapshot()?.state==='playing',null,{timeout:10000});
  await page.evaluate(()=>window.InfinityArenaQA.forceFinish(true));
  await page.locator('#result').waitFor({state:'visible',timeout:10000});
  await page.goto(base+'/index.html?tester=1',{waitUntil:'domcontentloaded'});
  await page.locator('.hub-story-shortcut[data-shortcut="statistics"]').waitFor({state:'visible',timeout:30000});
  await page.locator('.hub-story-shortcut[data-shortcut="statistics"]').click();
  await page.locator('.infinity-stats-panel').waitFor({state:'visible',timeout:15000});
  assert.equal(await page.locator('.infinity-stats-tabs button').count(),7);
  await page.locator('.infinity-stats-tabs button[data-mode="arena"]').click();
  const arenaResults=await page.locator('.infinity-stats-detail').textContent();
  assert.ok(arenaResults.includes('1'),'Arena results are persisted: '+arenaResults.slice(0,350));
  await page.locator('.infinity-stats-tabs button[data-mode="overall"]').click();
  const totalResults=await page.locator('.infinity-stats-detail').textContent();
  assert.ok(totalResults.includes('1'),'Overall totals aggregate arcade records');
  console.log('PASS: nickname, 7 mode tabs, match record and total stats survive reload');
  assert.equal(errors.length,0,errors.join('\n'));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
