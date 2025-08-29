// Service: Notification service using react-hot-toast
import toast, { ToastOptions } from 'react-hot-toast';
import { JSX } from 'react';

export class NotificationService {
  // Success notifications
  static success(message: string, options?: ToastOptions) {
    return toast.success(message, {
      duration: 3000,
      style: {
        background: '#10B981',
        color: '#fff',
        borderRadius: '8px',
        fontSize: '14px',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#10B981',
      },
      ...options,
    });
  }

  // Error notifications
  static error(message: string, options?: ToastOptions) {
    return toast.error(message, {
      duration: 5000,
      style: {
        background: '#EF4444',
        color: '#fff',
        borderRadius: '8px',
        fontSize: '14px',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#EF4444',
      },
      ...options,
    });
  }

  // Warning notifications
  static warning(message: string, options?: ToastOptions) {
    return toast(message, {
      duration: 4000,
      icon: '⚠️',
      style: {
        background: '#F59E0B',
        color: '#fff',
        borderRadius: '8px',
        fontSize: '14px',
      },
      ...options,
    });
  }

  // Info notifications
  static info(message: string, options?: ToastOptions) {
    return toast(message, {
      duration: 4000,
      icon: 'ℹ️',
      style: {
        background: '#3B82F6',
        color: '#fff',
        borderRadius: '8px',
        fontSize: '14px',
      },
      ...options,
    });
  }

  // Loading notifications
  static loading(message: string, options?: ToastOptions) {
    return toast.loading(message, {
      style: {
        background: '#6B7280',
        color: '#fff',
        borderRadius: '8px',
        fontSize: '14px',
      },
      ...options,
    });
  }

  // Promise-based notifications for async operations
  static promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    },
    options?: ToastOptions
  ) {
    return toast.promise(promise, messages, {
      style: {
        borderRadius: '8px',
        fontSize: '14px',
      },
      success: {
        style: {
          background: '#10B981',
          color: '#fff',
        },
      },
      error: {
        style: {
          background: '#EF4444',
          color: '#fff',
        },
      },
      loading: {
        style: {
          background: '#6B7280',
          color: '#fff',
        },
      },
      ...options,
    });
  }

  // Custom confirmation dialog
  static async confirm(
    message: string,
    options: {
      confirmText?: string;
      cancelText?: string;
      title?: string;
    } = {}
  ): Promise<boolean> {
    const {
      confirmText = 'Confirmar',
      cancelText = 'Cancelar',
      title = 'Confirmación'
    } = options;

    return new Promise((resolve) => {
      toast(
        (t) => (
          <div className="flex flex-col gap-3 p-2">
            <div className="font-semibold text-gray-800">{title}</div>
            <div className="text-gray-600">{message}</div>
            <div className="flex gap-2 mt-2">
              <button
                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(true);
                }}
              >
                {confirmText}
              </button>
              <button
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400 transition-colors"
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(false);
                }}
              >
                {cancelText}
              </button>
            </div>
          </div>
        ),
        {
          duration: Infinity,
          style: {
            background: '#fff',
            color: '#374151',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            maxWidth: '400px',
          },
        }
      );
    });
  }

  // Dismiss specific toast
  static dismiss(toastId?: string) {
    toast.dismiss(toastId);
  }

  // Dismiss all toasts
  static dismissAll() {
    toast.dismiss();
  }

  // Custom toast with JSX content
  static custom(content: JSX.Element, options?: ToastOptions) {
    return toast.custom(content, {
      duration: 4000,
      ...options,
    });
  }
}

export default NotificationService;
