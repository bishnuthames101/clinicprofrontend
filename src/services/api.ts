import axios from 'axios';
import type { AxiosResponse, AxiosError } from 'axios';

// Extend the AxiosRequestConfig type to include _retry
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

// API base URL - should be configured based on environment
const API_BASE_URL =import.meta.env.VITE_API_URL;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
// Add response interceptor to handle token refresh
api.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config;
      
      // If 401 error and we have a refresh token
      if (error.response?.status === 401 && 
          localStorage.getItem('refresh_token') && 
          originalRequest && 
          !originalRequest._retry) {
        
        originalRequest._retry = true;
        
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: localStorage.getItem('refresh_token')
          });
          
          localStorage.setItem('access_token', response.data.access);
          api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
          return api(originalRequest);
        } catch (err) {
          // If refresh fails, clear tokens and redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(err);
        }
      }
      
      return Promise.reject(error);
    }
  );

// Types
export interface Patient {
  id: number;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email?: string;
  address: string;
  medical_history?: string;
  last_visit: string;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  category: 'Consultation' | 'Laboratory' | 'Radiology' | 'Cardiology' | 'Therapy' | 'Vaccination' | 'Dental';
  is_active: boolean;
}

export interface BillItem {
  id: number;
  service: number;  // service ID
  service_name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Bill {
  id: number;
  bill_number: string;
  date: string;
  patient: number;  // patient ID
  patient_name: string;
  discount_type: 'percentage' | 'amount';
  discount_value: number;
  discount_amount: number;
  grand_total: number;
  status: 'Paid' | 'Pending' | 'Cancelled';
  items: BillItem[];
  notes?: string;
  created_by: number;  // user ID
}

export interface CreateBillRequest {
  patientId: number;
  items: {
    serviceId: number;
    quantity: number;
  }[];
  discountType: 'percentage' | 'amount';
  discountValue: number;
  notes?: string;
}

export interface DashboardData {
  totalPatients: number;
  totalBills: number;
  totalRevenue: number;
  todayPatients: number;
  todayBills: number;
  todayRevenue: number;
  recentBills: Bill[];
  recentPatients: Patient[];
  dailyStats: {
    date: string;
    patients: number;
    revenue: number;
  }[];
}

export interface MedicalRecord {
  id: number;
  date: string;
  diagnosis: string;
  treatment: string;
  notes: string;
  doctor: string;
}

export interface MedicalReport {
  id: number;
  date: string;
  type: string;
  title: string;
  fileUrl: string;
  fileType: string;
  uploadedBy: string;
}

export interface PatientDetails {
  patient: Patient;
  medicalRecords: MedicalRecord[];
  billingHistory: Bill[];
  medicalReports: MedicalReport[];
}

// API Endpoints
export const patientApi = {
  // Get all patients
  getAll: () => api.get<Patient[]>('/patients/'),
  
  // Get patient by ID
  getById: (id: number) => api.get<Patient>(`/patients/${id}/`),
  
  // Get patient details including medical records, billing history, and reports
  getDetails: (id: number) => api.get<PatientDetails>(`/patients/${id}/details/`),
  
  // Create new patient
  create: (data: Omit<Patient, 'id' | 'last_visit' | 'created_at' | 'updated_at'>) => 
    api.post<Patient>('/patients/', data),
  
  // Update patient
  update: (id: number, data: Partial<Patient>) => 
    api.put<Patient>(`/patients/${id}/`, data),
  
  // Get patient's billing history
  getBillingHistory: (id: number) => 
    api.get<Bill[]>(`/patients/${id}/billing-history/`),

  // Delete patient
  delete: (id: number) => api.delete(`/patients/${id}/`),
  
  // Add medical record
  addMedicalRecord: (id: number, data: Omit<MedicalRecord, 'id' | 'date'>) => 
    api.post<MedicalRecord>(`/patients/${id}/add_medical_record/`, data),
    
  // Delete medical record
  deleteMedicalRecord: (patientId: number, recordId: number) => 
    api.delete<PatientDetails>(`/patients/${patientId}/delete-medical-record/${recordId}/`),
    
  // Add medical report
  addMedicalReport: (id: number, data: Omit<MedicalReport, 'id' | 'date'>) => 
    api.post<MedicalReport>(`/patients/${id}/add_medical_report/`, data),
    
  // Delete medical report
  deleteMedicalReport: (patientId: number, reportId: number) => 
    api.delete<PatientDetails>(`/patients/${patientId}/delete-medical-report/${reportId}/`),
};

export const serviceApi = {
  // Get all services
  getAll: () => api.get<Service[]>('/services/'),
  
  // Get service by ID
  getById: (id: number) => api.get<Service>(`/services/${id}/`),
  
  // Create new service
  create: (data: Omit<Service, 'id'>) => 
    api.post<Service>('/services/', data),
  
  // Update service
  update: (id: number, data: Partial<Service>) => 
    api.put<Service>(`/services/${id}/`, data),
  
  // Delete service
  delete: (id: number) => api.delete(`/services/${id}/`),
};

export interface DailyReportData {
  date: string;
  bills: Bill[];
  summary: {
    total_amount: number;
    bill_count: number;
    average_amount: number;
    highest_amount: number;
  };
}

export const dashboardApi = {
  // Get dashboard data
  getData: () => api.get<DashboardData>('/dashboard/'),
};

export const billingApi = {
  // Get all bills
  getAll: () => api.get<Bill[]>('/bills/list/'),
  
  // Get bill by ID
  getById: (id: number) => api.get<Bill>(`/bills/${id}/`),
  
  // Create new bill
  create: (data: CreateBillRequest) => 
    api.post<Bill>('/bills/', data),
  
  // Update bill status
  updateStatus: (id: number, status: Bill['status']) => 
    api.patch<Bill>(`/bills/${id}/`, { status }),
  
  // Get daily report
  getDailyReport: (date: string) => 
    api.get<DailyReportData>(`/bills/daily-report/?date=${date}`),
  
  // Download bill
  download: (id: number) => 
    api.get(`/bills/${id}/download/`, { responseType: 'blob' }),
};

// Error handling
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      throw new ApiError(
        error.response.status,
        error.response.data?.message || 'An error occurred',
        error.response.data
      );
    }
    throw new ApiError(500, 'Network error');
  }
);

export default api; 