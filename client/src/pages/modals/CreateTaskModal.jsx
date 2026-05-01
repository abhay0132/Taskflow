import { useState } from 'react';
import Modal from '../../components/Modal';
import api from '../../lib/api';

export default function CreateTaskModal({ projectId, members, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
    assigneeId: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        priority: form.priority,
        dueDate: form.dueDate || null,
        assigneeId: form.assigneeId || null,
      };
      const { data } = await api.post(`/projects/${projectId}/tasks`, payload);
      onCreated(data.task);
    } catch (err) {
      setError(err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Create New Task" onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

        <div>
          <label className="label">Task title *</label>
          <input type="text" className="input" placeholder="What needs to be done?" value={form.title} onChange={set('title')} required autoFocus />
        </div>

        <div>
          <label className="label">Description <span className="text-gray-400 font-normal">(optional)</span></label>
          <textarea className="input resize-none" rows={3} placeholder="Add more details..." value={form.description} onChange={set('description')} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Priority</label>
            <select className="input" value={form.priority} onChange={set('priority')}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          <div>
            <label className="label">Due date <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="date" className="input" value={form.dueDate} onChange={set('dueDate')} min={new Date().toISOString().split('T')[0]} />
          </div>
        </div>

        <div>
          <label className="label">Assign to <span className="text-gray-400 font-normal">(optional)</span></label>
          <select className="input" value={form.assigneeId} onChange={set('assigneeId')}>
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>{m.user.name}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
