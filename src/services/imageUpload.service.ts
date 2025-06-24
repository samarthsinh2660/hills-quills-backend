import { v2 as cloudinary } from 'cloudinary';
import { CLOUDINARY_URL } from '../config/env.ts';

// Extract Cloudinary credentials from CLOUDINARY_URL
// Format: cloudinary://api_key:api_secret@cloud_name
const extractCredentials = (cloudinaryUrl: string) => {
  try {
    // Remove cloudinary:// prefix
    const url = cloudinaryUrl.replace('cloudinary://', '');
    
    // Split at @ to get credentials and cloud name
    const [credentials, cloudName] = url.split('@');
    
    // Split credentials to get api_key and api_secret
    const [apiKey, apiSecret] = credentials.split(':');
    
    return { apiKey, apiSecret, cloudName };
  } catch (error) {
    throw new Error('Invalid Cloudinary URL format');
  }
};

const { apiKey, apiSecret, cloudName } = extractCredentials(CLOUDINARY_URL!);

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true
});

export default cloudinary;