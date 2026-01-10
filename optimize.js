const sharp = require("sharp");
const fs = require("fs").promises;
const path = require("path");

// Configuration
const config = {
  quality: 75,
  inputDir: "./assets/images",
  outputDir: "./assets/images-optimized",
};

// Tailles pour chaque type
const sizes = {
  slider: [
    { width: 1243, suffix: "-small" },
    { width: 1865, suffix: "-medium" },
    { width: 2758, suffix: "-large" },
  ],
  gallery: [
    { width: 400, suffix: "-small" },
    { width: 600, suffix: "-medium" },
    { width: 800, suffix: "-large" },
  ],
  team: [
    { width: 334, suffix: "-small" },
    { width: 501, suffix: "-medium" },
    { width: 668, suffix: "-large" },
  ],
};

// Créer la structure de sortie
async function createOutputStructure() {
  await fs.mkdir(config.outputDir, { recursive: true });
  await fs.mkdir(path.join(config.outputDir, "slider"), { recursive: true });
  await fs.mkdir(path.join(config.outputDir, "gallery"), { recursive: true });
  await fs.mkdir(path.join(config.outputDir, "gallery", "concerts"), {
    recursive: true,
  });
  await fs.mkdir(path.join(config.outputDir, "gallery", "mariage"), {
    recursive: true,
  });
  await fs.mkdir(path.join(config.outputDir, "gallery", "entreprise"), {
    recursive: true,
  });
  await fs.mkdir(path.join(config.outputDir, "gallery", "portraits"), {
    recursive: true,
  });
  console.log("✓ Dossiers créés");
}

// Optimiser une image
async function optimizeImage(inputPath, outputDir, filename, sizeProfile) {
  const baseName = path.basename(filename, path.extname(filename));

  try {
    const metadata = await sharp(inputPath).metadata();
    const originalStats = await fs.stat(inputPath);
    const originalSizeKB = (originalStats.size / 1024).toFixed(1);

    console.log(
      `\n📸 ${filename} (${metadata.width}x${metadata.height}, ${originalSizeKB} KiB)`
    );

    let totalSaved = 0;

    for (const size of sizeProfile) {
      const outputFilename = `${baseName}${size.suffix}.webp`;
      const outputPath = path.join(outputDir, outputFilename);

      const height = Math.round(
        (size.width / metadata.width) * metadata.height
      );

      await sharp(inputPath)
        .resize(size.width, height, { fit: "cover", position: "center" })
        .webp({ quality: config.quality })
        .toFile(outputPath);

      const stats = await fs.stat(outputPath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      const saved = originalStats.size - stats.size;
      totalSaved += saved;

      console.log(`  ✓ ${outputFilename} → ${sizeKB} KiB`);
    }

    const savedKB = (totalSaved / 1024).toFixed(1);
    console.log(`  💾 Économie: ${savedKB} KiB`);

    return totalSaved;
  } catch (error) {
    console.error(`❌ Erreur ${filename}:`, error.message);
    return 0;
  }
}

// Traiter un dossier
async function processFolder(folderPath, outputPath, sizeProfile) {
  try {
    const files = await fs.readdir(folderPath);
    const imageFiles = files.filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f));

    let totalSaved = 0;
    for (const file of imageFiles) {
      const inputPath = path.join(folderPath, file);
      const saved = await optimizeImage(
        inputPath,
        outputPath,
        file,
        sizeProfile
      );
      totalSaved += saved;
    }

    return totalSaved;
  } catch (error) {
    console.error(`Erreur dossier ${folderPath}:`, error.message);
    return 0;
  }
}

// Script principal
async function main() {
  console.log("🚀 OPTIMISATION DES IMAGES");
  console.log("═".repeat(50));

  await createOutputStructure();

  let totalSaved = 0;

  // SLIDER
  console.log("\n🎠 IMAGES SLIDER");
  console.log("━".repeat(50));
  const sliderSaved = await processFolder(
    path.join(config.inputDir, "slider"),
    path.join(config.outputDir, "slider"),
    sizes.slider
  );
  totalSaved += sliderSaved;

  // GALERIE
  console.log("\n🖼️  IMAGES GALERIE");
  console.log("━".repeat(50));

  const galleryFolders = ["concerts", "mariage", "entreprise", "portraits"];
  for (const folder of galleryFolders) {
    console.log(`\n📁 ${folder.toUpperCase()}`);
    const saved = await processFolder(
      path.join(config.inputDir, "gallery", folder),
      path.join(config.outputDir, "gallery", folder),
      sizes.gallery
    );
    totalSaved += saved;
  }

  // NINA
  console.log("\n👤 IMAGE NINA");
  console.log("━".repeat(50));
  const ninaSaved = await optimizeImage(
    path.join(config.inputDir, "nina.webp"),
    config.outputDir,
    "nina.webp",
    sizes.team
  );
  totalSaved += ninaSaved;

  // RÉSUMÉ
  const totalSavedKB = (totalSaved / 1024).toFixed(1);
  console.log("\n\n✅ OPTIMISATION TERMINÉE");
  console.log("═".repeat(50));
  console.log(`💾 Économie totale: ${totalSavedKB} KiB`);
  console.log(`📁 Dossier: ${config.outputDir}`);
  console.log("\n✨ Toutes les images optimisées sont prêtes !\n");
}

main().catch(console.error);
