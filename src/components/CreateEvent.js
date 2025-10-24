import React, { useState } from "react";
import "../styles/CreateEvent.css";

export default function CreateEvent({ date, onClose, onCreate }) {
    const isoDate = new Date(date).toISOString().slice(0, 10); // YYYY-MM-DD
    const [title, setTitle] = useState("");
    const [time, setTime] = useState("");
    const [description, setDescription] = useState("");

    function submit(e) {
        e.preventDefault();
        if (!title.trim()) return; // validation minimale
        onCreate({
            title: title.trim(),
            date: isoDate,
            time: time.trim(),
            description: description.trim(),
        });
        // reset fields optionnel
    }

    return (
        <div className="ce-overlay" role="dialog" aria-modal="true" aria-label="Créer un événement">
            <div className="ce-modal">
                <header className="ce-header">
                    <h3>Nouvel événement</h3>
                    <button className="ce-close" onClick={onClose} aria-label="Fermer">✕</button>
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

                    <label className="ce-label">
                        Heure
                        <input className="ce-input" type="time" value={time} onChange={e => setTime(e.target.value)} />
                    </label>

                    <label className="ce-label">
                        Description
                        <textarea className="ce-textarea" value={description} onChange={e => setDescription(e.target.value)} />
                    </label>

                    <div className="ce-actions">
                        <button type="button" className="ce-btn ce-btn--ghost" onClick={onClose}>Annuler</button>
                        <button type="submit" className="ce-btn ce-btn--primary">Créer</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
