import type { ReactNode } from "react";
import { toast as sonnerToast, type ExternalToast } from "sonner";

type ToastMessage = string | ReactNode;

export const toast = {
  success: (message: ToastMessage, data?: ExternalToast) => sonnerToast.success(message, data),
  warning: (message: ToastMessage, data?: ExternalToast) => sonnerToast.warning(message, data),
  danger: (message: ToastMessage, data?: ExternalToast) => sonnerToast.error(message, data),
  info: (message: ToastMessage, data?: ExternalToast) => sonnerToast.info(message, data),
};
