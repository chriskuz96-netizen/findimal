import { useI18n } from './i18n';
import type { BadgeId } from './progress';
import { useNeutralSeasons } from './zone';

// Name und Hinweis eines Abzeichens. Jahreszeiten-Abzeichen heißen in den Tropen und auf der Südhalbkugel
// nach Monaten („Forscher März–Mai“), weil dort „Frühling“ nicht passt.
const SEASON_BADGES: BadgeId[] = ['spring10', 'summer10', 'autumn10', 'winter10'];

export function useBadgeText(): { name: (id: BadgeId) => string; hint: (id: BadgeId) => string } {
  const { t } = useI18n();
  const neutral = useNeutralSeasons();
  const key = (id: BadgeId) => (neutral && SEASON_BADGES.includes(id) ? `badge.${id}.n` : `badge.${id}`);
  return {
    name: (id) => t(key(id) as 'badge.first'),
    hint: (id) => t(`${key(id)}.hint` as 'badge.first.hint'),
  };
}
