"use client";

import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      icons={{
        success: <CircleCheck size={18} />,
        warning: <TriangleAlert size={18} />,
        error: <CircleAlert size={18} />,
        info: <Info size={18} />,
      }}
      toastOptions={{
        classNames: {
          toast: "rounded-2xl border font-sans shadow-[0px_12px_16px_rgba(26,28,25,0.08)]",
          title: "text-sm font-semibold",
          description: "text-sm",
          success: "!bg-success-bg !border-success/30 !text-success",
          warning: "!bg-warning-bg !border-warning/30 !text-warning",
          error: "!bg-danger-bg !border-danger/30 !text-danger",
          info: "!bg-info-bg !border-info/30 !text-info",
        },
      }}
    />
  );
}
