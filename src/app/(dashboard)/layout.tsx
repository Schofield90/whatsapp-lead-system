import { requireOrganization } from '@/lib/auth';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userProfile = await requireOrganization();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar userProfile={userProfile} />
        <div className="flex-1">
          <Header userProfile={userProfile} />
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}