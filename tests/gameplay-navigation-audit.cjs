// Enter from the endless campaign, open each HUD section and unwind Back.
'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.INFINITI_SMOKE_URL||'http://127.0.0.1:8765';
const seed=()=>{localStorage.setItem('infinity-space-player-v1',JSON.stringify({version:1,nickname:'Back Tester'}));localStorage.setItem('infiniti-space-language','ru');};
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader-webgl']});
 const issues=[],errors=[];
 try{
  for(const [width,height] of [[390,844],[1366,768],[1920,1080]]){
   const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1});
   const page=await context.newPage();page.on('pageerror',e=>errors.push({width,err:String(e.stack||e).slice(0,380)}));
   await page.addInitScript(seed);
   await page.goto(base+'/index.html?tester=1',{waitUntil:'domcontentloaded',timeout:50000});
   await page.locator('#screen-menu .hub-mode-story-play').waitFor({state:'visible',timeout:30000});
   await page.locator('#screen-menu .hub-mode-story-play').click();
   if(await page.locator('#screen-tutorial').isVisible())
    await page.locator('#screen-tutorial .br-tutorial-done').click();
   await page.waitForFunction(()=>document.getElementById('modal').classList.contains('off'),null,{timeout:20000});
   const cases=[
    ['map','#hud .v15-hud [data-page="map"]','#screen-map'],
    ['settings','#hud .v15-hud [data-page="settings"]','#screen-settings'],
    ['evolution','#hud .v15-hud [data-page="evolution"]','#screen-evolution'],
    ['music','#hud .v15-hud [data-audio-action="collection"]','#screen-music']
   ];
   for(const [name,selector,target] of cases){
    try{
     const button=page.locator(selector).first();
     if(!await button.count()){issues.push({width,name,error:'button missing'});continue;}
     const visible=await button.isVisible();
     let viaMenu=false;
     if(!visible&&name==='settings'){
      // The compact phone HUD deliberately consolidates Settings under the
      // always-visible main-menu brand instead of crowding a fifth top button.
      viaMenu=true;
      await page.locator('#hud .v15-hud .brand-icon[data-page="menu"]').click();
      await page.locator('#screen-menu .hub-mode-story-play').waitFor({state:'visible',timeout:9000});
      await page.locator('#screen-menu .hub-story-shortcut[data-shortcut="settings"]').click();
     }else if(!visible&&name==='evolution'){
      // On mobile the entire progress panel is the touch shortcut.
      await page.locator('#hud .v15-hud .evo-status').click();
     }else{
      if(!visible)issues.push({width,name,error:'no visible navigation target'});
      await button.click({timeout:7000});
     }
     await page.locator(target).waitFor({state:'visible',timeout:11000});
     const screen=await page.evaluate(()=>document.getElementById('modal').dataset.screen);
     if(screen!==name)issues.push({width,name,error:'incorrect-screen',screen});
     const back=page.locator(target+' .back,'+target+' .br-head-back').first();
     await back.click({timeout:6500});
     if(viaMenu){
      await page.locator('#screen-menu .hub-mode-story-play').waitFor({state:'visible',timeout:11000});
      await page.locator('#screen-menu .hub-mode-story-play').click({timeout:7000});
     }
     await page.waitForFunction(()=>document.getElementById('modal').classList.contains('off'),null,{timeout:10000});
     const after=await page.evaluate(()=>({screen:document.getElementById('modal').dataset.screen,game:!document.getElementById('hud').hidden}));
     if(after.screen!=='play'||!after.game)issues.push({width,name,error:'Back did not restore game',after});
    }catch(e){issues.push({width,name,error:String(e).slice(0,400)});await page.goto(base+'/index.html?tester=1',{waitUntil:'domcontentloaded',timeout:45000});break;}
   }
   // Test nested navigation from the HUD: map -> settings -> map -> gameplay.
   try{
    await page.locator('#hud .v15-hud [data-page="map"]').first().evaluate(e=>e.click());
    await page.locator('#screen-map').waitFor({state:'visible',timeout:11000});
    await page.locator('#screen-map .header-right [data-page="settings"]').click({timeout:6000});
    await page.locator('#screen-settings').waitFor({state:'visible',timeout:11000});
    await page.locator('#screen-settings .br-head-back').click({timeout:6000});
    await page.locator('#screen-map').waitFor({state:'visible',timeout:11000});
    await page.locator('#screen-map .back').click({timeout:6000});
    await page.waitForFunction(()=>document.getElementById('modal').classList.contains('off'),null,{timeout:10000});
   }catch(e){issues.push({width,chain:'map-settings-map-play',error:String(e).slice(0,350)})}
   await context.close();
  }
  console.log('GAMEPLAY_NAV_ISSUES '+JSON.stringify(issues));
  console.log('GAMEPLAY_NAV_ERRORS '+JSON.stringify(errors));
  assert.equal(issues.length,0,'HUD navigation regressions: '+JSON.stringify(issues));
  assert.equal(errors.length,0,'Runtime errors: '+JSON.stringify(errors));
  console.log('PASS: HUD map/settings/evolution/music and nested Back chains return to gameplay on 3 screen sizes');
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
