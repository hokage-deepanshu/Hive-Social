import React from 'react';

// Default images
const DEFAULT_AVATAR = '/images/default-avatar.png';
const DEFAULT_POST_IMAGE = '/images/default-post.jpg';
const LOGO_IMAGE = '/images/hive-logo.png';

// Fallback URLs in case local images aren't available
const FALLBACK_AVATAR = 'https://i.imgur.com/HeIi0wU.png';
const FALLBACK_POST_IMAGE = 'https://i.imgur.com/KLa9yCl.jpg';
const FALLBACK_LOGO = 'https://i.imgur.com/Px3GXPI.png';

/**
 * Component for rendering an avatar with fallback
 */
export const Avatar = ({ username, size = 'md', className = '' }) => {
  // Generate initials from username
  const initials = username ? username.charAt(0).toUpperCase() : '?';
  
  // Determine size class
  const sizeClass = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
  }[size] || 'w-10 h-10 text-sm';
  
  return (
    <div 
      className={`${sizeClass} bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold ${className}`}
      title={username}
    >
      {initials}
    </div>
  );
};

/**
 * Component for rendering an image with fallback
 */
export const ImageWithFallback = ({ 
  src, 
  alt, 
  fallbackSrc, 
  className = '',
  ...props 
}) => {
  const [error, setError] = React.useState(false);
  
  const handleError = () => {
    setError(true);
  };
  
  return (
    <img
      src={error ? fallbackSrc : src}
      alt={alt}
      onError={handleError}
      className={className}
      {...props}
    />
  );
};

/**
 * Component for rendering the app logo
 */
export const Logo = ({ size = 'md', className = '' }) => {
  // Determine size class
  const sizeClass = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }[size] || 'h-8 w-8';
  
  return (
    <ImageWithFallback
      src={LOGO_IMAGE}
      fallbackSrc={FALLBACK_LOGO}
      alt="Hive Social Logo"
      className={`${sizeClass} ${className}`}
    />
  );
};

/**
 * Get profile image URL for a Hive user
 */
export const getProfileImageUrl = (username) => {
  if (!username) return DEFAULT_AVATAR;
  
  // Try to get profile image from Hive
  return `https://images.hive.blog/u/${username}/avatar`;
};

/**
 * Get a post image URL from post content or metadata
 */
export const getPostImageUrl = (post) => {
  if (!post) return DEFAULT_POST_IMAGE;
  
  try {
    // Try to extract image from post metadata
    const metadata = JSON.parse(post.json_metadata || '{}');
    
    // Check for image in metadata
    if (metadata.image && metadata.image.length > 0) {
      return metadata.image[0];
    }
    
    // Check for thumbnail in metadata
    if (metadata.thumbnail) {
      return metadata.thumbnail;
    }
    
    // Try to extract first image from post body
    const imageRegex = /!\[.*?\]\((.*?)\)/;
    const match = post.body.match(imageRegex);
    if (match && match[1]) {
      return match[1];
    }
    
    // No image found
    return DEFAULT_POST_IMAGE;
  } catch (e) {
    return DEFAULT_POST_IMAGE;
  }
};

export default {
  Avatar,
  ImageWithFallback,
  Logo,
  getProfileImageUrl,
  getPostImageUrl,
  DEFAULT_AVATAR,
  DEFAULT_POST_IMAGE,
  LOGO_IMAGE,
  FALLBACK_AVATAR,
  FALLBACK_POST_IMAGE,
  FALLBACK_LOGO
}; 