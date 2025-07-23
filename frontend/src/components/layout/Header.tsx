'use client';

import { Avatar, Button, DarkThemeToggle, Dropdown, Navbar } from 'flowbite-react';
import { Bell, Search } from 'lucide-react';

export function Header() {
  return (
    <Navbar fluid className="border-b border-gray-200 dark:border-gray-700">
      <div className="w-full px-3 lg:px-5 lg:pl-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-start">
            <Navbar.Brand href="/">
              <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
                TicketSystem
              </span>
            </Navbar.Brand>
          </div>
          
          <div className="flex items-center">
            <div className="hidden lg:block lg:pl-2">
              <label htmlFor="topbar-search" className="sr-only">
                Search
              </label>
              <div className="relative mt-1 lg:w-96">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </div>
                <input
                  type="text"
                  name="search"
                  id="topbar-search"
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 pl-10 text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500 sm:text-sm"
                  placeholder="Search tickets..."
                />
              </div>
            </div>
            
            <div className="ml-3 flex items-center">
              <Button
                color="gray"
                pill
                size="sm"
                className="mr-1"
              >
                <Bell className="h-4 w-4" />
              </Button>
              
              <DarkThemeToggle className="mr-2" />
              
              <Dropdown
                arrowIcon={false}
                inline
                label={
                  <Avatar alt="User settings" img="https://flowbite.com/docs/images/people/profile-picture-5.jpg" rounded />
                }
              >
                <Dropdown.Header>
                  <span className="block text-sm">John Doe</span>
                  <span className="block truncate text-sm font-medium">john@example.com</span>
                </Dropdown.Header>
                <Dropdown.Item>Profile</Dropdown.Item>
                <Dropdown.Item>Settings</Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item>Sign out</Dropdown.Item>
              </Dropdown>
            </div>
          </div>
        </div>
      </div>
    </Navbar>
  );
}