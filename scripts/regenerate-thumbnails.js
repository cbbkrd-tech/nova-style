import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const supabase = createClient(
  'https://iwrjwqdtjvdqqbxrdspu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3cmp3cWR0anZkcXFieHJkc3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MTE5ODIsImV4cCI6MjA4MTM4Nzk4Mn0.JqSoKIPkORNF7Q8IWXz0kHv8HFe1TWx5JA6ViTfRIWE'
);

// Lepsze ustawienia - większe i wyższa jakość
const THUMB_SIZE = 600;
const THUMB_QUALITY = 85;

async function regenerate() {
  console.log('\n🔄 Regeneracja miniaturek (600px, 85% jakość)\n');

  // 1. Pobierz listę plików
  const { data: files } = await supabase.storage.from('products').list('', { limit: 1000 });

  // 2. Usuń stare miniaturki
  const thumbsToDelete = files.filter(f => f.name.includes('_thumb.webp')).map(f => f.name);

  if (thumbsToDelete.length > 0) {
    console.log(`🗑️  Usuwanie ${thumbsToDelete.length} starych miniaturek...`);
    await supabase.storage.from('products').remove(thumbsToDelete);
    console.log('✅ Usunięto stare miniaturki\n');
  }

  // 3. Znajdź wszystkie obrazy WebP (bez _thumb)
  const webpFiles = files.filter(f => f.name.endsWith('.webp') && !f.name.includes('_thumb'));

  console.log(`📷 Generowanie ${webpFiles.length} nowych miniaturek...\n`);

  let done = 0;
  let errors = 0;

  for (const f of webpFiles) {
    try {
      const baseName = f.name.replace('.webp', '');
      const thumbName = `${baseName}_thumb.webp`;

      // Pobierz oryginalny obraz
      const { data: urlData } = supabase.storage.from('products').getPublicUrl(f.name);
      const response = await fetch(urlData.publicUrl);

      if (!response.ok) {
        console.log(`❌ ${f.name} - nie można pobrać`);
        errors++;
        continue;
      }

      const buffer = Buffer.from(await response.arrayBuffer());

      // Utwórz nową miniaturkę
      const thumbBuffer = await sharp(buffer)
        .resize(THUMB_SIZE, THUMB_SIZE, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: THUMB_QUALITY })
        .toBuffer();

      // Upload
      const { error } = await supabase.storage
        .from('products')
        .upload(thumbName, thumbBuffer, { contentType: 'image/webp', upsert: true });

      if (error) {
        console.log(`❌ ${f.name} - ${error.message}`);
        errors++;
        continue;
      }

      done++;
      if (done % 20 === 0) {
        console.log(`   ${done}/${webpFiles.length} gotowe...`);
      }
    } catch (err) {
      console.log(`❌ ${f.name} - ${err.message}`);
      errors++;
    }
  }

  console.log(`\n✅ Gotowe! ${done} miniaturek, ${errors} błędów`);
}

regenerate();
