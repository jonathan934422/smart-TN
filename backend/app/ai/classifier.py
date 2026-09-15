from io import BytesIO

from PIL import Image
from transformers import pipeline


WASTE_CATEGORIES = [
    "plastic waste",
    "organic food waste",
    "paper waste",
    "metal waste",
    "glass waste",
    "electronic e-waste",
    "hazardous waste",
    "mixed waste",
]


CATEGORY_MAP = {
    "plastic waste": "Plastic",
    "organic food waste": "Organic",
    "paper waste": "Paper",
    "metal waste": "Metal",
    "glass waste": "Glass",
    "electronic e-waste": "E-waste",
    "hazardous waste": "Hazardous",
    "mixed waste": "Mixed Waste",
}


classifier = None


def get_classifier():
    global classifier

    if classifier is None:
        print("Loading SmartWaste AI model...")

        classifier = pipeline(
            task="zero-shot-image-classification",
            model="openai/clip-vit-base-patch32",
        )

        print("SmartWaste AI model loaded successfully.")

    return classifier


def classify_waste(image_bytes: bytes):
    image = Image.open(BytesIO(image_bytes)).convert("RGB")

    model = get_classifier()

    predictions = model(
        image,
        candidate_labels=WASTE_CATEGORIES,
    )

    best_prediction = predictions[0]

    category = CATEGORY_MAP.get(
        best_prediction["label"],
        "Mixed Waste",
    )

    confidence = round(
        float(best_prediction["score"]) * 100,
        2,
    )

    manual_verification_required = confidence < 70

    return {
        "category": category,
        "confidence": confidence,
        "manual_verification_required": manual_verification_required,
        "model": "openai/clip-vit-base-patch32",
    }