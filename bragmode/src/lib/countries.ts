import { supabaseAdmin } from './supabase';

export interface Country {
  id: string;
  name: string;
  flag: string;
  max_founders: number;
  claimed_founders: number;
}

export const DEFAULT_COUNTRIES = [
  { name: 'Argentina', flag: '🇦🇷', max_founders: 1000 },
  { name: 'Brazil', flag: '🇧🇷', max_founders: 1000 },
  { name: 'France', flag: '🇫🇷', max_founders: 1000 },
  { name: 'Germany', flag: '🇩🇪', max_founders: 1000 },
  { name: 'Spain', flag: '🇪🇸', max_founders: 1000 },
  { name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', max_founders: 1000 },
  { name: 'Italy', flag: '🇮🇹', max_founders: 1000 },
  { name: 'Portugal', flag: '🇵🇹', max_founders: 1000 },
  { name: 'Netherlands', flag: '🇳🇱', max_founders: 1000 },
  { name: 'Belgium', flag: '🇧🇪', max_founders: 1000 },
  { name: 'Croatia', flag: '🇭🇷', max_founders: 1000 },
  { name: 'Uruguay', flag: '🇺🇾', max_founders: 1000 },
  { name: 'United States', flag: '🇺🇸', max_founders: 1000 },
  { name: 'Mexico', flag: '🇲🇽', max_founders: 1000 },
  { name: 'Canada', flag: '🇨🇦', max_founders: 1000 },
  { name: 'Japan', flag: '🇯🇵', max_founders: 1000 },
  { name: 'Morocco', flag: '🇲🇦', max_founders: 1000 },
  { name: 'South Korea', flag: '🇰🇷', max_founders: 1000 },
  { name: 'Colombia', flag: '🇨🇴', max_founders: 1000 },
  { name: 'Senegal', flag: '🇸🇳', max_founders: 1000 },
  { name: 'Australia', flag: '🇦🇺', max_founders: 1000 },
  { name: 'Saudi Arabia', flag: '🇸🇦', max_founders: 1000 },
  { name: 'Iran', flag: '🇮🇷', max_founders: 1000 },
  { name: 'Nigeria', flag: '🇳🇬', max_founders: 1000 },
  { name: 'Egypt', flag: '🇪🇬', max_founders: 1000 },
  { name: 'Ivory Coast', flag: '🇨🇮', max_founders: 1000 },
  { name: 'Algeria', flag: '🇩🇿', max_founders: 1000 },
  { name: 'Norway', flag: '🇳🇴', max_founders: 1000 },
  { name: 'Sweden', flag: '🇸🇪', max_founders: 1000 },
  { name: 'Switzerland', flag: '🇨🇭', max_founders: 1000 },
  { name: 'Denmark', flag: '🇩🇰', max_founders: 1000 },
  { name: 'Türkiye', flag: '🇹🇷', max_founders: 1000 },
  { name: 'Austria', flag: '🇦🇹', max_founders: 1000 },
  { name: 'Ecuador', flag: '🇪🇨', max_founders: 1000 },
  { name: 'Chile', flag: '🇨🇱', max_founders: 1000 },
  { name: 'Peru', flag: '🇵🇪', max_founders: 1000 },
  { name: 'Panama', flag: '🇵🇦', max_founders: 1000 },
  { name: 'Jamaica', flag: '🇯🇲', max_founders: 1000 },
  { name: 'Haiti', flag: '🇭🇹', max_founders: 1000 },
  { name: 'South Africa', flag: '🇿🇦', max_founders: 1000 },
  { name: 'Qatar', flag: '🇶🇦', max_founders: 1000 },
  { name: 'Jordan', flag: '🇯🇴', max_founders: 1000 },
  { name: 'Cape Verde', flag: '🇨🇻', max_founders: 1000 },
  { name: 'Curaçao', flag: '🇨🇼', max_founders: 1000 },
  { name: 'Uzbekistan', flag: '🇺🇿', max_founders: 1000 },
];

export function getCountryFlagUrl(name: string): string {
  const mapping: Record<string, string> = {
    'Argentina': 'ar',
    'Brazil': 'br',
    'France': 'fr',
    'Germany': 'de',
    'Spain': 'es',
    'England': 'gb-eng',
    'Italy': 'it',
    'Portugal': 'pt',
    'Netherlands': 'nl',
    'Belgium': 'be',
    'Croatia': 'hr',
    'Uruguay': 'uy',
    'United States': 'us',
    'Mexico': 'mx',
    'Canada': 'ca',
    'Japan': 'jp',
    'Morocco': 'ma',
    'South Korea': 'kr',
    'Colombia': 'co',
    'Senegal': 'sn',
    'Australia': 'au',
    'Saudi Arabia': 'sa',
    'Iran': 'ir',
    'Nigeria': 'ng',
    'Egypt': 'eg',
    'Ivory Coast': 'ci',
    'Algeria': 'dz',
    'Norway': 'no',
    'Sweden': 'se',
    'Switzerland': 'ch',
    'Denmark': 'dk',
    'Türkiye': 'tr',
    'Austria': 'at',
    'Ecuador': 'ec',
    'Chile': 'cl',
    'Peru': 'pe',
    'Panama': 'pa',
    'Jamaica': 'jm',
    'Haiti': 'ht',
    'South Africa': 'za',
    'Qatar': 'qa',
    'Jordan': 'jo',
    'Cape Verde': 'cv',
    'Curaçao': 'cw',
    'Uzbekistan': 'uz'
  };
  const code = mapping[name] || 'us';
  return `https://flagcdn.com/w320/${code.toLowerCase()}.png`;
}

export async function getOrSeedCountries(): Promise<Country[]> {
  try {
    const { data: existing, error: selectError } = await supabaseAdmin
      .from('countries')
      .select('*')
      .order('name', { ascending: true });

    if (selectError) {
      console.error('Error fetching countries:', selectError);
      return [];
    }

    if (existing && existing.length > 0) {
      return existing as Country[];
    }

    // Seed countries if empty
    console.log('No countries found in db, seeding initial country list...');
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('countries')
      .insert(DEFAULT_COUNTRIES)
      .select('*')
      .order('name', { ascending: true });

    if (insertError) {
      console.error('Error seeding countries:', insertError);
      return [];
    }

    return (inserted || []) as Country[];
  } catch (err) {
    console.error('Failed to seed/fetch countries:', err);
    return [];
  }
}
