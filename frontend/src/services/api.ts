import axios from 'axios';
import { Item, Lending, History, DashboardMetrics } from '@/types';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

type ItemInput = Omit<Item, 'id' | 'lentQty' | 'availQty'>;
type LendingInput = Omit<Lending, 'id' | 'itemName'>;
type PaginationParams = { page?: number; limit?: number };

export const login = (data: any) => api.post<{token: string, role: string}>('/login', data).then(res => res.data);
export const oauthLogin = (data: {email: string, name?: string | null}) => api.post<{token: string, role: string}>('/oauth', data).then(res => res.data);
export const signup = (data: any) => api.post<{success: boolean}>('/signup', data).then(res => res.data);

export const getInventory = () => api.get<Item[]>('/inventory').then(res => res.data);
export const addItem = (data: ItemInput) => api.post<Item>('/inventory', data).then(res => res.data);
export const updateItem = (id: number, data: ItemInput) => api.put<{success: boolean}>(`/inventory/${id}`, data).then(res => res.data);
export const deleteItem = (id: number) => api.delete<{success: boolean}>(`/inventory/${id}`).then(res => res.data);

export const getLendings = (params?: PaginationParams) =>
  api.get<Lending[]>('/lendings', { params }).then(res => res.data);
export const addLending = (data: LendingInput) => api.post<{id: number}>('/lendings', data).then(res => res.data);
export const bulkLend = (data: { items: { itemId: number, qty: number }[], club: string, theirMember: string, ourMember: string, borrowerEmail?: string, lentOn: string, duration: number, notes?: string }) => api.post<{success: boolean, count: number}>('/lendings/bulk', data).then(res => res.data);
export const markReturned = (id: number) => api.post<{success: boolean}>(`/lendings/${id}/return`).then(res => res.data);

export const getHistory = (params?: PaginationParams) =>
  api.get<History[]>('/history', { params }).then(res => res.data);

export const getMetrics = () => api.get<DashboardMetrics>('/metrics').then(res => res.data);

export const getUsers = () => api.get<any[]>('/users').then(res => res.data);
export const createUser = (data: any) => api.post<any>('/users', data).then(res => res.data);
export const updateUser = (id: number, data: any) => api.put<any>(`/users/${id}`, data).then(res => res.data);
export const deleteUser = (id: number) => api.delete<{success: boolean}>(`/users/${id}`).then(res => res.data);

export const getProjects = () => api.get<any[]>('/projects').then(res => res.data);
export const createProject = (data: any) => api.post<any>('/projects', data).then(res => res.data);
export const updateProject = (id: number, data: any) => api.put<any>(`/projects/${id}`, data).then(res => res.data);
export const addProjectItem = (id: number, data: any) => api.post<any>(`/projects/${id}/items`, data).then(res => res.data);
export const uploadProjectImage = (id: number, file: File) => {
  const formData = new FormData();
  formData.append('image', file);
  return api.post<any>(`/projects/${id}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data);
};

export const getRequests = () => api.get<any[]>('/requests').then(res => res.data);
export const createRequest = (data: any) => api.post<any>('/requests', data).then(res => res.data);
export const updateRequest = (id: number, data: any) => api.put<any>(`/requests/${id}`, data).then(res => res.data);
export const updateRequestStatus = (id: number, data: any) => api.put<any>(`/requests/${id}/status`, data).then(res => res.data);
