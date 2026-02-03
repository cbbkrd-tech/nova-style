import os
from google import genai
from google.genai.types import GenerateContentConfig, Modality
from PIL import Image
from io import BytesIO

API_KEY = os.environ.get("GOOGLE_AI_API_KEY")
client = genai.Client(api_key=API_KEY)

BASE_DIR = "/workspaces/nova-style/prototyp-image-generation"
OUTPUT_DIR = "/workspaces/nova-style/prototyp-image-generation/output"

# Utwórz folder output jeśli nie istnieje
os.makedirs(OUTPUT_DIR, exist_ok=True)

def swap_clothes(model_image_path, product_image_path, output_name, image_type="full_body"):
    """
    Zamienia ubranie na modelce na nowy produkt.

    model_image_path: ścieżka do zdjęcia modelki (wzorzec)
    product_image_path: ścieżka do zdjęcia produktu do nałożenia
    output_name: nazwa pliku wyjściowego
    image_type: "full_body", "close_up", lub "ghost"
    """

    print(f"\n🎨 Generuję {image_type} dla: {output_name}")

    # Wczytaj obrazy
    model_img = Image.open(model_image_path)
    product_img = Image.open(product_image_path)

    # Prompt dostosowany do typu zdjęcia
    if image_type == "full_body":
        prompt = """Look at the first image - this is the reference model photo with perfect lighting, pose and background.
Look at the second image - this is the actual product (pink button-up blouse with collar and delicate lace details on sleeves).

Generate a new image that:
- Keeps EXACTLY the same model (blonde woman with wavy hair, same face, same pose, same hand position)
- Keeps EXACTLY the same beige/tan studio background
- Keeps EXACTLY the same lighting and professional photography style
- BUT replaces her current blue blouse with the pink blouse from the second image
- The pink blouse should have: button-front closure with decorative gold buttons, classic collar, 3/4 sleeves with lace trim at the cuffs
- Keep the same black pants/bottom visible

Output: High quality fashion e-commerce photo, 4K, professional studio lighting."""

    elif image_type == "close_up":
        prompt = """Look at the first image - this is the reference close-up photo showing the model from shoulders up.
Look at the second image - this is the actual product (pink button-up blouse with collar and lace details).

Generate a new close-up image that:
- Keeps the same framing (shoulders to chin visible, no full face)
- Keeps the same blonde wavy hair visible on sides
- Keeps EXACTLY the same beige studio background
- Keeps the same lighting style
- BUT shows the pink blouse from the second image instead
- Show the collar, top buttons, and upper part of the blouse clearly
- The pink blouse has decorative gold buttons

Output: Fashion product close-up photo, 4K, professional studio lighting."""

    elif image_type == "ghost":
        prompt = """Look at the first image - this is the reference "ghost mannequin" style product photo.
Look at the second image - this is the actual product (pink button-up blouse).

Generate a new ghost mannequin image that:
- Shows ONLY the garment floating on the same beige/tan gradient background
- No visible mannequin, just the clothes appearing to float
- The pink blouse should be displayed flat/frontal view
- Show: button-front with gold decorative buttons, classic collar, 3/4 sleeves with lace trim
- Same professional e-commerce product photography style
- Same soft shadow beneath

Output: Ghost mannequin fashion product photo, 4K, clean background."""

    try:
        response = client.models.generate_content(
            model="gemini-3-pro-image-preview",
            contents=[model_img, product_img, prompt],
            config=GenerateContentConfig(
                response_modalities=[Modality.TEXT, Modality.IMAGE],
            ),
        )

        for part in response.candidates[0].content.parts:
            if part.text:
                print(f"💬 Model: {part.text[:200]}...")

            if part.inline_data:
                image_data = BytesIO(part.inline_data.data)
                image = Image.open(image_data)
                output_path = f"{OUTPUT_DIR}/{output_name}"
                image.save(output_path)
                print(f"✅ Zapisano: {output_path}")
                return output_path

        print("❌ Brak obrazu w odpowiedzi")
        return None

    except Exception as e:
        print(f"❌ Błąd: {e}")
        return None


# === GŁÓWNY SKRYPT ===
if __name__ == "__main__":
    # Ścieżki do plików
    product_path = f"{BASE_DIR}/target product/621903240_1453274329651683_8588694035691734816_n.jpg"

    # Generuj wszystkie 3 typy zdjęć
    print("=" * 50)
    print("🚀 SWAP CLOTHES - Nano Banana Pro")
    print("=" * 50)

    # 1. Full body main image
    swap_clothes(
        model_image_path=f"{BASE_DIR}/full body main image.jpg",
        product_image_path=product_path,
        output_name="pink_blouse_full_body.png",
        image_type="full_body"
    )

    # 2. Close up
    swap_clothes(
        model_image_path=f"{BASE_DIR}/product close up.jpg",
        product_image_path=product_path,
        output_name="pink_blouse_close_up.png",
        image_type="close_up"
    )

    # 3. Ghost
    swap_clothes(
        model_image_path=f"{BASE_DIR}/product ghost.jpg",
        product_image_path=product_path,
        output_name="pink_blouse_ghost.png",
        image_type="ghost"
    )

    print("\n" + "=" * 50)
    print("✅ GOTOWE! Sprawdź folder: prototyp-image-generation/output/")
    print("=" * 50)
