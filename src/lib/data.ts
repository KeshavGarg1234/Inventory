
import type { Item, Bill, User } from "@/types";
import { sub } from "date-fns";

export const mockUsers: User[] = [
  {
    personId: "U-123",
    name: "John Doe",
    phone: "1234567890",
    department: "Marketing",
    joiningDate: sub(new Date(), { months: 6 }).toISOString(),
  },
  {
    personId: "U-100",
    name: "User 1",
    phone: "5550100123",
    department: "Engineering",
    joiningDate: sub(new Date(), { months: 2 }).toISOString(),
  },
   {
    personId: "U-101",
    name: "User 2",
    phone: "5550101123",
    department: "Engineering",
    joiningDate: sub(new Date(), { months: 3 }).toISOString(),
  },
  {
    personId: "D-01",
    name: "Dev 1",
    phone: "555020145",
    department: "Engineering",
    joiningDate: sub(new Date(), { months: 12 }).toISOString(),
  },
  {
    personId: "EMP-001",
    name: "Alice Johnson",
    phone: "1112223333",
    department: "HR",
    joiningDate: sub(new Date(), { months: 24 }).toISOString(),
  }
];

export const mockBills: Bill[] = [
    {
        billNumber: "INV-001",
        billDate: sub(new Date(), { months: 2 }).toISOString(),
        company: "Apple Inc.",
    },
    {
        billNumber: "INV-002",
        billDate: sub(new Date(), { months: 3 }).toISOString(),
        company: "Dell Technologies",
    },
    {
        billNumber: "INV-003",
        billDate: sub(new Date(), { months: 1 }).toISOString(),
        company: "Logitech",
    },
     {
        billNumber: "INV-005",
        billDate: sub(new Date(), { months: 5 }).toISOString(),
        company: "Apple Inc.",
    },
     {
        billNumber: "INV-008",
        billDate: sub(new Date(), { months: 2 }).toISOString(),
        company: "PC Retailers",
    },
    {
        billNumber: "INV-010",
        billDate: sub(new Date(), { months: 12 }).toISOString(),
        company: "Herman Miller",
    },
     {
        billNumber: "INV-011",
        billDate: sub(new Date(), { months: 6 }).toISOString(),
        company: "Autonomous AI",
    }
];

export const mockItems: Item[] = [
  {
    id: "item-1",
    name: "MacBook Pro 16-inch",
    description: "High-performance laptop for professionals. M3 Pro chip, 18GB RAM, 512GB SSD.",
    imageUrl: "https://placehold.co/400x300.png",
    totalQuantity: 5,
    subItems: [
      { id: "", billNumber: "INV-001", availabilityStatus: "Available" },
      { id: "", billNumber: "INV-001", availabilityStatus: "In Use", assignedTo: { personId: "U-123", name: "John Doe", phone: "1234567890", department: "Marketing", assignmentDate: sub(new Date(), { days: 5 }).toISOString(), project: "Project Phoenix" } },
      { id: "", billNumber: "INV-001", availabilityStatus: "Available" },
      { id: "", billNumber: "INV-008", availabilityStatus: "Discarded", discardedDate: sub(new Date(), { days: 1 }).toISOString() },
      { id: "", billNumber: "INV-008", availabilityStatus: "Available" },
    ],
  },
  {
    id: "item-2",
    name: "Dell UltraSharp Monitor",
    description: "27-inch 4K UHD monitor with vibrant colors and USB-C connectivity.",
    imageUrl: "https://placehold.co/400x300.png",
    totalQuantity: 8,
    subItems: [
      ...Array.from({ length: 5 }, (_, i) => ({ id: ``, billNumber: "INV-002", availabilityStatus: "Available" as const })),
      ...Array.from({ length: 3 }, (_, i) => ({ id: ``, billNumber: "INV-002", availabilityStatus: "In Use" as const, assignedTo: { personId: `U-10${i}`, name: `User ${i+1}`, phone: `555010${i}123`, department: "Engineering", assignmentDate: sub(new Date(), { weeks: i+1 }).toISOString() } })),
    ],
  },
  {
    id: "item-3",
    name: "Logitech MX Master 3S",
    description: "Advanced wireless mouse with ergonomic design and customizable buttons.",
    imageUrl: "https://placehold.co/400x300.png",
    totalQuantity: 12,
    subItems: Array.from({ length: 12 }, (_, i) => ({
      id: ``,
      billNumber: "INV-003",
      availabilityStatus: i < 10 ? "Available" : "In Use",
      assignedTo: i >= 10 ? { personId: `D-0${i-9}`, name: `Dev ${i-9}`, phone: `555020${i-9}45`, department: "Engineering", assignmentDate: sub(new Date(), { days: i }).toISOString(), project: "Internal Tools" } : undefined,
    })),
  },
  {
    id: "item-4",
    name: "Apple Magic Keyboard",
    description: "Wireless keyboard with numeric keypad, providing a comfortable and precise typing experience.",
    imageUrl: "https://placehold.co/400x300.png",
    totalQuantity: 10,
    subItems: Array.from({ length: 10 }, (_, i) => ({
      id: ``,
      billNumber: "INV-005",
      availabilityStatus: "Available",
    })),
  },
    {
    id: "item-5",
    name: "Office Chair Ergonomic",
    description: "Herman Miller Aeron chair with lumbar support and adjustable armrests.",
    imageUrl: "https://placehold.co/400x300.png",
    totalQuantity: 4,
    subItems: [
      { id: "", billNumber: "INV-010", availabilityStatus: "In Use", assignedTo: { personId: "EMP-001", name: "Alice Johnson", phone: "1112223333", department: "HR", assignmentDate: sub(new Date(), { days: 80 }).toISOString() } },
      { id: "", billNumber: "INV-010", availabilityStatus: "In Use", assignedTo: { personId: "EMP-002", name: "Bob Williams", phone: "4445556666", department: "HR", assignmentDate: sub(new Date(), { days: 75 }).toISOString(), project: "Website Redesign" } },
      { id: "", billNumber: "INV-010", availabilityStatus: "In Use", assignedTo: { personId: "EMP-003", name: "Charlie Brown", phone: "7778889999", department: "Marketing", assignmentDate: sub(new Date(), { days: 60 }).toISOString() } },
      { id: "", billNumber: "INV-010", availabilityStatus: "Discarded", discardedDate: sub(new Date(), { days: 30 }).toISOString() },
    ],
  },
  {
    id: "item-6",
    name: "Standing Desk Frame",
    description: "Autonomous SmartDesk Pro frame, dual motor, supports up to 300 lbs.",
    imageUrl: "https://placehold.co/400x300.png",
    totalQuantity: 3,
    subItems: [
      { id: "", billNumber: "INV-011", availabilityStatus: "In Use", assignedTo: { personId: "EMP-004", name: "Diana Prince", phone: "1231231234", department: "Design", assignmentDate: sub(new Date(), { days: 50 }).toISOString(), project: "Mobile App" } },
      { id: "", billNumber: "INV-011", availabilityStatus: "Available" },
      { id: "", billNumber: "INV-011", availabilityStatus: "Available" },
    ],
  },
];
