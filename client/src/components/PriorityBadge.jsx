const config = {
  LOW: { label: 'Low', cls: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' },
  MEDIUM: { label: 'Medium', cls: 'bg-yellow-50 text-yellow-700', dot: 'bg-yellow-400' },
  HIGH: { label: 'High', cls: 'bg-orange-50 text-orange-700', dot: 'bg-orange-400' },
  URGENT: { label: 'Urgent', cls: 'bg-red-50 text-red-700', dot: 'bg-red-500' },
};

export default function PriorityBadge({ priority }) {
  const { label, cls, dot } = config[priority] || config.MEDIUM;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
