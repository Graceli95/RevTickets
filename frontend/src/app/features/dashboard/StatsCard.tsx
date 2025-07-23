'use client';

import { Card } from 'flowbite-react';
import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  change?: {
    value: string;
    trend: 'up' | 'down';
  };
  className?: string;
}

export function StatsCard({ title, value, icon: Icon, change, className = '' }: StatsCardProps) {
  return (
    <Card className={`${className}`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Icon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
        </div>
        <div className="ml-4 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              {title}
            </dt>
            <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
              {value}
            </dd>
          </dl>
        </div>
        {change && (
          <div className="ml-4 flex-shrink-0">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                change.trend === 'up'
                  ? 'bg-green-100 text-green-800 dark:bg-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-200'
              }`}
            >
              {change.value}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}