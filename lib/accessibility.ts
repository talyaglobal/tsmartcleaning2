/**
 * Accessibility utilities for managing live regions and screen reader announcements
 */

/**
 * Announces a message to screen readers via live regions
 * @param message - The message to announce
 * @param priority - 'polite' (default) or 'assertive' for urgent announcements
 */
export function announceToScreenReader(
  message: string, 
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const liveRegionId = priority === 'assertive' ? 'live-region-assertive' : 'live-region'
  const liveRegion = document.getElementById(liveRegionId)
  
  if (liveRegion) {
    // Clear first to ensure the message is announced even if it's the same
    liveRegion.textContent = ''
    
    // Use requestAnimationFrame to ensure the clear happens before the new message
    requestAnimationFrame(() => {
      liveRegion.textContent = message
      
      // Clear after 5 seconds to keep the live region clean
      setTimeout(() => {
        if (liveRegion.textContent === message) {
          liveRegion.textContent = ''
        }
      }, 5000)
    })
  }
}

/**
 * Manages focus for modal/dialog components
 * Returns an object with methods to handle focus
 */
export function createFocusTrap(container: HTMLElement) {
  const focusableSelectors = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    'details',
    'summary'
  ].join(', ')

  let previousActiveElement: HTMLElement | null = null

  const getFocusableElements = () => {
    return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[]
  }

  const trapFocus = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return

    const focusableElements = getFocusableElements()
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault()
        lastElement?.focus()
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault()
        firstElement?.focus()
      }
    }
  }

  const activate = () => {
    previousActiveElement = document.activeElement as HTMLElement
    
    // Focus first focusable element
    const focusableElements = getFocusableElements()
    if (focusableElements.length > 0) {
      focusableElements[0].focus()
    }

    document.addEventListener('keydown', trapFocus)
  }

  const deactivate = () => {
    document.removeEventListener('keydown', trapFocus)
    
    // Restore focus to previously focused element
    if (previousActiveElement) {
      previousActiveElement.focus()
    }
  }

  return {
    activate,
    deactivate,
    getFocusableElements
  }
}

/**
 * Validates color contrast ratio between foreground and background colors
 * @param foreground - Foreground color in hex format (e.g., '#000000')
 * @param background - Background color in hex format (e.g., '#ffffff')
 * @returns Object with contrast ratio and WCAG compliance levels
 */
export function checkColorContrast(foreground: string, background: string) {
  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }

  // Calculate relative luminance
  const getLuminance = (r: number, g: number, b: number) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }

  const fg = hexToRgb(foreground)
  const bg = hexToRgb(background)

  if (!fg || !bg) {
    throw new Error('Invalid color format. Please use hex format (e.g., #000000)')
  }

  const fgLuminance = getLuminance(fg.r, fg.g, fg.b)
  const bgLuminance = getLuminance(bg.r, bg.g, bg.b)

  const lighter = Math.max(fgLuminance, bgLuminance)
  const darker = Math.min(fgLuminance, bgLuminance)

  const ratio = (lighter + 0.05) / (darker + 0.05)

  return {
    ratio: Math.round(ratio * 100) / 100,
    AA: ratio >= 4.5,
    AAA: ratio >= 7,
    AALarge: ratio >= 3, // For large text (18pt+ or 14pt+ bold)
    AAALarge: ratio >= 4.5 // For large text AAA compliance
  }
}

/**
 * Generates a unique ID for accessibility attributes
 * @param prefix - Optional prefix for the ID
 * @returns A unique ID string
 */
export function generateAccessibilityId(prefix = 'a11y'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Checks if an element is visible to screen readers
 * @param element - The element to check
 * @returns Boolean indicating if the element is visible to screen readers
 */
export function isVisibleToScreenReader(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element)
  
  return !(
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.opacity === '0' ||
    element.hasAttribute('aria-hidden') && element.getAttribute('aria-hidden') === 'true' ||
    element.hidden
  )
}