# Deploying Arsynox Mail to Cloudflare Pages

This guide will help you deploy your Next.js 15 application to Cloudflare Pages with full support for API routes and server-side features.

## Prerequisites

- A Cloudflare account (free tier works fine)
- Node.js 18+ installed locally
- Git repository (GitHub, GitLab, or Bitbucket)
- Wrangler CLI (optional, for local testing)

## Step 1: Install Wrangler CLI (Optional but Recommended)

Wrangler is Cloudflare's CLI tool for deploying and testing:

```bash
# Using npm
npm install -g wrangler

# Using bun
bun install -g wrangler

# Verify installation
wrangler --version
```

## Step 2: Prepare Your Project

Your project is already configured with:

### Files Created:
- `wrangler.toml` - Cloudflare configuration
- `public/_headers` - Security and caching headers
- Updated `package.json` - Cloudflare deployment scripts

### Key Configurations:

**wrangler.toml:**
- Project name: arsynox-mail
- Compatibility date: 2024-01-01

**next.config.ts:**
- Output: standalone (already configured)
- Ready for Cloudflare Pages Functions

## Step 3: Build Your Application

Run the build command:

```bash
# Build for production
bun run build

# Or with npm
npm run build
```

## Step 4: Deploy via Cloudflare Dashboard (Recommended)

### Option A: Connect Git Repository

1. **Push your code to Git:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Go to Cloudflare Dashboard:**
   - Visit: https://dash.cloudflare.com/
   - Select your account

3. **Create a new Pages project:**
   - Go to: Workers & Pages → Create application → Pages → Connect to Git
   - Select your Git provider
   - Choose your repository

4. **Configure build settings:**
   - **Framework preset:** Next.js
   - **Build command:** `npm run build` or `bun run build`
   - **Build output directory:** Leave empty (auto-detected)
   - **Node.js version:** 18 or higher

5. **Click "Save and Deploy"**

6. **Cloudflare will:**
   - Clone your repository
   - Install dependencies
   - Build the application
   - Deploy to Cloudflare's global network

### Option B: Direct Upload

1. **Build your project locally:**
   ```bash
   bun run build
   ```

2. **Create a Pages project:**
   - Go to Cloudflare Dashboard → Workers & Pages
   - Click "Create application"
   - Choose "Upload assets"
   - Project name: arsynox-mail

3. **Upload the `.vercel/output/static` folder:**
   - Note: For Next.js, Cloudflare uses a specific build output
   - The build process creates the necessary files

## Step 5: Configure Environment Variables (If Needed)

If your application requires environment variables:

1. **In Cloudflare Dashboard:**
   - Go to: Workers & Pages → arsynox-mail
   - Click "Settings" → "Functions" → "Environment variables"

2. **Add variables:**
   - Click "Add variable"
   - Variable name: e.g., `NEXT_PUBLIC_API_URL`
   - Value: your API URL
   - Environment: Production (and Preview if needed)

3. **Deploy again** to apply changes

## Step 6: Configure Custom Domain (Optional)

1. **In Cloudflare Dashboard:**
   - Go to: Workers & Pages → arsynox-mail → Custom domains

2. **Add custom domain:**
   - Click "Set up a custom domain"
   - Enter your domain (e.g., `mail.yourdomain.com`)
   - Follow DNS instructions

3. **Wait for DNS propagation:**
   - Usually takes a few minutes
   - You'll get HTTPS automatically

## Step 7: Test Your Deployment

1. **Visit your deployment URL:**
   - Format: `https://arsynox-mail.pages.dev`
   - Or your custom domain if configured

2. **Test all features:**
   - Email address generation
   - Message receiving and display
   - Timer functionality
   - Copy email button

## Important Notes for Your Application

### API Routes
Your application uses API routes (`/api/mail/*`). Cloudflare Pages supports:
- ✅ API routes (as Edge Functions)
- ✅ Server-side rendering
- ✅ Static asset optimization
- ✅ Image optimization

### Caching Headers
The `public/_headers` file includes:
- Security headers (X-Frame-Options, CSP)
- Cache control for static assets
- No caching for API routes

### Performance Tips
1. **Enable Cloudflare CDN:** Already automatic on Pages
2. **Use Edge Functions:** Your API routes run at the edge
3. **Optimize images:** Next.js Image component works on Pages
4. **Static content:** Cached by default for better performance

## Troubleshooting

### Build Errors

**Error:** `Module not found`
- **Solution:** Ensure all dependencies are in `package.json`
- Run: `bun install`

**Error:** TypeScript errors
- **Solution:** Check `next.config.ts` - it's set to ignore build errors
- Review `tsconfig.json` settings

### Runtime Errors

**Error:** API routes not working
- **Solution:** Check that API files are in `src/app/api/` directory
- Verify the build includes the API routes

**Error:** CORS issues
- **Solution:** Add CORS headers to your API routes
- Configure in Cloudflare dashboard if needed

### Deployment Issues

**Error:** Deployment stuck
- **Solution:** Check build logs in Cloudflare Dashboard
- Look for dependency installation errors

**Error:** White screen
- **Solution:** Check browser console for errors
- Verify all routes are properly exported

## Monitoring

### View Logs
1. Go to: Workers & Pages → arsynox-mail
2. Click "Logs" → "Real-time logs"
3. Filter by: Functions, Pages, or Deployments

### Analytics
1. Go to: Workers & Pages → arsynox-mail
2. Click "Analytics"
3. View: Requests, bandwidth, errors, response times

## Continuous Deployment

Your Git repository is set up for automatic deployments:

### On Every Push to Main:
- Cloudflare builds automatically
- Deploys to production
- Updates all global edge locations

### Pull Request Deployments:
- Create a preview URL
- Test before merging
- Rollback if needed

## Security Considerations

1. **Environment Variables:**
   - Never commit `.env` files
   - Use Cloudflare environment variables

2. **Headers:**
   - Security headers are configured in `_headers`
   - Review and adjust based on needs

3. **API Security:**
   - Your API proxies requests to Mail.tm
   - Consider rate limiting if needed
   - Add authentication if required

## Next Steps

1. ✅ Deploy to Cloudflare Pages
2. ✅ Configure custom domain
3. ✅ Set up analytics and monitoring
4. ✅ Test all functionality
5. ✅ Share your deployed application!

## Support

- Cloudflare Pages Docs: https://developers.cloudflare.com/pages
- Next.js on Cloudflare: https://developers.cloudflare.com/pages/framework-guides/nextjs/
- Wrangler CLI: https://developers.cloudflare.com/workers/wrangler/
