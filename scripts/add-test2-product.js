import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://iwrjwqdtjvdqqbxrdspu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3cmp3cWR0anZkcXFieHJkc3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MTE5ODIsImV4cCI6MjA4MTM4Nzk4Mn0.JqSoKIPkORNF7Q8IWXz0kHv8HFe1TWx5JA6ViTfRIWE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const IMAGE_DIR = '/workspaces/nova-style/prototyp-image-generation/output';

// Dane produktu
const product = {
  name: 'test2',
  price: 11900, // 119 PLN w groszach
  category: 'women',
  color: 'Różowy',
  description: `Elegancka bluzka koszulowa w delikatnym różowym odcieniu, która zachwyca subtelnymi detalami. Wykonana z lekkiego, przyjemnego w dotyku materiału, pięknie układa się na sylwetce i zapewnia komfort noszenia. Klasyczny kołnierzyk i zapięcie na ozdobne złote guziki nadają całości szyku i elegancji. Rękawy 3/4 zakończone delikatną koronką stanowią wyjątkowy, romantyczny akcent. Bluzka świetnie sprawdzi się zarówno w stylizacjach biurowych, jak i na rodzinne uroczystości czy spotkania okolicznościowe.

Skład: 75% poliester, 20% wiskoza, 5% elastan
Wyprodukowano we Włoszech`,
  size_guide: `ONE SIZE - uniwersalny rozmiar
Obwód klatki: 90-100 cm
Długość: 62 cm
Modelka: 175 cm`,
};

// Zdjęcia do wgrania (kolejność: full body jako główne, close up, ghost)
const imagesToUpload = [
  { file: 'pink_blouse_full_body.png', isMain: true },
  { file: 'pink_blouse_close_up.png', isMain: false },
  { file: 'pink_blouse_ghost_v2.png', isMain: false },
];

async function addProduct() {
  console.log('\n🚀 Dodawanie produktu test2 do bazy danych\n');
  console.log('='.repeat(50));

  // 1. Pobierz subcategory_id dla "Koszule" w kategorii women
  const { data: subcategories } = await supabase
    .from('subcategories')
    .select('id, name')
    .eq('parent_category', 'women');

  console.log('\nDostępne podkategorie:', subcategories?.map(s => s.name).join(', '));

  // Znajdź "Koszule" lub podobną kategorię
  const koszuleSubcategory = subcategories?.find(s =>
    s.name.toLowerCase().includes('koszul') ||
    s.name.toLowerCase().includes('bluz')
  );

  if (!koszuleSubcategory) {
    console.log('❌ Nie znaleziono odpowiedniej podkategorii. Używam pierwszej dostępnej.');
  }

  const subcategoryId = koszuleSubcategory?.id || subcategories?.[0]?.id;
  console.log(`\nUżywam podkategorii: ${koszuleSubcategory?.name || subcategories?.[0]?.name} (${subcategoryId})`);

  // 2. Wgraj zdjęcia do Supabase Storage
  console.log('\n📸 Wgrywanie zdjęć...');
  const uploadedImages = [];

  for (const img of imagesToUpload) {
    const filePath = path.join(IMAGE_DIR, img.file);

    if (!fs.existsSync(filePath)) {
      console.log(`  ❌ Plik nie istnieje: ${img.file}`);
      continue;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.png`;

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(fileName, fileBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.log(`  ❌ Błąd uploadu ${img.file}: ${uploadError.message}`);
      continue;
    }

    const { data: urlData } = supabase.storage.from('products').getPublicUrl(fileName);
    uploadedImages.push({ url: urlData.publicUrl, isMain: img.isMain });
    console.log(`  ✅ Wgrano: ${img.file} -> ${fileName}`);
  }

  if (uploadedImages.length === 0) {
    console.log('\n❌ Nie udało się wgrać żadnych zdjęć!');
    return;
  }

  const mainImageUrl = uploadedImages.find(i => i.isMain)?.url || uploadedImages[0].url;

  // 3. Dodaj produkt do bazy
  console.log('\n📦 Tworzenie produktu w bazie...');

  const slug = `test2-${Date.now()}`;

  const { data: newProduct, error: productError } = await supabase
    .from('products')
    .insert({
      name: product.name,
      slug: slug,
      price: product.price,
      category: product.category,
      subcategory_id: subcategoryId,
      color: product.color,
      description: product.description,
      size_guide: product.size_guide,
      image_url: mainImageUrl,
      is_active: true,
      show_on_homepage: true,
    })
    .select()
    .single();

  if (productError) {
    console.log(`❌ Błąd tworzenia produktu: ${productError.message}`);
    return;
  }

  console.log(`  ✅ Produkt utworzony: ${newProduct.id}`);

  // 4. Dodaj zdjęcia do product_images
  console.log('\n🖼️  Dodawanie zdjęć do galerii...');

  const imageRecords = uploadedImages.map((img, idx) => ({
    product_id: newProduct.id,
    image_url: img.url,
    is_main: img.isMain,
    sort_order: idx,
  }));

  const { error: imagesError } = await supabase
    .from('product_images')
    .insert(imageRecords);

  if (imagesError) {
    console.log(`  ❌ Błąd dodawania zdjęć: ${imagesError.message}`);
  } else {
    console.log(`  ✅ Dodano ${imageRecords.length} zdjęć`);
  }

  // 5. Dodaj warianty rozmiaru (One Size)
  console.log('\n📏 Dodawanie wariantów rozmiaru...');

  const { error: variantsError } = await supabase
    .from('product_variants')
    .insert({
      product_id: newProduct.id,
      size: 'One Size',
      stock: 10,
    });

  if (variantsError) {
    console.log(`  ❌ Błąd dodawania wariantów: ${variantsError.message}`);
  } else {
    console.log(`  ✅ Dodano wariant: One Size (stock: 10)`);
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ GOTOWE! Produkt test2 został dodany do bazy.');
  console.log(`   ID: ${newProduct.id}`);
  console.log(`   Slug: ${slug}`);
  console.log('   Odśwież stronę aby zobaczyć produkt.');
  console.log('='.repeat(50) + '\n');
}

addProduct();
