// Optional enhancement: "Copy link" button in the Customize panel.
// The page works fully without this script.
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('copy-link');
  if (!btn || !navigator.clipboard) return;
  btn.hidden = false;
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(location.href.split('#')[0]);
      btn.textContent = 'Copied!';
    } catch {
      btn.textContent = 'Copy failed';
    }
    setTimeout(() => (btn.textContent = 'Copy link'), 2000);
  });
});
