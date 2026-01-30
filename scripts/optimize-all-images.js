import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const SUPABASE_URL = 'https://iwrjwqdtjvdqqbxrdspu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3cmp3cWR0anZkcXFieHJkc3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MTE5ODIsImV4cCI6MjA4MTM4Nzk4Mn0.JqSoKIPkORNF7Q8IWXz0kHv8HFe1TWx5JA6ViTfRIWE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const MAX_DIMENSION = 1400;

async function optimizeAllImages() {
  console.log('\n🖼️  Optymalizacja wszystkich zdjęć produktów\n');
  console.log('='.repeat(50));

  // 1. Pobierz wszystkie produkty
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id, name, image_url');

  if (prodError) {
    console.error('Błąd pobierania produktów:', prodError.message);
    return;
  }

  console.log(`\nZnaleziono ${products.length} produktów\n`);

  let totalOptimized = 0;
  let totalSkipped = 0;
  let totalSaved = 0;

  for (const product of products) {
    console.log(`\n📦 ${product.name}`);
    console.log('-'.repeat(40));

    // 2. Pobierz zdjęcia produktu z product_images
    const { data: images } = await supabase
      .from('product_images')
      .select('id, image_url, is_main')
      .eq('product_id', product.id);

    // Zbierz wszystkie URL-e do przetworzenia (product_images + products.image_url)
    const urlsToProcess = new Map();

    // Dodaj zdjęcia z product_images
    if (images) {
      for (const img of images) {
        urlsToProcess.set(img.image_url, {
          type: 'product_image',
          id: img.id,
          isMain: img.is_main
        });
      }
    }

    // Dodaj główne zdjęcie z products jeśli nie jest już w mapie
    if (product.image_url && !urlsToProcess.has(product.image_url)) {
      urlsToProcess.set(product.image_url, {
        type: 'product_main',
        id: product.id
      });
    }

    if (urlsToProcess.size === 0) {
      console.log('  Brak zdjęć');
      continue;
    }

    for (const [url, info] of urlsToProcess) {
      try {
        // Wyciągnij nazwę pliku z URL
        const urlParts = url.split('/');
        const fileName = urlParts[urlParts.length - 1];

        // Pomiń jeśli już przetworzony (już .jpg i zawiera timestamp)
        if (fileName.endsWith('.jpg') && /^\d{13}-/.test(fileName)) {
          // Sprawdź rozmiar
          const response = await fetch(url);
          if (!response.ok) continue;
          const buffer = Buffer.from(await response.arrayBuffer());
          const metadata = await sharp(buffer).metadata();

          if (metadata.width <= MAX_DIMENSION && metadata.height <= MAX_DIMENSION) {
            console.log(`  ✓ ${fileName.slice(0, 25)}... już zoptymalizowany`);
            totalSkipped++;
            continue;
          }
        }

        console.log(`  Przetwarzanie: ${fileName.slice(0, 30)}...`);

        // Pobierz oryginalny obraz
        const response = await fetch(url);
        if (!response.ok) {
          console.log(`    ❌ Nie można pobrać`);
          continue;
        }

        const originalBuffer = Buffer.from(await response.arrayBuffer());
        const originalSize = originalBuffer.length;
        const metadata = await sharp(originalBuffer).metadata();

        // Pomiń jeśli już mały
        if (metadata.width <= MAX_DIMENSION && metadata.height <= MAX_DIMENSION) {
          console.log(`    ✓ Już odpowiedni rozmiar (${metadata.width}x${metadata.height})`);
          totalSkipped++;
          continue;
        }

        console.log(`    Oryginalny: ${metadata.width}x${metadata.height}, ${(originalSize / 1024).toFixed(0)} KB`);

        // Zmniejsz
        const resizedBuffer = await sharp(originalBuffer)
          .resize(MAX_DIMENSION, MAX_DIMENSION, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: 90 })
          .toBuffer();

        const newMetadata = await sharp(resizedBuffer).metadata();
        const saved = originalSize - resizedBuffer.length;
        totalSaved += saved;

        console.log(`    Nowy: ${newMetadata.width}x${newMetadata.height}, ${(resizedBuffer.length / 1024).toFixed(0)} KB (-${((saved / originalSize) * 100).toFixed(0)}%)`);

        // Wgraj nowy plik
        const newFileName = fileName.replace(/\.[^.]+$/, '.jpg');

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(newFileName, resizedBuffer, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (uploadError) {
          console.log(`    ❌ Błąd uploadu: ${uploadError.message}`);
          continue;
        }

        // Pobierz nowy URL
        const { data: urlData } = supabase.storage.from('products').getPublicUrl(newFileName);
        const newUrl = urlData.publicUrl;

        // Zaktualizuj bazy danych
        if (info.type === 'product_image') {
          await supabase
            .from('product_images')
            .update({ image_url: newUrl })
            .eq('id', info.id);

          // Jeśli to główne zdjęcie, zaktualizuj też products.image_url
          if (info.isMain) {
            await supabase
              .from('products')
              .update({ image_url: newUrl })
              .eq('id', product.id);
          }
        } else {
          // Aktualizuj products.image_url
          await supabase
            .from('products')
            .update({ image_url: newUrl })
            .eq('id', product.id);
        }

        console.log(`    ✓ Zapisano`);
        totalOptimized++;

      } catch (err) {
        console.log(`    ❌ Błąd: ${err.message}`);
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`\n✅ Gotowe!`);
  console.log(`   Zoptymalizowano: ${totalOptimized} zdjęć`);
  console.log(`   Pominięto (już OK): ${totalSkipped} zdjęć`);
  console.log(`   Zaoszczędzono: ${(totalSaved / 1024 / 1024).toFixed(1)} MB\n`);
}

optimizeAllImages();
