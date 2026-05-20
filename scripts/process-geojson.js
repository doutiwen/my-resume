#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const __dirname = path
  .dirname(new URL(import.meta.url).pathname)
  .replace(/^\/([A-Za-z]):\//, '$1:/');

const sourceDir = path.join(__dirname, '../public/maps/source');
const outputDir = path.join(__dirname, '../public/maps');

function processGeoJSONFiles() {
  try {
    if (!fs.existsSync(sourceDir)) {
      console.error(`Error: 源目录不存在 - ${sourceDir}`);
      process.exit(1);
    }

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const files = fs.readdirSync(sourceDir);
    const geoJsonFiles = files.filter(
      (file) => file.endsWith('.geojson') || file.endsWith('.json')
    );

    if (geoJsonFiles.length === 0) {
      console.log('未找到任何GeoJSON文件');
      return;
    }

    console.log(`找到 ${geoJsonFiles.length} 个GeoJSON文件，开始处理...\n`);

    geoJsonFiles.forEach((file, index) => {
      const inputPath = path.join(sourceDir, file);
      const outputFile = `processed_${file}`;
      const outputPath = path.join(outputDir, outputFile);

      console.log(`[${index + 1}/${geoJsonFiles.length}] 处理: ${file}`);

      try {
        execSync(
          `npx mapshaper "${inputPath}" -simplify 5% weighted keep-shapes -o "${outputPath}" format=geojson`,
          { stdio: ['pipe', 'pipe', 'pipe'] }
        );

        const inputStats = fs.statSync(inputPath);
        const outputStats = fs.statSync(outputPath);
        const reduction = (((inputStats.size - outputStats.size) / inputStats.size) * 100).toFixed(
          1
        );

        console.log(
          `  ✓ 完成: ${(inputStats.size / 1024).toFixed(1)} KB -> ${(outputStats.size / 1024).toFixed(1)} KB (减少 ${reduction}%)\n`
        );
      } catch (error) {
        console.error(`  ✗ 处理失败: ${error.message}\n`);
      }
    });

    console.log('所有文件处理完成！');
  } catch (error) {
    console.error(`处理过程中发生错误: ${error.message}`);
    process.exit(1);
  }
}

processGeoJSONFiles();
