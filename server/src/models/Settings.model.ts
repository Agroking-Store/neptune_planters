import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  logoImg: string;
  planterImg: string;
  hideDefaultPlanter: boolean;
  companyName: string;
  addressLine1: string;
  addressLine2: string;
  phone: string;
  email: string;
  gstNo: string;
  bankName: string;
  accountName: string;
  accountNo: string;
  ifscCode: string;
  branch: string;
  upiId: string;
  preparedBy: string;
  signatureText: string;
  footerMobile: string;
  footerInstagram: string;
  footerWebsite: string;
  footerLocation: string;
}

const settingsSchema = new Schema<ISettings>(
  {
    logoImg: { type: String, default: '' },
    planterImg: { type: String, default: '' },
    hideDefaultPlanter: { type: Boolean, default: false },
    companyName: { type: String, default: 'Neptune Planters' },
    addressLine1: { type: String, default: 'Sr No 34/1, Holkarwadi,' },
    addressLine2: { type: String, default: 'Handewadi, Pune-412308' },
    phone: { type: String, default: '+91 97652 76111' },
    email: { type: String, default: 'connect@shopneptune.in' },
    gstNo: { type: String, default: '' },
    bankName: { type: String, default: 'Punjab National Bank' },
    accountName: { type: String, default: 'Neptune Inovations' },
    accountNo: { type: String, default: '1475202100000767' },
    ifscCode: { type: String, default: 'PUNB0147520' },
    branch: { type: String, default: 'Market Yard, Pune' },
    upiId: { type: String, default: 'neptuneinnovations@ibl' },
    preparedBy: { type: String, default: 'Neptune Planters' },
    signatureText: { type: String, default: 'Sumo' },
    footerMobile: { type: String, default: '+91 97652 76111' },
    footerInstagram: { type: String, default: 'neptuneplanters' },
    footerWebsite: { type: String, default: 'www.shopneptune.in' },
    footerLocation: { type: String, default: 'Sr No 34/1, Holkarwadi, Handewadi, Pune-412308' },
  },
  { timestamps: true }
);

export const Settings = mongoose.model<ISettings>('Settings', settingsSchema);
