
import { getData } from '@/app/actions';
import { notFound } from 'next/navigation';
import { BillDetailView } from './bill-detail-view';


export default async function BillDetailPage({ params }: { params: { billNumber: string } }) {
    const { bills, items } = await getData();
    const bill = bills.find(b => b.billNumber === decodeURIComponent(params.billNumber));

    if (!bill) {
        notFound();
    }

    return <BillDetailView bill={bill} items={items} />;
}
