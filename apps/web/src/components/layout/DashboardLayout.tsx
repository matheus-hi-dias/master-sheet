import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-bg-app flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 lg:pl-[220px] pb-16 lg:pb-0">
        {/* The Outlet renders the child routes (e.g. Dashboard, TemplatesHub) */}
        <main className="w-full h-full relative">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
