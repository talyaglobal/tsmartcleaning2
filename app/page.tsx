import { readFileSync } from 'fs'
import { join } from 'path'
import { WebflowScripts } from '@/components/WebflowScripts'
import { AnchorLinkHandler } from '@/components/marketing/AnchorLinkHandler'
import { HomepageVerification } from '@/components/marketing/HomepageVerification'

export default function HomePage() {
  // Read the static HTML file
  const htmlPath = join(process.cwd(), 'index.html')
  let htmlContent = ''
  let bodyContent = ''
  
  try {
    htmlContent = readFileSync(htmlPath, 'utf-8')
    // Extract body content (between <body> and </body>)
    const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
    if (bodyMatch) {
      bodyContent = bodyMatch[1]
      // Remove script tags from body content since we're loading them separately via Next.js Script
      // This prevents duplicate script loading
      bodyContent = bodyContent.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      // Remove navbar from body content since it's already rendered in layout.tsx via WebflowNavbar
      // This prevents duplicate header/navbar
      // Match from <div class="nav"> to just before the next <header> tag
      // Use a more robust approach: match everything from nav div start to header start
      const navStartIndex = bodyContent.indexOf('<div class="nav">')
      const headerStartIndex = bodyContent.indexOf('<header')
      if (navStartIndex !== -1 && headerStartIndex !== -1 && navStartIndex < headerStartIndex) {
        bodyContent = bodyContent.substring(0, navStartIndex) + bodyContent.substring(headerStartIndex)
      }
    }
  } catch (error) {
    console.error('Error reading index.html:', error)
    // Fallback to marketing page if HTML file not found
    return <div>Loading...</div>
  }

  return (
    <>
      <AnchorLinkHandler />
      <HomepageVerification />
      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
      <WebflowScripts />
    </>
  )
}
