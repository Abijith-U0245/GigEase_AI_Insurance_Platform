import os
import asyncio
import json
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEndpoint, HuggingFaceEmbeddings
from langchain_core.documents import Document

# Load HF token from .env (FastAPI) or fallback to default
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

HF_TOKEN = os.environ.get("HF_TOKEN", "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")
os.environ["HUGGINGFACEHUB_API_TOKEN"] = HF_TOKEN

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_DIR = os.path.join(SCRIPT_DIR, "gigease_vectordb")

# =====================================================================
# SECTION 2: VECTOR STORE SETUP
# =====================================================================

def get_vector_store():
    # Only loads the vector db, builds it if it doesn't exist
    # Using local SentenceTransformers to avoid remote Inference API errors
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )
    
    if os.path.exists(DB_DIR) and os.listdir(DB_DIR):
        # Load existing
        vector_store = Chroma(persist_directory=DB_DIR, embedding_function=embeddings)
        return vector_store
    
    # Build if it doesn't exist
    files_to_load = [
        "gigease_policy.txt",
        "gigease_zone_profiles.txt",
        "gigease_claim_examples.txt"
    ]
    
    docs = []
    for f_name in files_to_load:
        path = os.path.join(SCRIPT_DIR, f_name)
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                text = f.read()
                docs.append(Document(page_content=text, metadata={"source": f_name}))
                
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    splits = text_splitter.split_documents(docs)
    
    vector_store = Chroma.from_documents(
        documents=splits, 
        embedding=embeddings, 
        persist_directory=DB_DIR
    )
    vector_store.persist()
    return vector_store


# =====================================================================
# SECTION 3: RSMD NEWS SCORING FUNCTION
# =====================================================================

def score_rsmd_news(news_articles: list[str], date_str: str) -> dict:
    keywords = ["bandh", "hartal", "curfew", "protest", "strike", 
                "shutdown", "agitation", "political death", 
                "arrested", "section 144", "lathi charge"]
                
    total_keyword_hits = 0
    sources_triggered = set()
    matched_keywords_all = set()
    
    for i, article in enumerate(news_articles):
        article_lower = article.lower()
        hits_in_article = 0
        
        # Simple source extraction mock: assume " - SourceName" format or just use index
        source_name = f"Source_{i+1}"
        if " - " in article:
            source_name = article.split(" - ")[-1].strip()
            
        for kw in keywords:
            if kw in article_lower:
                hits_in_article += 1
                matched_keywords_all.add(kw)
                
        if hits_in_article > 0:
            total_keyword_hits += hits_in_article
            sources_triggered.add(source_name)
            
    source_count = min(len(sources_triggered), 4)
    news_score = min(1.0, total_keyword_hits / 10.0)
    event_detected = 1 if source_count >= 2 else 0
    
    return {
        "date": date_str,
        "rsmd_news_score": news_score,
        "rsmd_news_source_count": source_count,
        "rsmd_event_detected": event_detected,
        "matched_keywords": list(matched_keywords_all),
        "sources_triggered": list(sources_triggered)
    }


# =====================================================================
# SECTION 4: CLAIM EXPLANATION GENERATOR
# =====================================================================

async def generate_claim_explanation(prediction_result: dict, worker_data: dict) -> dict:
    # Use HF token
    api_key = HF_TOKEN
    
    # Extract variables
    worker_name = worker_data.get('worker_name', 'Delivery Worker')
    primary_zone = worker_data.get('primary_zone', 'Chennai Zone')
    week_start_date = worker_data.get('week_start_date', 'Unknown Week')
    w_actual = worker_data.get('w_actual', 0.0)
    w_expected = worker_data.get('w_expected', 0.0)
    
    claim_amount_inr = prediction_result.get('claim_amount_inr', 0.0)
    next_premium = prediction_result.get('weekly_premium_inr', 0.0)
    fraud_action = prediction_result.get('fraud_action', 'AUTO_APPROVE')
    trigger_flag = prediction_result.get('claim_triggered', 0)
    
    # Event description builder
    event_desc = []
    if worker_data.get('stfi_event_confirmed') == 1:
        event_desc.append(f"STFI Flood Alert (Level {worker_data.get('flood_alert_level', 0)}, rainfall {worker_data.get('rainfall_mm', 0)}mm)")
    if worker_data.get('rsmd_event_confirmed') == 1:
        event_desc.append(f"RSMD {worker_data.get('rsmd_event_type', 'event')} (Severity {worker_data.get('rsmd_event_severity', 0)})")
    if worker_data.get('heatwave_declared') == 1:
        event_desc.append("Heatwave declared")
    
    event_str = ", ".join(event_desc) if event_desc else "No severe events"
    
    drop_pct = round(((w_expected - w_actual) / w_expected * 100), 1) if w_expected > 0 else 0.0
    
    if fraud_action == 'AUTO_REJECT':
        decision = "CLAIM REJECTED"
    elif fraud_action == 'SOFT_FLAG':
        decision = "CLAIM APPROVED - UNDER REVIEW"
    elif trigger_flag == 1:
        decision = "CLAIM APPROVED"
    else:
        decision = "NO CLAIM"
        
    loading_claims = worker_data.get('claims_last_4wk', 0)
    loading_note = f"Your premium has updated due to {loading_claims} claim(s) in the past 4 weeks." if loading_claims > 0 else None
    fraud_note = "Your claim was flagged due to abnormal GPS coordinates." if fraud_action == 'AUTO_REJECT' else None

    # Fallback template if missing key
    if not api_key:
        return {
            "worker_name": worker_name,
            "week": week_start_date,
            "decision": decision,
            "payout_inr": claim_amount_inr,
            "reason_short": "Event in your zone reduced income below threshold this week." if trigger_flag==1 else "No eligible disruption.",
            "reason_detail": "Your income dropped significantly due to a declared event. Your claim has been processed automatically." if trigger_flag==1 else "Your income did not drop below the 60% expected boundary.",
            "next_premium": next_premium,
            "loading_note": loading_note,
            "fraud_note": fraud_note
        }

    # Step 1: Retrieve context
    try:
        vector_store = get_vector_store()
        
        query = f"{primary_zone} {event_str} claim policy rule"
        retrieved_docs = vector_store.similarity_search(query, k=3)
        retrieved_chunks = "\n".join([d.page_content for d in retrieved_docs])
        
        # Step 3: Build Prompt (Instruct format for Mistral)
        prompt = f"""<s>[INST] You are writing a notification message for a gig delivery worker in Chennai about their insurance claim decision.
        
Policy context: {retrieved_chunks}
        
Worker: {worker_name}, Zone: {primary_zone}
Week: {week_start_date}
Decision: {decision}
Payout: {claim_amount_inr} INR
Income this week: {w_actual} INR
Expected income: {w_expected} INR
Income drop: {drop_pct}%
Event: {event_str}
        
Write exactly two strings as a JSON object:
1. reason_short: One sentence under 15 words explaining the decision in plain Tamil-friendly English.
2. reason_detail: Two to three sentences explaining what happened, why the claim was approved or rejected, and the exact payout amount.
        
Rules: Never invent numbers. Use only the numbers given above. Never mention technical terms like XGBoost or ML model. Write as if speaking directly to the delivery worker.
Output only the JSON object. [/INST]</s>"""

        # Step 4: Call Hugging Face Inference API directly
        from huggingface_hub import InferenceClient
        client = InferenceClient(token=HF_TOKEN)
        
        messages = [{"role": "user", "content": prompt}]
        repo_id = "mistralai/Mistral-7B-Instruct-v0.2"
        
        response = await asyncio.to_thread(
            client.chat_completion,
            model=repo_id,
            messages=messages,
            max_tokens=256,
            temperature=0.1
        )
        content_clean = response.choices[0].message.content.strip().strip('```json').strip('```').strip()
        
        # Sometimes small instruct models include junk before/after JSON. Let's try to extract.
        if "{" in content_clean:
            content_clean = content_clean[content_clean.find("{"):content_clean.rfind("}")+1]
        
        resp_json = json.loads(content_clean)
        
        short_reason = resp_json.get('reason_short', "Your claim decision has been automatically processed.")
        detail_reason = resp_json.get('reason_detail', "Based on your income and zone events, this is your automatic assessment.")
        
    except Exception as e:
        import traceback
        err_msg = traceback.format_exc()
        print("HF EXCEPTION:", err_msg)
        # Fallback if anything goes wrong
        short_reason = "Event in your zone affected income."
        detail_reason = f"Automated processing encountered a delay: {str(e)}"

    # Step 5: Build Final Dict
    return {
        "worker_name": worker_name,
        "week": week_start_date,
        "decision": decision,
        "payout_inr": claim_amount_inr,
        "reason_short": short_reason,
        "reason_detail": detail_reason,
        "next_premium": next_premium,
        "loading_note": loading_note,
        "fraud_note": fraud_note
    }

# =====================================================================
# SECTION 5: VECTOR STORE TEST
# =====================================================================

if __name__ == "__main__":
    if not HF_TOKEN:
        print("WARNING: HF_TOKEN not set.")
        
    try:
        vs = get_vector_store()
        queries = [
            "flood claim Velachery threshold",
            "RSMD bandh curfew income loss",
            "GPS spoofing fraud deduction"
        ]
        
        for q in queries:
            print(f"\nQuery: {q}")
            res = vs.similarity_search(q, k=2)
            for r in res:
                print("  - " + r.page_content[:100].replace("\n", " ") + "...")

        print("\nVECTORDB READY WITH HUGGING FACE")
    except Exception as e:
        print(f"Vector Store creation/test failed: {e}")
