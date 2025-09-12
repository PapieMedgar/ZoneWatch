export type ZoneType = "home" | "school" | "custom";

export interface Zone {
  id: string;
  name: string;
  address: string;
  radius: number;
  type: ZoneType;
  activeKids: number;
  totalKids: number;
  createdAt: Date;
  isActive: boolean;
}

export interface CreateZoneData {
  name: string;
  address: string;
  radius: number;
  type: ZoneType;
  totalKids?: number;
  isActive?: boolean;
}

export interface UpdateZoneData {
  name?: string;
  address?: string;
  radius?: number;
  type?: ZoneType;
  activeKids?: number;
  totalKids?: number;
  isActive?: boolean;
}
