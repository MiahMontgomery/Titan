/**
 * Crypto API Polyfill
 * 
 * This file provides a simple polyfill for the Web Crypto API
 * to ensure that randomUUID and getRandomValues functions are available.
 */

// Use a safe way to determine environment
const isBrowser = typeof window !== 'undefined';

// Create a safe polyfill
function createPolyfill() {
  try {
    if (isBrowser && window) {
      // Check if we need to polyfill
      if (!window.crypto || !window.crypto.getRandomValues) {
        console.log('Applying browser crypto polyfill');
        
        // Create minimal crypto object if needed
        if (!window.crypto) {
          window.crypto = {};
        }
        
        // Add getRandomValues if missing
        if (!window.crypto.getRandomValues) {
          window.crypto.getRandomValues = function(array) {
            for (let i = 0; i < array.length; i++) {
              array[i] = Math.floor(Math.random() * 256);
            }
            return array;
          };
        }
        
        // Add randomUUID if missing
        if (!window.crypto.randomUUID) {
          window.crypto.randomUUID = function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
              const r = Math.random() * 16 | 0;
              const v = c === 'x' ? r : (r & 0x3 | 0x8);
              return v.toString(16);
            });
          };
        }
        
        console.log('Browser Crypto API polyfill has been applied');
      }
    } 
  } catch (err) {
    console.warn('Failed to apply crypto polyfill:', err);
  }
}

// Apply the polyfill
createPolyfill();