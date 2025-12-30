export type BanStatus = 'forbidden' | 'limited' | 'semi-limited' | 'unlimited';

export interface BannedCard {
  cardName: string;
  banStatus: BanStatus;
  lastUpdated: string;
  source: 'tcg' | 'manual'; // tcg = from API, manual = admin override
}

export const BAN_STATUS_INFO = {
  forbidden: { copies: 0, label: 'Forbidden', color: 'red' },
  limited: { copies: 1, label: 'Limited', color: 'red' },
  'semi-limited': { copies: 2, label: 'Semi-Limited', color: 'red' },
  unlimited: { copies: 3, label: 'Unlimited', color: 'green' },
};

// Helper function to get ban status from card name
export function getBanStatus(cardName: string, banlist: Record<string, BannedCard>): BanStatus {
  return banlist[cardName]?.banStatus || 'unlimited';
}

// Helper function to check if card is banned
export function isBanned(cardName: string, banlist: Record<string, BannedCard>): boolean {
  const status = getBanStatus(cardName, banlist);
  return status === 'forbidden';
}

// Helper function to get allowed copies
export function getAllowedCopies(cardName: string, banlist: Record<string, BannedCard>): number {
  const status = getBanStatus(cardName, banlist);
  return BAN_STATUS_INFO[status].copies;
}
