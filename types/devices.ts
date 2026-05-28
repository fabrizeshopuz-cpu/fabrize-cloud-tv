export interface Device {
  id: string;
  name: string;
  deviceId: string;
  branch: string;
  location: string;
  type: "Samsung Tizen" | "LG WebOS" | "Android TV" | "CASTMAP Box";
  status: "online" | "offline" | "error" | "inactive" | "update";
  signal: number;
  storage: number;
  ram: number;
  cpu: number;
  playlist: string;
  lastSeen: string;
  apkVersion: string;
  ipAddress: string;
  macAddress: string;
  uptime: string;
}

export type DeviceFilter = "all" | Device["status"] | "update" | "new";
