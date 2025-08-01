
import { getData } from "@/app/actions";
import { BillsView } from "@/app/bills/bills-view";

export default async function BillsPage({
  searchParams,
}: {
  searchParams: { q: string };
}) {
  const { bills, items } = await getData();
  const initialSearch = searchParams.q || "";

  return (
    <div className="container mx-auto p-4 md:p-8">
      <BillsView bills={bills} items={items} initialSearch={initialSearch} />
    </div>
  );
}
