import React, { useState, useMemo } from "react";
import "../styles/Calendar.css";
import EventsList from "../data/EventsList";
import RightPanel from "./RightPanel"; // nouveau composant pour la partie droite

function sameDay(a, b) {
	return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function addDays(date, days) {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}

export default function Calendar() {
	// état du mois affiché (jour 1 du mois)
	const [viewMonth, setViewMonth] = useState(() => {
		const now = new Date();
		return new Date(now.getFullYear(), now.getMonth(), 1);
	});
	// état sélection / visualisation
	const [selected, setSelected] = useState(null);
	const [viewEvent, setViewEvent] = useState(null);
	// panneau droit : 'day' | 'view' | 'create'
	const [rightMode, setRightMode] = useState("day");

	// events persisted via EventsList
	const [events, setEvents] = useState(() => EventsList.load());

	const today = useMemo(() => {
		const n = new Date();
		return new Date(n.getFullYear(), n.getMonth(), n.getDate());
	}, []);

	// grille de 6 semaines x 7 jours commençant lundi
	const weeks = useMemo(() => {
		const year = viewMonth.getFullYear();
		const month = viewMonth.getMonth();

		// premier jour du mois
		const firstOfMonth = new Date(year, month, 1);
		// JS: dimanche=0 ... samedi=6; on veut lundi=0 => shift
		const shift = (firstOfMonth.getDay() + 6) % 7;
		// date de départ affichée (lundi de la première semaine)
		const start = addDays(firstOfMonth, -shift);

		const matrix = [];
		for (let w = 0; w < 6; w++) {
			const week = [];
			for (let d = 0; d < 7; d++) {
				const date = addDays(start, w * 7 + d);
				week.push({
					date,
					inMonth: date.getMonth() === month,
				});
			}
			matrix.push(week);
		}
		return matrix;
	}, [viewMonth]);

	const monthLabel = useMemo(() => {
		return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(viewMonth);
	}, [viewMonth]);

	function prevMonth() {
		setViewMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
	}
	function nextMonth() {
		setViewMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1));
	}

	function goToday() {
		const n = new Date();
		setViewMonth(new Date(n.getFullYear(), n.getMonth(), 1));
		setSelected(new Date(n.getFullYear(), n.getMonth(), n.getDate()));
	}

	function onSelect(date, inMonth /* removed event param */) {
		// normaliser la date sélectionnée
		const sel = new Date(date.getFullYear(), date.getMonth(), date.getDate());
		setSelected(sel);
		setRightMode("day");
		setViewEvent(null);

		// si on clique sur une cellule hors mois, on change le mois affiché (UX inchangé)
		if (!inMonth) {
			setViewMonth(new Date(date.getFullYear(), date.getMonth(), 1));
		}
	}

	// appelé depuis le RightPanel quand on clique sur un évènement horaire
	// reçoit (ev, slot) mais ne stocke plus selectedSlot inutile
	function onHourEventClick(ev, slot) {
		setViewEvent(ev);
		setRightMode("view");
	}

	// appelé depuis le RightPanel "+" pour créer
	function onStartCreateFromPanel() {
		setRightMode("create");
	}

	// création d'un événement (appelé depuis CreateEvent dans RightPanel)
	function handleCreateEvent(eventObj) {
		// construire l'objet stocké (y/m/d déjà géré si envoyé en tant qu'objet)
		let y, m, d;
		if (eventObj && eventObj.date && typeof eventObj.date === "object" && Number.isInteger(eventObj.date.y)) {
			({ y, m, d } = eventObj.date);
		} else {
			const rawDate = eventObj.date ? new Date(eventObj.date) : new Date();
			y = rawDate.getFullYear();
			m = rawDate.getMonth();
			d = rawDate.getDate();
		}

		const toStore = {
			id: Date.now(),
			title: eventObj.title || "Événement",
			date: new Date(y, m, d).toISOString(),
			y, m, d,
			time: eventObj.time ?? null,
			location: eventObj.location ?? null,
			images: eventObj.images ?? null,
			description: eventObj.description || "",
			votes: eventObj.votes ?? { time: {}, location: {} },
			color: eventObj.color ?? "#3366ff",
		};

		const next = EventsList.add(toStore);
		setEvents(next);
		setRightMode("day");
		setViewEvent(null);
		setSelected(new Date(y, m, d));
	}

	// <-- ajout : fonction manquante clearAllEvents (corrige l'erreur no-undef)
	function clearAllEvents() {
		if (!window.confirm("Supprimer tous les événements ?")) return;
		EventsList.clear();
		setEvents([]);
		setRightMode("day");
		setViewEvent(null);
	}

	function deleteEvent(ev) {
		if (!ev) return;
		if (!window.confirm("Supprimer cet événement ?")) return;
		const next = EventsList.removeById(ev.id);
		setEvents(next);
		setRightMode("day");
		setViewEvent(null);
	}

	function handleVote(eventId, type, itemId) {
		// pour simplicité on incrémente un compteur local par itemId ; structure votes: { time: { slotId: count }, location: { optId: count } }
		EventsList.updateById(eventId, ev => {
			const next = { ...ev };
			next.votes = next.votes || { time: {}, location: {} };
			if (!next.votes[type]) next.votes[type] = {};
			const cur = next.votes[type][itemId] || 0;
			next.votes[type] = { ...next.votes[type], [itemId]: cur + 1 };
			return next;
		});
		// rafraîchir la liste en mémoire
		setEvents(EventsList.load());
		// si on visualise l'évènement en cours, mettre à jour sa instance
		if (viewEvent && viewEvent.id === eventId) {
			const updated = EventsList.load().find(e => e.id === eventId);
			setViewEvent(updated || null);
		}
	}

	// events pour la date sélectionnée
	const eventsForSelectedDate = selected ? EventsList.findByYMD(selected.getFullYear(), selected.getMonth(), selected.getDate()) : [];

	const weekdays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

	return (
		/* wrapper layout géré par CSS .app-layout */
		<div className="app-layout">
			{/* gauche : calendrier */}
			<aside className="cal-card cal-left" aria-label="Calendrier">
				<header className="cal-header">
					<button className="cal-btn" onClick={prevMonth} aria-label="Mois précédent">‹</button>

					<div className="cal-title-wrap">
						<div className="cal-title" aria-live="polite">{monthLabel}</div>
						<button type="button" className="cal-btn cal-today-btn" onClick={goToday} aria-label="Aller au mois courant">Aujourd'hui</button>
						{/* nouveau bouton pour vider tous les événements */}
						<button type="button" className="cal-btn cal-clear-btn" onClick={clearAllEvents} aria-label="Supprimer tous les événements">X</button>
					</div>

					<button className="cal-btn" onClick={nextMonth} aria-label="Mois suivant">›</button>
				</header>

				<div className="cal-grid">
					{/* en-têtes jours */}
					{weekdays.map(d => (
						<div key={d} className="cal-weekday">{d}</div>
					))}

					{/* cellules */}
					{weeks.flat().map(({ date, inMonth }) => {
						const isToday = sameDay(date, today);
						const isSelected = selected && sameDay(date, selected);
						// récupérer les événements du jour (utilisé pour repères colorés)
						const dayEvents = events.filter(ev =>
							ev && typeof ev.y === "number" && ev.y === date.getFullYear()
							&& ev.m === date.getMonth() && ev.d === date.getDate()
						);
						const hasEvent = dayEvents.length > 0;
						const classes = [
							"cal-cell",
							!inMonth ? "cal-cell--muted" : "",
							isToday ? "cal-cell--today" : "",
							isSelected ? "cal-cell--selected" : "",
						].join(" ").trim();

						return (
							<button
								type="button"
								key={date.getTime()}
								className={classes}
								// passer l'événement pour positionnement du PopOver
								onClick={() => onSelect(date, inMonth)}
								aria-pressed={isSelected}
								aria-label={`Le ${date.toLocaleDateString("fr-FR")}${!inMonth ? " (hors mois)" : ""}`}
							>
								<span className="cal-day">{date.getDate()}</span>
								{/* repères colorés (jusqu'à 3) */}
								{hasEvent && (
									<div className="cal-event-dots" aria-hidden="true">
										{dayEvents.slice(0, 3).map(ev => (
											<span key={ev.id} className="cal-event-dot" style={{ background: ev.color || "#3366ff" }} />
										))}
										{dayEvents.length > 3 && <span className="cal-event-dot cal-event-dot--more">+{dayEvents.length - 3}</span>}
									</div>
								)}
								<div className="cal-cell-content" aria-hidden="true"></div>
							</button>
						);
					})}
				</div>
			</aside>

			{/* droite : panneau contextuel */}
			<RightPanel
				date={selected}
				mode={rightMode}
				events={eventsForSelectedDate}
				viewEvent={viewEvent}
				onBack={() => { setRightMode("day"); setViewEvent(null); }}
				onEventClick={(ev, slot) => onHourEventClick(ev, slot)} // <-- pass slot too
				onCreateClick={() => onStartCreateFromPanel()}
				onCreate={handleCreateEvent}
				onDelete={deleteEvent}
				onVote={handleVote}
			/>
		</div>
	);
}