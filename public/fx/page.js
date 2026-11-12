/* Loaded in <head>, before the page is drawn (see /fx/page.css).
   A page reached through a View Transition is already cross-fading, so it
   needs nothing more; any other arrival (a refresh, a first visit, a browser
   without View Transitions) gets a short fade-in instead of a hard cut. */
(function () {
  var html = document.documentElement;
  try {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  } catch (e) { return; }
  if ('onpagereveal' in window) {
    window.addEventListener('pagereveal', function (e) {
      if (!e.viewTransition) html.classList.add('page-fade');
    }, { once: true });
  } else {
    html.classList.add('page-fade');
  }
})();
