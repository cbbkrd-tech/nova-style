import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const SUPABASE_URL = 'https://iwrjwqdtjvdqqbxrdspu.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3cmp3cWR0anZkcXFieHJkc3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MTE5ODIsImV4cCI6MjA4MTM4Nzk4Mn0.JqSoKIPkORNF7Q8IWXz0kHv8HFe1TWx5JA6ViTfRIWE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PRODUCT_ID = process.argv[2];
const MAX_DIMENSION = 1400;

if (!PRODUCT_ID) {
  console.error('Usage: node optimize-product-images.js <product-id>');
  process.exit(1);
}

async function optimizeProductImages() {
  console.log(`\nOptymalizacja zdjęć dla produktu: ${PRODUCT_ID}\n`);

  // 1. Pobierz zdjęcia produktu
  const { data: images, error } = await supabase
    .from('product_images')
    .select('id, image_url')
    .eq('product_id', PRODUCT_ID);

  if (error) {
    console.error('Błąd pobierania zdjęć:', error.message);
    return;
  }

  if (!images || images.length === 0) {
    console.log('Brak zdjęć dla tego produktu');
    return;
  }

  console.log(`Znaleziono ${images.length} zdjęć\n`);

  for (const img of images) {
    try {
      // Wyciągnij nazwę pliku z URL
      const urlParts = img.image_url.split('/');
      const fileName = urlParts[urlParts.length - 1];

      console.log(`Przetwarzanie: ${fileName}`);

      // 2. Pobierz oryginalny obraz
      const response = await fetch(img.image_url);
      if (!response.ok) {
        console.log(`  ❌ Nie można pobrać obrazu`);
        continue;
      }

      const originalBuffer = Buffer.from(await response.arrayBuffer());
      const originalSize = (originalBuffer.length / 1024).toFixed(1);

      // Sprawdź wymiary oryginału
      const metadata = await sharp(originalBuffer).metadata();
      console.log(`  Oryginalny: ${metadata.width}x${metadata.height}, ${originalSize} KB`);

      // 3. Zmniejsz jeśli potrzeba
      let resizedBuffer;
      if (metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION) {
        resizedBuffer = await sharp(originalBuffer)
          .resize(MAX_DIMENSION, MAX_DIMENSION, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: 90 })
          .toBuffer();

        const newMetadata = await sharp(resizedBuffer).metadata();
        const newSize = (resizedBuffer.length / 1024).toFixed(1);
        console.log(`  Zmniejszony: ${newMetadata.width}x${newMetadata.height}, ${newSize} KB`);
        console.log(`  Oszczędność: ${((1 - resizedBuffer.length / originalBuffer.length) * 100).toFixed(0)}%`);
      } else {
        console.log(`  ✓ Obraz już ma odpowiedni rozmiar`);
        continue;
      }

      // 4. Wgraj zmniejszony obraz (nadpisz)
      const newFileName = fileName.replace(/\.[^.]+$/, '.jpg');

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(newFileName, resizedBuffer, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        console.log(`  ❌ Błąd uploadu: ${uploadError.message}`);
        continue;
      }

      // 5. Zaktualizuj URL w bazie jeśli zmienił się format
      if (newFileName !== fileName) {
        const { data: urlData } = supabase.storage.from('products').getPublicUrl(newFileName);

        await supabase
          .from('product_images')
          .update({ image_url: urlData.publicUrl })
          .eq('id', img.id);

        // Zaktualizuj też main_image w products jeśli to główne zdjęcie
        await supabase
          .from('products')
          .update({ main_image: urlData.publicUrl })
          .eq('id', PRODUCT_ID)
          .eq('main_image', img.image_url);
      }

      console.log(`  ✓ Zapisano\n`);

    } catch (err) {
      console.log(`  ❌ Błąd: ${err.message}\n`);
    }
  }

  console.log('Gotowe!');
}

optimizeProductImages();
