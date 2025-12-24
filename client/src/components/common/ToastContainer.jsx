import Toast from './Toast';

/**
 * ToastContainer - Container component for displaying multiple toasts
 * 
 * @param {Object} props
 * @param {Array} props.toasts - Array of toast objects { id, message, type, duration }
 * @param {Function} props.onClose - Callback when a toast is closed
 */
const ToastContainer = ({ toasts = [], onClose }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          message={toast.message}
          duration={toast.duration}
          onClose={() => onClose(toast.id)}
          show={true}
        />
      ))}
    </div>
  );
};

export default ToastContainer;

