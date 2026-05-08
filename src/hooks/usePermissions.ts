import { useEffect, useRef } from "react";
import { toast } from "sonner";

type Role = "student" | "buyer" | "vendor" | "rider" | "farmer" | "admin" | string | undefined;

const requested = new Set<string>();

export const requestPermissions = async (role: Role) => {
  const key = `bukks-perms-${role}`;
  if (requested.has(key)) return;
  requested.add(key);

  // Notifications for everyone
  if ("Notification" in window && Notification.permission === "default") {
    try {
      const result = await Notification.requestPermission();
      if (result === "granted") toast.success("Notifications enabled");
    } catch {}
  }

  // Geolocation for rider + buyer/student
  if ((role === "rider" || role === "student" || role === "buyer") && "geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      () => {},
      () => toast.message("Enable location for live delivery tracking"),
      { timeout: 6000 }
    );
  }
};

export const usePermissions = (role: Role) => {
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current || !role) return;
    ran.current = true;
    requestPermissions(role);
  }, [role]);
};

export const requestMicrophone = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return true;
  } catch {
    toast.error("Microphone permission denied");
    return false;
  }
};

export const requestCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach((t) => t.stop());
    return true;
  } catch {
    toast.error("Camera permission denied");
    return false;
  }
};

export const browserNotify = (title: string, body?: string) => {
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, { body, icon: "/favicon.ico" });
    } catch {}
  }
};
