import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://iwrjwqdtjvdqqbxrdspu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3cmp3cWR0anZkcXFieHJkc3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MTE5ODIsImV4cCI6MjA4MTM4Nzk4Mn0.JqSoKIPkORNF7Q8IWXz0kHv8HFe1TWx5JA6ViTfRIWE'
);

async function fixUrls() {
  console.log('\n🔧 Naprawianie URL-i obrazów w bazie danych\n');

  // 1. Pobierz wszystkie produkty
  const { data: products } = await supabase.from('products').select('id, image_url');

  let fixed = 0;

  for (const p of products || []) {
    if (p.image_url && (p.image_url.endsWith('.jpg') || p.image_url.endsWith('.jpeg'))) {
      const newUrl = p.image_url.replace(/\.(jpg|jpeg)$/, '.webp');

      await supabase.from('products').update({ image_url: newUrl }).eq('id', p.id);
      fixed++;
    }
  }

  console.log(`✅ Naprawiono ${fixed} URL-i w tabeli products`);

  // 2. Napraw product_images
  const { data: images } = await supabase.from('product_images').select('id, image_url');

  let fixedImages = 0;

  for (const img of images || []) {
    if (img.image_url && (img.image_url.endsWith('.jpg') || img.image_url.endsWith('.jpeg'))) {
      const newUrl = img.image_url.replace(/\.(jpg|jpeg)$/, '.webp');

      await supabase.from('product_images').update({ image_url: newUrl }).eq('id', img.id);
      fixedImages++;
    }
  }

  console.log(`✅ Naprawiono ${fixedImages} URL-i w tabeli product_images`);

  console.log('\n✅ Gotowe!');
}

fixUrls();
