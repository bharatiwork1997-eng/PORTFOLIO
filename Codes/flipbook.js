/*!
 * flipbook.js — a small, dependency-free 3D page-turn engine.
 *
 * The engine does not own your content. It works on "views": each view is one
 * screen of the book (a two-page spread, or a single page on narrow screens),
 * drawn into a logical W×H box inside `scene`. During a turn the engine:
 *
 *   - keeps the lower view's left half and the higher view's right half visible
 *     as the static pages underneath (clipped live elements),
 *   - builds a turning leaf whose front is a static copy of the lower view's right
 *     half and whose back is a static copy of the higher view's left half,
 *   - rotates the leaf around the spine (rotateY 0 → -180deg) with a curl shade
 *     and a cast shadow, keeping the sheet pinned in place.
 *
 * Adapter options (all coordinates are logical scene px):
 *   scene        element the live views live in (positioned, W×H)
 *   width/height logical size of one view
 *   count()      number of views
 *   getIndex()   current view index
 *   spine()      x of the spine (W/2 for spreads, 0 for single pages)
 *   getLive(i)   live element for view i (the engine clips it during a turn)
 *   mount(host, i, face) → Promise   put a static copy of view i into `host`
 *   box(i, face) → {x0,x1,y0,y1,bg,radius?,innerRadius?}
 *                                    the paper area of the leaf for that face; `radius`
 *                                    rounds the outer corners, `innerRadius` the spine side
 *                                    ("front" = right-hand half, "back" = left)
 *   commit(to, from)                 make view `to` the active one
 *   onBusy(bool), canTurn()          optional hooks
 *   flippable(from, to)              optional: return false to crossfade instead of turning a leaf
 *   isReady(i)                       optional: false while view i is still loading (no corner peek)
 *   cornerHint                       optional: true shows a folded-corner hint on hover (default off)
 */
(function (root) {
	"use strict";

	function cubicBezier(x1, y1, x2, y2) {
		const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
		const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
		const sampleX = (t) => ((ax * t + bx) * t + cx) * t;
		const sampleY = (t) => ((ay * t + by) * t + cy) * t;
		const slopeX = (t) => (3 * ax * t + 2 * bx) * t + cx;
		return (x) => {
			if (x <= 0) return 0;
			if (x >= 1) return 1;
			let t = x;
			for (let i = 0; i < 8; i++) {
				const err = sampleX(t) - x;
				if (Math.abs(err) < 1e-5) return sampleY(t);
				const d = slopeX(t);
				if (Math.abs(d) < 1e-6) break;
				t -= err / d;
			}
			let lo = 0, hi = 1;
			t = x;
			for (let i = 0; i < 40; i++) {
				const v = sampleX(t);
				if (Math.abs(v - x) < 1e-5) break;
				if (v < x) lo = t; else hi = t;
				t = (lo + hi) / 2;
			}
			return sampleY(t);
		};
	}

	// Resolve after `n` rendered frames (lets the browser paint something before it is shown).
	// A timer backs it up so a hidden tab, where frames pause, can never stall a turn.
	const frames = (n) => new Promise((resolve) => {
		let done = false;
		const finish = () => { if (!done) { done = true; resolve(); } };
		const step = () => (--n <= 0 ? finish() : requestAnimationFrame(step));
		requestAnimationFrame(step);
		setTimeout(finish, 50 * n + 50);
	});

	const EASE_TURN = cubicBezier(0.645, 0.045, 0.355, 1);
	const EASE_RELEASE = cubicBezier(0.22, 0.61, 0.36, 1);
	const LIVE_PROPS = ["visibility", "opacity", "transition", "zIndex", "clipPath", "webkitClipPath", "pointerEvents"];

	function el(cls) {
		const node = document.createElement("div");
		node.className = cls;
		node.setAttribute("aria-hidden", "true");
		return node;
	}
	const px = (n) => `${Math.round(n * 100) / 100}px`;
	const rect = (b) => `polygon(${px(b.x0)} ${px(b.y0)}, ${px(b.x1)} ${px(b.y0)}, ${px(b.x1)} ${px(b.y1)}, ${px(b.x0)} ${px(b.y1)})`;
	// Rounded sheet outline. Radii: [top-left, top-right, bottom-right, bottom-left].
	const n2 = (n) => Math.round(n * 100) / 100;
	function roundedRect(b, radii) {
		const maxR = Math.min(b.x1 - b.x0, b.y1 - b.y0) / 2;
		const [tl, tr, br, bl] = radii.map((r) => Math.max(0, Math.min(r || 0, maxR)));
		if (!tl && !tr && !br && !bl) return rect(b);
		const arc = (r, x, y) => (r ? `A ${n2(r)} ${n2(r)} 0 0 1 ${n2(x)} ${n2(y)}` : `L ${n2(x)} ${n2(y)}`);
		return `path("M ${n2(b.x0 + tl)} ${n2(b.y0)} H ${n2(b.x1 - tr)} ${arc(tr, b.x1, b.y0 + tr)} V ${n2(b.y1 - br)} ${arc(br, b.x1 - br, b.y1)} H ${n2(b.x0 + bl)} ${arc(bl, b.x0, b.y1 - bl)} V ${n2(b.y0 + tl)} ${arc(tl, b.x0 + tl, b.y0)} Z")`;
	}
	// Outer corners (away from the spine) get `radius`, spine-side corners get `innerRadius`.
	function sheetClip(b, face) {
		const outer = b.radius ?? 0, inner = b.innerRadius ?? 0;
		return roundedRect(b, face === "front" ? [inner, outer, outer, inner] : [outer, inner, inner, outer]);
	}
	const place = (node, b) => Object.assign(node.style, { left: px(b.x0), top: px(b.y0), width: px(b.x1 - b.x0), height: px(b.y1 - b.y0), background: b.bg || "" });

	function createFlipbook(o) {
		const W = o.width, H = o.height;
		const duration = o.duration || 850;
		const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
		const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
		const reduced = () => reduceQuery.matches;

		const layer = el("fb-layer");
		layer.style.width = px(W);
		layer.style.height = px(H);
		layer.style.perspective = `${o.perspective || 2000}px`;
		const cast = el("fb-cast");
		const makeFace = (cls) => {
			const rootNode = el(`fb-face ${cls}`);
			const verso = el("fb-face__verso");
			const host = el("fb-face__host");
			host.inert = true;
			const shade = el("fb-face__shade");
			rootNode.append(verso, host, shade);
			Object.assign(rootNode.style, { width: px(W), height: px(H) });
			return { root: rootNode, verso, host, shade };
		};
		const back = makeFace("fb-face--back");
		const front = makeFace("fb-face--front");
		layer.append(cast, back.root, front.root);

		const curl = el("fb-curl");
		const flap = el("fb-curl__flap");
		curl.append(flap);
		o.scene.append(layer, curl);

		const s = { busy: false, queued: 0, drag: null, geom: null, raf: 0, token: 0, held: new Set(), curl: null, curlHeld: new Set(), curlTimer: 0 };

		function setBusy(value) {
			if (s.busy === value) return;
			s.busy = value;
			o.scene.classList.toggle("fb-is-turning", value);
			o.onBusy?.(value);
		}

		function hold(set, node, styles) {
			if (!node) return;
			set.add(node);
			Object.assign(node.style, styles);
		}
		function release(set) {
			set.forEach((node) => LIVE_PROPS.forEach((p) => { node.style[p] = ""; }));
			set.clear();
		}

		function geometry(L, R) {
			const spine = o.spine();
			return { L, R, spine, fb: o.box(L, "front"), bb: o.box(R, "back") };
		}

		async function stage(g) {
			const token = ++s.token;
			await Promise.all([o.mount(front.host, g.L, "front"), o.mount(back.host, g.R, "back")]);
			if (token !== s.token) return false;
			// Warm-up: the incoming view has been hidden, so the browser has never painted it. Draw it
			// (practically invisible, under the current one) for two frames before revealing it;
			// otherwise its first frame can flash black.
			const current = o.getLive(o.getIndex());
			for (const node of [o.getLive(g.L), o.getLive(g.R)]) {
				if (node && node !== current) hold(s.held, node, { visibility: "visible", opacity: "0.001", transition: "none", zIndex: "1" });
			}
			await frames(2);
			if (token !== s.token) return false;
			const origin = `${px(g.spine)} 50%`;
			for (const [face, b, side] of [[front, g.fb, "front"], [back, g.bb, "back"]]) {
				face.root.style.transformOrigin = origin;
				face.root.style.clipPath = sheetClip(b, side);
				place(face.verso, b);
				place(face.shade, { ...b, bg: "" });
			}
			s.geom = g;
			// Static pages underneath: left of the lower view, right of the higher view.
			const liveL = o.getLive(g.L), liveR = o.getLive(g.R);
			hold(s.held, liveR, { visibility: "visible", opacity: "1", transition: "none", zIndex: "3", clipPath: `inset(0 0 0 ${px(Math.max(0, g.spine))})` });
			if (g.spine > 0) hold(s.held, liveL, { visibility: "visible", opacity: "1", transition: "none", zIndex: "3", clipPath: `inset(0 ${px(W - g.spine)} 0 0)` });
			else hold(s.held, liveL, { visibility: "hidden", transition: "none" });
			o.scene.classList.add("fb-is-flipping");
			layer.classList.add("is-on");
			return true;
		}

		function unstage() {
			s.token++;
			layer.classList.remove("is-on");
			o.scene.classList.remove("fb-is-flipping");
			release(s.held);
			s.geom = null;
		}

		function render(theta) {
			const g = s.geom;
			if (!g) return;
			const p = Math.min(1, Math.max(0, -theta / 180));
			const bend = Math.sin(Math.PI * p);
			// The sheet stays pinned to its place and only rotates on the spine. Optional lift/skew
			// (off by default) can add a flexing feel, but they move the page off its position.
			const lift = bend * (o.lift ?? 0);
			const skew = -bend * (o.skew ?? 0);
			const t = lift || skew
				? `translate3d(0, ${px(-lift)}, 0) rotateY(${theta.toFixed(3)}deg) skewY(${skew.toFixed(3)}deg)`
				: `rotateY(${theta.toFixed(3)}deg)`;
			front.root.style.transform = t;
			back.root.style.transform = `${t} rotateY(180deg)`;
			// Curl shade darkens as a face approaches edge-on, and the highlight band travels across it.
			front.shade.style.opacity = p < 0.5 ? (p * 2).toFixed(3) : "0";
			back.shade.style.opacity = p > 0.5 ? ((1 - p) * 2).toFixed(3) : "0";
			front.shade.style.backgroundPosition = `${((1 - p) * 100).toFixed(1)}% 0`;
			back.shade.style.backgroundPosition = `${(p * 100).toFixed(1)}% 0`;
			// Shadow cast on the page underneath, next to the leaf's moving edge.
			const alpha = (0.5 * bend).toFixed(3);
			const spread = 24 + 150 * bend;
			if (p <= 0.5) {
				const xe = g.spine + (g.fb.x1 - g.spine) * Math.cos(Math.PI * p);
				cast.style.clipPath = rect({ x0: g.spine, x1: g.fb.x1, y0: g.fb.y0, y1: g.fb.y1 });
				cast.style.background = `linear-gradient(90deg, rgba(0,0,0,0) ${px(xe - 2)}, rgba(0,0,0,${alpha}) ${px(xe)}, rgba(0,0,0,0) ${px(xe + spread)})`;
			} else {
				const x0 = Math.max(0, g.bb.x0);
				const xe = g.spine + (g.spine - g.bb.x0) * Math.cos(Math.PI * p);
				cast.style.clipPath = rect({ x0, x1: g.spine, y0: g.bb.y0, y1: g.bb.y1 });
				cast.style.background = `linear-gradient(90deg, rgba(0,0,0,0) ${px(xe - spread)}, rgba(0,0,0,${alpha}) ${px(xe)}, rgba(0,0,0,0) ${px(xe + 2)})`;
			}
		}

		function animate(from, to, ms, ease) {
			cancelAnimationFrame(s.raf);
			return new Promise((resolve) => {
				const start = performance.now();
				const step = (now) => {
					const k = Math.min(1, (now - start) / ms);
					render(from + (to - from) * ease(k));
					if (k < 1) s.raf = requestAnimationFrame(step);
					else resolve();
				};
				render(from);
				s.raf = requestAnimationFrame(step);
			});
		}

		function crossfade(from, to) {
			const incoming = o.getLive(to);
			hold(s.held, o.getLive(from), { visibility: "visible", opacity: "1", transition: "none", zIndex: "3" });
			hold(s.held, incoming, { visibility: "visible", opacity: "0", transition: "none", zIndex: "4" });
			if (incoming) {
				void incoming.offsetWidth;
				incoming.style.transition = "opacity 320ms ease";
				incoming.style.opacity = "1";
			}
			return new Promise((resolve) => setTimeout(resolve, 340));
		}

		// Before the leaf is removed, show the whole destination view under it and give the browser
		// two frames to paint it, so the hand-over from leaf to live page has no blink.
		async function land(to) {
			const token = s.token;
			const dest = o.getLive(to);
			if (dest) {
				dest.style.clipPath = "none";
				dest.style.zIndex = "4";
			}
			await frames(2);
			return token === s.token;
		}

		function finish(from, to) {
			o.commit(to, from);
			unstage();
			setBusy(false);
			runQueued();
		}

		function runQueued() {
			const q = s.queued;
			s.queued = 0;
			if (q) requestAnimationFrame(() => turn(q));
		}

		const leafTurn = (from, to) => !reduced() && (!o.flippable || o.flippable(from, to));

		function canGo(dir) {
			const from = o.getIndex();
			const to = from + dir;
			if (!dir || to < 0 || to >= o.count()) return null;
			if (o.canTurn && !o.canTurn()) return null;
			return { from, to };
		}

		async function turn(dir, opts = {}) {
			if (s.busy || s.drag) {
				if (opts.queue !== false && !s.queued) s.queued = dir;
				return;
			}
			const go = canGo(dir);
			if (!go) return;
			hideCurl(true);
			setBusy(true);
			if (!leafTurn(go.from, go.to)) {
				await crossfade(go.from, go.to);
				return finish(go.from, go.to);
			}
			const g = geometry(Math.min(go.from, go.to), Math.max(go.from, go.to));
			if (!(await stage(g))) { setBusy(false); return; }
			const a = dir > 0 ? 0 : -180;
			await animate(a, dir > 0 ? -180 : 0, duration, EASE_TURN);
			if (await land(go.to)) finish(go.from, go.to);
		}

		function thetaFor(d, x) {
			const g = d.g;
			const reach = Math.max(1, g.fb.x1 - g.spine);
			const restEdge = d.dir > 0 ? g.spine + reach : g.spine - reach;
			const c = Math.min(1, Math.max(-1, (restEdge + (x - d.startX) - g.spine) / reach));
			return -Math.acos(c) * 180 / Math.PI;
		}

		function beginDrag(dir, x) {
			if (s.busy || s.drag) return false;
			const go = canGo(dir);
			if (!go) return false;
			// Pairs that only crossfade have no leaf to drag; the host falls back to a tap/turn.
			if (!reduced() && !leafTurn(go.from, go.to)) return false;
			hideCurl(true);
			const g = geometry(Math.min(go.from, go.to), Math.max(go.from, go.to));
			const d = { dir, ...go, g, startX: x, moved: false, ready: false, ended: false, released: false, theta: dir > 0 ? 0 : -180, reduced: reduced() };
			s.drag = d;
			setBusy(true);
			if (d.reduced) { d.ready = true; return true; }
			stage(g).then((ok) => {
				if (s.drag !== d) return;
				if (!ok) { s.drag = null; setBusy(false); return; }
				d.ready = true;
				render(d.theta);
				if (d.ended) settle(d);
			});
			return true;
		}

		function dragTo(x) {
			const d = s.drag;
			if (!d || d.released) return;
			if (Math.abs(x - d.startX) > 6) d.moved = true;
			if (d.reduced) { d.lastX = x; return; }
			d.theta = thetaFor(d, x);
			if (d.ready) render(d.theta);
		}

		function endDrag(x) {
			const d = s.drag;
			if (!d) return;
			if (typeof x === "number") dragTo(x);
			d.ended = true;
			if (d.ready) settle(d);
		}

		function cancelDrag() {
			const d = s.drag;
			if (!d) return;
			d.cancelled = true;
			endDrag();
		}

		async function settle(d) {
			if (d.released) return;
			d.released = true;
			const p = -d.theta / 180;
			let complete = !d.moved || (d.dir > 0 ? p > 0.5 : p < 0.5);
			if (d.reduced && d.moved) complete = Math.sign(d.startX - (d.lastX ?? d.startX)) === d.dir;
			if (d.cancelled) complete = false;
			if (d.reduced) {
				s.drag = null;
				if (complete) { await crossfade(d.from, d.to); finish(d.from, d.to); }
				else { setBusy(false); runQueued(); }
				return;
			}
			const target = complete === (d.dir > 0) ? -180 : 0;
			const ms = d.moved ? Math.max(220, duration * Math.abs(target - d.theta) / 180) : duration;
			await animate(d.theta, target, ms, d.moved ? EASE_RELEASE : EASE_TURN);
			s.drag = null;
			if (complete) { if (await land(d.to)) finish(d.from, d.to); }
			else { unstage(); setBusy(false); runQueued(); }
		}

		/* Hover hint: a small dog-ear at the page corner closest to the pointer. */
		// Off unless the host passes `cornerHint: true`.
		function hover(x, y) {
			if (!o.cornerHint) return;
			if (x == null || s.busy || s.drag || !finePointer.matches || reduced()) return hideCurl();
			const i = o.getIndex();
			const radius = o.curlRadius || 110;
			const corners = [];
			const ready = (k) => !o.isReady || o.isReady(k);
			if (i + 1 < o.count() && leafTurn(i, i + 1) && ready(i + 1)) {
				const b = o.box(i, "front");
				corners.push({ cx: b.x1, cy: b.y0, sx: 1, sy: -1, dir: 1 }, { cx: b.x1, cy: b.y1, sx: 1, sy: 1, dir: 1 });
			}
			if (i > 0 && o.spine() > 0 && leafTurn(i, i - 1) && ready(i - 1)) {
				const b = o.box(i, "back");
				corners.push({ cx: b.x0, cy: b.y0, sx: -1, sy: -1, dir: -1 }, { cx: b.x0, cy: b.y1, sx: -1, sy: 1, dir: -1 });
			}
			let best = null;
			for (const c of corners) {
				const dist = Math.hypot(x - c.cx, y - c.cy);
				if (dist < radius && (!best || dist < best.dist)) best = { ...c, dist };
			}
			if (!best) return hideCurl();
			showCurl(best, o.curlSize || 42);
		}

		function curlGeometry(c, size) {
			const A = [c.cx - c.sx * size, c.cy], B = [c.cx, c.cy - c.sy * size], C = [c.cx, c.cy];
			const pt = (p) => `${px(p[0])} ${px(p[1])}`;
			const cut = `polygon(evenodd, 0px 0px, ${px(W)} 0px, ${px(W)} ${px(H)}, 0px ${px(H)}, 0px 0px, ${pt(A)}, ${pt(B)}, ${pt(C)}, ${pt(A)}, 0px 0px)`;
			const square = ["0% 0%", "100% 0%", "100% 100%", "0% 100%"];
			const skip = c.sx > 0 ? (c.sy > 0 ? 2 : 1) : (c.sy > 0 ? 3 : 0);
			return {
				cut,
				flapClip: `polygon(${square.filter((_, k) => k !== skip).join(", ")})`,
				left: c.sx > 0 ? c.cx - size : c.cx,
				top: c.sy > 0 ? c.cy - size : c.cy,
				gradient: `linear-gradient(to ${c.sy > 0 ? "top" : "bottom"} ${c.sx > 0 ? "left" : "right"}, transparent 50%, var(--fb-flap-fold, #d6cfc2) 50%, var(--fb-flap-mid, #ece6da) 70%, var(--fb-flap-edge, #fbf8f1) 100%)`
			};
		}

		function showCurl(c, size) {
			const i = o.getIndex();
			const key = `${i}:${c.cx},${c.cy}`;
			// Same corner and already open: nothing to do. Re-cutting the page on every pointer
			// move would repaint the whole spread and make the cursor lag.
			if (s.curl && s.curl.key === key && !s.curl.closing) return;
			clearTimeout(s.curlTimer);
			const fresh = !s.curl || s.curl.key !== key;
			const current = o.getLive(i);
			if (s.curl) s.curl.closing = false;
			if (fresh) {
				hideCurl(true);
				s.curl = { key, c };
				// Reveal the neighbouring page under the lifted corner.
				hold(s.curlHeld, o.getLive(i + c.dir), { visibility: "visible", opacity: "1", transition: "none", zIndex: "1" });
				hold(s.curlHeld, current, { transition: "none", clipPath: curlGeometry(c, 0).cut });
				const g0 = curlGeometry(c, 0);
				Object.assign(flap.style, { transition: "none", left: px(g0.left), top: px(g0.top), width: "0px", height: "0px" });
				curl.style.filter = `drop-shadow(${-c.sx * 3}px ${-c.sy * 3}px 5px rgba(0,0,0,.3))`;
				curl.classList.add("is-on");
				void flap.offsetWidth;
			}
			const g = curlGeometry(c, size);
			if (current) {
				current.style.transition = "clip-path 160ms ease-out";
				current.style.clipPath = g.cut;
			}
			Object.assign(flap.style, {
				transition: "left 160ms ease-out, top 160ms ease-out, width 160ms ease-out, height 160ms ease-out",
				left: px(g.left), top: px(g.top), width: px(size), height: px(size),
				clipPath: g.flapClip, background: g.gradient
			});
		}

		function hideCurl(immediate) {
			if (!s.curl) return;
			const { c } = s.curl;
			const done = () => {
				curl.classList.remove("is-on");
				release(s.curlHeld);
				s.curl = null;
			};
			clearTimeout(s.curlTimer);
			if (immediate) return done();
			if (s.curl.closing) return;
			s.curl.closing = true;
			const g = curlGeometry(c, 0);
			const current = o.getLive(o.getIndex());
			if (current && s.curlHeld.has(current)) current.style.clipPath = g.cut;
			Object.assign(flap.style, { left: px(g.left), top: px(g.top), width: "0px", height: "0px" });
			s.curlTimer = setTimeout(done, 170);
		}

		function reset() {
			cancelAnimationFrame(s.raf);
			s.drag = null;
			s.queued = 0;
			hideCurl(true);
			unstage();
			setBusy(false);
		}

		function prewarm(index, face = "back") {
			if (s.busy || index < 0 || index >= o.count()) return;
			o.mount(face === "front" ? front.host : back.host, index, face);
		}

		return {
			turn, beginDrag, dragTo, endDrag, cancelDrag, hover, reset, prewarm,
			get busy() { return s.busy; },
			get dragging() { return !!s.drag; }
		};
	}

	/* Pointer wiring for hosts whose pages live in the same document. */
	function bindPointer(engine, surface, opts) {
		const edge = opts.edgeZone || 120;
		let p = null;
		surface.addEventListener("pointerdown", (e) => {
			if (e.button !== 0 || e.target.closest("a, button, input, textarea, select, [data-no-flip]")) return;
			const { x, y } = opts.toLogical(e);
			const W = opts.width();
			const dir = x > W - edge ? 1 : x < edge ? -1 : 0;
			p = { id: e.pointerId, x, y, started: false, touch: e.pointerType !== "mouse" };
			if (dir && engine.beginDrag(dir, x, y)) {
				p.started = true;
				surface.setPointerCapture?.(e.pointerId);
			}
		});
		surface.addEventListener("pointermove", (e) => {
			const { x, y } = opts.toLogical(e);
			if (!p || p.id !== e.pointerId) {
				if (e.pointerType === "mouse" && !e.buttons) engine.hover(x, y);
				return;
			}
			if (!p.started && p.touch && Math.abs(x - p.x) > 12 && Math.abs(x - p.x) > Math.abs(y - p.y)) {
				if (engine.beginDrag(x < p.x ? 1 : -1, p.x, p.y)) {
					p.started = true;
					surface.setPointerCapture?.(e.pointerId);
				}
			}
			if (p.started) engine.dragTo(x);
		});
		surface.addEventListener("pointerup", (e) => {
			if (!p || p.id !== e.pointerId) return;
			if (p.started) engine.endDrag(opts.toLogical(e).x);
			p = null;
		});
		surface.addEventListener("pointercancel", (e) => {
			if (!p || p.id !== e.pointerId) return;
			if (p.started) engine.cancelDrag();
			p = null;
		});
		surface.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") engine.hover(null); });
	}

	/* Mouse wheel / trackpad: one turn per gesture, inertia is swallowed. */
	function bindWheel(engine, target, opts = {}) {
		let acc = 0;
		let lockUntil = 0;
		target.addEventListener("wheel", (e) => {
			if (opts.enabled && !opts.enabled()) return;
			const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
			e.preventDefault();
			const now = performance.now();
			if (engine.busy || now < lockUntil) {
				lockUntil = Math.max(lockUntil, now + 180);
				acc = 0;
				return;
			}
			acc += e.deltaMode === 1 ? delta * 16 : delta;
			if (Math.abs(acc) < 40) return;
			engine.turn(acc > 0 ? 1 : -1, { queue: false });
			acc = 0;
			lockUntil = now + 450;
		}, { passive: false });
	}

	root.Flipbook = { create: createFlipbook, bindPointer, bindWheel, cubicBezier };
})(window);
