const spreads = [
	{ title: "About me", src: "sketchbook-frame 1-html-css/sketchbook-group.html?v=3" },
	{ title: "Clustr + assessment", src: "sketchbook-frame 2-html-css/sketchbook-group.html?v=20" },
	{ title: "Agency + college", src: "sketchbook-frame 3-html-css/sketchbook-group.html?v=10" },
	{ title: "Personal work + résumé", src: "sketchbook-frame 4-html-css/sketchbook-group.html?v=3" },
	{ title: "Sketch + collage", src: "sketchbook-frame 5-html-css/sketchbook-group.html?v=12" },
	{ title: "Thank you", src: "last-frame-html-css/last-group.html?v=8" }
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
const videoDialog = document.querySelector("#video-dialog");
const lostVideo = document.querySelector("#lost-video");
const assessmentDialog = document.querySelector("#assessment-dialog");
const assessmentVideo = document.querySelector("#assessment-video");
const assessmentReelVideo = document.querySelector("#assessment-reel-video");
const agencyDialog = document.querySelector("#agency-dialog");
const clustrDialog = document.querySelector("#clustr-dialog");
const wattpadDialog = document.querySelector("#wattpad-dialog");
const toast = document.querySelector("#toast");
const pencil = document.querySelector(".pencil-cursor");
const arrowCursor = document.querySelector(".arrow-cursor");
const pageName = document.querySelector("#page-name");
const pageCount = document.querySelector("#page-count");
const workspaceTools = document.querySelector("#workspace-tools");
const stickerSize = document.querySelector("#sticker-size");
const siteFullscreenToggle = document.querySelector("#site-fullscreen-toggle");

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

let cachedBookRect = null;
let cachedCoverRect = null;

function updateFrameRects() {
	if (coverFrame && (!cover || !cover.hidden)) {
		cachedCoverRect = coverFrame.getBoundingClientRect();
	}
	const frameToMeasure = activeFrame || document.querySelector(".spread-frame.is-active") || spreadFrame1 || spreadFrame2;
	if (frameToMeasure && (!portfolio || !portfolio.hidden)) {
		cachedBookRect = frameToMeasure.getBoundingClientRect();
	}
}

window.addEventListener("resize", () => {
	updateFrameRects();
	fitBookScene();
	updateBookControls();
}, { passive: true });
window.addEventListener("scroll", updateFrameRects, { passive: true });

function fitCanvas(iframe, width, height, parent) {
	const resize = () => {
		const scale = Math.min(parent.clientWidth / width, parent.clientHeight / height);
		iframe.style.transform = `scale(${scale})`;
		iframe.style.left = `${Math.max(0, (parent.clientWidth - width * scale) / 2)}px`;
		iframe.style.top = `${Math.max(0, (parent.clientHeight - height * scale) / 2)}px`;
		updateFrameRects();
	};
	resize();
	new ResizeObserver(resize).observe(parent);
}

fitCanvas(coverFrame, 1920, 1080, document.querySelector(".cover-art"));

function fitBookScene() {
	const scale = bookStage.clientWidth / 1280;
	bookScene.style.setProperty("--book-scale", String(scale));
	bookScene.style.setProperty("--book-offset-x", "0px");
	updateFrameRects();
}

new ResizeObserver(fitBookScene).observe(bookStage);

function showToast(message) {
	toast.textContent = message;
	toast.classList.add("visible");
	clearTimeout(toastTimer);
	toastTimer = setTimeout(() => toast.classList.remove("visible"), 2200);
}

function updateBookControls() {
	const prevBtn = document.querySelector("#previous-page");
	const nextBtn = document.querySelector("#next-page");
	const pageTotal = document.querySelector("#page-total");
	const coverIndicator = document.querySelector("#cover-page-indicator");

	const curr = pageIndex + 1;
	const total = spreads.length;
	pageCount.textContent = String(curr).padStart(2, "0");
	if (pageTotal) pageTotal.textContent = String(total).padStart(2, "0");
	pageName.textContent = spreads[pageIndex].title;
	if (prevBtn) prevBtn.disabled = pageIndex === 0 || turnBusy;
	if (nextBtn) nextBtn.disabled = pageIndex === total - 1 || turnBusy;
	if (coverIndicator) coverIndicator.textContent = "01 / 06";

	if (workspaceTools) workspaceTools.hidden = true;
	if (arrowCursor) arrowCursor.style.display = "none";

	const isMobile = window.innerWidth <= 768;
	const activeDoc = activeFrame?.contentDocument;
	if (activeDoc?.body && activeFrame?.dataset?.src?.includes("last-group")) {
		activeDoc.body.classList.toggle("is-mobile-view", isMobile);
	}
	const standbyDoc = standbyFrame?.contentDocument;
	if (standbyDoc?.body && standbyFrame?.dataset?.src?.includes("last-group")) {
		standbyDoc.body.classList.toggle("is-mobile-view", isMobile);
	}
}

function prepareFrame(iframe, src) {
	return new Promise((resolve) => {
	if (iframe.dataset.src === src && iframe.contentDocument?.body) {
		resolve();
		return;
	}
	iframe.dataset.src = src;
	iframe.onload = () => {
		try {
			const frameDocument = iframe.contentDocument;
			if (!frameDocument) { resolve(); return; }
			const style = frameDocument.createElement("style");
			style.textContent = `
				@media (hover: hover) and (pointer: fine) {
					html, body, *, *::before, *::after { cursor:none !important; }
				}
				@media (hover: none), (pointer: coarse) {
					html, body, *, *::before, *::after { cursor:auto !important; }
				}
				html, body { width:1280px !important; height:900px !important; min-height:0 !important; overflow:hidden !important; background-color:#000 !important; }
				body { padding:28px 24px !important; }
				body img, body object { transition:transform 220ms ease, filter 220ms ease; }
				body img:not(.collage-sticker):hover { filter:drop-shadow(0 4px 5px rgba(34,25,17,.16)); }
				body img:not(.collage-sticker):not(.img6):hover { transform:translateY(-3px) scale(1.025); }
				body img:not(.collage-sticker):not(.img6):active { transform:scale(.975); }
				body .collage-sticker:hover { filter:none !important; }
				body .img6 { animation:folio-cd-turn 13s linear infinite; }
				body .interactive-card { transition:transform 200ms ease, box-shadow 200ms ease, background-color 200ms ease; }
				body .interactive-card:not(img):hover, body .interactive-card:not(img):focus-visible { transform:translateY(-5px) rotate(-.5deg); box-shadow:0 12px 24px rgba(30,24,18,.16); background-color:#fffdf6; }
				body img.interactive-card:hover, body img.interactive-card:focus-visible { background:transparent; box-shadow:none; }
				body .folio-canvas { position:absolute; z-index:8; inset:0; width:100%; height:100%; touch-action:none; }
				body .collage-layer { position:absolute; z-index:30; inset:0; overflow:hidden; pointer-events:none; }
				body .collage-sticker { position:absolute; max-width:none; height:auto; pointer-events:auto; touch-action:none; user-select:none; filter:none !important; box-shadow:none !important; outline:none !important; }
				body .collage-sticker.is-selected { outline:none !important; border:none !important; box-shadow:none !important; }
				body .collage-sticker.popping { animation: sticker-pop-in 340ms cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
				body .img9.is-popping { animation: folder-tap 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275); }
				body .spread-arrow-hit-area { position:absolute; z-index:120; display:grid; width:88px; height:88px; padding:0; place-items:center; border:0; border-radius:50%; background:transparent; color:#262626; font:32px/1 'Geist Pixel'; }
				body .spread-arrow-hit-area:hover { background:radial-gradient(circle, rgba(203,93,91,.12), transparent 68%); color:#b55351; }
				body .spread-arrow-hit-area:focus-visible { outline:2px solid #cb5d5b; outline-offset:0; }
				body .sticker-folder-trigger { position:absolute; z-index:18; top:-8px; left:32px; width:120px; height:160px; border:0; background:transparent; }
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
			if (frameIndex === 5) {
				frameDocument.body.classList.toggle("is-mobile-view", window.innerWidth <= 768);
			}
			frameDocument.addEventListener("pointerenter", (event) => handleFramePointer(iframe, event));
			frameDocument.addEventListener("pointermove", (event) => handleFramePointer(iframe, event));
			frameDocument.addEventListener("pointerdown", (event) => startEdgeGesture(frameDocument, event), { passive: true });
			frameDocument.addEventListener("pointerup", (event) => finishGesture(event));
			frameDocument.addEventListener("pointercancel", cancelGesture);
			frameDocument.addEventListener("wheel", handleWheelNavigation, { passive: false });
			frameDocument.addEventListener("keydown", (event) => {
				const isZ = event.key === "z" || event.key === "Z" || event.code === "KeyZ";
				if (isZ && (event.metaKey || event.ctrlKey)) {
					if (frameIndex === 4 && typeof frameDocument.defaultView?.undoSketch === "function") {
						event.preventDefault();
						frameDocument.defaultView.undoSketch();
						return;
					}
				}
				const isDeleteKey = event.key === "Delete" || event.key === "Backspace" || event.key === "Del" || event.code === "Delete" || event.code === "Backspace" || event.code === "NumpadDecimal" || event.keyCode === 46 || event.keyCode === 8;
				if (frameIndex === 4 && isDeleteKey) {
					if (event.target.tagName === "INPUT" && event.target.type !== "range") return;
					event.preventDefault();
					deleteSticker();
					return;
				}
				if (event.key === "ArrowRight") turnPage(1);
				if (event.key === "ArrowLeft") turnPage(-1);
			});
			frameDocument.addEventListener("click", (event) => {
				const target = event.target;
				let action = null;
				if (frameIndex === 1 && target.closest(".text-input1, .graphic, .case-study-heading, .subtitle-clustr, .text-ux-ui-case-study")) action = () => openClustrDialog();
				else if (frameIndex === 1 && target.closest(".text-input2")) action = () => openAssessmentDialog();
				else if (frameIndex === 2 && target.closest(".rating")) action = () => {
					if (typeof frameDocument.defaultView?.dartFish === "function") {
						frameDocument.defaultView.dartFish();
					}
				};
				else if (frameIndex === 2 && target.closest(".img6")) action = () => openLostVideo();
				else if (frameIndex === 2 && target.closest(".text-input, .text1, .text2, .col-left")) action = () => openAgencyDialog();
				else if (frameIndex === 2 && target.closest(".img2, .img3, .text-top, .text-campaigns")) action = () => openWattpadDialog();
				else if (frameIndex === 3 && target.closest(".img2")) action = () => openDialog(resumeDialog);
				else if (frameIndex === 3 && target.closest(".text-input, .img3")) action = () => openStory("personal");
				else if (frameIndex === 4 && target.closest("#sticker-folder, .img9, .sticker-folder, .collage-tools, .sketch-tools, .folio-canvas, canvas, .collage-sticker")) return;
				if (action) {
					event.preventDefault();
					event.stopImmediatePropagation();
					action();
				}
			}, true);
			frameDocument.addEventListener("click", (event) => {
				const target = event.target;
				if (frameIndex === 5) {
					if (target.closest(".thankyou-link")) {
						return;
					}
					if (target.closest(".title-thankyou, .slider, .shaving-deco, .thankyou-stage")) {
						openDialog(contactDialog);
					}
				}
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
	if (event.pointerType === "touch" || window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 768) {
		hidePencil();
		return;
	}
	const rect = cachedBookRect || (iframe ? (cachedBookRect = iframe.getBoundingClientRect()) : null);
	if (!rect || rect.width === 0) return;
	const pageX = rect.left + (event.clientX * rect.width) / 1280;
	const pageY = rect.top + (event.clientY * rect.height) / 900;
	movePencil(pageX, pageY);
}

let targetPencilX = -200;
let targetPencilY = -200;
let pencilRafPending = false;
let pencilVisible = false;

function renderPencilCursor() {
	pencilRafPending = false;
	if (!pencil) return;
	pencil.style.transform = `translate3d(${targetPencilX}px, ${targetPencilY}px, 0)`;
}

function movePencil(x, y) {
	if (window.matchMedia("(hover: none)").matches || window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 768) {
		hidePencil();
		return;
	}
	targetPencilX = x;
	targetPencilY = y;
	if (!pencilVisible) {
		pencilVisible = true;
		if (pencil) pencil.classList.add("is-visible");
	}
	if (!pencilRafPending) {
		pencilRafPending = true;
		requestAnimationFrame(renderPencilCursor);
	}
}

function hidePencil() {
	pencilVisible = false;
	if (pencil) pencil.classList.remove("is-visible");
}

function setupCover() {
	const initCover = () => {
		try {
			const frameDocument = coverFrame.contentDocument;
			if (!frameDocument || !frameDocument.body) return;
			const style = frameDocument.createElement("style");
			style.textContent = `
				@media (hover: hover) and (pointer: fine) {
					html, body, *, *::before, *::after, input, button, textarea, select, a { cursor:none !important; }
				}
				@media (hover: none), (pointer: coarse) {
					html, body, *, *::before, *::after, input, button, textarea, select, a { cursor:auto !important; }
				}
				html, body, *, *::before, *::after { user-select:none !important; }
				html, body { width:1920px !important; height:1080px !important; min-height:0 !important; overflow:hidden !important; background-color:#000 !important; }
			`;
			frameDocument.head.append(style);
			frameDocument.documentElement.style.overflow = "hidden";
			if (frameIndex === 5) {
				frameDocument.body.classList.toggle("is-mobile-view", window.innerWidth <= 768);
			}
			frameDocument.documentElement.style.scrollbarWidth = "none";
			frameDocument.body.style.width = "1920px";
			frameDocument.body.style.height = "1080px";
			frameDocument.body.style.minHeight = "0";
			frameDocument.body.style.padding = "103px 24px 0";
			frameDocument.body.style.overflow = "hidden";
			frameDocument.body.style.scrollbarWidth = "none";
			frameDocument.addEventListener("wheel", handleWheelNavigation, { passive: false });
			frameDocument.addEventListener("pointerenter", (event) => {
				if (event.pointerType === "touch" || window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 768) return;
				const rect = cachedCoverRect || (coverFrame ? (cachedCoverRect = coverFrame.getBoundingClientRect()) : null);
				if (!rect || rect.width === 0) return;
				movePencil(rect.left + (event.clientX * rect.width) / 1920, rect.top + (event.clientY * rect.height) / 1080);
			});
			frameDocument.addEventListener("pointermove", (event) => {
				if (event.pointerType === "touch" || window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 768) return;
				const rect = cachedCoverRect || (coverFrame ? (cachedCoverRect = coverFrame.getBoundingClientRect()) : null);
				if (!rect || rect.width === 0) return;
				movePencil(rect.left + (event.clientX * rect.width) / 1920, rect.top + (event.clientY * rect.height) / 1080);
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

	// Mobile / Touch: trigger fullscreen when opening the sketchbook
	const isTouch = window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
	if (isTouch && !isFullscreen()) {
		requestFullscreenSafe();
	}

	const duration = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 540;
	setTimeout(async () => {
		pageIndex = 0;
		mobilePageIndex = 0;
		activeFrame.classList.add("is-active");
		standbyFrame.classList.remove("is-active");
		if (activeFrame.dataset.src !== spreads[pageIndex].src) {
			await prepareFrame(activeFrame, spreads[pageIndex].src);
		}
		cover.hidden = true;
		cover.classList.remove("is-opening");
		portfolio.hidden = false;
		fitBookScene();
		updateBookControls();
		updateFrameRects();
		bookStage.scrollIntoView({ behavior: "smooth", block: "center" });
		openingBook = false;
		setTimeout(() => { wheelLocked = false; }, 300);

		// Immediately preload Spread 1 in background so user doesn't wait when clicking Next!
		preloadNextSpread(1);
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
	mobilePageIndex = 0;
	gesture = null;
	updateBookControls();
	window.scrollTo({ top: 0, behavior: "smooth" });
	updateFrameRects();
	setTimeout(() => { wheelLocked = false; }, 350);
}

function handleWheelNavigation(event) {
	if (storyDialog?.open || resumeDialog?.open || contactDialog?.open || videoDialog?.open || assessmentDialog?.open || agencyDialog?.open || clustrDialog?.open || wattpadDialog?.open) return;

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

	// Check if standbyFrame already has the next spread preloaded (0ms instant wait!)
	if (standbyFrame.dataset.src !== nextSpread.src) {
		await prepareFrame(standbyFrame, nextSpread.src);
	}

	// Swap frames: standby becomes active on top, previous active fades out
	standbyFrame.classList.add("is-active");
	activeFrame.classList.remove("is-active");

	const previousActive = activeFrame;
	activeFrame = standbyFrame;
	standbyFrame = previousActive;
	activeFrameDocument = activeFrame.contentDocument;
	updateFrameRects();

	await new Promise((resolve) => setTimeout(resolve, 220));
	turnBusy = false;
	wheelLocked = false;
	updateBookControls();

	// Preload the next likely spread in idle time!
	preloadNextSpread(pageIndex + 1);
}

function preloadNextSpread(index) {
	if (index >= 0 && index < spreads.length) {
		setTimeout(() => {
			if (!turnBusy && standbyFrame.dataset.src !== spreads[index].src) {
				prepareFrame(standbyFrame, spreads[index].src);
			}
		}, 260);
	}
}

function startEdgeGesture(frameDocument, event) {
	if (event.target.closest("button, a, input, canvas, .folio-canvas, .collage-sticker, .cover-card-artwork-wrap, .sketch-wrapper, .collage-wrapper, .sketch-tools, .collage-tools, #sticker-folder, .sticker-folder, .img9")) return;
	const isTouch = event.pointerType === "touch" || window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 768;
	if (isTouch) {
		gesture = { side: "touch", x: event.clientX, y: event.clientY, id: event.pointerId, isTouch: true };
		return;
	}
	const side = event.clientX < 90 ? "left" : event.clientX > 1190 ? "right" : null;
	if (!side) return;
	gesture = { side, x: event.clientX, y: event.clientY, id: event.pointerId, isTouch: false };
}

function cancelGesture() {
	gesture = null;
}

function finishGesture(event) {
	if (!gesture || event.pointerId !== gesture.id) return;
	const deltaX = event.clientX - gesture.x;
	const deltaY = event.clientY - gesture.y;

	if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > Math.abs(deltaY) * 1.1) {
		if (deltaX < 0 && pageIndex < spreads.length - 1) {
			cancelGesture();
			turnPage(1);
			return;
		} else if (deltaX > 0 && pageIndex > 0) {
			cancelGesture();
			turnPage(-1);
			return;
		}
	} else if (!gesture.isTouch) {
		const tapForward = gesture.side === "right" && Math.abs(deltaX) <= 40;
		const tapBackward = gesture.side === "left" && Math.abs(deltaX) <= 40;
		if (tapForward && pageIndex < spreads.length - 1) turnPage(1);
		else if (tapBackward && pageIndex > 0) turnPage(-1);
	}
	cancelGesture();
}

function openDialog(dialog) {
	if (!dialog) return;
	if (window.innerWidth <= 768 || window.matchMedia("(hover: none)").matches || window.matchMedia("(pointer: coarse)").matches) {
		hidePencil();
		if (pencil && pencil.parentNode) {
			pencil.style.display = "none";
		}
	} else if (pencil && !dialog.contains(pencil)) {
		dialog.appendChild(pencil);
	}
	if (!dialog.open) {
		dialog.showModal();
	}
	updateFrameRects();
}

function handleDialogClose(dialog) {
	if (pencil && dialog.contains(pencil)) {
		document.body.appendChild(pencil);
	}
	if (arrowCursor) arrowCursor.style.display = "none";
	updateFrameRects();
}

function openLostVideo() {
	if (!videoDialog) return;
	openDialog(videoDialog);
	if (lostVideo) {
		lostVideo.currentTime = 0;
		const playPromise = lostVideo.play();
		if (playPromise !== undefined) {
			playPromise.catch(() => {});
		}
	}
}
window.openLostVideo = openLostVideo;

let assessmentScrollInitialized = false;

function initAssessmentScrollViewer() {
	const viewport = document.querySelector("#assessment-scroll-viewport");
	if (!viewport) return;

	const progressBar = document.querySelector("#pdf-progress-bar");
	const percentText = document.querySelector("#pdf-percent-text");
	const topBtn = document.querySelector("#pdf-scroll-top-btn");

	function updateProgress() {
		const maxScroll = viewport.scrollHeight - viewport.clientHeight;
		if (maxScroll <= 0) {
			if (progressBar) progressBar.style.width = "0%";
			if (percentText) percentText.textContent = "0%";
			return;
		}
		const pct = Math.min(100, Math.max(0, Math.round((viewport.scrollTop / maxScroll) * 100)));
		if (progressBar) progressBar.style.width = `${pct}%`;
		if (percentText) percentText.textContent = `${pct}%`;
	}

	if (!assessmentScrollInitialized) {
		assessmentScrollInitialized = true;

		viewport.addEventListener("scroll", updateProgress, { passive: true });

		if (topBtn) {
			topBtn.addEventListener("click", () => {
				viewport.scrollTo({ top: 0, behavior: "smooth" });
			});
		}

		// Mouse grab-and-drag interaction
		let isDown = false;
		let startY = 0;
		let initialScroll = 0;

		viewport.addEventListener("mousedown", (e) => {
			isDown = true;
			viewport.classList.add("is-dragging");
			startY = e.pageY;
			initialScroll = viewport.scrollTop;
		});

		window.addEventListener("mouseup", () => {
			if (isDown) {
				isDown = false;
				viewport.classList.remove("is-dragging");
			}
		});

		window.addEventListener("mousemove", (e) => {
			if (!isDown) return;
			e.preventDefault();
			const walk = (e.pageY - startY) * 1.5;
			viewport.scrollTop = initialScroll - walk;
		});

		// Embedded Reel controls
		const reelVideo = document.querySelector("#assessment-reel-video");
		const reelPlayBtn = document.querySelector("#reel-play-btn");
		const reelSoundBtn = document.querySelector("#reel-sound-btn");
		const reelIconPlay = document.querySelector("#reel-icon-play");
		const reelIconPause = document.querySelector("#reel-icon-pause");
		const reelIconMuted = document.querySelector("#reel-icon-muted");
		const reelIconSound = document.querySelector("#reel-icon-sound");
		const embeddedPlayer = document.querySelector("#embedded-reel-player");

		function toggleReelPlay(e) {
			if (e) e.stopPropagation();
			if (!reelVideo) return;
			if (reelVideo.paused) {
				reelVideo.play().catch(() => {});
				if (reelIconPlay) reelIconPlay.style.display = "none";
				if (reelIconPause) reelIconPause.style.display = "inline";
			} else {
				reelVideo.pause();
				if (reelIconPlay) reelIconPlay.style.display = "inline";
				if (reelIconPause) reelIconPause.style.display = "none";
			}
		}

		function toggleReelSound(e) {
			if (e) e.stopPropagation();
			if (!reelVideo) return;
			reelVideo.muted = !reelVideo.muted;
			if (reelIconMuted) reelIconMuted.style.display = reelVideo.muted ? "inline" : "none";
			if (reelIconSound) reelIconSound.style.display = reelVideo.muted ? "none" : "inline";
		}

		if (reelPlayBtn) reelPlayBtn.addEventListener("click", toggleReelPlay);
		if (embeddedPlayer) embeddedPlayer.addEventListener("click", toggleReelPlay);
		if (reelSoundBtn) reelSoundBtn.addEventListener("click", toggleReelSound);

		// Tab switching
		document.querySelectorAll("#assessment-dialog .assessment-tab[data-tab]").forEach((tabBtn) => {
			tabBtn.addEventListener("click", () => {
				const tab = tabBtn.dataset.tab;
				document.querySelectorAll("#assessment-dialog .assessment-tab[data-tab]").forEach((b) => {
					b.classList.toggle("is-active", b === tabBtn);
					b.setAttribute("aria-selected", b === tabBtn ? "true" : "false");
				});
				document.querySelectorAll("#assessment-dialog .assessment-panel").forEach((panel) => {
					panel.classList.toggle("is-active", panel.id === `panel-${tab}`);
				});
				if (tab !== "video" && assessmentVideo) {
					assessmentVideo.pause();
				}
				if (tab === "video" && reelVideo) {
					reelVideo.pause();
				}
				if (tab === "slides") {
					setTimeout(updateProgress, 50);
					if (reelVideo && reelVideo.paused) {
						reelVideo.play().catch(() => {});
					}
				}
			});
		});
	}

	viewport.scrollTop = 0;
	updateProgress();
}

function openAssessmentDialog() {
	if (!assessmentDialog) return;
	openDialog(assessmentDialog);
	initAssessmentScrollViewer();
	if (assessmentReelVideo && assessmentReelVideo.paused) {
		assessmentReelVideo.play().catch(() => {});
	}
}
window.openAssessmentDialog = openAssessmentDialog;

let agencyScrollInitialized = false;

function initAgencyScrollViewer() {
	const viewport = document.querySelector("#agency-scroll-viewport");
	if (!viewport) return;

	const progressBar = document.querySelector("#agency-progress-bar");
	const percentText = document.querySelector("#agency-percent-text");
	const topBtn = document.querySelector("#agency-scroll-top-btn");

	function updateProgress() {
		const maxScroll = viewport.scrollHeight - viewport.clientHeight;
		if (maxScroll <= 0) {
			if (progressBar) progressBar.style.width = "0%";
			if (percentText) percentText.textContent = "0%";
			return;
		}
		const pct = Math.min(100, Math.max(0, Math.round((viewport.scrollTop / maxScroll) * 100)));
		if (progressBar) progressBar.style.width = `${pct}%`;
		if (percentText) percentText.textContent = `${pct}%`;
	}

	if (!agencyScrollInitialized) {
		agencyScrollInitialized = true;

		viewport.addEventListener("scroll", updateProgress, { passive: true });

		if (topBtn) {
			topBtn.addEventListener("click", () => {
				viewport.scrollTo({ top: 0, behavior: "smooth" });
			});
		}

		// Mouse grab-and-drag interaction
		let isDown = false;
		let startY = 0;
		let initialScroll = 0;

		viewport.addEventListener("mousedown", (e) => {
			isDown = true;
			viewport.classList.add("is-dragging");
			startY = e.pageY;
			initialScroll = viewport.scrollTop;
		});

		window.addEventListener("mouseup", () => {
			if (isDown) {
				isDown = false;
				viewport.classList.remove("is-dragging");
			}
		});

		window.addEventListener("mousemove", (e) => {
			if (!isDown) return;
			e.preventDefault();
			const walk = (e.pageY - startY) * 1.5;
			viewport.scrollTop = initialScroll - walk;
		});

		// Tab switching
		document.querySelectorAll("#agency-dialog .assessment-tab[data-agency-tab]").forEach((tabBtn) => {
			tabBtn.addEventListener("click", () => {
				const tab = tabBtn.dataset.agencyTab;
				document.querySelectorAll("#agency-dialog .assessment-tab[data-agency-tab]").forEach((b) => {
					b.classList.toggle("is-active", b === tabBtn);
					b.setAttribute("aria-selected", b === tabBtn ? "true" : "false");
				});
				document.querySelectorAll("#agency-dialog .assessment-panel").forEach((panel) => {
					panel.classList.toggle("is-active", panel.id === `agency-panel-${tab}`);
				});
				if (tab === "campaigns") {
					setTimeout(updateProgress, 50);
				}
			});
		});
	}

	viewport.scrollTop = 0;
	updateProgress();
}

function openAgencyDialog() {
	if (!agencyDialog) return;
	openDialog(agencyDialog);
	initAgencyScrollViewer();
}
window.openAgencyDialog = openAgencyDialog;

let wattpadScrollInitialized = false;

function initWattpadScrollViewer() {
	const viewport = document.querySelector("#wattpad-scroll-viewport");
	if (!viewport) return;

	const progressBar = document.querySelector("#wattpad-progress-bar");
	const percentText = document.querySelector("#wattpad-percent-text");
	const topBtn = document.querySelector("#wattpad-scroll-top-btn");

	function updateProgress() {
		const maxScroll = viewport.scrollHeight - viewport.clientHeight;
		if (maxScroll <= 0) {
			if (progressBar) progressBar.style.width = "0%";
			if (percentText) percentText.textContent = "0%";
			return;
		}
		const pct = Math.min(100, Math.max(0, Math.round((viewport.scrollTop / maxScroll) * 100)));
		if (progressBar) progressBar.style.width = `${pct}%`;
		if (percentText) percentText.textContent = `${pct}%`;
	}

	if (!wattpadScrollInitialized) {
		wattpadScrollInitialized = true;

		viewport.addEventListener("scroll", updateProgress, { passive: true });

		if (topBtn) {
			topBtn.addEventListener("click", () => {
				viewport.scrollTo({ top: 0, behavior: "smooth" });
			});
		}

		// Mouse grab-and-drag interaction
		let isDown = false;
		let startY = 0;
		let initialScroll = 0;

		viewport.addEventListener("mousedown", (e) => {
			isDown = true;
			viewport.classList.add("is-dragging");
			startY = e.pageY;
			initialScroll = viewport.scrollTop;
		});

		window.addEventListener("mouseup", () => {
			if (!isDown) return;
			isDown = false;
			viewport.classList.remove("is-dragging");
		});

		window.addEventListener("mousemove", (e) => {
			if (!isDown) return;
			e.preventDefault();
			const walk = (e.pageY - startY) * 1.5;
			viewport.scrollTop = initialScroll - walk;
		});

		// Tab switching
		document.querySelectorAll("#wattpad-dialog .assessment-tab[data-wattpad-tab]").forEach((tabBtn) => {
			tabBtn.addEventListener("click", () => {
				const tab = tabBtn.dataset.wattpadTab;
				document.querySelectorAll("#wattpad-dialog .assessment-tab[data-wattpad-tab]").forEach((b) => {
					b.classList.toggle("is-active", b === tabBtn);
					b.setAttribute("aria-selected", b === tabBtn ? "true" : "false");
				});
				document.querySelectorAll("#wattpad-dialog .assessment-panel").forEach((panel) => {
					panel.classList.toggle("is-active", panel.id === `wattpad-panel-${tab}`);
				});
				if (tab === "presentation") {
					setTimeout(updateProgress, 50);
				}
			});
		});
	}

	viewport.scrollTop = 0;
	updateProgress();
}

function openWattpadDialog() {
	if (!wattpadDialog) return;
	openDialog(wattpadDialog);
	initWattpadScrollViewer();
}
window.openWattpadDialog = openWattpadDialog;

function openClustrDialog() {
	if (!clustrDialog) return;
	const iframe = clustrDialog.querySelector("#clustr-frame");
	if (iframe && (!iframe.src || iframe.src === "about:blank" || iframe.src.endsWith("about:blank"))) {
		iframe.src = iframe.dataset.src || "clustr/index.html?v=3";
	}
	openDialog(clustrDialog);
	if (iframe && !iframe.dataset.pencilHooked) {
		iframe.dataset.pencilHooked = "true";
		iframe.addEventListener("pointerenter", hidePencil);
		iframe.addEventListener("mouseenter", hidePencil);
		iframe.addEventListener("pointerleave", (e) => movePencil(e.clientX, e.clientY));
		iframe.addEventListener("mouseleave", (e) => movePencil(e.clientX, e.clientY));
	}
}
window.openClustrDialog = openClustrDialog;

function closeClustrDialog() {
	if (clustrDialog && clustrDialog.open) {
		clustrDialog.close();
	}
}
window.closeClustrDialog = closeClustrDialog;

/* ===== FULLSCREEN SUPPORT FOR DECK & CAMPAIGN VIEWERS ===== */
function toggleDialogFullscreen(dialog) {
	if (!dialog) return;
	const isFS = dialog.classList.contains("is-fullscreen");
	if (!isFS) {
		dialog.classList.add("is-fullscreen");
		if (dialog.requestFullscreen) {
			dialog.requestFullscreen().catch(() => {});
		} else if (dialog.webkitRequestFullscreen) {
			dialog.webkitRequestFullscreen();
		}
	} else {
		dialog.classList.remove("is-fullscreen");
		if (document.fullscreenElement) {
			document.exitFullscreen().catch(() => {});
		} else if (document.webkitFullscreenElement) {
			document.webkitExitFullscreen();
		}
	}
	updateDialogFullscreenUI(dialog);
}

function updateDialogFullscreenUI(dialog) {
	if (!dialog) return;
	const isFS = dialog.classList.contains("is-fullscreen") || document.fullscreenElement === dialog;
	if (isFS) {
		dialog.classList.add("is-fullscreen");
	} else {
		dialog.classList.remove("is-fullscreen");
	}

	dialog.querySelectorAll(".fullscreen-toggle-btn").forEach((btn) => {
		btn.classList.toggle("is-active", isFS);
		btn.setAttribute("title", isFS ? "Exit Full Screen (Esc / F)" : "Toggle full screen (F)");
		const label = btn.querySelector(".action-btn-label");
		if (label) label.textContent = isFS ? "Exit Full Screen" : "Full Screen";
		const expandIcon = btn.querySelector(".fs-icon-expand");
		const compressIcon = btn.querySelector(".fs-icon-compress");
		if (expandIcon) expandIcon.style.display = isFS ? "none" : "block";
		if (compressIcon) compressIcon.style.display = isFS ? "block" : "none";
	});

	dialog.querySelectorAll(".pdf-fullscreen-btn").forEach((btn) => {
		btn.classList.toggle("is-active", isFS);
		btn.setAttribute("title", isFS ? "Exit full screen view (Esc / F)" : "View full screen (F)");
		const textSpan = btn.querySelector(".pdf-fs-text");
		if (textSpan) {
			textSpan.textContent = isFS ? "Exit Full Screen" : "Full Screen";
		} else {
			btn.textContent = isFS ? "Exit Full Screen" : "Full Screen";
		}
	});

	setTimeout(() => {
		if (dialog === agencyDialog) {
			const vp = document.querySelector("#agency-scroll-viewport");
			if (vp) vp.dispatchEvent(new Event("scroll"));
		} else if (dialog === assessmentDialog) {
			const vp = document.querySelector("#assessment-scroll-viewport");
			if (vp) vp.dispatchEvent(new Event("scroll"));
		} else if (dialog === wattpadDialog) {
			const vp = document.querySelector("#wattpad-scroll-viewport");
			if (vp) vp.dispatchEvent(new Event("scroll"));
		}
	}, 120);
}

// Wire up full screen toggle buttons
[
	{ dialog: clustrDialog, toggles: ["#clustr-fullscreen-toggle"] },
	{ dialog: agencyDialog, toggles: ["#agency-fullscreen-toggle", "#agency-toolbar-fullscreen-btn"] },
	{ dialog: assessmentDialog, toggles: ["#assessment-fullscreen-toggle", "#assessment-toolbar-fullscreen-btn"] },
	{ dialog: wattpadDialog, toggles: ["#wattpad-fullscreen-toggle", "#wattpad-toolbar-fullscreen-btn"] }
].forEach(({ dialog, toggles }) => {
	if (!dialog) return;
	toggles.forEach((sel) => {
		document.querySelector(sel)?.addEventListener("click", (e) => {
			e.stopPropagation();
			toggleDialogFullscreen(dialog);
		});
	});
	dialog.addEventListener("close", () => {
		dialog.classList.remove("is-fullscreen");
		if (document.fullscreenElement) {
			document.exitFullscreen().catch(() => {});
		}
		updateDialogFullscreenUI(dialog);
	});
});

document.addEventListener("fullscreenchange", () => {
	[clustrDialog, agencyDialog, assessmentDialog].forEach((dlg) => {
		if (!dlg) return;
		if (!document.fullscreenElement && dlg.classList.contains("is-fullscreen")) {
			dlg.classList.remove("is-fullscreen");
		}
		updateDialogFullscreenUI(dlg);
	});
});

document.addEventListener("keydown", (e) => {
	const isZ = e.key === "z" || e.key === "Z" || e.code === "KeyZ";
	if (isZ && (e.metaKey || e.ctrlKey)) {
		if (pageIndex === 4) {
			const frameDoc = activeFrameDocument || activeFrame?.contentDocument;
			if (typeof frameDoc?.defaultView?.undoSketch === "function") {
				e.preventDefault();
				frameDoc.defaultView.undoSketch();
				return;
			}
		}
	}
	if ((e.key === "f" || e.key === "F") && !e.ctrlKey && !e.metaKey && !e.altKey) {
		if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
		if (clustrDialog && clustrDialog.open) {
			e.preventDefault();
			toggleDialogFullscreen(clustrDialog);
		} else if (agencyDialog && agencyDialog.open) {
			e.preventDefault();
			toggleDialogFullscreen(agencyDialog);
		} else if (assessmentDialog && assessmentDialog.open) {
			e.preventDefault();
			toggleDialogFullscreen(assessmentDialog);
		}
	}
});

function openStory(key) {
	if (key === "clustr") {
		openClustrDialog();
		return;
	}
	if (key === "agency") {
		openAgencyDialog();
		return;
	}
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
	openDialog(storyDialog);
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
		makeInteractive(frameDocument.querySelector(".text-input1"), "Open the CLUSTR volunteering app case study", () => openClustrDialog());
		makeInteractive(frameDocument.querySelector(".graphic"), "Open the CLUSTR volunteering app case study", () => openClustrDialog());
		makeInteractive(frameDocument.querySelector(".case-study-heading"), "Open the CLUSTR volunteering app case study", () => openClustrDialog());
		makeInteractive(frameDocument.querySelector(".text-input2"), "Open The OG Architect assessment work", () => openAssessmentDialog());
	}
	if (index === 2) {
		makeInteractive(frameDocument.querySelector(".text-input"), "Open agency work & beauty brands", () => openAgencyDialog());
		makeInteractive(frameDocument.querySelector(".text1"), "Open agency work & beauty brands", () => openAgencyDialog());
		makeInteractive(frameDocument.querySelector(".text2"), "Open agency work & beauty brands", () => openAgencyDialog());
		makeInteractive(frameDocument.querySelector(".col-left"), "Open agency work & beauty brands", () => openAgencyDialog());
		makeInteractive(frameDocument.querySelector(".text-top"), "Open college campaign work", () => openStory("college"));
		makeInteractive(frameDocument.querySelector(".text-campaigns"), "Open college campaign work", () => openStory("college"));
		makeInteractive(frameDocument.querySelector(".img6"), "Play LOST campaign video", () => openLostVideo());
		const fish = frameDocument.querySelector(".rating");
		if (fish) {
			makeInteractive(fish, "Tap to make the goldfish swim!", () => {
				if (typeof frameDocument.defaultView?.dartFish === "function") {
					frameDocument.defaultView.dartFish();
				}
			});
		}
	}
	if (index === 3) {
		makeInteractive(frameDocument.querySelector(".img2"), "Open résumé", () => openDialog(resumeDialog));
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
		const rect = cachedBookRect || (frameDocument.defaultView?.frameElement || activeFrame).getBoundingClientRect();
		if (rect && rect.width > 0) {
			movePencil(rect.left + (event.clientX * rect.width) / 1280, rect.top + (event.clientY * rect.height) / 900);
		}
		const pos = getPos(event);
		lastX = pos.x;
		lastY = pos.y;
		renderPencilDot(context, lastX, lastY);
	});
	canvas.addEventListener("pointermove", (event) => {
		const rect = cachedBookRect || (frameDocument.defaultView?.frameElement || activeFrame).getBoundingClientRect();
		if (rect && rect.width > 0) {
			movePencil(rect.left + (event.clientX * rect.width) / 1280, rect.top + (event.clientY * rect.height) / 900);
		}
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
	const size = Number(sizeSlider ? sizeSlider.value : 160);

	const layerWidth = layer.clientWidth || 520;
	const layerHeight = layer.clientHeight || 480;

	const x = Math.max(16, Math.min(layerWidth - size - 16, (layerWidth * 0.5) - (size * 0.5) + (Math.random() * 50 - 25)));
	const y = Math.max(18, Math.min(layerHeight - size - 18, (layerHeight * 0.22) + (Math.random() * 40 - 20)));

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

			const minX = -currentWidth * 0.75;
			const maxX = layer.clientWidth - (currentWidth * 0.25);
			const minY = -currentHeight * 0.75;
			const maxY = layer.clientHeight - (currentHeight * 0.25);

			const boundedX = Math.max(minX, Math.min(maxX, newX));
			const boundedY = Math.max(minY, Math.min(maxY, newY));

			sticker.style.left = `${boundedX}px`;
			sticker.style.top = `${boundedY}px`;
		};

		const finish = () => {
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
function openResumeDialog() {
	openDialog(resumeDialog);
}
window.openResumeDialog = openResumeDialog;
window.resumeDialog = resumeDialog;

document.querySelectorAll("[data-open-contact]").forEach((button) => button.addEventListener("click", () => openDialog(contactDialog)));
document.querySelectorAll("[data-open-resume]").forEach((button) => button.addEventListener("click", openResumeDialog));
document.querySelectorAll("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
[storyDialog, resumeDialog, contactDialog, videoDialog, assessmentDialog, agencyDialog, clustrDialog, wattpadDialog].forEach((dialog) => {
	if (!dialog) return;
	dialog.addEventListener("click", (event) => {
		const sheet = dialog.querySelector(".story-sheet, .resume-sheet, .contact-sheet, .video-sheet, .assessment-sheet, .clustr-sheet, .wattpad-sheet");
		if (sheet && !sheet.contains(event.target)) {
			dialog.close();
		}
	});
	dialog.addEventListener("close", () => {
		if (dialog === videoDialog && lostVideo) {
			lostVideo.pause();
		}
		if (dialog === assessmentDialog) {
			if (assessmentVideo) assessmentVideo.pause();
			if (assessmentReelVideo) assessmentReelVideo.pause();
		}
		handleDialogClose(dialog);
	});
});
const printResumeBtn = document.querySelector("#print-resume");
if (printResumeBtn) {
	printResumeBtn.addEventListener("click", () => {
		hidePencil();
		if (pencil && resumeDialog && resumeDialog.contains(pencil)) {
			document.body.appendChild(pencil);
		}
		window.print();
	});
}
window.addEventListener("afterprint", () => {
	if (resumeDialog && resumeDialog.open && pencil && !resumeDialog.contains(pencil)) {
		resumeDialog.appendChild(pencil);
	}
});
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
if (stickerSize) {
	stickerSize.addEventListener("input", () => {
		if (!activeSticker) return;
		activeSticker.style.width = `${stickerSize.value}px`;
		persistStickers(activeFrameDocument?.querySelector(".collage-layer"));
	});
}
document.addEventListener("pointerenter", (event) => {
	if (event.pointerType === "touch" || window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 768) return;
	movePencil(event.clientX, event.clientY);
}, { passive: true });
document.addEventListener("pointermove", (event) => {
	if (event.pointerType === "touch" || window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 768) return;
	movePencil(event.clientX, event.clientY);
}, { passive: true });
document.addEventListener("pointerdown", (event) => {
	if (event.pointerType === "touch" || window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 768) return;
	movePencil(event.clientX, event.clientY);
}, { passive: true });
window.addEventListener("pointerleave", (event) => {
	if (!event.relatedTarget && !event.toElement) {
		hidePencil();
	}
});
document.addEventListener("mouseleave", (event) => {
	if (!event.relatedTarget && !event.toElement) {
		hidePencil();
	}
});

if (bookStage) {
	bookStage.addEventListener("pointerdown", (event) => {
		if (event.target.closest("button, a, input, canvas")) return;
		gesture = { side: "touch", x: event.clientX, y: event.clientY, id: event.pointerId, isTouch: true };
	}, { passive: true });
	bookStage.addEventListener("pointerup", finishGesture);
	bookStage.addEventListener("pointercancel", cancelGesture);
}
document.addEventListener("keydown", (event) => {
	if (event.key === "f" || event.key === "F") {
		const tag = event.target?.tagName?.toLowerCase();
		if (tag === "input" || tag === "textarea") return;
		event.preventDefault();
		toggleFullscreen();
		return;
	}
	if (assessmentDialog?.open) {
		if (event.key === "ArrowRight") {
			event.preventDefault();
			setAssessmentSlide(assessmentSlide + 1);
			return;
		}
		if (event.key === "ArrowLeft") {
			event.preventDefault();
			setAssessmentSlide(assessmentSlide - 1);
			return;
		}
	}
	if (cover.hidden && !storyDialog.open && !resumeDialog.open && !contactDialog.open && !videoDialog?.open && !assessmentDialog?.open && !agencyDialog?.open && !clustrDialog?.open && !wattpadDialog?.open) {
		const isDeleteKey = event.key === "Delete" || event.key === "Backspace" || event.key === "Del" || event.code === "Delete" || event.code === "Backspace" || event.code === "NumpadDecimal" || event.keyCode === 46 || event.keyCode === 8;
		if (pageIndex === 4 && isDeleteKey) {
			if (event.target.tagName === "INPUT" && event.target.type !== "range") return;
			event.preventDefault();
			deleteSticker();
			return;
		}
		if (event.key === "ArrowRight") turnPage(1);
		if (event.key === "ArrowLeft") turnPage(-1);
	}
});

// Fullscreen API Helper
function isFullscreen() {
	return Boolean(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
}

async function requestFullscreenSafe(element = document.documentElement) {
	try {
		if (element.requestFullscreen) {
			await element.requestFullscreen();
		} else if (element.webkitRequestFullscreen) {
			await element.webkitRequestFullscreen();
		} else if (element.mozRequestFullScreen) {
			await element.mozRequestFullScreen();
		} else if (element.msRequestFullscreen) {
			await element.msRequestFullscreen();
		}
		if (screen.orientation && typeof screen.orientation.lock === "function") {
			try {
				await screen.orientation.lock("landscape");
			} catch (_) {}
		}
	} catch (err) {
		console.log("Fullscreen request was not granted:", err);
	}
	updateFullscreenUI();
}

async function exitFullscreenSafe() {
	try {
		if (document.exitFullscreen) {
			await document.exitFullscreen();
		} else if (document.webkitExitFullscreen) {
			await document.webkitExitFullscreen();
		} else if (document.mozCancelFullScreen) {
			await document.mozCancelFullScreen();
		} else if (document.msExitFullscreen) {
			await document.msExitFullscreen();
		}
		if (screen.orientation && typeof screen.orientation.unlock === "function") {
			try {
				screen.orientation.unlock();
			} catch (_) {}
		}
	} catch (_) {}
	updateFullscreenUI();
}

function toggleFullscreen() {
	if (isFullscreen()) {
		exitFullscreenSafe();
	} else {
		requestFullscreenSafe();
	}
}

function updateFullscreenUI() {
	const active = isFullscreen();
	if (siteFullscreenToggle) {
		const icon = siteFullscreenToggle.querySelector(".fs-icon");
		const label = siteFullscreenToggle.querySelector(".fs-text");
		if (icon) icon.textContent = active ? "✕" : "⛶";
		if (label) label.textContent = active ? "Exit" : "Fullscreen";
		siteFullscreenToggle.setAttribute("aria-label", active ? "Exit Fullscreen" : "Enter Fullscreen");
	}
	setTimeout(fitBookScene, 80);
}

document.addEventListener("fullscreenchange", updateFullscreenUI);
document.addEventListener("webkitfullscreenchange", updateFullscreenUI);
if (siteFullscreenToggle) {
	siteFullscreenToggle.addEventListener("click", toggleFullscreen);
}

setupCover();
updateBookControls();

// Preload Spread 0 immediately in background so opening sketchbook has 0ms wait!
prepareFrame(activeFrame, spreads[0].src);