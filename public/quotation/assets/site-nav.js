// The site menu on the quotation pages: the same items as every other page,
// collapsing behind a button on narrow screens, as the main site's menu does.
(() => {
  const button = document.querySelector('.nav-toggle');
  const menu = document.getElementById('site-menu');
  if (!button || !menu) return;
  const set = (open) => {
    menu.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    // SVG icons ignore the .hidden property, so set the attribute itself
    button.querySelector('.icon-open').toggleAttribute('hidden', open);
    button.querySelector('.icon-close').toggleAttribute('hidden', !open);
  };
  button.addEventListener('click', () => set(menu.hidden));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { set(false); button.focus(); } });
  addEventListener('scroll', () => { if (!menu.hidden) set(false); }, { passive: true });
  matchMedia('(min-width: 1024px)').addEventListener('change', (e) => { if (e.matches) set(false); });
})();
