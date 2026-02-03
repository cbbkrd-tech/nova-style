import os
from google import genai
from google.genai.types import GenerateContentConfig, Modality
from PIL import Image
from io import BytesIO

# Klucz API z .env
API_KEY = os.environ.get("GOOGLE_AI_API_KEY")

# Konfiguracja klienta
client = genai.Client(api_key=API_KEY)

def generate_image(prompt, filename="test-image.png"):
    print(f"Generuję obraz dla: {prompt}...")

    try:
        response = client.models.generate_content(
            model="gemini-3-pro-image-preview",
            contents=prompt,
            config=GenerateContentConfig(
                response_modalities=[Modality.TEXT, Modality.IMAGE],
            ),
        )

        for part in response.candidates[0].content.parts:
            if part.text:
                print(f"Model mówi: {part.text}")

            if part.inline_data:
                image_data = BytesIO(part.inline_data.data)
                image = Image.open(image_data)
                save_path = f"/workspaces/nova-style/scripts/{filename}"
                image.save(save_path)
                print(f"Sukces! Obraz zapisany: {save_path}")
                return save_path

    except Exception as e:
        print(f"Błąd: {e}")
        return None

# Test
generate_image("A simple red apple on white background, product photography style")
