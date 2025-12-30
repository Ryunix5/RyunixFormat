# Banlist System Implementation

## ✅ Completed Components

### 1. Core Data Types (`src/data/banlist.ts`)
- `BanStatus` type: forbidden | limited | semi-limited | unlimited
- `BannedCard` interface with card name, status, date, and source
- `BAN_STATUS_INFO` object with labels, copy limits, and colors
- Helper functions: `getBanStatus()`, `isBanned()`, `getAllowedCopies()`

### 2. Database ORM (`src/sdk/database/orm/orm_banlist.ts`)
- `BanlistORM` singleton class for database operations
- Methods:
  - `getBanlist()` - Load all banned cards
  - `getBannedCard(cardName)` - Get single card status
  - `setBanStatus(cardName, status)` - Add/update ban status (manual)
  - `unbanCard(cardName)` - Remove from banlist
  - `updateFromTCG(cards)` - Batch import from TCG API

### 3. Vercel API (`api/fetch-banlist.ts`)
- Fetches official TCG banlist from YGOPRODECK
- Updates database with `source: 'tcg'`
- Endpoint: `GET/POST /api/fetch-banlist`
- Parses ban statuses: Forbidden, Limited, Semi-Limited

### 4. Visual Components (`src/components/BanIndicator.tsx`)
- `BanIndicator` - Konami-style circle with 🚫 or number (1/2)
- `BanBadge` - Text badge showing status
- `CardBanStatus` - Complete display with icon and label
- Sizes: sm (8x8), md (12x12), lg (16x16)

### 5. Admin Panel Tab (`src/components/BanlistManageTab.tsx`)
- Full CRUD interface for banlist management
- Features:
  - **Fetch TCG Banlist** - Import official banlist from API
  - **Add Card** - Add cards to banlist with status selection
  - **Update Status** - Change ban status (Forbidden ↔ Limited ↔ Semi-Limited)
  - **Remove Card** - Remove cards from banlist
  - **Search & Filter** - Find cards by name or filter by status
  - **Ban Status Display** - Shows indicator, status badge, source (TCG/Manual), date

### 6. Database Migration (`src/migrations/001_create_banlist_table.sql`)
- Creates `banlist` table with columns:
  - `id` - Primary key
  - `card_name` - Unique card name
  - `ban_status` - One of: forbidden, limited, semi-limited, unlimited
  - `source` - TCG or manual override
  - `last_updated` - Timestamp
  - `created_at` - Timestamp
- Indexes on: card_name, ban_status, source

### 7. Integration into Admin Dashboard
- Added "Banlist" tab to admin panel (Shield icon)
- Import statements: `BanlistManageTab`, `BanIndicator`
- Tab trigger and content added to admin dashboard

## 🔧 TODO - Next Steps

### 1. Run Database Migration
- Execute SQL migration in Supabase dashboard to create the `banlist` table
- Or use Supabase CLI: `supabase migration up`

### 2. Integrate Ban Indicators into Card Displays
Need to add ban status display to:
- **Archetype card rows** - Show indicator before card name
- **Staple card rows** - Show indicator before card name
- **Archetype detail modal** - Show indicator above card list
- **Card search results** - Show indicator next to card names

Example integration:
```tsx
import { BanIndicator } from '@/components/BanIndicator';
import { getBanStatus } from '@/data/banlist';

<div className="flex items-center gap-2">
  <BanIndicator banStatus={getBanStatus(cardName, banlist)} size="sm" />
  <span>{cardName}</span>
</div>
```

### 3. Load Banlist in Main App
In `App()` function, add banlist loading:
```tsx
useEffect(() => {
  (async () => {
    const orm = BanlistORM.getInstance();
    const banlist = await orm.getBanlist();
    // Store in state or context
  })();
}, []);
```

### 4. Add Banlist to Context/Global State
Create a context to share banlist across components:
- Store in global state
- Pass to CatalogTab, ArchetypeCardsTab, etc.
- Update when admin changes banlist

### 5. Test the System
- Create test data in banlist table
- Verify Konami-style indicators display correctly
- Test add/update/remove functionality
- Test TCG banlist fetch functionality

## 🎨 Visual Design

**Konami-Style Ban Indicators:**
- 🚫 Red circle with prohibition symbol = **FORBIDDEN** (0 copies)
- 🔴 Red circle with "1" = **LIMITED** (1 copy)
- 🔴 Red circle with "2" = **SEMI-LIMITED** (2 copies)
- No indicator = **UNLIMITED** (3+ copies)

## 📝 Usage Examples

### Check if card is banned:
```tsx
import { isBanned, getAllowedCopies } from '@/data/banlist';

if (isBanned(cardName, banlist)) {
  // Card is forbidden
}

const maxCopies = getAllowedCopies(cardName, banlist);
```

### Add card to banlist:
```tsx
const orm = BanlistORM.getInstance();
await orm.setBanStatus('Maxx "C"', 'limited', 'manual');
```

### Fetch TCG banlist:
```tsx
const response = await fetch('/api/fetch-banlist', { method: 'POST' });
const data = await response.json();
```

## 🔗 API Endpoints

### Fetch TCG Banlist
- **URL:** `/api/fetch-banlist`
- **Method:** GET or POST
- **Response:** `{ success: boolean, message: string, cardsUpdated: number }`

## 📦 Database Schema

```
Table: banlist
├── id (BIGINT, PK)
├── card_name (VARCHAR 255, UNIQUE)
├── ban_status (VARCHAR 20, CHECK)
├── source (VARCHAR 20, CHECK: 'tcg' | 'manual')
├── last_updated (TIMESTAMP)
└── created_at (TIMESTAMP)

Indexes:
├── idx_banlist_card_name
├── idx_banlist_ban_status
└── idx_banlist_source
```

## 🚀 Deployment Checklist

- [ ] Run database migration in Supabase
- [ ] Test banlist admin panel
- [ ] Fetch TCG banlist
- [ ] Integrate ban indicators into card displays
- [ ] Test in production on Vercel
- [ ] Commit and push all changes
