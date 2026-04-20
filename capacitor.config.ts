import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shadowhunt.app',
  appName: 'Shadow Hunt',
  webDir: 'dist',
  android: { allowMixedContent: false },
  server: { androidScheme: 'https' },
};

export default config;
