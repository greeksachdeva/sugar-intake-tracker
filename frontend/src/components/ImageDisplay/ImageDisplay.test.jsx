import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImageDisplay from './ImageDisplay.jsx';

describe('ImageDisplay', () => {
  const sampleImages = [
    { url: 'https://example.com/image1.jpg', alt: 'Healthy food' },
    { url: 'https://example.com/image2.jpg', alt: 'Fresh fruits' },
    { url: 'https://example.com/image3.jpg', alt: 'Vegetables' },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders an image when images are provided', () => {
    // Use a single image to avoid randomness
    const images = [{ url: 'https://example.com/pic.jpg', alt: 'Test image' }];
    render(<ImageDisplay images={images} />);

    const img = screen.getByTestId('display-image');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/pic.jpg');
    expect(img).toHaveAttribute('alt', 'Test image');
  });

  it('shows loading state initially before image loads', () => {
    const images = [{ url: 'https://example.com/pic.jpg', alt: 'Test image' }];
    render(<ImageDisplay images={images} />);

    expect(screen.getByTestId('image-loading')).toBeInTheDocument();
    expect(screen.getByText('Loading image…')).toBeInTheDocument();

    // Image should be hidden while loading
    const img = screen.getByTestId('display-image');
    expect(img).toHaveStyle({ display: 'none' });
  });

  it('hides loading state after image loads successfully', async () => {
    const images = [{ url: 'https://example.com/pic.jpg', alt: 'Test image' }];
    render(<ImageDisplay images={images} />);

    // Initially loading
    expect(screen.getByTestId('image-loading')).toBeInTheDocument();

    // Simulate image load
    const img = screen.getByTestId('display-image');
    fireEvent.load(img);

    // Loading should be gone
    await waitFor(() => {
      expect(screen.queryByTestId('image-loading')).not.toBeInTheDocument();
    });

    // Image should be visible (no display:none)
    expect(img).not.toHaveStyle({ display: 'none' });
  });

  it('returns null when images array is empty', () => {
    const { container } = render(<ImageDisplay images={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('returns null when images prop is undefined', () => {
    const { container } = render(<ImageDisplay />);
    expect(container.innerHTML).toBe('');
  });

  it('handles image load error gracefully', async () => {
    const images = [{ url: 'https://example.com/broken.jpg', alt: 'Broken' }];
    render(<ImageDisplay images={images} />);

    // Simulate image error
    const img = screen.getByTestId('display-image');
    fireEvent.error(img);

    // Should show error fallback
    await waitFor(() => {
      expect(screen.getByTestId('image-error')).toBeInTheDocument();
    });
    expect(screen.getByText('Unable to load image')).toBeInTheDocument();

    // Image element should no longer be present
    expect(screen.queryByTestId('display-image')).not.toBeInTheDocument();
  });

  it('selects from provided images', () => {
    // Seed Math.random to get a predictable result
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    render(<ImageDisplay images={sampleImages} />);

    const img = screen.getByTestId('display-image');
    // Math.floor(0.5 * 3) = 1, so index 1
    expect(img).toHaveAttribute('src', sampleImages[1].url);
    expect(img).toHaveAttribute('alt', sampleImages[1].alt);
  });

  it('renders the image-display container', () => {
    const images = [{ url: 'https://example.com/pic.jpg', alt: 'Test' }];
    render(<ImageDisplay images={images} />);

    expect(screen.getByTestId('image-display')).toBeInTheDocument();
  });
});
