const config = {
  TODO: { label: 'To Do', cls: 'bg-gray-100 text-gray-600' },
  IN_PROGRESS: { label: 'In Progress', cls: 'bg-blue-100 text-blue-700' },
  IN_REVIEW: { label: 'In Review', cls: 'bg-violet-100 text-violet-700' },
  DONE: { label: 'Done', cls: 'bg-green-100 text-green-700' },
};

export default function StatusBadge({ status }) {
  const { label, cls } = config[status] || config.TODO;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}
