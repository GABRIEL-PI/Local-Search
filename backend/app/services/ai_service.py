import json
from typing import Optional
import anthropic

from app.core.config import settings
from app.models.lead import Lead


class ProposalContent:
    def __init__(
        self,
        argumento_venda: str,
        mensagem_formal: str,
        mensagem_descontraida: str,
        mensagem_urgencia: str,
        landing_page_html: str,
        preco_sugerido: float,
        mensalidade_sugerida: float,
    ):
        self.argumento_venda = argumento_venda
        self.mensagem_formal = mensagem_formal
        self.mensagem_descontraida = mensagem_descontraida
        self.mensagem_urgencia = mensagem_urgencia
        self.landing_page_html = landing_page_html
        self.preco_sugerido = preco_sugerido
        self.mensalidade_sugerida = mensalidade_sugerida


class AIService:
    def __init__(self, api_key: Optional[str] = None):
        key = api_key or settings.CLAUDE_API_KEY
        self.client = anthropic.Anthropic(api_key=key)
        self.model = settings.CLAUDE_MODEL

    async def generate_proposal(self, lead: Lead) -> ProposalContent:
        prompt = self._build_prompt(lead)

        message = self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        )

        content = message.content[0].text

        try:
            start = content.find("{")
            end = content.rfind("}") + 1
            json_str = content[start:end]
            data = json.loads(json_str)
        except Exception:
            data = self._parse_fallback(content, lead)

        return ProposalContent(
            argumento_venda=data.get("argumento_venda", ""),
            mensagem_formal=data.get("mensagem_formal", ""),
            mensagem_descontraida=data.get("mensagem_descontraida", ""),
            mensagem_urgencia=data.get("mensagem_urgencia", ""),
            landing_page_html=data.get("landing_page_html", self._default_landing_page(lead)),
            preco_sugerido=float(data.get("preco_sugerido", 300.0)),
            mensalidade_sugerida=float(data.get("mensalidade_sugerida", 97.0)),
        )

    def _build_prompt(self, lead: Lead) -> str:
        site_analysis = []
        if not lead.tem_site:
            site_analysis.append("NÃO POSSUI SITE - oportunidade primária")
        else:
            if lead.site_score:
                site_analysis.append(f"Site com score {lead.site_score}/100")
            if not lead.ssl_valido:
                site_analysis.append("Site sem certificado SSL (inseguro)")
            if not lead.mobile_friendly:
                site_analysis.append("Site não é responsivo/mobile")

        domain_info = ""
        if lead.dominio_disponivel and lead.dominio_sugerido:
            domain_info = f"Domínio sugerido disponível: {lead.dominio_sugerido}"

        return f"""Você é um especialista em vendas de sites para pequenas e médias empresas locais no Brasil.

Analise os dados deste lead e crie uma proposta comercial completa em formato JSON.

## Dados do Lead:
- **Nome do Negócio:** {lead.nome}
- **Categoria/Nicho:** {lead.categoria or 'Não informado'}
- **Localização:** {lead.cidade or ''} {lead.estado or ''}
- **Endereço:** {lead.endereco or 'Não informado'}
- **Telefone:** {lead.telefone or 'Não informado'}
- **WhatsApp:** {lead.whatsapp or 'Não possui'}
- **Avaliação Google:** {lead.rating or 'N/A'} estrelas ({lead.reviews_count or 0} avaliações)
- **Fotos no Google:** {lead.fotos_count or 0} fotos
- **Score do Lead:** {lead.lead_score}/100

## Análise de Presença Digital:
{chr(10).join('- ' + item for item in site_analysis) if site_analysis else '- Possui site ativo'}
{domain_info}

## Precificação Dinâmica:
{"R$ 1.200,00 setup + R$ 150/mês" if lead.lead_score >= 80 else "R$ 600,00 setup + R$ 97/mês" if lead.lead_score >= 60 else "R$ 300,00 setup + R$ 67/mês" if lead.lead_score >= 40 else "R$ 150,00 setup + R$ 47/mês"}

Crie uma proposta personalizada e convincente. Responda APENAS com JSON válido:

{{
  "argumento_venda": "Argumento de 3-4 parágrafos personalizado para este negócio específico, focando nas dores identificadas e oportunidades",
  "mensagem_formal": "Mensagem profissional para WhatsApp/email, máx 300 chars, apresentando a empresa e proposta de valor",
  "mensagem_descontraida": "Mensagem casual e amigável para WhatsApp, máx 300 chars, tom pessoal e direto",
  "mensagem_urgencia": "Mensagem com gatilho de urgência/escassez, máx 300 chars, cria senso de oportunidade única",
  "landing_page_html": "HTML COMPLETO de uma landing page profissional de 1 página para vender o site para {lead.nome}. Inclua: header com proposta de valor, seção de problemas identificados, solução oferecida, portfólio/exemplos, depoimentos fictícios do nicho, preço e CTA de WhatsApp. Use TailwindCSS via CDN. IMPORTANTE: a landing page deve ser personalizada para o nicho de {lead.categoria}.",
  "preco_sugerido": {300.0 if lead.lead_score < 40 else 600.0 if lead.lead_score < 60 else 1200.0},
  "mensalidade_sugerida": {47.0 if lead.lead_score < 40 else 67.0 if lead.lead_score < 60 else 97.0}
}}"""

    def _default_landing_page(self, lead: Lead) -> str:
        return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Proposta - {lead.nome}</title>
<script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="font-sans bg-gray-50">
  <header class="bg-blue-600 text-white py-16 text-center">
    <h1 class="text-4xl font-bold mb-4">Transforme {lead.nome} digitalmente</h1>
    <p class="text-xl mb-8">Mais clientes, mais vendas, mais crescimento</p>
    <a href="https://wa.me/" class="bg-green-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-green-400">
      Falar no WhatsApp
    </a>
  </header>
  <section class="max-w-4xl mx-auto py-16 px-4">
    <h2 class="text-3xl font-bold text-center mb-12">Por que {lead.nome} precisa de um site?</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="bg-white p-6 rounded-lg shadow text-center">
        <div class="text-4xl mb-4">📱</div>
        <h3 class="font-bold text-lg mb-2">Visibilidade 24/7</h3>
        <p>Seus clientes te encontram a qualquer hora, mesmo quando você está fechado</p>
      </div>
      <div class="bg-white p-6 rounded-lg shadow text-center">
        <div class="text-4xl mb-4">🎯</div>
        <h3 class="font-bold text-lg mb-2">Mais Clientes</h3>
        <p>Apareça no Google quando pessoas buscam por {lead.categoria or 'seu negócio'} na sua cidade</p>
      </div>
      <div class="bg-white p-6 rounded-lg shadow text-center">
        <div class="text-4xl mb-4">💰</div>
        <h3 class="font-bold text-lg mb-2">Mais Vendas</h3>
        <p>Transforme visitantes em clientes com um site profissional e convincente</p>
      </div>
    </div>
  </section>
  <section class="bg-blue-600 text-white py-16 text-center">
    <h2 class="text-3xl font-bold mb-4">Comece hoje mesmo</h2>
    <p class="text-xl mb-8">Site profissional a partir de R$ 300,00</p>
    <a href="https://wa.me/" class="bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-semibold">
      Solicitar Orçamento Grátis
    </a>
  </section>
</body>
</html>"""

    def _parse_fallback(self, content: str, lead: Lead) -> dict:
        from app.services.scraper_service import calculate_pricing
        setup, monthly = calculate_pricing(lead)
        return {
            "argumento_venda": f"Identificamos que {lead.nome} tem grande potencial de crescimento digital. Com um site profissional, você pode aumentar significativamente sua visibilidade online e atrair mais clientes.",
            "mensagem_formal": f"Olá! Somos especialistas em criação de sites para {lead.categoria}. Identificamos que {lead.nome} pode se beneficiar muito de uma presença digital profissional. Posso apresentar nossa proposta?",
            "mensagem_descontraida": f"Oi! Vi que {lead.nome} está crescendo bem. Tenho uma ideia que pode trazer ainda mais clientes pra você. Posso te chamar?",
            "mensagem_urgencia": f"Última vaga para {lead.cidade} este mês! Crie o site de {lead.nome} com condições especiais. Amanhã pode ser tarde!",
            "landing_page_html": self._default_landing_page(lead),
            "preco_sugerido": setup,
            "mensalidade_sugerida": monthly,
        }
