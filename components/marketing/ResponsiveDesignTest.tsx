'use client'

import { useEffect, useState } from 'react'

/**
 * Component to help with manual responsive design testing
 * Shows current viewport size and allows quick switching between breakpoints
 * Only visible in development mode
 */
export function ResponsiveDesignTest() {
  const [viewport, setViewport] = useState({ width: 0, height: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const [preset, setPreset] = useState<string>('')

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return

    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    updateViewport()
    window.addEventListener('resize', updateViewport)

    return () => window.removeEventListener('resize', updateViewport)
  }, [])

  // Don't render in production
  if (process.env.NODE_ENV !== 'development') return null

  const breakpoints = {
    mobile: { width: 375, height: 667, label: 'Mobile (375px)' },
    'mobile-large': { width: 414, height: 896, label: 'Mobile Large (414px)' },
    tablet: { width: 768, height: 1024, label: 'Tablet (768px)' },
    'tablet-large': { width: 991, height: 1024, label: 'Tablet Large (991px)' },
    desktop: { width: 1200, height: 800, label: 'Desktop (1200px)' },
    'desktop-large': { width: 1920, height: 1080, label: 'Desktop Large (1920px)' },
  }

  const getBreakpointCategory = (width: number): string => {
    if (width < 768) return 'Mobile'
    if (width <= 991) return 'Tablet'
    return 'Desktop'
  }

  const category = getBreakpointCategory(viewport.width)

  const handlePresetClick = (key: string) => {
    setPreset(key)
    // Log to console for manual testing reference
    console.log(`📱 Responsive Test: ${breakpoints[key as keyof typeof breakpoints].label}`)
    console.log(`   Expected category: ${getBreakpointCategory(breakpoints[key as keyof typeof breakpoints].width)}`)
    console.log(`   Use browser DevTools to resize to ${breakpoints[key as keyof typeof breakpoints].width}px`)
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
      }}
    >
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          padding: '8px 12px',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 'bold',
        }}
      >
        {isVisible ? '📱 Hide' : '📱 Test'}
      </button>

      {isVisible && (
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            right: '0',
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '16px',
            minWidth: '280px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <div style={{ marginBottom: '12px', fontWeight: 'bold', fontSize: '14px' }}>
            Responsive Design Test
          </div>

          <div style={{ marginBottom: '16px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            <div>
              <strong>Viewport:</strong> {viewport.width} × {viewport.height}px
            </div>
            <div>
              <strong>Category:</strong>{' '}
              <span
                style={{
                  color:
                    category === 'Mobile'
                      ? '#e74c3c'
                      : category === 'Tablet'
                      ? '#f39c12'
                      : '#27ae60',
                  fontWeight: 'bold',
                }}
              >
                {category}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
              {category === 'Mobile' && 'Breakpoint: < 768px'}
              {category === 'Tablet' && 'Breakpoint: 768px - 991px'}
              {category === 'Desktop' && 'Breakpoint: > 991px'}
            </div>
          </div>

          <div style={{ marginBottom: '12px', fontWeight: 'bold', fontSize: '12px' }}>
            Quick Test Presets:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {Object.entries(breakpoints).map(([key, value]) => (
              <button
                key={key}
                onClick={() => handlePresetClick(key)}
                style={{
                  padding: '6px 10px',
                  backgroundColor: preset === key ? '#0070f3' : '#f0f0f0',
                  color: preset === key ? 'white' : '#333',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  textAlign: 'left',
                }}
              >
                {value.label}
              </button>
            ))}
          </div>

          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #eee', fontSize: '11px', color: '#666' }}>
            <div style={{ marginBottom: '8px', padding: '6px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
              <strong>📋 Full Testing Checklist:</strong>
              <div style={{ marginTop: '4px', fontSize: '10px' }}>
                See <code style={{ backgroundColor: '#fff', padding: '2px 4px', borderRadius: '2px' }}>docs/RESPONSIVE_DESIGN_MANUAL_TESTING_CHECKLIST.md</code> for comprehensive testing guide
              </div>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>How to Test:</strong>
            </div>
            <div style={{ marginLeft: '8px', marginBottom: '12px' }}>
              <div>1. Click a preset button above</div>
              <div>2. Open browser DevTools (F12)</div>
              <div>3. Use Device Toolbar (Ctrl+Shift+M / Cmd+Shift+M)</div>
              <div>4. Resize to the preset width</div>
              <div>5. Check the items below</div>
            </div>
            <div style={{ marginBottom: '4px' }}>
              <strong>Testing Checklist:</strong>
            </div>
            <div style={{ marginLeft: '8px' }}>
              <div style={{ marginBottom: '6px', fontWeight: 'bold', color: category === 'Mobile' ? '#e74c3c' : category === 'Tablet' ? '#f39c12' : '#27ae60' }}>
                {category} Testing:
              </div>
              {category === 'Mobile' && (
                <>
                  <div>• Navigation collapses to hamburger menu</div>
                  <div>• Mobile menu opens/closes correctly</div>
                  <div>• Images scale and load correctly</div>
                  <div>• Text is readable (no tiny fonts)</div>
                  <div>• Buttons are tappable (min 44×44px)</div>
                  <div>• No horizontal scroll</div>
                  <div>• Layout stacks vertically</div>
                  <div>• Touch targets are spaced properly</div>
                </>
              )}
              {category === 'Tablet' && (
                <>
                  <div>• Navigation adapts (may collapse or show partial menu)</div>
                  <div>• Images scale appropriately</div>
                  <div>• Layout uses 2-column grids where appropriate</div>
                  <div>• Text remains readable</div>
                  <div>• Buttons are easily clickable</div>
                  <div>• No horizontal scroll</div>
                  <div>• Content doesn't feel cramped</div>
                </>
              )}
              {category === 'Desktop' && (
                <>
                  <div>• Full navigation menu visible</div>
                  <div>• Images display at full size</div>
                  <div>• Multi-column layouts work</div>
                  <div>• Text is comfortable to read</div>
                  <div>• Hover states work on interactive elements</div>
                  <div>• Content uses available space efficiently</div>
                  <div>• No excessive white space</div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

