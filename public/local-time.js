// Optional enhancement: show times in the viewer's own time zone and keep
// story ages ("3h") current while the tab stays open.
// Without this script the page shows UTC clock times and ages as of render.
(() => {
  const clock = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
  const full = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'long' });

  // Must match relativeAge() in src/lib/time.ts.
  const age = (t) => {
    const mins = Math.max(0, Math.floor((Date.now() - t) / 60000));
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    return hrs < 48 ? `${hrs}h` : `${Math.floor(hrs / 24)}d`;
  };

  const each = (sel, fn) =>
    document.querySelectorAll(sel).forEach((el) => {
      const t = Date.parse(el.getAttribute('datetime'));
      if (!Number.isNaN(t)) fn(el, t);
    });

  const tick = () => each('time[data-age]', (el, t) => (el.textContent = age(t)));

  document.addEventListener('DOMContentLoaded', () => {
    each('time[data-clock]', (el, t) => {
      el.textContent = clock.format(t);
      el.title = `${el.title ? `${el.title}: ` : ''}${full.format(t)}`;
    });
    tick();
    setInterval(tick, 60000);
    // Timers are throttled in background tabs; catch up when the tab returns.
    document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && tick());
  });
})();
