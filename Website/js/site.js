/* ================================================================
   D.S. Design Sense LLP - site behaviour (v4)
   Vanilla JavaScript + GSAP/ScrollTrigger (animation) + Lenis
   (smooth scrolling). Every feature is its own small function and
   checks that its markup exists before doing anything.
   ================================================================ */

const SITE = {
  email: "info@designsense.co.in",
  phone: "+91 129 419 9722",
  formspreeId: ""                // optional: paste a Formspree form ID to receive briefs without the email app
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches || /[?&]static\b/.test(location.search);
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const hasGSAP = typeof window.gsap !== "undefined";
document.documentElement.classList.add("js");

let lenis = null;

document.addEventListener("DOMContentLoaded", () => {
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);
  setupSmoothScroll();
  setupPageTransitions();
  setupMasthead();
  setupMenu();
  setupCursor();
  setupMagnetic();
  setupFooter();

  setupPreloader().then(() => {
    revealOnScroll();
    setupHero();
    setupMast();
    setupStatement();
    setupMarquee();
    setupProcess();
    setupServiceIndex();
    setupHorizontal();
    setupCounters();
    setupParallax();
    setupChapters();
    setupTimeline();
    setupDisciplines();
    setupTilt();
  });

  // Interactive tools work immediately, even before the intro finishes
  setupPlanExplorers();
  setupElevation();
  setupCompare();
  setupAnatomy();
  setupMaterials();
  setupGallery();
  setupFilters();
  setupMandala();
  setupBuilder();
});

/* ---------------- Smooth scrolling ---------------- */
function setupSmoothScroll() {
  if (reduceMotion || typeof window.Lenis === "undefined") return;
  lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  if (hasGSAP) {
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  // In-page anchor links scroll smoothly too
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -80 });
    });
  });
}

/* ---------------- Preloader (home page, once per visit) ---------------- */
function setupPreloader() {
  const loader = document.querySelector(".loader");
  if (!loader) return Promise.resolve();

  let seen = false;
  try { seen = sessionStorage.getItem("ds-intro") === "1"; } catch (e) { /* storage blocked */ }
  if (seen || reduceMotion || !hasGSAP) {
    loader.remove();
    return Promise.resolve();
  }
  try { sessionStorage.setItem("ds-intro", "1"); } catch (e) { /* ignore */ }
  if (lenis) lenis.stop();

  return new Promise((resolve) => {
    const count = loader.querySelector(".loader-count b");
    const counter = { v: 0 };
    const tl = gsap.timeline({
      onComplete: () => {
        loader.remove();
        if (lenis) lenis.start();
        resolve();
      }
    });
    tl.to(".loader-logo", { clipPath: "inset(0 0% 0 0)", duration: 1.5, ease: "power2.inOut" }, 0)
      .to(".loader-bar i", { scaleX: 1, duration: 1.6, ease: "power2.inOut" }, 0)
      .to(counter, { v: 100, duration: 1.6, ease: "power2.inOut", onUpdate: () => { count.textContent = String(Math.round(counter.v)).padStart(3, "0"); } }, 0)
      .to(".loader-inner", { y: -30, opacity: 0, duration: 0.55, ease: "power3.in" }, 1.8)
      .to(loader, { clipPath: "inset(0 0 100% 0)", duration: 0.9, ease: "expo.inOut" }, 2.05);
  });
}

/* ---------------- Page transitions ---------------- */
function setupPageTransitions() {
  const wipe = document.querySelector(".wipe");
  if (!wipe || reduceMotion || !hasGSAP) return;
  const bars = wipe.querySelectorAll("i");

  // Arriving: bars drop away
  let arriving = false;
  try { arriving = sessionStorage.getItem("ds-wipe") === "1"; sessionStorage.removeItem("ds-wipe"); } catch (e) { /* storage blocked */ }
  if (arriving) {
    gsap.set(bars, { scaleY: 1, transformOrigin: "bottom" });
    gsap.to(bars, { scaleY: 0, duration: 0.7, ease: "expo.inOut", stagger: 0.05, delay: 0.05 });
  }

  // Leaving: bars rise, then navigate
  document.querySelectorAll("a[href]").forEach((a) => {
    const url = new URL(a.href, location.href);
    const internal = url.origin === location.origin && /\.html$|\/$/.test(url.pathname) && !a.hasAttribute("download") && a.target !== "_blank";
    if (!internal || (url.pathname === location.pathname && url.hash)) return;
    a.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      try { sessionStorage.setItem("ds-wipe", "1"); } catch (err) { /* ignore */ }
      gsap.set(bars, { transformOrigin: "top" });
      gsap.fromTo(bars, { scaleY: 0, transformOrigin: "bottom" }, {
        scaleY: 1, duration: 0.6, ease: "expo.inOut", stagger: 0.05,
        onComplete: () => { location.href = a.href; }
      });
    });
  });
  // Back/forward cache: make sure the wipe isn't stuck covering the page
  window.addEventListener("pageshow", (e) => { if (e.persisted) gsap.set(bars, { scaleY: 0 }); });
}

/* ---------------- Masthead + compact bar ---------------- */
function setupMasthead() {
  const mast = document.querySelector(".masthead");
  const bar = document.querySelector(".minibar");
  const page = document.body.dataset.page;
  document.querySelectorAll(`[data-nav="${page}"]`).forEach((a) => a.setAttribute("aria-current", "page"));
  if (!mast || !bar) return;
  const update = () => {
    const past = mast.getBoundingClientRect().bottom < -40;
    bar.classList.toggle("is-on", past);
  };
  update();
  window.addEventListener("scroll", update, { passive: true });
}

/* ---------------- Full-screen menu ---------------- */
function setupMenu() {
  const menu = document.querySelector(".menu");
  if (!menu) return;
  const openers = document.querySelectorAll("[data-menu-open]");
  const closer = menu.querySelector(".menu-close");
  let last = null;
  const open = () => {
    last = document.activeElement;
    menu.classList.add("is-open");
    menu.setAttribute("aria-hidden", "false");
    openers.forEach((b) => b.setAttribute("aria-expanded", "true"));
    if (lenis) lenis.stop();
    closer.focus();
  };
  const close = () => {
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    openers.forEach((b) => b.setAttribute("aria-expanded", "false"));
    if (lenis) lenis.start();
    if (last) last.focus();
  };
  openers.forEach((b) => b.addEventListener("click", open));
  closer.addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && menu.classList.contains("is-open")) close(); });
}

/* ---------------- Drafting-crosshair cursor ---------------- */
function setupCursor() {
  const cursor = document.querySelector(".cursor");
  if (!cursor || !finePointer) { if (cursor) cursor.remove(); return; }
  document.documentElement.classList.add("has-cursor");
  const label = cursor.querySelector(".cursor-label");
  const coords = cursor.querySelector(".cursor-coords");
  // One element moves on the GPU straight from the pointer event: frame, crosshair and readout stay locked together
  let x = 0, y = 0, queued = false;
  const paint = () => {
    queued = false;
    coords.textContent = `${String(Math.round(x)).padStart(4, "0")} · ${String(Math.round(y + scrollY)).padStart(4, "0")}`;
  };
  window.addEventListener("pointermove", (e) => {
    x = e.clientX; y = e.clientY;
    cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    if (!queued) { queued = true; requestAnimationFrame(paint); }
    if (!cursor.classList.contains("is-live")) cursor.classList.add("is-live");
  }, { passive: true });

  document.addEventListener("pointerover", (e) => {
    const t = e.target.closest("a, button, [data-cursor], input[type=range], label");
    const named = e.target.closest("[data-cursor]");
    cursor.classList.toggle("is-link", !!t);
    cursor.classList.toggle("has-label", !!named);
    label.textContent = named ? named.dataset.cursor : "";
    cursor.classList.toggle("on-dark", !!e.target.closest(".night, .cta-big, .menu, .lightbox, .hero3d"));
  });
  document.addEventListener("pointerleave", () => cursor.style.opacity = "0");
  document.addEventListener("pointerenter", () => cursor.style.opacity = "");
}

/* ---------------- Magnetic buttons ---------------- */
function setupMagnetic() {
  if (!finePointer || reduceMotion) return;
  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    const strength = Number(el.dataset.magnetic) || 0.35;
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
    });
    el.addEventListener("pointerleave", () => {
      el.style.transition = "transform .6s cubic-bezier(.22,1,.36,1)";
      el.style.transform = "";
      setTimeout(() => (el.style.transition = ""), 600);
    });
  });
}

/* ---------------- Home hero: scrolling "builds" the house ---------------- */
function setupHero() {
  const hero = document.querySelector(".hero3d");
  if (!hero || !hasGSAP || reduceMotion) return;
  splitLines(hero.querySelector("h1"));
  gsap.from(hero.querySelectorAll("h1 .split-line > span"), { yPercent: 110, duration: 1.2, ease: "expo.out", stagger: 0.08, delay: 0.15 });
  gsap.from(hero.querySelectorAll(".label, .lead, .hero-ctas, .hero3d-meta"), { y: 24, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.08, delay: 0.4 });
}

/* The banner sketch pauses when it is off screen (saves battery) */
function setupMast() {
  const svg = document.querySelector(".mast-drawing");
  if (!svg || !("IntersectionObserver" in window)) return;
  new IntersectionObserver(([en]) => svg.classList.toggle("paused", !en.isIntersecting)).observe(svg);
}

/* Split a heading into lines (keeps inline elements like <span class="script">) */
function splitLines(el) {
  if (!el || el.dataset.split === "done") return;
  const html = el.innerHTML.split(/<br\s*\/?>/i);
  el.innerHTML = html.map((line) => `<span class="split-line"><span>${line.trim()}</span></span>`).join("");
  el.dataset.split = "done";
}

/* ---------------- Generic reveals ---------------- */
function revealOnScroll() {
  if (!hasGSAP || reduceMotion) {
    document.querySelectorAll("[data-reveal], [data-reveal-img]").forEach((el) => { el.style.opacity = 1; el.style.transform = "none"; el.style.clipPath = "none"; });
    return;
  }
  document.querySelectorAll("[data-split]").forEach((h) => {
    splitLines(h);
    gsap.from(h.querySelectorAll(".split-line > span"), {
      yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.08,
      scrollTrigger: { trigger: h, start: "top 88%" }
    });
  });
  gsap.utils.toArray("[data-reveal]").forEach((el) => {
    gsap.to(el, { opacity: 1, y: 0, duration: 1.1, ease: "power3.out", delay: Number(el.dataset.delay) || 0, scrollTrigger: { trigger: el, start: "top 90%" } });
  });
  gsap.utils.toArray("[data-reveal-img]").forEach((el) => {
    const img = el.querySelector("img");
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 85%" } });
    tl.to(el, { clipPath: "inset(0% 0 0 0)", duration: 1.3, ease: "expo.inOut" });
    if (img) tl.to(img, { scale: 1, duration: 1.6, ease: "expo.out" }, 0.1);
  });
}

/* ---------------- Statement: words fill in as you scroll ---------------- */
function setupStatement() {
  document.querySelectorAll("[data-scrub-words]").forEach((el) => {
    // Wrap every word; words inside .script keep that style
    const out = [];
    el.childNodes.forEach((node) => {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach((w) => out.push(/^\s+$/.test(w) ? w : (w ? `<span class="w">${w}</span>` : "")));
      } else {
        node.textContent.split(/(\s+)/).forEach((w) => out.push(/^\s+$/.test(w) ? w : (w ? `<span class="w script">${w}</span>` : "")));
      }
    });
    el.innerHTML = out.join("");
    const words = el.querySelectorAll(".w");
    if (!hasGSAP || reduceMotion) { words.forEach((w) => w.classList.add("on")); return; }
    ScrollTrigger.create({
      trigger: el, start: "top 80%", end: "bottom 45%", scrub: true,
      onUpdate: (self) => {
        const n = Math.round(self.progress * words.length);
        words.forEach((w, i) => w.classList.toggle("on", i < n));
      }
    });
  });
}

/* ---------------- Marquee (speeds up with scroll velocity) ---------------- */
function setupMarquee() {
  document.querySelectorAll(".marquee").forEach((m) => {
    const track = m.querySelector(".marquee-track");
    if (!track) return;
    track.appendChild(track.firstElementChild.cloneNode(true));
    if (reduceMotion) return;
    let x = 0, speed = 0.6, boost = 0, dir = -1;
    if (lenis) lenis.on("scroll", (e) => { boost = Math.min(Math.abs(e.velocity) * 0.25, 14); dir = e.direction === -1 ? 1 : -1; });
    (function loop() {
      const w = track.firstElementChild.offsetWidth;
      x += (speed + boost) * dir;
      boost *= 0.92;
      if (x <= -w) x += w;
      if (x > 0) x -= w;
      track.style.transform = `translate3d(${x}px,0,0)`;
      requestAnimationFrame(loop);
    })();
  });
}

/* ---------------- Paper to place: pinned process ---------------- */
function setupProcess() {
  // Sticky drawing beside freely scrolling steps (no pinning, so the page never "holds")
  const sec = document.querySelector(".process");
  if (!sec) return;
  const figs = [...sec.querySelectorAll(".process-visual figure")];
  const steps = [...sec.querySelectorAll(".process-steps li")];
  const list = sec.querySelector(".process-steps");
  const count = sec.querySelector(".process-count");
  const n = figs.length;
  const set = (i) => {
    steps.forEach((st, k) => st.classList.toggle("on", k === i));
    figs.forEach((f, k) => f.classList.toggle("shown", k <= i));
    if (count) count.textContent = `${String(i + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}`;
  };
  set(0);
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) set(steps.indexOf(en.target)); });
  }, { rootMargin: "-45% 0px -45% 0px" });
  steps.forEach((st) => io.observe(st));
  let ticking = false;
  const progress = () => {
    ticking = false;
    const r = list.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.5 - r.top) / r.height));
    list.style.setProperty("--p", p.toFixed(3));
  };
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(progress); } }, { passive: true });
  progress();
}

/* ---------------- Service index: floating image follows the cursor ---------------- */
function setupServiceIndex() {
  // Calm split view: pointing at (or focusing) a service wipes the framed preview to its image
  const split = document.querySelector(".svc-split");
  if (!split) return;
  const links = [...split.querySelectorAll(".svc-index a")];
  const figs = [...split.querySelectorAll(".svc-fig")];
  const num = split.querySelector(".svc-num"), cap = split.querySelector(".svc-cap-t");
  let cur = 0;
  const set = (i) => {
    if (i === cur) return;
    const prev = cur; cur = i;
    links.forEach((a, k) => a.classList.toggle("on", k === i));
    figs.forEach((f, k) => { f.classList.toggle("on", k === i); f.classList.toggle("was", k === prev); });
    num.textContent = String(i + 1).padStart(2, "0");
    cap.innerHTML = links[i].querySelector("strong").innerHTML;
  };
  links.forEach((a, k) => { a.addEventListener("pointerenter", () => set(k)); a.addEventListener("focus", () => set(k)); });
}

/* ---------------- Horizontal gallery (desktop pin) ---------------- */
function setupHorizontal() {
  const sec = document.querySelector(".hscroll");
  if (!sec || !hasGSAP || reduceMotion) return;
  const mm = gsap.matchMedia();
  mm.add("(min-width: 992px)", () => {
    const track = sec.querySelector(".hscroll-track");
    const bar = sec.querySelector(".hscroll-bar i");
    const dist = () => track.scrollWidth - innerWidth;
    const tween = gsap.to(track, {
      x: () => -dist(), ease: "none",
      scrollTrigger: {
        trigger: sec, start: "top top", end: () => "+=" + dist(), pin: true, scrub: 0.8, invalidateOnRefresh: true,
        onUpdate: (self) => { if (bar) bar.style.transform = `scaleX(${self.progress})`; }
      }
    });
    sec.querySelectorAll(".hpanel img").forEach((img) => {
      gsap.fromTo(img, { xPercent: -6 }, { xPercent: 6, ease: "none", scrollTrigger: { trigger: img.closest(".hpanel"), containerAnimation: tween, start: "left right", end: "right left", scrub: true } });
    });
  });
}

/* ---------------- Count-up figures ---------------- */
function setupCounters() {
  document.querySelectorAll("[data-count]").forEach((el) => {
    const end = Number(el.dataset.count);
    if (!hasGSAP || reduceMotion) { el.textContent = end; return; }
    const o = { v: 0 };
    gsap.to(o, { v: end, duration: 1.8, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 85%" }, onUpdate: () => { el.textContent = Math.round(o.v); } });
  });
}

/* ---------------- Image parallax ---------------- */
function setupParallax() {
  if (!hasGSAP || reduceMotion) return;
  document.querySelectorAll("[data-parallax]").forEach((img) => {
    const amt = Number(img.dataset.parallax) || 8;
    gsap.fromTo(img, { yPercent: -amt }, { yPercent: amt, ease: "none", scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
  });
}

/* ---------------- Services: sticky image follows the chapter in view ---------------- */
function setupChapters() {
  const visual = document.querySelector(".ch-visual");
  if (!visual) return;
  const imgs = visual.querySelectorAll("img");
  const no = visual.querySelector(".big-no");
  const chapters = document.querySelectorAll(".chapter");
  const set = (i) => {
    imgs.forEach((im, k) => im.classList.toggle("on", k === i));
    if (no) no.textContent = String(i + 1).padStart(2, "0");
  };
  set(0);
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) set([...chapters].indexOf(en.target)); });
  }, { rootMargin: "-45% 0px -45% 0px" });
  chapters.forEach((c) => io.observe(c));
}

/* ---------------- Process timeline line ---------------- */
function setupTimeline() {
  document.querySelectorAll(".timeline").forEach((tl) => {
    const fill = tl.querySelector(".fill");
    if (!fill || !hasGSAP || reduceMotion) { if (fill) fill.style.transform = "none"; return; }
    const vertical = matchMedia("(max-width: 767.98px)").matches;
    gsap.to(fill, { [vertical ? "scaleY" : "scaleX"]: 1, ease: "none", scrollTrigger: { trigger: tl, start: "top 80%", end: "bottom 60%", scrub: true } });
  });
}

/* ---------------- Line icons draw themselves ---------------- */
function setupDisciplines() {
  document.querySelectorAll(".disc svg").forEach((svg) => {
    const parts = svg.querySelectorAll("path, line, rect, circle, polyline");
    if (!hasGSAP || reduceMotion) return;
    parts.forEach((p) => { const l = p.getTotalLength ? p.getTotalLength() : 200; p.style.strokeDasharray = l; p.style.strokeDashoffset = l; });
    gsap.to(parts, { strokeDashoffset: 0, duration: 1.6, ease: "power2.inOut", stagger: 0.08, scrollTrigger: { trigger: svg, start: "top 85%" } });
  });
}

/* ---------------- Subtle 3D tilt on value cards ---------------- */
function setupTilt() {
  if (!finePointer || reduceMotion) return;
  document.querySelectorAll("[data-tilt]").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${(-py * 7).toFixed(2)}deg) rotateY(${(px * 9).toFixed(2)}deg) translateY(-4px)`;
    });
    card.addEventListener("pointerleave", () => { card.style.transform = ""; });
  });
}

/* ---------------- Floor-plan explorer ---------------- */
const PLAN_NOTES = {
  "Drawing room": "The formal living room, facing the front with an openable glass window.",
  "Dining area": "Beside the kitchen, with a crockery unit and a soundproof sliding window.",
  "Kitchen": "A long kitchen with a breakfast counter opening to the family lobby.",
  "Puja room": "A dedicated prayer room behind an MDF jali partition, with an L-type window.",
  "Parents' bedroom": "Ground-floor suite with its own dressing area and bathroom: no stairs needed.",
  "Guest bedroom": "Guest suite with wardrobes, a dress area and an attached bathroom.",
  "Lobby & informal sitting": "The heart of the home: family sitting around the glass-railed staircase and lift.",
  "Entrance foyer": "A welcoming arrival space beside the drawing room.",
  "Powder room": "A guest washroom with a sleek cabinet mirror, off the lobby.",
  "Lift": "A lift serves every floor, from the ground floor up to the terrace.",
  "Staircase": "Glass-railed staircase: 4'-3\" wide, with 11½\" treads.",
  "Store": "Storage next to the kitchen and service area.",
  "Dressing": "Walk-in dressing between the parents' bedroom and bathroom.",
  "Master bedroom": "The main suite, with a dress area and a large bathroom.",
  "Daughter's room": "A generous bedroom with a study table, book shelf and attached toilet.",
  "Bedroom 4": "A fourth bedroom with its own wardrobes.",
  "Kitchenette": "A compact kitchen on the bedroom floor.",
  "Lift lobby": "Lift lobby on every level, so each floor works on its own.",
  "Double-height cut-out": "An opening over the lobby below, which makes the ground floor double height.",
  "Terrace garden": "A terrace garden beside the bedrooms.",
  "Covered verandah": "A shaded verandah with a 3'-0\" parapet.",
  "Toilet": "Attached toilet with shower and vanity.",
  "Home theatre": "A dedicated home theatre on the top floor.",
  "Luxury bathroom": "A luxury bathroom with a jacuzzi and storage.",
  "Open garden": "An open-air garden on the top floor.",
  "Bedroom": "A bedroom with a study table and its own balcony.",
  "Lift & lift lobby": "The lift arrives in its own lobby on the top floor."
};
const PLAN_DIMS = {
  ground: { "Drawing room": "18'-8½\" × 13'-10\"", "Parents' bedroom": "15'-4½\" × 14'-6\"", "Guest bedroom": "12'-6\" × 16'-5\"", "Lobby & informal sitting": "16'-1½\" × 29'-6\"", "Entrance foyer": "12'-1\" × 13'-10\"", "Powder room": "4'-9\" × 6'-6\"", "Staircase": "4'-3\" wide", "Store": "4'-6\" × 6'-4½\"", "Lift": "5'-3\" × 5'-2\"", "Kitchen": "11'-7\" × 21'-5\"", "Dining area": "11'-7\" × 15'-0\"", "Puja room": "9'-0\" × 10'-10\"", "Dressing": "7'-2\" × 7'-7\"" },
  first: { "Master bedroom": "15'-0\" × 14'-6\"", "Daughter's room": "18'-9\" × 14'-3\"", "Guest bedroom": "12'-6\" × 16'-5\"", "Bedroom 4": "11'-7\" × 16'-2\"", "Kitchenette": "11'-7\" × 7'-2\"", "Lobby & informal sitting": "16'-1½\" × 29'-6\"", "Lift lobby": "6'-1\" × 5'-7\"", "Double-height cut-out": "11'-3\" × 9'-9\"", "Terrace garden": "9'-9½\" × 17'-0\"", "Covered verandah": "", "Toilet": "12'-1\" × 7'-10½\"" },
  second: { "Home theatre": "22'-6\" × 14'-6\"", "Luxury bathroom": "11'-3\" × 14'-1½\"", "Open garden": "15'-7½\" × 23'-4\"", "Bedroom": "18'-9\" × 14'-3\"", "Guest bedroom": "12'-6\" × 16'-5\"", "Lobby & informal sitting": "16'-2\" × 14'-0\"", "Lift & lift lobby": "5'-3\" × 5'-2\"", "Toilet": "12'-1\" × 7'-10½\"" }
};
const PLAN_SPOTS = {
  ground: [["Drawing room", 48.65, 77.41], ["Dining area", 26.71, 43.48], ["Kitchen", 26.53, 29.66], ["Puja room", 25.81, 79.91], ["Parents' bedroom", 64.26, 22.94], ["Guest bedroom", 72.74, 49.16], ["Lobby & informal sitting", 49.82, 54.1], ["Entrance foyer", 66.06, 83.85], ["Powder room", 82.04, 68.18], ["Lift", 75.92, 70.69], ["Staircase", 52.7, 62.52], ["Store", 40.43, 16.34], ["Dressing", 84.75, 17.57]],
  first: [["Master bedroom", 63.36, 23.27], ["Daughter's room", 49.01, 82.56], ["Guest bedroom", 72.38, 49.12], ["Bedroom 4", 22.93, 51.63], ["Kitchenette", 22.03, 32.83], ["Lobby & informal sitting", 48.38, 56.06], ["Lift lobby", 68.95, 72.58], ["Double-height cut-out", 54.6, 44.58], ["Terrace garden", 9.39, 68.11], ["Covered verandah", 28.88, 21.41], ["Toilet", 70.47, 82.73]],
  second: [["Home theatre", 72.56, 22.15], ["Luxury bathroom", 50.18, 23.12], ["Open garden", 17.92, 44.65], ["Bedroom", 48.92, 82.29], ["Guest bedroom", 72.74, 49.16], ["Lobby & informal sitting", 49.1, 59.19], ["Lift & lift lobby", 72.2, 72.37], ["Toilet", 70.47, 82.73]]
};

function setupPlanExplorers() {
  document.querySelectorAll("[data-plan]").forEach((root) => {
    const canvas = root.querySelector(".plan-canvas");
    const img = canvas.querySelector("img");
    const tip = root.querySelector(".spot-tip");
    const card = root.querySelector(".room-card");
    const list = root.querySelector(".room-list");
    const tabs = root.querySelectorAll("[data-floor]");
    const sheet = root.querySelector(".plan-sheet");
    const floorNames = { ground: "Ground floor", first: "First floor", second: "Second floor" };
    let floor = root.dataset.plan;

    function render() {
      canvas.querySelectorAll(".spot").forEach((s) => s.remove());
      if (list) list.innerHTML = "";
      PLAN_SPOTS[floor].forEach(([name, x, y], i) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "spot";
        b.style.left = x + "%"; b.style.top = y + "%";
        b.setAttribute("aria-label", name);
        b.dataset.i = i;
        canvas.appendChild(b);
        b.addEventListener("pointerenter", () => select(i, true));
        b.addEventListener("focus", () => select(i, true));
        b.addEventListener("click", () => select(i, true));
        b.addEventListener("pointerleave", () => tip && tip.classList.remove("on"));
        if (list) {
          const li = document.createElement("li");
          li.innerHTML = `<button type="button" data-i="${i}">${name}</button>`;
          li.firstChild.addEventListener("click", () => select(i, false));
          li.firstChild.addEventListener("pointerenter", () => select(i, false));
          list.appendChild(li);
        }
      });
      if (sheet) sheet.dataset.sheet = `Private Residence · ${floorNames[floor]}`;
      if (card) select(0, false);
    }

    function select(i, showTip) {
      const [name, x, y] = PLAN_SPOTS[floor][i];
      const dims = PLAN_DIMS[floor][name] || "";
      canvas.querySelectorAll(".spot").forEach((s) => s.classList.toggle("on", Number(s.dataset.i) === i));
      if (list) list.querySelectorAll("button").forEach((b) => b.classList.toggle("on", Number(b.dataset.i) === i));
      if (tip && showTip) {
        tip.innerHTML = `<strong>${name}</strong><span>${dims || floorNames[floor]}</span>`;
        placeTip(tip, x, y);
      }
      if (card) {
        card.innerHTML = `<span class="k">${floorNames[floor]} · Room ${String(i + 1).padStart(2, "0")} of ${PLAN_SPOTS[floor].length}</span>
          <h3>${name}</h3><div class="dims">${dims || "&nbsp;"}</div><p>${PLAN_NOTES[name] || ""}</p>`;
      }
    }

    tabs.forEach((t) => t.addEventListener("click", () => {
      floor = t.dataset.floor;
      tabs.forEach((x) => x.setAttribute("aria-selected", String(x === t)));
      if (hasGSAP && !reduceMotion) {
        gsap.to(canvas, { opacity: 0, y: 12, duration: 0.25, onComplete: () => {
          img.src = img.src.replace(/plan-\w+\.png/, `plan-${floor}.png`);
          img.alt = `${floorNames[floor]} plan of Private Residence`;
          render();
          gsap.to(canvas, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" });
        } });
      } else {
        img.src = img.src.replace(/plan-\w+\.png/, `plan-${floor}.png`); render();
      }
    }));
    render();
  });
}

/* Position a tooltip over a marker, flipping it so it never runs off the edge */
function placeTip(tip, x, y) {
  tip.style.left = x + "%";
  tip.style.top = y + "%";
  tip.dataset.align = x < 22 ? "left" : x > 78 ? "right" : "center";
  tip.dataset.below = y < 14 ? "1" : "0";
  tip.classList.add("on");
}

/* ---------------- Elevation material call-outs ---------------- */
function setupElevation() {
  const stage = document.querySelector(".elev-stage");
  if (!stage) return;
  const mark = stage.querySelector(".elev-mark");
  document.querySelectorAll("[data-elev]").forEach((chip) => {
    const [x, y] = chip.dataset.elev.split(",").map(Number);
    const on = () => {
      mark.style.left = x + "%"; mark.style.top = y + "%";
      mark.classList.add("on"); stage.classList.add("has-focus");
      document.querySelectorAll("[data-elev]").forEach((c) => c.classList.toggle("on", c === chip));
    };
    chip.addEventListener("pointerenter", on);
    chip.addEventListener("focus", on);
    chip.addEventListener("click", on);
  });
  stage.closest(".elev").addEventListener("pointerleave", () => { mark.classList.remove("on"); stage.classList.remove("has-focus"); });
}

/* ---------------- Drawing / render compare slider ---------------- */
function setupCompare() {
  document.querySelectorAll(".compare").forEach((c) => {
    const range = c.querySelector("input[type=range]");
    const set = (v) => c.style.setProperty("--pos", v + "%");
    range.addEventListener("input", () => set(range.value));
    set(range.value);
    // Render view switcher (front / side / corner)
    const views = document.querySelectorAll(`[data-compare-view="${c.id}"]`);
    views.forEach((btn) => btn.addEventListener("click", () => {
      c.querySelector(".top").src = btn.dataset.render;
      c.querySelector(".under").src = btn.dataset.sketch;
      views.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    }));
    // Gentle hint animation the first time it scrolls into view
    if (hasGSAP && !reduceMotion) {
      const o = { v: 50 };
      gsap.timeline({ scrollTrigger: { trigger: c, start: "top 70%" } })
        .to(o, { v: 30, duration: 0.8, ease: "power2.inOut", onUpdate: () => { set(o.v); range.value = o.v; } })
        .to(o, { v: 62, duration: 1, ease: "power2.inOut", onUpdate: () => { set(o.v); range.value = o.v; } })
        .to(o, { v: 50, duration: 0.8, ease: "power2.inOut", onUpdate: () => { set(o.v); range.value = o.v; } });
    }
  });
}

/* ---------------- Kitchen anatomy hotspots ---------------- */
function setupAnatomy() {
  const root = document.querySelector(".anatomy");
  if (!root) return;
  const canvas = root.querySelector(".plan-canvas");
  const buttons = root.querySelectorAll(".anatomy-list button");
  const tip = root.querySelector(".spot-tip");
  buttons.forEach((btn, i) => {
    const [x, y] = btn.dataset.at.split(",").map(Number);
    const spot = document.createElement("button");
    spot.type = "button"; spot.className = "spot";
    spot.style.left = x + "%"; spot.style.top = y + "%";
    spot.setAttribute("aria-label", btn.querySelector("strong").textContent);
    canvas.appendChild(spot);
    const on = () => {
      buttons.forEach((b) => b.classList.toggle("on", b === btn));
      canvas.querySelectorAll(".spot").forEach((s, k) => s.classList.toggle("on", k === i));
      tip.innerHTML = `<strong>${btn.querySelector("strong").textContent}</strong><span>${btn.querySelector(".k").textContent}</span>`;
      placeTip(tip, x, y);
    };
    btn.addEventListener("pointerenter", on); btn.addEventListener("focus", on); btn.addEventListener("click", on);
    spot.addEventListener("pointerenter", on); spot.addEventListener("click", on); spot.addEventListener("focus", on);
  });
  root.addEventListener("pointerleave", () => tip.classList.remove("on"));
}

/* ---------------- Material library ---------------- */
function setupMaterials() {
  const panel = document.querySelector(".mat-panel");
  if (!panel) return;
  const swatches = document.querySelectorAll(".swatch");
  const tex = panel.querySelector(".tex");
  const fields = { name: panel.querySelector("h3"), kind: panel.querySelector(".label"), desc: panel.querySelector(".desc"), use: panel.querySelector("[data-f=use]"), where: panel.querySelector("[data-f=where]"), care: panel.querySelector("[data-f=care]") };
  swatches.forEach((s) => s.addEventListener("click", () => {
    swatches.forEach((x) => { x.classList.toggle("on", x === s); x.setAttribute("aria-pressed", String(x === s)); });
    const d = s.dataset;
    const show = () => {
      tex.innerHTML = d.img ? `<img src="${d.img}" alt="">` : `<div class="glass"></div>`;
      fields.name.textContent = d.name; fields.kind.textContent = d.kind; fields.desc.textContent = d.desc;
      fields.use.textContent = d.use; fields.where.textContent = d.where; fields.care.textContent = d.care;
    };
    if (hasGSAP && !reduceMotion) {
      gsap.to(panel, { opacity: 0, y: 10, duration: 0.2, onComplete: () => { show(); gsap.to(panel, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }); } });
    } else show();
  }));
}

/* ---------------- Portfolio gallery: filters + lightbox ---------------- */
function setupGallery() {
  const gallery = document.querySelector(".gallery");
  if (!gallery) return;
  const items = [...gallery.querySelectorAll(".g-item")];
  const chips = document.querySelectorAll("[data-filter]");
  chips.forEach((c) => {
    const f = c.dataset.filter;
    const n = f === "all" ? items.length : items.filter((i) => i.dataset.cat.split(" ").includes(f)).length;
    c.insertAdjacentHTML("beforeend", `<span class="count">${n}</span>`);
    c.addEventListener("click", () => {
      chips.forEach((x) => x.setAttribute("aria-pressed", String(x === c)));
      items.forEach((i) => i.classList.toggle("is-hidden", !(f === "all" || i.dataset.cat.split(" ").includes(f))));
      if (hasGSAP && !reduceMotion) gsap.fromTo(items.filter((i) => !i.classList.contains("is-hidden")), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.03 });
      if (hasGSAP) ScrollTrigger.refresh();
    });
  });

  const box = document.querySelector(".lightbox");
  if (!box) return;
  const bImg = box.querySelector("img"), bTitle = box.querySelector(".lb-cap strong"), bText = box.querySelector(".lb-cap span"), bCount = box.querySelector(".lb-count");
  let list = [], cur = 0, last = null;
  const show = (i) => {
    cur = (i + list.length) % list.length;
    const it = list[cur], im = it.querySelector("img");
    bImg.src = im.src; bImg.alt = im.alt;
    bTitle.textContent = it.dataset.title; bText.textContent = it.dataset.caption;
    bCount.textContent = `${String(cur + 1).padStart(2, "0")} / ${String(list.length).padStart(2, "0")}`;
  };
  const open = (it) => {
    list = items.filter((i) => !i.classList.contains("is-hidden"));
    last = it; show(list.indexOf(it));
    box.classList.add("is-open"); if (lenis) lenis.stop(); document.body.style.overflow = "hidden";
    box.querySelector(".lb-close").focus();
  };
  const close = () => { box.classList.remove("is-open"); if (lenis) lenis.start(); document.body.style.overflow = ""; if (last) last.focus(); };
  items.forEach((it) => it.addEventListener("click", () => open(it)));
  box.querySelector(".lb-close").addEventListener("click", close);
  box.querySelector(".lb-prev").addEventListener("click", () => show(cur - 1));
  box.querySelector(".lb-next").addEventListener("click", () => show(cur + 1));
  box.addEventListener("click", (e) => { if (e.target === box) close(); });
  document.addEventListener("keydown", (e) => {
    if (!box.classList.contains("is-open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(cur - 1);
    if (e.key === "ArrowRight") show(cur + 1);
  });
  let sx = null;
  box.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
  box.addEventListener("touchend", (e) => { if (sx === null) return; const d = e.changedTouches[0].clientX - sx; if (Math.abs(d) > 50) show(cur + (d < 0 ? 1 : -1)); sx = null; });
}

/* ---------------- Contact: floor-by-floor planner + room-by-room 3D massing ---------------- */
function setupBuilder() {
  const form = document.getElementById("briefForm");
  if (!form) return;
  const ROOM = {
    master:  { label: "Master bedroom", area: 260, color: "#c9a98f", bath: 1, vaastu: "South-west" },
    bedroom: { label: "Bedroom", area: 180, color: "#dcc4ae", bath: 1 },
    guest:   { label: "Guest room", area: 170, color: "#e6d3bf", bath: 1, vaastu: "North-west" },
    living:  { label: "Living room", area: 300, color: "#b6c3c9", vaastu: "North or east" },
    drawing: { label: "Drawing room", area: 220, color: "#c9d2d5" },
    lounge:  { label: "Family lounge", area: 220, color: "#a7b8bf" },
    dining:  { label: "Dining", area: 160, color: "#d8ccb4", vaastu: "West" },
    kitchen: { label: "Kitchen", area: 140, color: "#e3b8a2", vaastu: "South-east" },
    puja:    { label: "Puja room", area: 50, color: "#e9c76f", vaastu: "North-east" },
    study:   { label: "Study", area: 110, color: "#c7c0da" },
    theatre: { label: "Home theatre", area: 260, color: "#9d7792" },
    gym:     { label: "Gym", area: 180, color: "#a9b998" },
    staff:   { label: "Staff room", area: 90, color: "#d6d1c9", bath: 1 },
    store:   { label: "Store", area: 50, color: "#cec8bf" },
    balcony: { label: "Balcony", area: 70, color: "#bcd3ab" },
    garden:  { label: "Terrace garden", area: 250, color: "#97bd80" },
    parking: { label: "Parking", area: 300, color: "#bebbb6" }
  };
  const KEYS = Object.keys(ROOM);
  const FLOOR_NAMES = ["Ground", "First", "Second", "Third", "Fourth"];
  const PRESETS = {
    family: [{ living: 1, drawing: 1, dining: 1, kitchen: 1, master: 1, puja: 1, parking: 1 }, { master: 1, bedroom: 2, lounge: 1, balcony: 1 }, { bedroom: 1, theatre: 1, garden: 1 }, { bedroom: 2, lounge: 1 }, { gym: 1, garden: 1 }],
    joint:  [{ living: 1, drawing: 1, dining: 1, kitchen: 1, master: 1, guest: 1, puja: 1, parking: 1, staff: 1 }, { master: 1, bedroom: 2, lounge: 1, kitchen: 1, balcony: 1 }, { master: 1, bedroom: 2, lounge: 1, balcony: 1 }, { bedroom: 2, study: 1, garden: 1 }, { gym: 1, garden: 1 }],
    luxury: [{ living: 1, drawing: 1, dining: 1, kitchen: 1, guest: 1, puja: 1, parking: 1, staff: 1, store: 1 }, { master: 1, bedroom: 2, lounge: 1, study: 1, balcony: 1 }, { theatre: 1, gym: 1, garden: 1, bedroom: 1 }, { bedroom: 2, lounge: 1, balcony: 1 }, { garden: 1, lounge: 1 }],
    basement: { theatre: 1, gym: 1, store: 1, parking: 1 }
  };
  const scene = form.closest(".builder").querySelector(".model-scene");
  const model = form.closest(".builder").querySelector(".model");
  const $ = (sel) => form.closest(".builder").querySelector(sel);
  const tabsEl = $(".pl-tabs"), roomsEl = $(".pl-rooms"), utilEl = $(".pl-util"), floorsEl = $(".pl-floors"), vaastuEl = $(".pl-vaastu"), hoverEl = $(".pl-hover"), legendEl = $(".pl-legend");
  const plot = form.elements.plot, plotOut = form.querySelector("[data-out=plot]"), builtOut = form.querySelector("[data-out=built]");
  const floorsOut = form.querySelector(".stepper output");
  const readout = { type: $("[data-r=type]"), plot: $("[data-r=plot]"), floors: $("[data-r=floors]"), feat: $("[data-r=feat]") };
  const hud = { plot: $("[data-hud=plot]"), built: $("[data-hud=built]"), rooms: $("[data-hud=rooms]") };
  const fmt = (n) => Math.round(n).toLocaleString("en-IN");
  const floorLabel = (n, b) => (n === 1 ? "Ground only" : `G + ${n - 1}`) + (b ? " + basement" : "");

  let nFloors = 3, basement = false, active = 0, exploded = true, rz = -42, lastKey = "";
  let plan = PRESETS.family.map((f) => ({ ...f }));            // index 0 = ground
  let basePlan = { ...PRESETS.basement };

  const pre = new URLSearchParams(location.search).get("service");
  if (pre) { const opt = form.querySelector(`input[name=type][value="${pre}"]`); if (opt) opt.checked = true; }

  // legend
  legendEl.innerHTML = KEYS.map((k) => `<span><i style="background:${ROOM[k].color}"></i>${ROOM[k].label}</span>`).join("") + `<span><i style="background:#f1eee9;outline:1px solid #bbb"></i>Stair, baths &amp; circulation</span>`;

  const floors = () => {
    const list = [];
    if (basement) list.push({ name: "Basement", rooms: basePlan, base: true });
    for (let i = 0; i < nFloors; i++) list.push({ name: FLOOR_NAMES[i], rooms: plan[i] || (plan[i] = {}) });
    return list;
  };
  const plateArea = (f) => Number(plot.value) * 9 * (f.base ? 0.8 : 0.65);
  const usedArea = (f, lift) => {
    let a = 120 + (lift ? 30 : 0);                              // stair core (+ lift)
    for (const [k, c] of Object.entries(f.rooms)) a += c * (ROOM[k].area + (ROOM[k].bath ? 50 : 0));
    return a;
  };

  /* ---- room counters for the active floor ---- */
  function renderControls() {
    const fl = floors();
    if (active >= fl.length) active = fl.length - 1;
    tabsEl.innerHTML = fl.map((f, i) => `<button type="button" role="tab" class="chip" aria-selected="${i === active}" data-tab="${i}">${f.name}</button>`).join("");
    const f = fl[active];
    roomsEl.innerHTML = KEYS.filter((k) => k !== "parking" || f.name === "Ground" || f.base).map((k) => {
      const c = f.rooms[k] || 0;
      return `<div class="pl-room${c ? " has" : ""}"><i style="background:${ROOM[k].color}"></i><span>${ROOM[k].label}<small>${ROOM[k].area} sq ft${ROOM[k].bath ? " + bath" : ""}</small></span>
        <div class="pl-step"><button type="button" data-room="${k}" data-d="-1" aria-label="Remove ${ROOM[k].label}">−</button><output>${c}</output><button type="button" data-room="${k}" data-d="1" aria-label="Add ${ROOM[k].label}">+</button></div></div>`;
    }).join("");
  }
  tabsEl.addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (!b) return; active = Number(b.dataset.tab); renderControls(); update(); });
  roomsEl.addEventListener("click", (e) => {
    const b = e.target.closest("[data-room]"); if (!b) return;
    const f = floors()[active], k = b.dataset.room;
    f.rooms[k] = Math.max(0, Math.min(6, (f.rooms[k] || 0) + Number(b.dataset.d)));
    if (!f.rooms[k]) delete f.rooms[k];
    renderControls(); update();
  });
  form.querySelectorAll("[data-preset]").forEach((b) => b.addEventListener("click", () => {
    const k = b.dataset.preset;
    if (k === "clear") { plan = plan.map(() => ({})); basePlan = {}; }
    else { plan = PRESETS[k].map((f) => ({ ...f })); basePlan = { ...PRESETS.basement }; }
    renderControls(); update();
  }));
  form.querySelectorAll(".stepper button").forEach((b) => b.addEventListener("click", () => {
    nFloors = Math.max(1, Math.min(5, nFloors + Number(b.dataset.step)));
    renderControls(); update();
  }));
  form.elements.basement.addEventListener("change", (e) => { basement = e.target.checked; active = basement ? 0 : Math.max(0, active - 1); renderControls(); update(); });
  form.addEventListener("input", (e) => { if (e.target.name === "plot" || e.target.name === "feature" || e.target.name === "type") update(); });

  /* ---- toolbar: explode / stack / spin, and drag to turn ---- */
  const tb = (k) => model.querySelector(`[data-pl="${k}"]`);
  tb("explode").addEventListener("click", () => { exploded = true; tb("explode").setAttribute("aria-pressed", "true"); tb("stack").setAttribute("aria-pressed", "false"); update(true); });
  tb("stack").addEventListener("click", () => { exploded = false; tb("stack").setAttribute("aria-pressed", "true"); tb("explode").setAttribute("aria-pressed", "false"); update(true); });
  tb("spin").addEventListener("click", () => { rz -= 90; applyView(); });
  let drag = null;
  model.addEventListener("pointerdown", (e) => { if (e.target.closest("button")) return; drag = { x: e.clientX, rz }; model.setPointerCapture(e.pointerId); model.classList.add("dragging"); });
  model.addEventListener("pointermove", (e) => { if (!drag) return; rz = drag.rz + (e.clientX - drag.x) * 0.4; applyView(); });
  const endDrag = () => { drag = null; model.classList.remove("dragging"); };
  model.addEventListener("pointerup", endDrag); model.addEventListener("pointercancel", endDrag);
  const fit = () => {
    const s = Math.max(0.3, Math.min(1.25, model.clientWidth / 520));
    scene.style.setProperty("--s", s.toFixed(3));
    model.style.perspective = Math.round(2400 * s) + "px";
  };
  function applyView() { scene.style.setProperty("--rz", rz + "deg"); }
  fit(); applyView(); window.addEventListener("resize", fit);

  /* ---- squarified-ish treemap: split the list in two by area along the longer side ---- */
  function layout(items, x, y, w, h, out) {
    if (!items.length) return;
    if (items.length === 1) { out.push({ ...items[0], x, y, w, h }); return; }
    const total = items.reduce((a, b) => a + b.area, 0);
    let acc = 0, cut = 0;
    for (; cut < items.length - 1; cut++) { if (acc + items[cut].area > total / 2) break; acc += items[cut].area; }
    if (cut === 0) { acc = items[0].area; cut = 1; }
    const A = items.slice(0, cut), B = items.slice(cut), r = acc / total;
    if (w >= h) { layout(A, x, y, w * r, h, out); layout(B, x + w * r, y, w * (1 - r), h, out); }
    else { layout(A, x, y, w, h * r, out); layout(B, x, y + h * r, w, h * (1 - r), out); }
  }

  function box(cls, x, y, w, d, h, z, color, title) {
    const el = document.createElement("div");
    el.className = "m-box " + cls;
    el.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${d}px;transform:translateZ(${z}px);--c:${color}`;
    el.innerHTML = `
      <div class="m-face top" style="width:${w}px;height:${d}px;transform:translateZ(${h}px)">${title && w > 34 && d > 22 ? `<b>${title}</b>` : ""}</div>
      <div class="m-face s1" style="width:${w}px;height:${h}px;transform-origin:top;transform:translateY(${d}px) rotateX(90deg)"></div>
      <div class="m-face s2" style="width:${d}px;height:${h}px;transform-origin:top left;transform:translateX(${w}px) translateY(${d}px) rotateZ(-90deg) rotateX(90deg)"></div>
      <div class="m-face s3" style="width:${w}px;height:${h}px;transform-origin:top;transform:rotateX(90deg)"></div>
      <div class="m-face s4" style="width:${d}px;height:${h}px;transform-origin:top left;transform:translateY(${d}px) rotateZ(-90deg) rotateX(90deg)"></div>`;
    return el;
  }

  function update() {
    const yards = Number(plot.value), sqft = yards * 9;
    const feats = [...form.querySelectorAll("input[name=feature]:checked")].map((i) => i.value);
    const lift = feats.includes("Lift");
    const typeInput = form.querySelector("input[name=type]:checked");
    const type = typeInput ? typeInput.value : "New home";
    plot.style.setProperty("--fill", ((yards - plot.min) / (plot.max - plot.min) * 100) + "%");
    plotOut.textContent = `${yards} sq yd`;
    floorsOut.textContent = floorLabel(nFloors, basement).replace(" + basement", "");
    const fl = floors();

    // per-floor numbers
    let built = 0, roomCount = 0;
    const stats = fl.map((f) => {
      const used = usedArea(f, lift), plate = plateArea(f);
      built += used; roomCount += Object.values(f.rooms).reduce((a, b) => a + b, 0);
      return { used, plate, pct: used / plate };
    });
    const st = stats[active];
    utilEl.querySelector("i").style.width = Math.min(100, st.pct * 100) + "%";
    utilEl.classList.toggle("over", st.pct > 1);
    utilEl.querySelector("span").textContent = `${fl[active].name}: ${fmt(st.used)} of ${fmt(st.plate)} sq ft floor plate (${Math.round(st.pct * 100)}%)${st.pct > 1 ? " · over the plate, we'd suggest moving a room up" : ""}`;
    builtOut.textContent = `${fmt(built)} sq ft built-up`;
    hud.plot.textContent = `${yards} sq yd`; hud.built.textContent = `${fmt(built)} sq ft`; hud.rooms.textContent = roomCount;
    floorsEl.innerHTML = fl.map((f, i) => {
      const s2 = stats[i], names = Object.entries(f.rooms).map(([k, c]) => (c > 1 ? `${c} × ` : "") + ROOM[k].label).join(", ") || "Nothing planned yet";
      return `<button type="button" class="pl-frow${i === active ? " on" : ""}${s2.pct > 1 ? " over" : ""}" data-tab="${i}"><strong>${f.name}</strong><span>${names}</span><em><i style="width:${Math.min(100, s2.pct * 100)}%"></i></em><small>${Math.round(s2.pct * 100)}%</small></button>`;
    }).join("");
    floorsEl.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => { active = Number(b.dataset.tab); renderControls(); update(); }));

    // vaastu notes for the rooms chosen
    const chosen = new Set(fl.flatMap((f) => Object.keys(f.rooms)));
    const notes = KEYS.filter((k) => chosen.has(k) && ROOM[k].vaastu).map((k) => `<span><b>${ROOM[k].label}</b>${ROOM[k].vaastu}</span>`);
    vaastuEl.innerHTML = feats.includes("Vaastu planning") && notes.length ? `<span class="mono">Vaastu placement we'd start from</span><div>${notes.join("")}</div>` : "";

    readout.type.textContent = type;
    readout.plot.textContent = `${yards} sq yd (${fmt(sqft)} sq ft)`;
    readout.floors.textContent = floorLabel(nFloors, basement);
    readout.feat.textContent = feats.length ? feats.join(", ") : "None yet";

    // 3D: one plate per floor, rooms packed onto it
    const key = JSON.stringify([yards, nFloors, basement, exploded, lift, fl.map((f) => f.rooms)]);
    if (key !== lastKey) { lastKey = key; draw(fl, stats, lift, yards); }
    highlightActive();
  }

  function draw(fl, stats, lift, yards) {
    const W = 150 + Math.sqrt(yards) * 6.2, D = W * 0.78;
    const n = fl.length, gap = exploded ? Math.min(92, 330 / n) : Math.min(46, 200 / n), wall = exploded ? Math.min(22, gap * 0.32) : gap - 6;
    const ox = -W / 2, oy = -D / 2;
    // keep the whole stack centred in the frame
    const sc = parseFloat(scene.style.getPropertyValue("--s")) || 1;
    scene.style.top = `calc(56% + ${Math.round(0.42 * (n - 1) * gap * sc)}px)`;
    scene.innerHTML = "";
    const plotEl = document.createElement("div");
    plotEl.className = "m-plot";
    Object.assign(plotEl.style, { left: ox - 24 + "px", top: oy - 24 + "px", width: W + 48 + "px", height: D + 48 + "px" });
    scene.appendChild(plotEl);
    fl.forEach((f, i) => {
      const z = (i - (basement ? 1 : 0)) * gap + (basement ? 0 : 0);
      const layer = document.createElement("div");
      layer.className = "pl-layer"; layer.dataset.i = i; layer.style.transform = `translateZ(${z}px)`;
      layer.appendChild(box("slab", ox, oy, W, D, 4, 0, "#f6f4f0", ""));
      const items = [];
      for (const [k, c] of Object.entries(f.rooms)) for (let n = 0; n < c; n++) items.push({ key: k, area: ROOM[k].area, color: ROOM[k].color, label: ROOM[k].label });
      const baths = Object.entries(f.rooms).reduce((a, [k, c]) => a + (ROOM[k].bath ? c : 0), 0);
      if (baths) items.push({ key: "bath", area: baths * 50, color: "#e9e6e1", label: baths > 1 ? `${baths} baths` : "Bath" });
      items.push({ key: "stair", area: 120, color: "#ece9e4", label: "Stair" });
      if (lift) items.push({ key: "lift", area: 30, color: "#7a2e5c", label: "Lift" });
      const used = items.reduce((a, b) => a + b.area, 0), plate = stats[i].plate;
      if (used < plate) items.push({ key: "circ", area: plate - used, color: "#f3f1ed", label: "" });
      items.sort((a, b) => b.area - a.area);
      const rects = []; layout(items, ox + 3, oy + 3, W - 6, D - 6, rects);
      rects.forEach((r) => {
        const open = r.key === "garden" || r.key === "balcony" || r.key === "circ" || r.key === "parking";
        const h = r.key === "circ" ? 1 : open ? 3 : r.key === "lift" ? wall + 10 : wall;
        const b = box("room r-" + r.key + (stats[i].pct > 1 ? " over" : ""), r.x + 1.5, r.y + 1.5, Math.max(4, r.w - 3), Math.max(4, r.h - 3), h, 4, r.color, r.label);
        if (r.label) { b.dataset.label = r.label; b.dataset.area = r.key === "bath" ? "" : ROOM[r.key] ? ROOM[r.key].area : ""; b.dataset.floor = f.name; }
        layer.appendChild(b);
      });
      const tag = document.createElement("div");
      tag.className = "pl-tag"; tag.textContent = f.name;
      tag.style.cssText = `left:${ox - 6}px;top:${oy + D + 8}px`;
      layer.appendChild(tag);
      scene.appendChild(layer);
      // newly drawn floors drop into place
      if (!reduceMotion) { layer.style.transform = `translateZ(${z + 60}px)`; requestAnimationFrame(() => requestAnimationFrame(() => { layer.style.transform = `translateZ(${z}px)`; })); }
    });
  }
  function highlightActive() {
    scene.querySelectorAll(".pl-layer").forEach((l) => l.classList.toggle("dim", Number(l.dataset.i) !== active));
  }
  scene.addEventListener("pointerover", (e) => {
    const b = e.target.closest(".m-box[data-label]");
    hoverEl.textContent = b ? `${b.dataset.floor} · ${b.dataset.label}${b.dataset.area ? ` · ≈ ${b.dataset.area} sq ft` : ""}` : "Point at a room";
  });

  renderControls(); update();

  // --- Validation ---
  const rules = {
    name: (v) => v.trim().length >= 2 || "Please enter your name.",
    phone: (v) => /^(\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/.test(v.trim()) || "Please enter a valid 10-digit Indian mobile number.",
    email: (v) => v.trim() === "" || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || "That email address doesn't look right.",
    message: (v) => v.trim().length >= 10 || "Tell us a little about the project (at least 10 characters)."
  };
  const check = (input) => {
    const res = rules[input.name](input.value);
    const field = input.closest(".field");
    field.classList.toggle("invalid", res !== true);
    field.querySelector(".err").textContent = res === true ? "" : res;
    input.setAttribute("aria-invalid", String(res !== true));
    return res === true;
  };
  Object.keys(rules).forEach((n) => {
    const el = form.elements[n];
    el.addEventListener("blur", () => check(el));
    el.addEventListener("input", () => { if (el.closest(".field").classList.contains("invalid")) check(el); });
  });
  const msg = form.elements.message, count = form.querySelector(".field .count");
  msg.addEventListener("input", () => { count.textContent = `${msg.value.length} / ${msg.maxLength}`; });

  const status = form.querySelector(".status");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const ok = Object.keys(rules).map((n) => check(form.elements[n])).every(Boolean);
    if (!ok) { form.querySelector(".invalid input, .invalid textarea").focus(); return; }
    const d = new FormData(form);
    const feats = d.getAll("feature");
    const lift = feats.includes("Lift");
    const fl = floors();
    const programme = fl.map((f) => {
      const rooms = Object.entries(f.rooms).map(([k, c]) => (c > 1 ? `${c} x ` : "") + ROOM[k].label).join(", ") || "to discuss";
      return `  ${f.name}: ${rooms} (about ${fmt(usedArea(f, lift))} of ${fmt(plateArea(f))} sq ft)`;
    });
    const built = fl.reduce((a, f) => a + usedArea(f, lift), 0);
    const lines = [
      "Hello Design Sense, here is my project brief.", "",
      `Project: ${d.get("type") || "New home"}`,
      `Plot: ${d.get("plot")} sq yd`,
      `Floors: ${floorLabel(nFloors, basement)}`,
      "Rooms by floor:", ...programme,
      `Approximate built-up area: ${fmt(built)} sq ft`,
      feats.length ? `Wish list: ${feats.join(", ")}` : null,
      d.get("stage") ? `Stage: ${d.get("stage")}` : null,
      d.get("location").trim() ? `Site: ${d.get("location").trim()}` : null, "",
      `Name: ${d.get("name").trim()}`,
      `Phone: ${d.get("phone").trim()}`,
      d.get("email").trim() ? `Email: ${d.get("email").trim()}` : null, "",
      d.get("message").trim()
    ].filter((l) => l !== null);
    if (SITE.formspreeId) {
      d.append("programme", programme.join("\n"));
      try {
        const res = await fetch(`https://formspree.io/f/${SITE.formspreeId}`, { method: "POST", body: d, headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error();
        show("Thank you. Your brief has reached the studio, and we'll be in touch within one working day.");
      } catch (err) { show(`Sorry, that didn't send. Please email ${SITE.email} or call ${SITE.phone}.`, true); }
      return;
    }
    const subject = `Project brief: ${d.get("type") || "New home"}, ${d.get("plot")} sq yd, ${floorLabel(nFloors, basement)}`;
    location.href = `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
    show(`Your email app should now open with the brief and the floor-by-floor programme written out, addressed to ${SITE.email}. Review it and press send.`);
  });
  function show(text, err) { status.textContent = text; status.className = "status on" + (err ? " error" : ""); status.setAttribute("role", err ? "alert" : "status"); }
}

/* ---------------- Footer title block ---------------- */
function setupFooter() {
  const d = new Date();
  document.querySelectorAll("[data-today]").forEach((el) => {
    el.textContent = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  });
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = d.getFullYear()));
}

/* ---------------- Filters: work cards and client project notes ---------------- */
function setupFilters() {
  const groups = [["[data-wfilter]", ".work-card", "cat"], ["[data-pfilter]", ".pfeature", "sector"]];
  groups.forEach(([chipSel, itemSel, key]) => {
    const chips = document.querySelectorAll(chipSel);
    if (!chips.length) return;
    const items = [...document.querySelectorAll(itemSel)];
    const attr = chipSel.slice(6, -1);
    chips.forEach((c) => c.addEventListener("click", () => {
      const f = c.dataset[attr === "wfilter" ? "wfilter" : "pfilter"];
      chips.forEach((x) => x.setAttribute("aria-pressed", String(x === c)));
      const shown = [];
      items.forEach((it) => {
        const on = f === "all" || (it.dataset[key] || "").split(" ").includes(f);
        it.classList.toggle("is-hidden", !on);
        if (on) shown.push(it);
      });
      if (hasGSAP && !reduceMotion) gsap.fromTo(shown, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", stagger: 0.025 });
      if (hasGSAP) ScrollTrigger.refresh();
    }));
  });
}

/* ---------------- Vaastu grid: pick a zone to read about it ---------------- */
function setupMandala() {
  const grid = document.querySelector(".mandala");
  if (!grid) return;
  const note = document.querySelector(".mandala-note");
  const cells = grid.querySelectorAll("button");
  const pick = (b) => {
    cells.forEach((c) => c.classList.toggle("on", c === b));
    note.innerHTML = `<strong>${b.querySelector("strong").textContent} · ${b.querySelector(".mono").textContent}</strong><p>${b.dataset.note}</p>`;
  };
  cells.forEach((b) => { b.addEventListener("click", () => pick(b)); b.addEventListener("pointerenter", () => pick(b)); b.addEventListener("focus", () => pick(b)); });
  pick(cells[2] || cells[0]);
}

/* ?scrollto=<id> opens a page at a section (used for documentation screenshots) */
window.addEventListener("load", () => {
  const id = new URLSearchParams(location.search).get("scrollto");
  const el = id && document.getElementById(id);
  if (el) window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 70);
});

/* Closing call to action: the little house tilts towards the pointer */
document.querySelectorAll(".arch-orb").forEach((el) => {
  if (!finePointer || reduceMotion) return;
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--ry", (px * 26).toFixed(1) + "deg");
    el.style.setProperty("--rx", (-py * 20).toFixed(1) + "deg");
  });
  el.addEventListener("pointerleave", () => { el.style.setProperty("--ry", "0deg"); el.style.setProperty("--rx", "0deg"); });
});

/* ---------------- Client galleries: thumbnails swap the main photo; the main photo opens a viewer ---------------- */
(function setupClientGalleries() {
  const gals = document.querySelectorAll("[data-cgal]");
  if (!gals.length) return;
  let box = document.querySelector(".cg-box");
  if (!box) {
    box = document.createElement("div");
    box.className = "lightbox cg-box"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "Project photos");
    box.innerHTML = `<span class="lb-count"></span>
      <button type="button" class="lb-close" aria-label="Close"><svg viewBox="0 0 20 20" width="20" height="20"><path d="M2 2l16 16M18 2L2 18" stroke="currentColor" stroke-width="1.5"/></svg></button>
      <button type="button" class="lb-prev" aria-label="Previous photo"><svg viewBox="0 0 20 20" width="20" height="20"><path d="M13 3l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></button>
      <img alt=""><p class="lb-cap"><strong></strong><span></span></p>
      <button type="button" class="lb-next" aria-label="Next photo"><svg viewBox="0 0 20 20" width="20" height="20"><path d="M7 3l7 7-7 7" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></button>`;
    document.body.appendChild(box);
  }
  const bImg = box.querySelector("img"), bTitle = box.querySelector(".lb-cap strong"), bText = box.querySelector(".lb-cap span"), bCount = box.querySelector(".lb-count");
  let list = [], cur = 0, title = "", lastFocus = null;
  const pad = (n) => String(n).padStart(2, "0");
  const show = (i) => {
    cur = (i + list.length) % list.length;
    bImg.src = list[cur]; bImg.alt = `${title}, photo ${cur + 1}`;
    bTitle.textContent = title; bText.textContent = `Photo ${cur + 1} of ${list.length}`;
    bCount.textContent = `${pad(cur + 1)} / ${pad(list.length)}`;
  };
  const close = () => { box.classList.remove("is-open"); document.body.style.overflow = ""; if (lenis) lenis.start(); if (lastFocus) lastFocus.focus(); };
  box.querySelector(".lb-close").addEventListener("click", close);
  box.querySelector(".lb-prev").addEventListener("click", () => show(cur - 1));
  box.querySelector(".lb-next").addEventListener("click", () => show(cur + 1));
  box.addEventListener("click", (e) => { if (e.target === box) close(); });
  document.addEventListener("keydown", (e) => {
    if (!box.classList.contains("is-open")) return;
    if (e.key === "Escape") close(); else if (e.key === "ArrowLeft") show(cur - 1); else if (e.key === "ArrowRight") show(cur + 1);
  });
  let sx = null;
  box.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
  box.addEventListener("touchend", (e) => { if (sx === null) return; const d = e.changedTouches[0].clientX - sx; if (Math.abs(d) > 50) show(cur + (d < 0 ? 1 : -1)); sx = null; });

  gals.forEach((g) => {
    const main = g.querySelector(".pf-main"), mImg = main.querySelector("img"), count = main.querySelector(".pf-count");
    const thumbs = [...g.querySelectorAll(".pf-thumb")];
    const urls = thumbs.map((t) => t.dataset.full);
    let idx = 0;
    const select = (i) => {
      idx = i;
      thumbs.forEach((t, k) => t.classList.toggle("on", k === i));
      mImg.removeAttribute("srcset"); mImg.src = urls[i];
      count.textContent = `${pad(i + 1)} / ${pad(urls.length)}`;
    };
    thumbs.forEach((t, k) => t.addEventListener("click", () => select(k)));
    main.addEventListener("click", () => {
      list = urls; title = g.dataset.title; lastFocus = main; show(idx);
      box.classList.add("is-open"); document.body.style.overflow = "hidden"; if (lenis) lenis.stop();
      box.querySelector(".lb-close").focus();
    });
  });
})();

/* ---------------- Contact map: the studio pin opens a card; "Explore" hands the map over ---------------- */
(function setupMapPin() {
  const map = document.querySelector("[data-map]");
  if (!map) return;
  const pin = map.querySelector(".map-pin"), btn = map.querySelector(".pin-btn"), frame = map.querySelector("iframe");
  const explore = map.querySelector(".map-explore"), back = map.querySelector(".map-back");
  const setOpen = (on) => { pin.classList.toggle("open", on); btn.setAttribute("aria-expanded", String(on)); };
  btn.addEventListener("click", (e) => { e.stopPropagation(); setOpen(!pin.classList.contains("open")); });
  map.querySelector(".map-cover").addEventListener("click", (e) => { if (!e.target.closest(".map-pin")) setOpen(false); });
  explore.addEventListener("click", () => { map.classList.add("exploring"); back.hidden = false; setOpen(false); });
  back.addEventListener("click", () => { frame.src = frame.src; map.classList.remove("exploring"); back.hidden = true; });
  // open the card once the map scrolls into view
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { setTimeout(() => setOpen(true), 1100); io.disconnect(); } }, { threshold: 0.6 });
    io.observe(map);
  }
})();
