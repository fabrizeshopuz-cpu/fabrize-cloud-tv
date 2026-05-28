import type { Device } from "@/types/devices";

interface DeviceStatusBadgeProps {
  status: Device["status"];
}

const statusMap = {
  online: { label: "Onlayn", className: "text-emerald-400 bg-emerald-500/10" },
  offline: { label: "Offline", className: "text-red-400 bg-red-500/10" },
  error: { label: "Xatolik", className: "text-amber-400 bg-amber-500/10" },
  inactive: { label: "Nofaol", className: "text-zinc-400 bg-zinc-500/10" },
  update: { label: "Update", className: "text-sky-400 bg-sky-500/10" },
};

export function DeviceStatusBadge({ status }: DeviceStatusBadgeProps) {
  const item = statusMap[status];
  return (
    <span className={`inline-flex min-h-8 items-center gap-2 rounded-full px-3 text-sm font-bold ${item.className}`}>
      <i className="h-2 w-2 rounded-full bg-current" />
      {item.label}
    </span>
  );
}
