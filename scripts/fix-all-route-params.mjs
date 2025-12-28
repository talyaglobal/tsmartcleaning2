#!/usr/bin/env node
/**
 * Script to fix Next.js 15 Promise-based params in all route handlers
 */

import { readFileSync, writeFileSync } from 'fs'
import { glob } from 'glob'
import path from 'path'

const routeFiles = glob.sync('app/api/**/route.ts')

let fixedCount = 0
let errorCount = 0

for (const file of routeFiles) {
  try {
    const filePath = path.join(process.cwd(), file)
    let content = readFileSync(filePath, 'utf-8')
    let modified = false

    // Pattern 1: Fix function signatures
    // { params }: { params: { id: string } } -> { params }: { params: Promise<{ id: string }> }
    const signaturePattern = /\{\s*params\s*\}\s*:\s*\{\s*params:\s*\{([^}]+)\}\s*\}(?!\s*Promise)/g
    if (signaturePattern.test(content)) {
      content = content.replace(signaturePattern, (match, paramDef) => {
        if (!match.includes('Promise')) {
          modified = true
          return `{ params }: { params: Promise<{${paramDef}}> }`
        }
        return match
      })
    }

    // Pattern 2: Fix params destructuring - add await
    // const { id } = params -> const { id } = await params
    const destructurePattern = /const\s+\{([^}]+)\}\s*=\s*params\s*[;\n]/g
    if (destructurePattern.test(content)) {
      content = content.replace(destructurePattern, (match) => {
        if (!match.includes('await')) {
          modified = true
          return match.replace('= params', '= await params')
        }
        return match
      })
    }

    // Pattern 3: Fix direct params access (params.id, params.slug, etc.)
    // This requires adding await params at the start of the function
    const directAccessPattern = /params\.\w+/g
    if (directAccessPattern.test(content) && !content.includes('await params')) {
      // Find all export functions
      const funcPattern = /export\s+(async\s+)?function\s+(\w+)\s*\([^)]*params[^)]*\)\s*\{/g
      const funcMatches = [...content.matchAll(funcPattern)]
      
      for (const funcMatch of funcMatches) {
        const funcStart = funcMatch.index
        const funcBodyStart = funcStart + funcMatch[0].length
        
        // Find the function body (until next export or end of file)
        const nextExport = content.indexOf('export', funcBodyStart)
        const funcBody = nextExport > 0 
          ? content.substring(funcBodyStart, nextExport)
          : content.substring(funcBodyStart)
        
        // Check if params is accessed directly
        if (funcBody.match(/params\.\w+/) && !funcBody.includes('await params')) {
          // Extract param names from direct access
          const paramMatches = [...funcBody.matchAll(/params\.(\w+)/g)]
          const paramNames = [...new Set(paramMatches.map(m => m[1]))]
          
          if (paramNames.length > 0) {
            // Find try block or first line after {
            const tryIndex = funcBody.indexOf('try {')
            const insertPoint = tryIndex > 0 
              ? funcBodyStart + tryIndex + 5
              : funcBodyStart + 1
            
            // Add await params
            const awaitLine = `    const { ${paramNames.join(', ')} } = await params\n`
            content = content.slice(0, insertPoint) + '\n' + awaitLine + content.slice(insertPoint)
            
            // Replace all params.paramName with just paramName
            paramNames.forEach(param => {
              const regex = new RegExp(`\\bparams\\.${param}\\b`, 'g')
              content = content.replace(regex, param)
            })
            
            modified = true
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

console.log(`\n✓ Fixed ${fixedCount} files`)
if (errorCount > 0) {
  console.log(`✗ ${errorCount} errors`)
}

