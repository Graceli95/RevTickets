'use client';

import { Sidebar as FlowbiteSidebar } from 'flowbite-react';
import { 
  LayoutDashboard, 
  Ticket, 
  FolderOpen, 
  BookOpen,
  Settings,
  Users,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Sidebar() {
  const pathname = usePathname();

  const sidebarItems = [
    {
      href: '/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
    },
    {
      href: '/tickets',
      icon: Ticket,
      label: 'Tickets',
    },
    {
      href: '/categories',
      icon: FolderOpen,
      label: 'Categories',
    },
    {
      href: '/knowledge-base',
      icon: BookOpen,
      label: 'Knowledge Base',
    },
    {
      href: '/users',
      icon: Users,
      label: 'Users',
    },
    {
      href: '/analytics',
      icon: BarChart3,
      label: 'Analytics',
    },
    {
      href: '/settings',
      icon: Settings,
      label: 'Settings',
    },
  ];

  return (
    <FlowbiteSidebar className="fixed top-0 left-0 z-20 flex h-full w-64 flex-shrink-0 flex-col pt-16 duration-75 lg:flex">
      <FlowbiteSidebar.Items>
        <FlowbiteSidebar.ItemGroup>
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <FlowbiteSidebar.Item
                key={item.href}
                href={item.href}
                icon={() => <Icon className="h-5 w-5" />}
                className={isActive ? 'bg-gray-100 dark:bg-gray-700' : ''}
                as={Link}
              >
                {item.label}
              </FlowbiteSidebar.Item>
            );
          })}
        </FlowbiteSidebar.ItemGroup>
      </FlowbiteSidebar.Items>
    </FlowbiteSidebar>
  );
}