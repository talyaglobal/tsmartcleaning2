#!/usr/bin/env tsx
/**
 * Script to fix Next.js 15 Promise-based params in route handlers
 * This script updates all route handlers to use Promise<Params> instead of Params
 */

import { readFileSync, writeFileSync } from 'fs'
import { glob } from 'glob'
import path from 'path'

const routeFiles = glob.sync('app/api/**/route.ts', { cwd: process.cwd() })

let fixedCount = 0
let errorCount = 0

for (const file of routeFiles) {
  try {
    const filePath = path.join(process.cwd(), file)
    let content = readFileSync(filePath, 'utf-8')
    let modified = false

    // Pattern 1: { params }: { params: { id: string } }
    // Replace with: { params }: { params: Promise<{ id: string }> }
    const pattern1 = /\{\s*params\s*\}\s*:\s*\{\s*params:\s*\{([^}]+)\}\s*\}/g
    const matches1 = [...content.matchAll(pattern1)]
    
    for (const match of matches1) {
      const paramDef = match[1]
      const oldPattern = match[0]
      const newPattern = `{ params }: { params: Promise<{${paramDef}}> }`
      
      if (!oldPattern.includes('Promise')) {
        content = content.replace(oldPattern, newPattern)
        modified = true
      }
    }

    // Pattern 2: Extract params and await them
    // Find: const { id } = params
    // Replace with: const { id } = await params
    const pattern2 = /const\s+\{([^}]+)\}\s*=\s*params\s*[;\n]/g
    const matches2 = [...content.matchAll(pattern2)]
    
    for (const match of matches2) {
      const vars = match[1]
      const oldPattern = match[0]
      const newPattern = `const { ${vars} } = await params\n`
      
      if (!oldPattern.includes('await')) {
        content = content.replace(oldPattern, newPattern)
        modified = true
      }
    }

    // Pattern 3: Direct params access like params.id
    // This is trickier - we need to await params first
    // Let's check if params is used directly without await
    if (content.includes('params.') && !content.includes('await params')) {
      // Find function signatures that use params
      const funcPattern = /export\s+(async\s+)?function\s+(\w+)\s*\([^)]*params[^)]*\)\s*\{/g
      const funcMatches = [...content.matchAll(funcPattern)]
      
      for (const funcMatch of funcMatches) {
        const funcName = funcMatch[2]
        // Check if params is accessed directly in the function body
        const funcBodyStart = funcMatch.index! + funcMatch[0].length
        const nextFuncMatch = content.indexOf('export', funcBodyStart)
        const funcBody = nextFuncMatch > 0 
          ? content.substring(funcBodyStart, nextFuncMatch)
          : content.substring(funcBodyStart)
        
        // If params is accessed directly (params.id, params.slug, etc.)
        if (funcBody.match(/params\.\w+/) && !funcBody.includes('await params')) {
          // Find the first use of params and add await before it
          const firstParamUse = funcBody.match(/params\.\w+/)
          if (firstParamUse) {
            // We need to add const { ... } = await params at the start of the function
            const tryMatch = funcBody.match(/try\s*\{/)
            if (tryMatch) {
              const tryIndex = funcBodyStart + funcBody.indexOf('try {') + 5
              const paramNames = [...funcBody.matchAll(/params\.(\w+)/g)].map(m => m[1])
              const uniqueParams = [...new Set(paramNames)]
              if (uniqueParams.length > 0) {
                const awaitParams = `    const { ${uniqueParams.join(', ')} } = await params\n`
                content = content.slice(0, tryIndex) + '\n' + awaitParams + content.slice(tryIndex)
                // Replace all params.id with just id
                uniqueParams.forEach(param => {
                  const regex = new RegExp(`params\\.${param}\\b`, 'g')
                  content = content.replace(regex, param)
                })
                modified = true
              }
            }
          }
        }
      }
    }

    if (modified) {
      writeFileSync(filePath, content, 'utf-8')
      fixedCount++
      console.log(`✓ Fixed: ${file}`)
    }
  } catch (error) {
    console.error(`✗ Error fixing ${file}:`, error)
    errorCount++
  }
}

console.log(`\nFixed ${fixedCount} files, ${errorCount} errors`)

