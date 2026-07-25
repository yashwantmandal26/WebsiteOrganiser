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

    // ─── 1. Compress Images ─────────────────────────────────────────────────
    console.log('1. Compressing images...');
    const sharp = require('sharp');

    const imagesToCompress = [
        'icon-192.png',
        'media/mic.png',
        'media/rename.png',
        'media/theme.png',
        'media/google.png',
        'media/comment.png',
        'media/delete.png',
    ];

    let totalImgSaved = 0;
    for (const img of imagesToCompress) {
        const fullPath = path.join(ROOT, img);
        if (!fs.existsSync(fullPath)) {
            console.log(`  ⚠ ${img}: not found, skipping`);
            continue;
        }

        const originalSize = fs.statSync(fullPath).size;
        // Read and re-encode with maximum PNG compression + palette quantization
        const buffer = await sharp(fullPath)
            .png({ compressionLevel: 9, adaptiveFiltering: true, palette: true, quality: 80, effort: 10 })
            .toBuffer();

        // Only write if we actually made it smaller
        if (buffer.length < originalSize) {
            fs.writeFileSync(fullPath, buffer);
            const saved = originalSize - buffer.length;
            totalImgSaved += saved;
            console.log(`  ✅ ${img}: ${(originalSize / 1024).toFixed(1)} KB → ${(buffer.length / 1024).toFixed(1)} KB (saved ${(saved / 1024).toFixed(1)} KB)`);
        } else {
            console.log(`  ⏭ ${img}: already optimized (${(originalSize / 1024).toFixed(1)} KB)`);
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

    console.log('✅ Build complete! Update index.html to reference bundle.min.css and bundle.min.js');
}

build().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
});
