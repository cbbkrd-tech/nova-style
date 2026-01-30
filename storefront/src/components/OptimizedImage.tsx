import { useRef, useEffect, useState } from 'react';
import { getOptimizedImageUrl } from '../lib/imageUtils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  /** Width for server-side resize (Supabase transformation) */
  width?: number;
  /** Height for server-side resize (Supabase transformation) */
  height?: number;
  /** Image quality 1-100, default 80 */
  quality?: number;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  containerClassName = '',
  width,
  height,
  quality = 80,
}) => {
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Apply Supabase image transformation if dimensions are provided
  const optimizedSrc = width
    ? getOptimizedImageUrl(src, width, height, quality)
    : src;

  return (
    <div ref={imgRef} className={`overflow-hidden ${containerClassName}`}>
      {isInView && (
        <img
          src={optimizedSrc}
          alt={alt}
          className={className}
        />
      )}
    </div>
  );
};

export default OptimizedImage;
