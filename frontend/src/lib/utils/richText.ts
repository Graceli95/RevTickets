import type { RichTextContent } from '../../app/shared/types';

/**
 * Creates a RichTextContent object from HTML string
 */
export function createRichTextFromHTML(html: string): RichTextContent {
  // Extract plain text from HTML (basic implementation)
  const text = html.replace(/<[^>]*>/g, '').trim();
  
  return {
    html,
    json: {}, // Will be populated by editor when user edits
    text
  };
}

/**
 * Creates a RichTextContent object from plain text
 */
export function createRichTextFromText(text: string): RichTextContent {
  const html = text.replace(/\n/g, '<br>');
  
  return {
    html,
    json: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text
            }
          ]
        }
      ]
    },
    text
  };
}

/**
 * Creates an empty RichTextContent object
 */
export function createEmptyRichText(): RichTextContent {
  return {
    html: '',
    json: {
      type: 'doc',
      content: []
    },
    text: ''
  };
}

/**
 * Checks if RichTextContent is empty
 */
export function isRichTextEmpty(content: RichTextContent): boolean {
  return !content.text.trim();
}

/**
 * Gets display text from RichTextContent (with fallback to HTML parsing)
 */
export function getRichTextDisplay(content: RichTextContent): string {
  if (content.text) {
    return content.text;
  }
  
  // Fallback: extract from HTML if text is not available
  return content.html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Gets HTML for display from RichTextContent
 */
export function getRichTextHTML(content: RichTextContent): string {
  return content.html;
}

/**
 * Converts legacy string content to RichTextContent
 */
export function convertLegacyContent(content: string | RichTextContent): RichTextContent {
  if (typeof content === 'string') {
    return createRichTextFromHTML(content);
  }
  return content;
}

/**
 * Truncates rich text content for previews
 */
export function truncateRichText(content: RichTextContent, maxLength: number = 100): string {
  const text = getRichTextDisplay(content);
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
}