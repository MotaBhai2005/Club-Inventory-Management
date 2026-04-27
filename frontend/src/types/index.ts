export interface Item {
  id: number;
  name: string;
  cat: string;
  qty: number;
  desc?: string | null;
  cond?: string | null;
  lentQty?: number;
  availQty?: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  registrationNumber?: string | null;
  role: string;
}

export interface Lending {
  id: number;
  itemId: number;
  qty: number;
  club: string;
  theirMember: string;
  borrowerEmail?: string | null;
  ourMember: string;
  lentOn: string;
  duration: number;
  notes?: string | null;
  itemName?: string; // Appended by backend lookup
  alertSent?: boolean;
}

export interface History {
  id: number;
  itemId: number;
  qty: number;
  club: string;
  theirMember: string;
  ourMember: string;
  lentOn: string;
  returnedOn: string;
  duration: number;
  itemName?: string;
}

export interface DashboardMetrics {
  uniqueItems: number;
  totalUnits: number;
  activeLendings: number;
  overdue: number;
}

export interface RequestItem {
  id: number;
  requestId: number;
  itemName: string;
  quantity: number;
  notes?: string | null;
}

export interface Request {
  id: number;
  userId: number;
  title: string;
  type: string;
  status: string;
  priority: string;
  description?: string | null;
  deadline?: string | null;
  inspirationLinks: string[];
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  items: RequestItem[];
  user?: { username: string; email: string };
}
