import { format, parseISO, formatDistanceToNow, differenceInHours, addBusinessDays, differenceInBusinessDays } from 'date-fns';

export const formatDate = (date: string | Date): string => {
  if (!date) return 'N/A';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (isNaN(dateObj.getTime())) return 'Invalid date';
    return format(dateObj, 'MMM dd, yyyy');
  } catch (error) {
    console.error('Date formatting error:', error, 'Input:', date);
    return 'Invalid date';
  }
};

export const formatDateTime = (date: string | Date): string => {
  if (!date) return 'N/A';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (isNaN(dateObj.getTime())) return 'Invalid date';
    return format(dateObj, 'MMM dd, yyyy HH:mm');
  } catch (error) {
    console.error('Date formatting error:', error, 'Input:', date);
    return 'Invalid date';
  }
};

export const formatTimeAgo = (date: string | Date): string => {
  if (!date) return 'N/A';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (isNaN(dateObj.getTime())) return 'Invalid date';
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    console.error('Date formatting error:', error, 'Input:', date);
    return 'Invalid date';
  }
};

export const formatFullDateTime = (date: string | Date): string => {
  if (!date) return 'N/A';
  try {
    let dateObj: Date;
    if (typeof date === 'string') {
      // Parse ISO string - this automatically handles UTC conversion to local time
      dateObj = parseISO(date);
    } else {
      dateObj = date;
    }
    
    if (isNaN(dateObj.getTime())) return 'Invalid date';
    
    // The format function automatically uses the local timezone
    // Remove debug logging for production
    return format(dateObj, 'MMM dd, yyyy \'at\' h:mm a');
  } catch (error) {
    console.error('Date formatting error:', error, 'Input:', date);
    return 'Invalid date';
  }
};

// ENHANCEMENT L1 COMMENT EDITING - 24-hour edit window validation
export const canEditComment = (createdAt: string | Date, currentUserId: string, commentUserId: string): boolean => {
  try {
    // Only the comment author can edit their comment
    if (currentUserId !== commentUserId) {
      return false;
    }

    // Parse the UTC timestamp correctly
    const createdDate = typeof createdAt === 'string' ? parseISO(createdAt) : createdAt;
    if (isNaN(createdDate.getTime())) return false;

    // Get current time for proper comparison
    const now = new Date();
    const hoursSinceCreation = differenceInHours(now, createdDate);
    
    return hoursSinceCreation < 24;
  } catch (error) {
    console.error('Edit validation error:', error);
    return false;
  }
};

// ENHANCEMENT L1 TICKET REOPENING - Business day calculations
export const canReopenTicket = (closedAt: string | Date): boolean => {
  try {
    const closedDate = typeof closedAt === 'string' ? parseISO(closedAt) : closedAt;
    if (isNaN(closedDate.getTime())) return false;

    const now = new Date();
    const businessDaysSinceClosure = differenceInBusinessDays(now, closedDate);
    
    return businessDaysSinceClosure <= 10;
  } catch (error) {
    console.error('Reopen validation error:', error);
    return false;
  }
};

export const getEditTimeRemaining = (createdAt: string | Date): string => {
  try {
    // Parse the UTC timestamp correctly
    const createdDate = typeof createdAt === 'string' ? parseISO(createdAt) : createdAt;
    if (isNaN(createdDate.getTime())) return '';

    // Get current time for proper comparison
    const now = new Date();
    const hoursSinceCreation = differenceInHours(now, createdDate);
    const hoursRemaining = 24 - hoursSinceCreation;
    
    if (hoursRemaining <= 0) return '';
    
    if (hoursRemaining >= 1) {
      return `${Math.floor(hoursRemaining)} hour${Math.floor(hoursRemaining) !== 1 ? 's' : ''} left to edit`;
    } else {
      const minutesRemaining = Math.floor(hoursRemaining * 60);
      return `${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''} left to edit`;
    }
  } catch (error) {
    console.error('Edit time calculation error:', error);
    return '';
  }
};

export const getReopenTimeRemaining = (closedAt: string | Date): string => {
  try {
    const closedDate = typeof closedAt === 'string' ? parseISO(closedAt) : closedAt;
    if (isNaN(closedDate.getTime())) return '';

    const now = new Date();
    const businessDaysSinceClosure = differenceInBusinessDays(now, closedDate);
    const businessDaysRemaining = 10 - businessDaysSinceClosure;
    
    if (businessDaysRemaining <= 0) return '';
    
    // Calculate the exact deadline (10 business days from closure)
    const deadline = addBusinessDays(closedDate, 10);
    
    if (businessDaysRemaining === 1) {
      return `Last day to reopen (until ${format(deadline, 'MMM dd')})`;
    } else {
      return `${businessDaysRemaining} business days left to reopen (until ${format(deadline, 'MMM dd')})`;
    }
  } catch (error) {
    console.error('Reopen time calculation error:', error);
    return '';
  }
};

export const formatBusinessDaysFromNow = (date: string | Date, days: number): string => {
  try {
    const startDate = typeof date === 'string' ? parseISO(date) : date;
    if (isNaN(startDate.getTime())) return 'Invalid date';
    
    const endDate = addBusinessDays(startDate, days);
    return format(endDate, 'MMM dd, yyyy');
  } catch (error) {
    console.error('Business day formatting error:', error);
    return 'Invalid date';
  }
};