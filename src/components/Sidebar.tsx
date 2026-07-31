import { NavLink } from 'react-router-dom';
import { loadSettings } from '../types/Appraisal';
import './Sidebar.css';

const NAV = [
  { to: '/', label: "Today's Work", icon: '☰', end: true },
  { to: '/queue', label: 'Demo Queue', icon: '◫' },
  { to: '/review', label: 'Custom Review', icon: '✎' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
];

export default function Sidebar() {
  const settings = loadSettings();

  return (
    <aside className="sidebar no-print">
      <div className="sidebar-brand">
        <div className="brand-mark">CV</div>
        <div>
          <div className="brand-title">Collateral Valuation Review</div>
          <div className="brand-sub">UAD 3.6 · Admin Pre-Fill</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            <span className="nav-icon">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-foot">
        <span className={`mode-pill ${settings.demoMode ? 'demo' : 'live'}`}>
          {settings.demoMode ? 'Demo Mode' : 'Live Extract'}
        </span>
      </div>
    </aside>
  );
}
