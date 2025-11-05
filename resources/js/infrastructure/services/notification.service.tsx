// Service: Notification service using react-toastify
import { toast, ToastOptions } from 'react-toastify';

export class NotificationService {
  // Success notifications
  static success(message: string, options?: ToastOptions) {
    return toast.success(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
      ...options,
    });
  }

  // Error notifications
  static error(message: string, options?: ToastOptions) {
    return toast.error(message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
      ...options,
    });
  }

  // Warning notifications
  static warning(message: string, options?: ToastOptions) {
    return toast.warning(message, {
      position: "top-right",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
      ...options,
    });
  }

  // Info notifications
  static info(message: string, options?: ToastOptions) {
    return toast.info(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
      ...options,
    });
  }

  // Loading notifications
  static loading(message: string, options?: ToastOptions) {
    return toast.loading(message, {
      position: "top-right",
      autoClose: false,
      hideProgressBar: false,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: false,
      progress: undefined,
      theme: "colored",
      ...options,
    });
  }

  // Update loading notification
  static update(toastId: string | number, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') {
    return toast.update(toastId, {
      render: message,
      type: type,
      isLoading: false,
      autoClose: type === 'error' ? 5000 : 3000,
    });
  }

  // Dismiss notification
  static dismiss(toastId?: string | number) {
    return toast.dismiss(toastId);
  }

  // Confirmation dialog using toast
  static confirm(
    message: string,
    options?: {
      title?: string;
      confirmText?: string;
      cancelText?: string;
    }
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const title = options?.title || 'Confirmación';
      const confirmText = options?.confirmText || 'Confirmar';
      const cancelText = options?.cancelText || 'Cancelar';

      const toastContent = (
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-base mb-1">{title}</h3>
            <p className="text-sm">{message}</p>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                toast.dismiss(toastId);
                resolve(false);
              }}
              className="px-3 py-1.5 text-sm rounded bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                toast.dismiss(toastId);
                resolve(true);
              }}
              className="px-3 py-1.5 text-sm rounded bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              {confirmText}
            </button>
          </div>
        </div>
      );

      const toastId = toast.warning(toastContent, {
        position: "top-center",
        autoClose: false,
        closeButton: false,
        closeOnClick: false,
        draggable: false,
        hideProgressBar: true,
        theme: "light",
      });
    });
  }

  // Promise-based notification with loading/success/error states
  static promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    },
    options?: ToastOptions
  ) {
    return toast.promise(
      promise,
      {
        pending: messages.loading,
        success: messages.success,
        error: messages.error,
      },
      {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
        ...options,
      }
    );
  }
}

export default NotificationService;
