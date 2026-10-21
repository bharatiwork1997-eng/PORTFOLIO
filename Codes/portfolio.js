const spreads = [
	{ title: "About me", src: "sketchbook-frame 1-html-css/sketchbook-group.html?v=3" },
	{ title: "Clustr + assessment", src: "sketchbook-frame 2-html-css/sketchbook-group.html?v=6" },
	{ title: "Agency + college", src: "sketchbook-frame 3-html-css/sketchbook-group.html?v=4" },
	{ title: "Personal work + résumé", src: "sketchbook-frame 4-html-css/sketchbook-group.html" },
	{ title: "Sketch + collage", src: "sketchbook-frame 5-html-css/sketchbook-group.html?v=6" },
	{ title: "Thank you", src: "last-frame-html-css/last-group.html?v=3" }
];
const spreadNavigationArtwork = [
	".row-bottom",
	".row-bottom",
	".img1, .img7",
	".img4, .img5",
	".row-bottom2",
	null
];

const stories = {
	clustr: {
		kicker: "UX / UI · Volunteering app",
		title: "CLUSTR",
		intro: "A volunteering app concept, developed as a UX / UI case study.",
		sections: [["The opportunity", "Add the challenge, audience, and context behind the project."], ["The process", "Add research, key flows, wireframes, and the decisions that shaped the experience."], ["The outcome", "Add final screens, prototype links, and what you learned."]]
	},
	assessment: {
		kicker: "UX / UI · Assessment work",
		title: "Assessment work",
		intro: "A home for your selected UX / UI assessment project and its design story.",
		sections: [["Brief", "Add the prompt, constraints, and intended audience."], ["Approach", "Show the thinking, task flows, and iterations behind the work."], ["Result", "Add the final design and any reflection or feedback."]]
	},
	agency: {
		kicker: "Visual design · Agency work",
		title: "Beauty brands",
		intro: "Selected brand communication work from your advertising-agency practice.",
		sections: [["The work", "Add the brands, campaign context, and your role on each project."], ["The craft", "Show the visual systems, art direction, and campaign applications."], ["The impact", "Add outcomes or the thinking behind the final work."]]
	},
	college: {
		kicker: "Campaigns · College work",
		title: "Ideas in the making",
		intro: "A selection of fourth-year campaign concepts and experiments.",
		sections: [["The idea", "Add the audience insight and central campaign thought."], ["The expression", "Show how the concept moved across formats and touchpoints."], ["The learning", "Add what you would carry into the next project."]]
	},
	personal: {
		kicker: "Personal work · Illustration + collage",
		title: "Outside the grid",
		intro: "Experiments with illustration, collage, and mixed-media textures.",
		sections: [["Materials", "Add notes about the tools, textures, and techniques you explored."], ["Inspiration", "Share what sparked each experiment."], ["More to come", "This collection can grow as you add new work."]]
	}
};

const cover = document.querySelector("#cover");
const portfolio = document.querySelector("#portfolio");
const coverFrame = document.querySelector("#cover-frame");
let activeFrame = document.querySelector("#frame-a");
let standbyFrame = document.querySelector("#frame-b");
const bookScene = document.querySelector("#book-scene");
const bookStage = document.querySelector("#book-stage");
const storyDialog = document.querySelector("#story-dialog");
const resumeDialog = document.querySelector("#resume-dialog");
const contactDialog = document.querySelector("#contact-dialog");
const toast = document.querySelector("#toast");
const pencil = document.querySelector(".pencil-cursor");
const pageName = document.querySelector("#page-name");
const pageCount = document.querySelector("#page-count");
const workspaceTools = document.querySelector("#workspace-tools");
const stickerSize = document.querySelector("#sticker-size");

let pageIndex = 0;
let turnBusy = false;
let openingBook = false;
let wheelLocked = false;
let wheelUnlockTimer;
let toastTimer;
let activeSticker = null;
let activeFrameDocument = null;
let stickerBank = [];
let gesture = null;

function fitCanvas(iframe, width, height, parent) {
	const resize = () => {
		const scale = Math.min(parent.clientWidth / width, parent.clientHeight / height);
		iframe.style.transform = `scale(${scale})`;
		iframe.style.left = `${Math.max(0, (parent.clientWidth - width * scale) / 2)}px`;
		iframe.style.top = `${Math.max(0, (parent.clientHeight - height * scale) / 2)}px`;
	};
	resize();
	new ResizeObserver(resize).observe(parent);
}

fitCanvas(coverFrame, 1920, 1080, document.querySelector(".cover-art"));

function fitBookScene() {
	bookScene.style.setProperty("--book-scale", String(bookStage.clientWidth / 1280));
}

new ResizeObserver(fitBookScene).observe(bookStage);

function showToast(message) {
	toast.textContent = message;
	toast.classList.add("visible");
	clearTimeout(toastTimer);
	toastTimer = setTimeout(() => toast.classList.remove("visible"), 2200);
}

function updateBookControls() {
	pageCount.textContent = String(pageIndex + 1).padStart(2, "0");
	pageName.textContent = spreads[pageIndex].title;
	document.querySelector("#previous-page").disabled = pageIndex === 0 || turnBusy;
	document.querySelector("#next-page").disabled = pageIndex === spreads.length - 1 || turnBusy;
	if (workspaceTools) workspaceTools.hidden = true;
}

function prepareFrame(iframe, src) {
	return new Promise((resolve) => {
	iframe.onload = () => {
		try {
			const frameDocument = iframe.contentDocument;
			if (!frameDocument) { resolve(); return; }
			const style = frameDocument.createElement("style");
			style.textContent = `
				html, body { width:1280px !important; height:900px !important; min-height:0 !important; overflow:hidden !important; background-color:#000 !important; }
				body { padding:28px 24px !important; }
				body, body * { cursor:none !important; }
				body img, body object { transition:transform 220ms ease, filter 220ms ease; }
				body img:not(.collage-sticker):hover { filter:drop-shadow(0 4px 5px rgba(34,25,17,.16)); }
				body img:not(.collage-sticker):not(.img6):hover { transform:translateY(-3px) scale(1.025); }
				body img:not(.collage-sticker):not(.img6):active { transform:scale(.975); }
				body .collage-sticker:hover { filter:none !important; }
				body .img6 { animation:folio-cd-turn 13s linear infinite; }
				body .interactive-card { cursor:pointer !important; transition:transform 200ms ease, box-shadow 200ms ease, background-color 200ms ease; }
				body button, body .sketch-btn, body .collage-btn, body .collage-size-control input, body .img9, body .sticker-folder { cursor:pointer !important; }
				body .interactive-card:not(img):hover, body .interactive-card:not(img):focus-visible { transform:translateY(-5px) rotate(-.5deg); box-shadow:0 12px 24px rgba(30,24,18,.16); background-color:#fffdf6; }
				body img.interactive-card:hover, body img.interactive-card:focus-visible { background:transparent; box-shadow:none; }
				body .folio-canvas { position:absolute; z-index:8; inset:0; width:100%; height:100%; touch-action:none; cursor:crosshair !important; }
				body .draw-area, body .collage-layer { cursor:auto !important; }
				body .collage-layer { position:absolute; z-index:30; inset:0; overflow:hidden; pointer-events:none; }
				body .collage-sticker { position:absolute; max-width:none; height:auto; cursor:grab !important; pointer-events:auto; touch-action:none; user-select:none; filter:none !important; box-shadow:none !important; }
				body .collage-sticker.is-selected { outline:2px dashed #cb5d5b; outline-offset:4px; }
				body .collage-sticker.popping { animation: sticker-pop-in 340ms cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
				body .img9.is-popping { animation: folder-tap 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275); }
				@keyframes sticker-pop-in { 0% { transform: scale(0) translateY(-25px) rotate(-14deg); opacity: 0; } 70% { transform: scale(1.14) translateY(4px) rotate(4deg); opacity: 1; } 100% { transform: scale(1) translateY(0) rotate(0deg); opacity: 1; } }
				@keyframes folder-tap { 0% { transform: scale(1); } 35% { transform: scale(1.18, 0.84) rotate(-3deg); } 70% { transform: scale(0.92, 1.1) rotate(2deg); } 100% { transform: scale(1) rotate(0deg); } }
				body .spread-arrow-hit-area { position:absolute; z-index:120; display:grid; width:88px; height:88px; padding:0; place-items:center; border:0; border-radius:50%; background:transparent; color:#262626; font:32px/1 'Geist Pixel'; cursor:pointer !important; }
				body .spread-arrow-hit-area:hover { background:radial-gradient(circle, rgba(203,93,91,.12), transparent 68%); color:#b55351; }
				body .spread-arrow-hit-area:focus-visible { outline:2px solid #cb5d5b; outline-offset:0; }
				body .sticker-folder-trigger { position:absolute; z-index:18; top:-8px; left:32px; width:120px; height:160px; border:0; background:transparent; cursor:pointer !important; }
				@keyframes folio-cd-turn { to { transform:rotate(360deg); } }
				@media (prefers-reduced-motion:reduce) { body img, body object { transition:none !important; } body .img6 { animation:none !important; } }
			`;
			const frameIndex = spreads.findIndex((spread) => spread.src === src);
			const navigationArtwork = spreadNavigationArtwork[frameIndex];
			if (navigationArtwork) style.textContent += `body ${navigationArtwork} { display:none !important; }`;
			if (frameIndex === 2) style.textContent += `body > .row { padding:116px 86px 65px 117px !important; } body > .row > .col { margin-left:399px !important; }`;
			frameDocument.head.append(style);
			frameDocument.body.style.width = "1280px";
			frameDocument.body.style.height = "900px";
			frameDocument.body.style.minHeight = "0";
			frameDocument.body.style.padding = "28px 24px";
			frameDocument.body.style.overflow = "hidden";
			frameDocument.documentElement.style.overflow = "hidden";
			frameDocument.addEventListener("pointermove", (event) => handleFramePointer(iframe, event));
			frameDocument.addEventListener("pointerdown", (event) => startEdgeGesture(frameDocument, event), { passive: true });
			frameDocument.addEventListener("pointerup", (event) => finishGesture(event));
			frameDocument.addEventListener("pointercancel", cancelGesture);
			frameDocument.addEventListener("wheel", handleWheelNavigation, { passive: false });
			frameDocument.addEventListener("click", (event) => {
				const target = event.target;
				let action = null;
				if (frameIndex === 1 && target.closest(".text-input1")) action = () => openStory("clustr");
				else if (frameIndex === 1 && target.closest(".text-input2")) action = () => openStory("assessment");
				else if (frameIndex === 2 && target.closest(".text-input, .text1, .text2")) action = () => openStory("agency");
				else if (frameIndex === 2 && target.closest(".text-top, .text-campaigns, .img6")) action = () => openStory("college");
				else if (frameIndex === 3 && target.closest(".img2")) action = () => resumeDialog.showModal();
				else if (frameIndex === 3 && target.closest(".text-input, .img3")) action = () => openStory("personal");
				else if (frameIndex === 4 && target.closest("#sticker-folder, .img9, .sticker-folder")) action = addSticker;
				if (action) {
					event.preventDefault();
					event.stopImmediatePropagation();
					action();
				}
			}, true);
			frameDocument.addEventListener("click", (event) => {
				const target = event.target;
				if (frameIndex === 5 && target.closest(".title-thankyou, .slider, .shaving-deco, .thankyou-stage")) contactDialog.showModal();
			});
			activeFrameDocument = frameDocument;
			setupSpreadInteractions(frameDocument, frameIndex);
		} catch (error) {
			console.error("Could not prepare portfolio spread", error);
		}
		resolve();
	};
	iframe.src = src;
	});
}

function handleFramePointer(iframe, event) {
	if (iframe !== activeFrame) return;
	const rect = iframe.getBoundingClientRect();
	if (event.target.closest(".spread-arrow-hit-area, button, .sketch-btn, .collage-btn, .collage-size-control, .img9, #sticker-folder, .sticker-folder, [role='button']")) {
		hidePencil();
		return;
	}
	if (pageIndex === 4 && event.clientX > 640) {
		hidePencil();
		return;
	}
	movePencil(rect.left + event.clientX * rect.width / 1280, rect.top + event.clientY * rect.height / 900);
}

function movePencil(x, y) {
	if (matchMedia("(hover: none)").matches) return;
	document.body.classList.add("pencil-active");
	pencil.style.left = `${x}px`;
	pencil.style.top = `${y}px`;
	pencil.style.display = "block";
}

function hidePencil() {
	document.body.classList.remove("pencil-active");
	pencil.style.display = "none";
}

function setupCover() {
	const initCover = () => {
		try {
			const frameDocument = coverFrame.contentDocument;
			if (!frameDocument || !frameDocument.body) return;
			const style = frameDocument.createElement("style");
			style.textContent = `
				html, body { width:1920px !important; height:1080px !important; min-height:0 !important; overflow:hidden !important; background-color:#000 !important; cursor:none !important; }
				body, body * { cursor:none !important; user-select:none !important; }
			`;
			frameDocument.head.append(style);
			frameDocument.documentElement.style.overflow = "hidden";
			frameDocument.documentElement.style.scrollbarWidth = "none";
			frameDocument.body.style.width = "1920px";
			frameDocument.body.style.height = "1080px";
			frameDocument.body.style.minHeight = "0";
			frameDocument.body.style.padding = "103px 24px 0";
			frameDocument.body.style.overflow = "hidden";
			frameDocument.body.style.scrollbarWidth = "none";
			frameDocument.addEventListener("wheel", handleWheelNavigation, { passive: false });
			frameDocument.addEventListener("pointermove", (event) => {
				const rect = coverFrame.getBoundingClientRect();
				movePencil(rect.left + event.clientX * rect.width / 1920, rect.top + event.clientY * rect.height / 1080);
			});
			frameDocument.addEventListener("click", () => {
				openBook();
			});
		} catch (error) {
			console.error("Could not prepare the portfolio cover", error);
		}
	};

	if (coverFrame.contentDocument?.readyState === "complete" && coverFrame.contentDocument.body) {
		initCover();
	}
	coverFrame.addEventListener("load", initCover);
}

function openBook() {
	if (openingBook || !portfolio.hidden) return;
	openingBook = true;
	wheelLocked = true;
	cover.classList.add("is-opening");
	const duration = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 620;
	setTimeout(async () => {
		pageIndex = 0;
		activeFrame.classList.add("is-active");
		standbyFrame.classList.remove("is-active");
		await prepareFrame(activeFrame, spreads[pageIndex].src);
		cover.hidden = true;
		cover.classList.remove("is-opening");
		portfolio.hidden = false;
		fitBookScene();
		updateBookControls();
		bookStage.scrollIntoView({ behavior: "smooth", block: "center" });
		openingBook = false;
		setTimeout(() => { wheelLocked = false; }, 350);
	}, duration);
}

function returnHome() {
	clearTimeout(wheelUnlockTimer);
	wheelLocked = true;
	openingBook = false;
	cover.classList.remove("is-opening");
	cover.hidden = false;
	portfolio.hidden = true;
	pageIndex = 0;
	gesture = null;
	updateBookControls();
	window.scrollTo({ top: 0, behavior: "smooth" });
	setTimeout(() => { wheelLocked = false; }, 350);
}

function handleWheelNavigation(event) {
	if (storyDialog?.open || resumeDialog?.open || contactDialog?.open) return;

	// Pick dominant delta (supports vertical wheel and horizontal swipe)
	const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
	if (Math.abs(delta) < 12 && event.deltaMode === 0) return;

	event.preventDefault();

	// If currently turning or within cooldown lock, ignore trailing events WITHOUT extending cooldown
	if (wheelLocked || turnBusy || openingBook) return;

	const direction = delta > 0 ? 1 : -1;

	// Lock immediately for this gesture and do NOT let trailing events extend this timer
	wheelLocked = true;
	clearTimeout(wheelUnlockTimer);
	wheelUnlockTimer = setTimeout(() => {
		wheelLocked = false;
	}, 400);

	if (!cover.hidden) {
		if (direction > 0) openBook();
	} else if (!portfolio.hidden) {
		if (pageIndex === 0 && direction < 0) {
			returnHome();
		} else if (pageIndex + direction >= 0 && pageIndex + direction < spreads.length) {
			turnPage(direction);
		}
	}
}

async function turnPage(direction) {
	const nextIndex = pageIndex + direction;
	if (turnBusy || nextIndex < 0 || nextIndex >= spreads.length) return;
	turnBusy = true;
	const nextSpread = spreads[nextIndex];
	pageIndex = nextIndex;
	updateBookControls();

	// Load next spread into standby frame behind active frame (no white/grey flash!)
	await prepareFrame(standbyFrame, nextSpread.src);

	// Swap frames: standby becomes active on top, previous active fades out
	standbyFrame.classList.add("is-active");
	activeFrame.classList.remove("is-active");

	const previousActive = activeFrame;
	activeFrame = standbyFrame;
	standbyFrame = previousActive;
	activeFrameDocument = activeFrame.contentDocument;

	await new Promise((resolve) => setTimeout(resolve, 240));
	turnBusy = false;
	wheelLocked = false;
	updateBookControls();
}

function startEdgeGesture(frameDocument, event) {
	if (event.target.closest("button, a, input, canvas, .collage-sticker")) return;
	const side = event.clientX < 75 ? "left" : event.clientX > 1205 ? "right" : null;
	if (!side || (side === "left" && pageIndex === 0) || (side === "right" && pageIndex === spreads.length - 1)) return;
	gesture = { side, x: event.clientX, y: event.clientY, id: event.pointerId };
}

function cancelGesture() {
	gesture = null;
}

function finishGesture(event) {
	if (!gesture || event.pointerId !== gesture.id) return;
	const delta = event.clientX - gesture.x;
	const forward = gesture.side === "right" && delta < -42;
	const backward = gesture.side === "left" && delta > 42;
	const tap = Math.abs(delta) <= 42;
	const tapForward = tap && gesture.side === "right";
	const tapBackward = tap && gesture.side === "left";
	cancelGesture();
	if (forward || tapForward) turnPage(1);
	else if (backward || tapBackward) turnPage(-1);
}

function openStory(key) {
	const story = stories[key];
	if (!story) return;
	document.querySelector("#story-kicker").textContent = story.kicker;
	document.querySelector("#story-title").textContent = story.title;
	document.querySelector("#story-intro").textContent = story.intro;
	document.querySelector("#story-sections").replaceChildren(...story.sections.map(([heading, body]) => {
		const section = document.createElement("section");
		const title = document.createElement("h2");
		const paragraph = document.createElement("p");
		title.textContent = heading;
		paragraph.textContent = body;
		section.append(title, paragraph);
		return section;
	}));
	storyDialog.showModal();
}

function makeInteractive(element, label, action) {
	if (!element) return;
	element.classList.add("interactive-card");
	element.setAttribute("role", "button");
	element.setAttribute("tabindex", "0");
	element.setAttribute("aria-label", label);
	element.addEventListener("click", (event) => { event.stopPropagation(); action(); });
	element.addEventListener("keydown", (event) => {
		if (event.key === "Enter" || event.key === " ") { event.preventDefault(); action(); }
	});
}

function setupSpreadInteractions(frameDocument, index = pageIndex) {
	if (index === 1) {
		makeInteractive(frameDocument.querySelector(".text-input1"), "Open the CLUSTR volunteering app case study", () => openStory("clustr"));
		makeInteractive(frameDocument.querySelector(".text-input2"), "Open assessment work", () => openStory("assessment"));
	}
	if (index === 2) {
		makeInteractive(frameDocument.querySelector(".text-input"), "Open agency work", () => openStory("agency"));
		makeInteractive(frameDocument.querySelector(".text1"), "Open agency work", () => openStory("agency"));
		makeInteractive(frameDocument.querySelector(".text2"), "Open beauty brand work", () => openStory("agency"));
		makeInteractive(frameDocument.querySelector(".text-top"), "Open college campaign work", () => openStory("college"));
		makeInteractive(frameDocument.querySelector(".text-campaigns"), "Open college campaign work", () => openStory("college"));
		makeInteractive(frameDocument.querySelector(".img6"), "Open college campaign work", () => openStory("college"));
	}
	if (index === 3) {
		makeInteractive(frameDocument.querySelector(".img2"), "Open résumé", () => resumeDialog.showModal());
		makeInteractive(frameDocument.querySelector(".text-input"), "Open personal work", () => openStory("personal"));
		makeInteractive(frameDocument.querySelector(".img3"), "Open personal work", () => openStory("personal"));
	}
	if (index === 4) setupSketchbook(frameDocument);
}

function renderPencilDot(context, x, y) {
	context.save();
	context.fillStyle = "rgba(92, 96, 102, 0.65)";
	context.beginPath();
	context.arc(x, y, 1.8, 0, Math.PI * 2);
	context.fill();

	for (let g = 0; g < 8; g++) {
		const angle = Math.random() * Math.PI * 2;
		const radius = Math.random() * 2.5;
		const alpha = 0.15 + Math.random() * 0.35;
		context.fillStyle = `rgba(120, 124, 130, ${alpha.toFixed(2)})`;
		context.fillRect(
			x + Math.cos(angle) * radius - 0.6,
			y + Math.sin(angle) * radius - 0.6,
			1.2,
			1.2
		);
	}
	context.restore();
}

function renderPencilSegment(context, x0, y0, x1, y1) {
	const dx = x1 - x0;
	const dy = y1 - y0;
	const dist = Math.hypot(dx, dy);

	context.save();
	// Core line for continuous stroke body in light graphite grey
	context.lineCap = "round";
	context.lineJoin = "round";
	context.strokeStyle = "rgba(108, 112, 118, 0.45)";
	context.lineWidth = 3.4;
	context.beginPath();
	context.moveTo(x0, y0);
	context.lineTo(x1, y1);
	context.stroke();

	// Granular paper-tooth particles and graphite friction
	const step = 1.0;
	const steps = Math.min(100, Math.max(1, Math.ceil(dist / step)));
	for (let i = 0; i <= steps; i++) {
		const t = i / steps;
		const cx = x0 + dx * t;
		const cy = y0 + dy * t;

		// Micro core jitter
		const jx = (Math.random() - 0.5) * 1.5;
		const jy = (Math.random() - 0.5) * 1.5;
		const coreAlpha = 0.28 + Math.random() * 0.32;
		context.fillStyle = `rgba(92, 96, 102, ${coreAlpha.toFixed(2)})`;
		context.fillRect(cx + jx - 1, cy + jy - 1, 2.2, 2.2);

		// Peripheral tooth flecks
		const grainCount = 3 + Math.floor(Math.random() * 3);
		for (let g = 0; g < grainCount; g++) {
			const angle = Math.random() * Math.PI * 2;
			const radius = Math.random() * 2.5;
			const grainAlpha = 0.15 + Math.random() * 0.35;
			context.fillStyle = `rgba(120, 124, 130, ${grainAlpha.toFixed(2)})`;
			context.fillRect(
				cx + Math.cos(angle) * radius - 0.6,
				cy + Math.sin(angle) * radius - 0.6,
				1.2,
				1.2
			);
		}
	}
	context.restore();
}

function setupSketchbook(frameDocument) {
	const sketchArea = frameDocument.querySelector(".text-input1");
	const collageArea = frameDocument.querySelector(".text-input2");
	if (!sketchArea || !collageArea) return;
	if (sketchArea.querySelector("canvas")) return;
	sketchArea.classList.add("draw-area");
	const canvas = frameDocument.createElement("canvas");
	canvas.className = "folio-canvas";
	canvas.setAttribute("aria-label", "Draw on the sketchbook page");
	sketchArea.append(canvas);
	const context = canvas.getContext("2d");
	let drawing = false;
	let lastX = 0;
	let lastY = 0;
	const resizeCanvas = () => {
		const previous = canvas.width ? canvas.toDataURL() : "";
		const ratio = window.devicePixelRatio || 1;
		const width = sketchArea.clientWidth;
		const height = sketchArea.clientHeight;
		canvas.width = Math.max(1, Math.round(width * ratio));
		canvas.height = Math.max(1, Math.round(height * ratio));
		canvas.style.width = `${width}px`;
		canvas.style.height = `${height}px`;
		context.setTransform(ratio, 0, 0, ratio, 0, 0);
		if (previous) { const image = new Image(); image.onload = () => context.drawImage(image, 0, 0, width, height); image.src = previous; }
	};
	resizeCanvas();
	new ResizeObserver(resizeCanvas).observe(sketchArea);
	try {
		const saved = localStorage.getItem("bharati-sketch");
		if (saved) { const image = new Image(); image.onload = () => context.drawImage(image, 0, 0, sketchArea.clientWidth, sketchArea.clientHeight); image.src = saved; }
	} catch (error) { console.warn("Saved sketch could not be restored", error); }

	const getPos = (event) => {
		if (typeof event.offsetX === "number" && !isNaN(event.offsetX)) {
			return { x: event.offsetX, y: event.offsetY };
		}
		const rect = canvas.getBoundingClientRect();
		return { x: event.clientX - rect.left, y: event.clientY - rect.top };
	};

	canvas.addEventListener("pointerdown", (event) => {
		drawing = true;
		canvas.setPointerCapture(event.pointerId);
		const iframe = frameDocument.defaultView?.frameElement || activeFrame;
		const rect = iframe.getBoundingClientRect();
		movePencil(rect.left + event.clientX * rect.width / 1280, rect.top + event.clientY * rect.height / 900);
		const pos = getPos(event);
		lastX = pos.x;
		lastY = pos.y;
		renderPencilDot(context, lastX, lastY);
	});
	canvas.addEventListener("pointermove", (event) => {
		const iframe = frameDocument.defaultView?.frameElement || activeFrame;
		const rect = iframe.getBoundingClientRect();
		movePencil(rect.left + event.clientX * rect.width / 1280, rect.top + event.clientY * rect.height / 900);
		if (!drawing) return;
		const pos = getPos(event);
		renderPencilSegment(context, lastX, lastY, pos.x, pos.y);
		lastX = pos.x;
		lastY = pos.y;
	});
	canvas.addEventListener("pointerup", () => {
		if (drawing) {
			drawing = false;
			persistSketch(canvas);
		}
	});
	canvas.addEventListener("pointercancel", () => { drawing = false; });

	const drawButton = frameDocument.querySelector(".draw-btn, [data-tool='draw']");
	const clearButton = frameDocument.querySelector(".clear-btn, [data-tool='clear-drawing']");

	if (drawButton) {
		drawButton.addEventListener("click", (event) => {
			event.stopPropagation();
			drawButton.classList.add("active");
			showToast("Draw mode active. Sketch on the page!");
		});
	}

	if (clearButton) {
		clearButton.addEventListener("click", (event) => {
			event.stopPropagation();
			context.save();
			context.setTransform(1, 0, 0, 1, 0, 0);
			context.clearRect(0, 0, canvas.width, canvas.height);
			context.restore();
			localStorage.removeItem("bharati-sketch");
			showToast("Sketch cleared.");
		});
	}

	const layer = frameDocument.createElement("div");
	layer.className = "collage-layer";
	collageArea.append(layer);
	stickerBank = [
		"img1.png", "img2.png", "img3.png", "img4.png", "img5.png",
		"_7cea1.png", "_7cea2.png", "img6.png", "img7.png", "img8.png",
		"img10.png", "img11.png", "img12.png", "img13.png", "img14.png",
		"img15.png", "img16.png", "text-input.png", "rating.svg"
	].map((filename) => normalizeAssetUrl(`/sketchbook-frame 5-html-css/assets/${filename}`));

	const yellowFolder = frameDocument.querySelector("#sticker-folder, .img9");
	if (yellowFolder) {
		makeInteractive(yellowFolder, "Tap the folder to pop out a sticker", () => {
			addSticker();
		});
	}

	const stickerBtn = frameDocument.querySelector(".collage-tools [data-tool='sticker']");
	if (stickerBtn) {
		stickerBtn.addEventListener("click", (event) => {
			event.stopPropagation();
			addSticker();
		});
	}

	const frameStickerSize = frameDocument.querySelector("#collage-sticker-size");
	if (frameStickerSize) {
		frameStickerSize.addEventListener("input", (event) => {
			event.stopPropagation();
			if (!activeSticker) return;
			activeSticker.style.width = `${frameStickerSize.value}px`;
			if (stickerSize) stickerSize.value = frameStickerSize.value;
			persistStickers(layer);
		});
	}

	const clearCollageBtn = frameDocument.querySelector(".collage-tools [data-tool='clear-collage']");
	if (clearCollageBtn) {
		clearCollageBtn.addEventListener("click", (event) => {
			event.stopPropagation();
			clearCollage();
		});
	}

	const deleteBtn = frameDocument.querySelector(".collage-tools [data-tool='delete-sticker'], .collage-tools [data-tool='delete']");
	if (deleteBtn) {
		deleteBtn.addEventListener("click", (event) => {
			event.stopPropagation();
			deleteSticker();
		});
	}

	const downloadBtn = frameDocument.querySelector(".collage-tools [data-tool='download']");
	if (downloadBtn) {
		downloadBtn.addEventListener("click", (event) => {
			event.stopPropagation();
			downloadCollage();
		});
	}

	const shareBtn = frameDocument.querySelector(".collage-tools [data-tool='share']");
	if (shareBtn) {
		shareBtn.addEventListener("click", (event) => {
			event.stopPropagation();
			shareCollage();
		});
	}

	try {
		JSON.parse(localStorage.getItem("bharati-collage") || "[]").forEach((sticker) => {
			placeSticker(normalizeAssetUrl(sticker.src), sticker.x, sticker.y, sticker.size, layer);
		});
	} catch (error) { console.warn("Saved collage could not be restored", error); }
}

function persistSketch(canvas) {
	try { localStorage.setItem("bharati-sketch", canvas.toDataURL("image/png")); }
	catch (error) { showToast("Sketch is ready, but browser storage is full."); }
}

function normalizeAssetUrl(source) {
	const decoded = decodeURI(source.replace(/%25(?=[0-9a-f]{2})/gi, "%"));
	const rooted = decoded.startsWith("/") ? decoded : `/${decoded}`;
	return encodeURI(rooted);
}

let stickerSequence = 0;

function addSticker() {
	const doc = activeFrameDocument || activeFrame?.contentDocument;
	const layer = doc?.querySelector(".collage-layer");
	if (!layer) return;

	const folder = doc?.querySelector("#sticker-folder, .img9");
	if (folder) {
		folder.classList.remove("is-popping");
		void folder.offsetWidth;
		folder.classList.add("is-popping");
	}

	const src = stickerBank[stickerSequence % stickerBank.length];
	stickerSequence++;

	const sizeSlider = doc?.querySelector("#collage-sticker-size") || stickerSize;
	const size = Number(sizeSlider ? sizeSlider.value : 92);

	const x = Math.max(16, Math.min(layer.clientWidth - size - 16, (layer.clientWidth * 0.5) + (Math.random() * 50 - 25)));
	const y = 18 + (Math.random() * 32);

	placeSticker(src, x, y, size, layer, true);
	showToast("Sticker popped! Drag it to place on the sketchbook.");
}

function placeSticker(src, x, y, size, layer, isPopping = false) {
	const frameDocument = layer.ownerDocument || activeFrameDocument || activeFrame?.contentDocument;
	const sticker = frameDocument.createElement("img");
	sticker.className = `collage-sticker ${isPopping ? "popping" : ""}`;
	sticker.src = src;
	sticker.alt = "Movable collage sticker";
	sticker.draggable = false;
	sticker.style.left = `${x}px`;
	sticker.style.top = `${y}px`;
	sticker.style.width = `${size}px`;

	let highestZ = 35;
	frameDocument.querySelectorAll(".collage-sticker").forEach((s) => {
		const z = parseInt(s.style.zIndex || 30, 10);
		if (z > highestZ) highestZ = z;
	});
	sticker.style.zIndex = String(highestZ + 1);

	sticker.addEventListener("pointerdown", (event) => {
		event.preventDefault();
		sticker.classList.remove("popping");
		selectSticker(sticker);

		let maxZ = 35;
		frameDocument.querySelectorAll(".collage-sticker").forEach((s) => {
			const z = parseInt(s.style.zIndex || 30, 10);
			if (z > maxZ) maxZ = z;
		});
		sticker.style.zIndex = String(maxZ + 1);
		sticker.style.cursor = "grabbing";

		const startX = event.clientX;
		const startY = event.clientY;
		const initialX = Number.parseFloat(sticker.style.left) || 0;
		const initialY = Number.parseFloat(sticker.style.top) || 0;
		const scale = 1280 / bookStage.clientWidth;

		const move = (moveEvent) => {
			const currentWidth = Number.parseFloat(sticker.style.width) || size;
			const currentHeight = currentWidth * (sticker.naturalHeight / (sticker.naturalWidth || 1)) || currentWidth;
			const newX = initialX + (moveEvent.clientX - startX) * scale;
			const newY = initialY + (moveEvent.clientY - startY) * scale;

			const boundedX = Math.max(0, Math.min(layer.clientWidth - (currentWidth * 0.3), newX));
			const boundedY = Math.max(0, Math.min(layer.clientHeight - (currentHeight * 0.3), newY));

			sticker.style.left = `${boundedX}px`;
			sticker.style.top = `${boundedY}px`;
		};

		const finish = () => {
			sticker.style.cursor = "grab";
			frameDocument.removeEventListener("pointermove", move);
			frameDocument.removeEventListener("pointerup", finish);
			frameDocument.removeEventListener("pointercancel", finish);
			persistStickers(layer);
		};

		frameDocument.addEventListener("pointermove", move);
		frameDocument.addEventListener("pointerup", finish);
		frameDocument.addEventListener("pointercancel", finish);
	});

	sticker.addEventListener("click", (e) => {
		e.stopPropagation();
		selectSticker(sticker);
	});

	layer.append(sticker);
	selectSticker(sticker);
	if (isPopping) {
		setTimeout(() => sticker.classList.remove("popping"), 400);
	}
	persistStickers(layer);
}

function selectSticker(sticker) {
	const frameDocument = sticker?.ownerDocument || activeFrameDocument || activeFrame?.contentDocument;
	frameDocument?.querySelectorAll(".collage-sticker").forEach((item) => item.classList.toggle("is-selected", item === sticker));
	activeSticker = sticker;
	if (activeSticker) {
		const val = String(Math.round(activeSticker.getBoundingClientRect().width * 1280 / bookStage.clientWidth));
		if (stickerSize) stickerSize.value = val;
		const frameSlider = frameDocument?.querySelector("#collage-sticker-size");
		if (frameSlider) frameSlider.value = val;
	}
}

function persistStickers(layer) {
	if (!layer) return;
	const saved = [...layer.querySelectorAll(".collage-sticker")].map((sticker) => ({ src: sticker.getAttribute("src"), x: Number.parseFloat(sticker.style.left), y: Number.parseFloat(sticker.style.top), size: Number.parseFloat(sticker.style.width) }));
	try { localStorage.setItem("bharati-collage", JSON.stringify(saved)); }
	catch (error) { showToast("The collage could not be saved in this browser."); }
}

function exportCollage() {
	const doc = activeFrameDocument || activeFrame?.contentDocument;
	const board = doc?.querySelector(".text-input2");
	if (!board) return Promise.reject(new Error("Collage board is unavailable"));
	const ratio = 2;
	const canvas = document.createElement("canvas");
	canvas.width = board.clientWidth * ratio;
	canvas.height = board.clientHeight * ratio;
	const context = canvas.getContext("2d");
	context.scale(ratio, ratio);
	context.fillStyle = "#f2eff0";
	context.fillRect(0, 0, board.clientWidth, board.clientHeight);
	const stickers = [...board.querySelectorAll(".collage-sticker")];
	return Promise.all(stickers.map((sticker) => new Promise((resolve) => {
		const image = new Image();
		image.onload = () => {
			const x = Number.parseFloat(sticker.style.left);
			const y = Number.parseFloat(sticker.style.top);
			const width = Number.parseFloat(sticker.style.width);
			context.drawImage(image, x, y, width, width * image.naturalHeight / image.naturalWidth);
			resolve();
		};
		image.onerror = resolve;
		image.src = sticker.src;
	}))).then(() => canvas);
}

async function downloadCollage() {
	try {
		const canvas = await exportCollage();
		const link = document.createElement("a");
		link.download = "bharati-collage.png";
		link.href = canvas.toDataURL("image/png");
		link.click();
		showToast("Collage downloaded as a PNG.");
	} catch (error) { showToast("Add a sticker before downloading your collage."); }
}

async function shareCollage() {
	try {
		const canvas = await exportCollage();
		const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
		if (!blob) throw new Error("Could not make an image");
		const file = new File([blob], "bharati-collage.png", { type: "image/png" });
		if (navigator.share && navigator.canShare?.({ files: [file] })) await navigator.share({ title: "My Bharati Kamble collage", files: [file] });
		else { await downloadCollage(); showToast("Sharing is not available here, so the collage was downloaded."); }
	} catch (error) { if (error.name !== "AbortError") showToast("Sharing is not available in this browser."); }
}

function persistWorkspace() {
	const doc = activeFrameDocument || activeFrame?.contentDocument;
	const canvas = doc?.querySelector(".folio-canvas");
	const layer = doc?.querySelector(".collage-layer");
	if (canvas) persistSketch(canvas);
	if (layer) persistStickers(layer);
	showToast("Your sketch and collage are saved on this device.");
}

function clearSketch() {
	const doc = activeFrameDocument || activeFrame?.contentDocument;
	const canvas = doc?.querySelector(".folio-canvas");
	if (!canvas) return;
	const context = canvas.getContext("2d");
	context.save();
	context.setTransform(1, 0, 0, 1, 0, 0);
	context.clearRect(0, 0, canvas.width, canvas.height);
	context.restore();
	localStorage.removeItem("bharati-sketch");
	showToast("Sketch cleared.");
}

function clearCollage() {
	const doc = activeFrameDocument || activeFrame?.contentDocument;
	const layer = doc?.querySelector(".collage-layer");
	if (!layer) return;
	layer.replaceChildren();
	activeSticker = null;
	localStorage.removeItem("bharati-collage");
	showToast("Collage cleared.");
}

function deleteSticker() {
	const doc = activeFrameDocument || activeFrame?.contentDocument;
	const layer = doc?.querySelector(".collage-layer");
	if (!layer) return;
	const stickers = [...layer.querySelectorAll(".collage-sticker")];
	if (!stickers.length) {
		showToast("No stickers to delete.");
		return;
	}
	let target = activeSticker;
	if (!target || !target.isConnected || !layer.contains(target)) {
		target = stickers[stickers.length - 1];
	}
	target.remove();
	activeSticker = null;
	const remaining = [...layer.querySelectorAll(".collage-sticker")];
	if (remaining.length > 0) {
		selectSticker(remaining[remaining.length - 1]);
	}
	persistStickers(layer);
	showToast("Sticker deleted.");
}

document.querySelector(".cover-hit").addEventListener("click", openBook);
document.querySelector(".wordmark").addEventListener("click", (event) => {
	event.preventDefault();
	returnHome();
});
window.addEventListener("wheel", handleWheelNavigation, { passive: false });
document.querySelector("#previous-page").addEventListener("click", () => turnPage(-1));
document.querySelector("#next-page").addEventListener("click", () => turnPage(1));
document.querySelectorAll("[data-open-contact]").forEach((button) => button.addEventListener("click", () => contactDialog.showModal()));
document.querySelectorAll("[data-open-resume]").forEach((button) => button.addEventListener("click", () => resumeDialog.showModal()));
document.querySelectorAll("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
document.querySelector("#print-resume").addEventListener("click", () => window.print());
document.querySelectorAll("[data-tool]").forEach((button) => button.addEventListener("click", () => {
	switch (button.dataset.tool) {
		case "draw": showToast("Draw in the open space on the left page."); break;
		case "clear-drawing": clearSketch(); break;
		case "sticker": addSticker(); break;
		case "clear-collage": clearCollage(); break;
		case "delete-sticker": deleteSticker(); break;
		case "delete": deleteSticker(); break;
		case "download": downloadCollage(); break;
		case "share": shareCollage(); break;
	}
}));
stickerSize.addEventListener("input", () => {
	if (!activeSticker) return;
	activeSticker.style.width = `${stickerSize.value}px`;
	persistStickers(activeFrameDocument?.querySelector(".collage-layer"));
});
document.addEventListener("pointermove", (event) => movePencil(event.clientX, event.clientY));
document.addEventListener("pointerleave", hidePencil);
document.addEventListener("keydown", (event) => {
	if (cover.hidden && !storyDialog.open && !resumeDialog.open && !contactDialog.open) {
		if (pageIndex === 4 && activeSticker && (event.key === "Delete" || event.key === "Backspace")) {
			deleteSticker();
			return;
		}
		if (event.key === "ArrowRight") turnPage(1);
		if (event.key === "ArrowLeft") turnPage(-1);
	}
});

setupCover();
updateBookControls();