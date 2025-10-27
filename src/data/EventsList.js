const STORAGE_KEY = "calendarEvents";

function genId() { return Date.now() + Math.floor(Math.random() * 1000); }

function normalizeOne(ev) {
	try {
		if (!ev) return null;
		function extractYMD(input) {
			const dt = new Date(input);
			if (isNaN(dt.getTime())) return null;
			return { y: dt.getFullYear(), m: dt.getMonth(), d: dt.getDate() };
		}

		// déjà normalisé
		if (ev && typeof ev.y === "number" && typeof ev.m === "number" && typeof ev.d === "number") {
			return {
				id: ev.id || genId(),
				title: ev.title || "Événement",
				date: ev.date || new Date(ev.y, ev.m, ev.d).toISOString(),
				y: ev.y,
				m: ev.m,
				d: ev.d,
				time: ev.time ?? null,
				description: ev.description ?? "",
				images: ev.images ?? null,
				location: ev.location ?? null,
				votes: ev.votes ?? { time: {}, location: {} },
				color: ev.color ?? "#3366ff", // <-- conserver / défaut couleur
				...ev,
			};
		}

		// string/number -> date
		if (typeof ev === "string" || typeof ev === "number") {
			const ymd = extractYMD(ev);
			if (!ymd) throw new Error("Invalid date");
			return {
				id: genId(),
				title: "Événement",
				date: new Date(ymd.y, ymd.m, ymd.d).toISOString(),
				...ymd,
				time: null,
				description: "",
				images: null,
				location: null,
				votes: { time: {}, location: {} },
				color: "#3366ff",
			};
		}

		// objet avec date-like
		if (ev && (ev.date || ev.dt || ev.start)) {
			const attempt = ev.date || ev.dt || ev.start;
			const ymd = extractYMD(attempt);
			if (ymd) {
				return {
					id: ev.id || genId(),
					title: ev.title || "Événement",
					date: new Date(ymd.y, ymd.m, ymd.d).toISOString(),
					y: ymd.y,
					m: ymd.m,
					d: ymd.d,
					time: ev.time ?? null,
					description: ev.description ?? "",
					images: ev.images ?? null,
					location: ev.location ?? null,
					votes: ev.votes ?? { time: {}, location: {} },
					color: ev.color ?? "#3366ff", // <-- fallback couleur
					...ev,
				};
			}
		}

		// fallback
		return {
			id: ev.id || genId(),
			title: ev.title || "Événement",
			date: ev.date || new Date().toISOString(),
			y: typeof ev?.y === "number" ? ev.y : undefined,
			m: typeof ev?.m === "number" ? ev.m : undefined,
			d: typeof ev?.d === "number" ? ev.d : undefined,
			time: ev.time ?? null,
			description: ev.description ?? "",
			images: ev.images ?? null,
			location: ev.location ?? null,
			votes: ev.votes ?? { time: {}, location: {} },
			color: ev.color ?? "#3366ff", // <-- fallback couleur
			...ev,
		};
	} catch {
		return null;
	}
}

function load() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.map(normalizeOne).filter(Boolean);
	} catch {
		return [];
	}
}

function save(events) {
	try { localStorage.setItem(STORAGE_KEY, JSON.stringify(events)); } catch {}
}

function add(eventObj) {
	const normalized = normalizeOne(eventObj);
	if (!normalized) return load();
	const list = load();
	list.push(normalized);
	save(list);
	return list;
}

function removeById(id) {
	const list = load().filter(e => e.id !== id);
	save(list);
	return list;
}

// nouveau : mise à jour par id (updater peut être objet partiel ou fonction)
function updateById(id, updater) {
	const list = load();
	let changed = false;
	const next = list.map(ev => {
		if (ev.id !== id) return ev;
		let updated = null;
		if (typeof updater === "function") {
			updated = updater(ev) || ev;
		} else if (typeof updater === "object" && updater !== null) {
			updated = { ...ev, ...updater };
		} else {
			updated = ev;
		}
		changed = true;
		// garantir la normalisation des champs votes/y/m/d après update
		return normalizeOne(updated);
	});
	if (changed) save(next);
	return next;
}

function clear() {
	save([]);
	return [];
}

function findByYMD(y, m, d) {
	return load().filter(ev => ev && typeof ev.y === "number" && ev.y === y && ev.m === m && ev.d === d);
}

const EventsListExport = {
	load,
	save,
	add,
	removeById,
	updateById,
	clear,
	findByYMD,
};

export default EventsListExport;
