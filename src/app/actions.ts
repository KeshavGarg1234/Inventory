
'use server';

import { revalidatePath } from 'next/cache';
import { doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import type { Item, Bill, User, SubItem, AddUnitsData, NewItemData, ActionResponse } from '@/types';
import { db } from '@/lib/firebase/config';
import { generateUniqueSubItemId, generateInitialIds } from '@/lib/utils';
import { mockItems, mockBills, mockUsers } from '@/lib/data';

const ITEMS_DOC_ID = 'items';
const BILLS_DOC_ID = 'bills';
const USERS_DOC_ID = 'users';
const DATA_COLLECTION_ID = 'inventory';

// Helper function to remove undefined values from objects, which Firestore doesn't support.
function removeUndefinedValues(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedValues);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const value = obj[key];
      if (value !== undefined) {
        acc[key] = removeUndefinedValues(value);
      }
      return acc;
    }, {} as any);
  }
  return obj;
}


type AppData = {
  items: Item[];
  bills: Bill[];
  users: User[];
};

// This function checks if the old single-document data structure exists.
// If it does, it migrates the data to the new, multi-document structure.
async function migrateToMultiDocumentStructure() {
    const oldDocRef = doc(db, DATA_COLLECTION_ID, 'data');
    const oldDocSnap = await getDoc(oldDocRef);

    if (oldDocSnap.exists()) {
        console.log("Old data structure found. Migrating to new structure...");
        const oldData = oldDocSnap.data() as AppData;
        
        const batch = writeBatch(db);

        const itemsRef = doc(db, DATA_COLLECTION_ID, ITEMS_DOC_ID);
        batch.set(itemsRef, { value: oldData.items || [] });

        const billsRef = doc(db, DATA_COLLECTION_ID, BILLS_DOC_ID);
        batch.set(billsRef, { value: oldData.bills || [] });

        const usersRef = doc(db, DATA_COLLECTION_ID, USERS_DOC_ID);
        batch.set(usersRef, { value: oldData.users || [] });

        // Delete the old document after migration
        batch.delete(oldDocRef);

        await batch.commit();
        console.log("Migration successful.");
    }
}


// Function to get the entire data blob from Firestore
export async function getData(): Promise<AppData> {
    try {
        await migrateToMultiDocumentStructure();

        const itemsRef = doc(db, DATA_COLLECTION_ID, ITEMS_DOC_ID);
        const billsRef = doc(db, DATA_COLLECTION_ID, BILLS_DOC_ID);
        const usersRef = doc(db, DATA_COLLECTION_ID, USERS_DOC_ID);

        const [itemsSnap, billsSnap, usersSnap] = await Promise.all([
            getDoc(itemsRef),
            getDoc(billsRef),
            getDoc(usersRef),
        ]);

        if (itemsSnap.exists() && billsSnap.exists() && usersSnap.exists()) {
            return {
                items: itemsSnap.data().value as Item[],
                bills: billsSnap.data().value as Bill[],
                users: usersSnap.data().value as User[],
            };
        } else {
            console.log("One or more data documents not found. Initializing with mock data.");
            const initialData: AppData = {
                items: generateInitialIds(mockItems),
                bills: mockBills,
                users: mockUsers,
            };
            
            const batch = writeBatch(db);
            if (!itemsSnap.exists()) batch.set(itemsRef, { value: removeUndefinedValues(initialData.items) });
            if (!billsSnap.exists()) batch.set(billsRef, { value: removeUndefinedValues(initialData.bills) });
            if (!usersSnap.exists()) batch.set(usersRef, { value: removeUndefinedValues(initialData.users) });
            await batch.commit();

            return initialData;
        }
    } catch (error) {
        console.error("Firestore connection failed. Falling back to mock data.", error);
        // Fallback to mock data if Firestore is unreachable
        return {
            items: generateInitialIds(mockItems),
            bills: mockBills,
            users: mockUsers,
        };
    }
}

async function saveItems(items: Item[]) {
    await setDoc(doc(db, DATA_COLLECTION_ID, ITEMS_DOC_ID), { value: removeUndefinedValues(items) });
}
async function saveBills(bills: Bill[]) {
    await setDoc(doc(db, DATA_COLLECTION_ID, BILLS_DOC_ID), { value: removeUndefinedValues(bills) });
}
async function saveUsers(users: User[]) {
    await setDoc(doc(db, DATA_COLLECTION_ID, USERS_DOC_ID), { value: removeUndefinedValues(users) });
}


// --- Item Actions ---
export async function addItem({ name, description, imageUrl }: NewItemData): Promise<ActionResponse> {
  const { items } = await getData();

  const existingItem = items.find(item => item.name.toLowerCase() === name.toLowerCase());
  if (existingItem) {
    return { success: false, message: `An item named "${name}" already exists.` };
  }

  const newItem: Omit<Item, 'id' | 'subItems' | 'imageUrl'> & { imageUrl?: string } = {
    name,
    description,
    totalQuantity: 1,
  };
  
  if (imageUrl) {
    newItem.imageUrl = imageUrl;
  }

  const subItems: SubItem[] = [{
    id: generateUniqueSubItemId(items),
    availabilityStatus: "Available",
    billNumber: ""
  }];

  const completeNewItem: Item = {
      ...newItem,
      id: `item-${Date.now()}`,
      subItems: subItems,
  }

  const newItems = [completeNewItem, ...items];
  await saveItems(newItems);
  revalidatePath('/');
  revalidatePath(`/item/${completeNewItem.id}`);
  return { success: true };
}


export async function updateItem(itemId: string, updatedData: Partial<Omit<Item, 'id'>>) {
  const { items } = await getData();
  const newItems = items.map((item) =>
    item.id === itemId ? { ...item, ...updatedData } : item
  );
  await saveItems(newItems);
  revalidatePath('/');
  revalidatePath(`/item/${itemId}`);
}

export async function deleteItem(itemId: string) {
  const { items } = await getData();
  const newItems = items.filter((i) => i.id !== itemId);
  await saveItems(newItems);
  revalidatePath('/');
}

// --- Sub-Item Actions ---
export async function addUnitsToItem(data: AddUnitsData) {
    const { itemId, quantity, billNumber, billDate, company } = data;
    const { items, bills } = await getData();

    const itemToUpdate = items.find(i => i.id === itemId);
    if (!itemToUpdate) return;

    // Create new sub-items carefully to avoid undefined fields
    const newSubItems: SubItem[] = Array.from({ length: quantity }, () => {
        const subItem: SubItem = {
            id: generateUniqueSubItemId(items),
            billNumber: billNumber,
            availabilityStatus: 'Available',
        };
        return subItem;
    });

    const updatedSubItems = [...itemToUpdate.subItems, ...newSubItems];
    const updatedItem: Item = {
        ...itemToUpdate,
        subItems: updatedSubItems,
        totalQuantity: updatedSubItems.length
    };
    
    const newItems = items.map(item => item.id === itemId ? updatedItem : item);
    await saveItems(newItems);

    const billExists = bills.some(b => b.billNumber === billNumber);
    if (!billExists) {
        const newBill: Bill = {
            billNumber,
            billDate,
            company,
        };
        const newBills = [...bills, newBill];
        await saveBills(newBills);
        revalidatePath('/bills');
    }

    revalidatePath(`/item/${itemId}`);
}


export async function updateSubItem(itemId: string, updatedSubItem: SubItem) {
  const { items } = await getData();
  const itemToUpdate = items.find(i => i.id === itemId);
  if (itemToUpdate) {
    const updatedSubItems = itemToUpdate.subItems.map(si =>
      si.id === updatedSubItem.id ? updatedSubItem : si
    );
    await updateItem(itemId, { subItems: updatedSubItems });
  }
  revalidatePath(`/item/${itemId}`);
}

export async function allotSubItem(subItemToAllot: SubItem, assignmentDetails: NonNullable<SubItem['assignedTo']>) {
  const { items, users } = await getData();
  
  const parentItem = items.find(item => item.subItems.some(si => si.id === subItemToAllot.id));
  if (!parentItem) return;

  const updatedSubItem: SubItem = {
    ...subItemToAllot,
    availabilityStatus: "In Use",
    assignedTo: assignmentDetails,
  };

  const existingUser = users.find(u => u.personId === assignmentDetails.personId);
  let newUsers = users;

  if (existingUser) {
    const updatedUser = {
      ...existingUser,
      name: assignmentDetails.name,
      phone: assignmentDetails.phone,
      department: assignmentDetails.department || existingUser.department,
    };
    newUsers = users.map(u => u.personId === updatedUser.personId ? updatedUser : u);
  } else {
    const newUser: User = {
      personId: assignmentDetails.personId,
      name: assignmentDetails.name,
      phone: assignmentDetails.phone,
      department: assignmentDetails.department,
      joiningDate: new Date().toISOString(),
    };
    newUsers = [...users, newUser];
  }

  const newItems = items.map(item => {
    if (item.id === parentItem.id) {
      return {
        ...item,
        subItems: item.subItems.map(si => si.id === subItemToAllot.id ? updatedSubItem : si)
      };
    }
    return item;
  });

  await saveItems(newItems);
  await saveUsers(newUsers);

  revalidatePath(`/item/${parentItem.id}`);
  revalidatePath('/users');
  revalidatePath(`/users/${assignmentDetails.personId}`);
}

export async function deleteSubItem(itemId: string, subItemId: string) {
    const { items } = await getData();
    const item = items.find(i => i.id === itemId);
    if (item) {
        const updatedSubItems = item.subItems.filter(si => si.id !== subItemId);
        await updateItem(itemId, { subItems: updatedSubItems, totalQuantity: updatedSubItems.length });
    }
    revalidatePath(`/item/${itemId}`);
}

export async function addItemToBill(itemId: string, billNumber: string, quantity: number) {
  const { items } = await getData();
  const item = items.find(i => i.id === itemId);
  if (item) {
    const newSubItems: SubItem[] = Array.from({ length: quantity }, () => ({
      id: generateUniqueSubItemId(items),
      billNumber: billNumber,
      availabilityStatus: 'Available',
    }));
    const updatedSubItems = [...item.subItems, ...newSubItems];
    await updateItem(itemId, { subItems: updatedSubItems, totalQuantity: updatedSubItems.length });
  }
  revalidatePath(`/bills/${billNumber}`);
  revalidatePath(`/item/${itemId}`);
}

export async function removeItemFromBill(itemId: string, billNumber: string) {
    const { items } = await getData();
    const item = items.find(i => i.id === itemId);
    if (item) {
        const subItemsToKeep = item.subItems.filter(si => si.billNumber !== billNumber);
        await updateItem(itemId, { subItems: subItemsToKeep, totalQuantity: subItemsToKeep.length });
    }
    revalidatePath(`/bills/${billNumber}`);
    revalidatePath(`/item/${itemId}`);
}


// --- Bill Actions ---
export async function updateBill(originalBillNumber: string, updatedBill: Bill) {
  const { bills, items } = await getData();
  const newBills = bills.map((b) => (b.billNumber === originalBillNumber ? updatedBill : b));
  let newItems = items;
  if (originalBillNumber !== updatedBill.billNumber) {
    newItems = items.map(item => ({
      ...item,
      subItems: item.subItems.map(si =>
        si.billNumber === originalBillNumber
          ? { ...si, billNumber: updatedBill.billNumber }
          : si
      ),
    }));
    await saveItems(newItems);
  }
  await saveBills(newBills);
  revalidatePath('/bills');
  revalidatePath(`/bills/${originalBillNumber}`);
  revalidatePath(`/bills/${updatedBill.billNumber}`);
}

// --- User Actions ---
export async function updateUser(updatedUser: User) {
  const { users, items } = await getData();
  const newUsers = users.map((u) => (u.personId === updatedUser.personId ? updatedUser : u));
  const newItems = items.map(item => ({
    ...item,
    subItems: item.subItems.map(si => {
      if (si.assignedTo?.personId === updatedUser.personId) {
        return {
          ...si,
          assignedTo: {
            ...si.assignedTo,
            name: updatedUser.name,
            phone: updatedUser.phone,
            department: updatedUser.department,
          }
        };
      }
      return si;
    }),
  }));
  await saveUsers(newUsers);
  await saveItems(newItems);
  revalidatePath('/users');
  revalidatePath(`/users/${updatedUser.personId}`);
}
