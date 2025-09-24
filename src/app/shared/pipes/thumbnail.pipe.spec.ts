// src/app/shared/pipes/thumbnail.pipe.spec.ts
import { ThumbnailPipe } from './thumbnail.pipe';

describe('ThumbnailPipe', () => {
  let pipe: ThumbnailPipe;

  beforeEach(() => {
    pipe = new ThumbnailPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return fallback image when thumbnail is undefined', () => {
    expect(pipe.transform(undefined)).toBe('assets/images/image-not-available.jpg');
  });

  it('should return fallback image when thumbnail path is missing', () => {
    const thumbnail = { extension: 'jpg' } as any;
    expect(pipe.transform(thumbnail)).toBe('assets/images/image-not-available.jpg');
  });

  it('should return fallback image when thumbnail extension is missing', () => {
    const thumbnail = { path: 'http://example.com/image' } as any;
    expect(pipe.transform(thumbnail)).toBe('assets/images/image-not-available.jpg');
  });

  it('should return fallback image when path contains "image_not_available"', () => {
    const thumbnail = {
      path: 'http://example.com/image_not_available',
      extension: 'jpg'
    };
    expect(pipe.transform(thumbnail)).toBe('assets/images/image-not-available.jpg');
  });

  it('should replace http with https in the path', () => {
    const thumbnail = {
      path: 'http://example.com/image',
      extension: 'jpg'
    };
    expect(pipe.transform(thumbnail)).toBe('https://example.com/image/standard_xlarge.jpg');
  });

  it('should return correct URL format with https path', () => {
    const thumbnail = {
      path: 'https://example.com/image',
      extension: 'png'
    };
    expect(pipe.transform(thumbnail)).toBe('https://example.com/image/standard_xlarge.png');
  });

  it('should handle thumbnail with unusual extension', () => {
    const thumbnail = {
      path: 'https://example.com/image',
      extension: 'webp'
    };
    expect(pipe.transform(thumbnail)).toBe('https://example.com/image/standard_xlarge.webp');
  });
});
