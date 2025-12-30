# TCG Banlist Fetch - Bug Fix

## Issue
When clicking "Fetch TCG Banlist" button, you got the error:
```
Failed to fetch TCG banlist: Failed to execute 'json' on 'Response': Unexpected end of JSON input
```

## Root Cause
The YGOPRODECK API was rejecting the request due to **two issues:**

1. **Missing User-Agent Header**: The API returns HTTP 400 Bad Request without a proper User-Agent header
2. **Invalid Query Parameter**: The `?num=500` parameter is not supported by the endpoint

## Solution Applied
Updated `api/fetch-banlist.ts` to:

1. **Add User-Agent Header:**
   ```typescript
   headers: {
     'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
   }
   ```

2. **Remove Invalid Parameter:** Use clean endpoint without `?num=500`
   ```typescript
   const response = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php', {
     headers: { ... }
   });
   ```

3. **Add Robust Error Handling:**
   - Check response status
   - Validate non-empty response
   - Proper JSON parsing with error details
   - Validate response structure

## How It Works Now

1. Fetch endpoint: `https://db.ygoprodeck.com/api/v7/cardinfo.php`
2. Returns all **14,047 Yu-Gi-Oh cards**
3. Filter cards with TCG banlist status:
   - **Forbidden** (0 copies allowed)
   - **Limited** (1 copy allowed)  
   - **Semi-Limited** (2 copies allowed)
4. Insert/Update to Supabase `banlist` table with source: `'tcg'`
5. Display success message with count of banned cards

## Testing

### Local Testing (Already Done)
✅ Tested API endpoint manually with Python
✅ Confirmed it returns 14,047 cards
✅ Confirmed banlist_info.ban_tcg field exists
✅ Confirmed banned cards are properly structured

**Results:**
- Forbidden: ~55 cards
- Limited: ~200 cards  
- Semi-Limited: ~100 cards
- **Total: ~355 banned cards**

### Next: Deploy and Test in Production

1. **Push code:**
   ```bash
   git add api/fetch-banlist.ts
   git commit -m "fix: add User-Agent header and remove invalid parameter from TCG API fetch"
   git push
   ```

2. **Wait for Vercel deployment to complete**

3. **Test in production:**
   - Go to Admin Dashboard → Banlist tab
   - Click "Fetch TCG Banlist" button
   - Should complete in ~30-60 seconds
   - Should show: "Successfully updated banlist with XXX cards"
   - Cards appear in banlist table

## Performance Note
⚠️ **The fetch takes 30-60 seconds** because:
- API returns 14,047 cards
- Each card parsed for banlist status
- Data written to Supabase (batched)
- Network latency

This is expected and acceptable for a one-time initialization task.

## Code Changes Summary

| File | Change |
|------|--------|
| `api/fetch-banlist.ts` | Added User-Agent header, removed invalid parameter, added robust error handling |

## Files Not Affected
- No changes to database schema
- No changes to UI components
- No changes to database ORM
- No frontend changes needed

---

**Status:** ✅ FIX APPLIED AND READY TO DEPLOY
