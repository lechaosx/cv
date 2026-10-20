export {};

const root = document.documentElement;
const systemTheme = matchMedia('(prefers-color-scheme: dark)');
const currentTheme = () => root.dataset.theme ?? (systemTheme.matches ? 'dark' : 'light');
const languageLink = () => [...document.querySelectorAll<HTMLAnchorElement>('[data-language]')]
  .find(link => link.getClientRects().length > 0);

function updateControls() {
  for (const link of document.querySelectorAll<HTMLAnchorElement>('[data-language]')) {
    link.href = `/${link.dataset.language}/${location.search}${location.hash}`;
  }
  const dark = currentTheme() === 'dark';
  for (const control of document.querySelectorAll<HTMLButtonElement>('.theme-control')) {
    const label = dark ? control.dataset.lightLabel! : control.dataset.darkLabel!;
    control.setAttribute('aria-label', label);
    control.title = label;
    control.querySelector('.theme-icon-sun')!.toggleAttribute('hidden', !dark);
    control.querySelector('.theme-icon-moon')!.toggleAttribute('hidden', dark);
    control.hidden = false;
  }
}

const metadata = 'title, meta[name="description"], meta[property^="og:"], meta[name^="twitter:"], link[rel="canonical"], link[rel="alternate"], script[type="application/ld+json"]';
const pages = new Map<string, Document>();
let navigation = 0;
let changingLanguage = false;
let scrollCheckpoint: ReturnType<typeof setTimeout> | undefined;
history.scrollRestoration = 'manual';

function rememberScroll() {
  clearTimeout(scrollCheckpoint);
  history.replaceState({ ...history.state, cvScroll: scrollY }, '');
}

async function changeLanguage(url: URL, push: boolean, restoredScroll = 0) {
  const request = ++navigation;
  clearTimeout(scrollCheckpoint);
  changingLanguage = true;
  try {
    let page = pages.get(url.pathname);
    if (!page) {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Language page returned ${response.status}`);
      page = new DOMParser().parseFromString(await response.text(), 'text/html');
      pages.set(url.pathname, page);
    }
    const main = page.querySelector('main');
    if (!main) throw new Error('Language page has no CV');
    await Promise.all([
      document.fonts.load('300 16px "Roboto Variable"', main.textContent!),
      document.fonts.load('700 16px "Roboto Condensed Variable"', main.textContent!),
    ]);
    if (request !== navigation) return;
    const previousLink = languageLink();
    const top = previousLink?.getBoundingClientRect().top ?? 0;
    const restoreFocus = push || document.activeElement === previousLink;
    if (push) history.pushState({}, '', url);
    document.querySelector('main')!.replaceWith(document.importNode(main, true));
    root.lang = page.documentElement.lang;
    for (const node of document.head.querySelectorAll(metadata)) node.remove();
    for (const node of page.head.querySelectorAll(metadata)) document.head.append(document.importNode(node, true));
    updateControls();
    const nextLink = languageLink();
    if (restoreFocus) nextLink?.focus({ preventScroll: true });
    if (push) window.scrollBy({ top: (nextLink?.getBoundingClientRect().top ?? top) - top, behavior: 'instant' });
    else window.scrollTo({ top: restoredScroll, behavior: 'instant' });
    rememberScroll();
    changingLanguage = false;
  } catch {
    if (request === navigation) location.assign(url);
  }
}

document.addEventListener('click', event => {
  if (!(event.target instanceof Element)) return;
  if (event.target.closest('.theme-control')) {
    root.dataset.theme = currentTheme() === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('theme', root.dataset.theme); } catch {}
    updateControls();
    return;
  }
  const link = event.target.closest<HTMLAnchorElement>('a[data-language]');
  if (!link) return;
  const url = new URL(link.href);
  if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey
    || link.target && link.target !== '_self' || link.hasAttribute('download') || url.origin !== location.origin) return;
  event.preventDefault();
  try { localStorage.setItem('lang', link.dataset.language!); } catch {}
  rememberScroll();
  void changeLanguage(url, true);
});

addEventListener('popstate', event => { void changeLanguage(new URL(location.href), false, event.state?.cvScroll); });
addEventListener('scroll', () => {
  if (changingLanguage) return;
  clearTimeout(scrollCheckpoint);
  scrollCheckpoint = setTimeout(rememberScroll, 500);
}, { passive: true });
addEventListener('hashchange', updateControls);
addEventListener('pageshow', updateControls);
systemTheme.addEventListener('change', updateControls);
updateControls();
rememberScroll();
