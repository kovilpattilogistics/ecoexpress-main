export enum UserRole {
  ADMIN = 'ADMIN',
  DRIVER = 'DRIVER',
}

export enum TripStatus {
  SCHEDULED = 'SCHEDULED',
  STARTED = 'STARTED',
  PICKUP_REACHED = 'PICKUP_REACHED', // Driver arrived at pickup
  PICKUP_COMPLETED = 'PICKUP_COMPLETED', // Goods loaded
  IN_TRANSIT = 'IN_TRANSIT',
  DROP_REACHED = 'DROP_REACHED', // Driver arrived at drop
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  PENDING_APPROVAL = 'PENDING_APPROVAL', // For driver requested trips OR customer requests
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  password?: string; // In a real app, never store plain text
}

export interface Customer {
  id: string;
  name: string;
  address: string;
  phone?: string;
}

export interface TripTimelineEvent {
  status: TripStatus;
  timestamp: string;
  location?: string;
}

export interface Trip {
  id: string;
  customerId?: string; // Optional if ad-hoc/public
  customerName: string; // Denormalized for display
  customerPhone?: string; // Specific for public bookings
  driverId: string; // Empty if unassigned (Customer Request)
  
  pickupLocation: string;
  pickupLat?: number;
  pickupLng?: number;

  dropLocation: string;
  dropLat?: number;
  dropLng?: number;
  
  // New Booking Fields
  goodsType?: string;
  isMultiDrop?: boolean;
  dropCount?: number;

  estimatedDistance?: string; // e.g. "15.4 km"

  scheduledTime: string;
  status: TripStatus;
  notes?: string;
  timeline: TripTimelineEvent[];
  
  // Payment Details
  paymentMethod?: 'UPI' | 'CASH';
  paymentAmount?: number;
  paymentProofUrl?: string; // Data URL for image
  
  // Meta
  isDriverRequested: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
  timestamp: number;
}
