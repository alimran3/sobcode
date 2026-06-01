import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { HiOutlineBell, HiOutlineCheck } from 'react-icons/hi';
import { fetchNotifications, markAsRead, markAllRead } from '../../store/slices/notificationSlice';
import { formatDateTime } from '../../utils/helpers';

const typeIcons = {
  lowStock: '📦',
  outOfStock: '🚫',
  expiryWarning: '⏰',
  expired: '💀',
  newReview: '⭐',
  purchaseConfirmation: '🧾',
  healthAlert: '🩺',
  nearbyDiscount: '🏷️',
  systemUpdate: '🔔',
  conflictAlert: '⚠️',
};

const priorityStyles = {
  low: 'border-l-surface-300',
  medium: 'border-l-brand-400',
  high: 'border-l-amber-500',
  critical: 'border-l-red-500',
};

const ConflictIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export default function NotificationBell() {
  const dispatch = useDispatch();
  const { items, unreadCount, loading } = useSelector((s) => s.notifications);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    dispatch(fetchNotifications({ limit: 15 }));
  }, [dispatch]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkRead = (id) => {
    dispatch(markAsRead(id));
  };

  const handleMarkAllRead = () => {
    dispatch(markAllRead());
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-200 active:scale-95"
        aria-label="Notifications"
      >
        <HiOutlineBell className="w-5 h-5 text-surface-500" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full ring-2 ring-white dark:ring-surface-900 animate-scale-in px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-strong rounded-2xl shadow-glass-lg overflow-hidden animate-slide-down z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-surface-200/50 dark:border-surface-700/30">
            <div>
              <h3 className="font-display font-semibold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-[10px] text-surface-500">{unreadCount} unread</p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs font-medium text-brand-500 hover:text-brand-600 transition-colors"
              >
                <HiOutlineCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-surface-100 dark:divide-surface-800/50">
            {loading && items.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-6 h-6 mx-auto border-2 border-surface-300 border-t-brand-500 rounded-full animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-3xl mb-2">🔔</p>
                <p className="text-sm text-surface-400">No notifications yet</p>
              </div>
            ) : (
              items.map((notif) => {
                const isConflictAlert = notif.type === 'conflictAlert';
                const priorityKey = isConflictAlert && notif.priority === 'critical' ? 'critical' : notif.priority;
                
                return (
                  <div
                    key={notif._id}
                    onClick={() => !notif.read && handleMarkRead(notif._id)}
                    className={`
                      p-3.5 border-l-[3px] cursor-pointer
                      hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors
                      ${priorityStyles[priorityKey] || priorityStyles.medium}
                      ${!notif.read ? 'bg-brand-50/30 dark:bg-brand-900/10' : ''}
                      ${isConflictAlert ? (notif.priority === 'critical' ? 'bg-red-50/50 dark:bg-red-900/20' : 'bg-amber-50/30 dark:bg-amber-900/10') : ''}
                    `}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className={`text-base flex-shrink-0 mt-0.5 ${isConflictAlert ? (notif.priority === 'critical' ? 'text-red-500' : 'text-amber-500') : 'text-surface-500'}`}>
                        {isConflictAlert ? <ConflictIcon /> : (typeIcons[notif.type] || '🔔')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium line-clamp-2 ${!notif.read ? 'text-surface-900 dark:text-white' : 'text-surface-600 dark:text-surface-400'}`}>
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">{notif.message}</p>
                        {isConflictAlert && notif.data?.conflictCount > 0 && (
                          <div className="mt-1.5 text-[10px] text-red-600 dark:text-red-400 font-medium">
                            {notif.data.conflictCount} warning(s): {notif.data.redCount > 0 ? `${notif.data.redCount} critical` : ''}{notif.data.redCount > 0 && notif.data.yellowCount > 0 ? ', ' : ''}{notif.data.yellowCount > 0 ? `${notif.data.yellowCount} caution` : ''}
                          </div>
                        )}
                        <p className="text-[10px] text-surface-400 mt-1">{formatDateTime(notif.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="p-3 border-t border-surface-200/50 dark:border-surface-700/30 text-center">
              <button
                onClick={() => setOpen(false)}
                className="text-xs font-semibold text-brand-500 hover:text-brand-600 transition-colors"
              >
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}