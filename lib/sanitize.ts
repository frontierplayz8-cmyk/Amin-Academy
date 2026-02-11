import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window as any);

/**
 * Sanitizes a string input to prevent XSS.
 * Removes <script>, <iframe>, and `javascript:` URIs.
 */
export function sanitizeInput(input: string): string {
    if (typeof input !== 'string') return input;
    return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'li', 'ol'], // Concise set for our app
        ALLOWED_ATTR: ['href', 'target', 'rel'],
    });
}

/**
 * Recursively sanitizes an object (e.g. JSON body).
 */
export function sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
        return sanitizeInput(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    }
    if (typeof obj === 'object' && obj !== null) {
        const newObj: any = {};
        for (const key in obj) {
            newObj[key] = sanitizeObject(obj[key]); // Recursively sanitize
        }
        return newObj;
    }
    return obj;
}
