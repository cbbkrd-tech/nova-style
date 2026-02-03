import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://iwrjwqdtjvdqqbxrdspu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3cmp3cWR0anZkcXFieHJkc3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MTE5ODIsImV4cCI6MjA4MTM4Nzk4Mn0.JqSoKIPkORNF7Q8IWXz0kHv8HFe1TWx5JA6ViTfRIWE'
);

async function checkStorage() {
  console.log('\n📦 Supabase Storage Usage\n');

  const { data: files, error } = await supabase.storage.from('products').list('', { limit: 1000 });

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  let total = 0, webp = 0, thumb = 0, jpg = 0, png = 0, other = 0;

  for (const f of files || []) {
    const size = f.metadata?.size || 0;
    total += size;

    if (f.name.includes('_thumb')) {
      thumb += size;
    } else if (f.name.endsWith('.webp')) {
      webp += size;
    } else if (f.name.endsWith('.jpg') || f.name.endsWith('.jpeg')) {
      jpg += size;
    } else if (f.name.endsWith('.png')) {
      png += size;
    } else {
      other += size;
    }
  }

  const MB = (bytes) => (bytes / 1024 / 1024).toFixed(2);
  const FREE_LIMIT = 1024 * 1024 * 1024; // 1 GB

  console.log(`Plików: ${files?.length || 0}`);
  console.log(`Łącznie: ${MB(total)} MB (${((total / FREE_LIMIT) * 100).toFixed(1)}% limitu)`);
  console.log('');
  console.log(`WebP (pełne):  ${MB(webp)} MB`);
  console.log(`Miniaturki:    ${MB(thumb)} MB`);
  console.log(`Stare JPG:     ${MB(jpg)} MB`);
  console.log(`PNG:           ${MB(png)} MB`);
  console.log(`Inne:          ${MB(other)} MB`);
  console.log('');
  console.log(`Limit Free Plan: 1 GB`);
  console.log(`Wolne: ${MB(FREE_LIMIT - total)} MB`);
}

checkStorage();
