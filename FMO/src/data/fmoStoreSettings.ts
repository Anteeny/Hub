import { StoreSettings } from '../lib/types';

export const FMO_STORE_SETTINGS: StoreSettings = {
  storeName: 'FMO (For Men Only)',
  tagline: 'No 1 Suit Store in Enugu • Delivering Class & Culture',
  address: 'Hilmak Place Plaza Plot C, 1A Pocket Layout',
  landmark: 'Trans-Ekulu by Bilante Flyover',
  city: 'Enugu',
  state: 'Enugu State',
  phone: '+234 701 813 5116',
  instagram: '@FMO.NG',
  bankName: 'Zenith Bank PLC',
  accountNumber: '1018944521',
  accountName: 'FMO LUXURY MENSWEAR LIMITED',
  vatEnabled: true,
  vatRate: 0.075, // 7.5% Nigerian VAT
  enableDrawerShifts: true, // Z-Report / Till drawer shifts toggleable in store settings
  openingHours: {
    weekdays: '08:00 AM – 05:30 PM (Mon – Fri)',
    saturday: '08:00 AM – 05:00 PM',
    sunday: 'Closed (By Exclusive Appointment)'
  }
};
