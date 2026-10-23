"use strict";
(() => {
const toggle = document.querySelector(".theme-toggle");
const root = document.documentElement;
if (!toggle) return;
const sync = () => toggle.setAttribute("aria-pressed", String(root.dataset.theme === "dark"));
sync();
toggle.addEventListener("click", () => {
const apply = () => {
root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
sync();
try {
localStorage.setItem("theme", root.dataset.theme);
} catch {}
};
if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) {
apply();
return;
}
const bounds = toggle.getBoundingClientRect();
const x = bounds.left + bounds.width / 2;
const y = bounds.top + bounds.height / 2;
const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
document.startViewTransition(apply).ready.then(() => {
root.animate(
{ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
{ duration: 650, easing: "cubic-bezier(0.22, 1, 0.36, 1)", pseudoElement: "::view-transition-new(root)" },
);
});
});
})();
(() => {
const root = document.documentElement;
const buttons = [...document.querySelectorAll("[data-lang]")];
const texts = [...document.querySelectorAll("[data-i18n]")];
const labelled = [...document.querySelectorAll("[data-i18n-label]")];
const limited = [...document.querySelectorAll("[data-lang-only]")];
const strings = {
en: {
tagline: "Building applied AI solutions",
"tagline-audience": "for businesses, developers and researchers",
solutions: "Our solutions",
"group-documents": "Documents",
"group-images": "Images",
"toc-ocr": "Text recognition",
"toc-agegate": "Age estimation",
"toc-extreme": "Disturbing content filter",
"ocr-subtitle": "OCR for Cyrillic documents",
"agegate-subtitle": "Photo-based age estimation system",
"extreme-subtitle": "Image filter for detecting the most severe forms of disturbing content",
ocr: "A fast OCR model for Cyrillic languages. Turns scans and photos of documents into text: recognizes printed and handwritten writing, even on distorted pages with print defects.",
agegate: "Estimates a person’s age from a photo and checks whether they meet a given age threshold.",
contact: "Contact us",
"copy-hint": "Click to copy",
copied: "Copied",
},
ru: {},
};
const labels = {
en: { lang: "Language", theme: "Dark theme", toc: "Contents" },
ru: {},
};
if (!buttons.length) return;
texts.forEach(element => { strings.ru[element.dataset.i18n] = element.innerHTML; });
labelled.forEach(element => { labels.ru[element.dataset.i18nLabel] = element.getAttribute("aria-label"); });
const shown = element => !element.closest("[hidden]");
const fill = lang => {
limited.forEach(element => { element.hidden = element.dataset.langOnly !== lang; });
texts.filter(shown).forEach(element => { element.innerHTML = strings[lang][element.dataset.i18n]; });
labelled.forEach(element => element.setAttribute("aria-label", labels[lang][element.dataset.i18nLabel]));
buttons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.lang === lang)));
};
fill(root.lang);
let switchId = 0;
buttons.forEach(button => button.addEventListener("click", async () => {
const lang = button.dataset.lang;
if (lang === root.lang) return;
root.lang = lang;
try {
localStorage.setItem("lang", lang);
} catch {}
const id = ++switchId;
const visible = texts.filter(element => {
const bounds = element.getBoundingClientRect();
return !(element.closest(".tagline") && root.classList.contains("intro-locked")) && !element.closest(".site-footer-hint")
&& bounds.width > 0 && bounds.bottom > 0 && bounds.top < innerHeight;
});
if (!window.gsap || !visible.length || matchMedia("(prefers-reduced-motion: reduce)").matches) {
fill(lang);
return;
}
gsap.killTweensOf(visible);
await gsap.to(visible, { autoAlpha: 0, y: -6, duration: 0.2, ease: "power1.in", stagger: 0.03 });
if (id !== switchId) return;
fill(lang);
gsap.fromTo(visible, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out", stagger: 0.05 });
}));
})();
(() => {
const links = [...document.querySelectorAll(".toc-link")];
if (!links.length) return;
links.forEach(link => link.addEventListener("click", event => {
const target = document.querySelector(link.hash);
if (!target) return;
event.preventDefault();
target.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}));
const observer = new IntersectionObserver(entries => entries.forEach(entry => {
if (!entry.isIntersecting) return;
links.forEach(link => {
const active = link.hash === `#${entry.target.id}`;
link.classList.toggle("is-active", active);
link.toggleAttribute("aria-current", active);
});
}), { rootMargin: "-45% 0px -50% 0px" });
document.querySelectorAll(".chapter[id]").forEach(chapter => observer.observe(chapter));
})();
(() => {
const canvas = document.querySelector(".ambient");
if (!canvas || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
const context = canvas.getContext("2d");
const pointer = { x: 0, y: 0, active: false };
const repelRadius = 120;
const repelDistance = 40;
const spring = 3;
let width = 0;
let height = 0;
let particles = [];
let frame = 0;
let last = 0;
let start = 0;
const resize = () => {
const ratio = window.devicePixelRatio || 1;
width = innerWidth;
height = innerHeight;
canvas.width = width * ratio;
canvas.height = height * ratio;
context.setTransform(ratio, 0, 0, ratio, 0, 0);
};
const draw = time => {
frame = 0;
if (document.hidden) return;
const step = Math.min(time - (last || time), 50) / 1000;
const fade = Math.min(1, Math.max(0, (time - start) / 2000));
last = time;
context.clearRect(0, 0, width, height);
context.fillStyle = "#1b5bfe";
particles.forEach(particle => {
particle.x = (particle.x + particle.speed * step + width + 20) % (width + 20);
const wobble = Math.sin(time / 1000 * 0.4 + particle.phase) * 6;
const baseX = particle.x - 10;
const baseY = ((particle.y - scrollY * particle.depth + wobble) % (height + 20) + height + 20) % (height + 20) - 10;
let targetX = 0;
let targetY = 0;
if (pointer.active) {
const dx = baseX - pointer.x;
const dy = baseY - pointer.y;
const distance = Math.hypot(dx, dy);
if (distance > 0 && distance < repelRadius * 3) {
const push = Math.exp(-((distance / repelRadius) ** 2)) * repelDistance;
targetX = dx / distance * push;
targetY = dy / distance * push;
}
}
particle.velocityX += (spring * spring * (targetX - particle.offsetX) - 2 * spring * particle.velocityX) * step;
particle.velocityY += (spring * spring * (targetY - particle.offsetY) - 2 * spring * particle.velocityY) * step;
particle.offsetX += particle.velocityX * step;
particle.offsetY += particle.velocityY * step;
context.globalAlpha = particle.alpha * fade;
context.beginPath();
context.roundRect(baseX + particle.offsetX - particle.size / 2, baseY + particle.offsetY - particle.size / 2, particle.size, particle.size, particle.size * 0.25);
context.fill();
});
frame = requestAnimationFrame(draw);
};
const run = () => {
if (!frame && start) frame = requestAnimationFrame(draw);
};
document.addEventListener("intro-finished", () => {
resize();
particles = Array.from({ length: 60 }, () => ({
x: Math.random() * (width + 20),
y: Math.random() * (height + 20),
size: 3 + Math.random() * 4,
alpha: 0.14 + Math.random() * 0.12,
depth: 0.3 + Math.random() * 0.4,
speed: 4 + Math.random() * 6,
phase: Math.random() * Math.PI * 2,
offsetX: 0,
offsetY: 0,
velocityX: 0,
velocityY: 0,
}));
start = performance.now();
run();
}, { once: true });
window.addEventListener("resize", () => {
if (!start) return;
resize();
run();
});
document.addEventListener("visibilitychange", run);
window.addEventListener("pointermove", event => {
pointer.x = event.clientX;
pointer.y = event.clientY;
pointer.active = true;
}, { passive: true });
document.documentElement.addEventListener("pointerleave", () => { pointer.active = false; });
})();
(() => {
const link = document.querySelector(".site-footer-contact");
const row = document.querySelector(".site-footer-contact-row");
const heart = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3.3 5 6.8 5c2 0 3.4 1.1 5.2 3 1.8-1.9 3.2-3 5.2-3 3.5 0 5.6 3.6 4.3 6.8C19.5 16.4 12 21 12 21z" /></svg>';
const colors = ["#ff4d6d", "#ff758f", "#ff8fa3", "#e5383b"];
let hideCopied;
if (!link || !row || !navigator.clipboard) return;
const burst = (x, y) => {
if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
for (let index = 0; index < 8; index++) {
const particle = document.createElement("span");
const angle = -Math.PI / 2 + (index / 7 - 0.5) * 1.6 + (Math.random() - 0.5) * 0.25;
const distance = 60 + Math.random() * 50;
const scale = 0.6 + Math.random() * 0.6;
const rotate = (Math.random() - 0.5) * 40;
const dx = Math.cos(angle) * distance;
const dy = Math.sin(angle) * distance;
particle.className = "heart-particle";
particle.innerHTML = heart;
particle.style.left = `${x - 9}px`;
particle.style.top = `${y - 9}px`;
particle.style.fill = colors[index % colors.length];
document.body.append(particle);
particle.animate([
{ transform: "translate(0, 0) scale(0)", opacity: 0 },
{ transform: `translate(${dx * 0.6}px, ${dy * 0.6}px) scale(${scale}) rotate(${rotate / 2}deg)`, opacity: 1, offset: 0.35 },
{ transform: `translate(${dx}px, ${dy - 20}px) scale(${scale * 0.8}) rotate(${rotate}deg)`, opacity: 0 },
], {
duration: 900 + Math.random() * 300,
delay: index * 25,
easing: "cubic-bezier(0.22, 1, 0.36, 1)",
fill: "backwards",
}).finished.then(() => particle.remove());
}
};
link.addEventListener("click", async event => {
event.preventDefault();
try {
await navigator.clipboard.writeText("contact@metrika.cc");
} catch {
window.location.href = link.href;
return;
}
const bounds = link.querySelector(".site-footer-email").getBoundingClientRect();
burst(event.detail ? event.clientX : bounds.left + bounds.width / 2, event.detail ? event.clientY : bounds.top + bounds.height / 2);
row.classList.add("is-copied");
window.clearTimeout(hideCopied);
hideCopied = window.setTimeout(() => row.classList.remove("is-copied"), 1600);
});
})();
(() => {
const logo = document.querySelector("[data-logo]");
if (!logo || !window.gsap) return;
history.scrollRestoration = "manual";
window.scrollTo(0, 0);
window.addEventListener("pageshow", () => window.scrollTo(0, 0));
document.documentElement.classList.add("intro-locked");
const squares = [...logo.querySelectorAll(".square")];
const wordmark = logo.querySelector(".wordmark");
const media = gsap.matchMedia();
let logoIntro;
let finishEntrance = () => {};
const entranceSpeed = 1.4;
let revealSolutions = () => {};
media.add("(prefers-reduced-motion: no-preference)", () => {
const previousOverflow = logo.style.overflow;
const particles = document.createElementNS("http://www.w3.org/2000/svg", "g");
particles.setAttribute("aria-hidden", "true");
particles.setAttribute("fill", "#1b5bfe");
logo.insertBefore(particles, logo.querySelector("#symbol"));
logo.style.overflow = "visible";
const bounds = logo.getBoundingClientRect();
const viewBox = logo.viewBox.baseVal;
const unitScale = bounds.width / viewBox.width;
const screenWidth = document.documentElement.clientWidth;
const screenHeight = window.innerHeight;
const introTagline = document.querySelector(".tagline");
const taglineBounds = introTagline.getBoundingClientRect();
gsap.set(introTagline, {
y: screenHeight / 2 - taglineBounds.top - taglineBounds.height / 2,
});
const captionBounds = introTagline.getBoundingClientRect();
const random = seed => {
const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
return value - Math.floor(value);
};
const particlesPerSquare = screenWidth < 768 ? 14 : 24;
const particleStagger = 0.048 / (particlesPerSquare - 1);
const particleLayers = [
{ color: "#8aafff", size: 5, variation: 2.5, opacity: 0.42, parallax: 0.55 },
{ color: "#4d82ff", size: 8, variation: 3, opacity: 0.67, parallax: 0.85 },
{ color: "#1b5bfe", size: 11, variation: 3, opacity: 0.9, parallax: 1.2 },
];
const svgElement = (name, attributes = {}) => {
const element = document.createElementNS("http://www.w3.org/2000/svg", name);
Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
return element;
};
const occupied = [];
const floaters = [];
const floatStrength = { value: 1 };
const scatterPoint = index => {
let best;
let bestScore = -Infinity;
for (let attempt = 0; attempt < 12; attempt++) {
const seed = index * 137 + attempt * 19;
const point = {
x: random(seed + 1) * screenWidth,
y: random(seed + 7) * screenHeight,
};
const overText = point.x > captionBounds.left - 22 && point.x < captionBounds.right + 22
&& point.y > captionBounds.top - 24 && point.y < captionBounds.bottom + 24;
const spacing = occupied.reduce((nearest, other) => Math.min(nearest, Math.hypot(point.x - other.x, point.y - other.y)), Infinity);
const score = spacing - (overText ? 1000 : 0);
if (score > bestScore) {
best = point;
bestScore = score;
}
if (!overText && spacing > 32) break;
}
occupied.push(best);
return best;
};
const squareCenter = square => ({
x: Number(square.getAttribute("x")) + Number(square.getAttribute("width")) / 2,
y: Number(square.getAttribute("y")) + Number(square.getAttribute("height")) / 2,
});
const createParticle = index => {
const start = scatterPoint(index);
const startX = viewBox.x + (start.x - bounds.left) / unitScale;
const startY = viewBox.y + (start.y - bounds.top) / unitScale;
const tile = svgElement("g");
const drift = svgElement("g");
const depthSample = random(index + 187);
const depth = depthSample < 0.68 ? 0 : depthSample < 0.93 ? 1 : 2;
const layer = particleLayers[depth];
const shape = svgElement("rect", { x: -12, y: -12, width: 24, height: 24, rx: 3, fill: layer.color });
tile.append(shape);
drift.append(tile);
const particleSize = layer.size + random(index + 223) * layer.variation;
gsap.set(tile, {
svgOrigin: "0 0",
x: startX,
y: startY,
scale: particleSize / (24 * unitScale),
autoAlpha: layer.opacity + random(index + 271) * 0.08,
});
floaters.push({
tile,
x: startX,
y: startY,
parallax: layer.parallax,
offsetX: 0,
offsetY: 0,
velocityX: 0,
velocityY: 0,
setX: gsap.quickSetter(drift, "x", "px"),
setY: gsap.quickSetter(drift, "y", "px"),
phaseX: random(index + 353) * Math.PI * 2,
phaseY: random(index + 419) * Math.PI * 2,
speed: 0.22 + depth * 0.08 + random(index + 467) * 0.08,
amplitude: (4 + random(index + 523) * 3) * layer.parallax / unitScale,
travel: (6 + random(index + 601) * 3) * layer.parallax / unitScale,
});
return { tile, shape, drift, depth, particleSize, startX, startY };
};
const fragments = squares.flatMap((square, squareIndex) => {
const center = squareCenter(square);
const width = Number(square.getAttribute("width"));
const height = Number(square.getAttribute("height"));
return Array.from({ length: particlesPerSquare }, (_, cell) => {
const particle = createParticle(squareIndex * particlesPerSquare + cell);
const finalScale = Math.min(particle.particleSize * 0.45 / unitScale, Math.min(width, height) * 0.2) / 24;
return {
...particle,
squareIndex,
cell,
x: center.x,
y: center.y,
scaleX: finalScale,
scaleY: finalScale,
};
});
});
fragments.slice().sort((a, b) => a.depth - b.depth).forEach(fragment => particles.append(fragment.drift));
const pointer = { x: 0, y: 0, active: false };
const onPointerMove = event => {
pointer.x = event.clientX;
pointer.y = event.clientY;
pointer.active = true;
};
const onPointerLeave = event => {
if (event.type === "pointerleave" || event.pointerType !== "mouse") pointer.active = false;
};
window.addEventListener("pointermove", onPointerMove, { passive: true });
window.addEventListener("pointerup", onPointerLeave, { passive: true });
document.documentElement.addEventListener("pointerleave", onPointerLeave);
const repelRadius = 150;
const repelDistance = 110;
const spring = 3;
const edge = 16;
let wrapping = true;
const floatStart = gsap.ticker.time;
const updateFloat = (time, deltaTime) => {
const elapsed = time - floatStart;
const step = Math.min(deltaTime, 50) / 1000;
floaters.forEach(floater => {
const strength = floater.amplitude * floatStrength.value;
const floatX = (Math.sin(elapsed * floater.speed + floater.phaseX) - Math.sin(floater.phaseX)) * strength
+ elapsed * floater.travel * floatStrength.value;
const floatY = (Math.cos(elapsed * floater.speed * 0.71 + floater.phaseY) - Math.cos(floater.phaseY)) * strength * 0.75;
let targetX = 0;
let targetY = 0;
if (wrapping) {
const screenX = bounds.left + (floater.x + floatX - viewBox.x) * unitScale;
const screenY = bounds.top + (floater.y + floatY - viewBox.y) * unitScale;
const shiftX = screenX < -edge ? 1 : screenX > screenWidth + edge ? -1 : 0;
const shiftY = screenY < -edge ? 1 : screenY > screenHeight + edge ? -1 : 0;
if (shiftX || shiftY) {
floater.x += shiftX * (screenWidth + 2 * edge) / unitScale;
floater.y += shiftY * (screenHeight + 2 * edge) / unitScale;
gsap.set(floater.tile, { x: floater.x, y: floater.y });
}
}
if (wrapping && pointer.active) {
const dx = bounds.left + (floater.x + floatX - viewBox.x) * unitScale - pointer.x;
const dy = bounds.top + (floater.y + floatY - viewBox.y) * unitScale - pointer.y;
const distance = Math.hypot(dx, dy);
if (distance > 0 && distance < repelRadius * 3) {
const push = Math.exp(-((distance / repelRadius) ** 2)) * repelDistance * floater.parallax * floatStrength.value / unitScale;
targetX = dx / distance * push;
targetY = dy / distance * push;
}
}
floater.velocityX += (spring * spring * (targetX - floater.offsetX) - 2 * spring * floater.velocityX) * step;
floater.velocityY += (spring * spring * (targetY - floater.offsetY) - 2 * spring * floater.velocityY) * step;
floater.offsetX += floater.velocityX * step;
floater.offsetY += floater.velocityY * step;
floater.setX(floatX + floater.offsetX);
floater.setY(floatY + floater.offsetY);
});
};
gsap.ticker.add(updateFloat);
const cleanup = () => {
gsap.ticker.remove(updateFloat);
window.removeEventListener("pointermove", onPointerMove);
window.removeEventListener("pointerup", onPointerLeave);
document.documentElement.removeEventListener("pointerleave", onPointerLeave);
particles.remove();
logo.style.overflow = previousOverflow;
};
const intro = gsap.timeline({
paused: true,
onStart: () => {
wrapping = false;
},
onComplete: () => {
cleanup();
finishEntrance();
},
});
logoIntro = intro;
intro.timeScale(entranceSpeed);
gsap.set(squares, { autoAlpha: 0 });
const flightDuration = 1.4;
const assembledAt = (squares.length - 1) * 0.012 + (particlesPerSquare - 1) * particleStagger + flightDuration;
const textRevealAt = assembledAt - 0.2;
intro.to(floatStrength, {
value: 0.03,
duration: flightDuration - 0.3,
ease: "sine.inOut",
}, 0);
intro.to(introTagline, {
y: 0,
marginTop: 48,
duration: 0.8,
ease: "power3.inOut",
}, textRevealAt - 0.3);
intro.set(introTagline, { zIndex: "auto" }, textRevealAt + 0.5);
intro.call(() => revealSolutions(), [], textRevealAt);
intro.fromTo(
wordmark,
{ autoAlpha: 0 },
{ autoAlpha: 1, duration: 0.5, ease: "power2.out" },
textRevealAt,
);
fragments.forEach(fragment => {
const startAt = fragment.squareIndex * 0.012 + fragment.cell * particleStagger;
intro.to(fragment.tile, {
x: fragment.startX + (fragment.x - fragment.startX) * 0.85,
y: fragment.startY + (fragment.y - fragment.startY) * 0.85,
duration: 0.55,
ease: progress => {
const outSlope = 0.45 / 0.85;
const squared = progress * progress;
const cubed = squared * progress;
return 3 * squared - 2 * cubed
+ outSlope * (cubed - squared);
},
}, 0);
intro.to(fragment.tile, {
x: fragment.x,
y: fragment.y,
duration: 0.55,
ease: "power2.out",
}, 0.55);
intro.to(fragment.tile, {
scaleX: fragment.scaleX,
scaleY: fragment.scaleY,
duration: flightDuration - 0.3,
ease: "sine.inOut",
}, startAt);
intro.to(fragment.shape, {
fill: "#1b5bfe",
duration: 0.8,
ease: "sine.inOut",
}, startAt);
});
squares.forEach((square, index) => {
const settledAt = index * 0.012 + (particlesPerSquare - 1) * particleStagger + flightDuration;
intro.to(square, {
autoAlpha: 1,
duration: 0.22,
ease: "sine.inOut",
}, settledAt - 0.56);
intro.to(fragments.filter(fragment => fragment.squareIndex === index).map(fragment => fragment.tile), {
autoAlpha: 0,
duration: 0.16,
ease: "sine.inOut",
}, settledAt - 0.3);
});
return cleanup;
});
const slot = document.querySelector(".logo-slot");
const motion = document.querySelector(".logo-motion");
const solutions = document.querySelector(".solutions");
const headerRibbon = document.querySelector(".header-ribbon");
const footer = document.querySelector(".site-footer");
if (!slot || !motion) return;
slot.style.aspectRatio = `${logo.getAttribute("width")} / ${logo.getAttribute("height")}`;
const measure = () => {
const bounds = slot.getBoundingClientRect();
return {
left: bounds.left,
top: bounds.top + window.scrollY,
width: bounds.width,
};
};
const placeLogo = () => {
const bounds = measure();
gsap.set(motion, {
position: "fixed",
left: bounds.left,
top: bounds.top,
width: bounds.width,
zIndex: 20,
transformOrigin: "0 0",
force3D: false,
});
};
placeLogo();
const dock = gsap.timeline({
paused: true,
defaults: { duration: 0.85, ease: "power2.inOut" },
});
dock.fromTo(
motion,
{ x: 0, y: 0, scale: 1 },
{
x: () => 24 - measure().left,
y: () => 20 - measure().top,
scale: () => Math.min(140, measure().width) / measure().width,
force3D: false,
},
0,
);
if (headerRibbon) {
dock.fromTo(
headerRibbon,
{ autoAlpha: 0 },
{ autoAlpha: 1, duration: 0.2, ease: "sine.out" },
0.55,
);
}
let entranceStarted = false;
let autoStart;
let autoScroll;
let autoScrollTween;
let solutionsShown = false;
revealSolutions = () => {
if (!solutions || solutionsShown) return;
solutionsShown = true;
gsap.to([solutions, footer].filter(Boolean), { autoAlpha: 1, duration: 0.5 / entranceSpeed, ease: "power2.out" });
};
finishEntrance = () => {
document.documentElement.classList.remove("intro-locked");
revealSolutions();
document.dispatchEvent(new Event("intro-finished"));
autoScroll = window.setTimeout(() => {
const title = document.querySelector("#solutions-title");
const target = title ? title.getBoundingClientRect().top + window.scrollY - (headerRibbon?.offsetHeight ?? 0) - 32 : 180;
const position = { y: window.scrollY };
autoScrollTween = gsap.to(position, {
y: Math.max(180, target),
duration: 1.4,
ease: "power2.inOut",
onUpdate: () => window.scrollTo(0, position.y),
});
}, 2000);
};
const stopAutoScroll = () => {
window.clearTimeout(autoScroll);
autoScrollTween?.kill();
};
["wheel", "touchstart", "keydown"].forEach(type => window.addEventListener(type, stopAutoScroll, { passive: true }));
const beginEntrance = () => {
if (entranceStarted) return;
entranceStarted = true;
window.clearTimeout(autoStart);
window.removeEventListener("wheel", onEntranceWheel);
window.removeEventListener("touchmove", beginEntrance);
if (!logoIntro || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
finishEntrance();
} else {
logoIntro.invalidate().play(0);
}
};
const onEntranceWheel = event => {
if (event.deltaY > 0) beginEntrance();
};
let furthestProgress = 0;
const scrollProgress = () => {
furthestProgress = Math.max(furthestProgress, gsap.utils.clamp(0, 1, window.scrollY / 180));
return furthestProgress;
};
const followScroll = gsap.quickTo(dock, "progress", { duration: 0.16, ease: "power1.out" });
const updateScroll = () => {
if (document.documentElement.classList.contains("intro-locked")) return;
if (window.scrollY > 0) beginEntrance();
if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
dock.progress(scrollProgress());
} else {
followScroll(scrollProgress());
}
};
window.addEventListener("scroll", updateScroll, { passive: true });
dock.progress(scrollProgress());
window.addEventListener("wheel", onEntranceWheel, { passive: true });
window.addEventListener("touchmove", beginEntrance, { passive: true });
autoStart = window.setTimeout(beginEntrance, 2000);
window.addEventListener("resize", () => {
placeLogo();
dock.invalidate().progress(scrollProgress());
});
})();
