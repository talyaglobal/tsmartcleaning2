# Pre-Run Checklist

Before running `npm run dev`, verify these critical items:

## 🔴 Critical (Must Check Before First Run)

### 1. Environment Variables
- [ ] `.env` file exists in root with Supabase credentials
- [ ] `SUPABASE_URL` is set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set (if needed for server-side)

### 2. File Structure
- [ ] `index.html` exists in root directory
- [ ] `css/`, `images/`, `js/` folders exist in root
- [ ] `public/` folder contains Next.js public assets
- [ ] `app/`, `components/`, `lib/` directories exist in root

### 3. Dependencies
- [ ] Run `npm install` to ensure all dependencies are installed
- [ ] Check for any missing packages

## 🟡 High Priority (Check After First Run)

### 4. Homepage Rendering
- [ ] Homepage (/) loads without errors
- [ ] Static HTML content displays correctly
- [ ] No blank page or error messages

### 5. CSS Loading
- [ ] All CSS files load (check Network tab):
  - `/css/normalize.css`
  - `/css/webflow.css`
  - `/css/tsmartcleaning-ff34e6.webflow.css`
- [ ] Styles are applied correctly
- [ ] No 404 errors for CSS files

### 6. JavaScript Loading
- [ ] Webflow JS loads: `/js/webflow.js`
- [ ] jQuery script loads (from CDN)
- [ ] No JavaScript errors in console
- [ ] Webflow interactions work (dropdowns, tabs, etc.)

### 7. Navigation Links
- [ ] All navigation links work:
  - Logo → `/`
  - Find Cleaners → `/find-cleaners`
  - Book now → `/customer/book`
  - Insurance → `/insurance`
  - tSmartCard → `/tsmartcard`
  - Contact → `#contact` (anchor)
  - Pricing → `#pricing` (anchor)
  - FAQ → `#faq` (anchor)

### 8. Images Loading
- [ ] Images from `/images/` load correctly
- [ ] Images from `/tsmartcleaning.webflow/images/` load correctly
- [ ] No broken image icons
- [ ] Favicon displays: `/images/favicon.ico`

### 9. API Routes
- [ ] API routes are accessible (test a few):
  - `/api/auth/login`
  - `/api/bookings`
  - `/api/services`
- [ ] No 404 errors for API routes
- [ ] API routes return proper responses (or auth errors, not 404s)

### 10. Key Pages
- [ ] `/find-cleaners` loads
- [ ] `/insurance` loads
- [ ] `/tsmartcard` loads
- [ ] `/for-providers` loads
- [ ] `/contact` loads
- [ ] `/about` loads
- [ ] `/login` loads
- [ ] `/signup` loads

## 🟢 Medium Priority (After Basic Functionality Works)

### 11. Database Connection
- [ ] Supabase connection works
- [ ] Can query database (test with a simple API call)
- [ ] No connection errors in server logs

### 12. Middleware
- [ ] Middleware doesn't block static assets
- [ ] Tenant resolution works (if applicable)
- [ ] Protected routes redirect correctly

### 13. Responsive Design
- [ ] Homepage looks good on desktop (1920px+)
- [ ] Homepage looks good on tablet (768px-991px)
- [ ] Homepage looks good on mobile (<768px)
- [ ] Navigation menu works on mobile (hamburger menu)

### 14. Browser Console
- [ ] No JavaScript errors
- [ ] No 404 errors for resources
- [ ] No CORS errors
- [ ] No authentication errors (unless expected)

## 📝 Testing Commands

```bash
# 1. Install dependencies (if not done)
npm install

# 2. Start development server
npm run dev

# 3. Open browser to
http://localhost:3000

# 4. Check browser console (F12)
# 5. Check Network tab for failed requests
# 6. Test navigation links
# 7. Test responsive design (DevTools > Toggle device toolbar)
```

## 🐛 Common Issues to Watch For

1. **404 Errors for CSS/JS**
   - Check that `css/`, `js/`, `images/` folders are in root (not in `public/`)
   - Verify middleware excludes these paths

2. **Blank Homepage**
   - Check browser console for errors
   - Verify `index.html` exists in root
   - Check that `app/page.tsx` can read the file

3. **API Routes Return 404**
   - Verify `app/api/` directory exists
   - Check middleware doesn't block API routes
   - Verify route files have proper exports

4. **Images Don't Load**
   - Check paths: `/images/` for root images, `/tsmartcleaning.webflow/images/` for public folder images
   - Verify files exist in correct locations

5. **Webflow Interactions Don't Work**
   - Verify `/js/webflow.js` loads
   - Check jQuery loads before Webflow JS
   - Look for JavaScript errors in console

## ✅ Success Criteria

Your app is ready if:
- ✅ Homepage loads and displays correctly
- ✅ No console errors
- ✅ All CSS/JS loads without 404s
- ✅ Navigation links work
- ✅ At least one API route responds
- ✅ Key pages load without errors

## 📋 Quick Test Checklist

Run through this quickly after starting the server:

```
[ ] Homepage loads → http://localhost:3000
[ ] Click "Find Cleaners" → Should go to /find-cleaners
[ ] Click "Book now" → Should go to /customer/book
[ ] Check browser console → No red errors
[ ] Check Network tab → No 404s for CSS/JS
[ ] Resize browser → Layout adapts
[ ] Test mobile menu (if visible) → Opens/closes
```

---

**Ready to run?** Execute: `npm run dev` and start checking items above!

