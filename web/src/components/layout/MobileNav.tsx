import { NavLink } from "react-router-dom";
import { Icons } from "../ui/Icons";
import "./mobile-nav.css";

interface MobileNavProps {
  open: boolean;
  coach: { name: string; email: string };
  onClose: () => void;
  onOpen: () => void;
  onLogout: () => void;
}

const moreTools = [
  { path: "/crm/analyses", label: "Body Analysis", icon: <Icons.BodyAnalysis /> },
  { path: "/crm/homevisit", label: "Home Visits", icon: <Icons.HomeVisit /> },
  { path: "/crm/meetings", label: "Zoom Invitations", icon: <Icons.Campaigns /> },
  { path: "/crm/followups", label: "Follow-ups", icon: <Icons.FollowUps /> },
  { path: "/crm/customers", label: "Customers", icon: <Icons.Customers /> },
  { path: "/crm/pipeline", label: "Interest Board", icon: <Icons.Pipeline /> },
  { path: "/crm/orders", label: "Orders & Payments", icon: <Icons.Orders /> },
  { path: "/crm/revenue", label: "Money", icon: <Icons.Revenue /> },
  { path: "/crm/campaigns", label: "Group Messages", icon: <Icons.Message /> },
  { path: "/crm/reports", label: "Reports", icon: <Icons.Reports /> },
  { path: "/crm/settings", label: "Settings", icon: <Icons.Settings /> },
];

export function MobileNav({ open, coach, onClose, onOpen, onLogout }: MobileNavProps) {
  return (
    <>
      {open && (
        <div className="mobile-more-overlay" role="dialog" aria-modal="true" aria-label="More tools">
          <button className="mobile-more-backdrop" onClick={onClose} aria-label="Close more tools" />
          <section className="mobile-more-sheet">
            <header>
              <div>
                <span>All tools</span>
                <h2>What do you need?</h2>
              </div>
              <button className="mobile-sheet-close" onClick={onClose} aria-label="Close navigation"><Icons.Close /></button>
            </header>
            <nav className="mobile-tool-grid" aria-label="All CRM tools">
              {moreTools.map((item) => (
                <NavLink key={item.path} to={item.path} onClick={onClose} aria-label={item.label}>
                  <span>{item.icon}</span>{item.label}
                </NavLink>
              ))}
            </nav>
            <footer>
              <div><strong>{coach.name}</strong><span>{coach.email}</span></div>
              <button onClick={onLogout}><Icons.Logout /> Sign out</button>
            </footer>
          </section>
        </div>
      )}
      <nav className="mobile-bottom-nav" aria-label="Main navigation">
        <NavLink to="/crm" end aria-label="Home"><Icons.HomeVisit /><span>Home</span></NavLink>
        <NavLink to="/crm/leads" aria-label="People"><Icons.Leads /><span>People</span></NavLink>
        <NavLink to="/crm/today" aria-label="Activity"><Icons.Today /><span>Activity</span></NavLink>
        <button onClick={onOpen} aria-label="More"><Icons.Menu /><span>More</span></button>
      </nav>
    </>
  );
}
