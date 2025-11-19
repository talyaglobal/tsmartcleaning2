'use client'

import { useEffect, useState } from 'react'

interface AssetCheckResult {
  type: 'image' | 'css' | 'js' | 'font'
  path: string
  status: 'ok' | 'broken' | 'checking'
  element?: HTMLElement
}

/**
 * Component to check and fix broken asset paths in the homepage
 * Only runs in development mode
 */
export function AssetPathFixer() {
  const [assetResults, setAssetResults] = useState<AssetCheckResult[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const [fixedCount, setFixedCount] = useState(0)

  const checkAssets = async () => {
    setIsChecking(true)
    const results: AssetCheckResult[] = []

    // Check images
    const images = document.querySelectorAll('img[src]')
    const imagePromises: Promise<void>[] = []

    images.forEach((img) => {
      const imgElement = img as HTMLImageElement
      const src = imgElement.src
      // Extract relative path from full URL
      const url = new URL(src, window.location.origin)
      const relativePath = url.pathname

      const promise = new Promise<void>((resolve) => {
        // Check if image is already loaded
        if (imgElement.complete) {
          if (imgElement.naturalHeight === 0 || imgElement.naturalWidth === 0) {
            results.push({
              type: 'image',
              path: relativePath,
              status: 'broken',
              element: imgElement,
            })
          } else {
            results.push({
              type: 'image',
              path: relativePath,
              status: 'ok',
            })
          }
          resolve()
        } else {
          // Wait for image to load
          imgElement.onload = () => {
            if (imgElement.naturalHeight === 0 || imgElement.naturalWidth === 0) {
              results.push({
                type: 'image',
                path: relativePath,
                status: 'broken',
                element: imgElement,
              })
            } else {
              results.push({
                type: 'image',
                path: relativePath,
                status: 'ok',
              })
            }
            resolve()
          }
          imgElement.onerror = () => {
            results.push({
              type: 'image',
              path: relativePath,
              status: 'broken',
              element: imgElement,
            })
            resolve()
          }
          // Timeout after 5 seconds
          setTimeout(() => {
            if (!imgElement.complete) {
              results.push({
                type: 'image',
                path: relativePath,
                status: 'broken',
                element: imgElement,
              })
            }
            resolve()
          }, 5000)
        }
      })
      imagePromises.push(promise)
    })

    // Check CSS files
    const cssLinks = document.querySelectorAll('link[rel="stylesheet"]') as NodeListOf<HTMLLinkElement>
    const cssPromises = Array.from(cssLinks).map((link) => {
      const href = link.href
      const url = new URL(href, window.location.origin)
      const relativePath = url.pathname

      return fetch(href, { method: 'HEAD' })
        .then((response) => {
          results.push({
            type: 'css',
            path: relativePath,
            status: response.ok ? 'ok' : 'broken',
            element: link,
          })
        })
        .catch(() => {
          results.push({
            type: 'css',
            path: relativePath,
            status: 'broken',
            element: link,
          })
        })
    })

    // Check JS files
    const jsScripts = document.querySelectorAll('script[src]') as NodeListOf<HTMLScriptElement>
    const jsPromises = Array.from(jsScripts).map((script) => {
      const src = script.src
      const url = new URL(src, window.location.origin)
      const relativePath = url.pathname

      return fetch(src, { method: 'HEAD' })
        .then((response) => {
          results.push({
            type: 'js',
            path: relativePath,
            status: response.ok ? 'ok' : 'broken',
            element: script,
          })
        })
        .catch(() => {
          results.push({
            type: 'js',
            path: relativePath,
            status: 'broken',
            element: script,
          })
        })
    })

    // Wait for all checks to complete
    await Promise.all([...imagePromises, ...cssPromises, ...jsPromises])

    setAssetResults(results)
    setIsChecking(false)

    // Log results
    const broken = results.filter((r) => r.status === 'broken')
    const ok = results.filter((r) => r.status === 'ok')

    console.group('🔍 Asset Path Check Results')
    console.log(`✅ OK: ${ok.length}`)
    console.log(`❌ Broken: ${broken.length}`)
    if (broken.length > 0) {
      console.group('Broken Assets:')
      broken.forEach((asset) => {
        console.error(`${asset.type.toUpperCase()}: ${asset.path}`)
      })
      console.groupEnd()
    }
    console.groupEnd()
  }

  const fixAssetPaths = () => {
    let fixed = 0

    assetResults.forEach((result) => {
      if (result.status === 'broken' && result.element) {
        const originalPath = result.path
        // Try to fix common path issues
        let fixedPath = originalPath

        // If path doesn't start with /, add it
        if (!fixedPath.startsWith('/')) {
          fixedPath = '/' + fixedPath
        }

        // Fix common path patterns
        // images/ -> /images/
        fixedPath = fixedPath.replace(/^images\//, '/images/')
        // css/ -> /css/
        fixedPath = fixedPath.replace(/^css\//, '/css/')
        // js/ -> /js/
        fixedPath = fixedPath.replace(/^js\//, '/js/')

        // Only update if path changed
        if (fixedPath !== originalPath) {
          if (result.type === 'image' && result.element instanceof HTMLImageElement) {
            result.element.src = fixedPath
            fixed++
          } else if (result.type === 'css' && result.element instanceof HTMLLinkElement) {
            result.element.href = fixedPath
            fixed++
          } else if (result.type === 'js' && result.element instanceof HTMLScriptElement) {
            result.element.src = fixedPath
            fixed++
          }
        }
      }
    })

    setFixedCount(fixed)
    if (fixed > 0) {
      console.log(`🔧 Fixed ${fixed} asset path(s)`)
      // Re-check after fixing
      setTimeout(() => {
        checkAssets()
      }, 1000)
    }
  }

  useEffect(() => {
    // Auto-run check after page loads
    if (process.env.NODE_ENV === 'development') {
      const timeout = setTimeout(() => {
        checkAssets()
      }, 2000)

      return () => clearTimeout(timeout)
    }
  }, [])

  // Don't render in production
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const brokenAssets = assetResults.filter((r) => r.status === 'broken')
  const okAssets = assetResults.filter((r) => r.status === 'ok')

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        zIndex: 10001,
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        maxWidth: '400px',
        maxHeight: '500px',
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
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>🔍 Asset Path Checker</h3>
          <button
            onClick={checkAssets}
            disabled={isChecking}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              cursor: isChecking ? 'not-allowed' : 'pointer',
              background: isChecking ? '#ccc' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            {isChecking ? 'Checking...' : 'Re-check'}
          </button>
        </div>

        {assetResults.length > 0 && (
          <div style={{ marginBottom: '12px', padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
            <div style={{ fontSize: '11px' }}>
              <span style={{ color: '#28a745', fontWeight: 'bold' }}>✅ {okAssets.length}</span>
              {' '}
              <span style={{ color: '#dc3545', fontWeight: 'bold' }}>❌ {brokenAssets.length}</span>
            </div>
            {fixedCount > 0 && (
              <div style={{ fontSize: '10px', color: '#0070f3', marginTop: '4px' }}>
                🔧 Fixed {fixedCount} path(s)
              </div>
            )}
          </div>
        )}

        {brokenAssets.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <button
              onClick={fixAssetPaths}
              style={{
                width: '100%',
                padding: '6px',
                fontSize: '11px',
                cursor: 'pointer',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
              }}
            >
              🔧 Try to Fix Broken Paths
            </button>
          </div>
        )}

        {brokenAssets.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '8px', color: '#dc3545' }}>
              Broken Assets:
            </div>
            {brokenAssets.map((asset, index) => (
              <div
                key={index}
                style={{
                  marginBottom: '4px',
                  padding: '6px',
                  background: '#f8d7da',
                  borderLeft: '3px solid #dc3545',
                  borderRadius: '4px',
                  fontSize: '10px',
                }}
              >
                <div style={{ fontWeight: 'bold' }}>
                  {asset.type.toUpperCase()}: {asset.path}
                </div>
              </div>
            ))}
          </div>
        )}

        {assetResults.length === 0 && !isChecking && (
          <div style={{ color: '#666', fontSize: '11px', textAlign: 'center', padding: '20px' }}>
            Click "Re-check" to verify asset paths
          </div>
        )}
      </div>
    </div>
  )
}

