import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { Kid, CreateKidData, UpdateKidData } from "@/types/kids";
import { Zone, CreateZoneData, UpdateZoneData, ZoneType } from "@/types/zone";
import { Activity, CreateActivityData } from "@/types/activity";

type FirestoreTimestampLike = { toDate: () => Date };

function toDateSafe(value: unknown): Date {
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in (value as { toDate?: unknown }) &&
    typeof (value as FirestoreTimestampLike).toDate === "function"
  ) {
    return (value as FirestoreTimestampLike).toDate();
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

function readString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function readNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" ? value : fallback;
}

function readBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

// ZONE CRUD OPERATIONS

// CREATE ZONE
export const addZone = async (zoneData: CreateZoneData) => {
  const now = new Date();
  const zoneWithDefaults = {
    name: zoneData.name,
    address: zoneData.address,
    latitude: typeof zoneData.latitude === "number" ? zoneData.latitude : null,
    longitude: typeof zoneData.longitude === "number" ? zoneData.longitude : null,
    radius: zoneData.radius,
    type: zoneData.type,
    activeKids: 0,
    totalKids: typeof zoneData.totalKids === "number" ? zoneData.totalKids : 0,
    isActive: zoneData.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  };
  const docRef = await addDoc(collection(db, "zones"), zoneWithDefaults);
  try {
    await addActivity({
      type: "zone",
      action: "created",
      message: `Created zone ${zoneData.name}`,
      zoneId: docRef.id,
      severity: "info",
    });
  } catch (e) {
    console.warn("Failed to log activity for zone creation", e);
  }
  return docRef.id;
};

// READ ZONES
export const getZones = async (): Promise<Zone[]> => {
  const snapshot = await getDocs(collection(db, "zones"));
  const zones: Zone[] = [];
  snapshot.docs.forEach((d) => {
    const data = d.data() as Record<string, unknown>;
    if (data.name && data.address && typeof data.radius !== "undefined" && data.type) {
      zones.push({
        id: d.id,
        name: readString(data.name),
        address: readString(data.address),
        latitude: typeof data.latitude === "number" ? (data.latitude as number) : undefined,
        longitude: typeof data.longitude === "number" ? (data.longitude as number) : undefined,
        radius: readNumber(data.radius),
        type: (data.type as ZoneType) ?? "custom",
        activeKids: readNumber(data.activeKids),
        totalKids: readNumber(data.totalKids),
        isActive: readBoolean(data.isActive, true),
        createdAt: toDateSafe((data as Record<string, unknown>).createdAt),
        // If createdAt missing, still provide a Date to avoid runtime issues
      } as Zone);
    }
  });
  return zones;
};

// UPDATE ZONE
export const updateZone = async (id: string, data: UpdateZoneData) => {
  const docRef = doc(db, "zones", id);
  await updateDoc(docRef, { ...data, updatedAt: new Date() });
  try {
    await addActivity({
      type: "zone",
      action: "updated",
      message: `Updated zone ${data.name ?? id}`,
      zoneId: id,
      severity: "info",
    });
  } catch (e) {
    console.warn("Failed to log activity for zone update", e);
  }
};

// DELETE ZONE
export const deleteZone = async (id: string) => {
  const docRef = doc(db, "zones", id);
  await deleteDoc(docRef);
  try {
    await addActivity({
      type: "zone",
      action: "deleted",
      message: `Deleted zone ${id}`,
      zoneId: id,
      severity: "danger",
    });
  } catch (e) {
    console.warn("Failed to log activity for zone deletion", e);
  }
};

// KID CRUD OPERATIONS

// CREATE KID
export const addKid = async (kidData: CreateKidData) => {
  const now = new Date();
  const kidWithDefaults = {
    name: kidData.name,
    age: kidData.age,
    location: kidData.location,
    latitude: typeof kidData.latitude === "number" ? kidData.latitude : null,
    longitude: typeof kidData.longitude === "number" ? kidData.longitude : null,
    avatar: kidData.avatar || "",
    parentId: kidData.parentId || "",
    status: "safe" as const,
    lastSeen: "Just now",
    zonesCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  
  const docRef = await addDoc(collection(db, "myG"), kidWithDefaults);
  try {
    await addActivity({
      type: "kid",
      action: "created",
      message: `Added kid ${kidData.name}`,
      kidId: docRef.id,
      severity: "safe",
    });
  } catch (e) {
    console.warn("Failed to log activity for kid creation", e);
  }
  return docRef.id;
};

// READ KIDS
export const getKids = async (): Promise<Kid[]> => {
  const snapshot = await getDocs(collection(db, "myG"));
  const kids: Kid[] = [];
  
  snapshot.docs.forEach((doc) => {
    const data = doc.data() as Record<string, unknown>;
    // Check if this document has kid profile fields
    if (data.name && data.age && data.location) {
      kids.push({
        id: doc.id,
        name: readString(data.name),
        age: readNumber(data.age),
        status: (data.status as "safe" | "warning" | "alert") || "safe",
        location: readString(data.location),
        latitude: typeof data.latitude === "number" ? (data.latitude as number) : undefined,
        longitude: typeof data.longitude === "number" ? (data.longitude as number) : undefined,
        lastSeen: readString(data.lastSeen, "Just now"),
        avatar: readString(data.avatar),
        zonesCount: readNumber(data.zonesCount),
        parentId: readString(data.parentId),
        createdAt: toDateSafe((data as Record<string, unknown>).createdAt),
        updatedAt: toDateSafe((data as Record<string, unknown>).updatedAt),
      });
    }
  });
  
  console.log("Loaded kids:", kids);
  return kids;
};

// UPDATE KID
export const updateKid = async (id: string, data: UpdateKidData) => {
  const docRef = doc(db, "myG", id);
  
  const updateData = {
    ...data,
    updatedAt: new Date(),
  };
  
  await updateDoc(docRef, updateData);
  try {
    await addActivity({
      type: "kid",
      action: "updated",
      message: `Updated kid ${data.name ?? id}`,
      kidId: id,
      severity: data.status === "alert" ? "warning" : "info",
    });
  } catch (e) {
    console.warn("Failed to log activity for kid update", e);
  }
};

// DELETE KID
export const deleteKid = async (id: string) => {
  const docRef = doc(db, "myG", id);
  await deleteDoc(docRef);
  try {
    await addActivity({
      type: "kid",
      action: "deleted",
      message: `Deleted kid ${id}`,
      kidId: id,
      severity: "danger",
    });
  } catch (e) {
    console.warn("Failed to log activity for kid deletion", e);
  }
};

// ACTIVITY LOG
export const addActivity = async (data: CreateActivityData) => {
  const now = new Date();
  const docRef = await addDoc(collection(db, "activity"), {
    ...data,
    severity: data.severity || "info",
    createdAt: now,
  });
  return docRef.id;
};

export const getRecentActivity = async (limitCount = 10): Promise<Activity[]> => {
  const snapshot = await getDocs(collection(db, "activity"));
  // Firestore SDK v9 lite: no orderBy imported here; simple latest by createdAt client-side
  const items: Activity[] = snapshot.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return {
      id: d.id,
      type: readString(data.type as string) as "kid" | "zone",
      action: readString(data.action),
      message: readString(data.message),
      kidId: typeof data.kidId === "string" ? (data.kidId as string) : undefined,
      zoneId: typeof data.zoneId === "string" ? (data.zoneId as string) : undefined,
      severity: (data.severity as Activity["severity"]) || "info",
      createdAt: toDateSafe((data as Record<string, unknown>).createdAt),
    } as Activity;
  });
  items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return items.slice(0, limitCount);
};

// REAL-TIME SUBSCRIPTIONS
export const subscribeKids = (onChange: (kids: Kid[]) => void) => {
  const unsubscribe = onSnapshot(collection(db, "myG"), (snapshot) => {
    const kids: Kid[] = [];
    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data() as Record<string, unknown>;
      if (data.name && data.age && data.location) {
        kids.push({
          id: docSnap.id,
          name: (data.name as string) || "",
          age: (data.age as number) || 0,
          status: (data.status as "safe" | "warning" | "alert") || "safe",
          location: (data.location as string) || "",
          latitude: typeof data.latitude === "number" ? (data.latitude as number) : undefined,
          longitude: typeof data.longitude === "number" ? (data.longitude as number) : undefined,
          lastSeen: (data.lastSeen as string) || "Just now",
          avatar: (data.avatar as string) || "",
          zonesCount: (data.zonesCount as number) || 0,
          parentId: (data.parentId as string) || "",
          createdAt: toDateSafe((data as Record<string, unknown>).createdAt),
          updatedAt: toDateSafe((data as Record<string, unknown>).updatedAt),
        });
      }
    });
    onChange(kids);
  });
  return unsubscribe;
};

export const subscribeZones = (onChange: (zones: Zone[]) => void) => {
  const unsubscribe = onSnapshot(collection(db, "zones"), (snapshot) => {
    const zones: Zone[] = [];
    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data() as Record<string, unknown>;
      if (data.name && data.address && typeof data.radius !== "undefined" && data.type) {
        zones.push({
          id: docSnap.id,
          name: data.name as string,
          address: data.address as string,
          latitude: typeof data.latitude === "number" ? (data.latitude as number) : undefined,
          longitude: typeof data.longitude === "number" ? (data.longitude as number) : undefined,
          radius: data.radius as number,
          type: readString(data.type as string) as "kid" | "zone",
          activeKids: (data.activeKids as number) ?? 0,
          totalKids: (data.totalKids as number) ?? 0,
          isActive: (data.isActive as boolean) ?? true,
          createdAt: toDateSafe((data as Record<string, unknown>).createdAt),
        } as Zone);
      }
    });
    onChange(zones);
  });
  return unsubscribe;
};

export const subscribeActivity = (onChange: (items: Activity[]) => void) => {
  const unsubscribe = onSnapshot(collection(db, "activity"), (snapshot) => {
    const items: Activity[] = snapshot.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      return {
        id: d.id,
        type: readString(data.type as string) as "kid" | "zone",
        action: readString(data.action),
        message: readString(data.message),
        kidId: typeof data.kidId === "string" ? (data.kidId as string) : undefined,
        zoneId: typeof data.zoneId === "string" ? (data.zoneId as string) : undefined,
        severity: (data.severity as Activity["severity"]) || "info",
        createdAt: toDateSafe((data as Record<string, unknown>).createdAt),
      } as Activity;
    });
    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    onChange(items);
  });
  return unsubscribe;
};

