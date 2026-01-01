import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Coins, ShoppingCart, History, User, LogOut, Users, Gift, KeyRound, BarChart3, Save, List, Grid3X3, LayoutGrid, X, Edit3, ChevronDown, ChevronUp, Eye, Search, Plus, Image, Package, Layers, ShoppingBag, Trash2, Star, Info, ArrowUpDown, ArrowUp, ArrowDown, Shield, Download } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CardModificationsORM } from "@/sdk/database/orm/orm_card_modifications";
import { PurchaseORM, type PurchaseModel, PurchaseItemType } from "@/sdk/database/orm/orm_purchase";
import { CoinLogORM, type CoinLogModel } from "@/sdk/database/orm/orm_coin_log";
import { UserORM, type UserModel } from "@/sdk/database/orm/orm_user";
import { BanlistORM } from "@/sdk/database/orm/orm_banlist";
import { CardCatalogORM } from "@/sdk/database/orm/orm_cards";
import { GachaPackORM, type GachaPackModel } from "@/sdk/database/orm/orm_gacha_pack";
import type { BanStatus, BannedCard } from "@/data/banlist";
import { ARCHETYPE_DECKS, STAPLE_CARDS, type CatalogItem, type MetaRating, META_RATING_PRICES } from "@/data/yugioh-catalog";
import { CARD_BUNDLES, type CardBundle } from "@/data/card-bundles";
import { hashPassword, verifyPassword, createAuthToken, getAuthToken, setAuthToken, clearAuthToken } from "@/lib/auth";
import { getUserByUsername } from "@/lib/db";
import { initializeAdminUser } from "@/lib/init-admin";
import { BanlistManageTab } from "@/components/BanlistManageTab";
import { GachaPacksManageTab } from "@/components/GachaPacksManageTab";
import { BanIndicator } from "@/components/BanIndicator";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const [currentUser, setCurrentUser] = useState<UserModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initialize() {
      // Initialize admin user if it doesn't exist
      await initializeAdminUser();

      const token = getAuthToken();
      if (token) {
        loadUserData(token.userId);
      } else {
        setIsLoading(false);
      }
    }

    initialize();

    // Also load persisted card modifications at app startup so player views can see admin changes
    (async () => {
      try {
        const orm = CardModificationsORM.getInstance();
        const mods = await orm.getMods();
        if (mods && typeof mods === 'object') {
          // Load archetype modifications
          if (mods.archetypes && typeof mods.archetypes === 'object') {
            Object.assign(cardModifications, mods.archetypes);
            console.debug('Loaded archetype modifications at app startup', { count: Object.keys(mods.archetypes).length, data: mods.archetypes });
          }
          // Load custom staples
          if (Array.isArray(mods.customStaples)) {
            customStaples.length = 0;
            customStaples.push(...mods.customStaples);
            console.debug('Loaded custom staples at app startup', { count: mods.customStaples.length });
          }
          // Load removed staples
          if (Array.isArray(mods.removedStaples)) {
            removedStaples.clear();
            mods.removedStaples.forEach((name: string) => removedStaples.add(name));
            console.debug('Loaded removed staples at app startup', { count: mods.removedStaples.length });
          }
          // Notify components to re-render with loaded data (but don't trigger persist)
          modificationVersion++;
          modificationListeners.forEach(listener => listener());
        }
      } catch (e) {
        console.warn('Failed to load card modifications at app startup', e);
      }
    })();

    // Load banlist at app startup
    (async () => {
      try {
        const orm = BanlistORM.getInstance();
        const loadedBanlist = await orm.getBanlist();
        Object.keys(banlist).forEach(k => delete banlist[k]);
        Object.assign(banlist, loadedBanlist);
        console.debug('Loaded banlist at app startup', { count: Object.keys(loadedBanlist).length });
        banlistVersion++;
        banlistListeners.forEach(listener => listener());
      } catch (e) {
        console.warn('Failed to load banlist at app startup', e);
      }
    })();
    // Listen for cross-tab updates to card modifications (so player views update when admin saves in another tab)
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('ryunix-card-mods');
        bc.onmessage = async (ev) => {
          if (ev?.data?.type === 'updated') {
            try {
              const orm = CardModificationsORM.getInstance();
              const mods = await orm.getMods();
              if (mods && typeof mods === 'object') {
                // Load archetype modifications
                if (mods.archetypes && typeof mods.archetypes === 'object') {
                  // Clear and reload to get latest
                  Object.keys(cardModifications).forEach(k => delete cardModifications[k]);
                  Object.assign(cardModifications, mods.archetypes);
                }
                // Load custom staples
                if (Array.isArray(mods.customStaples)) {
                  customStaples.length = 0;
                  customStaples.push(...mods.customStaples);
                }
                // Load removed staples
                if (Array.isArray(mods.removedStaples)) {
                  removedStaples.clear();
                  mods.removedStaples.forEach((name: string) => removedStaples.add(name));
                }
                console.debug('Reloaded modifications from BroadcastChannel');
                // Trigger re-render without re-persisting (increment version only)
                modificationVersion++;
                modificationListeners.forEach(listener => listener());
              }
            } catch (e) {
              console.warn('Error reloading card modifications after broadcast', e);
            }
          }
        };
        // close on unmount
        window.addEventListener('beforeunload', () => bc.close());
      }
    } catch (e) {
      console.warn('Failed to initialize BroadcastChannel for card mods', e);
    }
  }, []);

  async function loadUserData(userId: string) {
    try {
      const userORM = UserORM.getInstance();
      const users = await userORM.getUserById(userId);
      if (users.length > 0) {
        setCurrentUser(users[0]);
      }
    } catch (error) {
      console.error("Failed to load user:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleLogin(user: UserModel) {
    setCurrentUser(user);
  }

  function handleLogout() {
    clearAuthToken();
    setCurrentUser(null);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="size-3 rounded-full bg-amber-500 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <div className="text-lg font-semibold text-amber-400">Loading...</div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (currentUser.is_admin) {
    return <AdminDashboard user={currentUser} onLogout={handleLogout} onUserUpdate={loadUserData} />;
  }

  return <PlayerDashboard user={currentUser} onLogout={handleLogout} onUserUpdate={loadUserData} />;
}

function LoginPage({ onLogin }: { onLogin: (user: UserModel) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const uname = username.trim();
      const pwd = password;

      const userRow = await getUserByUsername(uname);
      if (!userRow) {
        setError("Invalid username or password");
        return;
      }

      const ok = await verifyPassword(pwd, userRow.password_hash);
      if (!ok) {
        setError("Invalid username or password");
        return;
      }

      // Create and store client token
      const token = createAuthToken(userRow.id, userRow.username, userRow.is_admin);
      setAuthToken(token);

      // Load full UserModel via the ORM (if available) and signal login
      const userORM = UserORM.getInstance();
      const users = await userORM.getUserById(userRow.id);
      const userModel = users[0] ?? ({ id: userRow.id, username: userRow.username, password_hash: userRow.password_hash, coin: userRow.coin, is_admin: userRow.is_admin, data_creator: "", data_updater: "", create_time: "", update_time: "" } as UserModel);

      onLogin(userModel);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || String(err) || "Login failed");
    } finally {
      setIsLoading(false);
    }
  }


  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <Card className="w-full max-w-md border border-slate-700 bg-slate-800">
        <CardHeader className="space-y-2 pb-6 relative">
          <div className="flex items-center justify-center mb-2">
            <img src="/yugioh-logo.svg" alt="Yu-Gi-Oh!" className="h-16 w-auto" />
          </div>
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
            Ryunix Format
          </CardTitle>
          <CardDescription className="text-base text-center text-slate-400">Login to manage your tournament coins and decks</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="bg-red-950 border-red-500">
                <AlertDescription className="text-red-200">{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-semibold text-slate-300">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
                className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-amber-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-slate-300">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-amber-500"
              />
            </div>
            <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Enter the Arena"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function PlayerDashboard({ user, onLogout, onUserUpdate }: { user: UserModel; onLogout: () => void; onUserUpdate: (userId: string) => void }) {
  const [activeTab, setActiveTab] = useState("catalog");

  return (
    <div className="min-h-screen bg-transparent">
      <header className="bg-slate-900/90 border-b border-amber-500/30 sticky top-0 z-50 relative">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/yugioh-logo.svg" alt="Yu-Gi-Oh!" className="h-10 w-auto" />
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent">Ryunix Format</h1>
              <p className="text-sm text-slate-400 font-medium mt-0.5">
                Welcome back, <span className="text-amber-300 font-bold">{user.username}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-700 px-6 py-3 rounded-lg border border-slate-600">
              <Coins className="size-6 text-amber-400" />
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Balance</span>
                <span className="font-black text-2xl text-amber-400">{user.coin.toLocaleString()}</span>
              </div>
            </div>
            <Button variant="outline" onClick={onLogout} className="border-slate-600 text-slate-300 hover:bg-red-950/50 hover:text-red-300 hover:border-red-500/50 transition-all duration-200">
              <LogOut className="size-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 max-w-3xl mx-auto h-14 bg-slate-800 border border-slate-700 rounded-lg p-1">
            <TabsTrigger value="catalog" className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900 data-[state=active]:font-bold text-slate-400 rounded-lg">
              <ShoppingBag className="size-5 mr-2" />
              <span className="text-base">Store</span>
            </TabsTrigger>
            <TabsTrigger value="gacha" className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900 data-[state=active]:font-bold text-slate-400 rounded-lg">
              <Star className="size-5 mr-2" />
              <span className="text-base">Gacha</span>
            </TabsTrigger>
            <TabsTrigger value="collection" className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900 data-[state=active]:font-bold text-slate-400 rounded-lg">
              <Package className="size-5 mr-2" />
              <span className="text-base">Collection</span>
            </TabsTrigger>
            <TabsTrigger value="banlist" className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900 data-[state=active]:font-bold text-slate-400 rounded-lg">
              <Shield className="size-5 mr-2" />
              <span className="text-base">Banlist</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="catalog" className="mt-6">
            <CatalogTab user={user} onUserUpdate={onUserUpdate} />
          </TabsContent>

          <TabsContent value="gacha" className="mt-6">
            <GachaTab user={user} onUserUpdate={onUserUpdate} />
          </TabsContent>

          <TabsContent value="collection" className="mt-6">
            <CollectionTab userId={user.id} />
          </TabsContent>

          <TabsContent value="banlist" className="mt-6">
            <UserBanlistTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// Archetype card fetching state
interface ArchetypeCard {
  id: number;
  name: string;
  type: string;
  desc: string;
  atk?: number;
  def?: number;
  level?: number;
  race: string;
  attribute?: string;
  card_images: Array<{ id: number; image_url: string; image_url_small: string; image_url_cropped: string }>;
}

// Cache for archetype images - fetched dynamically from API
const archetypeImageCache: Record<string, string> = {};
// Cache to record archetypes that previously returned no result (to avoid repeated 400 requests)
const archetypeImageFailCache: Record<string, boolean> = {};

function CatalogTab({ user, onUserUpdate }: { user: UserModel; onUserUpdate: (userId: string) => void }) {
  const [category, setCategory] = useState<"decks" | "staples" | "bundles">("decks");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRating, setFilterRating] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "price-asc" | "price-desc" | "rating">("name");
  const [viewMode, setViewMode] = useState<"list" | "compact" | "grid">("grid");
  const [confirmPurchase, setConfirmPurchase] = useState<CatalogItem | CardBundle | null>(null);
  const [selectedCard, setSelectedCard] = useState<ArchetypeCard | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(null);
  const [selectedBundle, setSelectedBundle] = useState<CardBundle | null>(null);
  const [archetypeCards, setArchetypeCards] = useState<ArchetypeCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [cardError, setCardError] = useState("");
  const [archetypeImages, setArchetypeImages] = useState<Record<string, string>>(archetypeImageCache);
  // Track which images are currently being fetched to avoid duplicate requests
  const pendingFetches = useRef<Set<string>>(new Set());
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;

  // Persisted admin card modifications (loaded/saved from DB)
  const [saveState, setSaveState] = useState<'idle'|'saving'|'saved'|'error'>('idle');
  const saveTimerRef = useRef<number | null>(null);
  
  // Listen for modification changes from admin panel
  const _modVersion = useModificationVersion();
  // Listen for banlist changes
  const _banlistVersion = useBanlistVersion();

  // Debounced search for performance
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 150);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Helper functions to get admin-modified values
  const getDisplayName = useCallback((item: CatalogItem): string => {
    return cardModifications[item.name]?.displayName ?? item.name;
  }, []);

  const getModifiedRating = useCallback((item: CatalogItem): string => {
    return cardModifications[item.name]?.rating ?? item.rating;
  }, []);

  const getModifiedPrice = useCallback((item: CatalogItem): number => {
    return cardModifications[item.name]?.price ?? item.price;
  }, []);

  const getBanStatus = useCallback((cardName: string): BanStatus => {
    return (banlist[cardName]?.banStatus as BanStatus) ?? 'unlimited';
  }, []);

  const getModifiedImage = useCallback((item: CatalogItem): string | undefined => {
    // Priority: admin override > API fetched > catalog hardcoded
    return cardModifications[item.name]?.imageUrl ?? archetypeImages[item.name] ?? item.imageUrl;
  }, [archetypeImages]);

  // Fallback to placeholder when image fails
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    // Create a simple SVG placeholder
    img.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect fill='%23334155' width='100' height='100'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='24' fill='%2394a3b8' text-anchor='middle' dy='.3em'%3E%3F%3C/text%3E%3C/svg%3E`;
    img.onerror = null; // Prevent infinite loop
  };

  // Use effective staples list (includes admin additions/removals)
  const rawItems = category === "decks" ? ARCHETYPE_DECKS : category === "staples" ? getEffectiveStaples() : CARD_BUNDLES;
  
  // Filter out removed archetypes (marked as is_removed in card modifications)
  const items = useMemo(() => {
    if (category === "bundles") return rawItems; // Bundles don't have modifications
    return rawItems.filter(item => {
      const mod = cardModifications[item.name];
      return !mod || !mod.is_removed;
    });
  }, [rawItems, cardModifications, category]);
  
  // Memoize filtered items for performance
  const filteredItems = useMemo(() => {
    const filtered = items.filter((item: any) => {
      if (category === "bundles") {
        // Bundle filtering
        const matchesSearch = item.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                              item.type.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
        const matchesRating = filterRating === "all" || item.rating === filterRating;
        return matchesSearch && matchesRating;
      } else {
        // Deck/Staple filtering
        const displayName = cardModifications[item.name]?.displayName ?? item.name;
        const matchesSearch = item.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                              displayName.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
        const currentRating = cardModifications[item.name]?.rating ?? item.rating;
        const matchesRating = filterRating === "all" || currentRating === filterRating;
        return matchesSearch && matchesRating;
      }
    });

    // Apply sorting
    return filtered.sort((a, b) => {
      if (sortBy === "name") {
        const nameA = (cardModifications[a.name]?.displayName ?? a.name).toLowerCase();
        const nameB = (cardModifications[b.name]?.displayName ?? b.name).toLowerCase();
        return nameA.localeCompare(nameB);
      } else if (sortBy === "price-asc") {
        const priceA = cardModifications[a.name]?.price ?? a.price;
        const priceB = cardModifications[b.name]?.price ?? b.price;
        return priceA - priceB;
      } else if (sortBy === "price-desc") {
        const priceA = cardModifications[a.name]?.price ?? a.price;
        const priceB = cardModifications[b.name]?.price ?? b.price;
        return priceB - priceA;
      } else if (sortBy === "rating") {
        const ratingOrder = ["S+", "S", "A", "B", "C", "D", "F"];
        const ratingA = cardModifications[a.name]?.rating ?? a.rating;
        const ratingB = cardModifications[b.name]?.rating ?? b.rating;
        return ratingOrder.indexOf(ratingA) - ratingOrder.indexOf(ratingB);
      }
      return 0;
    });
  }, [items, debouncedSearchTerm, filterRating, sortBy]);
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [category, debouncedSearchTerm, filterRating]);
  
  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Fetch a single archetype image
  const fetchArchetypeImage = useCallback(async (archetypeName: string) => {
    if (archetypeImageCache[archetypeName]) return;
    if (archetypeImageFailCache[archetypeName]) return;
    if (pendingFetches.current.has(archetypeName)) return;

    pendingFetches.current.add(archetypeName);

    const tryUrls = [
      `https://db.ygoprodeck.com/api/v7/cardinfo.php?archetype=${encodeURIComponent(archetypeName)}`,
      `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(archetypeName)}`,
      `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(archetypeName)}`,
      `https://db.ygoprodeck.com/api/v7/cardinfo.php?archetype=${encodeURIComponent(archetypeName)}&num=1&offset=0`,
      `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(archetypeName)}&num=1&offset=0`,
    ];

    for (const url of tryUrls) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          let bodyText = "";
          try { bodyText = await response.text(); } catch (e) {}
          if (response.status === 400 || bodyText?.includes('No card matching your query')) {
            archetypeImageFailCache[archetypeName] = true;
            break;
          }
          continue;
        }

        const data = await response.json();
        const imageUrl = data?.data?.[0]?.card_images?.[0]?.image_url_small;
        if (imageUrl) {
          archetypeImageCache[archetypeName] = imageUrl;
          setArchetypeImages(prev => ({ ...prev, [archetypeName]: imageUrl }));
          return;
        }
      } catch (err) {
        console.warn('Archetype image fetch failed', { archetypeName, err });
      }
    }

    pendingFetches.current.delete(archetypeName);
  }, []);

  // Lazy load images as items scroll into view
  const observerRef = useRef<IntersectionObserver | null>(null);
  const observedElements = useRef<Map<Element, string>>(new Map());

  useEffect(() => {
    if (category !== "decks") return;

    // Create IntersectionObserver to load images when items come into view
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const archetypeName = observedElements.current.get(entry.target);
            if (archetypeName && !archetypeImageCache[archetypeName] && !archetypeImageFailCache[archetypeName]) {
              fetchArchetypeImage(archetypeName);
            }
          }
        });
      },
      { rootMargin: '100px', threshold: 0 } // Start loading 100px before item comes into view
    );

    return () => {
      observerRef.current?.disconnect();
    };
  }, [category, fetchArchetypeImage]);

  // Callback ref to observe each catalog item
  const observeItem = useCallback((element: HTMLDivElement | null, itemName: string) => {
    if (!element || category !== "decks") return;
    
    // Already have the image cached, no need to observe
    if (archetypeImageCache[itemName]) return;
    
    observedElements.current.set(element, itemName);
    observerRef.current?.observe(element);
  }, [category]);

  // This function is now replaced by getModifiedImage above

  async function handlePurchase(item: CatalogItem | CardBundle) {
    setError("");
    setSuccess("");
    setPurchasing(item.name);

    // Check if this is a bundle purchase
    const isBundle = 'cards' in item;
    
    // Use modified price if admin has changed it (for decks/staples), or bundle price
    const actualPrice = isBundle ? item.price : getModifiedPrice(item as CatalogItem);
    const displayName = isBundle ? item.name : getDisplayName(item as CatalogItem);

    try {
      // Check if user has enough coins
      if (user.coin < actualPrice) {
        setError("Insufficient coins!");
        return;
      }

      // Check if already purchased
      const purchaseORM = PurchaseORM.getInstance();
      const existing = await purchaseORM.getPurchaseByItemNameUserId(item.name, user.id);
      if (existing.length > 0) {
        setError("You already own this item!");
        return;
      }

      // Create purchase record
      let itemType: PurchaseItemType;
      if (isBundle) {
        itemType = PurchaseItemType.Bundle;
      } else {
        itemType = category === "decks" ? PurchaseItemType.Deck : PurchaseItemType.Staple;
      }
      
      await purchaseORM.insertPurchase([
        {
          user_id: user.id,
          item_name: item.name,
          item_type: itemType,
          bought_at: String(Math.floor(Date.now() / 1000)),
        } as unknown as PurchaseModel,
      ]);

      // If this is a bundle, add all cards to user's collection
      if (isBundle) {
        const bundle = item as CardBundle;
        const cardCatalogORM = CardCatalogORM.getInstance();
        const cardsToAdd = bundle.cards.map(card => ({
          name: card.name,
          data: {
            id: card.id,
            name: card.name,
            type: card.type,
            desc: card.desc,
            card_images: card.imageUrl ? [{ image_url: card.imageUrl }] : [],
          },
          archetypes: [`BUNDLE:${bundle.name}`, `USER:${user.id}`],
        }));
        await cardCatalogORM.bulkUpsert(cardsToAdd);
      }

      // Update user coins
      const userORM = UserORM.getInstance();
      const updatedUser = { ...user, coin: user.coin - actualPrice };
      await userORM.setUserById(user.id, updatedUser);

      // Log the purchase
      const coinLogORM = CoinLogORM.getInstance();
      await coinLogORM.insertCoinLog([
        {
          user_id: user.id,
          amount: -actualPrice,
          reason: `Purchased ${displayName}`,
          // store as unix seconds to match bigint DB column
          created_at: String(Math.floor(Date.now() / 1000)),
        } as unknown as CoinLogModel,
      ]);

      if (isBundle) {
        const bundle = item as CardBundle;
        setSuccess(`Successfully purchased ${displayName}! Added ${bundle.cards.length} cards to your collection.`);
      } else {
        setSuccess(`Successfully purchased ${displayName}!`);
      }
      onUserUpdate(user.id);
    } catch (err: any) {
      console.error('Purchase failed:', err);
      const msg = err?.message || err?.code || String(err);
      setError(`Purchase failed: ${msg}`);
    } finally {
      setPurchasing(null);
    }
  }

  // Player-facing archetype preview (Store tab) - syncs with admin panel changes
  async function handleArchetypeClick(archetypeName: string) {
    setSelectedArchetype(archetypeName);
    setLoadingCards(true);
    setCardError("");
    setArchetypeCards([]);

    try {
      const dbOrm = CardCatalogORM.getInstance();
      let baseCards: any[] = [];

      // Priority 1: Check admin's in-memory cache (fastest, reflects admin's current edits)
      if (archetypeCardsCache[archetypeName]?.length > 0) {
        baseCards = archetypeCardsCache[archetypeName];
      } else {
        // Priority 2: Try loading from local DB (where admin persists changes)
        try {
          const dbCards = await dbOrm.getByArchetype(archetypeName, 500);
          if (dbCards && dbCards.length > 0) {
            baseCards = dbCards.map((r: any) => {
              const data = typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
              return data;
            });
            // Update cache for next time
            archetypeCardsCache[archetypeName] = baseCards;
          }
        } catch (e) {
          console.warn('Failed to load from DB, falling back to API', e);
        }

        // Priority 3: Fallback to external API
        if (baseCards.length === 0) {
          const urls = [
            `https://db.ygoprodeck.com/api/v7/cardinfo.php?archetype=${encodeURIComponent(archetypeName)}&num=200&offset=0`,
            `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(archetypeName)}&num=200&offset=0`,
            `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(archetypeName)}&num=200&offset=0`,
          ];

          for (const url of urls) {
            try {
              const resp = await fetch(url);
              if (!resp.ok) continue;
              const data = await resp.json();
              if (Array.isArray(data.data) && data.data.length > 0) {
                baseCards = data.data.slice(0, 200);
                // Cache to DB for future lookups
                try {
                  const payload = baseCards.map((c: any) => ({ name: c.name, data: c, archetypes: c.archetype ? [c.archetype] : [archetypeName] }));
                  await dbOrm.bulkUpsert(payload);
                  // Also update in-memory cache
                  archetypeCardsCache[archetypeName] = baseCards;
                } catch (err) {
                  console.warn('Failed to cache archetype cards to DB', archetypeName, err);
                }
                break;
              }
            } catch (err) {
              console.warn('Archetype fetch failed', { archetypeName, url, err });
            }
          }
        }
      }

      // Include admin-added custom cards (persisted via card_modifications)
      try {
        const rawCustom: any[] = (cardModifications[archetypeName]?.customCards) || [];
        const customObjs: Array<{ name: string; data?: any }> = rawCustom.map((r) => (typeof r === 'string' ? { name: r } : r));
        const customNames: string[] = customObjs.map((c) => c.name);

        if (customNames.length > 0) {
          const customCards: any[] = [];
          for (const cname of customNames) {
            try {
              // Try DB first
              const dbMatch = await dbOrm.getByName(cname);
              if (dbMatch) {
                customCards.push(dbMatch.data);
                continue;
              }

              // Try external API and optionally save to DB
              const r = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(cname)}`);
              if (r.ok) {
                const d = await r.json();
                if (Array.isArray(d.data) && d.data.length > 0) {
                  customCards.push(d.data[0]);
                  continue;
                }
              }

              // fallback to fname
              const rf = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(cname)}`);
              if (rf.ok) {
                const df = await rf.json();
                if (Array.isArray(df.data) && df.data.length > 0) {
                  customCards.push(df.data[0]);
                }
              }
            } catch (err) {
              console.warn('Failed to resolve custom card', cname, err);
            }
          }

          // Append unique custom cards (avoid duplicates by name)
          const existingNames = new Set(baseCards.map((c: any) => c.name));
          for (const cc of customCards) {
            if (!existingNames.has(cc.name)) {
              baseCards.push(cc);
              existingNames.add(cc.name);
            }
          }

          // Also include any admin-supplied data objects already present in the mods (fast path)
          for (const obj of customObjs) {
            if (obj.data && !existingNames.has(obj.name)) {
              baseCards.push(obj.data);
              existingNames.add(obj.name);
            }
          }
        }
      } catch (e) {
        console.warn('Error loading custom cards for archetype in CollectionTab', archetypeName, e);
      }

      setArchetypeCards(baseCards);
    } catch (err) {
      console.error('handleArchetypeClick error', err);
      setCardError("Could not load cards. Try again later.");
    } finally {
      setLoadingCards(false);
    }
  }

  // Get rating color based on tier
  function getRatingStyle(rating: string) {
    switch (rating) {
      case "S+":
        return "bg-rose-500 text-white border-rose-400";
      case "S":
        return "bg-amber-500 text-slate-900 border-amber-400";
      case "A":
        return "bg-violet-500 text-white border-violet-400";
      case "B":
        return "bg-blue-500 text-white border-blue-400";
      case "C":
        return "bg-emerald-500 text-white border-emerald-400";
      case "D":
        return "bg-slate-600 text-slate-200 border-slate-500";
      case "F":
        return "bg-slate-700 text-slate-400 border-slate-600";
      default:
        return "bg-slate-600 text-slate-300 border-slate-500";
    }
  }

  // Get rating description for tooltip
  function getRatingDescription(rating: string) {
    switch (rating) {
      case "S+":
        return "Top tier - Tournament dominant";
      case "S":
        return "Tier 1 - Highly competitive";
      case "A":
        return "Tier 2 - Strong and viable";
      case "B":
        return "Tier 3 - Playable competitively";
      case "C":
        return "Casual - Fun but less competitive";
      case "D":
        return "Below average - Needs support";
      case "F":
        return "Poor - Not recommended";
      default:
        return "Not rated";
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" className="bg-red-950 border-red-500">
          <AlertDescription className="text-red-200">{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="bg-emerald-950 border border-emerald-500 text-emerald-200">
          <AlertDescription className="font-semibold">{success}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="flex gap-2">
          <Button variant={category === "decks" ? "default" : "outline"} onClick={() => setCategory("decks")} className={category === "decks" ? "bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold" : "border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-amber-500 hover:text-amber-400"}>
            Archetype Decks ({ARCHETYPE_DECKS.length})
          </Button>
          <Button variant={category === "staples" ? "default" : "outline"} onClick={() => setCategory("staples")} className={category === "staples" ? "bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold" : "border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-amber-500 hover:text-amber-400"}>
            Staple Cards ({getEffectiveStaples().length})
          </Button>
          <Button variant={category === "bundles" ? "default" : "outline"} onClick={() => setCategory("bundles")} className={category === "bundles" ? "bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold" : "border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-amber-500 hover:text-amber-400"}>
            Bundles ({CARD_BUNDLES.length})
          </Button>
        </div>
        <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
          <div className="relative w-full md:w-48">
            <Input placeholder="Search items..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pr-8 bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-amber-500" />
            {searchTerm && (
              <button type="button" onClick={() => setSearchTerm("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                <X className="size-4" />
              </button>
            )}
          </div>
          <Select value={filterRating} onValueChange={setFilterRating}>
            <SelectTrigger className="w-28 bg-slate-700 border-slate-600 text-slate-100 focus:border-amber-500">
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-slate-200 focus:bg-slate-700 focus:text-amber-300">All</SelectItem>
              <SelectItem value="S+" className="text-slate-200 focus:bg-slate-700 focus:text-amber-300">S+</SelectItem>
              <SelectItem value="S" className="text-slate-200 focus:bg-slate-700 focus:text-amber-300">S</SelectItem>
              <SelectItem value="A" className="text-slate-200 focus:bg-slate-700 focus:text-amber-300">A</SelectItem>
              <SelectItem value="B" className="text-slate-200 focus:bg-slate-700 focus:text-amber-300">B</SelectItem>
              <SelectItem value="C" className="text-slate-200 focus:bg-slate-700 focus:text-amber-300">C</SelectItem>
              <SelectItem value="D" className="text-slate-200 focus:bg-slate-700 focus:text-amber-300">D</SelectItem>
              <SelectItem value="F" className="text-slate-200 focus:bg-slate-700 focus:text-amber-300">F</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(val) => setSortBy(val as any)}>
            <SelectTrigger className="w-32 bg-slate-700 border-slate-600 text-slate-100 focus:border-amber-500">
              <ArrowUpDown className="size-4 mr-2" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="name" className="text-slate-200 focus:bg-slate-700 focus:text-amber-300">Name</SelectItem>
              <SelectItem value="price-asc" className="text-slate-200 focus:bg-slate-700 focus:text-amber-300">Price ↑</SelectItem>
              <SelectItem value="price-desc" className="text-slate-200 focus:bg-slate-700 focus:text-amber-300">Price ↓</SelectItem>
              <SelectItem value="rating" className="text-slate-200 focus:bg-slate-700 focus:text-amber-300">Rating</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-0.5 border border-slate-600 rounded-md p-0.5 bg-slate-800">
            <Button variant="ghost" size="icon" onClick={() => setViewMode("list")} className={`size-8 ${viewMode === "list" ? "bg-amber-500 text-slate-900" : "text-slate-400 hover:text-slate-200 hover:bg-slate-700"}`} title="List View">
              <List className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setViewMode("compact")} className={`size-8 ${viewMode === "compact" ? "bg-amber-500 text-slate-900" : "text-slate-400 hover:text-slate-200 hover:bg-slate-700"}`} title="Compact View">
              <Grid3X3 className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setViewMode("grid")} className={`size-8 ${viewMode === "grid" ? "bg-amber-500 text-slate-900" : "text-slate-400 hover:text-slate-200 hover:bg-slate-700"}`} title="Grid View">
              <LayoutGrid className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats and Info Bar */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800 border border-slate-700">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Package className="size-4 text-amber-400 animate-pulse" />
            <span className="text-slate-400">Showing:</span>
            <span className="font-bold text-amber-300 text-base">{paginatedItems.length}</span>
            <span className="text-slate-500">/</span>
            <span className="font-semibold text-slate-300">{filteredItems.length}</span>
          </div>
          <div className="h-6 w-px bg-slate-600" />
          <div className="flex items-center gap-2">
            <Coins className="size-4 text-amber-400 drop-" />
            <span className="text-slate-400">Your Balance:</span>
            <span className="font-bold text-amber-300 text-base">{user.coin.toLocaleString()}</span>
          </div>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 px-3 border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-30"
            >
              Previous
            </Button>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-slate-400">Page</span>
              <span className="font-bold text-amber-400">{currentPage}</span>
              <span className="text-slate-500">/</span>
              <span className="text-slate-400">{totalPages}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 px-3 border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-30"
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* List View */}
      {viewMode === "list" && (
        <div className="space-y-2">
          {paginatedItems.map((item) => {
            const displayName = getDisplayName(item);
            const rating = getModifiedRating(item);
            const price = getModifiedPrice(item);
            const imageUrl = getModifiedImage(item);
            return (
              <div key={item.name} ref={(el) => observeItem(el, item.name)} className="flex items-center gap-4 p-3 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 transition-colors">
                <div className="shrink-0 size-10 rounded overflow-hidden border border-slate-600 bg-slate-700">
                  {imageUrl ? (
                    <img src={imageUrl} alt={displayName} className="w-full h-full object-cover" loading="lazy" onError={handleImageError} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-xl font-bold">?</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {category === "decks" ? (
                    <span className="font-semibold text-slate-100 truncate cursor-pointer hover:text-amber-300 transition-colors flex items-center gap-1" onClick={() => handleArchetypeClick(item.name)} title="Click to view cards">
                      {displayName}
                      <Eye className="size-3 text-slate-500" />
                    </span>
                  ) : (
                    <span className="font-semibold text-slate-100 truncate">{displayName}</span>
                  )}
                </div>
                <Badge className={`font-bold shrink-0 ${getRatingStyle(rating)}`}>{rating}</Badge>
                <div className="flex items-center gap-1.5 bg-amber-900 px-2 py-1 rounded border border-amber-700">
                  <Coins className="size-3.5 text-amber-400" />
                  <span className="font-bold text-amber-300 text-sm">{price}</span>
                </div>
                <Button size="sm" onClick={() => setConfirmPurchase(item)} disabled={purchasing === item.name || user.coin < price} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold disabled:opacity-50 text-xs px-3">
                  {purchasing === item.name ? "..." : "Buy"}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Compact View */}
      {viewMode === "compact" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {paginatedItems.map((item) => {
            const displayName = getDisplayName(item);
            const rating = getModifiedRating(item);
            const price = getModifiedPrice(item);
            const imageUrl = getModifiedImage(item);
            return (
              <div key={item.name} ref={(el) => observeItem(el, item.name)} className="p-3 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 transition-colors flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="shrink-0 size-8 rounded overflow-hidden border border-slate-600 bg-slate-700">
                    {imageUrl ? (
                      <img src={imageUrl} alt={displayName} className="w-full h-full object-cover" loading="lazy" onError={handleImageError} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm font-bold">?</div>
                    )}
                  </div>
                  <Badge className={`font-bold text-xs ${getRatingStyle(rating)}`}>{rating}</Badge>
                </div>
                {category === "decks" ? (
                  <span className="font-semibold text-sm text-slate-100 truncate cursor-pointer hover:text-amber-300 transition-colors" onClick={() => handleArchetypeClick(item.name)} title={displayName}>
                    {displayName}
                  </span>
                ) : (
                  <span className="font-semibold text-sm text-slate-100 truncate" title={displayName}>{displayName}</span>
                )}
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1 text-amber-300">
                    <Coins className="size-3" />
                    <span className="text-sm font-bold">{price}</span>
                  </div>
                  <Button size="sm" onClick={() => setConfirmPurchase(item)} disabled={purchasing === item.name || user.coin < price} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold disabled:opacity-50 text-xs h-7 px-2">
                    {purchasing === item.name ? "..." : "Buy"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {category === "bundles" ? (
            // Bundle rendering
            paginatedItems.map((bundle: any) => (
              <Card key={bundle.name} className="border border-slate-700 bg-slate-800 overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 size-16 rounded-lg overflow-hidden border border-slate-600 bg-slate-700">
                      {bundle.imageUrl ? (
                        <img src={bundle.imageUrl} alt={bundle.name} className="w-full h-full object-cover" loading="lazy" onError={handleImageError} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500 text-2xl font-bold">📦</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg font-bold text-slate-100 truncate cursor-pointer hover:text-amber-300 transition-colors flex items-center gap-1" onClick={() => setSelectedBundle(bundle)} title="Click to view cards in this bundle">
                          {bundle.name}
                          <Eye className="size-3 text-slate-500" />
                        </CardTitle>
                        <Badge className={`font-bold shrink-0 ${getRatingStyle(bundle.rating)}`}>{bundle.rating}</Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{bundle.cards.length} cards • {bundle.type}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 bg-amber-900 px-3 py-1.5 rounded-lg border border-amber-700">
                      <Coins className="size-4 text-amber-400" />
                      <span className="font-bold text-amber-300">{bundle.price}</span>
                    </div>
                    <Button size="sm" onClick={() => setConfirmPurchase(bundle)} disabled={purchasing === bundle.name || user.coin < bundle.price} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold disabled:opacity-50">
                      {purchasing === bundle.name ? "..." : "Buy"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            // Deck/Staple rendering
            paginatedItems.map((item) => {
            const displayName = getDisplayName(item);
            const rating = getModifiedRating(item);
            const price = getModifiedPrice(item);
            const imageUrl = getModifiedImage(item);
            return (
              <Card key={item.name} ref={(el) => observeItem(el, item.name)} className="border border-slate-700 bg-slate-800 overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 size-16 rounded-lg overflow-hidden border border-slate-600 bg-slate-700 relative">
                      {imageUrl ? (
                        <img src={imageUrl} alt={displayName} className="w-full h-full object-cover" loading="lazy" onError={handleImageError} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500 text-2xl font-bold">?</div>
                      )}
                      <div className="absolute bottom-0 right-0">
                        <BanIndicator banStatus={getBanStatus(item.name)} size="sm" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        {category === "decks" ? (
                          <CardTitle className="text-lg font-bold text-slate-100 truncate cursor-pointer hover:text-amber-300 transition-colors flex items-center gap-1" onClick={() => handleArchetypeClick(item.name)} title="Click to view cards in this archetype">
                            {displayName}
                            <Eye className="size-3 text-slate-500" />
                          </CardTitle>
                        ) : (
                          <CardTitle className="text-lg font-bold text-slate-100 truncate">{displayName}</CardTitle>
                        )}
                        <Badge className={`font-bold shrink-0 ${getRatingStyle(rating)}`}>{rating}</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 bg-amber-900 px-3 py-1.5 rounded-lg border border-amber-700">
                      <Coins className="size-4 text-amber-400" />
                      <span className="font-bold text-amber-300">{price}</span>
                    </div>
                    <Button size="sm" onClick={() => setConfirmPurchase(item)} disabled={purchasing === item.name || user.coin < price} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold disabled:opacity-50">
                      {purchasing === item.name ? "..." : "Buy"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
          )}
        </div>
      )}

      {filteredItems.length === 0 && (
        <div className="text-center py-24 text-slate-400 bg-slate-800 rounded-xl border border-dashed border-slate-700">
          <Package className="size-16 mx-auto mb-4 text-slate-600 opacity-50" />
          <p className="text-lg font-semibold text-slate-300 mb-2">No items found</p>
          <p className="text-sm">Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Bottom Pagination */}
      {totalPages > 1 && filteredItems.length > 0 && (
        <div className="flex justify-center items-center gap-3 pt-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="h-9 px-3 border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-30"
          >
            First
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="h-9 px-4 border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-30"
          >
            Previous
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-600">
            <span className="text-slate-400 text-sm">Page</span>
            <span className="font-bold text-amber-400 text-lg">{currentPage}</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-300 font-semibold">{totalPages}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="h-9 px-4 border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-30"
          >
            Next
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="h-9 px-3 border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-30"
          >
            Last
          </Button>
        </div>
      )}

      <Dialog open={selectedArchetype !== null} onOpenChange={(open) => { if (!open) setSelectedArchetype(null); }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-amber-400">{selectedArchetype ? (cardModifications[selectedArchetype]?.displayName || selectedArchetype) : ''} Cards</DialogTitle>
            <DialogDescription className="text-slate-400">Cards that belong to the {selectedArchetype ? (cardModifications[selectedArchetype]?.displayName || selectedArchetype) : ''} archetype</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] pr-2">
            {loadingCards && (
              <div className="text-center py-12 text-amber-400 animate-pulse">Loading archetype cards...</div>
            )}
            {cardError && (
              <div className="text-center py-12 text-red-400">{cardError}</div>
            )}
            {!loadingCards && !cardError && archetypeCards.length === 0 && (
              <div className="text-center py-12 text-slate-400">No cards found for this archetype.</div>
            )}
            {!loadingCards && archetypeCards.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {archetypeCards.map((card) => (
                  <div 
                    key={card.id} 
                    className="flex flex-col p-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                    onClick={() => setSelectedCard(card)}
                    title="Click to view details"
                  >
                    {card.card_images?.[0]?.image_url_small && (
                      <div className="w-full aspect-[3/4] rounded overflow-hidden mb-2 relative">
                        <img src={card.card_images[0].image_url_small} alt={card.name} className="w-full h-full object-cover" loading="lazy" />
                        <div className="absolute top-1 right-1">
                          <BanIndicator banStatus={getBanStatus(card.name)} size="sm" />
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <div className="text-xs font-semibold text-slate-100 truncate flex-1" title={card.name}>{card.name}</div>
                      {!card.card_images?.[0]?.image_url_small && <BanIndicator banStatus={getBanStatus(card.name)} size="sm" />}
                    </div>
                    <div className="text-xs text-slate-400 truncate">{card.type}</div>
                    {card.atk !== undefined && (
                      <div className="text-xs text-amber-400">ATK: {card.atk} {card.def !== undefined && `/ DEF: ${card.def}`}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bundle Detail Dialog */}
      <Dialog open={selectedBundle !== null} onOpenChange={(open) => { if (!open) setSelectedBundle(null); }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-amber-400">{selectedBundle?.name}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedBundle?.cards.length} cards • {selectedBundle?.type} • {selectedBundle?.price} coins
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] pr-2">
            {selectedBundle && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {selectedBundle.cards.map((card) => (
                  <div 
                    key={card.id} 
                    className="flex flex-col p-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                    onClick={() => {
                      // Convert BundleCard to ArchetypeCard format
                      const archetypeCard: ArchetypeCard = {
                        id: card.id,
                        name: card.name,
                        type: card.type,
                        desc: card.desc,
                        race: card.type.split(' ')[0] || 'Unknown',
                        card_images: card.imageUrl ? [{ 
                          id: card.id, 
                          image_url: card.imageUrl,
                          image_url_small: card.imageUrl,
                          image_url_cropped: card.imageUrl
                        }] : []
                      };
                      setSelectedCard(archetypeCard);
                    }}
                    title="Click to view card details"
                  >
                    {card.imageUrl && (
                      <div className="w-full aspect-[3/4] rounded overflow-hidden mb-2">
                        <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" loading="lazy" onError={handleImageError} />
                      </div>
                    )}
                    <div className="text-xs font-semibold text-slate-100 truncate" title={card.name}>{card.name}</div>
                    <div className="text-xs text-slate-400 truncate">{card.type}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Purchase Confirmation Dialog */}
      <Dialog open={confirmPurchase !== null} onOpenChange={(open) => { if (!open) setConfirmPurchase(null); }}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-amber-400">Confirm Purchase</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to purchase this item?
            </DialogDescription>
          </DialogHeader>
          {confirmPurchase && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-slate-800 rounded-lg border border-slate-700">
                <div className="shrink-0 size-16 rounded overflow-hidden border border-slate-600 bg-slate-700">
                  {('imageUrl' in confirmPurchase && confirmPurchase.imageUrl) || getModifiedImage(confirmPurchase as CatalogItem) ? (
                    <img 
                      src={('imageUrl' in confirmPurchase ? confirmPurchase.imageUrl : getModifiedImage(confirmPurchase as CatalogItem)) || ''} 
                      alt={('name' in confirmPurchase ? confirmPurchase.name : getDisplayName(confirmPurchase as CatalogItem))} 
                      className="w-full h-full object-cover" 
                      onError={handleImageError} 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-2xl font-bold">?</div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-100">{('name' in confirmPurchase ? confirmPurchase.name : getDisplayName(confirmPurchase as CatalogItem))}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`font-bold text-xs ${getRatingStyle(('rating' in confirmPurchase ? confirmPurchase.rating : getModifiedRating(confirmPurchase as CatalogItem)))}`}>
                      {('rating' in confirmPurchase ? confirmPurchase.rating : getModifiedRating(confirmPurchase as CatalogItem))}
                    </Badge>
                    <span className="text-sm text-slate-400">{category === "decks" ? "Archetype Deck" : "Staple Card"}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-700">
                <div>
                  <p className="text-sm text-slate-400">Cost</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Coins className="size-5 text-amber-400" />
                    <span className="text-xl font-bold text-amber-400">{getModifiedPrice(confirmPurchase)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Your Balance</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Coins className="size-5 text-amber-400" />
                    <span className="text-xl font-bold text-slate-100">{user.coin}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setConfirmPurchase(null)} 
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    handlePurchase(confirmPurchase);
                    setConfirmPurchase(null);
                  }} 
                  disabled={user.coin < getModifiedPrice(confirmPurchase)}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
                >
                  Confirm Purchase
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Card Details Modal */}
      <Dialog open={selectedCard !== null} onOpenChange={(open) => { if (!open) setSelectedCard(null); }}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-amber-400">{selectedCard?.name}</DialogTitle>
          </DialogHeader>
          {selectedCard && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="shrink-0">
                  <img 
                    src={selectedCard.card_images[0]?.image_url_small || selectedCard.card_images[0]?.image_url} 
                    alt={selectedCard.name}
                    className="w-48 h-auto rounded-lg border border-slate-600"
                    onError={handleImageError}
                  />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-sm text-slate-400">Type</p>
                    <p className="text-slate-100 font-semibold">{selectedCard.type}</p>
                  </div>
                  {selectedCard.race && (
                    <div>
                      <p className="text-sm text-slate-400">Race/Type</p>
                      <p className="text-slate-100 font-semibold">{selectedCard.race}</p>
                    </div>
                  )}
                  {selectedCard.attribute && (
                    <div>
                      <p className="text-sm text-slate-400">Attribute</p>
                      <p className="text-slate-100 font-semibold">{selectedCard.attribute}</p>
                    </div>
                  )}
                  {selectedCard.level !== undefined && (
                    <div>
                      <p className="text-sm text-slate-400">Level/Rank</p>
                      <p className="text-slate-100 font-semibold">{selectedCard.level}</p>
                    </div>
                  )}
                  {selectedCard.atk !== undefined && (
                    <div className="flex gap-4">
                      <div>
                        <p className="text-sm text-slate-400">ATK</p>
                        <p className="text-slate-100 font-semibold">{selectedCard.atk}</p>
                      </div>
                      {selectedCard.def !== undefined && (
                        <div>
                          <p className="text-sm text-slate-400">DEF</p>
                          <p className="text-slate-100 font-semibold">{selectedCard.def}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-2">Description</p>
                <p className="text-slate-200 leading-relaxed bg-slate-800 p-3 rounded-lg border border-slate-700">
                  {selectedCard.desc}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

type AllCardsViewMode = "grid" | "list";
type CardTypeFilter = "all" | "monster" | "spell" | "trap";
type CardSortOption = "name-asc" | "name-desc" | "atk-asc" | "atk-desc" | "def-asc" | "def-desc" | "level-asc" | "level-desc" | "type" | "newest" | "oldest";

function CollectionTab({ userId }: { userId: string }) {
  const [purchases, setPurchases] = useState<PurchaseModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<"history" | "allCards">("allCards");
  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(null);
  const [archetypeCards, setArchetypeCards] = useState<ArchetypeCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [cardError, setCardError] = useState("");
  const [allOwnedCards, setAllOwnedCards] = useState<ArchetypeCard[]>([]);
  const [loadingAllCards, setLoadingAllCards] = useState(false);
  const [allCardsError, setAllCardsError] = useState("");

  // New state for All My Cards view mode and filters
  const [allCardsViewMode, setAllCardsViewMode] = useState<AllCardsViewMode>("grid");
  const [cardTypeFilter, setCardTypeFilter] = useState<CardTypeFilter>("all");
  const [archetypeFilter, setArchetypeFilter] = useState<string>("all");
  const [cardSearchTerm, setCardSearchTerm] = useState("");
  const [cardSortOption, setCardSortOption] = useState<CardSortOption>("name-asc");
  
  // Pagination for purchase history
  const [historyPage, setHistoryPage] = useState(1);
  const historyPerPage = 20;

  // Ref to allow BroadcastChannel callback to reload current archetype
  const handleArchetypeClickRef = useRef<(name: string) => Promise<void>>(async () => {});

  // Get ban status for a card
  const _banlistVersion = useBanlistVersion();
  const getBanStatus = useCallback((cardName: string): BanStatus => {
    return (banlist[cardName]?.banStatus as BanStatus) ?? 'unlimited';
  }, [_banlistVersion]);

  useEffect(() => {
    loadPurchases();
  }, [userId]);

  async function loadPurchases() {
    try {
      const purchaseORM = PurchaseORM.getInstance();
      const data = await purchaseORM.getPurchaseByUserId(userId);
      // Sort by unix timestamp (numeric comparison, not Date parse)
      setPurchases(data.sort((a, b) => Number(b.bought_at) - Number(a.bought_at)));
    } catch (error) {
      console.error("Failed to load purchases:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleArchetypeClick(archetypeName: string) {
    setSelectedArchetype(archetypeName);
    setLoadingCards(true);
    setCardError("");
    setArchetypeCards([]);

    try {
      const dbOrm = CardCatalogORM.getInstance();
      let baseCards: any[] = [];

      // Priority 1: Check admin's in-memory cache (fastest, reflects admin's current edits)
      if (archetypeCardsCache[archetypeName]?.length > 0) {
        baseCards = [...archetypeCardsCache[archetypeName]];
      } else {
        // Priority 2: Try DB first
        try {
          const dbCards = await dbOrm.getByArchetype(archetypeName, 500);
          if (dbCards && dbCards.length > 0) {
            baseCards = dbCards.map((r: any) => {
              // r.data may be a string if previously stored incorrectly; normalize here as well
              if (typeof r.data === 'string') {
                try { return JSON.parse(r.data); } catch (e) { console.warn('handleArchetypeClick: failed to parse db card data', { archetypeName, name: r.name, err: e }); return r.data; }
              }
              return r.data;
            });
            // Update cache for next time
            archetypeCardsCache[archetypeName] = baseCards;
          }
        } catch (e) {
          console.warn('Card DB lookup failed, falling back to external API', e);
        }

        // Priority 3: If DB had no results, fall back to external API and populate DB
        if (baseCards.length === 0) {
          const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?archetype=${encodeURIComponent(archetypeName)}`);
          if (!response.ok) {
            const nameResponse = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(archetypeName)}`);
            if (nameResponse.ok) {
              const nameData = await nameResponse.json();
              baseCards = nameData.data?.slice(0, 50) || [];
            } else {
              baseCards = [];
            }
          } else {
            const data = await response.json();
            baseCards = data.data?.slice(0, 50) || [];
          }

          // Persist whatever we fetched to DB so subsequent views are fast
          try {
            if (baseCards.length > 0) {
              const payload = baseCards.map((c: any) => ({ name: c.name, data: c, archetypes: c.archetype ? [c.archetype] : [] }));
              await dbOrm.bulkUpsert(payload);
              // Update in-memory cache
              archetypeCardsCache[archetypeName] = baseCards;
            }
          } catch (e) {
            console.warn('Failed to bulk upsert archetype cards to DB', e);
          }
        }
      }

      // Include admin-added custom cards (persisted via card_modifications)
      try {
        const rawCustom: any[] = (cardModifications[archetypeName]?.customCards) || [];
        const customObjs: Array<{ name: string; data?: any }> = rawCustom.map((r) => (typeof r === 'string' ? { name: r } : r));
        const customNames: string[] = customObjs.map((c) => c.name);
        if (customNames.length > 0) {
          const customCards: any[] = [];
          for (const cname of customNames) {
            try {
              // Try DB first
              const dbMatch = await dbOrm.getByName(cname);
              if (dbMatch) {
                customCards.push(dbMatch.data);
                continue;
              }

              // Try external API lookup and optionally save to DB for next time
              const r = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(cname)}`);
              if (r.ok) {
                const d = await r.json();
                if (Array.isArray(d.data) && d.data.length > 0) {
                  customCards.push(d.data[0]);
                  try {
                    await dbOrm.bulkUpsert([{ name: d.data[0].name, data: d.data[0], archetypes: d.data[0].archetype ? [d.data[0].archetype] : [] }]);
                  } catch (e) {
                    console.warn('Failed to upsert custom card to DB', cname, e);
                  }
                  continue;
                }
              }

              // fallback to fname
              const rf = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(cname)}`);
              if (rf.ok) {
                const df = await rf.json();
                if (Array.isArray(df.data) && df.data.length > 0) {
                  customCards.push(df.data[0]);
                  try {
                    await dbOrm.bulkUpsert([{ name: df.data[0].name, data: df.data[0], archetypes: df.data[0].archetype ? [df.data[0].archetype] : [] }]);
                  } catch (e) {
                    console.warn('Failed to upsert custom card to DB', cname, e);
                  }
                }
              }
            } catch (err) {
              console.warn('Failed to resolve custom card', cname, err);
            }
          }
          // Append unique custom cards (avoid duplicates by name)
          const existingNames = new Set(baseCards.map((c: any) => c.name));
          for (const cc of customCards) {
            if (!existingNames.has(cc.name)) baseCards.push(cc);
          }

          // Also include any admin-supplied data objects already present in the mods (fast path)
          for (const obj of customObjs) {
            if (obj.data && !existingNames.has(obj.name)) baseCards.push(obj.data);
          }
        }
      } catch (e) {
        console.warn('Error loading custom cards for archetype', archetypeName, e);
      }

      setArchetypeCards(baseCards);
    } catch (err) {
      console.error(err);
      setCardError("Could not load cards. Try again later.");
    } finally {
      setLoadingCards(false);
    }
  }

  // Update the ref whenever handleArchetypeClick is redefined
  useEffect(() => {
    handleArchetypeClickRef.current = handleArchetypeClick;
  }, []);

  // Listen for broadcast updates when admin adds cards to an archetype
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;

    const bc = new BroadcastChannel('ryunix-card-mods');
    const handler = (event: MessageEvent) => {
      try {
        if (event.data?.type === 'cards-updated' && selectedArchetype && handleArchetypeClickRef.current) {
          const { archetype } = event.data;
          // If the message is for the currently displayed archetype, reload it
          if (archetype === selectedArchetype || !archetype) {
            console.debug('[CollectionTab] Received cards-updated broadcast, reloading archetype', { archetype, selectedArchetype });
            handleArchetypeClickRef.current(selectedArchetype);
          }
        }
      } catch (e) {
        console.warn('[CollectionTab] Error handling cards-updated broadcast', e);
      }
    };

    bc.addEventListener('message', handler);
    return () => {
      bc.removeEventListener('message', handler);
      bc.close();
    };
  }, [selectedArchetype]);

  // Fetch all individual cards when switching to allCards view
  useEffect(() => {
    if (activeView === "allCards" && purchases.length > 0 && allOwnedCards.length === 0 && !loadingAllCards) {
      loadAllOwnedCards();
    }
  }, [activeView, purchases]);

  // Extended type to track source archetype and purchase date
  interface OwnedCard extends ArchetypeCard {
    sourceArchetype?: string;
    purchaseDate?: number;
  }

  async function loadAllOwnedCards() {
    setLoadingAllCards(true);
    setAllCardsError("");
    const allCards: OwnedCard[] = [];

    // Get archetype and staple name sets for accurate type detection
    const archetypeNames = new Set(ARCHETYPE_DECKS.map(d => d.name));
    const stapleNames = new Set(STAPLE_CARDS.map(s => s.name));

    // Process all purchases - determine type by checking against known lists
    for (const purchase of purchases) {
      const isArchetype = archetypeNames.has(purchase.item_name);
      const isStaple = stapleNames.has(purchase.item_name);

      console.log(`Loading purchase: ${purchase.item_name}, type: ${purchase.item_type}, isArchetype: ${isArchetype}, isStaple: ${isStaple}`);

      if (isArchetype) {
        // Fetch archetype cards
        try {
          const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?archetype=${encodeURIComponent(purchase.item_name)}`);
          if (response.ok) {
            const data = await response.json();
            if (data.data) {
              const cardsWithSource = data.data.map((card: ArchetypeCard) => ({
                ...card,
                sourceArchetype: purchase.item_name,
                purchaseDate: Number(purchase.bought_at),
              }));
              allCards.push(...cardsWithSource);
            }
          } else {
            // Try fallback with fname
            const nameResponse = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(purchase.item_name)}`);
            if (nameResponse.ok) {
              const nameData = await nameResponse.json();
              if (nameData.data) {
                const cardsWithSource = nameData.data.slice(0, 30).map((card: ArchetypeCard) => ({
                  ...card,
                  sourceArchetype: purchase.item_name,
                  purchaseDate: Number(purchase.bought_at),
                }));
                allCards.push(...cardsWithSource);
              }
            }
          }
        } catch (err) {
          console.error(`Failed to fetch cards for ${purchase.item_name}:`, err);
        }
      } else if (isStaple) {
        // Fetch staple card by exact name
        try {
          const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(purchase.item_name)}`);
          if (response.ok) {
            const data = await response.json();
            if (data.data) {
              const cardsWithSource = data.data.map((card: ArchetypeCard) => ({
                ...card,
                sourceArchetype: "Staples",
                purchaseDate: Number(purchase.bought_at),
              }));
              allCards.push(...cardsWithSource);
            }
          }
        } catch (err) {
          console.error(`Failed to fetch staple card ${purchase.item_name}:`, err);
        }
      } else if (purchase.item_type === PurchaseItemType.Gacha || (purchase.item_type as any) === 4) {
        // Gacha purchases are individual cards by exact name
        try {
          const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(purchase.item_name)}`);
          if (response.ok) {
            const data = await response.json();
            if (data.data) {
              const cardsWithSource = data.data.map((card: ArchetypeCard) => ({
                ...card,
                sourceArchetype: "Gacha",
                purchaseDate: Number(purchase.bought_at),
              }));
              allCards.push(...cardsWithSource);
            }
          } else {
            console.error(`Failed to fetch gacha card ${purchase.item_name}: HTTP ${response.status}`);
          }
        } catch (err) {
          console.error(`Failed to fetch gacha card ${purchase.item_name}:`, err);
        }
      } else {
        // Unknown item - try archetype first, then card name (for gacha cards)
        try {
          const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?archetype=${encodeURIComponent(purchase.item_name)}`);
          if (response.ok) {
            const data = await response.json();
            if (data.data && data.data.length > 0) {
              const cardsWithSource = data.data.map((card: ArchetypeCard) => ({
                ...card,
                sourceArchetype: purchase.item_name,
                purchaseDate: Number(purchase.bought_at),
              }));
              allCards.push(...cardsWithSource);
            }
          } else {
            // Archetype failed - try fetching as individual card name (gacha cards)
            const nameResponse = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(purchase.item_name)}`);
            if (nameResponse.ok) {
              const nameData = await nameResponse.json();
              if (nameData.data) {
                const cardsWithSource = nameData.data.map((card: ArchetypeCard) => ({
                  ...card,
                  sourceArchetype: "Gacha",
                  purchaseDate: Number(purchase.bought_at),
                }));
                allCards.push(...cardsWithSource);
              }
            }
          }
        } catch (err) {
          console.error(`Failed to fetch unknown item ${purchase.item_name}:`, err);
        }
      }
    }

    if (allCards.length === 0 && purchases.length > 0) {
      setAllCardsError("Could not load your cards. Try again later.");
    }

    // Remove duplicates by card id (keep first occurrence)
    const uniqueCards = allCards.filter((card, index, self) =>
      index === self.findIndex((c) => c.id === card.id)
    );

    setAllOwnedCards(uniqueCards);
    setLoadingAllCards(false);
  }

  // Export collection as EdoPro banlist format
  async function exportCollectionAsBanlist() {
    if (allOwnedCards.length === 0) {
      alert("No cards in your collection to export. Please load your cards first by clicking 'All My Cards'.");
      return;
    }

    try {
      alert("Fetching all Yu-Gi-Oh cards to create banlist... This may take a moment.");
      
      // Fetch ALL cards from the API
      const response = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php');
      if (!response.ok) {
        throw new Error('Failed to fetch card database');
      }
      
      const data = await response.json();
      const allYugiohCards = data.data || [];
      
      // Create a set of owned card IDs for quick lookup
      const ownedCardIds = new Set(allOwnedCards.map(c => c.id).filter(id => id));
      
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '.');
      let content = `#[Ryunix Format - My Collection Only]\n`;
      content += `!${date} Only cards in your collection are allowed - all others are banned\n\n`;
      
      // Section 1: Forbidden cards (all cards NOT in collection)
      content += `#forbidden\n`;
      for (const card of allYugiohCards) {
        if (card.id && !ownedCardIds.has(card.id)) {
          content += `${card.id} 0 --${card.name}\n`;
        }
      }
      
      content += `\n#limited\n`;
      content += `#semi-limited\n`;
      
      // Section 2: Unlimited cards (all cards in collection)
      content += `\n#unlimited\n`;
      for (const card of allOwnedCards) {
        if (card.id) {
          content += `${card.id} 3 --${card.name}\n`;
        }
      }

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my_collection_only_${date}.lflist.conf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      const bannedCount = allYugiohCards.length - allOwnedCards.length;
      alert(`Successfully exported!\n${allOwnedCards.length} cards allowed (unlimited)\n${bannedCount} cards banned`);
    } catch (err) {
      console.error("Export failed", err);
      alert(`Failed to export collection: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  // Export collection as YDK format
  function exportCollectionAsYDK() {
    if (allOwnedCards.length === 0) {
      alert("No cards in your collection to export");
      return;
    }

    try {
      const monsters = allOwnedCards.filter(c => c.type.toLowerCase().includes('monster'));
      const spells = allOwnedCards.filter(c => c.type.toLowerCase().includes('spell'));
      const traps = allOwnedCards.filter(c => c.type.toLowerCase().includes('trap'));

      let content = `#created by Ryunix Format\n#main\n`;
      
      // Add monsters
      monsters.forEach(card => {
        content += `${card.id}\n`;
      });
      
      content += `#extra\n!side\n`;

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my_collection_${new Date().toISOString().split('T')[0]}.ydk`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed", err);
      alert("Failed to export YDK. Please try again.");
    }
  }

  // Export collection as YDKE format (URL)
  function exportCollectionAsYDKE() {
    if (allOwnedCards.length === 0) {
      alert("No cards in your collection to export");
      return;
    }

    try {
      // YDKE format: ydke://[main deck base64]![extra deck base64]![side deck base64]!
      const cardIds = allOwnedCards.map(c => c.id.toString()).join('');
      
      // Convert to base64 (simplified - just main deck for collection)
      const mainDeckIds = allOwnedCards.map(c => {
        // Convert card ID to little-endian 4-byte format
        const id = c.id;
        const bytes = [
          id & 0xFF,
          (id >> 8) & 0xFF,
          (id >> 16) & 0xFF,
          (id >> 24) & 0xFF
        ];
        return String.fromCharCode(...bytes);
      }).join('');

      const base64Main = btoa(mainDeckIds);
      const ydkeUrl = `ydke://${base64Main}!!`;

      // Copy to clipboard
      navigator.clipboard.writeText(ydkeUrl).then(() => {
        alert(`YDKE URL copied to clipboard!\n\nYou can also save it:\n${ydkeUrl}`);
      }).catch(() => {
        // Fallback: show in alert
        prompt("YDKE URL (copy this):", ydkeUrl);
      });
    } catch (err) {
      console.error("Export failed", err);
      alert("Failed to generate YDKE URL. Please try again.");
    }
  }

  // Get unique archetypes for filter dropdown
  function getOwnedArchetypes(): string[] {
    const archetypes = new Set<string>();
    allOwnedCards.forEach((card) => {
      if ((card as OwnedCard).sourceArchetype) {
        archetypes.add((card as OwnedCard).sourceArchetype!);
      }
    });
    return Array.from(archetypes).sort();
  }

  // Filter and sort cards based on current filters
  function getFilteredCards(): ArchetypeCard[] {
    let filtered = allOwnedCards.filter((card) => {
      // Search filter
      if (cardSearchTerm && !card.name.toLowerCase().includes(cardSearchTerm.toLowerCase())) {
        return false;
      }

      // Card type filter
      if (cardTypeFilter !== "all") {
        const cardType = card.type.toLowerCase();
        if (cardTypeFilter === "monster" && !cardType.includes("monster")) return false;
        if (cardTypeFilter === "spell" && !cardType.includes("spell")) return false;
        if (cardTypeFilter === "trap" && !cardType.includes("trap")) return false;
      }

      // Archetype filter
      if (archetypeFilter !== "all") {
        if ((card as OwnedCard).sourceArchetype !== archetypeFilter) return false;
      }

      return true;
    });

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (cardSortOption) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "atk-asc":
          return (a.atk ?? -1) - (b.atk ?? -1);
        case "atk-desc":
          return (b.atk ?? -1) - (a.atk ?? -1);
        case "def-asc":
          return (a.def ?? -1) - (b.def ?? -1);
        case "def-desc":
          return (b.def ?? -1) - (a.def ?? -1);
        case "level-asc":
          return (a.level ?? -1) - (b.level ?? -1);
        case "level-desc":
          return (b.level ?? -1) - (a.level ?? -1);
        case "type":
          return a.type.localeCompare(b.type);
        case "newest":
          return ((b as OwnedCard).purchaseDate ?? 0) - ((a as OwnedCard).purchaseDate ?? 0);
        case "oldest":
          return ((a as OwnedCard).purchaseDate ?? 0) - ((b as OwnedCard).purchaseDate ?? 0);
        default:
          return 0;
      }
    });

    return sorted;
  }

  const filteredOwnedCards = getFilteredCards();
  const ownedArchetypes = getOwnedArchetypes();

  // Helper to get display name from admin modifications
  function getPurchaseDisplayName(itemName: string): string {
    return cardModifications[itemName]?.displayName ?? itemName;
  }

  if (isLoading) {
    return <div className="text-center py-12 text-amber-400 animate-pulse">Loading your collection...</div>;
  }

  if (purchases.length === 0) {
    return (
      <Card className="border border-slate-700 bg-slate-800  ">
        <CardContent className="py-16 text-center">
          <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 size-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-700">
            <ShoppingCart className="size-10 text-amber-400" />
          </div>
          <p className="text-lg font-semibold text-slate-200">You haven't purchased any items yet.</p>
          <p className="text-sm mt-2 text-slate-400">Start shopping from the Catalog tab!</p>
        </CardContent>
      </Card>
    );
  }

  const decks = purchases.filter((p) => p.item_type === PurchaseItemType.Deck);
  const staples = purchases.filter((p) => p.item_type === PurchaseItemType.Staple);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="border border-amber-600 bg-slate-800">
          <CardHeader>
            <CardTitle className="text-amber-400">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-amber-400">{purchases.length}</div>
          </CardContent>
        </Card>
        <Card className="border border-blue-600 bg-slate-800">
          <CardHeader>
            <CardTitle className="text-blue-400">Decks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-400">{decks.length}</div>
          </CardContent>
        </Card>
        <Card className="border border-violet-600 bg-slate-800">
          <CardHeader>
            <CardTitle className="text-violet-400">Staples</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-violet-400">{staples.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <Button variant={activeView === "history" ? "default" : "outline"} onClick={() => setActiveView("history")} className={activeView === "history" ? "bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold" : "border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-amber-500 hover:text-amber-400"}>
          <History className="size-4 mr-2" />
          Purchase History
        </Button>
        <Button variant={activeView === "allCards" ? "default" : "outline"} onClick={() => setActiveView("allCards")} className={activeView === "allCards" ? "bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold" : "border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-amber-500 hover:text-amber-400"}>
          <Layers className="size-4 mr-2" />
          All My Cards
        </Button>
      </div>

      {activeView === "history" && (
        <Card className="border border-slate-700 bg-slate-800">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-amber-400">Purchase History</CardTitle>
            <CardDescription className="text-slate-400">Click on an archetype name to view the cards in that package</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Pagination Info */}
            {purchases.length > historyPerPage && (
              <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-slate-800 border border-slate-600">
                <div className="flex items-center gap-2 text-sm">
                  <History className="size-4 text-amber-400" />
                  <span className="text-slate-400">Total Purchases:</span>
                  <span className="font-bold text-amber-300">{purchases.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                    disabled={historyPage === 1}
                    className="h-8 px-3 border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-30"
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-slate-400">Page {historyPage} of {Math.ceil(purchases.length / historyPerPage)}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setHistoryPage(p => Math.min(Math.ceil(purchases.length / historyPerPage), p + 1))}
                    disabled={historyPage === Math.ceil(purchases.length / historyPerPage)}
                    className="h-8 px-3 border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-30"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="font-bold text-slate-300">Item Name</TableHead>
                  <TableHead className="font-bold text-slate-300">Type</TableHead>
                  <TableHead className="font-bold text-slate-300">Purchase Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.slice((historyPage - 1) * historyPerPage, historyPage * historyPerPage).map((purchase) => {
                  const displayName = getPurchaseDisplayName(purchase.item_name);
                  // Determine type by checking against known lists (handles corrupted item_type data)
                  const archetypeNames = new Set(ARCHETYPE_DECKS.map(d => d.name.toLowerCase().trim()));
                  const isDeck = archetypeNames.has((purchase.item_name || "").toLowerCase().trim()) || 
                                 purchase.item_type === PurchaseItemType.Deck || 
                                 purchase.item_type === "Deck" as any;
                  // Format date from unix timestamp
                  const formatPurchaseDate = (timestamp: string | number): string => {
                    const ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
                    if (isNaN(ts)) return "Unknown";
                    const ms = ts < 10000000000 ? ts * 1000 : ts;
                    return new Date(ms).toLocaleDateString();
                  };
                  return (
                    <TableRow key={purchase.id} className="border-slate-700 hover:bg-slate-800 transition-colors duration-200">
                      <TableCell>
                        {isDeck ? (
                          <span className="font-semibold text-slate-100 cursor-pointer hover:text-amber-300 transition-colors flex items-center gap-1" onClick={() => handleArchetypeClick(purchase.item_name)} title="Click to view cards in this archetype">
                            {displayName}
                            <Package className="size-3 text-slate-500" />
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-100">{displayName}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={isDeck ? "bg-blue-500/20 text-blue-300 border-blue-500/30" : "bg-violet-500/20 text-violet-300 border-violet-500/30"}>{isDeck ? "Deck" : "Staple"}</Badge>
                      </TableCell>
                      <TableCell className="text-slate-400">{formatPurchaseDate(purchase.bought_at)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeView === "allCards" && (
        <Card className="border border-slate-700 bg-slate-800  ">
          <CardHeader>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">All My Cards ({filteredOwnedCards.length}{filteredOwnedCards.length !== allOwnedCards.length ? ` of ${allOwnedCards.length}` : ""})</CardTitle>
            <CardDescription className="text-slate-400">All individual cards from your purchased archetypes and staples</CardDescription>
            {!loadingAllCards && allOwnedCards.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-3">
                <Button
                  onClick={exportCollectionAsBanlist}
                  size="sm"
                  className="bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600"
                >
                  <Download className="size-3 mr-1.5" />
                  Export as Banlist
                </Button>
                <Button
                  onClick={exportCollectionAsYDK}
                  size="sm"
                  className="bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600"
                >
                  <Download className="size-3 mr-1.5" />
                  Export as YDK
                </Button>
                <Button
                  onClick={exportCollectionAsYDKE}
                  size="sm"
                  className="bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600"
                >
                  <Download className="size-3 mr-1.5" />
                  Copy YDKE URL
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {/* Filters and View Mode Toggle */}
            {!loadingAllCards && allOwnedCards.length > 0 && (
              <div className="flex flex-col md:flex-row gap-3 mb-4 pb-4 border-b border-slate-700">
                <Input
                  placeholder="Search cards..."
                  value={cardSearchTerm}
                  onChange={(e) => setCardSearchTerm(e.target.value)}
                  className="w-full md:w-48 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 "
                />
                <Select value={cardTypeFilter} onValueChange={(value) => setCardTypeFilter(value as CardTypeFilter)}>
                  <SelectTrigger className="w-full md:w-32 bg-slate-800 border-slate-700 text-slate-100">
                    <SelectValue placeholder="Card Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all" className="text-slate-200 focus:bg-slate-700 focus:text-amber-300">All Types</SelectItem>
                    <SelectItem value="monster" className="text-slate-200 focus:bg-slate-700 focus:text-amber-300">Monsters</SelectItem>
                    <SelectItem value="spell" className="text-slate-200 focus:bg-slate-700 focus:text-amber-300">Spells</SelectItem>
                    <SelectItem value="trap" className="text-slate-200 focus:bg-slate-700 focus:text-amber-300">Traps</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={archetypeFilter} onValueChange={setArchetypeFilter}>
                  <SelectTrigger className="w-full md:w-40 bg-slate-800 border-slate-700 text-slate-100">
                    <SelectValue placeholder="Archetype" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                    <SelectItem value="all" className="text-slate-200 focus:bg-slate-700 focus:text-amber-300">All Archetypes</SelectItem>
                    {ownedArchetypes.map((arch) => (
                      <SelectItem key={arch} value={arch} className="text-slate-200 focus:bg-slate-700 focus:text-amber-300">{arch}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={cardSortOption} onValueChange={(value) => setCardSortOption(value as CardSortOption)}>
                  <SelectTrigger className="w-full md:w-40 bg-slate-800 border-slate-700 text-slate-100">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="newest" className="text-slate-200 focus:bg-slate-700 focus:text-amber-300">Newest First</SelectItem>
                    <SelectItem value="oldest" className="text-slate-200 focus:bg-slate-700 focus:text-amber-300">Oldest First</SelectItem>
                    <SelectItem value="name-asc" className="text-slate-200 focus:bg-slate-700 focus:text-amber-300">Name (A-Z)</SelectItem>
                    <SelectItem value="name-desc" className="text-slate-200 focus:bg-slate-700 focus:text-amber-300">Name (Z-A)</SelectItem>
                    <SelectItem value="atk-desc" className="text-slate-200 focus:bg-slate-700 focus:text-amber-300">ATK (High-Low)</SelectItem>
                    <SelectItem value="atk-asc" className="text-slate-200 focus:bg-slate-700 focus:text-amber-300">ATK (Low-High)</SelectItem>
                    <SelectItem value="def-desc" className="text-slate-200 focus:bg-slate-700 focus:text-amber-300">DEF (High-Low)</SelectItem>
                    <SelectItem value="def-asc" className="text-slate-200 focus:bg-slate-700 focus:text-amber-300">DEF (Low-High)</SelectItem>
                    <SelectItem value="level-desc" className="text-slate-200 focus:bg-slate-700 focus:text-amber-300">Level (High-Low)</SelectItem>
                    <SelectItem value="level-asc" className="text-slate-200 focus:bg-slate-700 focus:text-amber-300">Level (Low-High)</SelectItem>
                    <SelectItem value="type" className="text-slate-200 focus:bg-slate-700 focus:text-amber-300">Card Type</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-0.5 border border-slate-600 rounded-md p-0.5 bg-slate-800 ml-auto">
                  <Button variant="ghost" size="icon" onClick={() => setAllCardsViewMode("grid")} className={`size-8 ${allCardsViewMode === "grid" ? "bg-amber-600 text-amber-400" : "text-slate-400 hover:text-slate-200 hover:bg-slate-700"}`} title="Grid View">
                    <LayoutGrid className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setAllCardsViewMode("list")} className={`size-8 ${allCardsViewMode === "list" ? "bg-amber-600 text-amber-400" : "text-slate-400 hover:text-slate-200 hover:bg-slate-700"}`} title="List View">
                    <List className="size-4" />
                  </Button>
                </div>
              </div>
            )}

            {loadingAllCards && (
              <div className="text-center py-12 text-amber-400 animate-pulse">Loading your cards...</div>
            )}
            {allCardsError && !loadingAllCards && (
              <div className="text-center py-12 text-red-400">{allCardsError}</div>
            )}
            {!loadingAllCards && !allCardsError && allOwnedCards.length === 0 && (
              <div className="text-center py-12 text-slate-400">No cards found in your collection.</div>
            )}
            {!loadingAllCards && allOwnedCards.length > 0 && filteredOwnedCards.length === 0 && (
              <div className="text-center py-12 text-slate-400">No cards match your filters.</div>
            )}

            {/* Grid View */}
            {!loadingAllCards && filteredOwnedCards.length > 0 && allCardsViewMode === "grid" && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredOwnedCards.map((card) => (
                  <div key={card.id} className="flex flex-col p-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-800 transition-colors">
                    {card.card_images?.[0]?.image_url_small && (
                      <div className="w-full aspect-[3/4] rounded-lg overflow-hidden border border-slate-600 bg-slate-700  mb-2">
                        <img src={card.card_images[0].image_url_small} alt={card.name} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    )}
                    <div className="text-xs font-semibold text-slate-100 truncate" title={card.name}>{card.name}</div>
                    <div className="text-xs text-slate-400 truncate">{card.type}</div>
                    {(card as { sourceArchetype?: string }).sourceArchetype && (
                      <div className="text-xs text-violet-400 truncate">{(card as { sourceArchetype?: string }).sourceArchetype}</div>
                    )}
                    {card.atk !== undefined && (
                      <div className="text-xs text-amber-400">ATK: {card.atk} {card.def !== undefined && `/ DEF: ${card.def}`}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* List View */}
            {!loadingAllCards && filteredOwnedCards.length > 0 && allCardsViewMode === "list" && (
              <div className="space-y-2">
                {filteredOwnedCards.map((card) => (
                  <div key={card.id} className="flex items-center gap-3 p-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-800 transition-colors">
                    {card.card_images?.[0]?.image_url_small && (
                      <div className="shrink-0 size-12 rounded-lg overflow-hidden border border-slate-600 bg-slate-700 ">
                        <img src={card.card_images[0].image_url_small} alt={card.name} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-100 truncate">{card.name}</div>
                      <div className="text-xs text-slate-400">{card.type}</div>
                    </div>
                    {(card as { sourceArchetype?: string }).sourceArchetype && (
                      <Badge variant="outline" className="shrink-0 text-xs border-violet-500/30 text-violet-300">{(card as { sourceArchetype?: string }).sourceArchetype}</Badge>
                    )}
                    {card.atk !== undefined && (
                      <div className="shrink-0 text-xs text-amber-400 font-medium">ATK: {card.atk}{card.def !== undefined && ` / DEF: ${card.def}`}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={selectedArchetype !== null} onOpenChange={(open) => { if (!open) setSelectedArchetype(null); }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-amber-400">{selectedArchetype ? (cardModifications[selectedArchetype]?.displayName || selectedArchetype) : ''} Cards</DialogTitle>
            <DialogDescription className="text-slate-400">Cards that belong to the {selectedArchetype ? (cardModifications[selectedArchetype]?.displayName || selectedArchetype) : ''} archetype</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] pr-2">
            {loadingCards && (
              <div className="text-center py-12 text-amber-400 animate-pulse">Loading archetype cards...</div>
            )}
            {cardError && (
              <div className="text-center py-12 text-red-400">{cardError}</div>
            )}
            {!loadingCards && !cardError && archetypeCards.length === 0 && (
              <div className="text-center py-12 text-slate-400">No cards found for this archetype.</div>
            )}
            {!loadingCards && archetypeCards.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {archetypeCards.map((card) => (
                  <div key={card.id} className="flex flex-col p-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 transition-colors">
                    {card.card_images?.[0]?.image_url_small && (
                      <div className="w-full aspect-[3/4] rounded overflow-hidden mb-2 relative">
                        <img src={card.card_images[0].image_url_small} alt={card.name} className="w-full h-full object-cover" loading="lazy" />
                        <div className="absolute top-1 right-1">
                          <BanIndicator banStatus={getBanStatus(card.name)} size="sm" />
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <div className="text-xs font-semibold text-slate-100 truncate flex-1" title={card.name}>{card.name}</div>
                      {!card.card_images?.[0]?.image_url_small && <BanIndicator banStatus={getBanStatus(card.name)} size="sm" />}
                    </div>
                    <div className="text-xs text-slate-400 truncate">{card.type}</div>
                    {card.atk !== undefined && (
                      <div className="text-xs text-amber-400">ATK: {card.atk} {card.def !== undefined && `/ DEF: ${card.def}`}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminDashboard({ user, onLogout, onUserUpdate }: { user: UserModel; onLogout: () => void; onUserUpdate: (userId: string) => void }) {
  const [activeTab, setActiveTab] = useState("create-user");
  const banlistVersion = useBanlistVersion();

  async function handleBanlistChange() {
    // Reload banlist from database
    try {
      const orm = BanlistORM.getInstance();
      const loadedBanlist = await orm.getBanlist();
      Object.keys(banlist).forEach(k => delete banlist[k]);
      Object.assign(banlist, loadedBanlist);
      notifyBanlistChange();
    } catch (e) {
      console.error('Failed to reload banlist after change', e);
    }
  }

  // Get ban status for a card
  const getBanStatus = useCallback((cardName: string): BanStatus => {
    return (banlist[cardName]?.banStatus as BanStatus) ?? 'unlimited';
  }, [banlistVersion]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23fbbf24%22%20fill-opacity%3D%220.02%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50 pointer-events-none" />

      <header className="bg-slate-900/80  border-b border-rose-700  sticky top-0 z-50 relative">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-gradient-to-br from-rose-500 to-rose-700 rounded-lg flex items-center justify-center ">
              <span className="text-xl font-black text-white">A</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-400 via-rose-300 to-rose-400 bg-clip-text text-transparent">Admin Dashboard</h1>
              <p className="text-sm text-slate-400 font-medium">Welcome, <span className="text-rose-400">{user.username}</span> (Administrator)</p>
            </div>
          </div>
          <Button variant="outline" onClick={onLogout} className="border-slate-700 text-slate-300 hover:bg-red-950/50 hover:text-red-400 hover:border-red-500/50 transition-colors">
            <LogOut className="size-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 relative">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-10 max-w-6xl h-auto md:h-12 bg-slate-800   border border-rose-700 p-1">
            <TabsTrigger value="create-user" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-rose-600 data-[state=active]:text-white data-[state=active]:font-bold text-slate-400 transition-colors text-sm md:text-base">
              <Users className="size-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Create User</span>
              <span className="sm:hidden">Create</span>
            </TabsTrigger>
            <TabsTrigger value="grant-coins" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-rose-600 data-[state=active]:text-white data-[state=active]:font-bold text-slate-400 transition-colors text-sm md:text-base">
              <Gift className="size-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Grant Coins</span>
              <span className="sm:hidden">Grant</span>
            </TabsTrigger>
            <TabsTrigger value="reset-password" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-rose-600 data-[state=active]:text-white data-[state=active]:font-bold text-slate-400 transition-colors text-sm md:text-base">
              <KeyRound className="size-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Reset Password</span>
              <span className="sm:hidden">Reset</span>
            </TabsTrigger>
            <TabsTrigger value="delete-archetype" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-rose-600 data-[state=active]:text-white data-[state=active]:font-bold text-slate-400 transition-colors text-sm md:text-base">
              <Trash2 className="size-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Delete Deck</span>
              <span className="sm:hidden">Delete</span>
            </TabsTrigger>
            <TabsTrigger value="coin-history" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-rose-600 data-[state=active]:text-white data-[state=active]:font-bold text-slate-400 transition-colors text-sm md:text-base">
              <BarChart3 className="size-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Coin History</span>
              <span className="sm:hidden">History</span>
            </TabsTrigger>
            <TabsTrigger value="purchase-log" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-rose-600 data-[state=active]:text-white data-[state=active]:font-bold text-slate-400 transition-colors text-sm md:text-base">
              <ShoppingBag className="size-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Purchase Log</span>
              <span className="sm:hidden">Purchases</span>
            </TabsTrigger>
            <TabsTrigger value="archetype-cards" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-rose-600 data-[state=active]:text-white data-[state=active]:font-bold text-slate-400 transition-colors text-sm md:text-base">
              <Layers className="size-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Archetypes</span>
              <span className="sm:hidden">Archetypes</span>
            </TabsTrigger>
            <TabsTrigger value="staples-manage" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-rose-600 data-[state=active]:text-white data-[state=active]:font-bold text-slate-400 transition-colors text-sm md:text-base">
              <Star className="size-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Staples</span>
              <span className="sm:hidden">Staples</span>
            </TabsTrigger>
            <TabsTrigger value="banlist" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-rose-600 data-[state=active]:text-white data-[state=active]:font-bold text-slate-400 transition-colors text-sm md:text-base">
              <Shield className="size-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Banlist</span>
              <span className="sm:hidden">Ban</span>
            </TabsTrigger>
            <TabsTrigger value="gacha-packs" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-rose-600 data-[state=active]:text-white data-[state=active]:font-bold text-slate-400 transition-colors text-sm md:text-base">
              <Package className="size-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Gacha Packs</span>
              <span className="sm:hidden">Gacha</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create-user" className="mt-6 animate-in fade-in-50 duration-300">
            <CreateUserTab />
          </TabsContent>

          <TabsContent value="grant-coins" className="mt-6 animate-in fade-in-50 duration-300">
            <GrantCoinsTab />
          </TabsContent>

          <TabsContent value="reset-password" className="mt-6 animate-in fade-in-50 duration-300">
            <ResetPasswordTab />
          </TabsContent>

          <TabsContent value="delete-archetype" className="mt-6 animate-in fade-in-50 duration-300">
            <DeleteArchetypeTab />
          </TabsContent>

          <TabsContent value="coin-history" className="mt-6 animate-in fade-in-50 duration-300">
            <CoinHistoryTab />
          </TabsContent>

          <TabsContent value="purchase-log" className="mt-6 animate-in fade-in-50 duration-300">
            <PurchaseLogTab />
          </TabsContent>

          <TabsContent value="archetype-cards" className="mt-6 animate-in fade-in-50 duration-300">
            <ArchetypeCardsTab />
          </TabsContent>

          <TabsContent value="staples-manage" className="mt-6 animate-in fade-in-50 duration-300">
            <StaplesManageTab />
          </TabsContent>

          <TabsContent value="banlist" className="mt-6 animate-in fade-in-50 duration-300">
            <BanlistManageTab key={banlistVersion} onBanlistChange={handleBanlistChange} />
          </TabsContent>

          <TabsContent value="gacha-packs" className="mt-6 animate-in fade-in-50 duration-300">
            <GachaPacksManageTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function CreateUserTab() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [coins, setCoins] = useState("0");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const userORM = UserORM.getInstance();

      // Check if username already exists
      const existing = await userORM.getUserByUsername(username);
      if (existing.length > 0) {
        setError("Username already exists!");
        return;
      }

      // Validate inputs
      if (!username || username.trim().length === 0) {
        setError('Username cannot be empty');
        return;
      }
      if (!password || password.length < 3) {
        setError('Password must be at least 3 characters');
        return;
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Ensure coin is a valid integer (fallback to 0)
      const coinVal = Number.isFinite(Number(coins)) ? Number(coins) : parseInt(coins || '0', 10) || 0;

      // Debug payload
      console.debug('Creating user payload', { username, coin: coinVal, is_admin: false });

      // Create user
      await userORM.insertUser([
        {
          username,
          password_hash: passwordHash,
          coin: coinVal,
          is_admin: false,
        } as UserModel,
      ]);

      setSuccess(`User "${username}" created successfully!`);
      setUsername("");
      setPassword("");
      setCoins("0");
    } catch (err: any) {
      console.error('Create user error:', err);
      setError(err?.message || String(err) || "Failed to create user. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl border border-slate-700 bg-slate-800  ">
      <CardHeader>
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-rose-400 to-rose-300 bg-clip-text text-transparent">Create New Player Account</CardTitle>
        <CardDescription className="text-base text-slate-400">Create a new player account with a temporary password</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <Alert variant="destructive" className="animate-in fade-in-50 duration-300  bg-red-950/50 border-red-500/50">
              <AlertDescription className="text-red-200">{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="animate-in fade-in-50 duration-300 bg-emerald-950/50 border border-emerald-500/50 text-emerald-200 ">
              <AlertDescription className="font-semibold">{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="create-username" className="font-semibold text-slate-300">Username</Label>
            <Input id="create-username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required disabled={isLoading} className="transition-colors bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-rose-500 " />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-password" className="font-semibold text-slate-300">Temporary Password</Label>
            <Input id="create-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} className="transition-colors bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-rose-500 " />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-coins" className="font-semibold text-slate-300">Starting Coins</Label>
            <Input id="create-coins" type="number" min="0" value={coins} onChange={(e) => setCoins(e.target.value)} required disabled={isLoading} className="transition-colors bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-rose-500 " />
          </div>

          <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold transition-colors  hover:shadow-rose-500/40">
            {isLoading ? "Creating..." : "Create User"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function GrantCoinsTab() {
  const [username, setUsername] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const presetReasons = [
    { label: "Tournament Winner", value: "Tournament winner", coins: 100 },
    { label: "Loser Bonus", value: "Tournament loser bonus", coins: 50 },
  ];

  function applyPreset(preset: { label: string; value: string; coins: number }) {
    setAmount(preset.coins.toString());
    setReason(preset.value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const userORM = UserORM.getInstance();
      const coinAmount = Number(amount);

      // Validate amount
      if (!Number.isFinite(coinAmount) || coinAmount <= 0) {
        setError("Invalid coin amount");
        return;
      }

      // Check if granting to all users
      const grantToAll = username.toLowerCase() === "*" || username.toLowerCase() === "all";
      
      let users: UserModel[];
      if (grantToAll) {
        // Get all users
        users = await userORM.getAllUser();
        if (users.length === 0) {
          setError("No users found in the database!");
          return;
        }
      } else {
        // Get specific user
        users = await userORM.getUserByUsername(username);
        if (users.length === 0) {
          setError("User not found!");
          return;
        }
      }

      const coinLogORM = CoinLogORM.getInstance();
      let successCount = 0;

      // Grant coins to each user
      for (const user of users) {
        // Ensure user record has an id
        if (!user.id || String(user.id).trim() === "") {
          console.error('GrantCoins skipped user with missing id', { username: user.username, user });
          continue;
        }

        const currentCoins = Number(user.coin) || 0;
        const newCoinValue = currentCoins + coinAmount;

        // Update user coins
        const updatedUser = { ...user, coin: newCoinValue };
        await userORM.setUserByUsername(user.username, updatedUser);

        // Log the grant
        await coinLogORM.insertCoinLog([
          {
            user_id: user.id,
            amount: coinAmount,
            reason: grantToAll ? `${reason} (mass grant)` : reason,
            created_at: String(Math.floor(Date.now() / 1000)),
          } as unknown as CoinLogModel,
        ]);

        successCount++;
      }

      if (grantToAll) {
        setSuccess(`Successfully granted ${coinAmount} coins to ${successCount} users!`);
      } else {
        setSuccess(`Successfully granted ${coinAmount} coins to ${username}!`);
      }
      
      setUsername("");
      setAmount("");
      setReason("");
    } catch (err: any) {
      console.error('GrantCoins error', err);
      const msg = err?.code || err?.message ? `${err.code ?? ""} ${err.message ?? String(err)}` : String(err);
      setError(msg || "Failed to grant coins. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl border border-slate-700 bg-slate-800  ">
      <CardHeader>
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">Grant Coins to Player</CardTitle>
        <CardDescription className="text-base text-slate-400">Add coins to a player's account with a reason</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <Alert variant="destructive" className="animate-in fade-in-50 duration-300  bg-red-950/50 border-red-500/50">
              <AlertDescription className="text-red-200">{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="animate-in fade-in-50 duration-300 bg-emerald-950/50 border border-emerald-500/50 text-emerald-200 ">
              <AlertDescription className="font-semibold">{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label className="font-semibold text-slate-300">Quick Presets</Label>
            <div className="flex flex-wrap gap-2">
              {presetReasons.map((preset) => (
                <Button key={preset.label} type="button" variant="outline" size="sm" onClick={() => applyPreset(preset)} className="border-amber-700 text-amber-300 hover:bg-amber-500/10 hover:border-amber-500/50 transition-colors ">
                  {preset.label} (+{preset.coins})
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="grant-username" className="font-semibold text-slate-300">Username</Label>
            <Input id="grant-username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required disabled={isLoading} placeholder='Enter username or "*" for all users' className="transition-colors bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 " />
            <p className="text-xs text-slate-500">Tip: Use "*" or "all" to grant coins to everyone</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="grant-amount" className="font-semibold text-slate-300">Amount</Label>
            <Input id="grant-amount" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required disabled={isLoading} className="transition-colors bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 " />
          </div>

          <div className="space-y-2">
            <Label htmlFor="grant-reason" className="font-semibold text-slate-300">Reason</Label>
            <Input id="grant-reason" type="text" value={reason} onChange={(e) => setReason(e.target.value)} required disabled={isLoading} placeholder="e.g., Tournament winner" className="transition-colors bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 " />
          </div>

          <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-bold transition-colors  ">
            {isLoading ? "Granting..." : "Grant Coins"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ResetPasswordTab() {
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const userORM = UserORM.getInstance();
      const users = await userORM.getUserByUsername(username);

      if (users.length === 0) {
        setError("User not found!");
        return;
      }

      const user = users[0];
      const passwordHash = await hashPassword(newPassword);

      // Update password
      const updatedUser = { ...user, password_hash: passwordHash };
      await userORM.setUserById(user.id, updatedUser);

      setSuccess(`Password reset successfully for ${username}!`);
      setUsername("");
      setNewPassword("");
    } catch (err) {
      console.error(err);
      setError("Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl border border-slate-700 bg-slate-800  ">
      <CardHeader>
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-rose-400 to-rose-300 bg-clip-text text-transparent">Reset Player Password</CardTitle>
        <CardDescription className="text-base text-slate-400">Change a player's password</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <Alert variant="destructive" className="animate-in fade-in-50 duration-300  bg-red-950/50 border-red-500/50">
              <AlertDescription className="text-red-200">{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="animate-in fade-in-50 duration-300 bg-emerald-950/50 border border-emerald-500/50 text-emerald-200 ">
              <AlertDescription className="font-semibold">{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="reset-username" className="font-semibold text-slate-300">Username</Label>
            <Input id="reset-username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required disabled={isLoading} className="transition-colors bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-rose-500 " />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reset-password" className="font-semibold text-slate-300">New Password</Label>
            <Input id="reset-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required disabled={isLoading} className="transition-colors bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-rose-500 " />
          </div>

          <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold transition-colors  hover:shadow-rose-500/40">
            {isLoading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function DeleteArchetypeTab() {
  const [selectedArchetype, setSelectedArchetype] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [, forceUpdate] = useState({});

  // Subscribe to modification changes
  useEffect(() => {
    const listener = () => forceUpdate({});
    modificationListeners.add(listener);
    return () => {
      modificationListeners.delete(listener);
    };
  }, []);

  const archetype = ARCHETYPE_DECKS.find(a => a.name === selectedArchetype);
  
  // Filter out already-deleted archetypes
  const availableArchetypes = ARCHETYPE_DECKS.filter(arch => {
    const mod = cardModifications[arch.name];
    return !mod || !mod.is_removed;
  });

  async function handleDelete() {
    setError("");
    setSuccess("");
    setIsLoading(true);
    setShowConfirm(false);

    try {
      // Mark as removed in global state
      if (!cardModifications[selectedArchetype]) {
        cardModifications[selectedArchetype] = {};
      }
      cardModifications[selectedArchetype].is_removed = true;
      
      // Persist to database
      await persistModificationsToDb();
      
      // Notify all components to update
      notifyModificationChange();

      setSuccess(`Archetype "${selectedArchetype}" has been deleted and will no longer appear in the catalog!`);
      setSelectedArchetype("");
    } catch (err) {
      console.error(err);
      setError("Failed to delete archetype. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="max-w-2xl border border-slate-700 bg-slate-800  ">
        <CardHeader>
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-rose-400 to-rose-300 bg-clip-text text-transparent">Delete Archetype from Catalog</CardTitle>
          <CardDescription className="text-base text-slate-400">Remove an archetype deck from the catalog (affects all users)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {error && (
              <Alert variant="destructive" className="animate-in fade-in-50 duration-300  bg-red-950/50 border-red-500/50">
                <AlertDescription className="text-red-200">{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="animate-in fade-in-50 duration-300 bg-emerald-950/50 border border-emerald-500/50 text-emerald-200 ">
                <AlertDescription className="font-semibold">{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="archetype-select" className="font-semibold text-slate-300">Select Archetype</Label>
              <select
                id="archetype-select"
                value={selectedArchetype}
                onChange={(e) => setSelectedArchetype(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-slate-100 focus:border-rose-500 transition-colors"
              >
                <option value="">-- Choose an archetype --</option>
                {availableArchetypes.map((arch) => (
                  <option key={arch.name} value={arch.name}>
                    {arch.name} ({arch.rating} - {arch.price} coins)
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">
                {availableArchetypes.length} of {ARCHETYPE_DECKS.length} archetypes available
              </p>
            </div>

            {archetype && (
              <div className="p-4 bg-slate-900 border border-slate-700 rounded-md space-y-2">
                <p className="text-sm text-slate-400">Preview:</p>
                <div className="flex items-center gap-4">
                  <img src={archetype.imageUrl} alt={archetype.name} className="w-24 h-auto rounded-md border border-slate-600" />
                  <div>
                    <p className="font-bold text-lg text-slate-100">{archetype.name}</p>
                    <p className="text-slate-400">Rating: <span className="font-semibold">{archetype.rating}</span></p>
                    <p className="text-slate-400">Price: <span className="font-semibold">{archetype.price} coins</span></p>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={() => setShowConfirm(true)}
              disabled={!selectedArchetype || isLoading}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold transition-colors"
            >
              {isLoading ? "Deleting..." : "Delete Archetype"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="bg-slate-800 border border-slate-700 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-rose-400">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-slate-300">
              Are you sure you want to delete <span className="font-bold text-rose-300">"{selectedArchetype}"</span> from the catalog?
              <br /><br />
              This will remove it from the store for all users. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
              className="border-slate-600 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
            >
              Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CoinHistoryTab() {
  const [username, setUsername] = useState("");
  const [logs, setLogs] = useState<CoinLogModel[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const userORM = UserORM.getInstance();
      const users = await userORM.getUserByUsername(username);

      if (users.length === 0) {
        setError("User not found!");
        setLogs([]);
        return;
      }

      const user = users[0];
      const coinLogORM = CoinLogORM.getInstance();
      const data = await coinLogORM.getCoinLogByUserId(user.id);
      // Sort by unix timestamp (numeric comparison)
      setLogs(data.sort((a, b) => Number(b.created_at) - Number(a.created_at)));
    } catch (err) {
      console.error(err);
      setError("Failed to load coin history. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="max-w-2xl border border-slate-700 bg-slate-800  ">
        <CardHeader>
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">View Player Coin History</CardTitle>
          <CardDescription className="text-base text-slate-400">Search for a player to view their complete coin transaction log</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="animate-in fade-in-50 duration-300  bg-red-950/50 border-red-500/50">
                <AlertDescription className="text-red-200">{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Input type="text" placeholder="Enter username..." value={username} onChange={(e) => setUsername(e.target.value)} required disabled={isLoading} className="flex-1 transition-colors bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 " />
              <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold transition-colors">
                {isLoading ? "Searching..." : "Search"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {logs.length > 0 && (
        <Card className="border border-slate-700 bg-slate-800   animate-in fade-in-50 duration-300">
          <CardHeader>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Coin Transaction History for {username}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="font-bold text-slate-300">Date</TableHead>
                  <TableHead className="font-bold text-slate-300">Amount</TableHead>
                  <TableHead className="font-bold text-slate-300">Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  // Format unix timestamp to date string
                  const formatLogDate = (timestamp: string | number): string => {
                    const ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
                    if (isNaN(ts)) return "Unknown";
                    const ms = ts < 10000000000 ? ts * 1000 : ts;
                    return new Date(ms).toLocaleString();
                  };
                  return (
                  <TableRow key={log.id} className="border-slate-700 hover:bg-slate-800 transition-colors duration-200">
                    <TableCell className="text-slate-400">{formatLogDate(log.created_at)}</TableCell>
                    <TableCell>
                      <span className={log.amount >= 0 ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                        {log.amount >= 0 ? "+" : ""}
                        {log.amount} coins
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-200 font-medium">{log.reason}</TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PurchaseLogTab() {
  const [searchMode, setSearchMode] = useState<"user" | "all">("all");
  const [username, setUsername] = useState("");
  const [purchases, setPurchases] = useState<(PurchaseModel & { username?: string })[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Load all purchases on mount
  useEffect(() => {
    if (searchMode === "all") {
      loadAllPurchases();
    }
  }, [searchMode]);

  async function loadAllPurchases() {
    setIsLoading(true);
    setError("");
    try {
      const purchaseORM = PurchaseORM.getInstance();
      const userORM = UserORM.getInstance();
      
      // Get all purchases
      const [allPurchases] = await purchaseORM.listPurchase(undefined, undefined, { number: 0, size: 500 });
      
      // Get all users to map user_id to username
      const allUsers = await userORM.getAllUser();
      const userMap = new Map(allUsers.map(u => [u.id, u.username]));
      
      // Add username to each purchase
      const purchasesWithUsername = allPurchases.map(p => ({
        ...p,
        username: userMap.get(p.user_id) || "Unknown"
      }));
      
      setPurchases(purchasesWithUsername.sort((a, b) => 
        Number(b.bought_at) - Number(a.bought_at)
      ));
    } catch (err) {
      console.error(err);
      setError("Failed to load purchases. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const userORM = UserORM.getInstance();
      const users = await userORM.getUserByUsername(username);

      if (users.length === 0) {
        setError("User not found!");
        setPurchases([]);
        return;
      }

      const user = users[0];
      const purchaseORM = PurchaseORM.getInstance();
      const data = await purchaseORM.getPurchaseByUserId(user.id);
      setPurchases(data.map(p => ({ ...p, username: user.username })).sort((a, b) => 
        Number(b.bought_at) - Number(a.bought_at)
      ));
    } catch (err) {
      console.error(err);
      setError("Failed to load purchase history. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function formatDate(timestamp: string | number): string {
    const ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
    if (isNaN(ts)) return "Unknown";
    // If timestamp is in seconds (10 digits), convert to milliseconds
    const ms = ts < 10000000000 ? ts * 1000 : ts;
    return new Date(ms).toLocaleString();
  }

  function formatItemType(purchase: PurchaseModel & { username?: string }): string {
    // Check against known archetype/staple lists for accurate display
    // Use lowercase comparison to handle any casing differences
    const archetypeNames = new Set(ARCHETYPE_DECKS.map(d => d.name.toLowerCase().trim()));
    const stapleNames = new Set(STAPLE_CARDS.map(s => s.name.toLowerCase().trim()));
    
    const itemNameLower = (purchase.item_name || "").toLowerCase().trim();
    
    if (archetypeNames.has(itemNameLower)) return "Deck";
    if (stapleNames.has(itemNameLower)) return "Staple";
    
    // Fallback to stored value (cast to any to handle string vs enum mismatch)
    const itemType = purchase.item_type as any;
    if (typeof itemType === 'string') return itemType;
    if (itemType === PurchaseItemType.Deck || itemType === 1) return "Deck";
    if (itemType === PurchaseItemType.Staple || itemType === 2) return "Staple";
    if (itemType === PurchaseItemType.Bundle || itemType === 3) return "Bundle";
    if (itemType === PurchaseItemType.Gacha || itemType === 4) return "Gacha";
    return "Unknown";
  }

  return (
    <div className="space-y-6">
      <Card className="max-w-2xl border border-slate-700 bg-slate-800  ">
        <CardHeader>
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-300 bg-clip-text text-transparent">Purchase Log</CardTitle>
          <CardDescription className="text-base text-slate-400">View all player purchases or search by username</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              variant={searchMode === "all" ? "default" : "outline"} 
              onClick={() => setSearchMode("all")}
              className={searchMode === "all" ? "bg-gradient-to-r from-purple-500 to-pink-500" : ""}
            >
              All Purchases
            </Button>
            <Button 
              variant={searchMode === "user" ? "default" : "outline"} 
              onClick={() => setSearchMode("user")}
              className={searchMode === "user" ? "bg-gradient-to-r from-purple-500 to-pink-500" : ""}
            >
              Search by User
            </Button>
          </div>

          {searchMode === "user" && (
            <form onSubmit={handleSearch} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="animate-in fade-in-50 duration-300  bg-red-950/50 border-red-500/50">
                  <AlertDescription className="text-red-200">{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Input type="text" placeholder="Enter username..." value={username} onChange={(e) => setUsername(e.target.value)} required disabled={isLoading} className="flex-1 transition-colors bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-purple-500 " />
                <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold transition-colors">
                  {isLoading ? "Searching..." : "Search"}
                </Button>
              </div>
            </form>
          )}

          {searchMode === "all" && error && (
            <Alert variant="destructive" className="animate-in fade-in-50 duration-300  bg-red-950/50 border-red-500/50">
              <AlertDescription className="text-red-200">{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {isLoading && searchMode === "all" && (
        <Card className="border border-slate-700 bg-slate-800  ">
          <CardContent className="py-8 text-center text-slate-400">
            Loading purchases...
          </CardContent>
        </Card>
      )}

      {!isLoading && purchases.length > 0 && (
        <Card className="border border-slate-700 bg-slate-800   animate-in fade-in-50 duration-300">
          <CardHeader>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-300 bg-clip-text text-transparent">
              {searchMode === "user" ? `Purchases by ${username}` : "All Purchases"} ({purchases.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="font-bold text-slate-300">Date</TableHead>
                  <TableHead className="font-bold text-slate-300">User</TableHead>
                  <TableHead className="font-bold text-slate-300">Item</TableHead>
                  <TableHead className="font-bold text-slate-300">Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((purchase) => (
                  <TableRow key={purchase.id} className="border-slate-700 hover:bg-slate-800 transition-colors duration-200">
                    <TableCell className="text-slate-400">{formatDate(purchase.bought_at)}</TableCell>
                    <TableCell className="text-amber-400 font-medium">{purchase.username}</TableCell>
                    <TableCell className="text-slate-200 font-medium">{purchase.item_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        formatItemType(purchase) === "Deck" 
                          ? "border-blue-500/50 text-blue-400" 
                          : "border-green-500/50 text-green-400"
                      }>
                        {formatItemType(purchase)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {!isLoading && purchases.length === 0 && searchMode === "all" && (
        <Card className="border border-slate-700 bg-slate-800  ">
          <CardContent className="py-8 text-center text-slate-400">
            No purchases found.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Local state for card modifications - persisted to Supabase via CardModificationsORM
// Note: customCards now stores full card objects so players can immediately see admin-added cards
const cardModifications: Record<string, { rating?: MetaRating; price?: number; displayName?: string; imageUrl?: string; customCards?: Array<{ name: string; data?: any }>; is_removed?: boolean }> = {};

// Module-level storage for custom staples (persisted to same DB table)
const customStaples: Array<{ name: string; rating: MetaRating; price: number; imageUrl?: string }> = [];
const removedStaples: Set<string> = new Set();

// Module-level banlist storage (persisted to Supabase banlist table)
const banlist: Record<string, { cardName: string; banStatus: string; lastUpdated: string; source: string }> = {};

// Module-level modification version counter and listeners for cross-component updates
let modificationVersion = 0;
let banlistVersion = 0;
const modificationListeners: Set<() => void> = new Set();
const banlistListeners: Set<() => void> = new Set();

// Debounce timer for persisting modifications
let persistTimer: ReturnType<typeof setTimeout> | null = null;

// Persist all modifications to the database (debounced)
async function persistModificationsToDb() {
  try {
    const orm = CardModificationsORM.getInstance();
    const payload = {
      archetypes: cardModifications,
      customStaples: customStaples,
      removedStaples: Array.from(removedStaples),
    };
    console.log('💾 Persisting modifications to DB...', { payload });
    await orm.upsertMods(payload);
    console.log('✅ Persisted modifications to DB', { archetypes: Object.keys(cardModifications).length, customStaples: customStaples.length, removedStaples: removedStaples.size, payload });
    
    // Notify other tabs via BroadcastChannel
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('ryunix-card-mods');
        bc.postMessage({ type: 'updated' });
        bc.close();
      }
    } catch (e) {
      console.warn('Failed to broadcast modification update', e);
    }
  } catch (e) {
    console.error('❌ Failed to persist modifications to DB', e);
  }
}

// Update catalog file with new archetype rating/price
async function updateCatalogFile(archetypeName: string, newRating: MetaRating, newPrice: number) {
  try {
    // Trigger the sync script via a simple HTTP request to a local endpoint
    // This allows us to update the file system from the browser
    const response = await fetch('/api/update-catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archetypeName, rating: newRating, price: newPrice })
    });
    
    if (response.ok) {
      console.log(`✅ Updated ${archetypeName} in yugioh-catalog.ts`);
    } else {
      // Fallback: just persist to DB
      console.warn('Could not update catalog file, using database only');
    }
  } catch (e) {
    // If the API endpoint doesn't exist, that's fine - changes are already in DB
    console.log('Catalog file update skipped (database only)');
  }
}

function notifyModificationChange() {
  modificationVersion++;
  modificationListeners.forEach(listener => listener());
  
  // Debounced persistence - save to DB after 500ms of no changes
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistModificationsToDb();
  }, 500);
}

function notifyBanlistChange() {
  banlistVersion++;
  banlistListeners.forEach(listener => listener());
}

function useBanlistVersion() {
  const [version, setVersion] = useState(banlistVersion);
  useEffect(() => {
    const listener = () => setVersion(banlistVersion);
    banlistListeners.add(listener);
    return () => { banlistListeners.delete(listener); };
  }, []);
  return version;
}

function useModificationVersion() {
  const [version, setVersion] = useState(modificationVersion);
  useEffect(() => {
    const listener = () => setVersion(modificationVersion);
    modificationListeners.add(listener);
    return () => { modificationListeners.delete(listener); };
  }, []);
  return version;
}

// Helper to get effective staples list (original + custom - removed)
function getEffectiveStaples(): Array<{ name: string; rating: MetaRating; price: number; imageUrl?: string }> {
  const originalFiltered = STAPLE_CARDS.filter(s => !removedStaples.has(s.name));
  return [...originalFiltered, ...customStaples];
}

type ViewMode = "list" | "compact" | "grid";

// Card search result type
interface YGOCard {
  id: number;
  name: string;
  type: string;
  desc: string;
  atk?: number;
  def?: number;
  level?: number;
  race: string;
  attribute?: string;
  archetype?: string;
  card_images: Array<{ id: number; image_url: string; image_url_small: string; image_url_cropped: string }>;
}

// Cache for archetype cards loaded from DB/API
const archetypeCardsCache: Record<string, YGOCard[]> = {};

function ArchetypeCardsTab() {
  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [archetypeCards, setArchetypeCards] = useState<YGOCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [cardSearchQuery, setCardSearchQuery] = useState("");
  const [cardSearchResults, setCardSearchResults] = useState<YGOCard[]>([]);
  const [cardSearchLoading, setCardSearchLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  // Editing archetype name/image state
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [imageSearchOpen, setImageSearchOpen] = useState(false);
  const [imageSearchQuery, setImageSearchQuery] = useState("");
  const [imageSearchResults, setImageSearchResults] = useState<YGOCard[]>([]);
  const [imageSearchLoading, setImageSearchLoading] = useState(false);

  // Get ban status for a card
  const _banlistVersion = useBanlistVersion();
  const getBanStatus = useCallback((cardName: string): BanStatus => {
    return (banlist[cardName]?.banStatus as BanStatus) ?? 'unlimited';
  }, [_banlistVersion]);

  // Rating style helper
  function getRatingBadgeStyle(rating: string): string {
    switch (rating) {
      case "S+": return "bg-gradient-to-r from-rose-500 to-pink-500 text-white border-rose-400";
      case "S": return "bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 border-amber-400";
      case "A": return "bg-gradient-to-r from-violet-500 to-purple-600 text-white border-violet-400";
      case "B": return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-blue-400";
      case "C": return "bg-gradient-to-r from-emerald-500 to-green-500 text-white border-emerald-400";
      case "D": return "bg-slate-600 text-slate-200 border-slate-500";
      default: return "bg-slate-700 text-slate-400 border-slate-600";
    }
  }

  // Get display name for archetype (from modifications or original)
  function getDisplayName(originalName: string): string {
    return cardModifications[originalName]?.displayName || originalName;
  }

  // Get archetype image URL (from modifications or original catalog)
  function getArchetypeImageUrl(archetypeName: string): string | undefined {
    const mod = cardModifications[archetypeName];
    if (mod?.imageUrl) return mod.imageUrl;
    const arch = ARCHETYPE_DECKS.find(a => a.name === archetypeName);
    return arch?.imageUrl;
  }

  // Save archetype display name
  function saveArchetypeName() {
    if (!selectedArchetype || !tempName.trim()) return;
    if (!cardModifications[selectedArchetype]) {
      cardModifications[selectedArchetype] = {};
    }
    cardModifications[selectedArchetype].displayName = tempName.trim();
    notifyModificationChange(); // Notify other components
    setEditingName(false);
    setSuccessMessage(`Display name changed to "${tempName.trim()}"`);
    setTimeout(() => setSuccessMessage(""), 2000);
  }

  // Search for card images to use as archetype image
  async function searchArchetypeImages() {
    if (!imageSearchQuery.trim()) return;
    setImageSearchLoading(true);
    setImageSearchResults([]);
    try {
      const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(imageSearchQuery)}&num=20&offset=0`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.data)) {
          setImageSearchResults(data.data);
        }
      }
    } catch (err) {
      console.error('Image search failed', err);
    } finally {
      setImageSearchLoading(false);
    }
  }

  // Select a card image for the archetype
  function selectArchetypeImage(imageUrl: string) {
    if (!selectedArchetype) return;
    if (!cardModifications[selectedArchetype]) {
      cardModifications[selectedArchetype] = {};
    }
    cardModifications[selectedArchetype].imageUrl = imageUrl;
    notifyModificationChange(); // Notify other components
    setImageSearchOpen(false);
    setImageSearchQuery("");
    setImageSearchResults([]);
    setSuccessMessage("Archetype image updated!");
    setTimeout(() => setSuccessMessage(""), 2000);
  }
  
  // Filter archetypes by search
  const filteredArchetypes = useMemo(() => {
    return ARCHETYPE_DECKS.filter(a => {
      // Filter out removed archetypes
      const mod = cardModifications[a.name];
      if (mod?.is_removed) return false;
      
      // If no search query, show all (non-removed)
      if (!searchQuery.trim()) return true;
      
      // Otherwise filter by search
      const lowerQuery = searchQuery.toLowerCase();
      return a.name.toLowerCase().includes(lowerQuery) ||
        (mod?.displayName?.toLowerCase().includes(lowerQuery));
    });
  }, [searchQuery, modificationVersion]);

  // Load archetype cards from DB first, then API as fallback
  async function loadArchetypeCards(archetypeName: string) {
    setLoadingCards(true);
    setArchetypeCards([]);
    setErrorMessage("");
    
    try {
      // Check cache first
      if (archetypeCardsCache[archetypeName]?.length > 0) {
        setArchetypeCards(archetypeCardsCache[archetypeName]);
        setLoadingCards(false);
        return;
      }

      // Try loading from local DB first
      try {
        const dbOrm = CardCatalogORM.getInstance();
        const dbCards = await dbOrm.getByArchetype(archetypeName, 500);
        if (dbCards && dbCards.length > 0) {
          const normalized = dbCards.map((r: any) => {
            const data = typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
            return data as YGOCard;
          });
          archetypeCardsCache[archetypeName] = normalized;
          setArchetypeCards(normalized);
          setLoadingCards(false);
          return;
        }
      } catch (e) {
        console.warn('Failed to load from DB, falling back to API', e);
      }

      // Fallback to API
      const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?archetype=${encodeURIComponent(archetypeName)}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.data)) {
          archetypeCardsCache[archetypeName] = data.data;
          setArchetypeCards(data.data);
          
          // Persist to DB for faster future loads
          try {
            const dbOrm = CardCatalogORM.getInstance();
            const payload = data.data.map((c: YGOCard) => ({
              name: c.name,
              data: c,
              archetypes: c.archetype ? [c.archetype] : [archetypeName]
            }));
            await dbOrm.bulkUpsert(payload);
          } catch (e) {
            console.warn('Failed to persist archetype cards to DB', e);
          }
        }
      } else {
        setErrorMessage(`API returned ${response.status}: Could not load cards for "${archetypeName}"`);
      }
    } catch (err: any) {
      console.error('Failed to load archetype cards', err);
      setErrorMessage(err?.message || 'Failed to load archetype cards');
    } finally {
      setLoadingCards(false);
    }
  }

  // Search for cards to add
  async function searchCards(query: string) {
    if (!query.trim()) {
      setCardSearchResults([]);
      return;
    }
    
    setCardSearchLoading(true);
    try {
      const urls = [
        `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(query)}&num=30&offset=0`,
        `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(query)}`,
      ];
      
      for (const url of urls) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data.data) && data.data.length > 0) {
              setCardSearchResults(data.data.slice(0, 30));
              return;
            }
          }
        } catch (e) {
          continue;
        }
      }
      setCardSearchResults([]);
    } catch (err) {
      console.error('Card search failed', err);
      setCardSearchResults([]);
    } finally {
      setCardSearchLoading(false);
    }
  }

  // Add a card to the selected archetype
  async function addCardToArchetype(card: YGOCard) {
    if (!selectedArchetype) return;
    
    // Check if already in the list
    if (archetypeCards.some(c => c.name === card.name)) {
      setSuccessMessage(`"${card.name}" is already in ${selectedArchetype}`);
      setTimeout(() => setSuccessMessage(""), 2000);
      return;
    }
    
    setSavingState('saving');
    
    try {
      // Add to local state
      const updatedCards = [...archetypeCards, card];
      setArchetypeCards(updatedCards);
      archetypeCardsCache[selectedArchetype] = updatedCards;
      
      // Persist to DB
      const dbOrm = CardCatalogORM.getInstance();
      await dbOrm.ensureArchetypeOnCard(card.name, selectedArchetype, card);
      
      notifyModificationChange(); // Notify player panels to refresh
      setSavingState('saved');
      setSuccessMessage(`Added "${card.name}" to ${selectedArchetype}`);
      setTimeout(() => {
        setSuccessMessage("");
        setSavingState('idle');
      }, 2000);
    } catch (err: any) {
      console.error('Failed to add card to archetype', err);
      setErrorMessage(err?.message || 'Failed to add card');
      setSavingState('idle');
    }
  }

  // Remove a card from the selected archetype
  async function removeCardFromArchetype(cardName: string) {
    if (!selectedArchetype) return;
    
    setSavingState('saving');
    
    try {
      // Remove from local state
      const updatedCards = archetypeCards.filter(c => c.name !== cardName);
      setArchetypeCards(updatedCards);
      archetypeCardsCache[selectedArchetype] = updatedCards;
      
      // Remove archetype from card in DB
      const dbOrm = CardCatalogORM.getInstance();
      const existing = await dbOrm.getByName(cardName);
      if (existing && existing.archetypes) {
        const newArchetypes = existing.archetypes.filter((a: string) => a !== selectedArchetype);
        await dbOrm.bulkUpsert([{
          name: cardName,
          data: existing.data,
          archetypes: newArchetypes
        }]);
      }
      
      notifyModificationChange(); // Notify player panels to refresh
      setSavingState('saved');
      setSuccessMessage(`Removed "${cardName}" from ${selectedArchetype}`);
      setTimeout(() => {
        setSuccessMessage("");
        setSavingState('idle');
      }, 2000);
    } catch (err: any) {
      console.error('Failed to remove card from archetype', err);
      setErrorMessage(err?.message || 'Failed to remove card');
      setSavingState('idle');
    }
  }

  // Refresh cards from API (force reload)
  async function refreshFromAPI() {
    if (!selectedArchetype) return;
    
    setLoadingCards(true);
    setErrorMessage("");
    
    try {
      const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?archetype=${encodeURIComponent(selectedArchetype)}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.data)) {
          archetypeCardsCache[selectedArchetype] = data.data;
          setArchetypeCards(data.data);
          
          // Persist to DB
          const dbOrm = CardCatalogORM.getInstance();
          const payload = data.data.map((c: YGOCard) => ({
            name: c.name,
            data: c,
            archetypes: c.archetype ? [c.archetype] : [selectedArchetype]
          }));
          await dbOrm.bulkUpsert(payload);
          
          notifyModificationChange(); // Notify player panels to refresh
          setSuccessMessage(`Refreshed ${data.data.length} cards from API`);
          setTimeout(() => setSuccessMessage(""), 3000);
        }
      } else {
        setErrorMessage(`API returned ${response.status}`);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to refresh from API');
    } finally {
      setLoadingCards(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border border-slate-700 bg-slate-800  ">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent">
            <Layers className="size-6 text-rose-400" />
            Archetype Cards Manager
          </CardTitle>
          <CardDescription className="text-slate-400">
            View and manage cards for each archetype. Add or remove cards to customize archetype contents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Archetype List */}
            <div className="lg:col-span-1 space-y-3">
              <div className="flex items-center gap-2">
                <Search className="size-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search archetypes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
                />
              </div>
              
              <div className="max-h-[500px] overflow-y-auto pr-2 space-y-1">
                {filteredArchetypes.map((archetype) => (
                  <button
                    key={archetype.name}
                    type="button"
                    onClick={() => {
                      setSelectedArchetype(archetype.name);
                      loadArchetypeCards(archetype.name);
                    }}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg border transition-colors text-left ${
                      selectedArchetype === archetype.name
                        ? "border-rose-500/50 bg-rose-950/30 text-rose-300"
                        : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    {getArchetypeImageUrl(archetype.name) ? (
                      <img
                        src={getArchetypeImageUrl(archetype.name)}
                        alt={getDisplayName(archetype.name)}
                        className="size-8 rounded object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="size-8 rounded bg-slate-700 flex items-center justify-center">
                        <Package className="size-4 text-slate-500" />
                      </div>
                    )}
                    <span className="flex-1 truncate font-medium text-sm">{getDisplayName(archetype.name)}</span>
                    <Badge className={`text-xs shrink-0 ${getRatingBadgeStyle(archetype.rating)}`}>
                      {archetype.rating}
                    </Badge>
                  </button>
                ))}
              </div>
              
              <div className="text-xs text-slate-500 text-center">
                {filteredArchetypes.length} of {ARCHETYPE_DECKS.length} archetypes
              </div>
            </div>

            {/* Card List & Management */}
            <div className="lg:col-span-2 space-y-4">
              {!selectedArchetype ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <Layers className="size-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium">Select an archetype</p>
                  <p className="text-sm">Choose an archetype from the list to view and manage its cards</p>
                </div>
              ) : (
                <>
                  {/* Header with archetype name and actions */}
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      {/* Archetype Image with Edit */}
                      <button
                        type="button"
                        onClick={() => {
                          setImageSearchOpen(true);
                          setImageSearchQuery(selectedArchetype);
                        }}
                        className="relative group"
                        title="Change archetype image"
                      >
                        {getArchetypeImageUrl(selectedArchetype) ? (
                          <img
                            src={getArchetypeImageUrl(selectedArchetype)}
                            alt={getDisplayName(selectedArchetype)}
                            className="size-12 rounded-lg object-cover border-2 border-amber-500/50 group-hover:border-amber-400 transition-colors"
                          />
                        ) : (
                          <div className="size-12 rounded-lg bg-slate-700 flex items-center justify-center border-2 border-dashed border-slate-600 group-hover:border-amber-400 transition-colors">
                            <Image className="size-5 text-slate-500 group-hover:text-amber-400" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Edit3 className="size-4 text-white" />
                        </div>
                      </button>
                      
                      {/* Archetype Name with Edit */}
                      {editingName ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="text"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') saveArchetypeName(); if (e.key === 'Escape') setEditingName(false); }}
                            className="w-48 bg-slate-800 border-amber-500 text-amber-400 font-bold"
                            autoFocus
                          />
                          <Button size="sm" onClick={saveArchetypeName} className="bg-emerald-600 hover:bg-emerald-700">
                            <Save className="size-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingName(false)} className="text-slate-400">
                            <X className="size-3" />
                          </Button>
                        </div>
                      ) : (
                        <h3 
                          className="text-lg font-bold text-amber-400 flex items-center gap-2 cursor-pointer hover:text-amber-300 group"
                          onClick={() => { setEditingName(true); setTempName(getDisplayName(selectedArchetype)); }}
                          title="Click to rename"
                        >
                          {getDisplayName(selectedArchetype)}
                          <Edit3 className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h3>
                      )}
                      
                      <Badge variant="outline" className="text-xs border-slate-600">
                        {archetypeCards.length} cards
                      </Badge>
                      
                      {/* Rating Selector */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Rating:</span>
                        <Select 
                          value={(() => {
                            const archetype = ARCHETYPE_DECKS.find(a => a.name === selectedArchetype);
                            const mod = cardModifications[selectedArchetype];
                            return mod?.rating || archetype?.rating || 'C';
                          })()} 
                          onValueChange={async (newRating: MetaRating) => {
                            const archetype = ARCHETYPE_DECKS.find(a => a.name === selectedArchetype);
                            if (!archetype) return;
                            
                            const newPrice = META_RATING_PRICES[newRating];
                            console.log(`📝 Changing rating for ${selectedArchetype} from ${archetype.rating} to ${newRating}`, { newPrice });
                            
                            // Update in-memory cardModifications
                            const mod = cardModifications[selectedArchetype] || {};
                            cardModifications[selectedArchetype] = {
                              ...mod,
                              rating: newRating,
                              price: newPrice
                            };
                            console.log('Updated cardModifications:', { [selectedArchetype]: cardModifications[selectedArchetype] });
                            
                            // Update the archetype in ARCHETYPE_DECKS array
                            const idx = ARCHETYPE_DECKS.findIndex(a => a.name === selectedArchetype);
                            if (idx >= 0) {
                              ARCHETYPE_DECKS[idx] = {
                                ...ARCHETYPE_DECKS[idx],
                                rating: newRating,
                                price: newPrice
                              };
                            }
                            
                            // Generate updated catalog file content
                            await updateCatalogFile(selectedArchetype, newRating, newPrice);
                            
                            notifyModificationChange();
                            setSuccessMessage(`Rating changed to ${newRating} (${newPrice} coins)`);
                            setTimeout(() => setSuccessMessage(""), 2000);
                          }}
                        >
                          <SelectTrigger className="w-16 h-7 bg-slate-800 border-slate-600 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(['F', 'D', 'C', 'B', 'A', 'S', 'S+'] as MetaRating[]).map((r) => (
                              <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {savingState === 'saving' && (
                        <span className="text-xs text-amber-400 animate-pulse">Saving...</span>
                      )}
                      {savingState === 'saved' && (
                        <span className="text-xs text-emerald-400">Saved</span>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refreshFromAPI}
                      disabled={loadingCards}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <Search className="size-3 mr-1" />
                      Refresh from API
                    </Button>
                  </div>
                  
                  {/* Image Search Modal */}
                  {imageSearchOpen && (
                    <div className="p-4 rounded-lg border border-amber-700 bg-slate-800/80">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                          <Image className="size-4" />
                          Search Card Image for Archetype
                        </h4>
                        <button
                          type="button"
                          onClick={() => { setImageSearchOpen(false); setImageSearchResults([]); }}
                          className="text-slate-400 hover:text-slate-200"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                      <div className="flex gap-2 mb-3">
                        <Input
                          type="text"
                          placeholder="Search for a card image..."
                          value={imageSearchQuery}
                          onChange={(e) => setImageSearchQuery(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') searchArchetypeImages(); }}
                          className="flex-1 bg-slate-800 border-slate-700 text-slate-100"
                          autoFocus
                        />
                        <Button onClick={searchArchetypeImages} disabled={imageSearchLoading} className="bg-amber-500 hover:bg-amber-600 text-slate-900">
                          <Search className="size-4" />
                        </Button>
                      </div>
                      {imageSearchLoading && <div className="text-center py-4 text-amber-400 animate-pulse">Searching...</div>}
                      {!imageSearchLoading && imageSearchResults.length > 0 && (
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-48 overflow-y-auto">
                          {imageSearchResults.map((card) => (
                            <button
                              key={card.id}
                              type="button"
                              onClick={() => selectArchetypeImage(card.card_images?.[0]?.image_url_small || card.card_images?.[0]?.image_url || '')}
                              className="relative group rounded overflow-hidden border border-slate-700 hover:border-amber-400 transition-colors"
                              title={card.name}
                            >
                              <img
                                src={card.card_images?.[0]?.image_url_small}
                                alt={card.name}
                                className="w-full aspect-[3/4] object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Success/Error messages */}
                  {successMessage && (
                    <Alert className="bg-emerald-950/50 border border-emerald-500/50 text-emerald-200">
                      <Save className="size-4" />
                      <AlertDescription>{successMessage}</AlertDescription>
                    </Alert>
                  )}
                  {errorMessage && (
                    <Alert className="bg-rose-950/50 border border-rose-500/50 text-rose-200">
                      <X className="size-4" />
                      <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                  )}

                  {/* Add Card Section */}
                  <div className="p-3 rounded-lg border border-slate-700 bg-slate-800">
                    <div className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                      <Plus className="size-4" />
                      Add Card to Archetype
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Search for a card to add..."
                        value={cardSearchQuery}
                        onChange={(e) => setCardSearchQuery(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') searchCards(cardSearchQuery); }}
                        className="flex-1 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
                      />
                      <Button
                        onClick={() => searchCards(cardSearchQuery)}
                        disabled={cardSearchLoading}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                      >
                        <Search className="size-4" />
                      </Button>
                    </div>
                    
                    {/* Search Results */}
                    {cardSearchLoading && (
                      <div className="text-center py-4 text-amber-400 animate-pulse">Searching...</div>
                    )}
                    {!cardSearchLoading && cardSearchResults.length > 0 && (
                      <div className="mt-3 max-h-48 overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {cardSearchResults.map((card) => {
                            const isInArchetype = archetypeCards.some(c => c.name === card.name);
                            return (
                              <div
                                key={card.id}
                                className={`flex items-center gap-2 p-2 rounded border ${
                                  isInArchetype
                                    ? 'border-emerald-500/50 bg-emerald-950/20'
                                    : 'border-slate-700 bg-slate-800 hover:bg-slate-800'
                                }`}
                              >
                                {card.card_images?.[0]?.image_url_small && (
                                  <img
                                    src={card.card_images[0].image_url_small}
                                    alt={card.name}
                                    className="size-8 rounded object-cover"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium text-slate-100 truncate">{card.name}</div>
                                  <div className="text-xs text-slate-500 truncate">{card.type}</div>
                                </div>
                                {isInArchetype ? (
                                  <span className="text-xs text-emerald-400">âœ“</span>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => addCardToArchetype(card)}
                                    className="h-6 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                                  >
                                    <Plus className="size-3" />
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cards in Archetype */}
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-slate-300">Cards in this Archetype</div>
                    
                    {loadingCards ? (
                      <div className="text-center py-8 text-amber-400 animate-pulse">Loading cards...</div>
                    ) : archetypeCards.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        No cards found. Use "Refresh from API" or add cards manually above.
                      </div>
                    ) : (
                      <div className="max-h-[400px] overflow-y-auto pr-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {archetypeCards.map((card) => {
                            const cardBanStatus = getBanStatus(card.name);
                            return (
                            <div
                              key={card.id || card.name}
                              className="flex items-center gap-2 p-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-800 group"
                            >
                              {card.card_images?.[0]?.image_url_small && (
                                <img
                                  src={card.card_images[0].image_url_small}
                                  alt={card.name}
                                  className="size-10 rounded object-cover"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-slate-100 truncate">{card.name}</div>
                                <div className="text-xs text-slate-400 truncate">{card.type}</div>
                              </div>
                              <BanIndicator banStatus={cardBanStatus} size="sm" />
                              <button
                                type="button"
                                onClick={() => removeCardFromArchetype(card.name)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                                title="Remove from archetype"
                              >
                                <X className="size-4" />
                              </button>
                            </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StaplesManageTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [cardSearchQuery, setCardSearchQuery] = useState("");
  const [cardSearchResults, setCardSearchResults] = useState<YGOCard[]>([]);
  const [cardSearchLoading, setCardSearchLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedRating, setSelectedRating] = useState<MetaRating>("A");
  
  // Listen for modification changes (shared with catalog)
  const modVersion = useModificationVersion();
  
  // Listen for banlist changes
  const _banlistVersion = useBanlistVersion();
  
  // Get ban status for a card
  const getBanStatus = useCallback((cardName: string): BanStatus => {
    return (banlist[cardName]?.banStatus as BanStatus) ?? 'unlimited';
  }, [_banlistVersion]);
  
  // Editing staple state
  const [editingStaple, setEditingStaple] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRating, setEditRating] = useState<MetaRating>("A");
  const [editImageUrl, setEditImageUrl] = useState("");

  // Get effective staples list using shared function
  const effectiveStaples = useMemo(() => {
    return getEffectiveStaples();
  }, [modVersion]);

  // Filter staples by search
  const filteredStaples = useMemo(() => {
    return effectiveStaples.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, effectiveStaples]);

  // Rating style helper
  function getRatingBadgeStyle(rating: string): string {
    switch (rating) {
      case "S+": return "bg-gradient-to-r from-rose-500 to-pink-500 text-white border-rose-400";
      case "S": return "bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 border-amber-400";
      case "A": return "bg-gradient-to-r from-violet-500 to-purple-600 text-white border-violet-400";
      case "B": return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-blue-400";
      case "C": return "bg-gradient-to-r from-emerald-500 to-green-500 text-white border-emerald-400";
      case "D": return "bg-slate-600 text-slate-200 border-slate-500";
      default: return "bg-slate-700 text-slate-400 border-slate-600";
    }
  }

  // Search for cards to add as staples
  async function searchCards() {
    if (!cardSearchQuery.trim()) return;
    setCardSearchLoading(true);
    setCardSearchResults([]);
    try {
      const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(cardSearchQuery)}&num=20&offset=0`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.data)) {
          setCardSearchResults(data.data);
        }
      }
    } catch (err) {
      console.error('Card search failed', err);
    } finally {
      setCardSearchLoading(false);
    }
  }

  // Add card as staple
  function addStaple(card: YGOCard) {
    // Check if already exists
    const exists = effectiveStaples.some(s => s.name.toLowerCase() === card.name.toLowerCase());
    if (exists) {
      setErrorMessage(`"${card.name}" is already a staple`);
      setTimeout(() => setErrorMessage(""), 2000);
      return;
    }
    
    const price = META_RATING_PRICES[selectedRating] || 800;
    customStaples.push({
      name: card.name,
      rating: selectedRating,
      price,
      imageUrl: card.card_images?.[0]?.image_url_small
    });
    
    // If it was previously removed, unremove it
    removedStaples.delete(card.name);
    
    notifyModificationChange(); // Notify other components
    setSuccessMessage(`Added "${card.name}" as staple`);
    setCardSearchResults([]);
    setCardSearchQuery("");
    setTimeout(() => setSuccessMessage(""), 2000);
  }

  // Remove staple
  function removeStaple(name: string) {
    // If it's a custom staple, remove from customStaples
    const customIndex = customStaples.findIndex(s => s.name === name);
    if (customIndex !== -1) {
      customStaples.splice(customIndex, 1);
    } else {
      // If it's an original staple, add to removed set
      removedStaples.add(name);
    }
    notifyModificationChange(); // Notify other components
    setSuccessMessage(`Removed "${name}" from staples`);
    setTimeout(() => setSuccessMessage(""), 2000);
  }

  // Start editing a staple
  function startEditStaple(staple: { name: string; rating: MetaRating; imageUrl?: string }) {
    setEditingStaple(staple.name);
    setEditName(staple.name);
    setEditRating(staple.rating);
    setEditImageUrl(staple.imageUrl || "");
  }

  // Save staple edits
  function saveStapleEdit() {
    if (!editingStaple) return;
    
    // Find and update in customStaples or create override
    const customIndex = customStaples.findIndex(s => s.name === editingStaple);
    if (customIndex !== -1) {
      customStaples[customIndex] = {
        ...customStaples[customIndex],
        name: editName,
        rating: editRating,
        imageUrl: editImageUrl || undefined,
        price: META_RATING_PRICES[editRating] || customStaples[customIndex].price
      };
    } else {
      // It's an original staple - add as custom with modifications
      removedStaples.add(editingStaple);
      const original = STAPLE_CARDS.find(s => s.name === editingStaple);
      customStaples.push({
        name: editName,
        rating: editRating,
        price: META_RATING_PRICES[editRating] || original?.price || 800,
        imageUrl: editImageUrl || original?.imageUrl
      });
    }
    
    notifyModificationChange(); // Notify other components
    setEditingStaple(null);
    setSuccessMessage("Staple updated!");
    setTimeout(() => setSuccessMessage(""), 2000);
  }

  return (
    <div className="space-y-6">
      <Card className="border border-slate-700 bg-slate-800  ">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent">
            <Star className="size-6 text-amber-400" />
            Staples Manager
          </CardTitle>
          <CardDescription className="text-slate-400">
            Manage staple cards. Add, remove, or edit staples and their ratings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add Staple Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-amber-400 flex items-center gap-2">
                <Plus className="size-5" />
                Add New Staple
              </h3>
              
              {/* Rating selector */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-slate-400">Rating:</span>
                {(["S+", "S", "A", "B", "C", "D"] as MetaRating[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRating(r)}
                    className={`px-3 py-1 rounded text-sm font-bold border transition-colors ${
                      selectedRating === r
                        ? getRatingBadgeStyle(r) + " ring-2 ring-white/30"
                        : "bg-slate-700 text-slate-400 border-slate-600 hover:bg-slate-600"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              
              {/* Card search */}
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Search for a card to add..."
                  value={cardSearchQuery}
                  onChange={(e) => setCardSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') searchCards(); }}
                  className="flex-1 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
                />
                <Button
                  onClick={searchCards}
                  disabled={cardSearchLoading}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                >
                  <Search className="size-4" />
                </Button>
              </div>
              
              {/* Search Results */}
              {cardSearchLoading && (
                <div className="text-center py-4 text-amber-400 animate-pulse">Searching...</div>
              )}
              {!cardSearchLoading && cardSearchResults.length > 0 && (
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {cardSearchResults.map((card) => {
                    const isStaple = effectiveStaples.some(s => s.name.toLowerCase() === card.name.toLowerCase());
                    return (
                      <div
                        key={card.id}
                        className="flex items-center gap-2 p-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-800"
                      >
                        {card.card_images?.[0]?.image_url_small && (
                          <img
                            src={card.card_images[0].image_url_small}
                            alt={card.name}
                            className="size-10 rounded object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-100 truncate">{card.name}</div>
                          <div className="text-xs text-slate-400 truncate">{card.type}</div>
                        </div>
                        {isStaple ? (
                          <span className="text-xs text-emerald-400">Already added</span>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => addStaple(card)}
                            className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                          >
                            <Plus className="size-3 mr-1" />
                            Add
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Success/Error messages */}
              {successMessage && (
                <Alert className="bg-emerald-950/50 border border-emerald-500/50 text-emerald-200">
                  <Save className="size-4" />
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}
              {errorMessage && (
                <Alert className="bg-rose-950/50 border border-rose-500/50 text-rose-200">
                  <X className="size-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
            </div>
            
            {/* Current Staples List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-amber-400 flex items-center gap-2">
                  <Star className="size-5" />
                  Current Staples
                  <Badge variant="outline" className="text-xs border-slate-600">
                    {effectiveStaples.length} total
                  </Badge>
                </h3>
              </div>
              
              {/* Search filter */}
              <div className="flex items-center gap-2">
                <Search className="size-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Filter staples..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
                />
              </div>
              
              {/* Staples list */}
              <div className="max-h-[400px] overflow-y-auto pr-2 space-y-1">
                {filteredStaples.map((staple) => (
                  <div
                    key={staple.name}
                    className="flex items-center gap-2 p-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-800 group"
                  >
                    {staple.imageUrl ? (
                      <img
                        src={staple.imageUrl}
                        alt={staple.name}
                        className="size-10 rounded object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="size-10 rounded bg-slate-700 flex items-center justify-center">
                        <Star className="size-4 text-slate-500" />
                      </div>
                    )}
                    
                    {editingStaple === staple.name ? (
                      <div className="flex-1 flex items-center gap-2 flex-wrap">
                        <Input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-32 h-7 text-xs bg-slate-800 border-amber-500"
                        />
                        <select
                          value={editRating}
                          onChange={(e) => setEditRating(e.target.value as MetaRating)}
                          className="h-7 px-2 rounded bg-slate-700 border border-slate-600 text-slate-100 text-xs"
                        >
                          {(["S+", "S", "A", "B", "C", "D"] as MetaRating[]).map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        <Button size="sm" onClick={saveStapleEdit} className="h-7 bg-emerald-600 hover:bg-emerald-700">
                          <Save className="size-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingStaple(null)} className="h-7 text-slate-400">
                          <X className="size-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-100 truncate">{staple.name}</div>
                          <div className="text-xs text-slate-400">{staple.price} coins</div>
                        </div>
                        <BanIndicator banStatus={getBanStatus(staple.name)} size="sm" />
                        <Badge className={`text-xs ${getRatingBadgeStyle(staple.rating)}`}>
                          {staple.rating}
                        </Badge>
                        <button
                          type="button"
                          onClick={() => startEditStaple(staple)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-amber-900 text-slate-400 hover:text-amber-400"
                          title="Edit staple"
                        >
                          <Edit3 className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeStaple(staple.name)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                          title="Remove staple"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="text-xs text-slate-500 text-center">
                Showing {filteredStaples.length} of {effectiveStaples.length} staples
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Gacha Tab - Random card pulls
type GachaRarity = 'Common' | 'Rare' | 'Super Rare' | 'Ultra Rare';

interface GachaBanner {
  id: string;
  name: string;
  description: string;
  singleCost: number;
  multiCost: number;
  imageUrl?: string;
  packType?: 'standard' | 'premium';
  cardsArchetypes?: string[]; // Card pool for custom packs
}

interface GachaResult {
  card: ArchetypeCard;
  rarity: GachaRarity;
  isNew: boolean;
  archetype?: string; // Track which archetype the card came from
}

function GachaTab({ user, onUserUpdate }: { user: UserModel; onUserUpdate: (userId: string) => void }) {
  const [pulling, setPulling] = useState(false);
  const [results, setResults] = useState<GachaResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState("");
  const [animatingCards, setAnimatingCards] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);
  const [selectedGachaCard, setSelectedGachaCard] = useState<{card: ArchetypeCard; rarity: GachaRarity; archetype?: string} | null>(null);
  const [banners, setBanners] = useState<GachaBanner[]>([]);
  const [loading, setLoading] = useState(true);

  // Load gacha packs from database
  useEffect(() => {
    loadGachaPacks();
  }, []);

  async function loadGachaPacks() {
    // Always start with default packs
    const defaultBanners: GachaBanner[] = [
      {
        id: 'standard',
        name: 'Standard Pack',
        description: 'Pull random cards from all available archetypes',
        singleCost: 4,
        multiCost: 90,
        imageUrl: '/common.png',
        packType: 'standard',
      },
      {
        id: 'premium',
        name: 'Premium Pack',
        description: 'Higher chance for rare cards',
        singleCost: 5,
        multiCost: 115,
        imageUrl: '/premium.png',
        packType: 'premium',
      },
    ];

    try {
      const gachaPackORM = GachaPackORM.getInstance();
      const packs = await gachaPackORM.getActivePacks();
      
      if (packs && packs.length > 0) {
        // Add custom packs after defaults
        console.log('Loaded packs from database:', packs);
        const customBanners: GachaBanner[] = packs.map(pack => {
          console.log(`Pack "${pack.name}" has cards_archetypes:`, pack.cards_archetypes);
          return {
            id: pack.id,
            name: pack.name,
            description: pack.description,
            singleCost: pack.single_cost,
            multiCost: pack.multi_cost,
            imageUrl: pack.image_url,
            packType: pack.pack_type,
            cardsArchetypes: pack.cards_archetypes || [],
          };
        });
        console.log('Custom banners created:', customBanners);
        setBanners([...defaultBanners, ...customBanners]);
      } else {
        // Only defaults
        setBanners(defaultBanners);
      }
    } catch (err) {
      console.error('Failed to load gacha packs from database:', err);
      // Database unavailable, use only defaults
      setBanners(defaultBanners);
    } finally {
      setLoading(false);
    }
  }

  async function performPull(banner: GachaBanner, count: number) {
    if (pulling) return;
    
    console.log('performPull called with banner:', banner);
    
    const cost = count === 9 ? banner.singleCost : banner.multiCost;
    
    if (user.coin < cost) {
      setError("Insufficient coins!");
      return;
    }

    setPulling(true);
    setError("");
    setResults([]);

    try {
      // Get user's existing collection to check for new cards
      const purchaseORM = PurchaseORM.getInstance();
      const purchases = await purchaseORM.getPurchaseByUserId(user.id);
      const ownedCardNames = new Set<string>();

      // Build set of owned card names from purchases
      // For gacha cards (type 4), item_name is the card name
      // For other types, item_name might be archetype names - just collect them
      purchases.forEach(purchase => {
        ownedCardNames.add(purchase.item_name.toLowerCase());
      });

      // Determine card pool based on banner
      let cardPool: string[] = [];
      
      // Check if banner has custom card pool
      if (banner.cardsArchetypes && banner.cardsArchetypes.length > 0) {
        cardPool = banner.cardsArchetypes;
        console.log(`Using custom pack pool (${cardPool.length} entries):`, cardPool);
      } else {
        // Fallback to all archetypes for standard/premium packs
        cardPool = ARCHETYPE_DECKS.map(d => d.name);
        console.log(`Using default archetype pool (${cardPool.length} entries)`);
      }

      const pulledCards: GachaResult[] = [];

      for (let i = 0; i < count; i++) {
        // Pick random card/archetype from pool
        const randomEntry = cardPool[Math.floor(Math.random() * cardPool.length)];
        
        try {
          // Try as archetype first
          let response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?archetype=${encodeURIComponent(randomEntry)}`);
          
          // If 400 error, try as card name instead
          if (!response.ok && response.status === 400) {
            response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(randomEntry)}`);
          }
          
          if (response.ok) {
            const data = await response.json();
            if (data.data && data.data.length > 0) {
              // Pick random card from result (for archetypes) or use the single card (for card names)
              const randomCard = data.data[Math.floor(Math.random() * data.data.length)];
              
              // Determine rarity based on banner type and RNG
              let rarity: GachaRarity;
              const rarityRoll = Math.random();
              
              if (banner.packType === 'premium') {
                // Premium has better rates
                if (rarityRoll < 0.05) rarity = 'Ultra Rare';
                else if (rarityRoll < 0.20) rarity = 'Super Rare';
                else if (rarityRoll < 0.50) rarity = 'Rare';
                else rarity = 'Common';
              } else {
                // Standard rates
                if (rarityRoll < 0.02) rarity = 'Ultra Rare';
                else if (rarityRoll < 0.10) rarity = 'Super Rare';
                else if (rarityRoll < 0.30) rarity = 'Rare';
                else rarity = 'Common';
              }

              pulledCards.push({
                card: randomCard,
                rarity,
                isNew: !ownedCardNames.has(randomCard.name.toLowerCase()),
                archetype: randomEntry,
              });
            }
          }
        } catch (err) {
          console.error(`Failed to fetch cards for ${randomEntry}`, err);
        }
      }

      if (pulledCards.length === 0) {
        setError("Failed to pull cards. Please try again.");
        return;
      }

      // Deduct coins
      const userORM = UserORM.getInstance();
      const updatedUser = { ...user, coin: user.coin - cost };
      await userORM.setUserById(user.id, updatedUser);

      // Log the gacha pull
      const coinLogORM = CoinLogORM.getInstance();
      await coinLogORM.insertCoinLog([
        {
          user_id: user.id,
          amount: -cost,
          reason: `Gacha pull: ${banner.name} x${count}`,
          created_at: String(Math.floor(Date.now() / 1000)),
        } as unknown as CoinLogModel,
      ]);

      // Add individual cards to collection as purchase records (not whole archetypes!)
      // Each pulled card gets its own purchase record with the card name
      for (let idx = 0; idx < pulledCards.length; idx++) {
        const result = pulledCards[idx];
        const cardName = result.card.name;
        try {
          // Try to add gacha card (first time pulling this card)
          await purchaseORM.insertPurchase([{
            user_id: user.id,
            item_name: cardName,
            item_type: PurchaseItemType.Gacha,
            bought_at: String(Math.floor(Date.now() / 1000)),
          } as unknown as PurchaseModel]);
          console.log(`Added gacha card to collection: ${cardName}, type: ${PurchaseItemType.Gacha}`);
        } catch (err: any) {
          // If duplicate (23505 = unique constraint violation), card already in collection - skip
          const errorCode = err?.code || err?.error?.code;
          if (errorCode === '23505') {
            console.log(`Card already in collection: ${cardName}`);
          } else {
            // Other error - log but continue with remaining cards
            console.error(`Failed to add card ${cardName}:`, err);
          }
        }
      }

      setResults(pulledCards);
      setShowResults(true);
      setAnimatingCards(true);
      setRevealedCount(0);
      
      // Animate card reveals
      pulledCards.forEach((_, index) => {
        setTimeout(() => {
          setRevealedCount(index + 1);
        }, index * 150); // 150ms delay between each card
      });
      
      setTimeout(() => {
        setAnimatingCards(false);
      }, pulledCards.length * 150 + 500);
      
      onUserUpdate(user.id);
    } catch (err) {
      console.error("Gacha pull failed:", err);
      setError("Pull failed. Please try again.");
    } finally {
      setPulling(false);
    }
  }

  const getRarityColor = (rarity: GachaRarity) => {
    switch (rarity) {
      case 'Ultra Rare': return 'from-purple-500 to-pink-500';
      case 'Super Rare': return 'from-yellow-500 to-orange-500';
      case 'Rare': return 'from-blue-500 to-cyan-500';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  const getRarityBorder = (rarity: GachaRarity) => {
    switch (rarity) {
      case 'Ultra Rare': return 'border-purple-500';
      case 'Super Rare': return 'border-yellow-500';
      case 'Rare': return 'border-blue-500';
      default: return 'border-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
          Gambling Time
        </h2>
        <p className="text-slate-400">Pull random cards and expand your collection!</p>
      </div>

      {error && (
        <Alert className="bg-red-950/30 border-red-500/50">
          <AlertDescription className="text-red-400">{error}</AlertDescription>
        </Alert>
      )}

      {/* Banners */}
      {loading ? (
        <div className="text-center py-12 text-amber-400 animate-pulse">Loading gacha packs...</div>
      ) : banners.length === 0 ? (
        <Alert className="bg-amber-950/30 border-amber-500/50">
          <AlertDescription className="text-amber-400">No gacha packs available. Contact admin.</AlertDescription>
        </Alert>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory">
          {banners.map(banner => {
            const isPremium = banner.packType === 'premium';
            const cardBorderColor = isPremium ? 'border-red-500/70' : 'border-gray-500/70';
            const cardGradient = isPremium 
              ? 'from-red-950/50 via-slate-900 to-red-950/50' 
              : 'from-gray-800/50 via-slate-900 to-gray-800/50';
            const centerColor = isPremium ? 'bg-red-600' : 'bg-gray-500';
            const glowColor = isPremium ? 'shadow-red-500/20' : 'shadow-gray-500/20';
            const packLabel = isPremium ? 'PREMIUM PACK' : 'STANDARD PACK';
            
            return (
              <Card key={banner.id} className={`min-w-[400px] max-w-[400px] flex-shrink-0 snap-center border-2 ${cardBorderColor} bg-gradient-to-br ${cardGradient} overflow-hidden shadow-xl ${glowColor}`}>
                <CardHeader>
                  {/* Pack Image Display */}
                  <div className="mb-4 relative">
                    <div className={`relative w-full h-64 bg-slate-900 rounded-lg overflow-hidden border-4 ${cardBorderColor}`}>
                      {/* Background pattern */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${cardGradient}`} />
                      
                      {/* Center color indicator - behind everything */}
                      <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 ${centerColor} rounded-full opacity-50 blur-2xl z-0`} />
                      
                      {/* Custom artwork - resized to match template dimensions, behind template */}
                      {banner.imageUrl && (
                        <div className="absolute inset-0 z-[1]">
                          <img 
                            src={banner.imageUrl} 
                            alt={banner.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      {/* Booster pack template overlay - on top of artwork */}
                      <div className="absolute inset-0 z-[2]">
                        <img 
                          src="/Booster Pack.png"
                          alt="Booster Pack Template"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Pack type badge - above everything */}
                      <div className={`absolute top-2 right-2 ${isPremium ? 'bg-red-600' : 'bg-gray-600'} px-3 py-1 rounded text-white font-bold text-xs z-20`}>
                        {packLabel}
                      </div>
                      
                      {/* Yu-Gi-Oh! TCG logo at bottom - above everything */}
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-center z-20">
                        <div className="text-red-600 font-black text-xs tracking-wider drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]">
                          Yu-Gi-Oh! TRADING CARD GAME
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <CardTitle className={`text-2xl font-bold ${isPremium ? 'text-red-400' : 'text-gray-300'}`}>{banner.name}</CardTitle>
                  <CardDescription className="text-slate-300">{banner.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                      <span className="text-slate-300">Single Pack (9 Cards)</span>
                      <div className="flex items-center gap-2">
                        <Coins className="size-4 text-amber-400" />
                        <span className="font-bold text-amber-300">{banner.singleCost}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                      <span className="text-slate-300">Booster Box (24 Packs, 216 Cards)</span>
                      <div className="flex items-center gap-2">
                        <Coins className="size-4 text-amber-400" />
                        <span className="font-bold text-amber-300">{banner.multiCost}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => performPull(banner, 9)}
                      disabled={pulling || user.coin < banner.singleCost}
                      className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 font-bold"
                    >
                      {pulling ? "Opening..." : "Open Pack"}
                    </Button>
                    <Button
                      onClick={() => performPull(banner, 24 * 9)}
                      disabled={pulling || user.coin < banner.multiCost}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold"
                    >
                      {pulling ? "Opening..." : "Open Box (24)"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Rates Info */}
      <Card className="border border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-amber-400">Drop Rates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-slate-300 mb-2">Standard Pack</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-purple-400">Ultra Rare:</span><span className="text-slate-400">2%</span></div>
                <div className="flex justify-between"><span className="text-yellow-400">Super Rare:</span><span className="text-slate-400">8%</span></div>
                <div className="flex justify-between"><span className="text-blue-400">Rare:</span><span className="text-slate-400">20%</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Common:</span><span className="text-slate-400">70%</span></div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-slate-300 mb-2">Premium Pack</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-purple-400">Ultra Rare:</span><span className="text-slate-400">5%</span></div>
                <div className="flex justify-between"><span className="text-yellow-400">Super Rare:</span><span className="text-slate-400">15%</span></div>
                <div className="flex justify-between"><span className="text-blue-400">Rare:</span><span className="text-slate-400">30%</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Common:</span><span className="text-slate-400">50%</span></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Dialog */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
              Pack Opening Results
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              You pulled {results.length} card{results.length > 1 ? 's' : ''}!
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] pr-2">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {results.map((result, index) => {
                const isRevealed = index < revealedCount;
                return (
                  <div
                    key={index}
                    onClick={() => isRevealed && setSelectedGachaCard({card: result.card, rarity: result.rarity, archetype: result.archetype})}
                    className={`relative flex flex-col p-3 rounded-lg border-2 ${getRarityBorder(result.rarity)} bg-gradient-to-br ${getRarityColor(result.rarity)} bg-opacity-10 transition-all duration-300 ${
                      isRevealed ? 'opacity-100 scale-100 cursor-pointer hover:scale-105' : 'opacity-0 scale-50'
                    }`}
                    style={{
                      transformOrigin: 'center',
                      animation: isRevealed ? 'cardFlip 0.5s ease-out' : 'none',
                    }}
                    title={isRevealed ? "Click to view details" : ""}
                  >
                    {result.isNew && isRevealed && (
                      <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 z-10 animate-bounce">
                        NEW!
                      </Badge>
                    )}
                    {result.card.card_images && result.card.card_images[0] && (
                      <div className="w-full aspect-[3/4] rounded overflow-hidden mb-2">
                        <img 
                          src={result.card.card_images[0].image_url_small || result.card.card_images[0].image_url} 
                          alt={result.card.name} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    )}
                    <div className="text-xs font-semibold text-slate-100 truncate text-center" title={result.card.name}>
                      {result.card.name}
                    </div>
                    <div className={`text-xs font-bold text-center mt-1 bg-gradient-to-r ${getRarityColor(result.rarity)} bg-clip-text text-transparent`}>
                      {result.rarity}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowResults(false)} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
              Awesome!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <style>{`
        @keyframes cardFlip {
          0% {
            transform: perspective(1000px) rotateY(90deg);
            opacity: 0;
          }
          50% {
            transform: perspective(1000px) rotateY(0deg);
            opacity: 1;
          }
          100% {
            transform: perspective(1000px) rotateY(0deg);
            opacity: 1;
          }
        }
      `}</style>

      {/* Gacha Card Details Dialog */}
      <Dialog open={selectedGachaCard !== null} onOpenChange={(open) => { if (!open) setSelectedGachaCard(null); }}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-amber-400">{selectedGachaCard?.card.name}</DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <span className={`font-bold bg-gradient-to-r ${selectedGachaCard ? getRarityColor(selectedGachaCard.rarity) : ''} bg-clip-text text-transparent`}>
                {selectedGachaCard?.rarity}
              </span>
              {selectedGachaCard?.archetype && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400">Archetype: {selectedGachaCard.archetype}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedGachaCard && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="shrink-0">
                  <img 
                    src={selectedGachaCard.card.card_images[0]?.image_url_small || selectedGachaCard.card.card_images[0]?.image_url} 
                    alt={selectedGachaCard.card.name}
                    className="w-48 h-auto rounded-lg border border-slate-600"
                  />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-sm text-slate-400">Type</p>
                    <p className="text-slate-100 font-semibold">{selectedGachaCard.card.type}</p>
                  </div>
                  {selectedGachaCard.card.race && (
                    <div>
                      <p className="text-sm text-slate-400">Race/Type</p>
                      <p className="text-slate-100 font-semibold">{selectedGachaCard.card.race}</p>
                    </div>
                  )}
                  {selectedGachaCard.card.attribute && (
                    <div>
                      <p className="text-sm text-slate-400">Attribute</p>
                      <p className="text-slate-100 font-semibold">{selectedGachaCard.card.attribute}</p>
                    </div>
                  )}
                  {selectedGachaCard.card.level !== undefined && (
                    <div>
                      <p className="text-sm text-slate-400">Level/Rank</p>
                      <p className="text-slate-100 font-semibold">{selectedGachaCard.card.level}</p>
                    </div>
                  )}
                  {selectedGachaCard.card.atk !== undefined && (
                    <div className="flex gap-4">
                      <div>
                        <p className="text-sm text-slate-400">ATK</p>
                        <p className="text-slate-100 font-semibold">{selectedGachaCard.card.atk}</p>
                      </div>
                      {selectedGachaCard.card.def !== undefined && (
                        <div>
                          <p className="text-sm text-slate-400">DEF</p>
                          <p className="text-slate-100 font-semibold">{selectedGachaCard.card.def}</p>
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-slate-400">Pull Rarity</p>
                    <p className={`font-bold bg-gradient-to-r ${getRarityColor(selectedGachaCard.rarity)} bg-clip-text text-transparent`}>
                      {selectedGachaCard.rarity}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-2">Description</p>
                <p className="text-slate-200 leading-relaxed bg-slate-800 p-3 rounded-lg border border-slate-700">
                  {selectedGachaCard.card.desc}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// User Banlist Tab - View the official banlist
function UserBanlistTab() {
  const [banlist, setBanlist] = useState<Record<string, BannedCard>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<BanStatus | "all">("all");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadBanlist();
  }, []);

  async function loadBanlist() {
    try {
      setIsLoading(true);
      const orm = BanlistORM.getInstance();
      const data = await orm.getBanlist();
      setBanlist(data);
    } catch (err) {
      console.error("Failed to load banlist", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function exportToEdoPro() {
    try {
      setIsExporting(true);
      
      // Get all banned cards
      const bannedEntries = Object.entries(banlist).filter(([_, data]) => 
        data.banStatus !== "unlimited"
      );
      
      if (bannedEntries.length === 0) {
        alert("No banned cards to export");
        return;
      }

      // Fetch card IDs from YGOProDeck API
      const cardData: Record<string, number> = {};
      
      // Process in batches to avoid rate limiting
      const batchSize = 20;
      for (let i = 0; i < bannedEntries.length; i += batchSize) {
        const batch = bannedEntries.slice(i, i + batchSize);
        const promises = batch.map(async ([name]) => {
          try {
            const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(name)}`);
            if (response.ok) {
              const json = await response.json();
              if (json.data && json.data[0]) {
                cardData[name] = json.data[0].id;
              }
            }
          } catch (err) {
            console.warn(`Failed to fetch ID for ${name}`, err);
          }
        });
        await Promise.all(promises);
        
        // Small delay between batches
        if (i + batchSize < bannedEntries.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Generate EdoPro format
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '.');
      let content = `#[Ryunix Format]\n`;
      content += `!${date} Ryunix Format Banlist\n`;
      
      // Map ban status to EdoPro limit values
      const getLimitValue = (status: BanStatus): number => {
        switch (status) {
          case "forbidden": return 0;
          case "limited": return 1;
          case "semi-limited": return 2;
          default: return 3;
        }
      };

      // Add cards to banlist
      for (const [name, data] of bannedEntries) {
        const cardId = cardData[name];
        if (cardId) {
          const limit = getLimitValue(data.banStatus);
          content += `${cardId} ${limit} --${name}\n`;
        }
      }

      // Create and download file
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ryunix_format_${date}.lflist.conf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const missingCards = bannedEntries.length - Object.keys(cardData).length;
      if (missingCards > 0) {
        alert(`Export complete! Note: ${missingCards} card(s) couldn't be found in the database and were skipped.`);
      }
    } catch (err) {
      console.error("Export failed", err);
      alert("Failed to export banlist. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  const bannedCards = Object.entries(banlist).map(([name, data]) => ({
    name,
    status: data.banStatus,
    lastUpdated: data.lastUpdated
  }));

  const filteredCards = bannedCards.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || card.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: BanStatus) => {
    switch (status) {
      case "forbidden": return "bg-red-500/20 text-red-400 border-red-500";
      case "limited": return "bg-yellow-500/20 text-yellow-400 border-yellow-500";
      case "semi-limited": return "bg-blue-500/20 text-blue-400 border-blue-500";
      default: return "bg-slate-500/20 text-slate-400 border-slate-500";
    }
  };

  const getStatusLabel = (status: BanStatus) => {
    switch (status) {
      case "forbidden": return "Forbidden";
      case "limited": return "Limited";
      case "semi-limited": return "Semi-Limited";
      default: return "Unlimited";
    }
  };

  const getStatusCount = (status: BanStatus) => 
    bannedCards.filter(card => card.status === status).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="size-3 rounded-full bg-amber-500 animate-bounce" />
          <p className="text-slate-400">Loading banlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
            Official Banlist
          </CardTitle>
          <CardDescription className="text-center text-slate-400">
            View all banned, limited, and semi-limited cards
          </CardDescription>
          <div className="flex justify-center pt-4">
            <Button
              onClick={exportToEdoPro}
              disabled={isExporting || Object.keys(banlist).length === 0}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
            >
              <Download className="size-4 mr-2" />
              {isExporting ? "Exporting..." : "Export to EdoPro"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-red-950/30 border border-red-500/30 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-red-400">{getStatusCount("forbidden")}</div>
              <div className="text-sm text-slate-400">Forbidden</div>
            </div>
            <div className="bg-yellow-950/30 border border-yellow-500/30 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-yellow-400">{getStatusCount("limited")}</div>
              <div className="text-sm text-slate-400">Limited</div>
            </div>
            <div className="bg-blue-950/30 border border-blue-500/30 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-400">{getStatusCount("semi-limited")}</div>
              <div className="text-sm text-slate-400">Semi-Limited</div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
              <Input
                placeholder="Search cards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-slate-100"
              />
            </div>
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as BanStatus | "all")}>
              <SelectTrigger className="w-full sm:w-48 bg-slate-700 border-slate-600 text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="forbidden">Forbidden</SelectItem>
                <SelectItem value="limited">Limited</SelectItem>
                <SelectItem value="semi-limited">Semi-Limited</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cards List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredCards.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                {searchQuery || filterStatus !== "all" ? "No cards match your filters" : "No banned cards yet"}
              </div>
            ) : (
              filteredCards.map(card => (
                <div
                  key={card.name}
                  className="flex items-center gap-4 p-4 bg-slate-700/50 border border-slate-600 rounded-lg hover:border-amber-500/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium text-slate-100">{card.name}</div>
                    <div className="text-xs text-slate-500">
                      Last updated: {new Date(card.lastUpdated).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(card.status)} border px-3 py-1`}>
                    {getStatusLabel(card.status)}
                  </Badge>
                </div>
              ))
            )}
          </div>

          <div className="text-xs text-slate-500 text-center">
            Showing {filteredCards.length} of {bannedCards.length} cards
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
