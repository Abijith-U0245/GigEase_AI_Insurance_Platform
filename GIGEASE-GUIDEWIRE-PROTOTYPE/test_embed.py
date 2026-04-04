import os
from langchain_google_genai import GoogleGenerativeAIEmbeddings
import traceback

os.environ["GOOGLE_API_KEY"] = "AIzaSyD2pMIjbGGlQWcy9hL_uvngGVJ4mIs8zhg"

def test_models():
    models_to_test = ["models/embedding-001", "models/text-embedding-004"]
    for m in models_to_test:
        try:
            print(f"Testing {m}...")
            embeddings = GoogleGenerativeAIEmbeddings(model=m)
            res = embeddings.embed_query("hello world")
            print(f"SUCCESS: {m} returned {len(res)} dimensions")
        except Exception as e:
            print(f"FAILED {m}: {e}")

if __name__ == "__main__":
    test_models()
