export interface CameraSettings {
  aperture?: string;
  shutter?: string;
  iso?: number;
}

export interface Camera {
  make?: string;
  model?: string;
  lens?: string;
  film?: string;
  settings?: CameraSettings;
}

export interface Location {
  city?: string;
  country?: string;
}

export interface PhotoMetadata {
  title: string;
  slug?: string;
  date: string;
  description?: string;
  tags?: string[];
  camera?: Camera;
  location?: Location;
}

export interface Photo {
  slug: string;
  filename: string;
  metadata: PhotoMetadata;
  images: {
    thumbnail: {
      jpg: string;
      webp: string;
    };
    medium: {
      jpg: string;
      webp: string;
    };
    original: string;
  };
}

export interface GridThumbnailStyle {
  mode: "square" | "original";
  width: number;
  height?: number;
}
