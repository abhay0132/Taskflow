import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import CreateProjectModal from './modals/CreateProjectModal';

function ProjectCard({ project, currentUserId }) {
  const isOwner = project.ownerId === currentUserId;
  const myRole = project.members.find((m) => m.userId === currentUserId)?.role;

  return (
    <Link to={`/projects/${project.id}`} className="card p-5 hover:shadow-md hover:border-indigo-200 transition-all group block">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${myRole === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
          {myRole === 'ADMIN' ? 'Admin' : 'Member'}
        </span>
      </div>

      <h3 className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors mb-1 truncate">{project.name}</h3>
      {project.description && (
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{project.description}</p>
      )}

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" /></svg>
            {project._count.tasks} tasks
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" /></svg>
            {project._count.members}
          </span>
        </div>
        <span className="text-xs text-gray-400">{format(new Date(project.updatedAt), 'MMM d')}</span>
      </div>
    </Link>
  );
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');

  const load = () => {
    api.get('/projects').then((r) => setProjects(r.data.projects)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = projects.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 mt-0.5 text-sm">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </button>
      </div>

      <div className="mb-5">
        <input
          type="search"
          className="input max-w-xs"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">{search ? 'No projects found' : 'No projects yet'}</h3>
          <p className="text-sm text-gray-500 mb-5">{search ? 'Try a different search term.' : 'Create your first project to get started.'}</p>
          {!search && (
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              Create your first project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} currentUserId={user?.id} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={(p) => {
            setProjects((prev) => [p, ...prev]);
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}
