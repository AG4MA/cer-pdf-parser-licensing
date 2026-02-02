import Link from 'next/link';
import { 
  LayoutDashboard, 
  AppWindow, 
  MessageSquare, 
  Download, 
  LogOut,
  Settings
} from 'lucide-react';
import { logout } from '@/lib/auth';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/apps', label: 'Applicazioni', icon: AppWindow },
  { href: '/admin/feedback', label: 'Feedback', icon: MessageSquare },
  { href: '/admin/downloads', label: 'Downloads', icon: Download },
  { href: '/admin/settings', label: 'Impostazioni', icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold">App Manager</h1>
        <p className="text-sm text-gray-400 mt-1">Gestione applicazioni</p>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-800">
        <form action={async () => {
          'use server';
          await logout();
        }}>
          <button
            type="submit"
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Esci
          </button>
        </form>
      </div>
    </aside>
  );
}
