// src/app/shared/pipes/thumbnail.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'thumbnail',
  standalone: true
})
export class ThumbnailPipe implements PipeTransform {
  transform(thumbnail: { path: string, extension: string } | undefined): string {
    if (!thumbnail || !thumbnail.path || !thumbnail.extension) {
      return 'assets/images/image-not-available.jpg';
    }

    // Fix for HTTP URLs in Marvel API
    const path = thumbnail.path.replace('http://', 'https://');

    // Check for "image_not_available" in path
    if (path.includes('image_not_available')) {
      return 'assets/images/image-not-available.jpg';
    }

    return `${path}/standard_xlarge.${thumbnail.extension}`;
  }
}
