// Supabase Edge Function: AI Product Generation
// Generates product images and descriptions using Google Gemini

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL_ID = 'gemini-3-pro-image-preview'; // Nano Banana Pro - for text analysis
const IMAGE_MODEL_ID = 'gemini-3-pro-image-preview'; // Nano Banana Pro - for image generation

interface GenerateRequest {
  action: 'analyze_composition' | 'generate_images' | 'generate_text' | 'regenerate_image';
  productImage?: string; // base64
  compositionImage?: string; // base64
  referenceImages?: { type: string; data: string }[]; // base64 images
  imageType?: 'full_body' | 'close_up' | 'ghost';
  editPrompt?: string;
  compositionText?: string;
  generatedImages?: { type: string; data: string }[];
  currentGeneratedImage?: string; // base64 - current version to edit
  editReferenceImage?: string; // base64 - optional reference image for editing
}

// Helper to call Gemini API
async function callGemini(
  apiKey: string,
  modelId: string,
  contents: any[],
  generationConfig?: any
): Promise<any> {
  const url = `${GEMINI_API_URL}/${modelId}:generateContent?key=${apiKey}`;

  const body: any = { contents };
  if (generationConfig) {
    body.generationConfig = generationConfig;
  }

  console.log(`Calling Gemini API: ${modelId}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Gemini API error:', response.status, error);
    throw new Error(`Gemini API error: ${response.status} - ${error.substring(0, 200)}`);
  }

  const result = await response.json();
  console.log('Gemini API response received');
  return result;
}

// Extract text from composition label image
async function analyzeComposition(apiKey: string, imageBase64: string): Promise<string> {
  const contents = [
    {
      parts: [
        {
          inline_data: {
            mime_type: 'image/jpeg',
            data: imageBase64,
          },
        },
        {
          text: `Przeanalizuj to zdjęcie metki/etykiety z ubrania. Wyodrębnij i przetłumacz na język polski:
1. Skład materiałowy (np. 75% poliester, 20% wiskoza, 5% elastan)
2. Kraj produkcji (jeśli widoczny)
3. Numer artykułu/kod produktu (jeśli widoczny)

Odpowiedz TYLKO w formacie:
SKŁAD: [lista składników po polsku]
PRODUKCJA: [kraj po polsku lub "nieznany"]
KOD: [kod lub "brak"]`,
        },
      ],
    },
  ];

  const result = await callGemini(apiKey, MODEL_ID, contents);
  return result.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// Generate product image (swap clothes on model)
async function generateProductImage(
  apiKey: string,
  productImageBase64: string,
  referenceImageBase64: string,
  imageType: 'full_body' | 'close_up' | 'ghost',
  editPrompt?: string,
  currentGeneratedImage?: string, // base64 of current version to edit
  editReferenceImage?: string // base64 of optional reference image for editing
): Promise<string | null> {
  const prompts: Record<string, string> = {
    full_body: `Look at the first image - this is the reference model photo with perfect lighting, pose and background.
Look at the second image - this is the actual product (clothing item to put on the model).

Generate a new image that:
- Keeps EXACTLY the same model (same face, same pose, same hand position)
- Keeps EXACTLY the same studio background
- Keeps EXACTLY the same lighting and professional photography style
- BUT replaces her current clothing with the product from the second image
- The product should maintain all its original details (buttons, lace, patterns, etc.)

Output: High quality fashion e-commerce photo, 4K, professional studio lighting.`,

    close_up: `Look at the first image - this is the reference close-up photo showing the model from shoulders up.
Look at the second image - this is the actual product (clothing item).

Generate a new close-up image that:
- Keeps the same framing (shoulders to chin visible)
- Keeps the same hair visible on sides
- Keeps EXACTLY the same studio background
- Keeps the same lighting style
- BUT shows the product from the second image instead
- Show the collar, buttons, and upper part of the garment clearly

Output: Fashion product close-up photo, 4K, professional studio lighting.`,

    ghost: `Look at the first image - this is the reference "ghost mannequin" style product photo.
Look at the second image - this is the actual product (clothing item).

Generate a new ghost mannequin image that:
- Shows ONLY the garment floating on the same background
- No visible mannequin, just the clothes appearing to float
- The garment should be displayed flat/frontal view
- Maintain all product details from the second image
- Same professional e-commerce product photography style
- Same soft shadow beneath

Output: Ghost mannequin fashion product photo, 4K, clean background.`,
  };

  let prompt = prompts[imageType];
  let contents;

  // If we have a current generated image, edit it directly
  if (currentGeneratedImage && editPrompt) {
    // Build prompt based on whether we have a reference image
    if (editReferenceImage) {
      prompt = `Look at the FIRST image - this is the fashion product photo I want to edit.
Look at the SECOND image - this is my reference showing what I want.

Make the following changes to the first image based on the reference:
${editPrompt}

Keep the same from the first image:
- Overall composition and framing
- Background
- Lighting style
- Professional e-commerce quality

Output: High quality fashion product photo, 4K.`;

      contents = [
        {
          parts: [
            {
              inline_data: {
                mime_type: 'image/png',
                data: currentGeneratedImage,
              },
            },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: editReferenceImage,
              },
            },
            { text: prompt },
          ],
        },
      ];
    } else {
      prompt = `Look at this fashion product photo. Make the following changes while keeping everything else the same:

${editPrompt}

Keep the same:
- Overall composition and framing
- Background
- Lighting style
- Professional e-commerce quality

Output: High quality fashion product photo, 4K.`;

      contents = [
        {
          parts: [
            {
              inline_data: {
                mime_type: 'image/png',
                data: currentGeneratedImage,
              },
            },
            { text: prompt },
          ],
        },
      ];
    }
  } else {
    // Normal generation from reference + product
    if (editPrompt) {
      prompt = `${prompt}\n\nADDITIONAL INSTRUCTIONS FROM USER: ${editPrompt}`;
    }

    contents = [
      {
        parts: [
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: referenceImageBase64,
            },
          },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: productImageBase64,
            },
          },
          { text: prompt },
        ],
      },
    ];
  }

  try {
    const result = await callGemini(apiKey, IMAGE_MODEL_ID, contents, {
      responseModalities: ['Text', 'Image'],
    });

    // Extract image from response
    const parts = result.candidates?.[0]?.content?.parts || [];
    console.log(`Response parts for ${imageType}:`, parts.length);

    for (const part of parts) {
      // Check various possible formats
      if (part.inline_data?.data) {
        console.log(`Found inline_data for ${imageType}`);
        return part.inline_data.data;
      }
      if (part.inlineData?.data) {
        console.log(`Found inlineData for ${imageType}`);
        return part.inlineData.data;
      }
    }

    console.log(`No image data found in response for ${imageType}. Parts:`, JSON.stringify(parts).substring(0, 500));
    return null;
  } catch (error) {
    console.error(`Error generating ${imageType} image:`, error);
    return null;
  }
}

// Generate product name and description
async function generateProductText(
  apiKey: string,
  productImageBase64: string,
  compositionText: string
): Promise<{ name: string; description: string; color: string }> {
  const contents = [
    {
      parts: [
        {
          inline_data: {
            mime_type: 'image/jpeg',
            data: productImageBase64,
          },
        },
        {
          text: `Napisz opis produktu dla ekskluzywnego butiku z modą damską.

Produkt: ubranie widoczne na zdjęciu
Skład: ${compositionText}

Napisz:
1. NAZWA: 3-4 słowa, np. "Elegancka bluzka z koronką"
2. KOLOR: jeden wyraz po polsku
3. OPIS: Elegancki, płynny opis produktu (około 80-100 słów). Opisz:
   - Jak wygląda produkt i z czego jest wykonany
   - Konkretne detale widoczne na zdjęciu (guziki, koronka, kołnierzyk, rękawy itp.)
   - Do jakich okazji pasuje (biuro, uroczystości, spotkania)
   - Na końcu podaj skład i kraj produkcji (jeśli znany)

Styl pisania: elegancki ale naturalny, bez przesadnych superlatywów typu "niezwykły", "wyjątkowy". Pisz konkretnie o tym co widać.

Przykład dobrego opisu:
"Elegancka bluzka koszulowa w delikatnym różowym odcieniu, która zachwyca subtelnymi detalami. Wykonana z lekkiego, przyjemnego w dotyku materiału, pięknie układa się na sylwetce i zapewnia komfort noszenia. Klasyczny kołnierzyk i zapięcie na ozdobne złote guziki nadają całości szyku i elegancji. Rękawy 3/4 zakończone delikatną koronką stanowią romantyczny akcent. Bluzka świetnie sprawdzi się zarówno w stylizacjach biurowych, jak i na rodzinne uroczystości. Skład: 75% poliester, 20% wiskoza, 5% elastan. Wyprodukowano we Włoszech."

Format odpowiedzi:
NAZWA: [nazwa]
KOLOR: [kolor]
OPIS: [opis]`,
        },
      ],
    },
  ];

  const result = await callGemini(apiKey, MODEL_ID, contents);
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Parse response
  const nameMatch = text.match(/NAZWA:\s*(.+?)(?=\n|KOLOR:|$)/s);
  const colorMatch = text.match(/KOLOR:\s*(.+?)(?=\n|OPIS:|$)/s);
  const descMatch = text.match(/OPIS:\s*(.+)/s);

  return {
    name: nameMatch?.[1]?.trim() || 'Nowy produkt',
    color: colorMatch?.[1]?.trim() || 'Wielokolorowy',
    description: descMatch?.[1]?.trim() || '',
  };
}

Deno.serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Google AI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: GenerateRequest = await req.json();
    console.log('AI Product request:', body.action);

    // Action: Analyze composition label
    if (body.action === 'analyze_composition') {
      if (!body.compositionImage) {
        return new Response(
          JSON.stringify({ error: 'Missing compositionImage' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const compositionText = await analyzeComposition(apiKey, body.compositionImage);

      return new Response(
        JSON.stringify({ success: true, compositionText }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Generate single image
    if (body.action === 'generate_images' || body.action === 'regenerate_image') {
      if (!body.productImage) {
        return new Response(
          JSON.stringify({ error: 'Missing productImage' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const imageTypes = body.action === 'regenerate_image' && body.imageType
        ? [body.imageType]
        : ['full_body', 'close_up', 'ghost'] as const;

      const generatedImages: { type: string; data: string }[] = [];

      for (const imageType of imageTypes) {
        const refImage = body.referenceImages?.find(r => r.type === imageType);
        if (!refImage) {
          console.log(`No reference image for ${imageType}, skipping`);
          continue;
        }

        console.log(`Generating ${imageType} image...`);
        const imageData = await generateProductImage(
          apiKey,
          body.productImage,
          refImage.data,
          imageType,
          body.editPrompt,
          body.currentGeneratedImage, // Pass current version for editing
          body.editReferenceImage // Pass optional reference image for editing
        );

        if (imageData) {
          generatedImages.push({ type: imageType, data: imageData });
          console.log(`${imageType} image generated successfully`);
        } else {
          console.log(`Failed to generate ${imageType} image`);
        }
      }

      return new Response(
        JSON.stringify({ success: true, generatedImages }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Generate product text (name, description)
    if (body.action === 'generate_text') {
      if (!body.productImage || !body.compositionText) {
        return new Response(
          JSON.stringify({ error: 'Missing productImage or compositionText' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const productText = await generateProductText(apiKey, body.productImage, body.compositionText);

      return new Response(
        JSON.stringify({ success: true, ...productText }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI Product error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown') }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
