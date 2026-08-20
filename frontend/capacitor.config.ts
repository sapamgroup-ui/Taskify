import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alltasker.taskify',
  appName: 'Taskify',
  webDir: 'dist',
  server: {
    url: 'https://taskify-uum5.vercel.app',
    cleartext: true,
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
};

export default config;
