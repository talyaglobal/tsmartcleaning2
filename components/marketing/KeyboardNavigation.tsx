'use client'

import { useEffect } from 'react'

/**
 * Keyboard Navigation Enhancement Component
 * 
 * Adds keyboard navigation support for dropdown menus and interactive elements
 * that may not have native keyboard support from Webflow
 */
export function KeyboardNavigation() {
  useEffect(() => {
    // Handle dropdown keyboard navigation
    const handleDropdownKeydown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement

      // Check if target is a dropdown toggle
      if (
        target.classList.contains('w-dropdown-toggle') ||
        target.closest('.w-dropdown-toggle')
      ) {
        const toggle = target.classList.contains('w-dropdown-toggle')
          ? target
          : (target.closest('.w-dropdown-toggle') as HTMLElement)

        if (!toggle) return

        const dropdown = toggle.closest('.w-dropdown')
        if (!dropdown) return

        switch (e.key) {
          case 'Enter':
          case ' ': // Space
            e.preventDefault()
            toggle.click()
            break
          case 'Escape':
            // Close dropdown
            const list = dropdown.querySelector('.w-dropdown-list') as HTMLElement
            if (list && list.classList.contains('w--open')) {
              toggle.click()
            }
            break
          case 'ArrowDown':
            e.preventDefault()
            // Open dropdown if closed
            const isOpen = dropdown.querySelector('.w-dropdown-list.w--open')
            if (!isOpen) {
              toggle.click()
            }
            // Focus first menu item
            setTimeout(() => {
              const firstItem = dropdown.querySelector(
                '.w-dropdown-list [role="menuitem"], .w-dropdown-list a'
              ) as HTMLElement
              if (firstItem) {
                firstItem.focus()
              }
            }, 100)
            break
        }
      }

      // Handle menu item navigation
      if (
        target.hasAttribute('role') &&
        target.getAttribute('role') === 'menuitem'
      ) {
        const menuItems = Array.from(
          target.closest('[role="menu"]')?.querySelectorAll('[role="menuitem"]') ||
            []
        ) as HTMLElement[]

        const currentIndex = menuItems.indexOf(target)

        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault()
            const nextIndex = (currentIndex + 1) % menuItems.length
            menuItems[nextIndex]?.focus()
            break
          case 'ArrowUp':
            e.preventDefault()
            const prevIndex =
              currentIndex === 0 ? menuItems.length - 1 : currentIndex - 1
            menuItems[prevIndex]?.focus()
            break
          case 'Home':
            e.preventDefault()
            menuItems[0]?.focus()
            break
          case 'End':
            e.preventDefault()
            menuItems[menuItems.length - 1]?.focus()
            break
          case 'Escape':
            // Close dropdown and return focus to toggle
            const dropdown = target.closest('.w-dropdown')
            const toggle = dropdown?.querySelector('.w-dropdown-toggle') as HTMLElement
            if (toggle) {
              toggle.click()
              toggle.focus()
            }
            break
        }
      }
    }

    // Handle mobile menu button
    const handleMobileMenuKeydown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target.classList.contains('w-nav-button') ||
        target.closest('.w-nav-button')
      ) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          target.click()
        }
      }
    }

    // Add event listeners
    document.addEventListener('keydown', handleDropdownKeydown)
    document.addEventListener('keydown', handleMobileMenuKeydown)

    // Update aria-expanded attributes when dropdowns open/close
    const updateAriaExpanded = () => {
      const toggles = document.querySelectorAll('.w-dropdown-toggle')
      toggles.forEach((toggle) => {
        const dropdown = toggle.closest('.w-dropdown')
        const list = dropdown?.querySelector('.w-dropdown-list')
        const isOpen = list?.classList.contains('w--open')
        toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false')
      })
    }

    // Observe dropdown state changes
    const observer = new MutationObserver(updateAriaExpanded)
    const dropdowns = document.querySelectorAll('.w-dropdown')
    dropdowns.forEach((dropdown) => {
      observer.observe(dropdown, {
        attributes: true,
        attributeFilter: ['class'],
        subtree: true,
      })
    })

    // Initial update
    updateAriaExpanded()

    return () => {
      document.removeEventListener('keydown', handleDropdownKeydown)
      document.removeEventListener('keydown', handleMobileMenuKeydown)
      observer.disconnect()
    }
  }, [])

  return null
}

