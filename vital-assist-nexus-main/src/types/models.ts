// Domain models for MediRoute (frontend contracts)
export type Role = "patient" | "hospital" | "ambulance" | "blood-bank" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
  verified?: boolean;
}

export interface Patient extends User {
  role: "patient";
  bloodGroup: BloodGroup;
  dob: string;
  address: string;
  allergies: string[];
  conditions: string[];
  emergencyContacts: EmergencyContact[];
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  hospitalId: string;
  available: boolean;
  rating: number;
  patientsToday: number;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  city: string;
  distanceKm: number;
  icuBedsFree: number;
  icuBedsTotal: number;
  generalBedsFree: number;
  generalBedsTotal: number;
  doctorsOnDuty: number;
  emergencyQueue: number;
  rating: number;
  phone: string;
  specialties: string[];
}

export type BloodGroup = "O+" | "O-" | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-";

export interface BloodBank {
  id: string;
  name: string;
  city: string;
  distanceKm: number;
  phone: string;
  inventory: Record<BloodGroup, { units: number; capacity: number }>;
  criticalRequests: number;
}

export interface Ambulance {
  id: string;
  code: string;
  driver: string;
  vehicle: string;
  status: "idle" | "dispatched" | "on-trip" | "returning" | "maintenance";
  fuelPct: number;
  currentTripId?: string;
  location: string;
}

export type Priority = "critical" | "high" | "moderate" | "low";
export type EmergencyStatus = "pending" | "dispatched" | "en-route" | "arrived" | "completed" | "cancelled";

export interface EmergencyRequest {
  id: string;
  patientId: string;
  patientName: string;
  reason: string;
  priority: Priority;
  status: EmergencyStatus;
  hospitalId?: string;
  hospitalName?: string;
  ambulanceId?: string;
  ambulanceCode?: string;
  etaMin?: number;
  distanceKm?: number;
  createdAt: string;
  location: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  date: string;
  doctor: string;
  hospital: string;
  diagnosis: string;
  prescription: string;
  attachments?: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  hospital: string;
  specialty: string;
  date: string;
  time: string;
  status: "upcoming" | "completed" | "cancelled";
}

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface Trip {
  id: string;
  ambulanceId: string;
  patientName: string;
  reason: string;
  from: string;
  to: string;
  status: EmergencyStatus;
  distanceKm: number;
  durationMin: number;
  startedAt: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  kind: "emergency" | "appointment" | "blood" | "hospital" | "system";
  read: boolean;
  time: string;
}

export interface Donor {
  id: string;
  name: string;
  bloodGroup: BloodGroup;
  lastDonation: string;
  phone: string;
  city: string;
}
