import { useState } from 'react';
import Modal from '../../components/Modal';
import api from '../../lib/api';

export default function InviteMemberModal({ projectId, onClose, onInvited }) {
  const [form, setForm] = useState({ email: '', role: 'MEMBER' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post(`/projects/${projectId}/members`, form);
      onInvited(data.member);
    } catch (err) {
      setError(err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Invite Team Member" onClose={onClose} size="sm">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

        <p className="text-sm text-gray-500">
          The user must already have a TaskFlow account. Enter their email address to add them.
        </p>

        <div>
          <label className="label">Email address *</label>
          <input
            type="email"
            className="input"
            placeholder="teammate@company.com"
            value={form.email}
            onChange={set('email')}
            required
            autoFocus
          />
        </div>

        <div>
          <label className="label">Role</label>
          <select className="input" value={form.role} onChange={set('role')}>
            <option value="MEMBER">Member — can create & update tasks</option>
            <option value="ADMIN">Admin — full access including delete</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Adding...' : 'Add Member'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
