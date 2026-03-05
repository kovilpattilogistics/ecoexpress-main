import { User, UserRole, Trip, Customer } from "../types";
import { db } from "./firebaseConfig";
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  where, 
  deleteDoc,
  getDoc
} from "firebase/firestore";

const KEYS = {
  USERS: 'fleet_users',
  TRIPS: 'fleet_trips',
  CUSTOMERS: 'fleet_customers',
  SESSION: 'fleet_session'
};

// Hardcoded users for seeding
const REAL_USERS: User[] = [
  { 
    id: 'admin_01', 
    name: 'Admin User', 
    email: 'sirangvjomon@gmail.com', 
    phone: '9998887777', 
    role: UserRole.ADMIN, 
    password: 'Zolo@city$b301' 
  },
  { 
    id: 'driver_01', 
    name: 'Arun Driver', 
    email: 'arun@fleet.com', 
    phone: '9876543210', 
    role: UserRole.DRIVER, 
    password: 'arun@123' 
  },
];

// --- INITIALIZATION ---

export const initStorage = async () => {
  const firestore = db;
  
  if (firestore) {
    try {
      // Cast to any to prevent TS2769 error with "Firestore | null"
      const fs = firestore as any;
      // Check if admin exists, if not, seed data
      const adminRef = doc(fs, KEYS.USERS, 'admin_01');
      const adminSnap = await getDoc(adminRef);
      
      if (!adminSnap.exists()) {
        console.log("Seeding Database...");
        const batchPromises = REAL_USERS.map(user => 
          setDoc(doc(fs, KEYS.USERS, user.id), user)
        );
        await Promise.all(batchPromises);
        console.log("Database Seeded.");
      }
    } catch (e) {
      console.error("Firebase Init Error:", e);
    }
  } else {
    // Fallback LocalStorage Init
    if (!localStorage.getItem(KEYS.USERS)) {
      localStorage.setItem(KEYS.USERS, JSON.stringify(REAL_USERS));
    }
    if (!localStorage.getItem(KEYS.CUSTOMERS)) localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify([]));
    if (!localStorage.getItem(KEYS.TRIPS)) localStorage.setItem(KEYS.TRIPS, JSON.stringify([]));
  }
};

// --- DATA ACCESS (HYBRID: FIREBASE OR LOCAL STORAGE) ---

// Helpers for LocalStorage (Legacy/Fallback)
const getLocal = <T>(key: string): T[] => JSON.parse(localStorage.getItem(key) || '[]');
const setLocal = (key: string, data: any[]) => localStorage.setItem(key, JSON.stringify(data));

// 1. TRIPS

export const subscribeToTrips = (callback: (trips: Trip[]) => void) => {
  const firestore = db;
  if (firestore) {
    const fs = firestore as any;
    // Real-time listener
    const q = query(collection(fs, KEYS.TRIPS));
    return onSnapshot(q, (snapshot) => {
      const trips = snapshot.docs.map(doc => doc.data() as Trip);
      callback(trips);
    }, (error) => {
      console.error("Trip Subscription Error:", error);
    });
  } else {
    // Local storage "simulation"
    const data = getLocal<Trip>(KEYS.TRIPS);
    callback(data);
    // Return no-op unsubscribe
    return () => {};
  }
};

export const saveTrip = async (trip: Trip) => {
  try {
    const firestore = db;
    if (firestore) {
      const fs = firestore as any;
      await setDoc(doc(fs, KEYS.TRIPS, trip.id), trip);
    } else {
      const trips = getLocal<Trip>(KEYS.TRIPS);
      const index = trips.findIndex(t => t.id === trip.id);
      if (index >= 0) trips[index] = trip;
      else trips.push(trip);
      setLocal(KEYS.TRIPS, trips);
    }
  } catch (error) {
    console.error("Error saving trip:", error);
    throw error;
  }
};

// 2. CUSTOMERS

export const subscribeToCustomers = (callback: (customers: Customer[]) => void) => {
  const firestore = db;
  if (firestore) {
    const fs = firestore as any;
    const q = query(collection(fs, KEYS.CUSTOMERS));
    return onSnapshot(q, (snapshot) => {
      const custs = snapshot.docs.map(doc => doc.data() as Customer);
      callback(custs);
    }, (error) => console.error("Customer Sub Error:", error));
  } else {
    callback(getLocal<Customer>(KEYS.CUSTOMERS));
    return () => {};
  }
};

export const saveCustomer = async (customer: Customer) => {
  const firestore = db;
  if (firestore) {
    const fs = firestore as any;
    await setDoc(doc(fs, KEYS.CUSTOMERS, customer.id), customer);
  } else {
    const customers = getLocal<Customer>(KEYS.CUSTOMERS);
    const index = customers.findIndex(c => c.id === customer.id);
    if (index >= 0) customers[index] = customer;
    else customers.push(customer);
    setLocal(KEYS.CUSTOMERS, customers);
  }
};

export const deleteCustomer = async (customerId: string) => {
  const firestore = db;
  if (firestore) {
    const fs = firestore as any;
    await deleteDoc(doc(fs, KEYS.CUSTOMERS, customerId));
  } else {
    const customers = getLocal<Customer>(KEYS.CUSTOMERS);
    const filtered = customers.filter(c => c.id !== customerId);
    setLocal(KEYS.CUSTOMERS, filtered);
  }
};

// 3. USERS / AUTH

export const getUsers = async (): Promise<User[]> => {
  const firestore = db;
  if (firestore) {
    const fs = firestore as any;
    try {
      const snapshot = await getDocs(collection(fs, KEYS.USERS));
      return snapshot.docs.map(d => d.data() as User);
    } catch (e) {
      console.error("Error fetching users:", e);
      return [];
    }
  }
  return getLocal<User>(KEYS.USERS);
};

export const loginUser = async (identifier: string, password: string): Promise<User | null> => {
  const firestore = db;
  // 1. Try Firebase Query (Optimized)
  if (firestore) {
    const fs = firestore as any;
    try {
      // Query by email first
      const usersRef = collection(fs, KEYS.USERS);
      const q = query(usersRef, where("email", "==", identifier));
      const snapshot = await getDocs(q);
      
      let user: User | undefined;
      
      // Check results
      if (!snapshot.empty) {
        user = snapshot.docs[0].data() as User;
      } else {
        // Fallback: Check by Phone (since user might enter phone)
        const qPhone = query(usersRef, where("phone", "==", identifier));
        const phoneSnap = await getDocs(qPhone);
        if (!phoneSnap.empty) {
          user = phoneSnap.docs[0].data() as User;
        }
      }

      // Verify Password (In production, use Firebase Auth + Hash, this is for demo)
      if (user && user.password === password) {
        localStorage.setItem(KEYS.SESSION, JSON.stringify(user));
        return user;
      }
      return null;
    } catch (error) {
      console.error("Login Error:", error);
      // Fallback to local check if network fails
    }
  }

  // 2. Local Storage Fallback
  const users = getLocal<User>(KEYS.USERS);
  const user = users.find(u => (u.email === identifier || u.phone === identifier) && u.password === password);
  
  if (user) {
    localStorage.setItem(KEYS.SESSION, JSON.stringify(user));
    return user;
  }
  return null;
};

export const getSession = (): User | null => {
  const s = localStorage.getItem(KEYS.SESSION);
  return s ? JSON.parse(s) : null;
};

export const logoutUser = () => {
  localStorage.removeItem(KEYS.SESSION);
};
