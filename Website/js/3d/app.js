/* Entry point: mounts the 3D concept house on every [data-x3d] element.
   The heavy modules load only when the element comes near the viewport. */

function webglOK() {
  if (new URLSearchParams(location.search).get('x3d') === 'fallback') return false;
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && c.getContext('webgl2'));
  } catch (e) { return false; }
}

async function fallback(el) {
  const img = el.dataset.fallback || 'assets/x3d-fallback.jpg';
  let rooms = [];
  try { rooms = (await import('./house.js')).ROOMS; } catch (e) { /* list stays empty */ }
  el.classList.add('x3d-fallback');
  el.innerHTML = `<figure class="x3d-still"><img src="${img}" alt="The DS Concept House, an original three-level home with a marble frame, teak louvres and a pergola terrace"><figcaption>Interactive 3D isn't available in this browser, so here is a still of the model.</figcaption></figure>` +
    (el.dataset.x3d === 'full' && rooms.length ? `<ul class="x3d-roomlist">${rooms.map((r) => `<li><strong>${r[1]}</strong><span>${r[5]}</span></li>`).join('')}</ul>` : '');
}

async function mount(el) {
  if (el.dataset.x3dMounted) return;
  el.dataset.x3dMounted = '1';
  if (!webglOK()) return fallback(el);
  try {
    const { createViewer } = await import('./viewer.js');
    createViewer(el, el.dataset.x3d === 'hero' ? 'hero' : 'full');
  } catch (err) {
    console.error('3D model failed to start', err);
    fallback(el);
  }
}

function init() {
  const els = document.querySelectorAll('[data-x3d]');
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { io.unobserve(en.target); mount(en.target); } });
  }, { rootMargin: '300px' });
  els.forEach((el) => io.observe(el));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
