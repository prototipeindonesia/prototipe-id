export default function StatCard({ title, value, icon: Icon, color = 'primary' }) {
  const colorMap = {
    primary: 'bg-blue-100 text-blue-600',
    secondary: 'bg-green-100 text-green-600',
    accent: 'bg-yellow-100 text-yellow-600',
  };
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
        {Icon && <Icon size={22} />}
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}
