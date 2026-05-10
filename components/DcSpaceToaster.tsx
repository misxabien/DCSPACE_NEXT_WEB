"use client";

import { Toaster } from "sonner";
import "@/styles/sonner-dcspace.css";

export function DcSpaceToaster() {
  return (
    <Toaster
      position="top-center"
      closeButton
      duration={4200}
      toastOptions={{
        classNames: {
          toast: "dc-toast",
          title: "dc-toast-title",
          description: "dc-toast-description",
          closeButton: "dc-toast-close",
        },
      }}
    />
  );
}
