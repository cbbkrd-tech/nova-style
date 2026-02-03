import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://iwrjwqdtjvdqqbxrdspu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3cmp3cWR0anZkcXFieHJkc3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MTE5ODIsImV4cCI6MjA4MTM4Nzk4Mn0.JqSoKIPkORNF7Q8IWXz0kHv8HFe1TWx5JA6ViTfRIWE'
);

const DRY_RUN = !process.argv.includes('--delete');

async function cleanup() {
  console.log('\n🧹 Czyszczenie starych plików JPG\n');

  if (DRY_RUN) {
    console.log('⚠️  TRYB PODGLĄDU - użyj --delete aby usunąć pliki\n');
  }

  // Pobierz listę plików
  const { data: files, error } = await supabase.storage.from('products').list('', { limit: 1000 });

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  // Znajdź wszystkie WebP (bez _thumb)
  const webpFiles = new Set();
  for (const f of files || []) {
    if (f.name.endsWith('.webp') && !f.name.includes('_thumb')) {
      // Wyciągnij base name (bez rozszerzenia)
      const baseName = f.name.replace('.webp', '');
      webpFiles.add(baseName);
    }
  }

  // Znajdź JPG do usunięcia (te które mają odpowiednik WebP)
  const toDelete = [];
  let totalSize = 0;

  for (const f of files || []) {
    if (f.name.endsWith('.jpg') || f.name.endsWith('.jpeg')) {
      const baseName = f.name.replace(/\.(jpg|jpeg)$/, '');

      if (webpFiles.has(baseName)) {
        toDelete.push(f.name);
        totalSize += f.metadata?.size || 0;
        console.log(`🗑️  ${f.name} (${((f.metadata?.size || 0) / 1024).toFixed(1)} KB)`);
      }
    }
  }

  console.log(`\n📊 Do usunięcia: ${toDelete.length} plików (${(totalSize / 1024 / 1024).toFixed(2)} MB)\n`);

  if (toDelete.length === 0) {
    console.log('✅ Brak plików do usunięcia');
    return;
  }

  if (DRY_RUN) {
    console.log('💡 Uruchom z --delete aby usunąć te pliki');
    return;
  }

  // Usuń pliki
  console.log('Usuwanie...');

  const { error: deleteError } = await supabase.storage
    .from('products')
    .remove(toDelete);

  if (deleteError) {
    console.error('❌ Błąd usuwania:', deleteError.message);
    return;
  }

  console.log(`✅ Usunięto ${toDelete.length} plików, zaoszczędzono ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
}

cleanup();
