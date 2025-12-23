import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import yaml from "js-yaml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  sourceDir: path.join(__dirname, "../../../source/photos"),
  outputDir: path.join(__dirname, "../public/assets/images"),
  thumbnailWidth: 400,
  mediumWidth: 1200,
  originalMaxWidth: 2400,
  jpegQuality: 90,
  webpQuality: 85,
  gridStyle: "original", // 'square' or 'original'
};

/**
 * Check if image has already been processed
 */
async function isAlreadyProcessed(outputPath) {
  try {
    // Check if all required output files exist
    const requiredFiles = [
      "thumbnail.jpg",
      "thumbnail.webp",
      "medium.jpg",
      "medium.webp",
      "original.jpg",
    ];

    for (const file of requiredFiles) {
      await fs.access(path.join(outputPath, file));
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Process a single image - generate thumbnail, medium, and optimized original
 */
async function processImage(imagePath, slug, force = false) {
  const outputPath = path.join(CONFIG.outputDir, slug);

  // Check if already processed (skip unless forced)
  if (!force && (await isAlreadyProcessed(outputPath))) {
    console.log(`⊘ Skipping ${slug} (already processed)`);
    return;
  }

  // Create output directory
  await fs.mkdir(outputPath, { recursive: true });

  // Load image
  const image = sharp(imagePath);
  const metadata = await image.metadata();

  console.log(`Processing ${slug}...`);

  // Generate thumbnail (original aspect ratio)
  const thumbnailWidth = CONFIG.thumbnailWidth;
  let thumbnailHeight;

  if (CONFIG.gridStyle === "square") {
    // Square crop
    thumbnailHeight = CONFIG.thumbnailWidth;
    await image
      .clone()
      .resize(thumbnailWidth, thumbnailHeight, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: CONFIG.jpegQuality })
      .toFile(path.join(outputPath, "thumbnail.jpg"));

    await image
      .clone()
      .resize(thumbnailWidth, thumbnailHeight, {
        fit: "cover",
        position: "center",
      })
      .webp({ quality: CONFIG.webpQuality })
      .toFile(path.join(outputPath, "thumbnail.webp"));
  } else {
    // Original aspect ratio
    await image
      .clone()
      .resize(thumbnailWidth, null, { withoutEnlargement: true })
      .jpeg({ quality: CONFIG.jpegQuality })
      .toFile(path.join(outputPath, "thumbnail.jpg"));

    await image
      .clone()
      .resize(thumbnailWidth, null, { withoutEnlargement: true })
      .webp({ quality: CONFIG.webpQuality })
      .toFile(path.join(outputPath, "thumbnail.webp"));
  }

  // Generate medium size
  await image
    .clone()
    .resize(CONFIG.mediumWidth, null, { withoutEnlargement: true })
    .jpeg({ quality: CONFIG.jpegQuality })
    .toFile(path.join(outputPath, "medium.jpg"));

  await image
    .clone()
    .resize(CONFIG.mediumWidth, null, { withoutEnlargement: true })
    .webp({ quality: CONFIG.webpQuality })
    .toFile(path.join(outputPath, "medium.webp"));

  // Generate optimized original
  await image
    .clone()
    .resize(CONFIG.originalMaxWidth, null, { withoutEnlargement: true })
    .jpeg({ quality: CONFIG.jpegQuality })
    .toFile(path.join(outputPath, "original.jpg"));

  console.log(`✓ Processed ${slug}`);
}

/**
 * Get slug from filename
 */
function getSlugFromFilename(filename) {
  return path.basename(filename, path.extname(filename));
}

/**
 * Load YAML metadata to get custom slug
 */
async function getSlugFromYaml(imageFile) {
  const baseName = getSlugFromFilename(imageFile);
  const yamlPath = path.join(CONFIG.sourceDir, `${baseName}.yaml`);

  try {
    const yamlContent = await fs.readFile(yamlPath, "utf8");
    const metadata = yaml.load(yamlContent);
    return metadata.slug || baseName;
  } catch (error) {
    // If YAML doesn't exist or can't be read, use filename
    return baseName;
  }
}

/**
 * Process all images in source directory
 */
async function processAllImages() {
  console.log("Starting image processing...\n");

  try {
    // Read source directory
    const files = await fs.readdir(CONFIG.sourceDir);

    // Filter image files
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif"];
    const imageFiles = files.filter((file) =>
      imageExtensions.includes(path.extname(file).toLowerCase()),
    );

    if (imageFiles.length === 0) {
      console.log("No images found in source/photos/");
      return;
    }

    console.log(`Found ${imageFiles.length} images\n`);

    // Process each image
    for (const imageFile of imageFiles) {
      const imagePath = path.join(CONFIG.sourceDir, imageFile);
      const slug = await getSlugFromYaml(imageFile);

      try {
        await processImage(imagePath, slug);
      } catch (error) {
        console.error(`Error processing ${imageFile}:`, error.message);
      }
    }

    console.log("\n✓ All images processed successfully!");
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  processAllImages();
}

export { processImage, processAllImages, CONFIG };
