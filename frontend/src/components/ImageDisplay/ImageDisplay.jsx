import { useState, useEffect, useCallback } from 'react';
import styles from './ImageDisplay.module.css';

/**
 * ImageDisplay component – displays a random background/side image
 * from the provided images array.
 *
 * Props:
 *  - images {Array} Array of image objects with { url, alt } fields
 */
export default function ImageDisplay({ images = [] }) {
  const [currentImage, setCurrentImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const selectRandomImage = useCallback(() => {
    if (!images || images.length === 0) {
      setCurrentImage(null);
      setLoading(false);
      return;
    }
    const index = Math.floor(Math.random() * images.length);
    setCurrentImage(images[index]);
    setLoading(true);
    setError(false);
  }, [images]);

  useEffect(() => {
    selectRandomImage();
  }, [selectRandomImage]);

  function handleImageLoad() {
    setLoading(false);
    setError(false);
  }

  function handleImageError() {
    setLoading(false);
    setError(true);
  }

  if (!images || images.length === 0) {
    return null;
  }

  if (error) {
    return (
      <div className={styles.imageDisplay} data-testid="image-display">
        <div className={styles.error} data-testid="image-error">
          Unable to load image
        </div>
      </div>
    );
  }

  return (
    <div className={styles.imageDisplay} data-testid="image-display">
      {loading && (
        <div className={styles.loading} data-testid="image-loading">
          Loading image…
        </div>
      )}
      {currentImage && (
        <img
          className={styles.image}
          src={currentImage.url}
          alt={currentImage.alt}
          loading="lazy"
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={loading ? { display: 'none' } : undefined}
          data-testid="display-image"
        />
      )}
    </div>
  );
}
