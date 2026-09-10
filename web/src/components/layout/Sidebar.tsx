import React from 'react';
import { NavLink } from 'react-router-dom';
import { Icons } from '../ui/Icons';
import { Brand } from './Brand';
export interface NavItem { path: string; label: string; icon: React.ReactNode; end?: boolean; }
export const navItems: NavItem[] = [
  { path: '/crm', label: 'Home', icon: <Icons.HomeVisit size={18} />, end: true },
  { path: '/crm/analyses',      label: 'Body Analysis',      icon: <Icons.BodyAnalysis size={18} /> },
  { path: '/crm/homevisit',     label: 'Home Visits',        icon: <Icons.HomeVisit size={18} /> },
  { path: '/crm/meetings', label: 'Zoom Invitations', icon: <Icons.Campaigns size={18} /> },
  { path: '/crm/today',         label: 'Activity',           icon: <Icons.Today size={18} /> },
  { path: '/crm/leads',         label: 'People',             icon: <Icons.Leads size={18} /> },
  { path: '/crm/pipeline',      label: 'Interest Board',     icon: <Icons.Pipeline size={18} /> },
  { path: '/crm/customers',     label: 'Customers',          icon: <Icons.Customers size={18} /> },
  { path: '/crm/followups',     label: 'Follow-ups',         icon: <Icons.FollowUps size={18} /> },
  { path: '/crm/orders',        label: 'Orders & Payments',  icon: <Icons.Orders size={18} /> },
  { path: '/crm/revenue',       label: 'Money',              icon: <Icons.Revenue size={18} /> },
  { path: '/crm/campaigns',     label: 'Group Messages',     icon: <Icons.Campaigns size={18} /> },
  { path: '/crm/reports',       label: 'Reports',            icon: <Icons.Reports size={18} /> },
];


interface SidebarProps { coach: { name: string; email: string }; collapsed: boolean; onToggleCollapse: () => void; onLogout: () => void; }
const groups = [ { title: 'Everyday', paths: ['','analyses','homevisit','meetings','today'] }, { title: 'People', paths: ['leads','followups','customers','pipeline'] }, { title: 'Business', paths: ['orders','revenue','campaigns','reports'] } ];
export function Sidebar({ coach, collapsed, onToggleCollapse, onLogout }: SidebarProps) {
 return <aside className={`crm-sidebar${collapsed ? ' is-collapsed' : ''}`}>
   <div className="crm-sidebar-brand"><Brand compact={collapsed} /></div>
   <button className="sidebar-toggle" onClick={onToggleCollapse} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>{collapsed ? '→' : '←'}{!collapsed && <span>Collapse menu</span>}</button>
   <nav aria-label="Workspace navigation">{groups.map(group => <section key={group.title}>
     {!collapsed && <h2>{group.title}</h2>}
     {group.paths.map(path => { const item = navItems.find(n => n.path === '/crm' + (path ? '/' + path : ''))!;
       return <NavLink key={item.path} to={item.path} end={item.end} title={item.label} aria-label={item.label} className={({isActive}) => isActive ? 'crm-nav-link active' : 'crm-nav-link'}>{item.icon}{!collapsed && <span>{item.label}</span>}</NavLink>;
     })}
   </section>)}</nav>
   <footer><div className="crm-account"><span className="crm-avatar">{coach.name?.charAt(0).toUpperCase() || 'C'}</span>{!collapsed && <div><strong>{coach.name}</strong><small>Wellness workspace</small></div>}</div>
   <button className="crm-signout" onClick={onLogout} aria-label="Sign out"><Icons.Logout size={16}/>{!collapsed && 'Sign out'}</button></footer>
 </aside>;
}
