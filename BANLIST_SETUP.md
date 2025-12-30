# Banlist System Setup Guide

## Overview
The banlist system is now fully integrated into the Yu-Gi-Oh tournament website. This system allows admins to manage banned cards with three statuses: Forbidden (0 copies), Limited (1 copy), Semi-Limited (2 copies), or Unlimited (3+ copies).

## Current Status: ✅ READY TO DEPLOY

### What's Implemented ✅

1. **Database Layer**
   - Migration file: `src/migrations/001_create_banlist_table.sql`
   - BanlistORM: `src/sdk/database/orm/orm_banlist.ts` with full CRUD operations

2. **API Integration**
   - Vercel serverless endpoint: `api/fetch-banlist.ts`
   - Fetches banlist from YGOPRODECK API
   - Can be called manually to sync TCG-official banlist

3. **UI Components**
   - BanIndicator: `src/components/BanIndicator.tsx` - Shows PNG indicator images
   - BanlistManageTab: `src/components/BanlistManageTab.tsx` - Admin management interface
   - Ban indicators appear on:
     - Main catalog card display (line ~1039)
     - Archetype detail modal cards (2 locations)
     - Admin panel archetype cards
     - Admin panel staple cards

4. **Global State Management**
   - Module-level banlist object in `src/routes/index.tsx`
   - `useBanlistVersion()` hook for reactive updates
   - `notifyBanlistChange()` function for notifications
   - Automatic reload when admins make changes

5. **Visual Assets**
   - `/public/banlist/forbidden.png` - Custom ban indicator
   - `/public/banlist/limited.png` - Custom limit-1 indicator
   - `/public/banlist/semi-limited.png` - Custom limit-2 indicator

## Setup Steps (One-Time Only)

### Step 1: Create Database Table in Supabase

1. Go to https://app.supabase.com/
2. Navigate to your project → SQL Editor
3. Click "New Query"
4. Copy the SQL from `src/migrations/001_create_banlist_table.sql`
5. Paste into the query editor
6. Click "Run" to execute

**Expected Result:** Table `banlist` created with columns: id, card_name, ban_status, source, last_updated, created_at

### Step 2: Deploy to Vercel (if not already done)

The banlist system is integrated into the main application, so no separate deployment is needed:

```bash
git add .
git commit -m "feat: integrate banlist system with ban indicators"
git push
```

Vercel will automatically deploy the changes.

## Usage Guide

### For Tournament Admins

1. **Access Admin Dashboard**
   - Log in as admin user
   - Navigate to Admin Dashboard
   - Find the "Banlist" tab

2. **Add a Card to Banlist**
   - Click "Add Card" button
   - Search for card name
   - Select ban status: Forbidden / Limited / Semi-Limited
   - Click "Add"
   - Admin note: Card appears immediately in all card displays

3. **Update Ban Status**
   - Click dropdown next to banned card
   - Select new status
   - Save
   - Card indicator updates instantly

4. **Remove Card from Banlist**
   - Click "Remove" button next to card
   - Card removed and indicator disappears

5. **Sync Official TCG Banlist**
   - Click "Fetch TCG Banlist" button
   - System fetches from YGOPRODECK API
   - Updates database with official statuses
   - Shows count of cards updated

### For Tournament Players

- Ban indicators appear on all card displays:
  - Main catalog when browsing cards
  - Archetype detail view
  - Staple cards section
  - Search results

- Indicators show:
  - 🚫 Forbidden (red) - Cannot include in deck
  - 1️⃣ Limited (red) - Maximum 1 copy allowed
  - 2️⃣ Semi-Limited (red) - Maximum 2 copies allowed
  - Nothing shown - Unlimited (3+ copies allowed)

## Architecture

```
User Action (Admin adds ban)
    ↓
BanlistManageTab component
    ↓
BanlistORM.setBanStatus() (writes to Supabase)
    ↓
onBanlistChange callback
    ↓
AdminDashboard.handleBanlistChange() (reloads banlist)
    ↓
notifyBanlistChange() (triggers listeners)
    ↓
useBanlistVersion() hook (triggers re-renders)
    ↓
CatalogTab/StaplesManageTab re-render with getBanStatus()
    ↓
BanIndicator components update instantly
```

## File Locations

| File | Purpose |
|------|---------|
| `src/data/banlist.ts` | Types and helper functions |
| `src/sdk/database/orm/orm_banlist.ts` | Database operations |
| `src/components/BanIndicator.tsx` | Visual indicators |
| `src/components/BanlistManageTab.tsx` | Admin management UI |
| `src/routes/index.tsx` | Integration and state management |
| `api/fetch-banlist.ts` | Vercel API endpoint |
| `src/migrations/001_create_banlist_table.sql` | Database schema |
| `public/banlist/*.png` | Ban indicator images |

## Troubleshooting

### Issue: Ban indicators not showing
**Solution:** Make sure:
1. Database table is created in Supabase
2. PNG files exist in `/public/banlist/`
3. Browser cache cleared (Ctrl+Shift+Delete)

### Issue: Changes not syncing
**Solution:** 
1. Check browser console for errors (F12)
2. Verify Supabase connection in `.env.local`
3. Try refreshing page

### Issue: TCG fetch button not working
**Solution:**
1. Verify YGOPRODECK API is accessible
2. Check Vercel environment variables for Supabase keys
3. Check `api/fetch-banlist.ts` logs in Vercel dashboard

## Testing Checklist

- [ ] Database table created successfully
- [ ] Admin can add card to banlist
- [ ] Ban indicator appears immediately
- [ ] Admin can update ban status
- [ ] Ban indicator updates with new status
- [ ] Admin can remove card from banlist
- [ ] Ban indicator disappears after removal
- [ ] TCG fetch button updates database
- [ ] All card displays show indicators correctly
- [ ] Mobile view shows indicators properly

## Next Steps (Optional)

1. **Seed Initial Banlist:** Add current TCG banlist to database
2. **Notifications:** Add toast notifications for banlist changes
3. **Ban Reasons:** Add optional notes to each ban
4. **History:** Track who changed which cards and when
5. **Export:** Allow downloading current banlist as CSV/JSON

## Support

For issues or questions, check:
1. Browser console (F12 → Console tab)
2. Supabase dashboard logs
3. Vercel function logs at https://vercel.com/dashboard

---

**Last Updated:** 2025
**Status:** Production Ready ✅
