import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { Kid, CreateKidData, UpdateKidData } from "@/types/kids";
import { Zone, CreateZoneData, UpdateZoneData } from "@/types/zone";
import { Activity, CreateActivityData } from "@/types/activity";

// ZONE CRUD OPERATIONS

// CREATE ZONE
export const addZone = async (zoneData: CreateZoneData) => {
  const now = new Date();
  const zoneWithDefaults = {
    name: zoneData.name,
    address: zoneData.address,
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
  } catch {}
  return docRef.id;
};

// READ ZONES
export const getZones = async (): Promise<Zone[]> => {
  const snapshot = await getDocs(collection(db, "zones"));
  const zones: Zone[] = [];
  snapshot.docs.forEach((d) => {
    const data = d.data() as any;
    if (data.name && data.address && typeof data.radius !== "undefined" && data.type) {
      zones.push({
        id: d.id,
        name: data.name,
        address: data.address,
        radius: data.radius,
        type: data.type,
        activeKids: data.activeKids ?? 0,
        totalKids: data.totalKids ?? 0,
        isActive: data.isActive ?? true,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt) || new Date(),
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
  } catch {}
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
  } catch {}
};

// KID CRUD OPERATIONS

// CREATE KID
export const addKid = async (kidData: CreateKidData) => {
  const now = new Date();
  const kidWithDefaults = {
    name: kidData.name,
    age: kidData.age,
    location: kidData.location,
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
  } catch {}
  return docRef.id;
};

// READ KIDS
export const getKids = async (): Promise<Kid[]> => {
  const snapshot = await getDocs(collection(db, "myG"));
  const kids: Kid[] = [];
  
  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    // Check if this document has kid profile fields
    if (data.name && data.age && data.location) {
      kids.push({
        id: doc.id,
        name: data.name || "",
        age: data.age || 0,
        status: data.status || "safe",
        location: data.location || "",
        lastSeen: data.lastSeen || "Just now",
        avatar: data.avatar || "",
        zonesCount: data.zonesCount || 0,
        parentId: data.parentId || "",
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt) || new Date(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt) || new Date(),
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
  } catch {}
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
  } catch {}
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
    const data = d.data() as any;
    return {
      id: d.id,
      type: data.type,
      action: data.action,
      message: data.message,
      kidId: data.kidId,
      zoneId: data.zoneId,
      severity: data.severity || "info",
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt) || new Date(),
    } as Activity;
  });
  items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return items.slice(0, limitCount);
};

