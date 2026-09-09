import { Link } from "react-router-dom";
import { Icons } from "../components/ui/Icons";
import "./crm-home.css";

const tasks = [
  {
    title: "Body Analysis",
    description: "Create a health assessment or find an existing report.",
    action: "Start body analysis",
    href: "/crm/analyses",
    icon: <Icons.BodyAnalysis size={24} />,
  },
  {
    title: "Home Visits",
    description: "Plan a visit and see the appointments coming up today.",
    action: "Plan a home visit",
    href: "/crm/homevisit",
    icon: <Icons.HomeVisit size={24} />,
  },
  {
    title: "Zoom Invitations",
    description: "Paste the WhatsApp message and see who opened the meeting.",
    action: "Create Zoom invitation",
    href: "/crm/meetings",
    icon: <Icons.Campaigns size={24} />,
  },
];

export function CRMHomePage() {
  return (
    <div className="crm-home">
      <header className="crm-home-heading">
        <p>Welcome back</p>
        <h1>What would you like to do today?</h1>
        <span>Choose a task to get started.</span>
      </header>
      <section className="primary-task-grid" aria-label="Everyday tasks">
        {tasks.map((task, index) => (
          <article className="primary-task-card" key={task.href}>
            <div className="primary-task-top">
              <span className="primary-task-number">0{index + 1}</span>
              <span className="primary-task-icon">{task.icon}</span>
            </div>
            <div>
              <h2>{task.title}</h2>
              <p>{task.description}</p>
            </div>
            <Link to={task.href} aria-label={task.action}>
              {task.action}<span aria-hidden="true">→</span>
            </Link>
          </article>
        ))}
      </section>
      <section className="crm-home-secondary" aria-label="Other common tasks">
        <h2>Other common tasks</h2>
        <div>
          <Link to="/crm/leads">Find a person</Link>
          <Link to="/crm/followups">See follow-ups</Link>
          <Link to="/crm/today">View today’s activity</Link>
        </div>
      </section>
    </div>
  );
}
