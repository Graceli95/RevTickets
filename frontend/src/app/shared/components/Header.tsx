'use client';

import React from 'react';
import { 
  Avatar, 
  Button, 
  DarkThemeToggle, 
  Dropdown, 
  DropdownHeader,
  DropdownItem,
  DropdownDivider,
  Navbar, 
  NavbarBrand 
} from 'flowbite-react';
import { Bell, Menu, LogOut } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  if (!user) return null;

  return (
    <Navbar fluid className="border-b border-orange-200 dark:border-orange-800 bg-white dark:bg-gray-900 shadow-sm">
      <div className="flex items-center">
        <Button
          color="gray"
          size="sm"
          className="mr-3 lg:hidden hover:bg-orange-50 dark:hover:bg-orange-900/20 focus:ring-orange-500"
          onClick={onToggleSidebar}
        >
          <Menu className="h-4 w-4" />
        </Button>
        
        <NavbarBrand>
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">TS</span>
            </div>
            <span className="self-center whitespace-nowrap text-xl font-semibold text-orange-600 dark:text-orange-400">
              TicketSystem
            </span>
          </Link>
        </NavbarBrand>
      </div>
      
      <div className="flex items-center space-x-3">
        <Button
          pill
          size="sm"
          className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500 text-white"
        >
          <Bell className="h-4 w-4" />
        </Button>
        
        <DarkThemeToggle />
        
        <Dropdown
          arrowIcon={false}
          inline
          label={
            <Avatar 
              alt="User settings" 
              img={`https://api.dicebear.com/7.x/initials/svg?seed=${user.first_name} ${user.last_name}&backgroundColor=fb923c,f97316,ea580c&textColor=ffffff`}
              rounded 
              className="ring-2 ring-orange-200 dark:ring-orange-800"
            />
          }
        >
          <DropdownHeader>
            <span className="block text-sm font-medium text-gray-900 dark:text-white">{user.first_name} {user.last_name}</span>
            <span className="block truncate text-sm text-gray-500 dark:text-gray-400">{user.email}</span>
            <span className="block text-xs text-orange-600 dark:text-orange-400 capitalize">{user.role}</span>
          </DropdownHeader>
          <DropdownItem className="hover:bg-orange-50 dark:hover:bg-orange-900/20">
            Profile
          </DropdownItem>
          <DropdownItem className="hover:bg-orange-50 dark:hover:bg-orange-900/20">
            Settings
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem 
            className="hover:bg-orange-50 dark:hover:bg-orange-900/20"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </DropdownItem>
        </Dropdown>
      </div>
    </Navbar>
  );
}