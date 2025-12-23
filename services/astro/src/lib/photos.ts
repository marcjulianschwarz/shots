import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import type { Photo, PhotoMetadata } from "./types";

// Root directory is two levels up from this file
const ROOT_DIR = path.join(process.cwd(), "../..");
const PHOTOS_DIR = path.join(ROOT_DIR, "source/photos");

/**
 * Get slug from filename
 */
function getSlugFromFilename(filename: string): string {
  return path.basename(filename, path.extname(filename));
}

/**
 * Load metadata from YAML file
 */
function loadMetadata(yamlPath: string, filename: string): PhotoMetadata {
  if (!fs.existsSync(yamlPath)) {
    // Return minimal metadata if YAML doesn't exist
    return {
      title: getSlugFromFilename(filename),
      slug: getSlugFromFilename(filename),
      date: new Date().toISOString().split("T")[0],
    };
  }

  const yamlContent = fs.readFileSync(yamlPath, "utf8");
  const metadata = yaml.load(yamlContent) as PhotoMetadata;

  // Ensure slug exists
  if (!metadata.slug) {
    metadata.slug = getSlugFromFilename(filename);
  }

  return metadata;
}

/**
 * Get all photos with their metadata
 */
export function getAllPhotos(): Photo[] {
  if (!fs.existsSync(PHOTOS_DIR)) {
    console.warn(`Photos directory not found: ${PHOTOS_DIR}`);
    return [];
  }

  const files = fs.readdirSync(PHOTOS_DIR);
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif"];

  const photos: Photo[] = files
    .filter((file) =>
      imageExtensions.includes(path.extname(file).toLowerCase()),
    )
    .map((filename) => {
      const baseName = getSlugFromFilename(filename);
      const yamlPath = path.join(PHOTOS_DIR, `${baseName}.yaml`);
      const metadata = loadMetadata(yamlPath, filename);
      const slug = metadata.slug || baseName;

      return {
        slug,
        filename,
        metadata,
        images: {
          thumbnail: {
            jpg: `/assets/images/${slug}/thumbnail.jpg`,
            webp: `/assets/images/${slug}/thumbnail.webp`,
          },
          medium: {
            jpg: `/assets/images/${slug}/medium.jpg`,
            webp: `/assets/images/${slug}/medium.webp`,
          },
          original: `/assets/images/${slug}/original.jpg`,
        },
      };
    });

  // Sort by date (newest first)
  return photos.sort((a, b) => {
    const dateA = new Date(a.metadata.date).getTime();
    const dateB = new Date(b.metadata.date).getTime();
    return dateB - dateA;
  });
}

/**
 * Get a single photo by slug
 */
export function getPhotoBySlug(slug: string): Photo | undefined {
  const photos = getAllPhotos();
  return photos.find((photo) => photo.slug === slug);
}

/**
 * Get all unique tags
 */
export function getAllTags(): Map<string, number> {
  const photos = getAllPhotos();
  const tagCounts = new Map<string, number>();

  photos.forEach((photo) => {
    if (photo.metadata.tags) {
      photo.metadata.tags.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    }
  });

  return tagCounts;
}

/**
 * Get photos by tag
 */
export function getPhotosByTag(tag: string): Photo[] {
  const photos = getAllPhotos();
  return photos.filter((photo) => photo.metadata.tags?.includes(tag));
}

/**
 * Get recent photos (for homepage)
 */
export function getRecentPhotos(limit: number = 30): Photo[] {
  const photos = getAllPhotos();
  return photos.slice(0, limit);
}
