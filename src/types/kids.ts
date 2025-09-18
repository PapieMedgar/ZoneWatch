export interface Kid {
  id: string;
  name: string;
  age: number;
  status: "safe" | "warning" | "alert";
  location: string;
  latitude?: number;
  longitude?: number;
  lastSeen: string;
  avatar?: string;
  zonesCount: number;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateKidData {
  name: string;
  age: number;
  location: string;
  latitude?: number;
  longitude?: number;
  avatar?: string;
  parentId?: string;
}

export interface UpdateKidData {
  name?: string;
  age?: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  avatar?: string;
  status?: "safe" | "warning" | "alert";
  lastSeen?: string;
  zonesCount?: number;
}
