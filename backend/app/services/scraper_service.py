from typing import Optional
import httpx
import asyncio
import re

from app.models.lead import Lead


def calculate_lead_score(lead: Lead) -> int:
    score = 0
    if not lead.tem_site:
        score += 40
    elif lead.site_score and lead.site_score < 50:
        score += 25
    if not lead.ssl_valido:
        score += 10
    if not lead.mobile_friendly:
        score += 10
    if lead.rating and lead.rating >= 4.5:
        score += 15
    if lead.reviews_count and lead.reviews_count > 100:
        score += 10
    if lead.dominio_disponivel:
        score += 10
    if not lead.whatsapp:
        score += 5
    if lead.fotos_count and lead.fotos_count < 5:
        score += 5
    return min(score, 100)


def calculate_pricing(lead: Lead) -> tuple[float, float]:
    score = lead.lead_score
    if score >= 80:
        return (1200.0, 150.0)
    elif score >= 60:
        return (600.0, 97.0)
    elif score >= 40:
        return (300.0, 67.0)
    else:
        return (150.0, 47.0)


def suggest_domain(business_name: str) -> str:
    name = business_name.lower()
    name = re.sub(r'[^a-z0-9\s]', '', name)
    name = re.sub(r'\s+', '', name)
    return f"{name}.com.br"


async def analyze_site(url: str) -> dict:
    result = {
        "ssl_valido": False,
        "mobile_friendly": False,
        "site_score": 0,
        "accessible": False,
    }

    if not url:
        return result

    if not url.startswith(("http://", "https://")):
        url = f"https://{url}"

    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            response = await client.get(url)
            result["accessible"] = response.status_code < 400
            result["ssl_valido"] = url.startswith("https://") and response.status_code < 400

            content = response.text.lower()
            score = 0

            if result["ssl_valido"]:
                score += 20
            if "viewport" in content:
                result["mobile_friendly"] = True
                score += 20
            if len(content) > 5000:
                score += 10
            if "tel:" in content or "phone" in content:
                score += 10
            if "whatsapp" in content:
                score += 10
            if "contato" in content or "contact" in content:
                score += 10
            if response.elapsed.total_seconds() < 2:
                score += 10
            if "og:" in content or "twitter:" in content:
                score += 10

            result["site_score"] = min(score, 100)
    except Exception:
        result["site_score"] = 0

    return result


async def check_domain_availability(domain: str) -> bool:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"https://{domain}")
            return False
    except (httpx.ConnectError, httpx.ConnectTimeout):
        return True
    except Exception:
        return False
