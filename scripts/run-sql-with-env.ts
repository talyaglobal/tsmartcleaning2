#!/usr/bin/env tsx
/**
 * Execute SQL script against Supabase using environment variables
 * 
 * Usage: tsx scripts/run-sql-with-env.ts <sql-file>
 * Example: tsx scripts/run-sql-with-env.ts scripts/14_create_missing_tables.sql
 * 
 * Required environment variables:
 * - SUPABASE_URL (e.g., https://xxxxx.supabase.co)
 * - SUPABASE_DB_PASSWORD (database password from Supabase Dashboard)
 * 
 * Optional:
 * - SUPABASE_DB_HOST (defaults to extracting from SUPABASE_URL)
 * - SUPABASE_DB_PORT (defaults to 5432)
 * - SUPABASE_DB_USER (defaults to postgres)
 * - SUPABASE_DB_NAME (defaults to postgres)
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import { execSync } from 'child_process'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

function extractHostFromUrl(url: string): string | null {
  try {
    // Extract project ref from URL like https://xxxxx.supabase.co
    const match = url.match(/https?:\/\/([^.]+)\.supabase\.co/)
    if (match && match[1]) {
      const projectRef = match[1]
      // Try direct connection first
      return `db.${projectRef}.supabase.co`
    }
    return null
  } catch {
    return null
  }
}

function getConnectionOptions() {
  const supabaseUrl = process.env.SUPABASE_URL
  const dbPassword = process.env.SUPABASE_DB_PASSWORD
  const fs = require('fs')
  const path = require('path')
  
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL environment variable is required')
  }
  
  if (!dbPassword) {
    throw new Error('SUPABASE_DB_PASSWORD environment variable is required')
  }

  // Allow manual override of host
  if (process.env.SUPABASE_DB_HOST) {
    return {
      host: process.env.SUPABASE_DB_HOST,
      port: process.env.SUPABASE_DB_PORT || '5432',
      user: process.env.SUPABASE_DB_USER || 'postgres',
      database: process.env.SUPABASE_DB_NAME || 'postgres',
      password: dbPassword,
    }
  }

  // Try to read pooler URL from supabase/.temp/pooler-url if it exists
  const poolerUrlPath = path.resolve(process.cwd(), 'supabase', '.temp', 'pooler-url')
  if (fs.existsSync(poolerUrlPath)) {
    try {
      const poolerUrl = fs.readFileSync(poolerUrlPath, 'utf-8').trim()
      // Parse connection string: postgresql://user@host:port/database
      const match = poolerUrl.match(/postgresql:\/\/([^@]+)@([^:]+):(\d+)\/(.+)/)
      if (match) {
        const [, user, host, port, database] = match
        return {
          host,
          port,
          user,
          database,
          password: dbPassword,
        }
      }
    } catch (e) {
      // Ignore errors reading pooler URL, fall back to extraction
    }
  }

  // Extract from URL (try direct connection)
  const host = extractHostFromUrl(supabaseUrl)
  if (!host) {
    throw new Error('Could not extract database host from SUPABASE_URL. Please set SUPABASE_DB_HOST manually.')
  }

  return {
    host,
    port: process.env.SUPABASE_DB_PORT || '5432',
    user: process.env.SUPABASE_DB_USER || 'postgres',
    database: process.env.SUPABASE_DB_NAME || 'postgres',
    password: dbPassword,
  }
}


async function main() {
  const sqlFile = process.argv[2]

  if (!sqlFile) {
    console.error('❌ Error: Please provide a SQL file path')
    console.error('Usage: tsx scripts/run-sql-with-env.ts <sql-file>')
    console.error('Example: tsx scripts/run-sql-with-env.ts scripts/14_create_missing_tables.sql')
    process.exit(1)
  }

  try {
    // Check for required environment variables
    console.log('🔍 Checking environment variables...\n')
    
    const supabaseUrl = process.env.SUPABASE_URL
    const dbPassword = process.env.SUPABASE_DB_PASSWORD

    if (!supabaseUrl) {
      console.error('❌ Missing SUPABASE_URL environment variable')
      console.error('   Set it in .env.local or .env file')
      console.error('   Example: SUPABASE_URL=https://xxxxx.supabase.co')
      process.exit(1)
    }

    if (!dbPassword) {
      console.error('❌ Missing SUPABASE_DB_PASSWORD environment variable')
      console.error('   Set it in .env.local or .env file')
      console.error('   You can find it in Supabase Dashboard → Settings → Database')
      console.error('   Example: SUPABASE_DB_PASSWORD=your-database-password')
      process.exit(1)
    }

    console.log('✅ Environment variables found')
    console.log(`   SUPABASE_URL: ${supabaseUrl}`)
    console.log(`   SUPABASE_DB_PASSWORD: ${'*'.repeat(dbPassword.length)}\n`)

    // Get connection options
    const connOptions = getConnectionOptions()
    console.log(`🔌 Connecting to: ${connOptions.host}:${connOptions.port}`)
    console.log(`   Database: ${connOptions.database}`)
    console.log(`   User: ${connOptions.user}\n`)

    // Read SQL file
    console.log(`📖 Reading SQL file: ${sqlFile}\n`)
    const sqlPath = resolve(process.cwd(), sqlFile)
    const sql = readFileSync(sqlPath, 'utf-8')

    // Execute SQL using psql
    console.log('🚀 Executing SQL script...\n')
    
    try {
      // Execute psql with connection parameters
      // Using PGPASSWORD environment variable to avoid password prompt
      execSync(
        `psql -h "${connOptions.host}" -p "${connOptions.port}" -U "${connOptions.user}" -d "${connOptions.database}" -f "${sqlPath}"`,
        {
          stdio: 'inherit',
          env: {
            ...process.env,
            PGPASSWORD: connOptions.password,
          }
        }
      )

      console.log('\n✅ SQL script executed successfully!')
      
    } catch (error: any) {
      console.error('\n❌ Error executing SQL script:')
      
      if (error.message.includes('psql: command not found') || error.status === 127) {
        console.error('\n💡 psql is not installed or not in PATH')
        console.error('   Install PostgreSQL client tools:')
        console.error('   - macOS: brew install postgresql')
        console.error('   - Ubuntu/Debian: sudo apt-get install postgresql-client')
        console.error('   - Windows: Download from https://www.postgresql.org/download/')
        console.error('\n   Or use Method 1 (Supabase Dashboard) from README instead')
      } else if (error.message.includes('could not translate host name') || error.message.includes('nodename nor servname')) {
        console.error('\n💡 Cannot resolve database hostname. This usually means:')
        console.error('   1. The hostname format is incorrect')
        console.error('   2. Your project uses connection pooling')
        console.error('   3. Network/DNS issues\n')
        console.error('   To fix this:')
        console.error('   1. Go to Supabase Dashboard → Settings → Database')
        console.error('   2. Find "Connection string" section')
        console.error('   3. Copy the "URI" connection string')
        console.error('   4. Extract the hostname and set it manually:\n')
        console.error('      SUPABASE_DB_HOST=your-actual-hostname.supabase.co')
        console.error('      # Or for connection pooling:')
        console.error('      SUPABASE_DB_HOST=aws-0-us-east-1.pooler.supabase.com')
        console.error('      SUPABASE_DB_PORT=6543\n')
        console.error('   Then run the script again.')
        console.error('\n   Or use Method 1 (Supabase Dashboard SQL Editor) instead - it\'s easier!')
      } else {
        console.error(error.message)
        if (error.stderr) {
          console.error('\nError details:', error.stderr.toString())
        }
      }
      
      process.exit(1)
    }

  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`)
    if (error.code === 'ENOENT') {
      console.error(`   File not found: ${sqlFile}`)
    }
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('\n💥 Fatal error:', error)
  process.exit(1)
})

