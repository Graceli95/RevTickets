// ENHANCEMENT L2 SLA AUTOMATION - SLA status indicator component

import React, { useState, useEffect } from 'react';
import { Badge } from 'flowbite-react';

interface SLAIndicatorProps {
  slaDueDate?: string | null;
  slaBreached?: boolean;
  ticketStatus?: string;
  className?: string;
}

export const SLAIndicator: React.FC<SLAIndicatorProps> = ({
  slaDueDate,
  slaBreached,
  ticketStatus,
  className = ''
}) => {
  // ENHANCEMENT L2 SLA AUTOMATION - State for real-time countdown
  const [currentTime, setCurrentTime] = useState(new Date());

  // ENHANCEMENT L2 SLA AUTOMATION - Update timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ENHANCEMENT L2 SLA AUTOMATION - Don't render if no SLA data
  if (!slaDueDate) {
    return null;
  }

  // ENHANCEMENT L2 SLA AUTOMATION - Check if SLA is paused
  const isSLAPaused = ticketStatus === 'waiting_for_customer';

  // ENHANCEMENT L2 SLA AUTOMATION - Parse due date and calculate time remaining
  // API returns UTC time without 'Z' suffix, so we need to add it to ensure proper UTC parsing
  const dueDateString = slaDueDate.includes('Z') ? slaDueDate : slaDueDate + 'Z';
  const dueDate = new Date(dueDateString);
  const timeRemaining = dueDate.getTime() - currentTime.getTime();
  
  // Calculate total minutes and seconds remaining
  const totalMinutesRemaining = Math.floor(timeRemaining / (1000 * 60));
  const hoursRemaining = Math.floor(totalMinutesRemaining / 60);
  const minutesRemaining = totalMinutesRemaining % 60;
  const secondsRemaining = Math.floor((timeRemaining % (1000 * 60)) / 1000);

  // ENHANCEMENT L2 SLA AUTOMATION - Determine SLA status and styling
  let badgeColor: 'success' | 'warning' | 'failure' = 'success';
  let statusText: string;
  let timeText: string;

  if (isSLAPaused) {
    // ENHANCEMENT L2 SLA AUTOMATION - SLA is paused
    badgeColor = 'warning';
    statusText = 'SLA Paused';
    timeText = 'Waiting for customer response';
  } else if (slaBreached) {
    // ENHANCEMENT L2 SLA AUTOMATION - SLA is breached
    badgeColor = 'failure';
    statusText = 'SLA Breached';
    const totalOverdueMinutes = Math.abs(totalMinutesRemaining);
    const hoursOverdue = Math.floor(totalOverdueMinutes / 60);
    const minutesOverdue = totalOverdueMinutes % 60;
    if (hoursOverdue > 0) {
      timeText = `${hoursOverdue}h ${minutesOverdue}m overdue`;
    } else {
      timeText = `${minutesOverdue}m overdue`;
    }
  } else if (timeRemaining <= 0) {
    // ENHANCEMENT L2 SLA AUTOMATION - Just breached but not yet marked
    badgeColor = 'failure';
    statusText = 'SLA Due';
    timeText = 'Response overdue';
  } else if (totalMinutesRemaining <= 5) {
    // ENHANCEMENT L2 SLA AUTOMATION - Critical: less than 5 minutes remaining (show seconds)
    badgeColor = 'failure';
    statusText = 'SLA Critical';
    timeText = `${minutesRemaining}m ${secondsRemaining}s remaining`;
  } else if (totalMinutesRemaining <= 30) {
    // ENHANCEMENT L2 SLA AUTOMATION - Warning: less than 30 minutes remaining
    badgeColor = 'warning';
    statusText = 'SLA Warning';
    timeText = `${totalMinutesRemaining}m remaining`;
  } else {
    // ENHANCEMENT L2 SLA AUTOMATION - On track
    badgeColor = 'success';
    statusText = 'SLA On Track';
    if (hoursRemaining >= 24) {
      const daysRemaining = Math.floor(hoursRemaining / 24);
      const remainingHours = hoursRemaining % 24;
      timeText = `${daysRemaining}d ${remainingHours}h remaining`;
    } else if (hoursRemaining > 0) {
      timeText = `${hoursRemaining}h ${minutesRemaining}m remaining`;
    } else {
      timeText = `${totalMinutesRemaining}m remaining`;
    }
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* ENHANCEMENT L2 SLA AUTOMATION - Main SLA status badge */}
      <Badge color={badgeColor} size="sm">
        {statusText}
      </Badge>
      
      {/* ENHANCEMENT L2 SLA AUTOMATION - Time remaining/overdue text */}
      <span className={`text-xs ${
        slaBreached ? 'text-red-600' : 
        hoursRemaining <= 2 ? 'text-yellow-600' : 
        'text-green-600'
      }`}>
        {timeText}
      </span>
      
      {/* ENHANCEMENT L2 SLA AUTOMATION - Due date for reference */}
      <span className="text-xs text-gray-500">
        Due: {dueDate.toLocaleString()}
      </span>
    </div>
  );
};

export default SLAIndicator;