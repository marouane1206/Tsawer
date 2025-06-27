import { Platform } from 'react-native';

export const API_CONFIG = {
  BASE_URL: Platform.OS === 'web' 
    ? 'https://8000-is98bpn4yuwi26bbdcsa8-9b375261.manusvm.computer'
    : 'http://10.0.2.2:8000',
  TIMEOUT: 30000,
};