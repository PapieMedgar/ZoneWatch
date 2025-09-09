import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

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
