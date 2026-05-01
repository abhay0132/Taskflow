import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, isPast } from 'date-fns';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';

function StatCard({ label, value, color, icon }) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { stats, tasksByStatus, recentTasks, overdueTasks: overdueList, projects } = data;
  const totalForProgress = stats.totalTasks || 1;
  const donePercent = Math.round(((tasksByStatus.DONE || 0) / totalForProgress) * 100);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Good morning, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-gray-500 mt-1">Here's what's happening across your projects.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Projects"
          value={stats.totalProjects}
          color="bg-indigo-100"
          icon={<svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>}
        />
        <StatCard
          label="Total Tasks"
          value={stats.totalTasks}
          color="bg-blue-100"
          icon={<svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" /></svg>}
        />
        <StatCard
          label="My Active Tasks"
          value={stats.myActiveTasks}
          color="bg-violet-100"
          icon={<svg className="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
        />
        <StatCard
          label="Overdue Tasks"
          value={stats.overdueTasks}
          color={stats.overdueTasks > 0 ? 'bg-red-100' : 'bg-green-100'}
          icon={<svg className={`w-5 h-5 ${stats.overdueTasks > 0 ? 'text-red-600' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      {/* Status overview */}
      <div className="card p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Task Progress Overview</h2>
          <span className="text-sm text-gray-500">{donePercent}% complete</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
          <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${donePercent}%` }} />
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { key: 'TODO', label: 'To Do', cls: 'text-gray-600 bg-gray-50 border-gray-200' },
            { key: 'IN_PROGRESS', label: 'In Progress', cls: 'text-blue-700 bg-blue-50 border-blue-200' },
            { key: 'IN_REVIEW', label: 'In Review', cls: 'text-violet-700 bg-violet-50 border-violet-200' },
            { key: 'DONE', label: 'Done', cls: 'text-green-700 bg-green-50 border-green-200' },
          ].map(({ key, label, cls }) => (
            <div key={key} className={`rounded-xl border px-3 py-3 text-center ${cls}`}>
              <p className="text-xl font-bold">{tasksByStatus[key] || 0}</p>
              <p className="text-xs mt-0.5 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Tasks */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">My Active Tasks</h2>
          {recentTasks.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No active tasks assigned to you.</p>
          ) : (
            <div className="space-y-2">
              {recentTasks.map((task) => (
                <Link key={task.id} to={`/projects/${task.project.id}`} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                  <StatusBadge status={task.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-600">{task.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{task.project.name}</p>
                  </div>
                  {task.dueDate && (
                    <span className={`text-xs flex-shrink-0 ${isPast(new Date(task.dueDate)) ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                      {format(new Date(task.dueDate), 'MMM d')}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Overdue */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            Overdue Tasks
            {overdueList.length > 0 && (
              <span className="w-5 h-5 bg-red-100 text-red-600 text-xs font-bold rounded-full flex items-center justify-center">{overdueList.length}</span>
            )}
          </h2>
          {overdueList.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">No overdue tasks!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {overdueList.map((task) => (
                <Link key={task.id} to={`/projects/${task.project.id}`} className="flex items-start gap-3 p-3 rounded-lg hover:bg-red-50 transition-colors group">
                  <PriorityBadge priority={task.priority} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-red-600">{task.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{task.project.name} · {task.assignee?.name || 'Unassigned'}</p>
                  </div>
                  <span className="text-xs text-red-500 font-medium flex-shrink-0">
                    {format(new Date(task.dueDate), 'MMM d')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Projects summary */}
      {projects.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Recent Projects</h2>
            <Link to="/projects" className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">View all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {projects.map((p) => (
              <Link key={p.id} to={`/projects/${p.id}`} className="p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors group">
                <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 truncate">{p.name}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span>{p._count.tasks} tasks</span>
                  <span>·</span>
                  <span>{p._count.members} members</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
