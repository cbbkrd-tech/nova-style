import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://iwrjwqdtjvdqqbxrdspu.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3cmp3cWR0anZkcXFieHJkc3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MTE5ODIsImV4cCI6MjA4MTM4Nzk4Mn0.JqSoKIPkORNF7Q8IWXz0kHv8HFe1TWx5JA6ViTfRIWE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Konfiguracja
const THUMBNAIL_SIZE = 400;
const FULL_QUALITY = 85;
const THUMB_QUALITY = 80;
const BACKUP_DIR = './image-backups';
const DRY_RUN = process.argv.includes('--dry-run');

// Utwórz folder na backup
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

async function convertAllImages() {
  console.log('\n🖼️  Konwersja obrazów do WebP + miniaturki\n');
  console.log('='.repeat(50));

  if (DRY_RUN) {
    console.log('⚠️  TRYB TESTOWY - żadne pliki nie zostaną zmienione\n');
  }

  // 1. Pobierz wszystkie unikalne URL-e obrazów
  const { data: productImages, error: imgError } = await supabase
    .from('product_images')
    .select('id, image_url, product_id');

  if (imgError) {
    console.error('Błąd pobierania product_images:', imgError.message);
    return;
  }

  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id, name, image_url');

  if (prodError) {
    console.error('Błąd pobierania products:', prodError.message);
    return;
  }

  // Zbierz wszystkie unikalne URL-e
  const allUrls = new Map();

  for (const img of productImages || []) {
    if (img.image_url && img.image_url.includes('supabase.co')) {
      allUrls.set(img.image_url, { type: 'product_image', id: img.id });
    }
  }

  for (const prod of products || []) {
    if (prod.image_url && prod.image_url.includes('supabase.co') && !allUrls.has(prod.image_url)) {
      allUrls.set(prod.image_url, { type: 'product', id: prod.id });
    }
  }

  console.log(`\nZnaleziono ${allUrls.size} unikalnych obrazów do przetworzenia\n`);

  let processed = 0;
  let skipped = 0;
  let errors = 0;
  let totalSavedBytes = 0;

  for (const [url, info] of allUrls) {
    try {
      // Wyciągnij nazwę pliku
      const urlParts = url.split('/');
      const originalFileName = urlParts[urlParts.length - 1];
      const baseName = originalFileName.replace(/\.[^.]+$/, '');
      const extension = originalFileName.split('.').pop().toLowerCase();

      // Pomiń jeśli już jest WebP z miniaturką
      if (extension === 'webp' && url.includes('_thumb')) {
        console.log(`⏭️  ${originalFileName.slice(0, 30)}... - już przetworzone`);
        skipped++;
        continue;
      }

      console.log(`\n📷 ${originalFileName.slice(0, 40)}...`);

      // 2. Pobierz oryginalny obraz
      const response = await fetch(url);
      if (!response.ok) {
        console.log(`   ❌ Nie można pobrać (${response.status})`);
        errors++;
        continue;
      }

      const originalBuffer = Buffer.from(await response.arrayBuffer());
      const originalSize = originalBuffer.length;

      // 3. Zapisz backup
      const backupPath = path.join(BACKUP_DIR, originalFileName);
      if (!DRY_RUN) {
        fs.writeFileSync(backupPath, originalBuffer);
      }
      console.log(`   💾 Backup: ${backupPath}`);

      // 4. Pobierz metadane
      const metadata = await sharp(originalBuffer).metadata();
      console.log(`   📐 Oryginał: ${metadata.width}x${metadata.height}, ${(originalSize / 1024).toFixed(0)} KB`);

      // 5. Konwertuj do WebP (pełny rozmiar)
      const webpFullBuffer = await sharp(originalBuffer)
        .webp({ quality: FULL_QUALITY })
        .toBuffer();

      const webpFullName = `${baseName}.webp`;
      console.log(`   🖼️  WebP pełny: ${(webpFullBuffer.length / 1024).toFixed(0)} KB (-${((1 - webpFullBuffer.length / originalSize) * 100).toFixed(0)}%)`);

      // 6. Utwórz miniaturkę WebP
      const webpThumbBuffer = await sharp(originalBuffer)
        .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: THUMB_QUALITY })
        .toBuffer();

      const webpThumbName = `${baseName}_thumb.webp`;
      const thumbMetadata = await sharp(webpThumbBuffer).metadata();
      console.log(`   🔍 Miniaturka: ${thumbMetadata.width}x${thumbMetadata.height}, ${(webpThumbBuffer.length / 1024).toFixed(0)} KB`);

      if (DRY_RUN) {
        console.log(`   ⚠️  [DRY RUN] Pominięto upload`);
        processed++;
        totalSavedBytes += (originalSize - webpFullBuffer.length);
        continue;
      }

      // 7. Upload WebP pełny rozmiar
      const { error: uploadFullError } = await supabase.storage
        .from('products')
        .upload(webpFullName, webpFullBuffer, {
          contentType: 'image/webp',
          upsert: true
        });

      if (uploadFullError) {
        console.log(`   ❌ Błąd uploadu pełnego: ${uploadFullError.message}`);
        errors++;
        continue;
      }

      // 8. Upload miniaturki
      const { error: uploadThumbError } = await supabase.storage
        .from('products')
        .upload(webpThumbName, webpThumbBuffer, {
          contentType: 'image/webp',
          upsert: true
        });

      if (uploadThumbError) {
        console.log(`   ❌ Błąd uploadu miniaturki: ${uploadThumbError.message}`);
        errors++;
        continue;
      }

      // 9. Pobierz nowy URL
      const { data: urlData } = supabase.storage.from('products').getPublicUrl(webpFullName);
      const newUrl = urlData.publicUrl;

      // 10. Zaktualizuj bazę danych
      if (info.type === 'product_image') {
        await supabase
          .from('product_images')
          .update({ image_url: newUrl })
          .eq('id', info.id);
      }

      // Zaktualizuj też products.image_url jeśli pasuje
      await supabase
        .from('products')
        .update({ image_url: newUrl })
        .eq('image_url', url);

      console.log(`   ✅ Zapisano i zaktualizowano DB`);

      processed++;
      totalSavedBytes += (originalSize - webpFullBuffer.length);

    } catch (err) {
      console.log(`   ❌ Błąd: ${err.message}`);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`\n✅ Zakończono!`);
  console.log(`   Przetworzono: ${processed}`);
  console.log(`   Pominięto: ${skipped}`);
  console.log(`   Błędy: ${errors}`);
  console.log(`   Zaoszczędzono: ${(totalSavedBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`\n💾 Backupy zapisane w: ${path.resolve(BACKUP_DIR)}`);

  if (DRY_RUN) {
    console.log('\n⚠️  To był tryb testowy. Uruchom bez --dry-run aby zapisać zmiany.');
  }
}

convertAllImages();
