#!/usr/bin/env node

/**
 * curate-images.mjs — Automated image quality assessment for site generation
 *
 * Uses Sharp to analyse images and rate them into tiers:
 *   A: Hero-worthy (high res, sharp, high entropy)
 *   B: Section-ready (good quality)
 *   C: Marginal (usable if needed)
 *   D: Rejected (below minimum thresholds)
 *
 * Usage:
 *   node scripts/curate-images.mjs
 *   node scripts/curate-images.mjs --input ./my-images
 *   node scripts/curate-images.mjs --output ./curated
 *   node scripts/curate-images.mjs --thresholds ./custom-thresholds.json
 *
 * Output:
 *   - image-curation-report.md (structured report for Claude to read)
 *   - Copies A+B rated images to public/uploads/
 */

import { existsSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import { writeFile, readFile } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
import { parseArgs } from 'node:util';

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------
// These are starting guesses and NEED CALIBRATION against real client images.
// Run against Bracken and Harry B image sets, compare ratings with human
// intuition, and adjust. The entropy values in particular depend heavily on
// image content type — outdoor/landscape images tend to have higher entropy
// than studio portraits or product shots.
//
// Override defaults by passing --thresholds path/to/thresholds.json
// ---------------------------------------------------------------------------
const DEFAULT_THRESHOLDS = {
  hero: { minWidth: 1200, minSharpness: 0.8, minEntropy: 6.0 },
  section: { minWidth: 800, minSharpness: 0.6, minEntropy: 5.0 },
  minimum: { minWidth: 600, minSharpness: 0.4, minEntropy: 4.0 },
};

const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------
const { values: args } = parseArgs({
  options: {
    input: { type: 'string', default: 'raw-images' },
    output: { type: 'string', default: 'public/uploads' },
    thresholds: { type: 'string' },
    report: { type: 'string', default: 'image-curation-report.md' },
    help: { type: 'boolean', short: 'h', default: false },
  },
  strict: true,
});

if (args.help) {
  console.log(`
Usage: node scripts/curate-images.mjs [options]

Options:
  --input <dir>         Input directory (default: raw-images/)
  --output <dir>        Output directory for selected images (default: public/uploads/)
  --thresholds <file>   JSON file with custom thresholds
  --report <file>       Output report path (default: image-curation-report.md)
  -h, --help            Show this help
`);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Sharp availability check
// ---------------------------------------------------------------------------
let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error(
    'Error: Sharp is not installed.\n\n' +
    'Sharp is required for image analysis. Install it with:\n\n' +
    '  npm install sharp\n\n' +
    'Sharp is typically already available in Next.js projects.'
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Load thresholds
// ---------------------------------------------------------------------------
let thresholds = { ...DEFAULT_THRESHOLDS };

if (args.thresholds) {
  try {
    const custom = JSON.parse(await readFile(args.thresholds, 'utf-8'));
    thresholds = { ...thresholds, ...custom };
    console.log(`Loaded custom thresholds from ${args.thresholds}`);
  } catch (err) {
    console.error(`Failed to load thresholds from ${args.thresholds}: ${err.message}`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Check input directory
// ---------------------------------------------------------------------------
const inputDir = args.input;

if (!existsSync(inputDir)) {
  console.log(`No images directory found at "${inputDir}". Skipping curation.`);
  process.exit(0);
}

const allFiles = readdirSync(inputDir);
const imageFiles = allFiles.filter(f => SUPPORTED_EXTENSIONS.has(extname(f).toLowerCase()));

if (imageFiles.length === 0) {
  console.log(`No image files found in "${inputDir}". Skipping curation.`);
  process.exit(0);
}

console.log(`Found ${imageFiles.length} image(s) in ${inputDir}\n`);

// ---------------------------------------------------------------------------
// Analyse each image
// ---------------------------------------------------------------------------

/**
 * Calculate a sharpness estimate using the Laplacian method.
 * Sharp's stats() gives per-channel entropy but not a direct sharpness metric,
 * so we convolve with a Laplacian kernel and measure the standard deviation
 * of the result — higher std dev = sharper image.
 *
 * Returns a normalised 0-1 score (clamped).
 */
async function estimateSharpness(filePath) {
  // Laplacian 3x3 kernel for edge detection
  const laplacian = sharp(filePath)
    .greyscale()
    .resize(800, null, { withoutEnlargement: true }) // normalise size for consistent scoring
    .convolve({
      width: 3,
      height: 3,
      kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0],
    });

  const { channels } = await laplacian.stats();
  // Standard deviation of the Laplacian response — higher = sharper
  const stdDev = channels[0]?.stdev ?? 0;

  // Normalise: typical range is 0-50, map to 0-1
  // These normalisation values need calibration against real images
  return Math.min(stdDev / 50, 1.0);
}

const results = [];

for (const file of imageFiles) {
  const filePath = join(inputDir, file);

  try {
    const image = sharp(filePath);
    const metadata = await image.metadata();
    const stats = await image.stats();

    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;
    const format = metadata.format ?? 'unknown';

    // Average entropy across channels
    const avgEntropy = stats.channels.length > 0
      ? stats.channels.reduce((sum, ch) => sum + ch.entropy, 0) / stats.channels.length
      : 0;

    // Sharpness estimate
    const sharpness = await estimateSharpness(filePath);

    // Rate the image
    let rating;
    let reason;

    if (width < thresholds.minimum.minWidth) {
      rating = 'D';
      reason = `Too small (${width}px wide, minimum ${thresholds.minimum.minWidth}px)`;
    } else if (sharpness < thresholds.minimum.minSharpness) {
      rating = 'D';
      reason = `Too blurry (sharpness ${sharpness.toFixed(2)}, minimum ${thresholds.minimum.minSharpness})`;
    } else if (avgEntropy < thresholds.minimum.minEntropy) {
      rating = 'D';
      reason = `Low detail/entropy (${avgEntropy.toFixed(2)}, minimum ${thresholds.minimum.minEntropy})`;
    } else if (
      width >= thresholds.hero.minWidth &&
      sharpness >= thresholds.hero.minSharpness &&
      avgEntropy >= thresholds.hero.minEntropy
    ) {
      rating = 'A';
      reason = 'Hero-worthy — high resolution, sharp, rich detail';
    } else if (
      width >= thresholds.section.minWidth &&
      sharpness >= thresholds.section.minSharpness &&
      avgEntropy >= thresholds.section.minEntropy
    ) {
      rating = 'B';
      reason = 'Section-ready — good quality';
    } else {
      rating = 'C';
      reason = 'Marginal — usable if needed';
    }

    results.push({
      file,
      width,
      height,
      format,
      sharpness,
      entropy: avgEntropy,
      rating,
      reason,
    });

    const icon = { A: '★', B: '●', C: '○', D: '✕' }[rating];
    console.log(`  ${icon} [${rating}] ${file} — ${width}x${height} — ${reason}`);
  } catch (err) {
    console.error(`  ✕ [ERR] ${file} — ${err.message}`);
    results.push({
      file,
      width: 0,
      height: 0,
      format: 'error',
      sharpness: 0,
      entropy: 0,
      rating: 'D',
      reason: `Error: ${err.message}`,
    });
  }
}

// ---------------------------------------------------------------------------
// Generate report
// ---------------------------------------------------------------------------
const counts = { A: 0, B: 0, C: 0, D: 0 };
for (const r of results) counts[r.rating]++;

const selected = results.filter(r => r.rating === 'A' || r.rating === 'B');
const borderline = results.filter(r => r.rating === 'C');
const rejected = results.filter(r => r.rating === 'D');

let report = `# Image Curation Report

**Generated:** ${new Date().toISOString().split('T')[0]}
**Input directory:** ${inputDir}
**Total images assessed:** ${results.length}

## Summary

| Rating | Count | Description |
|--------|-------|-------------|
| A | ${counts.A} | Hero-worthy |
| B | ${counts.B} | Section-ready |
| C | ${counts.C} | Marginal |
| D | ${counts.D} | Rejected |

**Selected for use (A+B):** ${selected.length}
**Copied to:** ${args.output}

## All Images

| Filename | Dimensions | Format | Sharpness | Entropy | Rating | Notes |
|----------|-----------|--------|-----------|---------|--------|-------|
`;

for (const r of results) {
  report += `| ${r.file} | ${r.width}x${r.height} | ${r.format} | ${r.sharpness.toFixed(2)} | ${r.entropy.toFixed(2)} | ${r.rating} | ${r.reason} |\n`;
}

if (borderline.length > 0) {
  report += `\n## Recommended for Claude Review\n\nThese borderline (C-rated) images may be usable depending on context. Claude should view them and decide based on subject matter, aesthetic quality, and whether they fill a gap in section coverage.\n\n`;
  for (const r of borderline) {
    report += `- **${r.file}** (${r.width}x${r.height}) — ${r.reason}\n`;
  }
}

if (rejected.length > 0) {
  report += `\n## Rejected\n\n`;
  for (const r of rejected) {
    report += `- **${r.file}** — ${r.reason}\n`;
  }
}

report += `\n## Thresholds Used\n\n\`\`\`json\n${JSON.stringify(thresholds, null, 2)}\n\`\`\`\n`;

await writeFile(args.report, report, 'utf-8');

// ---------------------------------------------------------------------------
// Optimise and copy selected images
// ---------------------------------------------------------------------------
// Wilding lesson: raw camera images (2400-3200px) bloated deploy from ~5 MB
// to 64.8 MB. Resizing to max 1920px + quality 80 cut 19 MB → 8.5 MB (55%).
// Always optimise on copy — never commit raw camera images.
const MAX_WIDTH = 1920;
const JPEG_QUALITY = 80;

let totalOriginalBytes = 0;
let totalOptimisedBytes = 0;

if (selected.length > 0) {
  if (!existsSync(args.output)) {
    mkdirSync(args.output, { recursive: true });
  }

  for (const r of selected) {
    const src = join(inputDir, r.file);
    const dest = join(args.output, r.file);
    const ext = extname(r.file).toLowerCase();

    try {
      const { size: originalSize } = await import('node:fs').then(fs => fs.statSync(src));
      totalOriginalBytes += originalSize;

      // Optimise: resize if wider than MAX_WIDTH, compress, strip metadata
      const pipeline = sharp(src)
        .resize(MAX_WIDTH, null, { withoutEnlargement: true })
        .withMetadata({ orientation: undefined }); // strip EXIF but apply rotation

      if (ext === '.jpg' || ext === '.jpeg') {
        await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toFile(dest);
      } else if (ext === '.png') {
        await pipeline.png({ compressionLevel: 9 }).toFile(dest);
      } else if (ext === '.webp') {
        await pipeline.webp({ quality: JPEG_QUALITY }).toFile(dest);
      } else {
        // GIF or unsupported — copy as-is
        copyFileSync(src, dest);
      }

      const { size: optimisedSize } = await import('node:fs').then(fs => fs.statSync(dest));
      totalOptimisedBytes += optimisedSize;

      const saved = ((1 - optimisedSize / originalSize) * 100).toFixed(0);
      if (Number(saved) > 5) {
        console.log(`  ↓ ${r.file}: ${(originalSize / 1024).toFixed(0)}KB → ${(optimisedSize / 1024).toFixed(0)}KB (-${saved}%)`);
      }
    } catch (err) {
      // Fallback to plain copy if optimisation fails
      console.warn(`  [warn] Could not optimise ${r.file}: ${err.message} — copying as-is`);
      copyFileSync(src, dest);
    }
  }
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
const savedMB = ((totalOriginalBytes - totalOptimisedBytes) / (1024 * 1024)).toFixed(1);
const savedPct = totalOriginalBytes > 0
  ? ((1 - totalOptimisedBytes / totalOriginalBytes) * 100).toFixed(0)
  : 0;

console.log(`
---
Copied ${selected.length} image(s) to ${args.output}. ${rejected.length} rejected.`);

if (totalOriginalBytes > 0 && totalOriginalBytes !== totalOptimisedBytes) {
  console.log(`Optimised: ${(totalOriginalBytes / (1024 * 1024)).toFixed(1)}MB → ${(totalOptimisedBytes / (1024 * 1024)).toFixed(1)}MB (-${savedPct}%, saved ${savedMB}MB)`);
}

console.log(`See ${args.report} for details.`);

if (borderline.length > 0) {
  console.log(`${borderline.length} borderline image(s) flagged for Claude review.`);
}
