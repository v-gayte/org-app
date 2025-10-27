import React, { useState } from "react";
import "../styles/CreateEvent.css";

export default function CreateEvent({ date, onClose, onCreate, asModal = false }) {
	// calculer une chaîne YYYY-MM-DD en heure locale (évite les décalages liés à toISOString())
	const pad = n => String(n).padStart(2, "0");
	const isoDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`; // YYYY-MM-DD
	const [title, setTitle] = useState("");
	const [timeType, setTimeType] = useState("fixed"); // 'fixed' | 'poll'
	const [startTime, setStartTime] = useState("");
	const [endTime, setEndTime] = useState("");
	const [slots, setSlots] = useState([]); // [{id, start, end}]
	const [locationType, setLocationType] = useState("fixed"); // 'fixed' | 'poll'
	const [fixedLocation, setFixedLocation] = useState("");
	const [locations, setLocations] = useState([]); // [{id, value}]
	const [ppImage, setPpImage] = useState(null); // dataURL
	const [presentationImage, setPresentationImage] = useState(null); // dataURL
	const [description, setDescription] = useState("");
	// nouveau : couleur de l'évènement
	const [color, setColor] = useState("#3366ff");

	function readFileAsDataURL(file) {
		return new Promise((resolve, reject) => {
			if (!file) return resolve(null);
			const fr = new FileReader();
			fr.onload = () => resolve(fr.result);
			fr.onerror = reject;
			fr.readAsDataURL(file);
		});
	}

	async function handlePpChange(e) {
		const f = e.target.files && e.target.files[0];
		if (!f) return setPpImage(null);
		const data = await readFileAsDataURL(f);
		setPpImage(data);
	}

	async function handlePresentationChange(e) {
		const f = e.target.files && e.target.files[0];
		if (!f) return setPresentationImage(null);
		const data = await readFileAsDataURL(f);
		setPresentationImage(data);
	}

	function addSlot() {
		setSlots(s => [...s, { id: Date.now() + Math.random(), start: "", end: "" }]);
	}
	function updateSlot(id, field, value) {
		setSlots(s => s.map(slot => slot.id === id ? { ...slot, [field]: value } : slot));
	}
	function removeSlot(id) {
		setSlots(s => s.filter(slot => slot.id !== id));
	}

	function addLocationOption() {
		setLocations(l => [...l, { id: Date.now() + Math.random(), value: "" }]);
	}
	function updateLocation(id, value) {
		setLocations(l => l.map(it => it.id === id ? { ...it, value } : it));
	}
	function removeLocation(id) {
		setLocations(l => l.filter(it => it.id !== id));
	}

	async function submit(e) {
		e.preventDefault();
		if (!title.trim()) return;
		// construire structure time
		let time = null;
		if (timeType === "fixed") {
			time = { type: "fixed", start: startTime, end: endTime };
		} else {
			time = { type: "poll", slots: slots.map(s => ({ id: s.id, start: s.start, end: s.end })) };
		}
		// construire structure location
		let location = null;
		if (locationType === "fixed") {
			location = { type: "fixed", value: fixedLocation };
		} else {
			location = { type: "poll", options: locations.map(l => ({ id: l.id, value: l.value })) };
		}
		// images déjà en dataURL si fournis
		const images = {
			pp: ppImage,
			presentation: presentationImage,
		};

		onCreate({
			title: title.trim(),
			date: { y: date.getFullYear(), m: date.getMonth(), d: date.getDate() },
			time,
			location,
			images,
			description: description.trim(),
			color, // <-- envoyer la couleur choisie
		});
		// optional reset
	}

	// wrapper class different selon asModal
	const containerClass = asModal ? "ce-overlay" : "ce-panel-inline";

	return (
		<div className={containerClass} role="dialog" aria-modal={asModal} aria-label="Créer un événement">
			<div className="ce-modal-inline">
				{/* header */}
				<header className="ce-header">
					<h3>Nouvel événement</h3>
					{onClose && <button className="ce-close" onClick={onClose} aria-label="Fermer">✕</button>}
				</header>

				<form className="ce-form" onSubmit={submit}>
					<label className="ce-label">
						Date
						<input className="ce-input" type="date" value={isoDate} readOnly />
					</label>

					<label className="ce-label">
						Titre
						<input className="ce-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Nom de l'événement" />
					</label>

					{/* Images */}
					<label className="ce-label">
						Image de profil (pp)
						<input className="ce-input" type="file" accept="image/*" onChange={handlePpChange} />
					</label>
					{ppImage && <img src={ppImage} alt="pp preview" style={{ maxWidth: "100px", marginBottom: 8 }} />}

					<label className="ce-label">
						Image de présentation
						<input className="ce-input" type="file" accept="image/*" onChange={handlePresentationChange} />
					</label>
					{presentationImage && <img src={presentationImage} alt="presentation preview" style={{ maxWidth: "200px", marginBottom: 8 }} />}

					{/* Heures : fixe ou sondage */}
					<fieldset className="ce-fieldset">
						<legend>Heures</legend>
						<label><input type="radio" checked={timeType === "fixed"} onChange={() => setTimeType("fixed")} /> Fixe</label>
						<label><input type="radio" checked={timeType === "poll"} onChange={() => setTimeType("poll")} /> Sondage</label>

						{timeType === "fixed" && (
							<div style={{ display: "flex", gap: 8, marginTop: 8 }}>
								<input className="ce-input" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
								<input className="ce-input" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
							</div>
						)}

						{timeType === "poll" && (
							<div style={{ marginTop: 8 }}>
								{slots.map(slot => (
									<div key={slot.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
										<input className="ce-input" type="time" value={slot.start} onChange={e => updateSlot(slot.id, "start", e.target.value)} />
										<input className="ce-input" type="time" value={slot.end} onChange={e => updateSlot(slot.id, "end", e.target.value)} />
										<button type="button" className="ce-btn ce-btn--ghost" onClick={() => removeSlot(slot.id)}>Suppr</button>
									</div>
								))}
								<button type="button" className="ce-btn" onClick={addSlot}>Ajouter un créneau</button>
							</div>
						)}
					</fieldset>

					{/* Lieu : fixe ou sondage */}
					<fieldset className="ce-fieldset" style={{ marginTop: 12 }}>
						<legend>Lieu</legend>
						<label><input type="radio" checked={locationType === "fixed"} onChange={() => setLocationType("fixed")} /> Fixe</label>
						<label><input type="radio" checked={locationType === "poll"} onChange={() => setLocationType("poll")} /> Sondage</label>

						{locationType === "fixed" && (
							<div style={{ marginTop: 8 }}>
								<input className="ce-input" value={fixedLocation} onChange={e => setFixedLocation(e.target.value)} placeholder="Adresse, salle, etc." />
							</div>
						)}

						{locationType === "poll" && (
							<div style={{ marginTop: 8 }}>
								{locations.map(loc => (
									<div key={loc.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
										<input className="ce-input" value={loc.value} onChange={e => updateLocation(loc.id, e.target.value)} placeholder="Proposition de lieu" />
										<button type="button" className="ce-btn ce-btn--ghost" onClick={() => removeLocation(loc.id)}>Suppr</button>
									</div>
								))}
								<button type="button" className="ce-btn" onClick={addLocationOption}>Ajouter une proposition</button>
							</div>
						)}
					</fieldset>

					<label className="ce-label" style={{ marginTop: 12 }}>
						Description
						<textarea className="ce-textarea" value={description} onChange={e => setDescription(e.target.value)} />
					</label>

					{/* Couleur — row avec preview */}
					<label className="ce-label">
						Couleur de l'événement
						<div className="ce-color-row">
							<input className="ce-input" type="color" value={color} onChange={e => setColor(e.target.value)} />
							<div className="ce-color-swatch" style={{ background: color }} aria-hidden="true" />
						</div>
					</label>

					{/* actions */}
					<div className="ce-actions">
						{onClose && <button type="button" className="ce-btn ce-btn--ghost" onClick={onClose}>Annuler</button>}
						<button type="submit" className="ce-btn ce-btn--primary">Créer</button>
					</div>
				</form>
			</div>
		</div>
	);
}
