import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { BanIndicator, BanBadge } from '@/components/BanIndicator';
import { Trash2, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { BanlistORM } from '@/sdk/database/orm/orm_banlist';
import type { BannedCard, BanStatus } from '@/data/banlist';
import { BAN_STATUS_INFO } from '@/data/banlist';
import { ARCHETYPE_DECKS, STAPLE_CARDS } from '@/data/yugioh-catalog';

interface EditingCard {
  cardName: string;
  banStatus: BanStatus;
}

interface BanlistManageTabProps {
  onBanlistChange?: () => void;
}

export function BanlistManageTab({ onBanlistChange }: BanlistManageTabProps) {
  const [banlist, setBanlist] = useState<Record<string, BannedCard>>({});
  const [filteredCards, setFilteredCards] = useState<BannedCard[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | BanStatus>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<EditingCard>({ cardName: '', banStatus: 'forbidden' });
  const [availableCards, setAvailableCards] = useState<string[]>([]);

  // Load banlist on mount
  useEffect(() => {
    loadBanlist();
  }, []);

  // Filter banlist when search or filter changes
  useEffect(() => {
    let filtered = Object.values(banlist);

    if (filterStatus !== 'all') {
      filtered = filtered.filter((card) => card.banStatus === filterStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter((card) => card.cardName.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    setFilteredCards(filtered);
  }, [banlist, searchTerm, filterStatus]);

  // Update available cards (not already banned)
  useEffect(() => {
    const allCards = [
      ...ARCHETYPE_DECKS.map((d) => d.name),
      ...STAPLE_CARDS.map((s) => s.name),
    ];
    const bannedNames = Object.keys(banlist);
    const available = allCards.filter((name) => !bannedNames.includes(name)).sort();
    setAvailableCards(available);
  }, [banlist]);

  async function loadBanlist() {
    try {
      setIsLoading(true);
      setError('');
      const orm = BanlistORM.getInstance();
      const data = await orm.getBanlist();
      setBanlist(data);
    } catch (err) {
      setError('Failed to load banlist');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddCard() {
    if (!editingCard.cardName) {
      setError('Please select a card');
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      const orm = BanlistORM.getInstance();
      await orm.setBanStatus(editingCard.cardName, editingCard.banStatus, 'manual');

      // Reload banlist
      await loadBanlist();
      setSuccessMessage(`Added ${editingCard.cardName} as ${editingCard.banStatus}`);
      setIsAddDialogOpen(false);
      setEditingCard({ cardName: '', banStatus: 'forbidden' });

      // Notify parent component
      onBanlistChange?.();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to add card to banlist');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdateCard(cardName: string, newStatus: BanStatus) {
    try {
      setIsSaving(true);
      setError('');
      const orm = BanlistORM.getInstance();
      await orm.setBanStatus(cardName, newStatus, 'manual');

      // Reload banlist
      await loadBanlist();
      setSuccessMessage(`Updated ${cardName} to ${newStatus}`);

      // Notify parent component
      onBanlistChange?.();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to update card');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemoveCard(cardName: string) {
    try {
      setIsSaving(true);
      setError('');
      const orm = BanlistORM.getInstance();
      await orm.unbanCard(cardName);

      // Reload banlist
      await loadBanlist();
      setSuccessMessage(`Removed ${cardName} from banlist`);
      
      // Notify parent component
      onBanlistChange?.();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to remove card');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleFetchTCGBanlist() {
    try {
      setIsSaving(true);
      setError('');
      setSuccessMessage('Fetching TCG banlist...');
      
      const response = await fetch('/api/fetch-banlist', { method: 'POST' });
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        throw new Error(data.error || data.details || `HTTP ${response.status}`);
      }
      
      const data = await response.json();

      // Reload banlist
      await loadBanlist();
      setSuccessMessage(`✅ Fetched and updated TCG banlist (${data.cardsUpdated} cards)`);

      // Notify parent component
      onBanlistChange?.();

      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`❌ Failed to fetch TCG banlist: ${errorMsg}`);
      console.error('Full error:', err);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-rose-700/50 bg-gradient-to-r from-slate-900 to-slate-800">
        <CardHeader>
          <CardTitle className="text-2xl text-rose-400">Banlist Management</CardTitle>
          <CardDescription>Manage TCG banlist - Forbidden, Limited, and Semi-Limited cards</CardDescription>
        </CardHeader>
      </Card>

      {/* Messages */}
      {error && (
        <Alert variant="destructive" className="bg-red-950 border-red-600">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-200">{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="bg-green-950 border-green-600">
          <AlertDescription className="text-green-200">{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-3">
          <Button
            onClick={handleFetchTCGBanlist}
            disabled={isSaving || isLoading}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold"
          >
            <RefreshCw className="size-4 mr-2" />
            Fetch TCG Banlist
          </Button>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            disabled={isSaving || isLoading}
            className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold"
          >
            <Plus className="size-4 mr-2" />
            Add Card
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-3 flex-col md:flex-row">
          <Input
            placeholder="Search cards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500"
          />
          <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
            <SelectTrigger className="w-full md:w-48 bg-slate-700 border-slate-600 text-slate-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="forbidden">Forbidden</SelectItem>
              <SelectItem value="limited">Limited</SelectItem>
              <SelectItem value="semi-limited">Semi-Limited</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Banlist Table */}
      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle>Banned Cards ({filteredCards.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500" />
            </div>
          ) : filteredCards.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No banned cards found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-slate-700/50">
                    <TableHead className="text-slate-300">Card Name</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Source</TableHead>
                    <TableHead className="text-slate-300">Last Updated</TableHead>
                    <TableHead className="text-right text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCards.map((card) => (
                    <TableRow key={card.cardName} className="border-slate-700 hover:bg-slate-700/50 transition-colors">
                      <TableCell className="text-slate-100 font-medium flex items-center gap-3">
                        <BanIndicator banStatus={card.banStatus} size="sm" />
                        {card.cardName}
                      </TableCell>
                      <TableCell>
                        <BanBadge banStatus={card.banStatus} />
                      </TableCell>
                      <TableCell>
                        <Badge variant={card.source === 'tcg' ? 'default' : 'secondary'} className="capitalize">
                          {card.source}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm">
                        {new Date(card.lastUpdated).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Select
                          value={card.banStatus}
                          onValueChange={(newStatus: BanStatus) => handleUpdateCard(card.cardName, newStatus)}
                          disabled={isSaving}
                        >
                          <SelectTrigger className="w-32 h-8 text-xs bg-slate-700 border-slate-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="forbidden">Forbidden</SelectItem>
                            <SelectItem value="limited">Limited (1)</SelectItem>
                            <SelectItem value="semi-limited">Semi-Limited (2)</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveCard(card.cardName)}
                          disabled={isSaving}
                          className="h-8"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Card Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle>Add Card to Banlist</DialogTitle>
            <DialogDescription>Select a card and choose its ban status</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Card Name</label>
              <Select value={editingCard.cardName} onValueChange={(value) => setEditingCard({ ...editingCard, cardName: value })}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-slate-100">
                  <SelectValue placeholder="Select a card..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                  {availableCards.map((card) => (
                    <SelectItem key={card} value={card}>
                      {card}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Ban Status</label>
              <Select value={editingCard.banStatus} onValueChange={(value: BanStatus) => setEditingCard({ ...editingCard, banStatus: value })}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="forbidden">🚫 Forbidden</SelectItem>
                  <SelectItem value="limited">🔴 Limited (1 copy)</SelectItem>
                  <SelectItem value="semi-limited">🟠 Semi-Limited (2 copies)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCard} disabled={isSaving || !editingCard.cardName} className="bg-rose-600 hover:bg-rose-700">
              Add to Banlist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
