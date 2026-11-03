// Light/dark switch: a circle grows from the point that was clicked and reveals the new theme.
// Falls back to a short colour fade where the View Transitions API is missing.

let lastPointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
window.addEventListener('pointerdown', e => { lastPointer = { x: e.clientX, y: e.clientY }; }, true);

const REVEAL_MS = 560;
const FADE_MS = 450;

export function changeThemeSmoothly(update: () => void, themeWillChange: boolean, flush: (fn: () => void) => void) {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion || !themeWillChange) {
    update();
    return;
  }

  if (!document.startViewTransition) {
    root.classList.add('theme-fade');
    update();
    window.setTimeout(() => root.classList.remove('theme-fade'), FADE_MS);
    return;
  }

  const { x, y } = lastPointer;
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

  root.classList.add('theme-switching');
  const transition = document.startViewTransition(() => flush(update));
  transition.ready
    .then(() => root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: REVEAL_MS, easing: 'cubic-bezier(0.2, 0, 0, 1)', pseudoElement: '::view-transition-new(root)' }
    ))
    .catch(() => {});
  transition.finished.finally(() => root.classList.remove('theme-switching'));
}
