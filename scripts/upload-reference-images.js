import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://iwrjwqdtjvdqqbxrdspu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3cmp3cWR0anZkcXFieHJkc3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MTE5ODIsImV4cCI6MjA4MTM4Nzk4Mn0.JqSoKIPkORNF7Q8IWXz0kHv8HFe1TWx5JA6ViTfRIWE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const REFERENCE_DIR = '/workspaces/nova-style/prototyp-image-generation';

const imagesToUpload = [
  { file: 'full body main image.jpg', name: 'ai-reference-full-body.jpg' },
  { file: 'product close up.jpg', name: 'ai-reference-close-up.jpg' },
  { file: 'product ghost.jpg', name: 'ai-reference-ghost.jpg' },
];

async function uploadReferenceImages() {
  console.log('\n📸 Wgrywanie zdjęć referencyjnych do Supabase Storage\n');
  console.log('='.repeat(50));

  const uploadedUrls = {};

  for (const img of imagesToUpload) {
    const filePath = path.join(REFERENCE_DIR, img.file);

    if (!fs.existsSync(filePath)) {
      console.log(`❌ Plik nie istnieje: ${img.file}`);
      continue;
    }

    const fileBuffer = fs.readFileSync(filePath);

    // Upload to products bucket with a consistent name
    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(img.name, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: true  // Overwrite if exists
      });

    if (uploadError) {
      console.log(`❌ Błąd uploadu ${img.file}: ${uploadError.message}`);
      continue;
    }

    const { data: urlData } = supabase.storage.from('products').getPublicUrl(img.name);
    uploadedUrls[img.name] = urlData.publicUrl;
    console.log(`✅ ${img.file} -> ${img.name}`);
    console.log(`   URL: ${urlData.publicUrl}`);
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ GOTOWE! Zdjęcia referencyjne wgrane.');
  console.log('\nURLe do użycia w adminie:');
  console.log(JSON.stringify(uploadedUrls, null, 2));
  console.log('='.repeat(50) + '\n');
}

uploadReferenceImages();
