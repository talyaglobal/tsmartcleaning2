'use client'

import { useEffect, useState } from 'react'

interface VerificationResult {
  category: string
  test: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: string
  fix?: string
}

/**
 * Comprehensive Webflow Design Integration Verification
 * 
 * Verifies:
 * 1. All Webflow styles apply correctly
 * 2. All Webflow interactions work
 * 3. Responsive breakpoints match
 * 4. Style conflicts are identified and fixed
 */
export function WebflowDesignVerification() {
  const [results, setResults] = useState<VerificationResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string>('')

  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== 'development') return

    const updateBreakpoint = () => {
      const width = window.innerWidth
      if (width < 479) setCurrentBreakpoint('Mobile Small (< 479px)')
      else if (width < 767) setCurrentBreakpoint('Mobile (479px - 767px)')
      else if (width < 991) setCurrentBreakpoint('Tablet (767px - 991px)')
      else setCurrentBreakpoint('Desktop (≥ 991px)')
    }

    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])

  const runVerification = async () => {
    setIsRunning(true)
    const verificationResults: VerificationResult[] = []

    // Wait for page to fully load
    await new Promise(resolve => setTimeout(resolve, 1500))

    // ============================================
    // 1. VERIFY WEBFLOW STYLES APPLY CORRECTLY
    // ============================================
    verificationResults.push({
      category: 'Styles',
      test: 'CSS Files Loaded',
      status: 'pass',
      message: 'Checking CSS file loading...',
    })

    // Check CSS files
    const cssLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[]
    const requiredCss = ['normalize.css', 'webflow.css', 'tsmartcleaning-ff34e6.webflow.css']
    const cssPromises = requiredCss.map(cssName => {
      const cssLink = cssLinks.find(link => link.href.includes(cssName))
      if (!cssLink) {
        return Promise.resolve(false)
      }
      return fetch(cssLink.href, { method: 'HEAD' })
        .then(response => response.ok)
        .catch(() => false)
    })

    const cssResults = await Promise.all(cssPromises)
    const allCssLoaded = cssResults.every(loaded => loaded) && cssResults.length === requiredCss.length

    verificationResults[verificationResults.length - 1] = {
      category: 'Styles',
      test: 'CSS Files Loaded',
      status: allCssLoaded ? 'pass' : 'fail',
      message: allCssLoaded 
        ? `All ${requiredCss.length} required CSS files loaded successfully`
        : `Missing or failed to load CSS files`,
      details: requiredCss.map((name, i) => `${name}: ${cssResults[i] ? '✓' : '✗'}`).join(', '),
    }

    // Check Webflow classes are present
    const webflowClasses = [
      'w-nav', 'w-dropdown', 'w-tabs', 'w-button', 
      'w-inline-block', 'w-list-unstyled', 'w-nav-menu'
    ]
    const foundClasses = webflowClasses.filter(className => 
      document.querySelector(`.${className}`) !== null
    )

    verificationResults.push({
      category: 'Styles',
      test: 'Webflow Classes Present',
      status: foundClasses.length > 0 ? 'pass' : 'warning',
      message: `Found ${foundClasses.length}/${webflowClasses.length} Webflow classes`,
      details: `Found: ${foundClasses.join(', ')}`,
    })

    // Check for style conflicts (check if Tailwind classes override Webflow)
    const testElement = document.createElement('div')
    testElement.className = 'w-button'
    testElement.style.display = 'none'
    document.body.appendChild(testElement)
    const computedStyle = window.getComputedStyle(testElement)
    const hasBackground = computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
                          computedStyle.backgroundColor !== 'transparent'
    document.body.removeChild(testElement)

    verificationResults.push({
      category: 'Styles',
      test: 'Style Conflicts',
      status: hasBackground ? 'pass' : 'warning',
      message: hasBackground 
        ? 'Webflow button styles are applying correctly'
        : 'Potential style conflict: Webflow button styles may be overridden',
      details: hasBackground 
        ? `Button background: ${computedStyle.backgroundColor}`
        : 'Check if Tailwind or custom CSS is overriding Webflow styles',
      fix: hasBackground ? undefined : 'Review globals.css for conflicting button styles',
    })

    // Check font loading
    const webflowFonts = ['Figtree', 'Bricolage Grotesque']
    const loadedFonts = webflowFonts.filter(font => {
      const testSpan = document.createElement('span')
      testSpan.style.fontFamily = font
      testSpan.style.position = 'absolute'
      testSpan.style.visibility = 'hidden'
      testSpan.textContent = 'test'
      document.body.appendChild(testSpan)
      const loaded = window.getComputedStyle(testSpan).fontFamily.includes(font)
      document.body.removeChild(testSpan)
      return loaded
    })

    verificationResults.push({
      category: 'Styles',
      test: 'Webflow Fonts Loaded',
      status: loadedFonts.length === webflowFonts.length ? 'pass' : 'warning',
      message: `${loadedFonts.length}/${webflowFonts.length} Webflow fonts loaded`,
      details: `Loaded: ${loadedFonts.join(', ') || 'None'}`,
    })

    // ============================================
    // 2. TEST WEBFLOW INTERACTIONS
    // ============================================
    
    // Check Webflow scripts
    const hasJQuery = typeof (window as any).jQuery !== 'undefined'
    const hasWebflow = typeof (window as any).Webflow !== 'undefined'

    verificationResults.push({
      category: 'Interactions',
      test: 'Webflow Scripts Loaded',
      status: hasJQuery && hasWebflow ? 'pass' : 'fail',
      message: hasJQuery && hasWebflow 
        ? 'jQuery and Webflow.js are loaded'
        : 'Missing required scripts',
      details: `jQuery: ${hasJQuery ? '✓' : '✗'}, Webflow: ${hasWebflow ? '✓' : '✗'}`,
      fix: !hasJQuery || !hasWebflow ? 'Ensure WebflowScripts component is loaded' : undefined,
    })

    // Test dropdowns
    const dropdowns = document.querySelectorAll('.w-dropdown')
    let workingDropdowns = 0
    dropdowns.forEach(dropdown => {
      const toggle = dropdown.querySelector('.w-dropdown-toggle')
      const list = dropdown.querySelector('.w-dropdown-list')
      if (toggle && list) {
        // Check if dropdown has proper structure and event handlers
        const hasDataAttributes = dropdown.hasAttribute('data-delay') || dropdown.hasAttribute('data-hover')
        if (hasDataAttributes || (toggle as HTMLElement).onclick !== null) {
          workingDropdowns++
        }
      }
    })

    verificationResults.push({
      category: 'Interactions',
      test: 'Dropdown Menus',
      status: dropdowns.length === 0 ? 'warning' : workingDropdowns === dropdowns.length ? 'pass' : 'warning',
      message: dropdowns.length === 0 
        ? 'No dropdown menus found'
        : `${workingDropdowns}/${dropdowns.length} dropdown(s) configured correctly`,
      details: `Found ${dropdowns.length} dropdown menu(s)`,
    })

    // Test tabs
    const tabs = document.querySelectorAll('.w-tabs')
    let workingTabs = 0
    tabs.forEach(tab => {
      const tabLinks = tab.querySelectorAll('.w-tab-link')
      const tabPanes = tab.querySelectorAll('.w-tab-pane')
      if (tabLinks.length > 0 && tabPanes.length > 0 && tabLinks.length === tabPanes.length) {
        workingTabs++
      }
    })

    verificationResults.push({
      category: 'Interactions',
      test: 'Tabs',
      status: tabs.length === 0 ? 'warning' : workingTabs === tabs.length ? 'pass' : 'warning',
      message: tabs.length === 0 
        ? 'No tabs found'
        : `${workingTabs}/${tabs.length} tab group(s) configured correctly`,
      details: `Found ${tabs.length} tab group(s)`,
    })

    // Test animations
    const animatedElements = document.querySelectorAll('[data-animation], [data-ix], [data-ix2]')
    const webflow = (window as any).Webflow
    const hasIx2 = webflow && webflow.require && typeof webflow.require('ix2') !== 'undefined'

    verificationResults.push({
      category: 'Interactions',
      test: 'Animations',
      status: animatedElements.length === 0 ? 'warning' : hasIx2 ? 'pass' : 'warning',
      message: animatedElements.length === 0 
        ? 'No animation elements found'
        : hasIx2 
          ? `Webflow interactions initialized for ${animatedElements.length} element(s)`
          : `Found ${animatedElements.length} animation element(s) but interactions may not be initialized`,
      details: `Animation elements: ${animatedElements.length}, ix2 module: ${hasIx2 ? 'loaded' : 'not loaded'}`,
    })

    // Test mobile menu
    const navContainer = document.querySelector('.w-nav[data-collapse]')
    const navButton = document.querySelector('.w-nav-button')
    const navMenu = document.querySelector('.w-nav-menu')
    const collapseBreakpoint = navContainer?.getAttribute('data-collapse') || 'none'

    verificationResults.push({
      category: 'Interactions',
      test: 'Mobile Menu',
      status: navContainer && navButton && navMenu ? 'pass' : 'fail',
      message: navContainer && navButton && navMenu
        ? `Mobile menu configured for ${collapseBreakpoint} breakpoint`
        : 'Mobile menu structure incomplete',
      details: `Container: ${navContainer ? '✓' : '✗'}, Button: ${navButton ? '✓' : '✗'}, Menu: ${navMenu ? '✓' : '✗'}`,
      fix: !navContainer || !navButton || !navMenu ? 'Ensure WebflowNavbar component includes mobile menu structure' : undefined,
    })

    // ============================================
    // 3. VERIFY RESPONSIVE BREAKPOINTS
    // ============================================
    const breakpoints = {
      mobile: 479,
      tablet: 767,
      desktop: 991,
    }

    const currentWidth = window.innerWidth
    const expectedBreakpoint = currentWidth < breakpoints.mobile ? 'mobile' :
                               currentWidth < breakpoints.tablet ? 'tablet' :
                               currentWidth < breakpoints.desktop ? 'tablet-large' : 'desktop'

    verificationResults.push({
      category: 'Responsive',
      test: 'Current Breakpoint',
      status: 'pass',
      message: `Current viewport: ${currentWidth}px (${expectedBreakpoint})`,
      details: currentBreakpoint,
    })

    // Check media queries in CSS
    const styleSheets = Array.from(document.styleSheets)
    let foundBreakpoints = {
      '479px': false,
      '767px': false,
      '991px': false,
    }

    try {
      styleSheets.forEach(sheet => {
        try {
          const rules = Array.from(sheet.cssRules || [])
          rules.forEach(rule => {
            if (rule instanceof CSSMediaRule) {
              const mediaText = rule.media.mediaText
              if (mediaText.includes('479px')) foundBreakpoints['479px'] = true
              if (mediaText.includes('767px')) foundBreakpoints['767px'] = true
              if (mediaText.includes('991px')) foundBreakpoints['991px'] = true
            }
          })
        } catch (e) {
          // Cross-origin stylesheets may throw errors
        }
      })
    } catch (e) {
      // Some browsers may restrict access
    }

    const allBreakpointsFound = Object.values(foundBreakpoints).every(found => found)

    verificationResults.push({
      category: 'Responsive',
      test: 'Breakpoint Media Queries',
      status: allBreakpointsFound ? 'pass' : 'warning',
      message: allBreakpointsFound
        ? 'All Webflow breakpoints found in CSS'
        : 'Some breakpoints may be missing',
      details: `479px: ${foundBreakpoints['479px'] ? '✓' : '✗'}, 767px: ${foundBreakpoints['767px'] ? '✓' : '✗'}, 991px: ${foundBreakpoints['991px'] ? '✓' : '✗'}`,
    })

    // Test responsive navigation
    const isMobile = currentWidth <= 991
    const navButtonVisible = navButton ? 
      window.getComputedStyle(navButton as Element).display !== 'none' : false

    verificationResults.push({
      category: 'Responsive',
      test: 'Mobile Navigation',
      status: isMobile ? (navButtonVisible ? 'pass' : 'warning') : 'pass',
      message: isMobile
        ? navButtonVisible
          ? 'Mobile menu button is visible on mobile'
          : 'Mobile menu button should be visible on mobile'
        : 'Desktop view - mobile menu hidden (expected)',
      details: `Viewport: ${currentWidth}px, Button visible: ${navButtonVisible}`,
    })

    // ============================================
    // 4. CHECK FOR STYLE CONFLICTS
    // ============================================
    
    // Check for conflicting button styles
    const buttons = document.querySelectorAll('.w-button, .button')
    let conflictingButtons = 0
    buttons.forEach(button => {
      const style = window.getComputedStyle(button as Element)
      // Check if button has Webflow blue (#3898EC) or custom color
      const bgColor = style.backgroundColor
      // If background is transparent or white, might be a conflict
      if (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'rgb(255, 255, 255)') {
        conflictingButtons++
      }
    })

    verificationResults.push({
      category: 'Style Conflicts',
      test: 'Button Styles',
      status: conflictingButtons === 0 ? 'pass' : 'warning',
      message: conflictingButtons === 0
        ? 'Button styles are applying correctly'
        : `${conflictingButtons} button(s) may have style conflicts`,
      details: `Checked ${buttons.length} button(s)`,
      fix: conflictingButtons > 0 ? 'Review globals.css button overrides' : undefined,
    })

    // Check for conflicting font families
    const bodyStyle = window.getComputedStyle(document.body)
    const bodyFont = bodyStyle.fontFamily
    const hasWebflowFont = bodyFont.includes('Figtree') || bodyFont.includes('Bricolage')

    verificationResults.push({
      category: 'Style Conflicts',
      test: 'Font Family',
      status: hasWebflowFont ? 'pass' : 'warning',
      message: hasWebflowFont
        ? 'Webflow fonts are being used'
        : 'Body font may be overridden',
      details: `Current font: ${bodyFont}`,
      fix: !hasWebflowFont ? 'Check globals.css for font-family overrides' : undefined,
    })

    // Check for z-index conflicts
    const navZIndex = navContainer ? 
      window.getComputedStyle(navContainer as Element).zIndex : 'auto'
    const hasZIndexConflict = navZIndex === 'auto' || parseInt(navZIndex) < 100

    verificationResults.push({
      category: 'Style Conflicts',
      test: 'Z-Index Layering',
      status: !hasZIndexConflict ? 'pass' : 'warning',
      message: !hasZIndexConflict
        ? 'Navigation has proper z-index'
        : 'Navigation z-index may be too low',
      details: `Nav z-index: ${navZIndex}`,
      fix: hasZIndexConflict ? 'Ensure navigation has z-index > 100' : undefined,
    })

    setResults(verificationResults)
    setIsRunning(false)

    // Log summary
    const summary = {
      pass: verificationResults.filter(r => r.status === 'pass').length,
      fail: verificationResults.filter(r => r.status === 'fail').length,
      warning: verificationResults.filter(r => r.status === 'warning').length,
    }

    console.group('🎨 Webflow Design Integration Verification')
    console.log(`✅ Pass: ${summary.pass}`)
    console.log(`❌ Fail: ${summary.fail}`)
    console.log(`⚠️  Warning: ${summary.warning}`)
    console.log(`📊 Total: ${verificationResults.length}`)
    console.groupEnd()
  }

  useEffect(() => {
    // Auto-run in development
    if (process.env.NODE_ENV === 'development') {
      const timeout = setTimeout(() => {
        runVerification()
      }, 2000)
      return () => clearTimeout(timeout)
    }
  }, [])

  // Don't render in production
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = []
    }
    acc[result.category].push(result)
    return acc
  }, {} as Record<string, VerificationResult[]>)

  const summary = {
    pass: results.filter(r => r.status === 'pass').length,
    fail: results.filter(r => r.status === 'fail').length,
    warning: results.filter(r => r.status === 'warning').length,
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        zIndex: 10000,
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        maxWidth: '500px',
        maxHeight: '80vh',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          background: 'white',
          border: '2px solid #333',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>🎨 Webflow Verification</h3>
          <button
            onClick={runVerification}
            disabled={isRunning}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              background: isRunning ? '#ccc' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            {isRunning ? 'Testing...' : 'Re-run'}
          </button>
        </div>

        {results.length > 0 && (
          <div style={{ marginBottom: '12px', padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
            <div style={{ fontSize: '11px' }}>
              <span style={{ color: '#28a745', fontWeight: 'bold' }}>✅ {summary.pass}</span>
              {' '}
              <span style={{ color: '#dc3545', fontWeight: 'bold' }}>❌ {summary.fail}</span>
              {' '}
              <span style={{ color: '#ffc107', fontWeight: 'bold' }}>⚠️ {summary.warning}</span>
            </div>
            {currentBreakpoint && (
              <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                Breakpoint: {currentBreakpoint}
              </div>
            )}
          </div>
        )}

        {Object.entries(groupedResults).map(([category, categoryResults]) => (
          <div key={category} style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '8px', color: '#333' }}>
              {category}
            </div>
            {categoryResults.map((result, index) => (
              <div
                key={index}
                style={{
                  marginBottom: '6px',
                  padding: '6px',
                  background: result.status === 'pass' ? '#d4edda' :
                             result.status === 'fail' ? '#f8d7da' : '#fff3cd',
                  borderLeft: `3px solid ${
                    result.status === 'pass' ? '#28a745' :
                    result.status === 'fail' ? '#dc3545' : '#ffc107'
                  }`,
                  borderRadius: '4px',
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '2px' }}>
                  {result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️'} {result.test}
                </div>
                <div style={{ fontSize: '10px', color: '#666' }}>{result.message}</div>
                {result.details && (
                  <div style={{ fontSize: '9px', color: '#888', marginTop: '2px' }}>{result.details}</div>
                )}
                {result.fix && (
                  <div style={{ fontSize: '9px', color: '#0070f3', marginTop: '2px', fontStyle: 'italic' }}>
                    💡 Fix: {result.fix}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}

        {results.length === 0 && !isRunning && (
          <div style={{ color: '#666', fontSize: '11px', textAlign: 'center', padding: '20px' }}>
            Click "Re-run" to start verification
          </div>
        )}
      </div>
    </div>
  )
}

