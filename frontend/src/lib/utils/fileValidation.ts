/**
 * ENHANCEMENT L2: FILE ATTACHMENTS
 * 
 * File validation utilities for enhanced security
 * Provides comprehensive client-side validation for file uploads
 * including type checking, size limits, and security validation
 */

// ENHANCEMENT L2: FILE ATTACHMENTS - Allowed file types configuration
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/json',
  'text/csv'
];

export const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.pdf', '.txt', '.doc', '.docx', '.xls', '.xlsx',
  '.json', '.csv'
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_FILES_PER_TICKET = 5;

// Dangerous file types that should never be allowed
const DANGEROUS_TYPES = [
  'application/x-msdownload', // .exe
  'application/x-executable', // executables
  'application/x-javascript', // .js files
  'text/javascript',
  'application/javascript',
  'text/html', // HTML files could contain scripts
  'application/x-sh', // shell scripts
  'application/x-bat', // batch files
  'application/x-perl', // perl scripts
  'application/x-python', // python scripts
  'application/x-php', // php scripts
];

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

/**
 * Comprehensive file validation with security checks
 */
export function validateFile(file: File): FileValidationResult {
  const warnings: string[] = [];

  // Check for dangerous file types
  if (DANGEROUS_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `File type "${file.type}" is not allowed for security reasons.`
    };
  }

  // Check MIME type against allowed list
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `File type "${file.type}" is not allowed. Allowed types: images, PDF, documents, text files.`
    };
  }

  // Check file extension matches MIME type (basic check against spoofing)
  const fileExtension = getFileExtension(file.name).toLowerCase();
  if (!isExtensionAllowed(fileExtension)) {
    return {
      isValid: false,
      error: `File extension "${fileExtension}" is not allowed.`
    };
  }

  // Validate MIME type matches extension (basic anti-spoofing)
  if (!isMimeTypeMatchingExtension(file.type, fileExtension)) {
    warnings.push('File extension does not match detected file type. Please verify file integrity.');
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds maximum allowed size of ${formatFileSize(MAX_FILE_SIZE)}.`
    };
  }

  // Check for empty files
  if (file.size === 0) {
    return {
      isValid: false,
      error: 'Empty files are not allowed.'
    };
  }

  // Check filename for potential issues
  const filenameValidation = validateFilename(file.name);
  if (!filenameValidation.isValid) {
    return filenameValidation;
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Validate multiple files including total count check
 */
export function validateFiles(files: File[], existingFilesCount: number = 0): FileValidationResult {
  const totalFiles = files.length + existingFilesCount;
  
  if (totalFiles > MAX_FILES_PER_TICKET) {
    return {
      isValid: false,
      error: `Too many files. Maximum ${MAX_FILES_PER_TICKET} files allowed per ticket.`
    };
  }

  // Validate each file individually
  for (const file of files) {
    const result = validateFile(file);
    if (!result.isValid) {
      return {
        isValid: false,
        error: `${file.name}: ${result.error}`
      };
    }
  }

  return { isValid: true };
}

/**
 * Validate filename for security issues
 */
function validateFilename(filename: string): FileValidationResult {
  // Check for null bytes (path traversal attempt)
  if (filename.includes('\0')) {
    return {
      isValid: false,
      error: 'Filename contains invalid characters.'
    };
  }

  // Check for path traversal patterns
  if (filename.includes('../') || filename.includes('..\\') || filename.includes('/..') || filename.includes('\\..')) {
    return {
      isValid: false,
      error: 'Filename contains path traversal patterns.'
    };
  }

  // Check filename length (prevent extremely long names)
  if (filename.length > 255) {
    return {
      isValid: false,
      error: 'Filename is too long. Maximum 255 characters allowed.'
    };
  }

  // Check for potentially dangerous filenames
  const dangerousPatterns = [
    /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\.|$)/i, // Windows reserved names
    /^\./,  // Hidden files starting with dot
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(filename)) {
      return {
        isValid: false,
        error: 'Filename is not allowed for security reasons.'
      };
    }
  }

  return { isValid: true };
}

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? '' : filename.slice(lastDot);
}

/**
 * Check if file extension is allowed
 */
function isExtensionAllowed(extension: string): boolean {
  return ALLOWED_EXTENSIONS.includes(extension.toLowerCase());
}

/**
 * Basic check if MIME type matches file extension (anti-spoofing)
 */
function isMimeTypeMatchingExtension(mimeType: string, extension: string): boolean {
  const mimeExtensionMap: Record<string, string[]> = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'application/pdf': ['.pdf'],
    'text/plain': ['.txt'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/json': ['.json'],
    'text/csv': ['.csv']
  };

  const expectedExtensions = mimeExtensionMap[mimeType];
  return expectedExtensions ? expectedExtensions.includes(extension.toLowerCase()) : false;
}

/**
 * Format file size for display
 * BUG: File size formatting is broken - always shows raw bytes instead of human-readable format
 */
export function formatFileSize(bytes: number): string {
  // BUG: Always return raw bytes instead of formatted size
  // Should convert to KB/MB/GB but this logic is commented out
  /*
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  */
  
  // BUG: Just return raw byte count - poor user experience
  return `${bytes} bytes`;
}

/**
 * Sanitize filename for storage (remove dangerous characters)
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')  // Replace dangerous characters with underscore
    .replace(/^\.+/, '_')  // Replace leading dots
    .substring(0, 255);  // Limit length
}

/**
 * Generate secure filename with timestamp to prevent conflicts
 */
export function generateSecureFilename(originalFilename: string): string {
  const extension = getFileExtension(originalFilename);
  const baseName = originalFilename.replace(extension, '');
  const sanitizedBase = sanitizeFilename(baseName);
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  
  return `${sanitizedBase}_${timestamp}_${randomSuffix}${extension}`;
}