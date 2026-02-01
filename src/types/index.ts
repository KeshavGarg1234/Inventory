
import { z } from 'zod';

export type AvailabilityStatus = "Available" | "In Use" | "Discarded";
export type NotificationType = "allot" | "unallot" | "discard" | "restore" | "register";
export type NotificationStatus = "pending" | "approve" | "rejected";
export type UserRole = "A" | "B" | "C" | "D";

export type TransactionType = 'created' | 'allotted' | 'unallotted' | 'discarded' | 'restored' | 'approve';

export interface Transaction {
    type: TransactionType;
    date: string; // ISO string
    assignment?: AssignmentDetails;
    actor?: Pick<User, 'personId' | 'name'>;
}

export interface User {
  personId: string; // Will store Firebase UID
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  department?: string;
  section?: string;
  joiningDate: string; // ISO string date
}

export interface Bill {
    billNumber: string;
    billDate: string; // ISO string date
    company: string;
    amount?: number;
}

export interface AssignmentDetails {
    personId: string;
    name: string;
    email: string;
    phone: string;
    department?: string;
    section?: string;
    assignmentDate: string; // ISO string date
    project?: string;
    unallotmentDate?: string; // ISO string date
}

export interface SubItem {
  id: string;
  availabilityStatus: AvailabilityStatus;
  billNumber?: string;
  lotName?: string;
  discardedDate?: string; // ISO string date
  assignedTo?: AssignmentDetails;
  allotmentHistory?: AssignmentDetails[];
  transactionLog?: Transaction[];
}

export interface Item {
  id: string;
  name: string;
  description: string;
  totalQuantity: number;
  subItems: SubItem[];
}

export interface Notification {
  id: string;
  type: NotificationType;
  status: NotificationStatus;
  createdAt: string; // ISO string date
  itemId?: string;
  subItemId?: string;
  itemName?: string;
  requestedData?: {
    assignmentDetails?: AssignmentDetails;
    newUser?: NewUserData;
    requester?: Pick<User, 'personId' | 'name'>;
  };
  handledAt?: string; // ISO string date
  rejectionReason?: string;
}

// NOTE: This is the old list type, kept for data compatibility.
// The new UI will use BudgetList, Note, and Tax types instead.
export interface CustomList {
  id: string;
  name: string;
  description: string; // Requirements
  budget?: number;
  notes?: string;
  itemIds: string[];
  createdAt: string; // ISO String
}

export interface NewListData {
  name: string;
  description: string;
  budget?: number;
  notes?: string;
}
// End old list types

// --- NEW TYPES FOR LISTS & TOOLS SECTION ---
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
}

export interface Tax {
    id: string;
    name: string;
    percentage: number;
}

export interface BudgetItem {
    id: string;
    name: string;
    price: number; // Price per unit
    quantity: number;
}

export interface BudgetList {
    id: string;
    name: string;
    description: string;
    items: BudgetItem[];
    taxId?: string; // ID of the applied tax
    createdAt: string; // ISO String
    updatedAt: string; // ISO String
}
// --- END NEW TYPES ---


// Represents a single inventory's data
export interface InventoryData {
  items: Item[];
  bills: Bill[];
  users: User[];
  notifications: Notification[];
  lists: CustomList[]; // Old list type
  budgetLists?: BudgetList[];
  notes?: Note[];
  taxes?: Tax[];
  secure?: {
    appPasskey?: string;
    deletePasskey?: string;
    authPasskey?: string;
  };
}

// Represents the metadata for an inventory
export interface Inventory {
  id: string; // The unique 8-digit code
  name: string;
  creatorUid: string;
  creatorEmail: string;
  createdAt: string; // ISO string
}

export interface NewItemData {
  name: string;
  description: string;
}

export interface NewUserData {
  personId: string; // Firebase UID
  name: string;
  email: string;
  phone: string;
  department?: string;
  section?: string;
}

export interface AddUnitsData {
  itemId: string;
  quantity: number;
  billNumber: string;
  billDate: string; // ISO string date
  company: string;
  amount?: number;
  lotName: string;
}

export interface NewBillData {
  billNumber: string;
  company: string;
  billDate: string; // ISO string
  amount?: number;
  items: {
    id: string; // Can be a temporary ID for new items
    name: string;
    quantity: number;
    isNew: boolean;
  }[];
}


export interface ActionResponse {
  success: boolean;
  message?: string;
  data?: any;
}
