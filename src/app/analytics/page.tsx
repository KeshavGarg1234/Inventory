import { AnalyticsView } from './analytics-view';
import AuthenticatedLayout from "@/components/authenticated-layout";

export default function AnalyticsPage() {
    return (
        <AuthenticatedLayout>
            <div className="container mx-auto p-4 md:p-8">
                <AnalyticsView />
            </div>
        </AuthenticatedLayout>
    );
}
