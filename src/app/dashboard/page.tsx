
import { getData } from "@/app/actions";
import { DashboardView } from "./dashboard-view";

export default async function DashboardPage() {
    const { items, bills, users } = await getData();

    return <DashboardView items={items} bills={bills} users={users} />;
}
