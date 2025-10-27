import React, { useEffect, useRef } from "react";
import "../styles/PopOver.css"; // ajout import style

export default function PopOver({ top, left, onClose, onCreateClick, onViewClick, onDeleteClick, events = [], children, ariaLabel = "Options" }) {
	const ref = useRef(null);

	useEffect(() => {
		function onDocClick(e) {
			if (ref.current && !ref.current.contains(e.target)) onClose();
		}
		function onKey(e) { if (e.key === "Escape") onClose(); }
		document.addEventListener("mousedown", onDocClick);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onDocClick);
			document.removeEventListener("keydown", onKey);
		};
	}, [onClose]);

	// position légèrement décalée pour éviter chevauchement
	const style = { position: "absolute", top: `${top}px`, left: `${left}px`, zIndex: 1000 };

	return (
		<div ref={ref} className="popover-wrapper" style={style} role="menu" aria-label={ariaLabel}>
			<div className="popover">
				<div className="popover-arrow" aria-hidden="true" />
				<div className="popover-content">
					<button type="button" className="popover-btn" onClick={() => { onCreateClick(); }}>
						Créer un événement
					</button>

					{/* Liste des événements sur cette date */}
					{events && events.length > 0 ? (
						<div className="popover-events-list" style={{ marginTop: 8 }}>
							{events.map(ev => (
								<div key={ev.id} className="popover-event-item" style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
									<div style={{ flex: 1, minWidth: 0 }}>
										<div style={{ fontSize: 13, fontWeight: 600, color: "#0b2540", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.title}</div>
										{ev.time && ev.time.type === "fixed" && ev.time.start && ev.time.end && (
											<div style={{ fontSize: 12, color: "#334e68" }}>{ev.time.start} - {ev.time.end}</div>
										)}
										{ev.time && ev.time.type === "poll" && ev.time.slots && <div style={{ fontSize: 12, color: "#334e68" }}>{ev.time.slots.length} créneau(s)</div>}
									</div>

									<div style={{ display: "flex", gap: 6, marginLeft: 8 }}>
										<button className="secondary-btn" onClick={() => { onViewClick && onViewClick(ev); }}>Voir</button>
										<button className="danger-btn" onClick={() => { onDeleteClick && onDeleteClick(ev); }}>Suppr</button>
									</div>
								</div>
							))}
						</div>
					) : (
						<div style={{ marginTop: 8, color: "#4b5563", fontSize: 13 }}>Aucun événement</div>
					)}

					{children}
				</div>
			</div>
		</div>
	);
}