import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Package, Plus, Edit3, Trash2, Eye, EyeOff, Image as ImageIcon } from "lucide-react";
import { GachaPackORM, type GachaPackModel } from "@/sdk/database/orm/orm_gacha_pack";
import { ARCHETYPE_DECKS } from "@/data/yugioh-catalog";

export function GachaPacksManageTab() {
  const [packs, setPacks] = useState<GachaPackModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPack, setEditingPack] = useState<GachaPackModel | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPackType, setFormPackType] = useState<'standard' | 'premium'>('standard');
  const [formSingleCost, setFormSingleCost] = useState("4");
  const [formMultiCost, setFormMultiCost] = useState("90");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formCardsArchetypes, setFormCardsArchetypes] = useState<string>("");
  const [artworkOffsetY, setArtworkOffsetY] = useState(0);
  const [artworkOffsetX, setArtworkOffsetX] = useState(0);
  const [artworkZoom, setArtworkZoom] = useState(1);

  useEffect(() => {
    loadPacks();
  }, []);

  async function loadPacks() {
    try {
      setLoading(true);
      const orm = GachaPackORM.getInstance();
      const loadedPacks = await orm.getAllPacks();
      setPacks(loadedPacks);
      setError("");
    } catch (err) {
      console.error('Failed to load gacha packs:', err);
      setError("Failed to load gacha packs");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormName("");
    setFormDescription("");
    setFormPackType('standard');
    setFormSingleCost("4");
    setFormMultiCost("90");
    setFormImageUrl("");
    setFormCardsArchetypes("");
    setArtworkOffsetY(0);
    setArtworkOffsetX(0);
    setArtworkZoom(1);
    setEditingPack(null);
  }

  function handleEdit(pack: GachaPackModel) {
    setFormName(pack.name);
    setFormDescription(pack.description);
    setFormPackType(pack.pack_type);
    setFormSingleCost(String(pack.single_cost));
    setFormMultiCost(String(pack.multi_cost));
    setFormImageUrl(pack.image_url);
    setFormCardsArchetypes(pack.cards_archetypes.join('\n'));
    setEditingPack(pack);
    setShowCreateDialog(true);
  }

  async function handleSubmit() {
    setError("");
    setSuccess("");

    if (!formName.trim()) {
      setError("Pack name is required");
      return;
    }

    const singleCost = parseInt(formSingleCost);
    const multiCost = parseInt(formMultiCost);

    if (isNaN(singleCost) || singleCost < 0) {
      setError("Valid single cost required");
      return;
    }

    if (isNaN(multiCost) || multiCost < 0) {
      setError("Valid multi cost required");
      return;
    }

    const cardsArchetypes = formCardsArchetypes
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    try {
      const orm = GachaPackORM.getInstance();

      if (editingPack) {
        // Update existing pack
        await orm.updatePack(editingPack.id, {
          name: formName.trim(),
          description: formDescription.trim(),
          pack_type: formPackType,
          single_cost: singleCost,
          multi_cost: multiCost,
          image_url: formImageUrl.trim(),
          cards_archetypes: cardsArchetypes,
        });
        setSuccess(`Pack "${formName}" updated successfully!`);
      } else {
        // Create new pack
        await orm.createPack({
          name: formName.trim(),
          description: formDescription.trim(),
          pack_type: formPackType,
          single_cost: singleCost,
          multi_cost: multiCost,
          image_url: formImageUrl.trim(),
          cards_archetypes: cardsArchetypes,
          is_active: true,
        });
        setSuccess(`Pack "${formName}" created successfully!`);
      }

      setShowCreateDialog(false);
      resetForm();
      await loadPacks();
    } catch (err) {
      console.error('Failed to save pack:', err);
      setError(`Failed to ${editingPack ? 'update' : 'create'} pack`);
    }
  }

  async function handleDelete(pack: GachaPackModel) {
    if (!confirm(`Are you sure you want to delete "${pack.name}"?`)) return;

    try {
      const orm = GachaPackORM.getInstance();
      await orm.deletePack(pack.id);
      setSuccess(`Pack "${pack.name}" deleted successfully!`);
      await loadPacks();
    } catch (err) {
      console.error('Failed to delete pack:', err);
      setError("Failed to delete pack");
    }
  }

  async function handleToggleActive(pack: GachaPackModel) {
    try {
      const orm = GachaPackORM.getInstance();
      await orm.togglePackActive(pack.id);
      setSuccess(`Pack "${pack.name}" ${pack.is_active ? 'deactivated' : 'activated'}!`);
      await loadPacks();
    } catch (err) {
      console.error('Failed to toggle pack:', err);
      setError("Failed to toggle pack status");
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border border-rose-700 bg-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-rose-400">Manage Gacha Packs</CardTitle>
              <CardDescription className="text-slate-400 mt-2">
                Create and manage custom gacha packs for players
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setShowCreateDialog(true);
              }}
              className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold"
            >
              <Plus className="size-4 mr-2" />
              Create Pack
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert className="bg-red-950/30 border-red-500/50">
              <AlertDescription className="text-red-400">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-950/30 border-green-500/50">
              <AlertDescription className="text-green-400">{success}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-12 text-rose-400 animate-pulse">Loading packs...</div>
          ) : packs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Package className="size-16 mx-auto mb-4 opacity-50" />
              <p>No gacha packs created yet. Click "Create Pack" to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {packs.map(pack => (
                <Card key={pack.id} className={`border-2 ${pack.is_active ? 'border-green-700' : 'border-slate-700'} bg-slate-900`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-amber-400 flex items-center gap-2">
                          {pack.name}
                          <Badge variant={pack.pack_type === 'premium' ? 'default' : 'secondary'} className={pack.pack_type === 'premium' ? 'bg-red-600' : 'bg-gray-600'}>
                            {pack.pack_type}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="text-slate-400 text-sm mt-1">
                          {pack.description}
                        </CardDescription>
                      </div>
                    </div>

                    {pack.image_url && (
                      <div className="mt-3 relative w-full h-32 bg-slate-800 rounded border border-slate-700 overflow-hidden">
                        <img src={pack.image_url} alt={pack.name} className="w-full h-full object-contain" />
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Single:</span>
                        <span className="text-amber-300 font-bold">{pack.single_cost} coins</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Box (24):</span>
                        <span className="text-amber-300 font-bold">{pack.multi_cost} coins</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Cards/Archetypes:</span>
                        <span className="text-slate-300">{pack.cards_archetypes.length}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(pack)}
                        className={`flex-1 ${pack.is_active ? 'border-green-700 text-green-400 hover:bg-green-950/30' : 'border-slate-700 text-slate-400'}`}
                      >
                        {pack.is_active ? <Eye className="size-3 mr-1" /> : <EyeOff className="size-3 mr-1" />}
                        {pack.is_active ? 'Active' : 'Inactive'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(pack)}
                        className="border-slate-700 text-slate-300 hover:bg-slate-800"
                      >
                        <Edit3 className="size-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(pack)}
                        className="border-red-700 text-red-400 hover:bg-red-950/30"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-rose-700">
          <DialogHeader>
            <DialogTitle className="text-rose-400">
              {editingPack ? `Edit Pack: ${editingPack.name}` : 'Create New Gacha Pack'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Configure pack details, pricing, and card pool
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pack-name" className="text-slate-300">Pack Name</Label>
              <Input
                id="pack-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Legendary Collection Pack"
                className="bg-slate-800 border-slate-700 text-slate-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pack-desc" className="text-slate-300">Description</Label>
              <Textarea
                id="pack-desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Describe what's special about this pack..."
                className="bg-slate-800 border-slate-700 text-slate-200"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pack-type" className="text-slate-300">Pack Type</Label>
                <Select value={formPackType} onValueChange={(value: 'standard' | 'premium') => setFormPackType(value)}>
                  <SelectTrigger id="pack-type" className="bg-slate-800 border-slate-700 text-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="standard">Standard (Gray Center)</SelectItem>
                    <SelectItem value="premium">Premium (Red Center)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image-url" className="text-slate-300 flex items-center gap-2">
                  <ImageIcon className="size-4" />
                  Pack Image URL
                </Label>
                <Input
                  id="image-url"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://example.com/pack.png"
                  className="bg-slate-800 border-slate-700 text-slate-200"
                />
              </div>
            </div>

            {formImageUrl && (
              <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 space-y-4">
                <p className="text-sm text-slate-400 mb-2">Pack Preview with Template:</p>
                <div className="relative w-full h-64 bg-slate-900 rounded overflow-hidden">
                  {/* Background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${formPackType === 'premium' ? 'from-red-950/50 via-slate-900 to-red-950/50' : 'from-gray-800/50 via-slate-900 to-gray-800/50'}`} />
                  
                  {/* Center glow */}
                  <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 ${formPackType === 'premium' ? 'bg-red-600' : 'bg-gray-500'} rounded-full opacity-50 blur-2xl z-0`} />
                  
                  {/* Artwork container - HARD CLIPPED to 500px width */}
                  <div className="absolute inset-0 flex items-center justify-center z-[1]">
                    <div className="relative overflow-hidden" style={{ width: '500px', height: '840px' }}>
                      <div className="absolute inset-0 flex items-center justify-center" style={{ transform: `translate(${artworkOffsetX}px, ${artworkOffsetY}px) scale(${artworkZoom})` }}>
                        <img src={formImageUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Template overlay */}
                  <div className="absolute inset-0 p-2 flex items-center justify-center z-[2]">
                    <img src="/Booster Pack.png" alt="Template" className="max-w-full max-h-full object-contain" />
                  </div>
                  
                  {/* Pack type badge */}
                  <div className={`absolute top-2 right-2 ${formPackType === 'premium' ? 'bg-red-600' : 'bg-gray-600'} px-3 py-1 rounded text-white font-bold text-xs z-20`}>
                    {formPackType === 'premium' ? 'PREMIUM PACK' : 'STANDARD PACK'}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Vertical Position</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setArtworkOffsetY(Math.max(-40, artworkOffsetY - 5))}
                        className="border-slate-700 text-slate-300"
                      >
                        Up
                      </Button>
                      <span className="text-slate-400 text-sm flex-1 text-center">{artworkOffsetY}px</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setArtworkOffsetY(Math.min(40, artworkOffsetY + 5))}
                        className="border-slate-700 text-slate-300"
                      >
                        Down
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-slate-300">Horizontal Position</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setArtworkOffsetX(Math.max(-40, artworkOffsetX - 5))}
                        className="border-slate-700 text-slate-300"
                      >
                        Left
                      </Button>
                      <span className="text-slate-400 text-sm flex-1 text-center">{artworkOffsetX}px</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setArtworkOffsetX(Math.min(40, artworkOffsetX + 5))}
                        className="border-slate-700 text-slate-300"
                      >
                        Right
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-slate-300">Zoom</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setArtworkZoom(Math.max(0.5, artworkZoom - 0.1))}
                        className="border-slate-700 text-slate-300"
                      >
                        Zoom Out
                      </Button>
                      <span className="text-slate-400 text-sm flex-1 text-center">{(artworkZoom * 100).toFixed(0)}%</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setArtworkZoom(Math.min(2, artworkZoom + 0.1))}
                        className="border-slate-700 text-slate-300"
                      >
                        Zoom In
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="single-cost" className="text-slate-300">Single Pack Cost (9 cards)</Label>
                <Input
                  id="single-cost"
                  type="number"
                  value={formSingleCost}
                  onChange={(e) => setFormSingleCost(e.target.value)}
                  placeholder="4"
                  className="bg-slate-800 border-slate-700 text-slate-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="multi-cost" className="text-slate-300">Box Cost (24 packs, 216 cards)</Label>
                <Input
                  id="multi-cost"
                  type="number"
                  value={formMultiCost}
                  onChange={(e) => setFormMultiCost(e.target.value)}
                  placeholder="90"
                  className="bg-slate-800 border-slate-700 text-slate-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cards-archetypes" className="text-slate-300">
                Cards/Archetypes (one per line)
              </Label>
              <Textarea
                id="cards-archetypes"
                value={formCardsArchetypes}
                onChange={(e) => setFormCardsArchetypes(e.target.value)}
                placeholder="Enter card names or archetype names, one per line:&#10;Blue-Eyes White Dragon&#10;Dark Magician&#10;Drytron&#10;Cyber Dragon"
                className="bg-slate-800 border-slate-700 text-slate-200 font-mono text-sm"
                rows={8}
              />
              <p className="text-xs text-slate-500">
                Enter card names for specific cards, or archetype names to pull from entire archetypes.
                {ARCHETYPE_DECKS.length} archetypes available.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                resetForm();
              }}
              className="border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold"
            >
              {editingPack ? 'Update Pack' : 'Create Pack'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
