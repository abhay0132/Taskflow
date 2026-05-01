import { useState } from 'react';
import Modal from '../../components/Modal';
import api from '../../lib/api';

export default function CreateProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/projects', form);
      onCreated(data.project);
    } catch (err) {
      setError(err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Create New Project" onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
        <div>
          <label className="label">Project name *</label>
          <input type="text" className="input" placeholder="e.g. Website Redesign" value={form.name} onChange={set('name')} required autoFocus />
        </div>
        <div>
          <label className="label">Description <span className="text-gray-400 font-normal">(optional)</span></label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="What is this project about?"
            value={form.description}
            onChange={set('description')}
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
