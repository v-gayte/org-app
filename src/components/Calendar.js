import React, { useState, useMemo, useEffect } from "react";
import "../styles/Calendar.css";
import CreateEvent from "./CreateEvent";

function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(date.getDate() + days);
    return result;
}

export default function Calendar() {
    // état du mois affiché (jour 1 du mois)
    const [viewMonth, setViewMonth] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });
    const [selected, setSelected] = useState(null);
    // modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalDate, setModalDate] = useState(null);

    // events persisted en localStorage (simple front-end)
    const [events, setEvents] = useState(() => {
        try {
            const raw = localStorage.getItem("calendarEvents");
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem("calendarEvents", JSON.stringify(events));
        } catch {}
    }, [events]);

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

    function onSelect(date, inMonth) {
        // ouvrir modal pour créer un événement sur la date sélectionnée
        setSelected(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
        setModalDate(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
        setModalOpen(true);

        // si on clique sur une cellule hors mois, on change le mois affiché (UX inchangé)
        if (!inMonth) {
            setViewMonth(new Date(date.getFullYear(), date.getMonth(), 1));
        }
    }

    function handleCreateEvent(eventObj) {
        // eventObj.date attendu en ISO string ou Date convertible
        const toStore = {
            id: Date.now(),
            title: eventObj.title || "Événement",
            date: (eventObj.date && new Date(eventObj.date).toISOString()) || new Date().toISOString(),
            time: eventObj.time || "",
            description: eventObj.description || "",
        };
        setEvents(prev => [...prev, toStore]);
        setModalOpen(false);
    }

    function handleCloseModal() {
        setModalOpen(false);
    }

    const weekdays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

    return (
        <aside className="cal-card" aria-label="Calendrier">
            <header className="cal-header">
                <button className="cal-btn" onClick={prevMonth} aria-label="Mois précédent">‹</button>

                <div className="cal-title-wrap">
                    <div className="cal-title" aria-live="polite">{monthLabel}</div>
                    <button type="button" className="cal-btn cal-today-btn" onClick={goToday} aria-label="Aller au mois courant">Aujourd'hui</button>
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
                    const hasEvent = events.some(ev => sameDay(new Date(ev.date), date));
                    const classes = [
                        "cal-cell",
                        !inMonth ? "cal-cell--muted" : "",
                        isToday ? "cal-cell--today" : "",
                        isSelected ? "cal-cell--selected" : "",
                    ].join(" ").trim();

                    return (
                        <button
                            type="button"
                            key={date.toISOString()}
                            className={classes}
                            onClick={() => onSelect(date, inMonth)}
                            aria-pressed={isSelected}
                            aria-label={`Le ${date.toLocaleDateString("fr-FR")}${!inMonth ? " (hors mois)" : ""}`}
                        >
                            <span className="cal-day">{date.getDate()}</span>
                            {/* petit indicateur d'événement */}
                            {hasEvent && <span className="cal-event-dot" aria-hidden="true" />}
                            <div className="cal-cell-content" aria-hidden="true"></div>
                        </button>
                    );
                })}
            </div>

            {/* modal CreateEvent */}
            {modalOpen && modalDate && (
                <CreateEvent
                    date={modalDate}
                    onClose={handleCloseModal}
                    onCreate={handleCreateEvent}
                />
            )}
        </aside>
    );
}