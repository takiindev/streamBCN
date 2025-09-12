function ConnectionToast({ content = '', status = 'notification', showToast = false }) {
  if (!showToast || !content) return null;

  const normalized = String(status).toLowerCase();
  const isNotification = normalized === 'notification' || normalized === 'thông báo' || normalized === 'info';
  const isWarn = normalized === 'warn' || normalized === 'warning' || normalized === 'warm' || normalized === 'cảnh báo';

  const bgClass = isNotification
    ? 'bg-gradient-to-r from-emerald-500 to-green-600'
    : isWarn
    ? 'bg-gradient-to-r from-red-500 to-rose-600'
    : 'bg-gradient-to-r from-yellow-500 to-orange-600';

  const dot = isNotification ? (
    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
  ) : isWarn ? (
    <div className="w-2 h-2 bg-white rounded-full opacity-90" />
  ) : (
    <div className="w-2 h-2 bg-white rounded-full animate-spin" />
  );

  return (
    <div className="fixed top-4 right-4 z-50 transition-all duration-500 transform translate-x-0 opacity-100 scale-100">
      <div className={`p-4 rounded-lg shadow-xl ${bgClass}`}>
        <div className="flex items-center gap-3 text-white text-sm font-medium">
          {dot}
          <span>{content}</span>
        </div>
      </div>
    </div>
  );
}

export default ConnectionToast;
