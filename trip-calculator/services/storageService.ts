import { User, UserRole, Trip, Customer, TripStatus } from "../types";
import { supabase } from "./supabaseClient";

const KEYS = {
  SESSION: 'fleet_session'
};

// --- AUTHENTICATION ---

// --- AUTHENTICATION ---

export const loginUser = async (email: string, password: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      console.error("Supabase Login Error:", error);
      return null;
    }

    // Fetch Profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profile) {
      const user = { ...profile, email: data.user.email } as User;
      localStorage.setItem(KEYS.SESSION, JSON.stringify(user));
      return user;
    }

    return null;
  } catch (e) {
    console.error("Login Error:", e);
    return null;
  }
};

export const registerUser = async (email: string, password: string, name: string, phone: string, role: UserRole): Promise<User | null> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone, role } // Metadata for trigger to potentially use, or manual insert
      }
    });

    if (error || !data.user) {
      console.error("Registration Error:", error);
      throw error;
    }

    // Manually insert into profiles if no trigger exists yet (safety net)
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      name,
      email,
      phone,
      role
    });

    if (profileError) {
      console.error("Profile Creation Error:", profileError);
      // Dont fail auth if profile fails, handle gracefully or retry
    }

    return { id: data.user.id, name, email, phone, role };
  } catch (e) {
    console.error("Register Error:", e);
    return null;
  }
};

export const getSession = (): User | null => {
  const s = localStorage.getItem(KEYS.SESSION);
  return s ? JSON.parse(s) : null;
};

export const logoutUser = async () => {
  await supabase.auth.signOut();
  localStorage.removeItem(KEYS.SESSION);
};

// --- INITIALIZATION ---

export const initStorage = async () => {
  // Check auth state
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    // Refresh local profile
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    if (data) {
      localStorage.setItem(KEYS.SESSION, JSON.stringify({ ...data, email: session.user.email }));
    }
  }
};

// --- DATA ACCESS ---

// 1. TRIPS

export const subscribeToTrips = (callback: (trips: Trip[]) => void) => {
  // Initial Fetch
  supabase.from('trips').select('*').order('created_at', { ascending: false })
    .then(({ data, error }) => {
      if (!error && data) callback(data as unknown as Trip[]);
    });

  // Realtime Subscription
  const channel = supabase
    .channel('public:trips')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, async (payload: any) => {
      // Re-fetch all on change (simplest for now, optimize later)
      const { data } = await supabase.from('trips').select('*').order('created_at', { ascending: false });
      if (data) callback(data as unknown as Trip[]);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const saveTrip = async (trip: Trip) => {
  // Convert FE Trip object to DB columns if necessary
  // The schema matches fairly well, but we need to ensure types align.
  // Trip ID is UUID, ensure it is.

  const { error } = await supabase.from('trips').upsert(trip as any);
  if (error) throw error;
};

// 2. CUSTOMERS (read from trips or profiles?)
// The prototype had a separate 'customers' collection.
// Let's implement a simple version that extracts unique customers from trips for now,
// or just return an empty list if not strictly used. 
// Looking at the dashboard, it lists customers. 
// Let's assume we just won't support the "Customers" tab fully yet or fetch from profiles with role=CUSTOMER.

export const subscribeToCustomers = (callback: (customers: Customer[]) => void) => {
  // Fetch profiles with role CUSTOMER
  supabase.from('profiles').select('*').eq('role', 'CUSTOMER')
    .then(({ data }) => {
      if (data) {
        const customers = data.map((p: any) => ({
          id: p.id,
          name: p.name || 'Unknown',
          address: 'N/A', // Schema doesn't have address yet
          phone: p.phone,
          email: p.email
        })) as Customer[];
        callback(customers);
      } else {
        callback([]);
      }
    });
  return () => { };
};

export const saveCustomer = async (customer: Customer) => {
  // Save to profiles
  // This assumes we can just insert them.
  await supabase.from('profiles').upsert({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    role: 'CUSTOMER'
    // Address missing in profile schema, ignore for now
  });
};

export const deleteCustomer = async (customerId: string) => {
  await supabase.from('profiles').delete().eq('id', customerId);
};

export const getUsers = async (): Promise<User[]> => {
  const { data } = await supabase.from('profiles').select('*');
  return (data || []) as unknown as User[];
};

// 3. VEHICLE LOGS
export const subscribeToVehicleLogs = (callback: (logs: any[]) => void) => {
  // Initial Fetch
  supabase.from('vehicle_logs').select('*').order('timestamp', { ascending: false }).limit(50)
    .then(({ data, error }) => {
      if (!error && data) callback(data);
    });

  // Realtime Subscription
  const channel = supabase
    .channel('public:vehicle_logs')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vehicle_logs' }, async (payload: any) => {
      const { data } = await supabase.from('vehicle_logs').select('*').order('timestamp', { ascending: false }).limit(100);
      if (data) callback(data);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export { supabase };

