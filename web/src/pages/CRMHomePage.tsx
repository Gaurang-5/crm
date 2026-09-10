import { Link } from 'react-router-dom';
import { Icons } from '../components/ui/Icons';
import { Brand } from '../components/layout/Brand';
import './crm-home.css';

const tasks = [
  { title: 'Body Analysis', subtitle: 'Understand the person.', detail: 'Assessments & reports', action: 'Start body analysis', href: '/crm/analyses', icon: <Icons.BodyAnalysis size={27} /> },
  { title: 'Home Visits', subtitle: 'Care, a little closer.', detail: 'Visit records & wellness profiles', action: 'Plan a home visit', href: '/crm/homevisit', icon: <Icons.HomeVisit size={27} /> },
  { title: 'Zoom Invitations', subtitle: 'Bring everyone together.', detail: 'Meeting links & invitation activity', action: 'Create Zoom invitation', href: '/crm/meetings', icon: <Icons.Campaigns size={27} /> },
];

export function CRMHomePage() {
  const date = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  return <div className="studio-home">
    <header className="studio-dateline"><span>Lifestyle Mantra · Coach’s desk</span><time dateTime={new Date().toLocaleDateString('en-CA')}>{date}</time></header>
    <div className="studio-workspace">
      <section className="studio-welcome" aria-labelledby="studio-title">
        <div className="studio-welcome-top"><Brand compact /><span>YOUR SPACE<br/>TO MAKE A DIFFERENCE</span></div>
        <div className="studio-welcome-copy"><span className="studio-eyebrow">Welcome back</span><h1 id="studio-title">Wellness<br/>{' '}starts with<br/>{' '}<em>a connection.</em></h1><p>A conversation. A visit. A fresh start.<br/>Who will you help today?</p></div>
        <div className="studio-welcome-bottom"><span>Choose a task to begin</span><span aria-hidden="true">↗</span></div>
      </section>
      <section className="studio-tasks" aria-label="Everyday tasks">
        <header><span>LET’S GET STARTED</span><span>03 everyday essentials</span></header>
        {tasks.map((task, index) => <Link className="studio-task" to={task.href} aria-label={task.action} key={task.href}>
          <div className="studio-task-meta"><span>0{index + 1}</span><span>{task.detail}</span></div>
          <div className="studio-task-main"><span className="studio-task-icon" aria-hidden="true">{task.icon}</span><div><h2>{task.title}</h2><p>{task.subtitle}</p></div><span className="studio-task-arrow" aria-hidden="true">↗</span></div>
        </Link>)}
      </section>
    </div>
    <section className="studio-shortcuts" aria-label="Other common tasks">
      <div className="studio-shortcut-intro"><span>KEEP THINGS MOVING</span><p>The little things,<br/>all in one place.</p></div>
      <Link to="/crm/leads"><Icons.Leads size={21}/><span><strong>Find a person</strong><small>Names, numbers & conversations</small></span><span aria-hidden="true">↗</span></Link>
      <Link to="/crm/followups"><Icons.FollowUps size={21}/><span><strong>See follow-ups</strong><small>Pick up where you left off</small></span><span aria-hidden="true">↗</span></Link>
      <Link to="/crm/today"><Icons.Today size={21}/><span><strong>View today’s activity</strong><small>See what needs your attention</small></span><span aria-hidden="true">↗</span></Link>
    </section>
  </div>;
}
