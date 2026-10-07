#!/usr/bin/env python3
"""
PDF/Image से Questions Extract करने का Script
Requires: pip install pdf2image pytesseract pillow google-generativeai
"""

import sys
import json
import base64
from pathlib import Path
from PIL import Image
import io

try:
    import pdf2image
    import pytesseract
    import google.generativeai as genai
except ImportError:
    print("❌ Required packages not installed!")
    print("Run: pip install pdf2image pytesseract pillow google-generativeai")
    sys.exit(1)

def extract_questions_from_pdf(pdf_path, api_key):
    """PDF से questions extract करो"""
    print(f"📄 PDF process कर रहे हैं: {pdf_path}")

    try:
        # PDF को images में convert करो
        images = pdf2image.convert_from_path(pdf_path)
        print(f"✅ {len(images)} pages found")

        all_text = ""
        for idx, image in enumerate(images):
            print(f"   Page {idx+1}: OCR कर रहे हैं...")
            # Tesseract से text निकालो
            text = pytesseract.image_to_string(image)
            all_text += f"\n--- PAGE {idx+1} ---\n{text}"

        return all_text
    except Exception as e:
        print(f"❌ PDF processing error: {e}")
        return None

def extract_questions_from_image(image_path, api_key):
    """Image से questions extract करो"""
    print(f"🖼️  Image process कर रहे हैं: {image_path}")

    try:
        # Image को base64 में convert करो
        with open(image_path, 'rb') as f:
            image_data = base64.standard_b64encode(f.read()).decode('utf-8')

        return image_data
    except Exception as e:
        print(f"❌ Image processing error: {e}")
        return None

def parse_questions_with_ai(text_or_image, api_key, is_image=False):
    """AI से questions को parse करो"""
    print("🤖 Gemini AI से questions extract कर रहे हैं...")

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.0-flash')

    prompt = """
    निम्नलिखित परीक्षा प्रश्न पत्र से MCQ questions निकालो।

    प्रत्येक question के लिए JSON format में निम्नलिखित दो:
    {
        "questions": [
            {
                "question": "Question text",
                "options": ["A", "B", "C", "D"],
                "correctAnswer": 0,
                "explanation": "Explanation if available",
                "subject": "Subject if identifiable"
            }
        ]
    }

    Important:
    - सभी MCQ questions निकालो
    - Options को A, B, C, D में रखो
    - Correct answer का index दो (0=A, 1=B, 2=C, 3=D)
    - यदि answer नहीं है तो 0 default करो
    - केवल valid JSON return करो

    Content:
    """ + (text_or_image if not is_image else "[Image uploaded for OCR]")

    try:
        if is_image:
            # Image के साथ send करो
            response = model.generate_content([
                prompt,
                {
                    "mime_type": "image/jpeg",
                    "data": text_or_image,
                }
            ])
        else:
            response = model.generate_content(prompt)

        # JSON extract करो
        response_text = response.text

        # JSON को parse करो
        try:
            # Find JSON in response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            if start_idx != -1 and end_idx > start_idx:
                json_str = response_text[start_idx:end_idx]
                result = json.loads(json_str)
                return result
        except:
            pass

        return {"questions": []}

    except Exception as e:
        print(f"❌ AI processing error: {e}")
        return {"questions": []}

def main():
    if len(sys.argv) < 2:
        print("""
╔════════════════════════════════════════════════════════════╗
║    PDF/Image से Questions Extract करने का Tool           ║
╚════════════════════════════════════════════════════════════╝

Usage:
  python extract_questions.py <file_path> [api_key]

Supported formats:
  - PDF files (.pdf)
  - Images (.jpg, .png, .jpeg)

Examples:
  python extract_questions.py question_paper.pdf
  python extract_questions.py exam_photo.jpg

Requirements:
  pip install pdf2image pytesseract pillow google-generativeai

Google API Key:
  1. https://console.cloud.google.com/ open करो
  2. Gemini API enable करो
  3. API key generate करो
  4. Environment variable set करो: GOOGLE_API_KEY=your_key
""")
        sys.exit(1)

    file_path = sys.argv[1]
    api_key = sys.argv[2] if len(sys.argv) > 2 else os.environ.get('GOOGLE_API_KEY')

    if not api_key:
        print("❌ Google API key required!")
        print("Set: export GOOGLE_API_KEY=your_key")
        sys.exit(1)

    if not Path(file_path).exists():
        print(f"❌ File not found: {file_path}")
        sys.exit(1)

    file_ext = Path(file_path).suffix.lower()

    if file_ext == '.pdf':
        text = extract_questions_from_pdf(file_path, api_key)
        if text:
            result = parse_questions_with_ai(text, api_key)
    elif file_ext in ['.jpg', '.jpeg', '.png']:
        image_data = extract_questions_from_image(file_path, api_key)
        if image_data:
            result = parse_questions_with_ai(image_data, api_key, is_image=True)
    else:
        print(f"❌ Unsupported file format: {file_ext}")
        sys.exit(1)

    # Output को print करो
    print("\n✅ Extraction complete!")
    print(json.dumps(result, ensure_ascii=False, indent=2))

    # File में save करो
    output_file = Path(file_path).stem + "_questions.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"💾 Saved to: {output_file}")

if __name__ == "__main__":
    import os
    main()
