#!/usr/bin/env tsx
/**
 * API Documentation Generator
 * 
 * Scans all API routes and generates comprehensive documentation
 * including new endpoints, parameters, and authentication requirements.
 */

import { readFile, writeFile, readdir } from 'fs/promises'
import { join } from 'path'
import { parse } from 'path'

interface ApiEndpoint {
  path: string
  methods: string[]
  file: string
  hasAuth: boolean
  authType?: string
  parameters?: string[]
  description?: string
  isPublic?: boolean
}

interface ApiGroup {
  name: string
  endpoints: ApiEndpoint[]
}

const results: ApiEndpoint[] = []

async function findApiRoutes(dir: string, basePath = ''): Promise<void> {
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      
      if (entry.isDirectory()) {
        // Handle dynamic routes [id], [slug], etc.
        const dirName = entry.name.startsWith('[') && entry.name.endsWith(']') 
          ? `:${entry.name.slice(1, -1)}` 
          : entry.name
        
        await findApiRoutes(fullPath, `${basePath}/${dirName}`)
      } else if (entry.name === 'route.ts') {
        await analyzeRoute(fullPath, basePath)
      }
    }
  } catch (error) {
    console.warn(`Could not read directory ${dir}:`, error)
  }
}

async function analyzeRoute(filePath: string, apiPath: string): Promise<void> {
  try {
    const content = await readFile(filePath, 'utf-8')
    
    // Extract HTTP methods
    const methods: string[] = []
    const methodRegex = /export\s+(const\s+)?(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\s*=/g
    let match
    while ((match = methodRegex.exec(content)) !== null) {
      methods.push(match[2])
    }
    
    // Also check for async function exports
    const asyncMethodRegex = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)/g
    while ((match = asyncMethodRegex.exec(content)) !== null) {
      if (!methods.includes(match[1])) {
        methods.push(match[1])
      }
    }
    
    // Check for authentication
    const hasWithAuth = content.includes('withAuth') || 
                       content.includes('withAuthAndParams') ||
                       content.includes('withRootAdmin')
    
    const hasManualAuth = content.includes('requireAuth') ||
                         content.includes('requireAdmin') ||
                         content.includes('getUser(') ||
                         content.includes('requireRole')
    
    const hasAuth = hasWithAuth || hasManualAuth
    
    // Determine auth type
    let authType: string | undefined
    if (content.includes('withRootAdmin') || content.includes('requireRootAdmin')) {
      authType = 'root-admin'
    } else if (content.includes('requireAdmin') || content.includes('requireAdmin: true')) {
      authType = 'admin'
    } else if (hasAuth) {
      authType = 'user'
    }
    
    // Check if it's explicitly public
    const isPublic = content.includes('// Public') || 
                    content.includes('// No auth required') ||
                    !hasAuth
    
    // Extract parameters from request body or query params
    const parameters: string[] = []
    
    // Look for destructuring from request.json()
    const bodyParamsRegex = /const\s*\{\s*([^}]+)\s*\}\s*=\s*await\s+request\.json\(\)/g
    while ((match = bodyParamsRegex.exec(content)) !== null) {
      const params = match[1].split(',').map(p => p.trim())
      parameters.push(...params)
    }
    
    // Look for query parameters
    const queryParamsRegex = /searchParams\.get\(['"`]([^'"`]+)['"`]\)/g
    while ((match = queryParamsRegex.exec(content)) !== null) {
      parameters.push(`${match[1]} (query)`)
    }
    
    // Extract description from comments
    let description: string | undefined
    const descriptionMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\s*\n/s)
    if (descriptionMatch) {
      description = descriptionMatch[1].trim()
    }
    
    if (methods.length > 0) {
      results.push({
        path: apiPath || '/',
        methods,
        file: filePath,
        hasAuth,
        authType,
        parameters: parameters.length > 0 ? parameters : undefined,
        description,
        isPublic
      })
    }
  } catch (error) {
    console.warn(`Could not analyze route ${filePath}:`, error)
  }
}

function groupEndpoints(endpoints: ApiEndpoint[]): ApiGroup[] {
  const groups: Record<string, ApiEndpoint[]> = {}
  
  for (const endpoint of endpoints) {
    const pathParts = endpoint.path.split('/').filter(Boolean)
    const groupName = pathParts[0] || 'root'
    
    if (!groups[groupName]) {
      groups[groupName] = []
    }
    groups[groupName].push(endpoint)
  }
  
  return Object.entries(groups)
    .map(([name, endpoints]) => ({ name, endpoints }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

function formatEndpointPath(path: string): string {
  return `/api${path}`.replace(/\/+/g, '/')
}

function generateMarkdown(groups: ApiGroup[]): string {
  const now = new Date().toISOString().split('T')[0]
  
  let markdown = `# API Documentation

**Last Updated:** ${now}  
**Base URL:** \`/api\`  
**Total Endpoints:** ${results.length}  
**Authentication:** Most endpoints require authentication via Supabase session tokens

---

## Table of Contents

`
  
  // Generate table of contents
  for (const group of groups) {
    markdown += `${groups.indexOf(group) + 1}. [${group.name.charAt(0).toUpperCase() + group.name.slice(1)}](#${group.name.toLowerCase().replace(/[^a-z0-9]/g, '-')})\n`
  }
  
  markdown += '\n---\n\n'
  
  // Generate sections for each group
  for (const group of groups) {
    markdown += `## ${group.name.charAt(0).toUpperCase() + group.name.slice(1)}\n\n`
    
    // Sort endpoints by path
    const sortedEndpoints = group.endpoints.sort((a, b) => a.path.localeCompare(b.path))
    
    for (const endpoint of sortedEndpoints) {
      const fullPath = formatEndpointPath(endpoint.path)
      const methodsStr = endpoint.methods.join(', ')
      
      markdown += `### ${methodsStr} \`${fullPath}\`\n\n`
      
      if (endpoint.description) {
        markdown += `${endpoint.description}\n\n`
      }
      
      // Authentication info
      if (endpoint.hasAuth) {
        const authLevel = endpoint.authType === 'root-admin' ? 'Root Admin' : 
                         endpoint.authType === 'admin' ? 'Admin' : 'User'
        markdown += `**Authentication:** ${authLevel} Required\n\n`
      } else if (endpoint.isPublic) {
        markdown += `**Authentication:** None (Public endpoint)\n\n`
      }
      
      // Parameters
      if (endpoint.parameters && endpoint.parameters.length > 0) {
        markdown += `**Parameters:**\n`
        for (const param of endpoint.parameters) {
          markdown += `- \`${param}\`\n`
        }
        markdown += '\n'
      }
      
      // Standard response format
      markdown += `**Response Format:** JSON\n\n`
      
      // Status codes
      markdown += `**Status Codes:**\n`
      markdown += `- \`200\` - Success\n`
      if (endpoint.methods.includes('POST')) {
        markdown += `- \`201\` - Created\n`
      }
      markdown += `- \`400\` - Bad Request\n`
      if (endpoint.hasAuth) {
        markdown += `- \`401\` - Unauthorized\n`
        markdown += `- \`403\` - Forbidden\n`
      }
      markdown += `- \`404\` - Not Found\n`
      markdown += `- \`500\` - Internal Server Error\n\n`
      
      markdown += '---\n\n'
    }
  }
  
  // Add common sections
  markdown += `## Authentication & Authorization

Most endpoints require authentication via Supabase session tokens. Include the session token in the request:

**Headers:**
\`\`\`
Authorization: Bearer <session-token>
\`\`\`

**Authentication Levels:**
- **Public:** No authentication required
- **User:** Requires valid user session
- **Admin:** Requires admin privileges (roles: PARTNER_ADMIN, TSMART_TEAM, CLEANING_COMPANY)
- **Root Admin:** Requires root admin access with OTP verification

---

## Error Handling

All API endpoints follow a consistent error response format:

\`\`\`json
{
  "error": "Error message description"
}
\`\`\`

**Common Error Codes:**
- \`400\` - Bad Request (missing or invalid parameters)
- \`401\` - Unauthorized (authentication required)
- \`403\` - Forbidden (insufficient permissions)
- \`404\` - Not Found
- \`409\` - Conflict (e.g., duplicate resource)
- \`429\` - Too Many Requests (rate limited)
- \`500\` - Internal Server Error

---

## Rate Limiting

Public endpoints are rate-limited to prevent abuse. Rate limit headers are included in responses:

\`\`\`
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
\`\`\`

---

## Multi-Tenant Support

The API supports multi-tenant architecture. Tenant context is resolved from:
1. \`x-tenant-id\` header (highest priority)
2. \`tenantId\` query parameter
3. Subdomain from \`Host\` header (e.g., \`acme.example.com\` → tenant \`acme\`)

Most endpoints automatically scope data to the resolved tenant.

---

## Security

- All authenticated endpoints use Row Level Security (RLS) policies
- Ownership verification is enforced for user-specific resources
- Admin routes require proper role verification
- Input validation and sanitization is applied
- CORS policies are enforced
- Rate limiting prevents abuse

---

## Testing

API endpoints can be tested using:
- The built-in test suite (\`npm run test:api\`)
- Postman/Insomnia collections
- cURL commands
- The verification scripts in \`/scripts\`

**Example cURL:**
\`\`\`bash
curl -X GET "https://yourdomain.com/api/services" \\
  -H "Authorization: Bearer <token>"
\`\`\`

---

## Support

For API support:
1. Check the error message in the response
2. Verify request format and required parameters
3. Confirm authentication credentials
4. Review the endpoint documentation above
5. Check the security audit reports for known issues

**Documentation Generated:** ${now}
**Total Endpoints Documented:** ${results.length}
`

  return markdown
}

async function main() {
  console.log('🔍 Scanning API routes...')
  
  const apiDir = join(process.cwd(), 'app/api')
  await findApiRoutes(apiDir)
  
  console.log(`📊 Found ${results.length} API endpoints`)
  
  // Group endpoints
  const groups = groupEndpoints(results)
  
  // Generate statistics
  const authStats = {
    public: results.filter(r => r.isPublic).length,
    user: results.filter(r => r.authType === 'user').length,
    admin: results.filter(r => r.authType === 'admin').length,
    rootAdmin: results.filter(r => r.authType === 'root-admin').length,
  }
  
  console.log(`📈 Authentication breakdown:`)
  console.log(`  - Public endpoints: ${authStats.public}`)
  console.log(`  - User-level auth: ${authStats.user}`)
  console.log(`  - Admin-level auth: ${authStats.admin}`)
  console.log(`  - Root admin auth: ${authStats.rootAdmin}`)
  
  // Generate documentation
  const markdown = generateMarkdown(groups)
  
  // Write to file
  const outputPath = join(process.cwd(), 'docs/API_DOCUMENTATION.md')
  await writeFile(outputPath, markdown)
  
  console.log(`📝 Updated API documentation: ${outputPath}`)
  
  // Generate summary report
  console.log(`\n📋 Groups found:`)
  for (const group of groups) {
    console.log(`  - ${group.name}: ${group.endpoints.length} endpoints`)
  }
}

main().catch(console.error)