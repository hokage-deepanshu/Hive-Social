import { useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook for implementing infinite scrolling
 * @param {Function} callback - Function to call when bottom is reached
 * @param {boolean} hasMore - Whether there are more items to load
 * @param {Object} options - Additional options
 * @returns {Array} - Array containing the ref to attach to the last element
 */
const useInfiniteScroll = (callback, hasMore, options = {}) => {
  const {
    threshold = 100, // px from bottom to trigger load
    rootMargin = '20px',
    root = null,
  } = options;

  const observer = useRef();
  
  // This function will be attached to the last element
  const lastElementRef = useCallback(node => {
    // If we're already loading more items, don't observe
    if (!callback) return;
    
    // Disconnect previous observer if it exists
    if (observer.current) observer.current.disconnect();
    
    // Create new IntersectionObserver
    observer.current = new IntersectionObserver(entries => {
      // If the last element is visible and we have more items
      if (entries[0].isIntersecting && hasMore) {
        callback();
      }
    }, {
      root,
      rootMargin,
      threshold: 0.1,
    });
    
    // Observe the new last element if it exists
    if (node) observer.current.observe(node);
  }, [callback, hasMore, root, rootMargin]);

  // Alternative implementation using scroll event for browsers without IntersectionObserver
  useEffect(() => {
    // Skip if IntersectionObserver is being used or if we don't have more items
    if (window.IntersectionObserver || !hasMore || !callback) return;
    
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const clientHeight = document.documentElement.clientHeight;
      
      // If we're close to the bottom and have more items
      if (scrollHeight - scrollTop - clientHeight < threshold) {
        callback();
      }
    };
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    
    // Clean up
    return () => window.removeEventListener('scroll', handleScroll);
  }, [callback, hasMore, threshold]);

  return [lastElementRef];
};

export default useInfiniteScroll; 