/**
 * Lightweight toast utility — no external dependencies.
 * Creates DOM toasts programmatically so it works in client components
 * without wrapping the whole app in a provider.
 */

type ToastType = "success" | "error" | "info";

function createToast(message: string, type: ToastType) {
  if (typeof window === "undefined") return;

  const id = `toast-${Date.now()}`;
  const colors = {
    success: "bg-emerald-500",
    error: "bg-red-500",
    info: "bg-violet-600",
  };
  const icons = { success: "✓", error: "✕", info: "ℹ" };

  const el = document.createElement("div");
  el.id = id;
  el.className = `fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-white font-semibold text-sm transition-all duration-300 transform translate-y-4 opacity-0 ${colors[type]}`;

  // SECURITY: use textContent — server responses can contain user-controlled
  // content (e.g., names, addresses) and would otherwise execute as HTML.
  const iconSpan = document.createElement("span");
  iconSpan.className = "text-lg";
  iconSpan.textContent = icons[type];
  const msgSpan = document.createElement("span");
  msgSpan.textContent = message;
  el.appendChild(iconSpan);
  el.appendChild(msgSpan);

  // Toast container
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "fixed bottom-6 right-6 z-[9999] flex flex-col gap-3";
    document.body.appendChild(container);
  }

  container.appendChild(el);

  // Animate in
  requestAnimationFrame(() => {
    el.style.transform = "translateY(0)";
    el.style.opacity = "1";
  });

  // Auto remove after 3s
  setTimeout(() => {
    el.style.transform = "translateY(8px)";
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

export const toast = {
  success: (msg: string) => createToast(msg, "success"),
  error: (msg: string) => createToast(msg, "error"),
  info: (msg: string) => createToast(msg, "info"),
};
