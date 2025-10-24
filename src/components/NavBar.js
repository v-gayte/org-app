import { NavLink } from "react-router-dom";
import "../styles/NavBar.css";


const links = [
    { to: "/", label: "Accueil", end: true },
    { to: "/about", label: "À propos" },
    { to: "/projects", label: "Projets" },
    { to: "/contact", label: "Contact" },
];

export default function NavBar() {
    return (
        <nav className="navbar" aria-label="Navigation principale">
            <div className="brand">Org-app</div>

            <ul className="nav-list">
                {links.map(({ to, label, end }) => (
                    <li key={to}>
                        <NavLink
                            to={to}
                            end={end}
                            className={({ isActive }) =>
                                isActive ? "nav-link nav-link--active" : "nav-link"
                            }
                        >
                            {label}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </nav>
    );
}