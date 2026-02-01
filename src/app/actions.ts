
'use server';

import { revalidatePath } from 'next/cache';
import { get, set, ref, remove } from 'firebase/database';
import { cookies } from 'next/headers';
import { auth, db } from '@/lib/firebase/config';
import type { Item, Bill, User, SubItem, AddUnitsData, NewItemData, ActionResponse, NewUserData, NewBillData, Notification, AssignmentDetails, Inventory, InventoryData, UserRole, CustomList, NewListData, BudgetList, BudgetItem, Note, Tax } from '@/types';


// Helper function to remove undefined values from objects, which RTDB doesn't support well.
function removeUndefinedValues(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedValues).filter(v => v !== undefined);
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

// Helper to convert Firebase object-with-numeric-keys to an array
function firebaseObjectToArray<T>(obj: any): T[] {
    if (!obj) return [];
    if (Array.isArray(obj)) return obj.filter(Boolean); // Filter out null/empty slots
    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj);
    }
    return [];
}


// --- Data Access Functions ---

async function getDbData(): Promise<InventoryData | null> {
    const snapshot = await get(ref(db));
    if (snapshot.exists()) {
        const data = snapshot.val();
         // Ensure passkeys exist
        let secure = data.secure || {};
        let secureUpdated = false;
        if (secure.appPasskey === undefined) {
            secure.appPasskey = '801711';
            secureUpdated = true;
        }
        if (secure.deletePasskey === undefined) {
            secure.deletePasskey = '801711';
            secureUpdated = true;
        }
        if (secure.authPasskey === undefined) {
            secure.authPasskey = '801711';
            secureUpdated = true;
        }

        if (secureUpdated) {
            await set(ref(db, `secure`), secure);
        }

        return {
            items: firebaseObjectToArray<Item>(data.items || []),
            bills: firebaseObjectToArray<Bill>(data.bills || []),
            users: firebaseObjectToArray<User>(data.users || []),
            notifications: firebaseObjectToArray<Notification>(data.notifications || []),
            lists: firebaseObjectToArray<CustomList>(data.lists || []),
            budgetLists: firebaseObjectToArray<BudgetList>(data.budgetLists || []),
            notes: firebaseObjectToArray<Note>(data.notes || []),
            taxes: firebaseObjectToArray<Tax>(data.taxes || []),
            secure: secure,
        };
    }
    return null;
}

async function saveData(data: Partial<InventoryData>) {
    await set(ref(db), removeUndefinedValues(data));
}


export async function getData(): Promise<InventoryData> {
    const data = await getDbData();
    if (!data) {
        // This case would mean the database is empty.
        // Returning an empty structure to prevent crashes on pages that call this.
        return { items: [], bills: [], users: [], notifications: [], lists: [], budgetLists: [], notes: [], taxes: [] };
    }
    return data;
}


// --- Passkey Actions ---
const DEFAULT_APP_PASSKEY = '801711';
const DEFAULT_DELETE_PASSKEY = '801711';
const DEFAULT_AUTH_PASSKEY = '801711';

// App Passkey
export async function getAppPasskey(): Promise<string> {
    const data = await getDbData();
    return data?.secure?.appPasskey || DEFAULT_APP_PASSKEY;
}

export async function verifyPasskey(passkeyAttempt: string, type: 'app' | 'delete' | 'auth'): Promise<boolean> {
  const data = await getDbData();
  const storedPasskey = data?.secure?.[`${type}Passkey`] || 
    (type === 'app' ? DEFAULT_APP_PASSKEY : type === 'delete' ? DEFAULT_DELETE_PASSKEY : DEFAULT_AUTH_PASSKEY);
  return passkeyAttempt === storedPasskey;
}

export async function verifyAppPasskey(passkey: string): Promise<boolean> {
  return verifyPasskey(passkey, 'app');
}

export async function verifyDeletePasskey(passkey: string): Promise<boolean> {
  return verifyPasskey(passkey, 'delete');
}

export async function verifyAuthPasskey(passkey: string): Promise<boolean> {
  return verifyPasskey(passkey, 'auth');
}

export async function updateAppPasskey(currentPasskey: string, newPasskey: string): Promise<ActionResponse> {
    try {
        const data = await getDbData();
        if (!data) return { success: false, message: "No active inventory." };
        const isCorrect = await verifyPasskey(currentPasskey, 'app');
        if (!isCorrect) {
            return { success: false, message: "The current app passkey is incorrect." };
        }
        if (newPasskey.length !== 6 || !/^\d{6}$/.test(newPasskey)) {
            return { success: false, message: "New passkey must be a 6-digit number." };
        }
        data.secure = { ...data.secure, appPasskey: newPasskey };
        await saveData(data);
        return { success: true };
    } catch (error) {
        console.error("Error updating app passkey:", error);
        return { success: false, message: "Failed to update app passkey." };
    }
}

// Delete Passkey
export async function getDeletePasskey(): Promise<string> {
    const data = await getDbData();
    return data?.secure?.deletePasskey || DEFAULT_DELETE_PASSKEY;
}

export async function updateDeletePasskey(currentPasskey: string, newPasskey: string): Promise<ActionResponse> {
    try {
        const data = await getDbData();
        if (!data) return { success: false, message: "No active inventory." };
        const isCorrect = await verifyPasskey(currentPasskey, 'delete');
        if (!isCorrect) {
            return { success: false, message: "The current delete passkey is incorrect." };
        }
        if (newPasskey.length !== 6 || !/^\d{6}$/.test(newPasskey)) {
            return { success: false, message: "New passkey must be a 6-digit number." };
        }
        data.secure = { ...data.secure, deletePasskey: newPasskey };
        await saveData(data);
        return { success: true };
    } catch (error) {
        console.error("Error updating delete passkey:", error);
        return { success: false, message: "Failed to update delete passkey." };
    }
}

// Auth Passkey
export async function getAuthPasskey(): Promise<string> {
    const data = await getDbData();
    return data?.secure?.authPasskey || DEFAULT_AUTH_PASSKEY;
}

export async function updateAuthPasskey(currentPasskey: string, newPasskey: string): Promise<ActionResponse> {
    try {
        const data = await getDbData();
        if (!data) return { success: false, message: "No active inventory." };
        const isCorrect = await verifyPasskey(currentPasskey, 'auth');
        if (!isCorrect) {
            return { success: false, message: "The current auth passkey is incorrect." };
        }
        if (newPasskey.length !== 6 || !/^\d{6}$/.test(newPasskey)) {
            return { success: false, message: "New passkey must be a 6-digit number." };
        }
        data.secure = { ...data.secure, authPasskey: newPasskey };
        await saveData(data);
        return { success: true };
    } catch (error) {
        console.error("Error updating auth passkey:", error);
        return { success: false, message: "Failed to update auth passkey." };
    }
}

// --- Item Actions ---
export async function addItem({ name, description }: NewItemData): Promise<ActionResponse> {
  try {
    const data = await getDbData() || { items: [], bills: [], users: [], notifications: [], lists: [] };

    const existingItem = data.items.find(item => item.name.toLowerCase() === name.toLowerCase());
    if (existingItem) {
      return { success: false, message: `An item named "${name}" already exists.` };
    }

    const newItemId = `item-${Date.now()}`;

    const completeNewItem: Item = {
      id: newItemId,
      name,
      description,
      subItems: [],
      totalQuantity: 0,
    };
    
    data.items.unshift(completeNewItem);
    await saveData(data);

    revalidatePath('/');
    revalidatePath(`/item/${newItemId}`);
    
    return { success: true };
  } catch (error) {
    console.error("Error adding item:", error);
    return { success: false, message: "Failed to save item." };
  }
}

export async function updateItem(itemId: string, updatedData: Partial<Omit<Item, 'id' | 'subItems' | 'totalQuantity'>>) {
  const data = await getDbData();
  if (!data) return;
  const itemIndex = data.items.findIndex(i => i.id === itemId);
  if (itemIndex === -1) return;
  
  data.items[itemIndex] = { ...data.items[itemIndex], ...updatedData };

  await saveData(data);
  revalidatePath('/');
  revalidatePath(`/item/${itemId}`);
}

export async function deleteItem(itemId: string) {
  const data = await getDbData();
  if (!data) return;

  data.items = data.items.filter((i) => i.id !== itemId);
  await saveData(data);
  revalidatePath('/');
}

// --- Sub-Item Actions ---
const getNextSubItemId = (allItems: Item[]): number => {
    let maxId = 0;
    allItems.forEach(item => {
        (item.subItems || []).forEach(subItem => {
            if (subItem.id) {
                const idAsNumber = parseInt(subItem.id, 10);
                if (!isNaN(idAsNumber) && idAsNumber > maxId) {
                    maxId = idAsNumber;
                }
            }
        });
    });
    return maxId + 1;
};

export async function addUnitsToItem(data: AddUnitsData) {
    const { itemId, quantity, billNumber, billDate, company, amount, lotName } = data;
    const appData = await getDbData() || { items: [], bills: [], users: [], notifications: [], lists: [] };

    const itemIndex = appData.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;

    const itemToUpdate = appData.items[itemIndex];
    if (!itemToUpdate.subItems) itemToUpdate.subItems = [];

    let nextId = getNextSubItemId(appData.items);
    for (let i = 0; i < quantity; i++) {
        itemToUpdate.subItems.push({
            id: String(nextId).padStart(6, '0'),
            billNumber: billNumber,
            availabilityStatus: 'Available',
            lotName,
            transactionLog: [{ type: 'created', date: new Date().toISOString() }]
        });
        nextId++;
    }
    itemToUpdate.totalQuantity = itemToUpdate.subItems.length;
    
    const existingBillIndex = appData.bills.findIndex(b => b.billNumber === billNumber);
    if (existingBillIndex > -1) {
      const existingBill = appData.bills[existingBillIndex];
      existingBill.company = company;
      existingBill.billDate = billDate;
      if (amount !== undefined) existingBill.amount = amount;
    } else {
        appData.bills.unshift({ billNumber, billDate, company, amount });
    }

    await saveData(appData);
    revalidatePath(`/item/${itemId}`);
    revalidatePath('/bills');
    revalidatePath(`/bills/${billNumber}`);
}

export async function allotSubItem(subItemToAllot: SubItem, assignmentDetails: NonNullable<SubItem['assignedTo']>) {
  const data = await getDbData();
  if (!data) return;
  
  const parentItemIndex = data.items.findIndex(item => (item.subItems || []).some(si => si.id === subItemToAllot.id));
  if (parentItemIndex === -1) return;

  const subItemIndex = data.items[parentItemIndex].subItems.findIndex(si => si.id === subItemToAllot.id);
  if (subItemIndex === -1) return;
  
  data.items[parentItemIndex].subItems[subItemIndex] = {
    ...subItemToAllot,
    availabilityStatus: "In Use",
    assignedTo: assignmentDetails,
  };

  const userIndex = data.users.findIndex(u => u.personId === assignmentDetails.personId);
  if (userIndex > -1) {
    data.users[userIndex].name = assignmentDetails.name;
    data.users[userIndex].phone = assignmentDetails.phone;
    data.users[userIndex].department = assignmentDetails.department || data.users[userIndex].department;
    data.users[userIndex].section = assignmentDetails.section || data.users[userIndex].section;
  } else {
    data.users.push({
      personId: assignmentDetails.personId,
      name: assignmentDetails.name,
      email: assignmentDetails.email,
      phone: assignmentDetails.phone,
      department: assignmentDetails.department,
      section: assignmentDetails.section,
      joiningDate: new Date().toISOString(),
      role: 'D',
    });
  }

  await saveData(data);
  revalidatePath(`/item/${data.items[parentItemIndex].id}`);
  revalidatePath('/users');
  revalidatePath(`/users/${assignmentDetails.personId}`);
}

export async function deleteSubItem(itemId: string, subItemId: string) {
    const data = await getDbData();
    if (!data) return;
    const itemIndex = data.items.findIndex(i => i.id === itemId);
    if (itemIndex > -1) {
        const updatedSubItems = (data.items[itemIndex].subItems || []).filter(si => si.id !== subItemId);
        data.items[itemIndex].subItems = updatedSubItems;
        data.items[itemIndex].totalQuantity = updatedSubItems.length;
        await saveData(data);
    }
    revalidatePath(`/item/${itemId}`);
}

export async function deleteLot(itemId: string, lotName: string) {
    const data = await getDbData();
    if (!data) return;
    const itemIndex = data.items.findIndex(i => i.id === itemId);
    if (itemIndex > -1) {
        const subItemsToKeep = (data.items[itemIndex].subItems || []).filter(si => si.lotName !== lotName);
        data.items[itemIndex].subItems = subItemsToKeep;
        data.items[itemIndex].totalQuantity = subItemsToKeep.length;
        await saveData(data);
    }
    revalidatePath(`/item/${itemId}`);
}


export async function addItemToBill(itemId: string, billNumber: string, quantity: number) {
  const data = await getDbData();
  if (!data) return;
  const itemIndex = data.items.findIndex(i => i.id === itemId);
  let nextId = getNextSubItemId(data.items);

  if (itemIndex > -1) {
    const item = data.items[itemIndex];
    if (!item.subItems) item.subItems = [];
    for (let i = 0; i < quantity; i++) {
        item.subItems.push({
            id: String(nextId).padStart(6, '0'),
            billNumber: billNumber,
            availabilityStatus: 'Available',
            lotName: billNumber,
            transactionLog: [{ type: 'created', date: new Date().toISOString() }]
        });
        nextId++;
    }
    item.totalQuantity = item.subItems.length;
    await saveData(data);
  }
  revalidatePath(`/bills/${billNumber}`);
  revalidatePath(`/item/${itemId}`);
}

export async function removeItemFromBill(itemId: string, billNumber: string) {
    const data = await getDbData();
    if (!data) return;
    const itemIndex = data.items.findIndex(i => i.id === itemId);
    if (itemIndex > -1) {
        const item = data.items[itemIndex];
        item.subItems = (item.subItems || []).filter(si => si.billNumber !== billNumber);
        item.totalQuantity = item.subItems.length;
        await saveData(data);
    }
    revalidatePath(`/bills/${billNumber}`);
    revalidatePath(`/item/${itemId}`);
}


// --- Bill Actions ---
export async function addBill(billData: NewBillData): Promise<ActionResponse> {
  try {
    const data = await getDbData() || { items: [], bills: [], users: [], notifications: [], lists: [] };

    if (data.bills.some(b => b.billNumber === billData.billNumber)) {
      return { success: false, message: `Bill with number "${billData.billNumber}" already exists.` };
    }

    data.bills.unshift({
      billNumber: billData.billNumber,
      company: billData.company,
      billDate: billData.billDate,
      amount: billData.amount,
    });

    let nextId = getNextSubItemId(data.items);
    for (const billItem of billData.items) {
      let itemIndex = data.items.findIndex(i => i.id === billItem.id);
      if (itemIndex === -1 && billItem.isNew) {
        data.items.unshift({
          id: billItem.id, name: billItem.name, description: `Added with bill ${billData.billNumber}`,
          subItems: [], totalQuantity: 0,
        });
        itemIndex = 0;
      }
      if (itemIndex === -1) continue;
      
      const itemToUpdate = data.items[itemIndex];
      if (!itemToUpdate.subItems) itemToUpdate.subItems = [];
      for (let i = 0; i < billItem.quantity; i++) {
        itemToUpdate.subItems.push({
          id: String(nextId).padStart(6, '0'), billNumber: billData.billNumber,
          availabilityStatus: 'Available' as const, lotName: billData.billNumber,
          transactionLog: [{ type: 'created', date: new Date().toISOString() }]
        }); 
        nextId++;
      }
      itemToUpdate.totalQuantity = itemToUpdate.subItems.length;
      revalidatePath(`/item/${itemToUpdate.id}`);
    }

    await saveData(data);
    revalidatePath('/bills');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("Error adding bill:", error);
    return { success: false, message: "Failed to save bill." };
  }
}

export async function updateBill(originalBillNumber: string, updatedBill: Bill): Promise<ActionResponse> {
  const data = await getDbData();
  if (!data) return { success: false, message: "Database not found." };
  
  if (originalBillNumber !== updatedBill.billNumber && data.bills.some(b => b.billNumber === updatedBill.billNumber)) {
    return { success: false, message: `A bill with number "${updatedBill.billNumber}" already exists.` };
  }

  const billIndex = data.bills.findIndex((b) => b.billNumber === originalBillNumber);
  if (billIndex > -1) data.bills[billIndex] = updatedBill;
  
  if (originalBillNumber !== updatedBill.billNumber) {
    data.items.forEach(item => {
      (item.subItems || []).forEach(si => {
        if (si.billNumber === originalBillNumber) si.billNumber = updatedBill.billNumber;
        if (si.lotName === originalBillNumber) si.lotName = updatedBill.billNumber;
      });
    });
  }
  await saveData(data);
  revalidatePath('/bills');
  revalidatePath(`/bills/${originalBillNumber}`);
  if (originalBillNumber !== updatedBill.billNumber) {
    revalidatePath(`/bills/${encodeURIComponent(updatedBill.billNumber)}`);
  }
  return { success: true };
}

export async function deleteBill(billNumber: string): Promise<ActionResponse> {
  try {
    const data = await getDbData();
    if (!data) return { success: false, message: "No inventory data found." };

    data.bills = data.bills.filter(b => b.billNumber !== billNumber);
    data.items.forEach(item => {
        item.subItems = (item.subItems || []).filter(si => si.billNumber !== billNumber);
        item.totalQuantity = item.subItems.length;
        revalidatePath(`/item/${item.id}`);
    });

    await saveData(data);
    revalidatePath('/bills');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("Error deleting bill:", error);
    return { success: false, message: "Failed to delete bill." };
  }
}


// --- User Actions ---

export async function addUserAsAdmin(userData: NewUserData): Promise<ActionResponse> {
  try {
    const data = await getDbData() || { items: [], bills: [], users: [], notifications: [], lists: [] };
    
    // Check for uniqueness
    if (data.users.some(u => u.personId.toLowerCase() === userData.personId.toLowerCase())) return { success: false, message: `User with ID "${userData.personId}" already exists.` };
    if (data.users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) return { success: false, message: `User with email "${userData.email}" already exists.` };
    if (data.users.some(u => u.phone === userData.phone)) return { success: false, message: `User with phone "${userData.phone}" already exists.` };

    const newUser: User = {
      ...userData,
      joiningDate: new Date().toISOString(),
      role: 'D', // Defaults to lowest access level
    };

    data.users.unshift(newUser);
    await saveData(data);
    
    revalidatePath('/users');
    return { success: true, message: `User ${userData.name} added successfully.` };
  } catch (error: any) {
    console.error("Error adding user as admin:", error);
    return { success: false, message: error.message || "Failed to add user." };
  }
}

export async function requestNewUserRegistration(userData: NewUserData): Promise<ActionResponse> {
  try {
    const data = await getDbData() || { items: [], bills: [], users: [], notifications: [], lists: [] };

    // Check for uniqueness in existing users
    if (data.users.some(user => user.personId.toLowerCase() === userData.personId.toLowerCase())) {
      return { success: false, message: `A user with ID "${userData.personId}" already exists.` };
    }
    if (data.users.some(user => user.email.toLowerCase() === userData.email.toLowerCase())) {
       return { success: false, message: `A user with email "${userData.email}" already exists.` };
    }
    if (data.users.some(user => user.phone === userData.phone)) {
        return { success: false, message: `A user with phone number "${userData.phone}" already exists.` };
    }
    
    // Check for uniqueness in pending notifications
    if (data.notifications.some(n => n.type === 'register' && n.requestedData?.newUser?.personId.toLowerCase() === userData.personId.toLowerCase())) {
      return { success: false, message: `A registration request for user ID "${userData.personId}" already exists.` };
    }
    if (data.notifications.some(n => n.type === 'register' && n.requestedData?.newUser?.email.toLowerCase() === userData.email.toLowerCase())) {
      return { success: false, message: `A registration request for email "${userData.email}" already exists.` };
    }
    if (data.notifications.some(n => n.type === 'register' && n.requestedData?.newUser?.phone === userData.phone)) {
      return { success: false, message: `A registration request for phone number "${userData.phone}" already exists.` };
    }

    const newNotification: Notification = {
        id: `notif-reg-${Date.now()}`,
        type: 'register',
        status: 'pending',
        createdAt: new Date().toISOString(),
        requestedData: { newUser: userData }
    };

    data.notifications.unshift(newNotification);
    await saveData(data);
    revalidatePath('/notifications');
    
    return { success: true, message: "Registration request submitted successfully. Please wait for an admin to approve your account." };
  } catch (error) {
    console.error("Error requesting user registration:", error);
    return { success: false, message: "Failed to submit registration request." };
  }
}

export async function updateUser(originalPersonId: string, updatedUser: User): Promise<ActionResponse> {
  const data = await getDbData();
  if (!data) return { success: false, message: "Database not found." };

  const userIndex = data.users.findIndex((u) => u.personId === originalPersonId);
  if (userIndex === -1) return { success: false, message: "User not found." };
  
  // Check for uniqueness if fields were changed
  if (data.users.some(u => u.personId.toLowerCase() === updatedUser.personId.toLowerCase() && u.personId !== originalPersonId)) {
    return { success: false, message: `Another user with ID "${updatedUser.personId}" already exists.` };
  }
  if (data.users.some(u => u.email.toLowerCase() === updatedUser.email.toLowerCase() && u.personId !== originalPersonId)) {
    return { success: false, message: `Another user with email "${updatedUser.email}" already exists.` };
  }
  if (data.users.some(u => u.phone === updatedUser.phone && u.personId !== originalPersonId)) {
    return { success: false, message: `Another user with phone number "${updatedUser.phone}" already exists.` };
  }
  
  data.users[userIndex] = { ...updatedUser, role: updatedUser.role || data.users[userIndex].role };
  
  // If Person ID changed, update assignments
  if (originalPersonId !== updatedUser.personId) {
    data.items.forEach(item => {
      (item.subItems || []).forEach(si => {
        if (si.assignedTo?.personId === originalPersonId) si.assignedTo.personId = updatedUser.personId;
      });
    });
  }

  // Update details in assignments for the updated user
  data.items.forEach(item => {
    (item.subItems || []).forEach(si => {
      if (si.assignedTo?.personId === updatedUser.personId) {
        si.assignedTo.name = updatedUser.name;
        si.assignedTo.phone = updatedUser.phone;
        si.assignedTo.email = updatedUser.email;
        si.assignedTo.department = updatedUser.department;
        si.assignedTo.section = updatedUser.section;
      }
    });
  });

  await saveData(data);
  revalidatePath('/users');
  revalidatePath(`/users/${originalPersonId}`);
  if (originalPersonId !== updatedUser.personId) {
    revalidatePath(`/users/${updatedUser.personId}`);
  }
  return { success: true };
}

export async function deleteUser(personId: string): Promise<ActionResponse> {
  try {
    const data = await getDbData();
    if (!data) return { success: false, message: "No inventory data found." };

    data.items.forEach(item => {
      (item.subItems || []).forEach(subItem => {
        if (subItem.assignedTo?.personId === personId) {
            const assignmentToEnd = subItem.assignedTo;
            if (assignmentToEnd) {
                if (!subItem.transactionLog) subItem.transactionLog = [];
                subItem.transactionLog.unshift({ type: 'unallotted', date: new Date().toISOString(), assignment: assignmentToEnd });
            }
            subItem.availabilityStatus = 'Available';
            subItem.assignedTo = undefined;
        }
      });
    });

    data.users = data.users.filter(u => u.personId !== personId);

    await saveData(data);
    revalidatePath('/users');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, message: "Failed to delete user from the database." };
  }
}

// --- Notification / Approval Actions ---
async function createNotification(data: InventoryData, type: Notification['type'], item: Item, subItemId: string, requestedData?: Notification['requestedData']): Promise<ActionResponse> {
    const newNotification: Notification = {
        id: `notif-${Date.now()}`, type, status: 'pending',
        createdAt: new Date().toISOString(), itemId: item.id,
        subItemId: subItemId, itemName: item.name, requestedData,
    };
    data.notifications.unshift(newNotification);
    await saveData(data);
    revalidatePath('/notifications');
    return { success: true, message: `Request to ${type} unit has been submitted for approval.` };
}

export async function requestAllotment(itemId: string, subItemId: string, assignmentDetails: AssignmentDetails): Promise<ActionResponse> {
    const data = await getDbData();
    if (!data) return { success: false, message: "No inventory data found." };
    const item = data.items.find(i => i.id === itemId);
    if (!item) return { success: false, message: 'Item not found.' };

    return createNotification(data, 'allot', item, subItemId, { assignmentDetails });
}

export async function requestStatusChange(itemId: string, subItemId: string, type: 'unallot' | 'discard' | 'restore', requester?: User): Promise<ActionResponse> {
    const data = await getDbData();
    if (!data) return { success: false, message: "No inventory data found." };
    const item = data.items.find(i => i.id === itemId);
    if (!item) return { success: false, message: 'Item not found.' };

    let requestedData: Notification['requestedData'] | undefined = { requester };
    if (type === 'unallot') {
        const subItem = (item.subItems || []).find(si => si.id === subItemId);
        if (subItem?.assignedTo) {
            requestedData.assignmentDetails = subItem.assignedTo;
        }
    }
    return createNotification(data, type, item, subItemId, requestedData);
}

export async function handleNotificationAction(notificationId: string, action: 'approve' | 'reject'): Promise<ActionResponse> {
    const data = await getDbData();
    if (!data) return { success: false, message: "No inventory data found." };
    const notifIndex = data.notifications.findIndex(n => n.id === notificationId);
    if (notifIndex === -1) return { success: false, message: 'Notification not found.' };

    const notification = data.notifications[notifIndex];
    if (notification.status !== 'pending') {
        data.notifications.splice(notifIndex, 1);
        await saveData(data);
        revalidatePath('/notifications');
        return { success: false, message: 'This request has already been handled.' };
    }

    notification.handledAt = new Date().toISOString();

    if (action === 'approve') {
        let approvalSuccess = true;
        let rejectionReason: string | undefined = undefined;

        // Clear any previous rejection reason before re-evaluating
        notification.rejectionReason = undefined;

        const actor = notification.requestedData?.requester;
        if (notification.type === 'register') {
            const userData = notification.requestedData?.newUser;
            if (!userData) {
                approvalSuccess = false;
                rejectionReason = `User data is missing from the request.`;
            } else {
                 const newUser: User = {
                    ...userData,
                    joiningDate: new Date().toISOString(),
                    role: data.users.length === 0 ? 'C' : 'D',
                };
                data.users.unshift(newUser);
            }
        } else {
            const itemIndex = data.items.findIndex(i => i.id === notification.itemId);
            if (itemIndex === -1) {
                approvalSuccess = false;
                rejectionReason = `Item with ID ${notification.itemId} no longer exists.`;
            } else {
                const subItemIndex = data.items[itemIndex].subItems.findIndex(si => si.id === notification.subItemId);
                if (subItemIndex === -1) {
                    approvalSuccess = false;
                    rejectionReason = `Sub-item with ID ${notification.subItemId} no longer exists.`;
                } else {
                    const subItem = data.items[itemIndex].subItems[subItemIndex];
                    if (!subItem.transactionLog) subItem.transactionLog = [];
                    switch (notification.type) {
                        case 'allot':
                            if (subItem.availabilityStatus !== 'Available') {
                                approvalSuccess = false;
                                rejectionReason = `Unit is no longer available.`;
                            } else if (notification.requestedData?.assignmentDetails) {
                                subItem.availabilityStatus = 'In Use';
                                subItem.assignedTo = notification.requestedData.assignmentDetails;
                                subItem.transactionLog.unshift({ type: 'approve', date: new Date().toISOString(), assignment: notification.requestedData.assignmentDetails, actor });

                                const userDetails = notification.requestedData.assignmentDetails;
                                const userExists = data.users.some(u => u.personId === userDetails.personId);
                                if (!userExists) {
                                    data.users.unshift({
                                        personId: userDetails.personId,
                                        name: userDetails.name,
                                        email: userDetails.email,
                                        phone: userDetails.phone,
                                        department: userDetails.department,
                                        section: userDetails.section,
                                        joiningDate: new Date().toISOString(),
                                        role: 'D',
                                    });
                                }
                            } else {
                                approvalSuccess = false;
                                rejectionReason = 'Assignment details are missing from the request.';
                            }
                            break;
                        case 'unallot':
                            if (subItem.availabilityStatus !== 'In Use' || !subItem.assignedTo) {
                                approvalSuccess = false;
                                rejectionReason = `Unit is not 'In Use'.`;
                            } else {
                                const assignmentToEnd = subItem.assignedTo;
                                if (!subItem.transactionLog) subItem.transactionLog = [];
                                subItem.transactionLog.unshift({ type: 'unallotted', date: new Date().toISOString(), assignment: assignmentToEnd, actor });
                                subItem.availabilityStatus = 'Available';
                                subItem.assignedTo = undefined;
                            }
                            break;
                        case 'discard':
                            subItem.availabilityStatus = 'Discarded';
                            subItem.discardedDate = new Date().toISOString();
                            subItem.assignedTo = undefined;
                             subItem.transactionLog.unshift({ type: 'discarded', date: new Date().toISOString(), actor });
                            break;
                        case 'restore':
                            subItem.availabilityStatus = 'Available';
                            subItem.discardedDate = undefined;
                            subItem.transactionLog.unshift({ type: 'restored', date: new Date().toISOString(), actor });
                            break;
                    }
                }
            }
        }
        
        if (approvalSuccess) {
            notification.status = 'approve';
        } else {
            notification.status = 'rejected';
            notification.rejectionReason = rejectionReason;
        }

    } else { // action === 'reject'
        notification.status = 'rejected';
    }

    await saveData(data);
    revalidatePath('/notifications');
    revalidatePath(`/item/${notification.itemId}`);
    revalidatePath('/users');

    return { success: true, message: `Request has been ${notification.status === 'approve' ? 'approved' : 'rejected'}.` };
}

export async function deleteNotificationsByDateRange(fromDate: string, toDate: string): Promise<ActionResponse> {
    try {
        const data = await getDbData();
        if (!data) return { success: false, message: "No inventory data found." };

        const from = new Date(fromDate);
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999); // Make 'to' date inclusive

        const notificationsToKeep = data.notifications.filter(n => {
            const createdAt = new Date(n.createdAt);
            // Keep if outside the date range OR if it's a pending request
            const isWithinRange = createdAt >= from && createdAt <= to;
            return !isWithinRange || n.status === 'pending';
        });
        
        const deletedCount = data.notifications.length - notificationsToKeep.length;

        if (deletedCount === 0) {
            return { success: true, message: "No handled notifications found in the selected date range to delete." };
        }

        data.notifications = notificationsToKeep;
        await saveData(data);

        revalidatePath('/notifications');
        return { success: true, message: `Successfully deleted ${deletedCount} handled notification(s).` };

    } catch (error) {
        console.error("Error deleting notifications:", error);
        return { success: false, message: "Failed to delete notifications." };
    }
}

// --- List Actions (Old) ---
export async function addList(listData: NewListData): Promise<ActionResponse> {
  try {
    const data = await getDbData() || { items: [], bills: [], users: [], notifications: [], lists: [] };

    if (data.lists.some(l => l.name.toLowerCase() === listData.name.toLowerCase())) {
      return { success: false, message: `A list with the name "${listData.name}" already exists.` };
    }

    const newList: CustomList = {
      id: `list-${Date.now()}`,
      ...listData,
      itemIds: [],
      createdAt: new Date().toISOString(),
    };

    data.lists.unshift(newList);
    await saveData(data);

    revalidatePath('/lists');
    return { success: true };
  } catch (error) {
    console.error("Error adding list:", error);
    return { success: false, message: "Failed to save list." };
  }
}

export async function updateList(listId: string, updatedData: Partial<NewListData>): Promise<ActionResponse> {
  try {
    const data = await getDbData();
    if (!data) return { success: false, message: "Database not found." };

    const listIndex = data.lists.findIndex(l => l.id === listId);
    if (listIndex === -1) return { success: false, message: "List not found." };

    // Check for name conflict if name is being changed
    if (updatedData.name && data.lists.some(l => l.name.toLowerCase() === updatedData.name?.toLowerCase() && l.id !== listId)) {
        return { success: false, message: `A list with the name "${updatedData.name}" already exists.` };
    }

    data.lists[listIndex] = { ...data.lists[listIndex], ...updatedData };
    await saveData(data);

    revalidatePath('/lists');
    revalidatePath(`/lists/${listId}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating list:", error);
    return { success: false, message: "Failed to update list." };
  }
}

export async function deleteList(listId: string): Promise<ActionResponse> {
  try {
    const data = await getDbData();
    if (!data) return { success: false, message: "No inventory data found." };

    data.lists = data.lists.filter(l => l.id !== listId);
    await saveData(data);

    revalidatePath('/lists');
    return { success: true };
  } catch (error) {
    console.error("Error deleting list:", error);
    return { success: false, message: "Failed to delete list." };
  }
}

// --- Notes Actions ---
export async function saveNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>, id?: string): Promise<ActionResponse> {
    try {
        const data = await getDbData() || { items: [], bills: [], users: [], notifications: [], lists: [], notes: [] };
        if (!data.notes) data.notes = [];

        const now = new Date().toISOString();

        if (id) { // Update existing note
            const noteIndex = data.notes.findIndex(n => n.id === id);
            if (noteIndex > -1) {
                data.notes[noteIndex] = { ...data.notes[noteIndex], ...note, updatedAt: now };
            } else {
                return { success: false, message: "Note not found for updating." };
            }
        } else { // Create new note
            const newNote: Note = {
                id: `note-${Date.now()}`,
                ...note,
                createdAt: now,
                updatedAt: now,
            };
            data.notes.unshift(newNote);
        }

        await saveData(data);
        revalidatePath('/lists');
        return { success: true };
    } catch (error) {
        console.error("Error saving note:", error);
        return { success: false, message: "Failed to save note." };
    }
}

export async function deleteNote(id: string): Promise<ActionResponse> {
    try {
        const data = await getDbData();
        if (!data || !data.notes) return { success: false, message: "No notes found." };
        data.notes = data.notes.filter(n => n.id !== id);
        await saveData(data);
        revalidatePath('/lists');
        return { success: true };
    } catch (error) {
        console.error("Error deleting note:", error);
        return { success: false, message: "Failed to delete note." };
    }
}

// --- Taxes Actions ---
export async function saveTax(tax: Omit<Tax, 'id'>, id?: string): Promise<ActionResponse> {
    try {
        const data = await getDbData() || { items: [], bills: [], users: [], notifications: [], lists: [], taxes: [] };
        if (!data.taxes) data.taxes = [];
        
        if (id) { // Update
            const taxIndex = data.taxes.findIndex(t => t.id === id);
            if (taxIndex > -1) {
                data.taxes[taxIndex] = { ...data.taxes[taxIndex], ...tax };
            } else {
                return { success: false, message: "Tax not found." };
            }
        } else { // Create
             if (data.taxes.some(t => t.name.toLowerCase() === tax.name.toLowerCase())) {
                return { success: false, message: `A tax with the name "${tax.name}" already exists.` };
            }
            const newTax: Tax = { id: `tax-${Date.now()}`, ...tax };
            data.taxes.unshift(newTax);
        }
        await saveData(data);
        revalidatePath('/lists');
        return { success: true };
    } catch (error) {
        console.error("Error saving tax:", error);
        return { success: false, message: "Failed to save tax." };
    }
}

export async function deleteTax(id: string): Promise<ActionResponse> {
    try {
        const data = await getDbData();
        if (!data || !data.taxes) return { success: false, message: "No taxes found." };
        data.taxes = data.taxes.filter(t => t.id !== id);
        await saveData(data);
        revalidatePath('/lists');
        return { success: true };
    } catch (error) {
        console.error("Error deleting tax:", error);
        return { success: false, message: "Failed to delete tax." };
    }
}

// --- Budget List Actions ---
export async function saveBudgetList(list: Omit<BudgetList, 'id' | 'createdAt' | 'updatedAt' | 'items'>, id?: string): Promise<ActionResponse> {
    try {
        const data = await getDbData() || { items: [], bills: [], users: [], notifications: [], lists: [], budgetLists: [] };
        if (!data.budgetLists) data.budgetLists = [];
        
        const now = new Date().toISOString();

        if (id) { // Update
            const listIndex = data.budgetLists.findIndex(l => l.id === id);
            if (listIndex > -1) {
                 if (data.budgetLists.some(l => l.name.toLowerCase() === list.name.toLowerCase() && l.id !== id)) {
                    return { success: false, message: `A budget list with the name "${list.name}" already exists.` };
                }
                data.budgetLists[listIndex] = { ...data.budgetLists[listIndex], ...list, updatedAt: now };
            } else {
                return { success: false, message: "Budget list not found." };
            }
        } else { // Create
            if (data.budgetLists.some(l => l.name.toLowerCase() === list.name.toLowerCase())) {
                return { success: false, message: `A budget list with the name "${list.name}" already exists.` };
            }
            const newList: BudgetList = { id: `blist-${Date.now()}`, ...list, items: [], createdAt: now, updatedAt: now };
            data.budgetLists.unshift(newList);
        }

        await saveData(data);
        revalidatePath('/lists');
        return { success: true };
    } catch (error) {
        console.error("Error saving budget list:", error);
        return { success: false, message: "Failed to save budget list." };
    }
}

export async function deleteBudgetList(id: string): Promise<ActionResponse> {
    try {
        const data = await getDbData();
        if (!data || !data.budgetLists) return { success: false, message: "No budget lists found." };
        data.budgetLists = data.budgetLists.filter(l => l.id !== id);
        await saveData(data);
        revalidatePath('/lists');
        return { success: true };
    } catch (error) {
        console.error("Error deleting budget list:", error);
        return { success: false, message: "Failed to delete budget list." };
    }
}

export async function saveBudgetItem(listId: string, item: Omit<BudgetItem, 'id'>, itemId?: string): Promise<ActionResponse> {
    try {
        const data = await getDbData();
        if (!data || !data.budgetLists) return { success: false, message: "No budget lists found." };

        const listIndex = data.budgetLists.findIndex(l => l.id === listId);
        if (listIndex === -1) return { success: false, message: "Budget list not found." };
        
        const list = data.budgetLists[listIndex];
        if (!list.items) list.items = [];

        if (itemId) { // Update
            const itemIndex = list.items.findIndex(i => i.id === itemId);
            if (itemIndex > -1) {
                list.items[itemIndex] = { ...list.items[itemIndex], ...item };
            } else {
                return { success: false, message: "Budget item not found." };
            }
        } else { // Create
            const newItem: BudgetItem = { id: `bitem-${Date.now()}`, ...item };
            list.items.push(newItem);
        }
        
        list.updatedAt = new Date().toISOString();
        await saveData(data);
        revalidatePath('/lists');
        return { success: true };
    } catch (error) {
        console.error("Error saving budget item:", error);
        return { success: false, message: "Failed to save budget item." };
    }
}

export async function deleteBudgetItem(listId: string, itemId: string): Promise<ActionResponse> {
    try {
        const data = await getDbData();
        if (!data || !data.budgetLists) return { success: false, message: "No budget lists found." };

        const listIndex = data.budgetLists.findIndex(l => l.id === listId);
        if (listIndex === -1) return { success: false, message: "Budget list not found." };

        const list = data.budgetLists[listIndex];
        list.items = (list.items || []).filter(i => i.id !== itemId);
        list.updatedAt = new Date().toISOString();

        await saveData(data);
        revalidatePath('/lists');
        return { success: true };
    } catch (error) {
        console.error("Error deleting budget item:", error);
        return { success: false, message: "Failed to delete budget item." };
    }
}

export async function setBudgetListTax(listId: string, taxId: string | null): Promise<ActionResponse> {
    try {
        const data = await getDbData();
        if (!data || !data.budgetLists) return { success: false, message: "No budget lists found." };

        const listIndex = data.budgetLists.findIndex(l => l.id === listId);
        if (listIndex === -1) return { success: false, message: "Budget list not found." };

        data.budgetLists[listIndex].taxId = taxId === null ? undefined : taxId;
        data.budgetLists[listIndex].updatedAt = new Date().toISOString();
        
        await saveData(data);
        revalidatePath('/lists');
        return { success: true };
    } catch (error) {
        console.error("Error setting tax on budget list:", error);
        return { success: false, message: "Failed to set tax on budget list." };
    }
}
