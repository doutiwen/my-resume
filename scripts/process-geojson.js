#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import rewind from '@turf/rewind';

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
      const outputFileBase = `processed_${file}`;
      const outputFileWithoutExt = outputFileBase.replace(/\.(geojson|json)$/i, '');
      const outputPath = path.join(outputDir, outputFileBase);

      console.log(`[${index + 1}/${geoJsonFiles.length}] 处理: ${file}`);

      try {
        const existingOutputFiles = fs
          .readdirSync(outputDir)
          .filter(
            (f) =>
              f.startsWith(outputFileWithoutExt) && (f.endsWith('.geojson') || f.endsWith('.json'))
          );
        existingOutputFiles.forEach((f) => {
          fs.unlinkSync(path.join(outputDir, f));
        });

        console.log('    执行简化处理...');
        const result = execSync(
          `npx mapshaper "${inputPath}" -clean -simplify 5% weighted keep-shapes -o format=geojson precision=0.000001 "${outputPath}"`,
          { stdio: ['pipe', 'pipe', 'pipe'] }
        ).toString();

        const generatedFiles = fs
          .readdirSync(outputDir)
          .filter(
            (f) =>
              f.startsWith(outputFileWithoutExt) && (f.endsWith('.geojson') || f.endsWith('.json'))
          );

        if (generatedFiles.length === 0) {
          throw new Error('未生成任何输出文件');
        }

        const inputStats = fs.statSync(inputPath);

        let totalOutputSize = 0;
        generatedFiles.forEach((outFile) => {
          const outPath = path.join(outputDir, outFile);

          console.log(`    使用 @turf/rewind 处理外环方向...`);
          const geoJsonData = JSON.parse(fs.readFileSync(outPath, 'utf-8'));
          const rewoundData = rewind(geoJsonData, { mutate: true, reverse: false });
          fs.writeFileSync(outPath, JSON.stringify(rewoundData));

          const stats = fs.statSync(outPath);
          totalOutputSize += stats.size;
          console.log(`    生成: ${outFile} (${(stats.size / 1024).toFixed(1)} KB)`);
        });

        const reduction = (((inputStats.size - totalOutputSize) / inputStats.size) * 100).toFixed(
          1
        );

        console.log(
          `  ✓ 完成: ${(inputStats.size / 1024).toFixed(1)} KB -> ${(totalOutputSize / 1024).toFixed(1)} KB (减少 ${reduction}%)\n`
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
