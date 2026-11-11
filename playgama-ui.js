/* Playgama-specific ad-button guidance and natural-break advertising. */
(() => {
  'use strict';
  const platform = window.SpacePlatform;
  if (!platform?.isPlaygama) return;

  const translate = (en, ru, es) => {
    const lang = window.SpaceI18n?.language || 'en';
    return ({en, ru, es})[lang] || en;
  };
  const blockText = () => translate(
    '⚠ AdBlock detected! Disable it and refresh the page',
    '⚠ Обнаружен AdBlock! Отключите блокировщик и обновите страницу',
    '⚠ ¡AdBlock detectado! Desactívalo y recarga la página'
  );
  const unsupportedText = () => translate(
    'Ads are temporarily unavailable. Please try again later.',
    'Реклама временно недоступна. Попробуйте позже.',
    'Los anuncios no están disponibles por ahora. Inténtalo más tarde.'
  );
  const explanation = () => translate(
    'Disable the ad blocker for this site, then refresh the page to watch ads and earn rewards.',
    'Отключите блокировщик рекламы для этого сайта и обновите страницу. После этого можно будет смотреть рекламу и получать награды.',
    'Desactiva el bloqueador para este sitio y recarga la página para ver anuncios y conseguir recompensas.'
  );

  function updateButtons() {
    const blocked = !!platform.adBlockDetected;
    for (const id of ['daily-ad-spin', 'revive-ad']) {
      const button = document.getElementById(id);
      if (!button || button.hidden) continue;
      if (blocked) {
        button.classList.add('space-adblocked');
        button.title = explanation();
        if (button.getAttribute('aria-disabled') !== 'true' && !platform.adBusy) {
          if (button.disabled) button.disabled = false;
          const caption = blockText();
          if (button.textContent !== caption) button.textContent = caption;
        }
      } else {
        button.classList.remove('space-adblocked');
      }
    }
  }

  function showFeedback(message) {
    const target = document.querySelector('#daily-result, #revive-feedback');
    // Prefer the feedback node in the currently visible overlay.
    const modal = document.getElementById('modal');
    const local = modal?.querySelector('#daily-result, #revive-feedback') || target;
    if (local) {
      local.hidden = false;
      local.textContent = message;
    }
  }

  // Run after both SDK status changes and dynamic menu re-renders.
  const observer = new MutationObserver(updateButtons);
  observer.observe(document.getElementById('modal') || document.body, {
    childList: true, subtree: true
  });
  addEventListener('space-platform-ads', updateButtons);
  updateButtons();

  document.addEventListener('click', event => {
    const button = event.target.closest?.('#daily-ad-spin, #revive-ad');
    if (button) {
      if (platform.adBlockDetected) {
        event.preventDefault();
        event.stopImmediatePropagation();
        showFeedback(explanation());
      } else if (platform.status === 'ready' && !platform.adsAvailable && !platform.adBusy) {
        event.preventDefault();
        event.stopImmediatePropagation();
        showFeedback(unsupportedText());
      }
      return;
    }
    // Interstitials only on explicit user-initiated pauses, never on tab blur
    // and never during live gameplay.
    const pause = event.target.closest?.('#btn-menu, #btn-pause');
    if (pause && platform.gamePlaying) {
      queueMicrotask(() => {
        if (!platform.gamePlaying) void platform.requestAd('midgame');
      });
    }
  }, true);
})();
