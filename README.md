# 📸 Wedding Photo Upload — وعد & محمد

A privacy-first wedding photo upload system. Guests scan a QR code, upload photos/videos, and only the bride (or trusted admin) can view or download them. No gallery. No public access. No file browsing.

---

## Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 14 (App Router) | Fast, deployable to Vercel in minutes |
| Backend/API | Next.js API Routes | Same project, no separate server |
| Database | Supabase (PostgreSQL) | Free tier is generous, RLS built-in |
| Storage | Supabase Storage (S3-compatible) | Private buckets, signed URLs |
| Auth | Simple session-based admin login | No guest accounts needed |
| Hosting | Vercel | Free, one-click deploy, auto HTTPS |

---

## Architecture Overview

```
Guest (phone) ──QR code──▶ Upload Page ──POST /api/upload──▶ Server validates
                                                              │
                                                              ▼
                                                     Supabase Storage
                                                     (PRIVATE bucket)
                                                              │
                                                              ▼
                                                     Supabase DB
                                                     (uploads table)
                                                              │
Admin (browser) ──/admin──▶ Login ──session cookie──▶ Dashboard
                                                     │
                                                     ├── View files (signed URLs)
                                                     ├── Download individual/all
                                                     ├── Delete individual/bulk
                                                     ├── Mark reviewed
                                                     └── Toggle uploads open/closed
```

**Key security properties:**
- Storage bucket is PRIVATE — no public URLs exist
- Guests upload through the API which uses the service_role key server-side
- Guests never receive file URLs or see any uploads
- Admin sees files only via time-limited signed URLs (1 hour)
- No Supabase anon key policies allow reading the uploads table
- All pages have `noindex` meta tags and `robots.txt` blocks crawlers

---

## Setup Instructions (Step by Step)

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project**
3. Choose a name (e.g., `wedding-waad`)
4. Set a strong database password (save it somewhere)
5. Choose the closest region (for Saudi Arabia: **Middle East (Bahrain)**)
6. Wait for the project to be created

### 2. Set Up Database

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the entire contents of `supabase/setup.sql`
4. Click **Run**
5. You should see "Success. No rows returned" — this is correct

### 3. Create Storage Bucket

1. Go to **Storage** in Supabase dashboard
2. Click **New bucket**
3. Settings:
   - **Name:** `wedding-uploads`
   - **Public bucket:** ❌ **OFF** (this is critical!)
   - **File size limit:** `52428800` (50MB)
   - **Allowed MIME types:** `image/jpeg,image/png,image/heic,image/heif,image/webp,video/mp4,video/quicktime,video/x-msvideo,video/webm,video/3gpp`
4. Click **Create bucket**
5. **DO NOT** add any storage policies — the bucket should have zero public policies

### 4. Get Supabase Keys

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon public** key
   - **service_role secret** key (click "Reveal" — **keep this secret!**)

### 5. Deploy to Vercel

#### Option A: Quick Deploy (Recommended)

1. Push the code to a GitHub repository (private repo recommended)
2. Go to [vercel.com](https://vercel.com)
3. Click **Add New** → **Project**
4. Import your GitHub repo
5. In the **Environment Variables** section, add:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key |
| `ADMIN_USERNAME` | Choose a username (e.g., `waad`) |
| `ADMIN_PASSWORD` | Choose a strong password |
| `NEXT_PUBLIC_ACCESS_CODE` | A code for table cards (e.g., `waad2026`) |
| `MAX_FILE_SIZE_MB` | `50` |
| `MAX_FILES_PER_UPLOAD` | `10` |

6. Click **Deploy**
7. Your site is live at `https://your-project.vercel.app`

#### Option B: Vercel CLI

```bash
npm install -g vercel
cd wedding-upload
cp .env.local.example .env.local
# Edit .env.local with your actual values
vercel --prod
```

### 6. Custom Domain (Optional)

1. In Vercel dashboard → **Settings** → **Domains**
2. Add your domain (e.g., `photos.waad-mohammed.com`)
3. Follow the DNS instructions Vercel provides
4. HTTPS is automatic

### 7. Generate QR Code

Generate a QR code that links to your upload page:

**URL to encode:**
- Without access code: `https://your-domain.com`
- With access code already shown on card: `https://your-domain.com`

**How to generate:**
1. Go to [qr-code-generator.com](https://www.qr-code-generator.com/) or any QR generator
2. Enter your site URL
3. Download the QR code image
4. Print on table cards

**Table card suggestion:**
```
╔══════════════════════════════════════╗
║                                      ║
║      📸 شاركونا لحظات الفرح          ║
║    Share your moments with us         ║
║                                      ║
║          [QR CODE HERE]              ║
║                                      ║
║       رمز الدخول: waad2026            ║
║       Access code: waad2026           ║
║                                      ║
║  يرجى عدم مشاركة هذا الرابط مع الغير  ║
║  Please do not share this link        ║
║                                      ║
╚══════════════════════════════════════╝
```

---

## Folder Structure

```
wedding-upload/
├── app/
│   ├── globals.css          # Theme, fonts, animations
│   ├── layout.tsx           # Root layout with noindex meta
│   ├── page.tsx             # Guest upload page
│   ├── admin/
│   │   ├── layout.tsx       # Admin layout
│   │   └── page.tsx         # Admin dashboard
│   └── api/
│       ├── upload/route.ts       # Guest upload endpoint
│       ├── admin/
│       │   ├── route.ts          # Login/logout/session check
│       │   ├── files/route.ts    # List files for admin
│       │   └── review/route.ts   # Mark file as reviewed
│       ├── toggle-uploads/route.ts  # Open/close uploads
│       ├── delete-file/route.ts     # Delete files
│       └── download-all/route.ts    # Download all as ZIP
├── lib/
│   ├── supabase.ts          # Supabase client setup
│   ├── auth.ts              # Session management
│   └── upload-config.ts     # File validation config
├── public/
│   └── robots.txt           # Block all crawlers
├── supabase/
│   └── setup.sql            # Database schema
├── middleware.ts             # Security headers
├── next.config.js           # Headers, CSP
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── .env.local.example
```

---

## Security Notes

### What IS protected:

✅ Storage bucket is fully private (no public URLs)  
✅ Files only accessible via time-limited signed URLs (admin only)  
✅ No file listing for guests (no gallery, no browsing)  
✅ Rate limiting on uploads (30/hour per IP)  
✅ File type validation (images + videos only)  
✅ File size limits (50MB per file)  
✅ Admin login with session cookies (httpOnly, secure, sameSite)  
✅ 1-second delay on failed login (brute force mitigation)  
✅ All pages blocked from search engine indexing  
✅ Security headers (CSP, X-Frame-Options, no-referrer)  
✅ Random file names (no enumerable paths)  
✅ Optional access code gate before upload page  
✅ RLS policies block anon key from reading uploads  

### What CANNOT be fully prevented:

⚠️ **QR code sharing** — A guest could photograph the QR code and share it with someone not at the wedding. The access code mitigates this partially.

⚠️ **Screenshots** — A guest can screenshot the upload page or their own photos before uploading. No technical solution exists for this.

⚠️ **Multiple uploads from same person** — Rate limiting helps but a determined person could upload many files. This is by design (guests should be able to upload freely).

⚠️ **Admin session on shared devices** — If Waad logs into admin on a shared device and doesn't log out, someone else could access the dashboard. Always log out.

⚠️ **Vercel function cold starts** — First upload after inactivity may take 1-2 seconds longer. This is cosmetic, not a security issue.

### Recommendations:

1. **Change the admin password** before the wedding
2. **Use a strong access code** that's not easily guessable
3. **Close uploads** after the event using the admin toggle
4. **Download all files** after the event and delete them from Supabase
5. **Delete the Supabase project** when you no longer need the photos stored online

---

## How Waad Will Use This on Wedding Day

### Before the wedding:
1. Deploy the app (follow setup above)
2. Test: scan the QR code yourself, upload a test photo
3. Check admin dashboard: log in at `/admin`, see the test photo
4. Delete the test photo
5. Print QR code table cards

### On the wedding day:
1. Place table cards with QR codes at each table
2. Guests scan → enter access code → upload photos/videos
3. Monitor uploads via `/admin` on your phone if needed

### After the wedding:
1. Log into `/admin`
2. Review all photos (mark reviewed if desired)
3. Click **تحميل الكل ZIP** to download everything
4. Toggle uploads to **closed**
5. Delete files you don't want to keep online
6. Optionally: delete the entire Supabase project

### To fully shut down and remove all data:
1. Download all files first (ZIP download from admin)
2. In Supabase dashboard → Storage → `wedding-uploads` → Delete all files
3. In Supabase dashboard → Table Editor → `uploads` → Delete all rows
4. Option A: Delete the Supabase project entirely
5. Option B: Delete the Vercel project
6. Both ensures zero data remains online

---

## Launch Checklist

- [ ] Supabase project created in Middle East region
- [ ] Database tables created (run `setup.sql`)
- [ ] Storage bucket `wedding-uploads` created as **PRIVATE**
- [ ] No storage policies added (bucket has zero public policies)
- [ ] Environment variables set in Vercel
- [ ] Admin password is strong and unique
- [ ] Access code set for table cards
- [ ] Test upload works (upload a photo, see it in admin)
- [ ] Test admin login works
- [ ] Test upload toggle works (close → guests see closed message)
- [ ] Test download works (download a file from admin)
- [ ] Test delete works (delete a file from admin)
- [ ] QR code generated and printed on table cards
- [ ] Table cards include access code
- [ ] Table cards include "do not share" reminder
- [ ] robots.txt accessible at `/robots.txt` (returns Disallow: /)
- [ ] Site is not indexed by Google (check with `site:yourdomain.com`)
- [ ] Admin URL (`/admin`) is not printed anywhere public

---

## License

Private use only. Built for Waad & Mohammed's wedding.
