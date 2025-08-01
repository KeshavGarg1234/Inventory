
import { getData } from '@/app/actions';
import { notFound } from 'next/navigation';
import { UserDetailView } from './user-detail-view';


export default async function UserDetailPage({ params }: { params: { userId: string } }) {
    const { users, items } = await getData();
    const user = users.find(u => u.personId === decodeURIComponent(params.userId));
    
    if (!user) {
        notFound();
    }

    return <UserDetailView user={user} items={items} />;
}
