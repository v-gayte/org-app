import React, { useRef, useState, useLayoutEffect } from "react";
import "../styles/RightPanel.css";
import CreateEvent from "./CreateEvent";
import EventBlock from "./EventBlock";

export default function RightPanel({ date, mode = "day", events = [], viewEvent, onBack, onEventClick, onCreateClick, onCreate, onDelete, onVote }) {
	// ref pour lire la variable CSS --hour-height
	const panelRef = useRef(null);
	const [hourHeight, setHourHeight] = useState(60); // fallback

	useLayoutEffect(() => {
		if (panelRef.current) {
			const cs = getComputedStyle(panelRef.current);
			const v = cs.getPropertyValue("--hour-height") || cs.getPropertyValue("--hourHeight");
			if (v) {
				const parsed = parseInt(v.trim().replace("px", ""), 10);
				if (!isNaN(parsed) && parsed > 0) setHourHeight(parsed);
			}
		}
	}, []);

	// helper: format date label
	const dateLabel = date ? new Date(date).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }) : "Aucune date sélectionnée";

	// helper: retourne le slot "gagnant" pour un évènement sondage
	function selectWinningSlot(ev) {
		if (!ev || !ev.time || ev.time.type !== "poll" || !Array.isArray(ev.time.slots) || ev.time.slots.length === 0) return null;
		const slots = ev.time.slots;
		const votes = ev.votes?.time || {};
		let max = -1;
		for (const s of slots) {
			const c = votes[s.id] || 0;
			if (c > max) max = c;
		}
		// première proposition en cas d'égalité
		const winner = slots.find(s => (votes[s.id] || 0) === max);
		return winner || slots[0] || null;
	}

	// construction des blocks : pour les sondages on n'ajoute QUE le slot gagnant
	const blocks = [];
	(events || []).forEach(ev => {
		const toMinutes = (t) => {
			if (!t || typeof t !== "string") return 0;
			const [hh, mm] = t.split(":").map(s => parseInt(s || "0", 10));
			return (isNaN(hh) ? 0 : hh) * 60 + (isNaN(mm) ? 0 : mm);
		};

		if (ev.time && ev.time.type === "fixed" && ev.time.start) {
			const startMin = toMinutes(ev.time.start);
			const endMin = ev.time.end ? toMinutes(ev.time.end) : startMin + 60;
			blocks.push({ id: ev.id, ev, startMin, endMin, isSlot: false, slot: null });
		} else if (ev.time && ev.time.type === "poll" && Array.isArray(ev.time.slots)) {
			// ne garder que le slot gagnant (ou le premier si aucun vote)
			const winner = selectWinningSlot(ev);
			if (winner) {
				const startMin = toMinutes(winner.start);
				const endMin = winner.end ? toMinutes(winner.end) : startMin + 60;
				blocks.push({ id: ev.id + "-" + winner.id, ev, startMin, endMin, isSlot: true, slot: winner });
			}
		} else {
			// pas d'heure : petit bloc en haut
			blocks.push({ id: ev.id + "-all", ev, startMin: 0, endMin: 60, isSlot: false, slot: null });
		}
	});

	return (
		<aside className="right-panel" ref={panelRef} style={{ "--hour-height": `${hourHeight}px` }}>
			<header className="rp-header">
				<h2>{dateLabel}</h2>
				{mode === "view" ? <button className="ce-btn ce-btn--ghost" onClick={onBack}>Retour</button> : null}
			</header>

			<div className="rp-body">
				{!date && <div className="rp-empty">Sélectionnez un jour pour voir les détails</div>}

				{date && mode === "day" && (
					<div className="rp-day">
						<div className="rp-timeline-wrapper">
							<div className="rp-time-labels">
								{Array.from({ length: 24 }, (_, h) => (
									<div key={h} className="rp-hour-label">{String(h).padStart(2, "0")}:00</div>
								))}
							</div>

							<div className="rp-timeline" style={{ height: `calc(var(--hour-height) * 24)` }}>
								{/* hour grid lines */}
								{Array.from({ length: 24 }, (_, h) => (
									<div key={h} className="rp-grid-hour" style={{ top: `${h * hourHeight}px`, height: `${hourHeight}px` }} />
								))}

								{/* event blocks */}
								{blocks.map(b => (
									<EventBlock key={b.id} block={b} hourHeight={hourHeight} onClick={(ev, slot) => onEventClick(ev, slot)} />
								))}
							</div>
						</div>

						<div className="rp-actions">
							<button className="ce-btn ce-btn--primary rp-add-btn" onClick={onCreateClick}>+</button>
						</div>
					</div>
				)}

				{date && mode === "create" && (
					<div className="rp-create">
						<CreateEvent date={date} onClose={onBack} onCreate={onCreate} asModal={false} />
					</div>
				)}

				{date && mode === "view" && viewEvent && (
					<div className="rp-view">
						<div className="rp-view-header">
							<h3>{viewEvent.title}</h3>
							<div style={{ display: "flex", gap: 8 }}>
								<button className="ce-btn ce-btn--ghost" onClick={() => onDelete(viewEvent)}>Supprimer</button>
							</div>
						</div>

						<div className="rp-view-body">
							{viewEvent.images?.pp && <img src={viewEvent.images.pp} alt="pp" className="rp-pp" />}
							{viewEvent.images?.presentation && <img src={viewEvent.images.presentation} alt="presentation" className="rp-presentation" />}

							<p><strong>Date :</strong> {new Date(viewEvent.y, viewEvent.m, viewEvent.d).toLocaleDateString("fr-FR")}</p>

							{/* time: fixed or poll -> show winning slot when poll */}
							{viewEvent.time && viewEvent.time.type === "fixed" && (
								<p><strong>Heure :</strong> {viewEvent.time.start}{viewEvent.time.end ? ` - ${viewEvent.time.end}` : ""}</p>
							)}

							{viewEvent.time && viewEvent.time.type === "poll" && (
								<div>
									<p><strong>Sondage — créneaux :</strong></p>
									<ul>
										{(viewEvent.time.slots || []).map(slot => (
											<li key={slot.id} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
												<span>{slot.start} — {slot.end}</span>
												<div style={{ display: "flex", gap: 8 }}>
													<button className="ce-btn ce-btn--primary" onClick={() => onVote(viewEvent.id, "time", slot.id)}>Voter</button>
													<span className="rp-votes">{(viewEvent.votes?.time?.[slot.id] || 0)} vote(s)</span>
												</div>
											</li>
										))}
									</ul>

									{/* afficher le créneau "gagnant" selon la règle demandée */}
									<div style={{ marginTop: 8 }}>
										<strong>Créneau choisi :</strong>{" "}
										{(() => {
											const winner = selectWinningSlot(viewEvent);
											return winner ? `${winner.start} — ${winner.end}` : "Aucun";
										})()}
									</div>
								</div>
							)}

							{viewEvent.location && viewEvent.location.type === "fixed" && <p><strong>Lieu :</strong> {viewEvent.location.value}</p>}
							{viewEvent.location && viewEvent.location.type === "poll" && (
								<div>
									<p><strong>Sondage — lieux :</strong></p>
									<ul>
										{(viewEvent.location.options || []).map(opt => (
											<li key={opt.id} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
												<span>{opt.value}</span>
												<div style={{ display: "flex", gap: 8 }}>
													<button className="ce-btn ce-btn--primary" onClick={() => onVote(viewEvent.id, "location", opt.id)}>Voter</button>
													<span className="rp-votes">{(viewEvent.votes?.location?.[opt.id] || 0)} vote(s)</span>
												</div>
											</li>
										))}
									</ul>

									<div style={{ marginTop: 8 }}>
										<strong>Lieu choisi :</strong>{" "}
										{(() => {
											// same logic for location poll: first in options wins on tie
											if (!viewEvent.location || viewEvent.location.type !== "poll") return "—";
											const opts = viewEvent.location.options || [];
											const votes = viewEvent.votes?.location || {};
											let max = -1;
											for (const o of opts) {
												const c = votes[o.id] || 0;
												if (c > max) max = c;
											}
											const winner = opts.find(o => (votes[o.id] || 0) === max) || opts[0] || null;
											return winner ? winner.value : "Aucun";
										})()}
									</div>
								</div>
							)}

							{viewEvent.description && <p style={{ marginTop: 8 }}><strong>Description :</strong><br />{viewEvent.description}</p>}
						</div>
					</div>
				)}
			</div>
		</aside>
	);
}
