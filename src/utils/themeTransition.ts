import { flushSync } from 'react-dom';

// Remember where the user last clicked so the new theme can grow out of that spot.
let lastPointer = { x: 0, y: 0, time: 0 };
if (typeof window !== 'undefined') {
  window.addEventListener(
    'pointerdown',
    event => {
      lastPointer = { x: event.clientX, y: event.clientY, time: performance.now() };
    },
    true
  );
}

const DURATION = 560;
const EASING = 'cubic-bezier(0.2, 0, 0, 1)';

/**
 * Runs a theme change as one smooth reveal instead of letting elements flip at different moments.
 * `update` must apply the new theme (toggle the "dark" class and set React state).
 */
export function changeThemeSmoothly(update: () => void, themeWillChange: boolean) {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const start = (document as Document & {
    startViewTransition?: (callback: () => void) => { ready: Promise<void>; finished: Promise<void> };
  }).startViewTransition;

  if (!themeWillChange || reduceMotion) {
    update();
    return;
  }

  // Browsers without View Transitions: fade the colours of everything together.
  if (!start) {
    root.classList.add('theme-fade');
    update();
    window.setTimeout(() => root.classList.remove('theme-fade'), 450);
    return;
  }

  const recent = performance.now() - lastPointer.time < 2000;
  const x = recent ? lastPointer.x : window.innerWidth / 2;
  const y = recent ? lastPointer.y : window.innerHeight / 2;
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

  // Per-element colour transitions would fight the reveal, so pause them while it runs.
  root.classList.add('theme-switching');
  const transition = start.call(document, () => {
    flushSync(update);
  });

  transition.ready
    .then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: DURATION, easing: EASING, pseudoElement: '::view-transition-new(root)' }
      );
    })
    .catch(() => {
      /* transition was skipped; nothing to animate */
    });

  transition.finished.finally(() => root.classList.remove('theme-switching'));
}
