
import { getData } from "@/app/actions";
import { UsersView } from "@/app/users/users-view";

export default async function UsersPage() {
  const { users, items } = await getData();

  return (
    <div className="container mx-auto p-4 md:p-8">
      <UsersView users={users} items={items} />
    </div>
  );
}
