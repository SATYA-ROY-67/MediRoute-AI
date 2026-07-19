import type {
  Hospital, BloodBank, Ambulance, EmergencyRequest, MedicalRecord,
  Appointment, Notification, Doctor, Trip, Donor, BloodGroup, Patient,
} from "@/types/models";

export const mockPatient: Patient = {
  id: "p_001",
  name: "Satyajeet Roy Chaudhary",
  email: "satya@example.com",
  role: "patient",
  phone: "+91 98xxxxxx00",
  createdAt: "2024-05-10",
  verified: true,
  bloodGroup: "O+",
  dob: "1998-04-12",
  address: "HSR Layout, Bengaluru",
  allergies: ["Penicillin", "Peanuts"],
  conditions: ["Mild asthma"],
  emergencyContacts: [
    { name: "Rhea Sharma", relation: "Sister",  phone: "+91 90xxxxxx21" },
    { name: "Vikram Sharma", relation: "Father", phone: "+91 90xxxxxx55" },
  ],
};

export const mockHospitals: Hospital[] = [
  { id: "h_001", name: "City General Hospital", address: "MG Road", city: "Bengaluru", distanceKm: 2.4, icuBedsFree: 4, icuBedsTotal: 20, generalBedsFree: 32, generalBedsTotal: 120, doctorsOnDuty: 18, emergencyQueue: 6, rating: 4.6, phone: "+91 80 4000 1000", specialties: ["Cardiology", "Trauma", "Neuro"] },
  { id: "h_002", name: "Apollo Hospitals",      address: "Bannerghatta Rd", city: "Bengaluru", distanceKm: 5.1, icuBedsFree: 2, icuBedsTotal: 30, generalBedsFree: 18, generalBedsTotal: 200, doctorsOnDuty: 42, emergencyQueue: 12, rating: 4.8, phone: "+91 80 4000 2000", specialties: ["Cardiology", "Oncology"] },
  { id: "h_003", name: "Manipal Hospital",      address: "Old Airport Rd", city: "Bengaluru", distanceKm: 3.8, icuBedsFree: 7, icuBedsTotal: 24, generalBedsFree: 44, generalBedsTotal: 160, doctorsOnDuty: 28, emergencyQueue: 4, rating: 4.5, phone: "+91 80 4000 3000", specialties: ["Ortho", "Neuro"] },
  { id: "h_004", name: "Fortis Hospital",       address: "Cunningham Rd", city: "Bengaluru", distanceKm: 6.7, icuBedsFree: 1, icuBedsTotal: 18, generalBedsFree: 12, generalBedsTotal: 140, doctorsOnDuty: 22, emergencyQueue: 9, rating: 4.4, phone: "+91 80 4000 4000", specialties: ["Cardiology"] },
  { id: "h_005", name: "St. Mary's",            address: "Whitefield",    city: "Bengaluru", distanceKm: 8.9, icuBedsFree: 5, icuBedsTotal: 16, generalBedsFree: 28, generalBedsTotal: 110, doctorsOnDuty: 15, emergencyQueue: 3, rating: 4.3, phone: "+91 80 4000 5000", specialties: ["Pediatrics"] },
];

const bg: BloodGroup[] = ["O+","O-","A+","A-","B+","B-","AB+","AB-"];
const mkInv = (units: number[]) => Object.fromEntries(
  bg.map((g, i) => [g, { units: units[i], capacity: [60,40,60,30,60,30,25,20][i] }])
) as BloodBank["inventory"];

export const mockBloodBanks: BloodBank[] = [
  { id: "b_001", name: "Red Cross Blood Bank",  city: "Bengaluru", distanceKm: 1.9, phone: "+91 80 5000 1001", inventory: mkInv([42,8,34,12,28,6,14,3]),  criticalRequests: 2 },
  { id: "b_002", name: "Lifeline Blood Center", city: "Bengaluru", distanceKm: 4.2, phone: "+91 80 5000 1002", inventory: mkInv([55,12,38,9,31,4,10,2]),  criticalRequests: 1 },
  { id: "b_003", name: "Rotary Blood Bank",     city: "Bengaluru", distanceKm: 6.5, phone: "+91 80 5000 1003", inventory: mkInv([48,5,29,15,22,7,18,4]),  criticalRequests: 0 },
];

export const mockAmbulances: Ambulance[] = [
  { id: "a_001", code: "MR-01", driver: "Rohan Kapoor", vehicle: "Force Traveller", status: "on-trip",    fuelPct: 68, currentTripId: "t_001", location: "MG Road" },
  { id: "a_002", code: "MR-02", driver: "Suresh N.",    vehicle: "Tata Winger",     status: "idle",       fuelPct: 92, location: "Base station" },
  { id: "a_003", code: "MR-03", driver: "Karan Ahuja",  vehicle: "Force Traveller", status: "dispatched", fuelPct: 44, currentTripId: "t_002", location: "Indiranagar" },
  { id: "a_004", code: "MR-04", driver: "Meera P.",     vehicle: "Mahindra Bolero", status: "maintenance",fuelPct: 20, location: "Workshop" },
  { id: "a_005", code: "MR-05", driver: "Anjali D.",    vehicle: "Tata Winger",     status: "returning",  fuelPct: 55, location: "Koramangala" },
];

export const mockDoctors: Doctor[] = [
  { id: "d_001", name: "Dr. R. Sharma",  specialty: "Cardiology",   hospitalId: "h_001", available: true,  rating: 4.9, patientsToday: 18 },
  { id: "d_002", name: "Dr. P. Iyer",    specialty: "Neurology",    hospitalId: "h_001", available: true,  rating: 4.7, patientsToday: 12 },
  { id: "d_003", name: "Dr. A. Khan",    specialty: "Orthopedics",  hospitalId: "h_003", available: false, rating: 4.6, patientsToday: 9 },
  { id: "d_004", name: "Dr. S. Nair",    specialty: "Pediatrics",   hospitalId: "h_005", available: true,  rating: 4.8, patientsToday: 22 },
  { id: "d_005", name: "Dr. V. Reddy",   specialty: "Trauma",       hospitalId: "h_001", available: true,  rating: 4.5, patientsToday: 15 },
  { id: "d_006", name: "Dr. M. Gupta",   specialty: "Cardiology",   hospitalId: "h_002", available: false, rating: 4.7, patientsToday: 11 },
];

export const mockEmergencyRequests: EmergencyRequest[] = [
  { id: "e_001", patientId: "p_001", patientName: "Aarav Sharma",   reason: "Chest pain",         priority: "critical", status: "en-route",   hospitalName: "City General",  hospitalId: "h_001", ambulanceCode: "MR-01", ambulanceId: "a_001", etaMin: 4,  distanceKm: 2.1, createdAt: "10 min ago",  location: "HSR Layout" },
  { id: "e_002", patientId: "p_002", patientName: "Priya Nair",     reason: "Road accident",      priority: "critical", status: "dispatched", hospitalName: "Apollo",         hospitalId: "h_002", ambulanceCode: "MR-03", ambulanceId: "a_003", etaMin: 9,  distanceKm: 5.4, createdAt: "6 min ago",   location: "Indiranagar" },
  { id: "e_003", patientId: "p_003", patientName: "Rohan Mehta",    reason: "Breathing issue",    priority: "high",     status: "arrived",    hospitalName: "Manipal",        hospitalId: "h_003", ambulanceCode: "MR-05", ambulanceId: "a_005", etaMin: 0,  distanceKm: 0,    createdAt: "22 min ago",  location: "Koramangala" },
  { id: "e_004", patientId: "p_004", patientName: "Aisha Khan",     reason: "High fever",         priority: "moderate", status: "completed",  hospitalName: "St. Mary's",     hospitalId: "h_005",                                                     createdAt: "2 hours ago", location: "Whitefield" },
  { id: "e_005", patientId: "p_005", patientName: "Vikram Singh",   reason: "Fracture",           priority: "high",     status: "completed",  hospitalName: "Fortis",         hospitalId: "h_004",                                                     createdAt: "yesterday",   location: "MG Road" },
  { id: "e_006", patientId: "p_006", patientName: "Neha Sharma",    reason: "Allergic reaction",  priority: "moderate", status: "pending",                                                                                                              createdAt: "just now",    location: "Jayanagar" },
];

export const mockMedicalRecords: MedicalRecord[] = [
  { id: "m_001", patientId: "p_001", date: "2026-05-10", doctor: "Dr. R. Sharma", hospital: "City General", diagnosis: "Mild hypertension", prescription: "Amlodipine 5mg", attachments: 2 },
  { id: "m_002", patientId: "p_001", date: "2026-02-18", doctor: "Dr. P. Iyer",   hospital: "City General", diagnosis: "Migraine",          prescription: "Sumatriptan",     attachments: 1 },
  { id: "m_003", patientId: "p_001", date: "2025-11-02", doctor: "Dr. V. Reddy",  hospital: "Apollo",        diagnosis: "Sprained ankle",    prescription: "Ibuprofen, rest", attachments: 3 },
  { id: "m_004", patientId: "p_001", date: "2025-07-21", doctor: "Dr. R. Sharma", hospital: "City General", diagnosis: "Annual check-up",   prescription: "None",            attachments: 0 },
];

export const mockAppointments: Appointment[] = [
  { id: "ap_001", patientId: "p_001", doctorId: "d_001", doctorName: "Dr. R. Sharma", hospital: "City General", specialty: "Cardiology",  date: "2026-07-19", time: "10:30 AM", status: "upcoming" },
  { id: "ap_002", patientId: "p_001", doctorId: "d_002", doctorName: "Dr. P. Iyer",   hospital: "City General", specialty: "Neurology",   date: "2026-08-04", time: "3:00 PM",  status: "upcoming" },
  { id: "ap_003", patientId: "p_001", doctorId: "d_005", doctorName: "Dr. V. Reddy",  hospital: "Apollo",       specialty: "Trauma",      date: "2026-05-10", time: "11:00 AM", status: "completed" },
];

export const mockNotifications: Notification[] = [
  { id: "n_001", title: "Ambulance dispatched",     body: "MR-01 is en route. ETA 4 min.",             kind: "emergency",   read: false, time: "2 min ago" },
  { id: "n_002", title: "Appointment reminder",     body: "Cardiology consultation tomorrow at 10:30", kind: "appointment", read: false, time: "1 hour ago" },
  { id: "n_003", title: "Low O- stock",             body: "Red Cross reports critical O- levels.",     kind: "blood",       read: false, time: "3 hours ago" },
  { id: "n_004", title: "Hospital update",          body: "City General added 4 ICU beds tonight.",    kind: "hospital",    read: true,  time: "yesterday" },
  { id: "n_005", title: "System maintenance",       body: "AI router upgrade scheduled 2 AM IST.",     kind: "system",      read: true,  time: "2 days ago" },
];

export const mockTrips: Trip[] = [
  { id: "t_001", ambulanceId: "a_001", patientName: "Aarav Sharma",  reason: "Chest pain",     from: "HSR Layout",   to: "City General", status: "en-route",  distanceKm: 2.1, durationMin: 4,  startedAt: "10 min ago" },
  { id: "t_002", ambulanceId: "a_003", patientName: "Priya Nair",    reason: "Road accident",  from: "Indiranagar",  to: "Apollo",       status: "dispatched", distanceKm: 5.4, durationMin: 9,  startedAt: "6 min ago" },
  { id: "t_003", ambulanceId: "a_005", patientName: "Rohan Mehta",   reason: "Breathing",      from: "Koramangala",  to: "Manipal",      status: "arrived",   distanceKm: 3.2, durationMin: 7,  startedAt: "22 min ago" },
  { id: "t_004", ambulanceId: "a_001", patientName: "Nisha Rao",     reason: "Labor",          from: "Jayanagar",    to: "St. Mary's",   status: "completed", distanceKm: 6.1, durationMin: 15, startedAt: "yesterday" },
];

export const mockDonors: Donor[] = [
  { id: "dn_001", name: "Aarav Sharma",  bloodGroup: "O+",  lastDonation: "2 weeks ago", phone: "+91 98xxxxxx00", city: "Bengaluru" },
  { id: "dn_002", name: "Priya Nair",    bloodGroup: "A-",  lastDonation: "1 month ago", phone: "+91 98xxxxxx01", city: "Bengaluru" },
  { id: "dn_003", name: "Rohan Kapoor",  bloodGroup: "B+",  lastDonation: "3 weeks ago", phone: "+91 98xxxxxx02", city: "Bengaluru" },
  { id: "dn_004", name: "Aisha Khan",    bloodGroup: "AB-", lastDonation: "6 weeks ago", phone: "+91 98xxxxxx03", city: "Bengaluru" },
  { id: "dn_005", name: "Vikram Singh",  bloodGroup: "O-",  lastDonation: "2 months ago",phone: "+91 98xxxxxx04", city: "Bengaluru" },
];
