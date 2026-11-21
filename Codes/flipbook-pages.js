/*
 * Flipbook content. Edit this array to change the book.
 *
 *   kind          "cover" (first), "end" (closing/dedication, last) or omitted for a normal page
 *   title         large heading
 *   body          short paragraph (plain text)
 *   illustration  a key from FLIPBOOK_ILLUSTRATIONS, raw "<svg …>" markup, or an image URL
 */
window.FLIPBOOK_PAGES = [
	{ kind: "cover", title: "Bharati's Sketchbook", body: "Visualizer & UX/UI designer. Grab a seat and turn the page.", illustration: "sketchbook" },
	{ title: "Hello, explorer", body: "Every project here started on paper: a doodle, a list, a half-formed idea worth chasing.", illustration: "map" },
	{ title: "Human behind the screen", body: "Design for people first. Pixels follow.", illustration: "laptop" },
	{ title: "CLUSTR", body: "A volunteering app concept, developed as a UX/UI case study.", illustration: "cluster" },
	{ title: "The OG Architect", body: "Ganesha as the ultimate system architect: 108 traditional attributes decoded into a scalable design system for Instagram and LinkedIn.", illustration: "blocks" },
	{ title: "Beauty brands", body: "Selected brand communication work from advertising-agency practice.", illustration: "lipstick" },
	{ title: "Wattpad campaign", body: "Positioning Wattpad beyond amateur fanfiction as a credible, global storytelling platform.", illustration: "megaphone" },
	{ title: "Personal work", body: "Cut-paper collages, redrawn in Illustrator.", illustration: "collage" },
	{ title: "Fun break", body: "Sketch something, stick something. The back pages are for play.", illustration: "squiggle" },
	{ kind: "end", title: "Thank you", body: "For everyone who still keeps a sketchbook in their bag.", illustration: "envelope" }
];

(function () {
	const ink = "#262626", paper = "#f5f1e8", accent = "#f18b85", flame = "#ff5238", sun = "#ffcf5c", fog = "#efeff0";
	const wrap = (body) => `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><g fill="none" stroke="${ink}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
	const spark = (x, y, r = 8) => `<path d="M${x} ${y - r}v${2 * r}M${x - r} ${y}h${2 * r}"/>`;

	window.FLIPBOOK_ILLUSTRATIONS = {
		sketchbook: wrap(`
			<g transform="rotate(-8 112 92)">
				<rect x="56" y="22" width="112" height="142" rx="10" fill="${paper}"/>
				<path d="M56 40h-12M56 62h-12M56 84h-12M56 106h-12M56 128h-12M56 150h-12"/>
				<path d="M78 58c14-12 28 10 42-2s26 6 30 0" stroke="${flame}"/>
				<circle cx="108" cy="110" r="24" fill="${accent}"/>
				<path d="M98 108h0M118 108h0M100 120c6 5 12 5 18 0"/>
			</g>
			<g transform="rotate(30 196 96)">
				<rect x="186" y="26" width="22" height="104" rx="3" fill="${sun}"/>
				<path d="M186 130l11 26 11-26z" fill="${paper}"/>
				<path d="M193 148l4 8 4-8z" fill="${ink}"/>
			</g>
			${spark(28, 34)}${spark(214, 160, 6)}`),
		map: wrap(`
			<path d="M24 40l60-18 72 18 60-18v118l-60 18-72-18-60 18z" fill="${fog}"/>
			<path d="M84 22v118M156 40v118"/>
			<path d="M44 128c20-6 26-30 52-34s40 18 62-6" stroke="${flame}" stroke-dasharray="2 12"/>
			<path d="M176 62l18 18M194 62l-18 18" stroke="${flame}" stroke-width="7"/>
			<circle cx="48" cy="128" r="9" fill="${accent}"/>`),
		laptop: wrap(`
			<rect x="52" y="30" width="136" height="92" rx="8" fill="${fog}"/>
			<path d="M30 140h180l-14 16H44z" fill="${paper}"/>
			<circle cx="120" cy="74" r="28" fill="${accent}"/>
			<path d="M110 68h0M130 68h0M108 84c8 7 16 7 24 0"/>
			<path d="M120 46c-4-10 4-18 10-12" stroke="${flame}"/>
			${spark(212, 40, 7)}`),
		cluster: wrap(`
			<circle cx="82" cy="86" r="34" fill="${sun}"/>
			<circle cx="152" cy="74" r="30" fill="${fog}"/>
			<circle cx="132" cy="132" r="28" fill="${accent}"/>
			<path d="M120 112c-12-14-30 0-18 14l18 16 18-16c12-14-6-28-18-14z" fill="${flame}"/>
			${spark(40, 36)}${spark(206, 150, 7)}`),
		blocks: wrap(`
			<rect x="40" y="110" width="160" height="42" rx="4" fill="${fog}"/>
			<rect x="64" y="70" width="112" height="40" rx="4" fill="${accent}"/>
			<rect x="92" y="30" width="56" height="40" rx="4" fill="${sun}"/>
			<path d="M80 110v42M120 110v42M160 110v42M120 70v40" />
			<circle cx="120" cy="50" r="6" fill="${ink}"/>`),
		lipstick: wrap(`
			<rect x="58" y="96" width="44" height="64" rx="5" fill="${ink}"/>
			<rect x="64" y="70" width="32" height="28" rx="3" fill="${sun}"/>
			<path d="M68 70V44l24-14v40z" fill="${flame}"/>
			<circle cx="164" cy="112" r="42" fill="${fog}"/>
			<circle cx="164" cy="112" r="26" fill="${accent}"/>
			${spark(206, 40, 8)}`),
		megaphone: wrap(`
			<path d="M50 80l92-42v104L50 100z" fill="${accent}"/>
			<rect x="30" y="76" width="22" height="28" rx="4" fill="${fog}"/>
			<path d="M70 100l10 44h18l-6-36" fill="${paper}"/>
			<path d="M168 62l26-14M172 90h30M168 118l26 14" stroke="${flame}"/>`),
		collage: wrap(`
			<g transform="rotate(-10 86 92)"><rect x="40" y="40" width="92" height="104" fill="${paper}"/><rect x="50" y="50" width="72" height="64" fill="${accent}"/></g>
			<g transform="rotate(9 156 86)"><rect x="112" y="30" width="88" height="100" fill="${paper}"/><circle cx="156" cy="70" r="24" fill="${sun}"/></g>
			<circle cx="80" cy="156" r="11"/><circle cx="110" cy="156" r="11"/>
			<path d="M88 148l70-48M102 148l-6-4" stroke="${flame}"/>`),
		squiggle: wrap(`
			<path d="M24 120c20-60 40 40 60-10s30-60 50-10 30 50 50-20 26-20 34 0" stroke="${flame}" stroke-width="7"/>
			<path d="M120 40l8 16 18 3-13 13 3 18-16-9-16 9 3-18-13-13 18-3z" fill="${sun}"/>
			<circle cx="196" cy="140" r="16" fill="${accent}"/>
			<rect x="34" y="34" width="34" height="34" rx="6" fill="${fog}" transform="rotate(-12 51 51)"/>`),
		envelope: wrap(`
			<rect x="36" y="48" width="168" height="110" rx="8" fill="${paper}"/>
			<path d="M36 56l84 60 84-60"/>
			<path d="M120 46c-14-20-44-4-30 18l30 26 30-26c14-22-16-38-30-18z" fill="${accent}"/>
			${spark(30, 30)}${spark(212, 26, 7)}`)
	};
})();
