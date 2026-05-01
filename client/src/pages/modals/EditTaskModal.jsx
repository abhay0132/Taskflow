import { useState } from 'react';
import Modal from '../../components/Modal';
import api from '../../lib/api';

export default function EditTaskModal({ task, members, onClose, onUpdated }) {
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
    assigneeId: task.assignee?.id || '',
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
        description: form.description || null,
        status: form.status,
        priority: form.priority,
        dueDate: form.dueDate || null,
        assigneeId: form.assigneeId || null,
      };
      const { data } = await api.put(`/tasks/${task.id}`, payload);
      onUpdated(data.task);
    } catch (err) {
      setError(err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Edit Task" onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

        <div>
          <label className="label">Task title *</label>
          <input type="text" className="input" value={form.title} onChange={set('title')} required autoFocus />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="input resize-none" rows={3} value={form.description} onChange={set('description')} placeholder="Add details..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={set('status')}>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="DONE">Done</option>
            </select>
          </div>
          <div>
            <label className="label">Priority</label>
            <select className="input" value={form.priority} onChange={set('priority')}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Due date</label>
            <input type="date" className="input" value={form.dueDate} onChange={set('dueDate')} />
          </div>
          <div>
            <label className="label">Assigned to</label>
            <select className="input" value={form.assigneeId} onChange={set('assigneeId')}>
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>{m.user.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
