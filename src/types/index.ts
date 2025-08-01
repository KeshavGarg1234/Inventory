

export type AvailabilityStatus = "Available" | "In Use" | "Discarded";

export interface User {
  personId: string;
  name: string;
  phone: string;
  department?: string;
  joiningDate: string; // ISO string date
}

export interface Bill {
    billNumber: string;
    billDate: string; // ISO string date
    company: string;
}

export interface SubItem {
  id: string;
  availabilityStatus: AvailabilityStatus;
  billNumber?: string;
  discardedDate?: string; // ISO string date
  assignedTo?: {
    personId: string;
    name: string;
    phone: string;
    department?: string;
    assignmentDate: string; // ISO string date
    project?: string;
  };
}

export interface Item {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  totalQuantity: number;
  subItems: SubItem[];
}

export interface NewItemData {
  name: string;
  description: string;
  imageUrl?: string;
}

export interface AddUnitsData {
  itemId: string;
  quantity: number;
  billNumber: string;
  billDate: string; // ISO string date
  company: string;
}

export interface ActionResponse {
  success: boolean;
  message?: string;
}
