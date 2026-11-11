// Responsive interaction audit for four playable modes and all in-match overlays.
'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.INFINITI_SMOKE_URL||'http://127.0.0.1:8765';
const seed=()=>{localStorage.setItem('infinity-space-player-v1',JSON.stringify({version:1,nickname:'Arena QA'}));for(const id of ['arena','royale','core','race'])localStorage.setItem('infinity-space-mode-guide-v2:'+id,'1');};
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader-webgl']});
 const reports=[],errors=[];
 try{
  for(const [width,height] of [[320,568],[390,844],[768,1024],[1366,768],[1920,1080]]){
   const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1});
   const page=await context.newPage();
   page.on('pageerror',error=>errors.push({width,err:String(error.stack||error).slice(0,360)}));
   await page.addInitScript(seed);
   for(const mode of ['arena','royale','core','race']){
    await page.goto(base+'/cosmic-arena.html?mode='+mode+'&tester=1',{waitUntil:'domcontentloaded',timeout:50000});
    await page.locator('#hud:not([hidden])').waitFor({state:'visible',timeout:14000});
    const check=async(screen)=>{
     const data=await page.evaluate(()=>{
      const ids=['result','guide','paused','hud'];
      const el=ids.map(id=>document.getElementById(id)).find(e=>{
       if(!e)return false;return getComputedStyle(e).display!=='none'&&e.getBoundingClientRect().width>0&&e.getBoundingClientRect().height>0;
      });
      const clip=e=>{
       const r=e.getBoundingClientRect();
       return r.left<-3||r.right>innerWidth+3;
      };
      const bad=[];
      if(el)for(const e of el.querySelectorAll('button,h1,h2,h3,p,span,strong,small')){
       const cs=getComputedStyle(e),r=e.getBoundingClientRect();
       if(cs.display==='none'||cs.visibility==='hidden'||r.width<8||r.height<8)continue;
       if(cs.whiteSpace==='nowrap'&&cs.textOverflow==='ellipsis')continue;
       if(e.scrollWidth-e.clientWidth>9&&!e.querySelector('svg,canvas'))bad.push({cls:String(e.className).slice(0,55),over:e.scrollWidth-e.clientWidth,text:e.textContent.slice(0,35)});
       else if(clip(e)&&r.width<innerWidth*.97)bad.push({cls:String(e.className).slice(0,55),left:r.left,right:r.right,text:e.textContent.slice(0,35)});
      }
      return {doc:document.documentElement.scrollWidth,width:innerWidth,visible:el?.id||null,bad:bad.slice(0,8)};
     });
     reports.push({width,height,mode,screen,...data});
    };
    await check('gameplay');
    await page.locator('#pause').click({timeout:9000});
    await page.locator('#paused').waitFor({state:'visible',timeout:7000});
    assert.equal(await page.locator('#paused .arena-dialog-actions button').count(),3);
    await check('pause');
    await page.locator('#guide-open').click({timeout:6000});
    await page.locator('#guide').waitFor({state:'visible',timeout:7000});
    await check('tutorial');
    await page.locator('#guide-skip').click({timeout:6000});
    await page.locator('#paused').waitFor({state:'visible',timeout:7000});
    await page.locator('#resume').click({timeout:6000});
    await page.evaluate(()=>window.InfinityArenaQA.forceFinish(true));
    await page.locator('#result').waitFor({state:'visible',timeout:7000});
    await check('results');
   }
   await context.close();
  }
  const failed=reports.filter(r=>r.doc>r.width+2||r.bad.length||!r.visible);
  console.log('ARENA_UI_REPORTS '+JSON.stringify(reports));
  console.log('ARENA_UI_FAILURES '+JSON.stringify(failed));
  console.log('ARENA_UI_ERRORS '+JSON.stringify(errors));
  assert.equal(failed.length,0,'Arena overflowing text or controls: '+JSON.stringify(failed));
  assert.equal(errors.length,0,'Arena runtime errors: '+JSON.stringify(errors));
  console.log('PASS: all 4 modes × 5 resolutions × gameplay, pause, tutorial, results without overflow or errors');
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
