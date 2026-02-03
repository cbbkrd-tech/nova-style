import os
from google import genai
from google.genai import types
from PIL import Image
from io import BytesIO

def load_api_key():
    env_path = "/workspaces/nova-style/supabase/functions/.env"
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if line.startswith('GOOGLE_AI_API_KEY='):
                    return line.strip().split('=', 1)[1]
    return os.environ.get("GOOGLE_AI_API_KEY")

API_KEY = load_api_key()
client = genai.Client(api_key=API_KEY)

def upscale_image(input_path, output_path=None):
    if output_path is None:
        base, ext = os.path.splitext(input_path)
        output_path = f"{base}_4k{ext}"

    print(f"Wczytuję obraz: {input_path}")

    with open(input_path, "rb") as f:
        image_bytes = f.read()

    original = Image.open(input_path)
    print(f"Oryginalny rozmiar: {original.size[0]}x{original.size[1]}")

    print("Generuję wersję 4K używając Gemini 3 Pro Image...")

    try:
        image_part = types.Part.from_bytes(
            data=image_bytes,
            mime_type="image/jpeg"
        )

        response = client.models.generate_content(
            model="gemini-3-pro-image-preview",
            contents=[
                image_part,
                "Create an extremely high quality, detailed 4K upscaled version of this image. Preserve all original details, enhance sharpness, and maintain the exact same composition, colors, and style. The person should look exactly the same. Do not change anything about the image content - only increase the resolution and quality. Return only the upscaled image."
            ],
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE", "TEXT"],
            ),
        )

        for part in response.candidates[0].content.parts:
            if part.text:
                print(f"Model: {part.text}")
            if part.inline_data:
                upscaled_data = BytesIO(part.inline_data.data)
                upscaled_image = Image.open(upscaled_data)
                print(f"Nowy rozmiar: {upscaled_image.size[0]}x{upscaled_image.size[1]}")
                upscaled_image.save(output_path, quality=95)
                print(f"Sukces! Obraz zapisany: {output_path}")
                return output_path

    except Exception as e:
        print(f"Błąd: {e}")
        return None

if __name__ == "__main__":
    input_file = "/workspaces/nova-style/Redesign assets/Hero-images/ciri.jpg"
    output_file = "/workspaces/nova-style/Redesign assets/Hero-images/ciri_4k.jpg"
    upscale_image(input_file, output_file)
