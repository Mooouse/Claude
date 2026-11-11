// Visual regression gate for the five-mode main menu in a real browser.
'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.INFINITI_SMOKE_URL||'http://127.0.0.1:8765';
const cases=[
 {w:320,h:568,lang:'ru'}, {w:375,h:667,lang:'ru'},
 {w:390,h:844,lang:'ru'}, {w:700,h:715,lang:'ru'},
 {w:723,h:715,lang:'ru'}, {w:768,h:1024,lang:'ru'},
 {w:1024,h:768,lang:'ru'}, {w:1366,h:768,lang:'ru'},
 {w:1920,h:1080,lang:'ru'}, {w:2560,h:1440,lang:'ru'},
 {w:723,h:715,lang:'en'}, {w:723,h:715,lang:'es'}
];
const inspect=()=>{
 const $=s=>document.querySelector(s);
 const rect=el=>{
  const r=el.getBoundingClientRect();
  return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,
   cx:r.left+r.width/2,width:r.width,height:r.height};
 };
 const title=$('.hub-mode-story-title'),footer=$('.hub-mode-story-footer'),
  nav=$('.hub-mode-nav-controls'),dock=$('.hub-story-nav'),
  button=$('.hub-mode-story-play'),subtitle=$('.hub-mode-gesture');
 const chars=[];
 const node=[...title.childNodes].find(n=>n.nodeType===Node.TEXT_NODE);
 if(node){
  const range=document.createRange();
  for(let i=0;i<node.textContent.length;i++){
   if(/\s/.test(node.textContent[i]))continue;
   range.setStart(node,i);range.setEnd(node,i+1);
   const r=range.getBoundingClientRect();
   chars.push({y:Math.round(r.top),char:node.textContent[i]});
  }
 }
 const lines=new Map();
 for(const {y,char} of chars)lines.set(y,(lines.get(y)||'')+char);
 const lineLengths=[...lines.values()].map(s=>s.length);
 const clickable=el=>{
  const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
  if(x<0||y<0||x>=innerWidth||y>=innerHeight)return false;
  const top=document.elementFromPoint(x,y);
  return top===el||el.contains(top);
 };
 const rnav=rect(nav),rdock=rect(dock),rfoot=rect(footer),rtitle=rect(title);
 return {
  viewport:[innerWidth,innerHeight],doc:document.documentElement.scrollWidth,
  mode:document.querySelector('.hub-mode-dots .current')?.getAttribute('aria-label')||'',
  title:title.textContent,lines:[...lines.values()],lineLengths,
  navDelta:Math.round(rnav.cx-innerWidth/2),
  footer:rfoot,dock:rdock,titleRect:rtitle,subtitle:rect(subtitle),
  navVisible:getComputedStyle(nav).display!=='none',
  dockVisible:getComputedStyle(dock).display!=='none',
  playSvg:!!button.querySelector('svg'),
  prevHit:clickable($('.hub-mode-step[data-dir="-1"]')),
  nextHit:clickable($('.hub-mode-step[data-dir="1"]')),
  playHit:clickable(button),
  titleScroll:title.scrollWidth-title.clientWidth
 };
};
(async()=>{
 const browser=await chromium.launch({headless:true,args:[
  '--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader',
  '--use-gl=angle','--use-angle=swiftshader-webgl']});
 const failures=[];
 try{
  for(const {w,h,lang} of cases){
   const context=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:1});
   const page=await context.newPage();
   await page.addInitScript((lang)=>{
    localStorage.setItem('infinity-space-player-v1',JSON.stringify({version:1,nickname:'UI Tester'}));
    localStorage.setItem('infiniti-space-language',lang);
   },lang);
   await page.goto(base+'/index.html?tester=1',{waitUntil:'domcontentloaded',timeout:60000});
   await page.locator('#screen-menu .hub-mode-story-play').waitFor({state:'visible',timeout:40000});
   for(let n=0;n<6;n++){
    try{
     await page.locator('.hub-mode-dots button').nth(n).click({timeout:7000});
     await page.waitForTimeout(350);
     const m=await page.evaluate(inspect),issues=[];
     if(m.doc>w+2)issues.push('horizontal-document-overflow');
     if(!m.navVisible||Math.abs(m.navDelta)>3)issues.push('carousel-not-centered');
     if(!m.dockVisible||m.dock.bottom>h+2||m.dock.top<0)issues.push('bottom-navigation-outside-viewport');
     if(m.footer.bottom>m.dock.top+2)issues.push('footer-overlaps-navigation');
     if(m.titleRect.right>w+2||m.titleRect.left<0||m.titleScroll>4)issues.push('title-overflows');
     if(m.lineLengths.length&&m.lineLengths.at(-1)===1)issues.push('title-orphan-letter');
     if(!m.playSvg)issues.push('legacy-cta-arrow');
     if(!m.prevHit||!m.nextHit||!m.playHit)issues.push('button-not-hittable');
     // A saturated button must never inherit a violet halo from another theme.
     // Verify real computed hover borders across every mode and semantic dock key.
     if(w===1920&&h===1080){
      const hue=['rgb(40, 96, 255)','rgb(255, 23, 68)','rgb(153, 34, 255)',
       'rgb(39, 255, 64)','rgb(255, 229, 0)','rgb(153, 34, 255)'][n];
      await page.locator('.hub-mode-story-play').hover();
      await page.waitForTimeout(210);
      const actual=await page.locator('.hub-mode-story-play').evaluate(el=>getComputedStyle(el).borderTopColor);
      if(actual!==hue)issues.push('play-hover-mismatched-'+actual+'-expected-'+hue);
      for(const [id,expected] of [['new','rgb(255, 23, 68)'],
       ['music','rgb(153, 34, 255)'],['map','rgb(40, 96, 255)']]){
       const el=page.locator('.hub-story-shortcut[data-shortcut="'+id+'"]');
       if(await el.count() && await el.isVisible()){
        await el.hover();
        await page.waitForTimeout(240);
        const border=await el.evaluate(node=>getComputedStyle(node).borderTopColor);
        if(border!==expected)issues.push('shortcut-'+id+'-hover-'+border);
       }
      }
     }
     if(issues.length)failures.push({w,h,lang,n,issues,layout:m});
    }catch(e){failures.push({w,h,lang,n,error:String(e).slice(0,350)});}
   }
   await context.close();
  }
  console.log('MAIN_MENU_LAYOUT_FAILURES '+JSON.stringify(failures));
  assert.equal(failures.length,0,'Main menu visual regressions');
  console.log('PASS: 12 viewport/language combinations × 6 modes; text, icon, centering, navigation and hit testing');
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
