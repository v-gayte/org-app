import React from "react";

export default function EventBlock({ block, hourHeight, onClick }) {
	// block: { id, ev, startMin, endMin, isSlot, slot }
	const startMin = block.startMin || 0;
	const endMin = block.endMin || (startMin + 60);
	const top = Math.max(0, Math.round((startMin / 60) * hourHeight));
	const height = Math.max(28, Math.round(((endMin - startMin) / 60) * hourHeight));
	const bg = block.ev?.color || "#3366ff";

	// contraste simple (heuristique)
	const isLight = (() => {
		try {
			const c = (bg || "#3366ff").replace("#", "");
			const r = parseInt(c.slice(0,2),16), g = parseInt(c.slice(2,4),16), b = parseInt(c.slice(4,6),16);
			const lum = 0.2126*r + 0.7152*g + 0.0722*b;
			return lum > 200;
		} catch { return false; }
	})();

	return (
		<button
			type="button"
			className="rp-event-block"
			onClick={() => onClick(block.ev, block.slot || null)}
			style={{ top: `${top}px`, height: `${height}px`, background: bg, borderColor: bg }}
			data-contrast={isLight ? "dark" : "light"}
			title={block.ev?.title}
		>
			<div className="rp-event-block-title">{block.ev?.title}</div>
			{block.isSlot && block.slot && <div className="rp-event-block-sub">{block.slot.start}–{block.slot.end}</div>}
			{!block.isSlot && block.ev?.time && block.ev.time.start && <div className="rp-event-block-sub">{block.ev.time.start}{block.ev.time.end ? `–${block.ev.time.end}` : ""}</div>}
		</button>
	);
}
