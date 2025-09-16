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
}

export default NotificationService;