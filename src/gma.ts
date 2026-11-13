// Im Browser gibt es kein AdMob (die App nutzt gma.native.ts)
export const loadGma = async (): Promise<typeof import('react-native-google-mobile-ads') | null> => null;
