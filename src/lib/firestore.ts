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

// CREATE
export const addZone = async (zone: { name: string; description?: string }) => {
  const docRef = await addDoc(collection(db, "zones"), zone);
  return docRef.id;
};

// READ
export const getZones = async () => {
  const snapshot = await getDocs(collection(db, "zones"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// UPDATE
export const updateZone = async (id: string, data: object) => {
  const docRef = doc(db, "zones", id);
  await updateDoc(docRef, data);
};

// DELETE
export const deleteZone = async (id: string) => {
  const docRef = doc(db, "zones", id);
  await deleteDoc(docRef);
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
};

// DELETE KID
export const deleteKid = async (id: string) => {
  const docRef = doc(db, "myG", id);
  await deleteDoc(docRef);
};
