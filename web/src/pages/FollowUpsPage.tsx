import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { api } from '../api/client';

export function FollowUpsPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'tasks' | 'appointments'>('tasks');
  const [filterStatus, setFilterStatus] = useState('PENDING');

  // New Task Dialog
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPhone, setTaskPhone] = useState('');
  const [taskDueDate, setTaskDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [taskPriority, setTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');

  // New Appointment Dialog
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [appTitle, setAppTitle] = useState('');
  const [appPhone, setAppPhone] = useState('');
  const [appDate, setAppDate] = useState(new Date().toISOString().slice(0, 16));
  const [appDuration, setAppDuration] = useState('');
  const [appZoom, setAppZoom] = useState('');

  const loadData = () => {
    setLoading(true);
    Promise.all([api.getTasks(), api.getAppointments()])
      .then(([tasksData, appsData]) => {
        setTasks(tasksData);
        setAppointments(appsData);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleTask = async (id: number, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === 'PENDING' ? 'COMPLETED' : 'PENDING';
      await api.updateTaskStatus(id, nextStatus);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update task');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;
    try {
      await api.createTask({
        title: taskTitle,
        phone_number: taskPhone || undefined,
        due_date: new Date(taskDueDate).toISOString(),
        priority: taskPriority,
      });
      setIsTaskModalOpen(false);
      setTaskTitle('');
      setTaskPhone('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create task');
    }
  };

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appTitle) return;
    try {
      await api.createAppointment({
        title: appTitle,
        phone_number: appPhone || undefined,
        scheduled_at: new Date(appDate).toISOString(),
        duration_mins: Number(appDuration),
        zoom_link: appZoom,
      });
      setIsAppModalOpen(false);
      setAppPhone('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create appointment');
    }
  };

  const filteredTasks = tasks.filter((t) => filterStatus === 'ALL' || t.status === filterStatus);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-6)" }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader title="Follow-ups & Scheduling" subtitle="Manage tasks, phone follow-ups, and live consultation calendar" />
        <div className="flex items-center gap-2">
          <button onClick={() => setIsTaskModalOpen(true)} className="btn btn-secondary">
            + New Task
          </button>
          <button onClick={() => setIsAppModalOpen(true)} className="btn btn-primary">
            + Schedule Appointment
          </button>
        </div>
      </div>

      <div className="tabs-nav">
        <button
          onClick={() => setActiveView('tasks')}
          className={`tab-btn ${activeView === 'tasks' ? 'active' : ''}`}
        >
          Tasks & Reminders ({tasks.filter((t) => t.status === 'PENDING').length} Pending)
        </button>
        <button
          onClick={() => setActiveView('appointments')}
          className={`tab-btn ${activeView === 'appointments' ? 'active' : ''}`}
        >
          Scheduled Appointments ({appointments.length})
        </button>
      </div>

      {activeView === 'tasks' && (
        <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-4)" }}>
          <div className="flex items-center gap-2 pb-2">
            <span className="text-xs font-semibold text-slate-600">Filter:</span>
            {['PENDING', 'COMPLETED', 'ALL'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`btn btn-sm ${filterStatus === st ? 'btn-primary' : 'btn-secondary'}`}
              >
                {st}
              </button>
            ))}
          </div>

          {filteredTasks.length === 0 ? (
            <div className="card text-center p-8 text-slate-500">No tasks in this filter.</div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map((t) => (
                <div
                  key={t.id}
                  className={`card p-4 flex items-center justify-between gap-4 ${
                    t.status === 'COMPLETED' ? 'opacity-60 bg-slate-50' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={t.status === 'COMPLETED'}
                      onChange={() => handleToggleTask(t.id, t.status)}
                      className="w-5 h-5 text-green-600 rounded cursor-pointer"
                    />
                    <div>
                      <p className={`text-sm font-semibold ${t.status === 'COMPLETED' ? 'line-through text-slate-500' : 'text-primary'}`}>
                        {t.title}
                      </p>
                      <p className="text-caption">
                        Due: {new Date(t.due_date).toLocaleDateString()} {t.phone_number ? `• ${t.phone_number}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${t.priority === 'HIGH' || t.priority === 'URGENT' ? 'badge-danger' : 'badge-neutral'}`}>
                      {t.priority}
                    </span>
                    {t.phone_number && (
                      <a
                        href={`https://wa.me/${t.phone_number}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeView === 'appointments' && (
        <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-4)" }}>
          {appointments.length === 0 ? (
            <div className="card text-center p-8 text-slate-500">No scheduled appointments yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointments.map((a) => (
                <div key={a.id} className="card p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-primary">{a.title}</h3>
                      <p className="text-caption">
                        {new Date(a.scheduled_at).toLocaleString()} ({a.duration_mins} mins)
                      </p>
                    </div>
                    <span className="badge badge-warning">{a.status}</span>
                  </div>
                  {a.phone_number && <p className="text-xs text-slate-600">{a.phone_number}</p>}
                  {a.notes && <p className="text-caption bg-slate-50 p-2 rounded">{a.notes}</p>}
                  <div className="pt-2 border-t flex items-center justify-between">
                    {a.zoom_link && (
                      <a href={a.zoom_link} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
                        Start Video Call 
                      </a>
                    )}
                    {a.phone_number && (
                      <a href={`https://wa.me/${a.phone_number}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                        Message
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Task Modal */}
      {isTaskModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <h3 className="text-lg font-bold">Add Task</h3>
              <button onClick={() => setIsTaskModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-3">
              <div className="form-group">
                <label className="form-label">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Call for meal routine check"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Lead / Customer Phone (optional)</label>
                <input
                  type="tel"
                  placeholder="e.g. 919876543210"
                  value={taskPhone}
                  onChange={(e) => setTaskPhone(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="form-select"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Appointment Modal */}
      {isAppModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <h3 className="text-lg font-bold">Schedule Appointment</h3>
              <button onClick={() => setIsAppModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleCreateApp} className="space-y-3">
              <div className="form-group">
                <label className="form-label">Session Title *</label>
                <input
                  type="text"
                  required
                  value={appTitle}
                  onChange={(e) => setAppTitle(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 919876543210"
                  value={appPhone}
                  onChange={(e) => setAppPhone(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label">Scheduled Date & Time</label>
                  <input
                    type="datetime-local"
                    value={appDate}
                    onChange={(e) => setAppDate(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Duration (minutes)</label>
                  <input
                    type="number"
                    value={appDuration}
                    onChange={(e) => setAppDuration(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Zoom Link</label>
                <input
                  type="url"
                  value={appZoom}
                  onChange={(e) => setAppZoom(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsAppModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
