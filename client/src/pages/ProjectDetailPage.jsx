import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format, isPast } from 'date-fns';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import CreateTaskModal from './modals/CreateTaskModal';
import EditTaskModal from './modals/EditTaskModal';
import InviteMemberModal from './modals/InviteMemberModal';

const COLUMNS = [
  { key: 'TODO', label: 'To Do', headerCls: 'bg-gray-100 text-gray-600', dotCls: 'bg-gray-400' },
  { key: 'IN_PROGRESS', label: 'In Progress', headerCls: 'bg-blue-100 text-blue-700', dotCls: 'bg-blue-500' },
  { key: 'IN_REVIEW', label: 'In Review', headerCls: 'bg-violet-100 text-violet-700', dotCls: 'bg-violet-500' },
  { key: 'DONE', label: 'Done', headerCls: 'bg-green-100 text-green-700', dotCls: 'bg-green-500' },
];

function TaskCard({ task, onEdit, onDelete, onStatusChange, isAdmin }) {
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'DONE';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-gray-900 leading-snug flex-1">{task.title}</p>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(task)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
          {isAdmin && (
            <button onClick={() => onDelete(task.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          )}
        </div>
      </div>

      {task.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex flex-wrap gap-1.5 mb-3">
        <PriorityBadge priority={task.priority} />
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          {task.assignee ? (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-700 font-semibold" style={{ fontSize: '9px' }}>
                  {task.assignee.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-gray-500 truncate max-w-[80px]">{task.assignee.name.split(' ')[0]}</span>
            </div>
          ) : (
            <span className="text-xs text-gray-300">Unassigned</span>
          )}
        </div>
        {task.dueDate && (
          <span className={`text-xs font-medium ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
            {isOverdue ? '⚠ ' : ''}{format(new Date(task.dueDate), 'MMM d')}
          </span>
        )}
      </div>

      {/* Quick status change */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task.id, e.target.value)}
          className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer"
        >
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="DONE">Done</option>
        </select>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchTasks, setSearchTasks] = useState('');

  const load = () => {
    api.get(`/projects/${id}`)
      .then((r) => setProject(r.data.project))
      .catch(() => navigate('/projects'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const myRole = project?.members.find((m) => m.userId === user?.id)?.role;
  const isAdmin = myRole === 'ADMIN';

  const handleStatusChange = async (taskId, status) => {
    try {
      const { data } = await api.patch(`/tasks/${taskId}/status`, { status });
      setProject((p) => ({
        ...p,
        tasks: p.tasks.map((t) => (t.id === taskId ? data.task : t)),
      }));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setProject((p) => ({ ...p, tasks: p.tasks.filter((t) => t.id !== taskId) }));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete task');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member from the project?')) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      setProject((p) => ({ ...p, members: p.members.filter((m) => m.userId !== userId) }));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm(`Delete project "${project.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/projects/${id}`);
      navigate('/projects');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete project');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tasks = project.tasks || [];
  const filteredTasks = tasks.filter((t) => {
    const matchSearch = !searchTasks || t.title.toLowerCase().includes(searchTasks.toLowerCase());
    const matchPriority = !priorityFilter || t.priority === priorityFilter;
    return matchSearch && matchPriority;
  });

  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.key] = filteredTasks.filter((t) => t.status === col.key);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <Link to="/projects" className="hover:text-indigo-600">Projects</Link>
              <span>/</span>
              <span className="text-gray-700 font-medium">{project.name}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
            {project.description && <p className="text-sm text-gray-500 mt-0.5">{project.description}</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isAdmin && (
              <>
                <button onClick={() => setShowInvite(true)} className="btn-secondary text-sm flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                  Invite
                </button>
                <button onClick={handleDeleteProject} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </>
            )}
            <button onClick={() => setShowCreateTask(true)} className="btn-primary text-sm flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Task
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          {['tasks', 'members'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors capitalize ${
                activeTab === tab ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab} {tab === 'members' && `(${project.members.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'tasks' ? (
          <div className="flex flex-col h-full">
            {/* Filters */}
            <div className="px-8 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
              <input
                type="search"
                className="input max-w-xs text-sm"
                placeholder="Search tasks..."
                value={searchTasks}
                onChange={(e) => setSearchTasks(e.target.value)}
              />
              <select
                className="input w-auto text-sm"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="">All priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              <span className="text-xs text-gray-400">{filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Kanban board */}
            <div className="flex-1 overflow-x-auto p-6">
              <div className="flex gap-4 h-full min-w-max">
                {COLUMNS.map((col) => (
                  <div key={col.key} className="w-72 flex flex-col">
                    <div className={`flex items-center justify-between px-3 py-2 rounded-xl mb-3 ${col.headerCls}`}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${col.dotCls}`} />
                        <span className="text-xs font-semibold">{col.label}</span>
                      </div>
                      <span className="text-xs font-bold opacity-60">{tasksByStatus[col.key]?.length || 0}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                      {tasksByStatus[col.key]?.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onEdit={setEditingTask}
                          onDelete={handleDeleteTask}
                          onStatusChange={handleStatusChange}
                          isAdmin={isAdmin}
                        />
                      ))}
                      {tasksByStatus[col.key]?.length === 0 && (
                        <div className="text-center py-8 text-xs text-gray-300 border-2 border-dashed border-gray-200 rounded-xl">
                          No tasks
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Members tab */
          <div className="p-8 max-w-2xl">
            <div className="space-y-2">
              {project.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 card">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-700 font-semibold text-sm">
                        {member.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {member.user.name}
                        {member.userId === user?.id && <span className="text-xs text-gray-400 ml-1">(you)</span>}
                        {member.userId === project.ownerId && <span className="text-xs text-indigo-500 ml-1">· owner</span>}
                      </p>
                      <p className="text-xs text-gray-400">{member.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${member.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                      {member.role === 'ADMIN' ? 'Admin' : 'Member'}
                    </span>
                    {isAdmin && member.userId !== user?.id && member.userId !== project.ownerId && (
                      <button
                        onClick={() => handleRemoveMember(member.userId)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateTask && (
        <CreateTaskModal
          projectId={id}
          members={project.members}
          onClose={() => setShowCreateTask(false)}
          onCreated={(task) => {
            setProject((p) => ({ ...p, tasks: [task, ...p.tasks] }));
            setShowCreateTask(false);
          }}
        />
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          members={project.members}
          onClose={() => setEditingTask(null)}
          onUpdated={(updated) => {
            setProject((p) => ({ ...p, tasks: p.tasks.map((t) => (t.id === updated.id ? updated : t)) }));
            setEditingTask(null);
          }}
        />
      )}

      {showInvite && (
        <InviteMemberModal
          projectId={id}
          onClose={() => setShowInvite(false)}
          onInvited={(member) => {
            setProject((p) => ({ ...p, members: [...p.members, member] }));
            setShowInvite(false);
          }}
        />
      )}
    </div>
  );
}
