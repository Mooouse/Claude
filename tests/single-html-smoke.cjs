// Test both distributions in real Chromium:
// (1) downloadable single HTML streaming original MP3s with data: SDK config,
// (2) Playgama ZIP with untouched original MP3s and sibling Bridge JSON config.
// Runs without real ads, platform account, or external SDK network calls.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox','--disable-dev-shm-usage',
      '--use-gl=angle','--use-angle=swiftshader-webgl']
  });
  const sdkMock = [
    'window.bridge={',
    ' EVENT_NAME:{AUDIO_STATE_CHANGED:"audio",PAUSE_STATE_CHANGED:"pause",',
    '  REWARDED_STATE_CHANGED:"rewarded",INTERSTITIAL_STATE_CHANGED:"interstitial"},',
    ' initialize:async function(opts){',
    '  window.__bridgeInitOptions=opts;',
    '  const configPath=opts?.configFilePath||"./playgama-bridge-config.json";',
    '  const response=await fetch(configPath);',
    '  if(!response.ok)throw new Error("Bridge config missing: "+configPath);',
    '  window.__bridgeConfig=await response.json();',
    '  window.__bridgeConfigPath=configPath;',
    ' },',
    ' platform:{id:"playgama_sandbox",language:"en",isPaused:false,',
    '   isAudioEnabled:true,sendMessage:()=>Promise.resolve(),on:()=>{},off:()=>{}},',
    ' advertisement:{isRewardedSupported:true,isInterstitialSupported:true,',
    '   checkAdBlock:async()=>false,on:()=>{},off:()=>{},',
    '   showRewarded:async()=>{},showInterstitial:async()=>{}},',
    ' storage:{get:async(keys,parse)=>{window.__cloudGet={keys,parse};return[];},',
    '   set:async()=>{}}',
    '};'
  ].join('\n');

  try {
    for (const variant of [
      { name:'Standalone one-file HTML', url:'http://127.0.0.1:8766/',
        externalConfig:false },
      { name:'Playgama archive root HTML + sibling JSON',
        url:'http://127.0.0.1:8766/playgama/index.html',
        externalConfig:true }
    ]) {
      const errors=[];
      const page=await browser.newPage({viewport:{width:1100,height:760}});
       await page.addInitScript(()=>localStorage.setItem('infinity-space-player-v1',JSON.stringify({version:1,nickname:'QA Pilot'})));
      page.on('pageerror',err=>errors.push(err.stack||String(err)));
      await page.route('https://bridge.playgama.com/**',route=>route.fulfill({
        status:200,contentType:'application/javascript',body:sdkMock
      }));

      await page.goto(variant.url,{waitUntil:'domcontentloaded',timeout:90000});
      await page.locator('#screen-menu [data-reward-page="roulette"]')
        .waitFor({state:'visible',timeout:35000});

      const state=await page.evaluate(()=>{
        const opts=window.__bridgeInitOptions;
        const configPath=window.__bridgeConfigPath;
        const cfg=window.__bridgeConfig;
        return {
          status:window.SpacePlatform?.status,
          dedicated:window.SpacePlaygamaBuild===true,
          platformId:window.bridge?.platform?.id,
          cloudRaw:window.__cloudGet?.parse===false,
          loadedConfig:!!cfg?.advertisement?.rewarded?.preloadOnStart,
          externalConfig:configPath==='./playgama-bridge-config.json',
          isDataConfig:typeof configPath==='string'&&configPath.startsWith('data:'),
          inlineConfig:!!window.SpaceInlineBridgeConfig,
          crazyScript:!!document.querySelector('script[src*="crazygames-sdk"]'),
          tracks:window.SpaceMusicTracks?.length,
          cover:window.SpaceMusicTracks?.[0]?.cover?.startsWith('data:image/jpeg;base64,'),
          audio:window.SpaceMusicTracks?.[0]?.src?.endsWith('assets/music/track-01.mp3'),
          remoteAudio:window.SpaceMusicTracks?.[0]?.src?.startsWith('https://mooouse.github.io/Infinity-Space/assets/music/'),
          twelfthAudio:window.SpaceMusicTracks?.[11]?.src?.endsWith('assets/music/track-12.mp3'),
          hasLossyEmbeddedAudio:!!document.getElementById('inline-audio-01'),
          density:document.querySelector('[data-test="density"]')?.value,
          description:JSON.parse(document.getElementById('playgama-submission-info').textContent)
        };
      });

      assert.equal(state.status,'ready',variant.name+' SDK not ready');
      assert.equal(state.dedicated,true);
      assert.equal(state.platformId,'playgama_sandbox');
      assert.equal(state.cloudRaw,true);
      assert.equal(state.loadedConfig,true,'Bridge initialization must load real configuration');
      assert.equal(state.externalConfig,variant.externalConfig,
        variant.name+' must use correct SDK config path');
      assert.equal(state.isDataConfig,!variant.externalConfig);
      assert.equal(state.inlineConfig,!variant.externalConfig);
      assert.equal(state.crazyScript,false);
      assert.equal(state.tracks,12);
      assert.equal(state.cover,true);
      assert.equal(state.audio,true);
      assert.equal(state.remoteAudio,true,
        'Both distributions must stream the same untouched MP3s used by CrazyGames');
      assert.equal(state.twelfthAudio,true);
      assert.equal(state.hasLossyEmbeddedAudio,false,
        'Previously transcoded AAC must not be present in HTML');
      assert.ok(state.audio,'Original track-01 must retain the MP3 URL');
      assert.equal(state.density,'32');
      assert.equal(state.description.title,'Infinity Space');

      await page.locator('#screen-menu [data-reward-page="roulette"]')
        .click({timeout:12000});
      await page.waitForFunction(
        ()=>document.querySelector('#modal')?.dataset.screen==='roulette',
        null,{timeout:12000}
      );
      assert.equal(await page.locator('#rewards-tab-daily').isVisible(),true);
      await page.locator('#rewards-tab-daily').click({timeout:12000});
      await page.waitForFunction(
        ()=>document.querySelector('#modal')?.dataset.screen==='daily',
        null,{timeout:12000}
      );
      assert.equal(await page.locator('#rewards-tab-roulette').isVisible(),true);

      assert.deepEqual(errors,[],
        'JS errors in '+variant.name+': '+errors.join('\n').slice(0,1800));
      console.log('PASS:',variant.name,
        'SDK, config, original-quality remotely streamed MP3 URLs, rewards and controls');
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
