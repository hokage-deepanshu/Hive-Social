import axios from 'axios';

/**
 * Utility functions for handling media uploads
 */

// IPFS gateway URLs
const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/'
];

/**
 * Upload a file to IPFS via Pinata or similar service
 * Note: In a production app, you would use your own API keys
 * and potentially handle uploads through your backend
 */
export const uploadToIPFS = async (file) => {
  try {
    // For demo purposes, we'll simulate an upload
    // In a real app, you would use a service like Pinata, Infura, or your own IPFS node
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Create a mock IPFS hash based on file properties
    const mockHash = `Qm${btoa(file.name + file.size + Date.now()).substring(0, 44)}`;
    
    return {
      success: true,
      hash: mockHash,
      url: `${IPFS_GATEWAYS[0]}${mockHash}`,
      gateways: IPFS_GATEWAYS.map(gateway => `${gateway}${mockHash}`)
    };
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload file'
    };
  }
};

/**
 * Upload a file to a traditional file hosting service
 * This is a fallback for when IPFS is not available
 */
export const uploadToTraditionalService = async (file) => {
  try {
    // For demo purposes, we'll simulate an upload
    // In a real app, you would use a service like AWS S3, Cloudinary, etc.
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create a mock URL
    const mockUrl = `https://hivesocial.example/uploads/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    
    return {
      success: true,
      url: mockUrl
    };
  } catch (error) {
    console.error('Error uploading to traditional service:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload file'
    };
  }
};

/**
 * Validate file before upload
 */
export const validateFile = (file, options = {}) => {
  const {
    maxSizeMB = 10,
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'audio/mpeg']
  } = options;
  
  // Check file size
  if (file.size > maxSizeMB * 1024 * 1024) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`
    };
  }
  
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not supported. Allowed types: ${allowedTypes.join(', ')}`
    };
  }
  
  return { valid: true };
};

/**
 * Get file preview URL
 */
export const getFilePreviewUrl = (file) => {
  return URL.createObjectURL(file);
};

/**
 * Upload media and return the URL
 * This is the main function that should be used by components
 */
export const uploadMedia = async (file, options = {}) => {
  // Validate file
  const validation = validateFile(file, options);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error
    };
  }
  
  // Try IPFS first
  const ipfsResult = await uploadToIPFS(file);
  if (ipfsResult.success) {
    return ipfsResult;
  }
  
  // Fall back to traditional service
  return await uploadToTraditionalService(file);
};

export default {
  uploadMedia,
  validateFile,
  getFilePreviewUrl
}; 