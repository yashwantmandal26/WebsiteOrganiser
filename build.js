/**
 * WebsiteOrganiser Build Script
 * 
 * Compresses images, merges & minifies CSS, bundles & minifies JS.
 * Run with: node build.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

async function build() {
    console.log('=== WebsiteOrganiser Build Script ===\n');

    // ─── 1. Compress & Properly Size Images ───────────────────────────────────
    console.log('1. Compressing and properly sizing images...');
    const sharp = require('sharp');

    const icon192Path = path.join(ROOT, 'icon-192.png');
    const icon512Path = path.join(ROOT, 'icon-512.png');

    // If icon-512.png doesn't exist yet, derive it from original high-res icon-192.png
    if (fs.existsSync(icon192Path) && !fs.existsSync(icon512Path)) {
        try {
            const meta = await sharp(icon192Path).metadata();
            if (meta.width >= 512) {
                const buf512 = await sharp(icon192Path)
                    .resize(512, 512)
                    .png({ compressionLevel: 9, adaptiveFiltering: true, palette: true, quality: 85 })
                    .toBuffer();
                fs.writeFileSync(icon512Path, buf512);
                console.log(`  ✅ Created icon-512.png: ${(buf512.length / 1024).toFixed(1)} KB`);
            }
        } catch (e) {
            console.warn('  ⚠ Failed creating icon-512.png:', e.message);
        }
    }

    const imagesToProcess = [
        { file: 'icon-192.png', width: 192, height: 192 },
        { file: 'media/rename.png', width: 96, height: 96 },
        { file: 'media/theme.png', width: 96, height: 96 },
        { file: 'media/google.png', width: 96, height: 96 },
        { file: 'media/comment.png', width: 96, height: 96 },
        { file: 'media/delete.png', width: 96, height: 96 },
    ];

    let totalImgSaved = 0;
    for (const item of imagesToProcess) {
        const fullPath = path.join(ROOT, item.file);
        if (!fs.existsSync(fullPath)) {
            console.log(`  ⚠ ${item.file}: not found, skipping`);
            continue;
        }

        const originalSize = fs.statSync(fullPath).size;
        const buffer = await sharp(fullPath)
            .resize(item.width, item.height)
            .png({ compressionLevel: 9, adaptiveFiltering: true, palette: true, quality: 85, effort: 10 })
            .toBuffer();

        if (buffer.length < originalSize) {
            fs.writeFileSync(fullPath, buffer);
            const saved = originalSize - buffer.length;
            totalImgSaved += saved;
            console.log(`  ✅ ${item.file}: ${(originalSize / 1024).toFixed(1)} KB → ${(buffer.length / 1024).toFixed(1)} KB (saved ${(saved / 1024).toFixed(1)} KB)`);
        } else {
            console.log(`  ⏭ ${item.file}: already optimized (${(originalSize / 1024).toFixed(1)} KB)`);
        }
    }
    console.log(`  Total image savings: ${(totalImgSaved / 1024).toFixed(1)} KB\n`);

    // ─── 2. Merge & Minify CSS ──────────────────────────────────────────────
    console.log('2. Merging and minifying CSS...');
    const CleanCSS = require('clean-css');

    const cssFiles = ['style.css', 'add-keyword-modal.css', 'search-bar-update.css'];
    let combinedCSS = '';
    for (const file of cssFiles) {
        const filePath = path.join(ROOT, file);
        combinedCSS += `/* === ${file} === */\n` + fs.readFileSync(filePath, 'utf8') + '\n';
    }

    const cssOrigSize = Buffer.byteLength(combinedCSS, 'utf8');
    const minifiedCSS = new CleanCSS({
        level: { 1: { all: true }, 2: { mergeMedia: true, restructureRules: true } }
    }).minify(combinedCSS);

    if (minifiedCSS.errors && minifiedCSS.errors.length > 0) {
        console.error('  ❌ CSS minification errors:', minifiedCSS.errors);
    }

    const bundleCSSPath = path.join(ROOT, 'bundle.min.css');
    fs.writeFileSync(bundleCSSPath, minifiedCSS.styles);
    const cssNewSize = Buffer.byteLength(minifiedCSS.styles, 'utf8');
    console.log(`  ✅ ${cssFiles.join(' + ')} → bundle.min.css`);
    console.log(`     ${(cssOrigSize / 1024).toFixed(1)} KB → ${(cssNewSize / 1024).toFixed(1)} KB (saved ${((cssOrigSize - cssNewSize) / 1024).toFixed(1)} KB)\n`);

    // ─── 3. Bundle & Minify JS ──────────────────────────────────────────────
    console.log('3. Bundling and minifying JS...');
    const { minify } = require('terser');

    // Order matters — matches the defer order in index.html
    const jsFiles = [
        'js/config.js',
        'js/state.js',
        'js/utils.js',
        'js/firebase-sync.js',
        'js/render.js',
        'js/crud.js',
        'js/ui.js',
        'js/search.js',
        'js/app.js'
    ];

    let combinedJS = '';
    for (const file of jsFiles) {
        const filePath = path.join(ROOT, file);
        combinedJS += `\n/* === ${file} === */\n` + fs.readFileSync(filePath, 'utf8') + '\n;\n';
    }

    const jsOrigSize = Buffer.byteLength(combinedJS, 'utf8');
    const minifiedJS = await minify(combinedJS, {
        compress: {
            drop_console: false,
            passes: 2,
            dead_code: true,
            collapse_vars: true,
            reduce_vars: true,
        },
        mangle: {
            toplevel: false, // Don't mangle top-level names (WO namespace)
        },
        output: {
            comments: false
        }
    });

    if (minifiedJS.code) {
        const bundleJSPath = path.join(ROOT, 'bundle.min.js');
        fs.writeFileSync(bundleJSPath, minifiedJS.code);
        const jsNewSize = Buffer.byteLength(minifiedJS.code, 'utf8');
        console.log(`  ✅ ${jsFiles.length} files → bundle.min.js`);
        console.log(`     ${(jsOrigSize / 1024).toFixed(1)} KB → ${(jsNewSize / 1024).toFixed(1)} KB (saved ${((jsOrigSize - jsNewSize) / 1024).toFixed(1)} KB)\n`);
    } else {
        console.error('  ❌ JS minification failed');
    }

    // ─── 4. Sync Cache Versions in index.html & sw.js ──────────────────────
    console.log('4. Syncing cache versions in index.html & sw.js...');
    const indexPath = path.join(ROOT, 'index.html');
    const swPath    = path.join(ROOT, 'sw.js');

    let indexContent = fs.readFileSync(indexPath, 'utf8');
    const versionMatch = indexContent.match(/bundle\.min\.js\?v=(\d+)/);
    const currentVersion = versionMatch ? parseInt(versionMatch[1], 10) : 1013;
    const newVersion = currentVersion + 1;

    indexContent = indexContent
        .replace(/bundle\.min\.css\?v=\d+/g, `bundle.min.css?v=${newVersion}`)
        .replace(/bundle\.min\.js\?v=\d+/g, `bundle.min.js?v=${newVersion}`);
    fs.writeFileSync(indexPath, indexContent);
    console.log(`  ✅ index.html updated: ?v=${newVersion}`);

    if (fs.existsSync(swPath)) {
        let swContent = fs.readFileSync(swPath, 'utf8');
        swContent = swContent
            .replace(/const CACHE_VERSION = 'wo-v\d+';/, `const CACHE_VERSION = 'wo-v${newVersion}';`)
            .replace(/'\/bundle\.min\.css\?v=\d+'/, `'\/bundle.min.css?v=${newVersion}'`)
            .replace(/'\/bundle\.min\.js\?v=\d+'/, `'\/bundle.min.js?v=${newVersion}'`);
        fs.writeFileSync(swPath, swContent);
        console.log(`  ✅ sw.js updated: CACHE_VERSION = 'wo-v${newVersion}'\n`);
    }

    console.log(`✅ Build complete! All assets and cache versions synced to v${newVersion}.`);
}

build().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
});
