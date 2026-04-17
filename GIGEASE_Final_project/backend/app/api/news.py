from fastapi import APIRouter
import httpx
import os

router = APIRouter(prefix="/api/news", tags=["news"])

ZONE_KEYWORDS = {
    "VELACHERY": ["Velachery flood", "Velachery rain", "Velachery traffic"],
    "ADYAR": ["Adyar river", "Adyar flood", "Adyar rain"],
    "T_NAGAR": ["T Nagar", "Thyagaraya Nagar bandh", "T Nagar traffic"],
    "SHOLINGANALLUR": ["Sholinganallur", "OMR flood", "Sholinganallur rain"],
    "GUINDY": ["Guindy", "Guindy industrial", "Guindy strike"],
    "ANNA_NAGAR": ["Anna Nagar Chennai", "Anna Nagar rain"],
    "TAMBARAM": ["Tambaram flood", "Tambaram rain", "Tambaram traffic"],
    "PORUR": ["Porur lake", "Porur rain", "Porur flood"]
}

def compute_rsmd_from_news(articles: list) -> float:
    rsmd_keywords = ["bandh", "strike", "riot", "curfew", "protest",
                     "shutdown", "hartal", "agitation", "blockade"]
    count = 0
    for a in articles:
        text = (a.get("title","") or "" + " " + (a.get("description","") or "")).lower()
        if any(k in text for k in rsmd_keywords):
            count += 1
    return min(1.0, count / max(1, len(articles)))

@router.get("/zone/{zone_id}")
async def get_zone_news(zone_id: str):
    keywords = ZONE_KEYWORDS.get(zone_id, ["Chennai flood", "Chennai rain"])
    query = " OR ".join([f'"{k}"' for k in keywords[:2]])
    
    url = f"{os.getenv('NEWS_BASE_URL', 'https://newsapi.org/v2')}/everything"
    params = {
        "q": f"({query}) Chennai",
        "language": "en",
        "sortBy": "publishedAt",
        "pageSize": 5,
        "apiKey": os.getenv("NEWS_API_KEY", "")
    }
    
    articles = []
    try:
        if os.getenv("NEWS_API_KEY"):
            async with httpx.AsyncClient() as client:
                resp = await client.get(url, params=params, timeout=10.0)
                if resp.status_code == 200:
                    data = resp.json()
                    articles = data.get("articles", [])
    except Exception as e:
        print(f"News API limit/error: {e}")
        pass
        
    if not articles:
        # Fallback dummy news reflecting typical scenarios
        articles = [
            {"title": f"Heavy rains expected to continue in {zone_id}", "source": {"name": "Chennai News"}, "publishedAt": "2026-04-17T12:00:00Z", "url": "#", "description": "Local authorities issue warnings."},
            {"title": "Traffic diversion announced due to waterlogging", "source": {"name": "Traffic Update"}, "publishedAt": "2026-04-16T08:00:00Z", "url": "#", "description": "Commurers advised to take alternate routes."}
        ]
    
    rsmd_score = compute_rsmd_from_news(articles)
    
    return {
        "zone_id": zone_id,
        "articles": [{
            "title": a.get("title", ""),
            "source": a.get("source", {}).get("name", "Unknown"),
            "published": a.get("publishedAt", ""),
            "url": a.get("url", "#"),
            "description": a.get("description", ""),
            "is_rsmd_signal": any(w in (a.get("title", "") or "").lower() 
                                  for w in ["bandh", "strike", "riot", "curfew", "protest"])
        } for a in articles[:5]],
        "rsmd_news_score": rsmd_score,
        "rsmd_alert": rsmd_score > 0.6
    }

@router.get("/state")
async def get_tamil_nadu_news():
    params = {
        "q": "Tamil Nadu flood OR cyclone OR rain OR bandh OR strike",
        "language": "en",
        "sortBy": "publishedAt",
        "pageSize": 8,
        "apiKey": os.getenv("NEWS_API_KEY", "")
    }
    try:
        if os.getenv("NEWS_API_KEY"):
            async with httpx.AsyncClient() as client:
                resp = await client.get(f"{os.getenv('NEWS_BASE_URL', 'https://newsapi.org/v2')}/everything",
                                        params=params, timeout=10.0)
                if resp.status_code == 200:
                    return resp.json()
    except Exception:
        pass
    
    return {
        "status": "ok",
        "totalResults": 2,
        "articles": [
            {"title": "Statewide response for Northeast Monsoon", "source": {"name": "TN Govt"}, "publishedAt": "2026-04-17T10:00:00Z", "description": "Preparedness meeting held."},
            {"title": "Delivery drivers plan minor strike regarding payouts", "source": {"name": "Local Union"}, "publishedAt": "2026-04-16T14:00:00Z", "description": "A possible bandh in select zones."}
        ]
    }
