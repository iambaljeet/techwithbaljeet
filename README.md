# TechWithBaljeet — Developer Blog

A high-performance blog platform built with **Next.js 15**, **Firebase**, **Tailwind CSS v4**, and **shadcn/ui**. Features ISR (Incremental Static Regeneration) with on-demand revalidation, a full admin dashboard with WYSIWYG editor, and best-in-class SEO including AI-friendly content.

| | URL |
|---|---|
| **Live site** | https://techwithbaljeet.web.app |
| **App Hosting** | https://techwithbaljeet--techwithbaljeet.us-central1.hosted.app |
| **Admin panel** | https://techwithbaljeet.web.app/admin/login _(hidden — use Konami code)_ |

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Local Development](#local-development)
3. [Admin Access (Hidden Login)](#admin-access-hidden-login)
4. [Creating a New Article](#creating-a-new-article)
5. [Publishing / Editing / Deleting Articles](#publishing--editing--deleting-articles)
6. [Deploying to Firebase](#deploying-to-firebase)
7. [SEO — Automatic, Zero Effort](#seo--automatic-zero-effort)
8. [ISR & Caching Strategy](#isr--caching-strategy)

---

## Architecture Overview

```
techwithbaljeet/
├── app/
│   ├── (blog)/              # Public blog routes (ISR, 1 year TTL)
│   │   ├── page.tsx         # Homepage (hero + post grid)
│   │   ├── post/[slug]/     # Post detail page
│   │   ├── search/          # Client-side search with pagination
│   │   └── tag/[tag]/       # Tag filtered posts
│   ├── admin/               # Protected admin panel
│   │   ├── login/           # Firebase email/password login
│   │   ├── dashboard/       # Post management table
│   │   └── posts/           # new | [id]/edit
│   ├── api/revalidate/      # Webhook to invalidate ISR cache
│   ├── rss.xml/             # RSS 2.0 feed (top 50 posts)
│   ├── llms.txt/            # AI-friendly index (llmstxt.org)
│   ├── sitemap.ts           # Dynamic XML sitemap with real lastModified
│   └── layout.tsx           # Root layout: JSON-LD + fonts
├── components/
│   ├── blog/                # PostCard, PostHero, PostContent (copy btns), PostsGrid
│   ├── admin/               # TipTapEditor, PostForm, AdminPostsTable
│   └── layout/              # Header, Footer
├── lib/
│   ├── blog.ts              # Server-side ISR Firestore reads (unstable_cache)
│   ├── admin-blog.ts        # Client-side CRUD (Firebase JS SDK)
│   ├── sanitize-content.ts  # Server-only: strips Medium HTML wrappers/title/image
│   ├── firebase.ts          # Client Firebase SDK
│   ├── firebase-admin.ts    # Admin SDK (server-only)
│   └── types.ts             # TypeScript interfaces
└── public/
    ├── robots.txt           # Allows all bots incl. AI crawlers
    └── og-default.png       # Default OG image
```

**Data flow**:
- Public pages: Firebase Admin SDK server-side → `unstable_cache` → 1-year ISR
- On admin writes: `api/revalidate` → `revalidateTag('posts')` → cache busted
- Client-side (search, load more): Firebase JS SDK directly from browser

---

## Local Development

### Prerequisites

- Node.js 20+  
- Firebase CLI: `npm install -g firebase-tools`

### Setup

```bash
npm install
cp .env.local.example .env.local  # add your credentials
npm run dev
```

### Environment Variables (`.env.local`)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=techwithbaljeet.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=techwithbaljeet
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=techwithbaljeet.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Server-only — base64 encoded service account JSON
FIREBASE_SERVICE_ACCOUNT_KEY=<base64>
```

Encode service account:
```bash
base64 -i /path/to/service-account.json | tr -d '\n'
```

---

## Admin Access (Hidden Login)

The admin panel is not linked publicly. To access:

**Press the Konami code** on any public page:  
**↑ ↑ ↓ ↓ ← → ← → B A**

This navigates to `/admin/login`.

---

## Creating a New Article

1. Log into the admin panel
2. Click **"New Post"**
3. Fill in title, excerpt, cover image (upload), tags, content (TipTap WYSIWYG)
4. Set **Status** to `Draft` or `Published`
5. Click **Save**

When saving a published post, the ISR cache is automatically invalidated — changes appear on the live site on the next request.

---

## Publishing / Editing / Deleting Articles

| Action | How |
|---|---|
| **Publish draft** | Edit post → change status to Published → Save |
| **Edit live post** | Dashboard → Edit → Save (cache auto-invalidated) |
| **Delete post** | Dashboard → Delete → Confirm |
| **Unpublish** | Edit → change status to Draft → Save |

All admin actions trigger automatic cache invalidation via `api/revalidate`.

---

## Deploying to Firebase

### Full deploy (recommended after code changes)

```bash
npm run build           # catch TypeScript errors locally first
firebase deploy --project techwithbaljeet
```

### Web app only

```bash
firebase deploy --only apphosting --project techwithbaljeet
```

Build takes ~3–5 minutes on Firebase App Hosting. The ISR cache persists across code deploys — only admin actions or TTL expiry clear cached pages.

### Rules / indexes only

```bash
firebase deploy --only firestore --project techwithbaljeet
firebase deploy --only storage --project techwithbaljeet
```

---

## SEO — Automatic, Zero Effort

Every article gets the following **without any publisher action**:

| Feature | Detail |
|---|---|
| Meta title & description | Post title + excerpt |
| Open Graph (`og:article`) | Cover image, published/modified time, tags, author |
| Twitter Card | `summary_large_image` |
| JSON-LD `Article` | Author, dates, word count, ISO 8601 read time |
| JSON-LD `BreadcrumbList` | Home > Article |
| Canonical URL | Per article |
| Keywords meta | From post tags |
| XML Sitemap | `/sitemap.xml` with real `lastModified` per post |
| RSS Feed | `/rss.xml` — valid RSS 2.0, top 50 posts |
| AI index | `/llms.txt` — llmstxt.org standard, all posts listed |
| Site JSON-LD | `WebSite` + `SearchAction` + `Person` + `Organization` |
| robots.txt | Welcomes GPTBot, Claude, Perplexity, Google-Extended |

---

## ISR & Caching Strategy

| Route | TTL | Revalidated by |
|---|---|---|
| `/` | 1 year | Any post create/edit/delete |
| `/post/[slug]` | 1 year | That post edited/deleted |
| `/tag/[tag]` | 1 year | Post with that tag changes |
| `/sitemap.xml` | 1 year | Any post change |
| `/rss.xml` | 1 year | Any post change |
| `/llms.txt` | 1 year | Any post change |
| `/search` | No cache | Client-side, always fresh |
