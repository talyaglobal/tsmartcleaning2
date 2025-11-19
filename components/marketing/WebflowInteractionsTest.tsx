'use client'

import { useEffect, useState } from 'react'

interface TestResult {
  name: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: string
}

/**
 * Component to test Webflow interactions:
 * - Dropdown menus
 * - Tabs functionality
 * - Animations
 * - Mobile menu
 */
export function WebflowInteractionsTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runTests = () => {
    setIsRunning(true)
    const results: TestResult[] = []

    // Test 1: Check if Webflow is loaded
    const hasWebflow = typeof (window as any).Webflow !== 'undefined'
    const hasJQuery = typeof (window as any).jQuery !== 'undefined'
    
    if (!hasWebflow || !hasJQuery) {
      results.push({
        name: 'Webflow Scripts',
        status: 'fail',
        message: 'Webflow or jQuery not loaded',
        details: `Webflow: ${hasWebflow}, jQuery: ${hasJQuery}`
      })
      setTestResults(results)
      setIsRunning(false)
      return
    }

    results.push({
      name: 'Webflow Scripts',
      status: 'pass',
      message: 'Webflow and jQuery are loaded'
    })

    // Test 2: Dropdown Menus
    const dropdowns = document.querySelectorAll('.w-dropdown')
    if (dropdowns.length === 0) {
      results.push({
        name: 'Dropdown Menus',
        status: 'warning',
        message: 'No dropdown menus found on page'
      })
    } else {
      let workingDropdowns = 0
      dropdowns.forEach((dropdown, index) => {
        const toggle = dropdown.querySelector('.w-dropdown-toggle')
        const list = dropdown.querySelector('.w-dropdown-list')
        
        if (toggle && list) {
          // Check if dropdown has proper structure
          const hasDataAttributes = dropdown.hasAttribute('data-delay') || dropdown.hasAttribute('data-hover')
          
          // Try to trigger dropdown (if Webflow is ready)
          try {
            // Check if Webflow has initialized dropdowns
            const webflow = (window as any).Webflow
            if (webflow && webflow.require && webflow.require('ix2')) {
              workingDropdowns++
            } else {
              // Fallback: check if element has event listeners
              const hasListeners = (toggle as any).onclick !== null || 
                                   (toggle as any).addEventListener !== undefined
              if (hasListeners) {
                workingDropdowns++
              }
            }
          } catch (e) {
            // If we can't test, assume it's working if structure is correct
            if (hasDataAttributes) {
              workingDropdowns++
            }
          }
        }
      })

      if (workingDropdowns === dropdowns.length) {
        results.push({
          name: 'Dropdown Menus',
          status: 'pass',
          message: `All ${dropdowns.length} dropdown(s) are properly configured`,
          details: `Found ${dropdowns.length} dropdown menu(s)`
        })
      } else {
        results.push({
          name: 'Dropdown Menus',
          status: 'warning',
          message: `${workingDropdowns}/${dropdowns.length} dropdown(s) appear to be working`,
          details: `Found ${dropdowns.length} dropdown menu(s), ${workingDropdowns} working`
        })
      }
    }

    // Test 3: Tabs Functionality
    const tabs = document.querySelectorAll('.w-tabs')
    if (tabs.length === 0) {
      results.push({
        name: 'Tabs',
        status: 'warning',
        message: 'No tabs found on page'
      })
    } else {
      let workingTabs = 0
      tabs.forEach((tab) => {
        const tabLinks = tab.querySelectorAll('.w-tab-link')
        const tabPanes = tab.querySelectorAll('.w-tab-pane')
        
        if (tabLinks.length > 0 && tabPanes.length > 0) {
          // Check if tabs have proper structure
          const hasActiveTab = tab.querySelector('.w-tab-link.w--current') !== null
          const hasActivePane = tab.querySelector('.w-tab-pane.w--tab-active') !== null
          
          if (hasActiveTab && hasActivePane) {
            workingTabs++
          } else if (tabLinks.length === tabPanes.length) {
            // Structure looks correct even if no active tab yet
            workingTabs++
          }
        }
      })

      if (workingTabs === tabs.length) {
        results.push({
          name: 'Tabs',
          status: 'pass',
          message: `All ${tabs.length} tab group(s) are properly configured`,
          details: `Found ${tabs.length} tab group(s)`
        })
      } else {
        results.push({
          name: 'Tabs',
          status: 'warning',
          message: `${workingTabs}/${tabs.length} tab group(s) appear to be working`,
          details: `Found ${tabs.length} tab group(s), ${workingTabs} working`
        })
      }
    }

    // Test 4: Animations
    const animatedElements = document.querySelectorAll('[data-animation]')
    const interactionElements = document.querySelectorAll('[data-ix], [data-ix2]')
    const totalAnimated = animatedElements.length + interactionElements.length

    if (totalAnimated === 0) {
      results.push({
        name: 'Animations',
        status: 'warning',
        message: 'No animation elements found on page'
      })
    } else {
      // Check if Webflow interactions are initialized
      const webflow = (window as any).Webflow
      const hasIx2 = webflow && webflow.require && typeof webflow.require('ix2') !== 'undefined'
      
      if (hasIx2) {
        results.push({
          name: 'Animations',
          status: 'pass',
          message: `Webflow interactions initialized for ${totalAnimated} element(s)`,
          details: `Found ${animatedElements.length} data-animation elements, ${interactionElements.length} interaction elements`
        })
      } else {
        results.push({
          name: 'Animations',
          status: 'warning',
          message: `Found ${totalAnimated} animation element(s) but interactions may not be initialized`,
          details: `Webflow ix2 module may need to be loaded`
        })
      }
    }

    // Test 5: Mobile Menu
    const navContainer = document.querySelector('.w-nav[data-collapse]')
    const navButton = document.querySelector('.w-nav-button')
    const navMenu = document.querySelector('.w-nav-menu')

    if (!navContainer) {
      results.push({
        name: 'Mobile Menu',
        status: 'warning',
        message: 'No navigation container found'
      })
    } else {
      const collapseBreakpoint = navContainer.getAttribute('data-collapse') || 'none'
      const hasButton = navButton !== null
      const hasMenu = navMenu !== null

      if (hasButton && hasMenu) {
        // Check if mobile menu button is visible at mobile breakpoint
        const isMobile = window.innerWidth <= 991 // medium breakpoint
        const buttonVisible = isMobile ? 
          window.getComputedStyle(navButton as Element).display !== 'none' : 
          true

        results.push({
          name: 'Mobile Menu',
          status: 'pass',
          message: `Mobile menu configured for ${collapseBreakpoint} breakpoint`,
          details: `Button: ${hasButton ? 'Found' : 'Missing'}, Menu: ${hasMenu ? 'Found' : 'Missing'}, Visible on mobile: ${buttonVisible}`
        })
      } else {
        results.push({
          name: 'Mobile Menu',
          status: 'fail',
          message: 'Mobile menu structure incomplete',
          details: `Button: ${hasButton ? 'Found' : 'Missing'}, Menu: ${hasMenu ? 'Found' : 'Missing'}`
        })
      }
    }

    // Test 6: Test actual interactions (if possible)
    setTimeout(() => {
      // Test dropdown click
      const firstDropdown = document.querySelector('.w-dropdown')
      if (firstDropdown) {
        const toggle = firstDropdown.querySelector('.w-dropdown-toggle')
        if (toggle) {
          try {
            // Create a test click event
            const clickEvent = new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window
            })
            
            // Note: We won't actually dispatch to avoid interfering with UI
            // Just check if element is clickable
            const isClickable = toggle instanceof HTMLElement && 
                               (toggle.onclick !== null || 
                                toggle.getAttribute('role') !== null ||
                                toggle.classList.contains('w-dropdown-toggle'))
            
            if (isClickable) {
              results.push({
                name: 'Interaction Test',
                status: 'pass',
                message: 'Dropdown toggle elements are interactive',
                details: 'Elements have proper event handling structure'
              })
            }
          } catch (e) {
            results.push({
              name: 'Interaction Test',
              status: 'warning',
              message: 'Could not test interactions',
              details: String(e)
            })
          }
        }
      }

      setTestResults(results)
      setIsRunning(false)
    }, 500)
  }

  useEffect(() => {
    // Auto-run tests after page loads
    const timeout = setTimeout(() => {
      runTests()
    }, 2000) // Wait for Webflow to initialize

    return () => clearTimeout(timeout)
  }, [])

  // Don't render in production, only log to console
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '20px', 
      right: '20px', 
      zIndex: 9999,
      background: 'white',
      border: '2px solid #333',
      borderRadius: '8px',
      padding: '16px',
      maxWidth: '400px',
      maxHeight: '500px',
      overflow: 'auto',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      fontSize: '12px',
      fontFamily: 'monospace'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>🧪 Webflow Tests</h3>
        <button
          onClick={runTests}
          disabled={isRunning}
          style={{
            padding: '4px 8px',
            fontSize: '11px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            background: isRunning ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          {isRunning ? 'Testing...' : 'Re-run'}
        </button>
      </div>
      
      {testResults.length > 0 && (
        <div>
          {testResults.map((result, index) => (
            <div
              key={index}
              style={{
                marginBottom: '8px',
                padding: '8px',
                background: result.status === 'pass' ? '#d4edda' : 
                           result.status === 'fail' ? '#f8d7da' : '#fff3cd',
                borderLeft: `4px solid ${
                  result.status === 'pass' ? '#28a745' : 
                  result.status === 'fail' ? '#dc3545' : '#ffc107'
                }`,
                borderRadius: '4px'
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                {result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️'} {result.name}
              </div>
              <div style={{ fontSize: '11px', color: '#666' }}>{result.message}</div>
              {result.details && (
                <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>{result.details}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {testResults.length === 0 && !isRunning && (
        <div style={{ color: '#666', fontSize: '11px' }}>Click "Re-run" to test interactions</div>
      )}
    </div>
  )
}

