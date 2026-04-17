import asyncio
import httpx
from bs4 import BeautifulSoup
import json

# 🕸️ MOTOR DE EXTRAÇÃO GABARITOU - ELITE EDITION
# Este script extrai milhões de dados do Gran Cursos sem precisar de login.

# CONFIGURAÇÃO DE ALTO DESEMPENHO
CONFIG = {
    # Altere o TARGET para extrair categorias diferentes: 
    # 'questoes', 'provas', 'discursivas', 'concursos', 'simulados'
    "TARGET": "questoes", 
    "PAGINAS_PARA_EXTRAIR": 50, # Aumente conforme necessário
    "HEADERS": {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
}

URL_MAP = {
    "questoes": "https://questoes.grancursosonline.com.br/questoes",
    "provas": "https://questoes.grancursosonline.com.br/provas",
    "discursivas": "https://questoes.grancursosonline.com.br/discursivas",
    "concursos": "https://questoes.grancursosonline.com.br/concursos",
    "simulados": "https://questoes.grancursosonline.com.br/simulados"
}

async def extrair_item(client, url, page):
    print(f"🕸️ Mapeando página {page}...")
    try:
        response = await client.get(url, params={"page": page}, timeout=15.0)
        if response.status_code != 200: return []
        
        soup = BeautifulSoup(response.text, 'html.parser')
        # Seletor universal para os cards do Gran Cursos
        cards = soup.select('.card-concurse, .card-questoes, .card') 
        
        data = []
        for card in cards:
            # Extração Cirúrgica de Dados
            id_item = card.get('data-id') or "N/A"
            header = card.select_one('.top__h3__title, .card-title')
            meta = card.select_one('.top__h3__sub-title, .card-subtitle')
            body = card.select_one('.card__body, .content-questoes, .card-text')
            
            alternativas = []
            options = card.select('.question-option, .alternativa')
            for opt in options:
                alternativas.append(opt.get_text(strip=True))

            item = {
                "id": id_item,
                "titulo": header.get_text(strip=True) if header else "N/A",
                "metadata": meta.get_text(strip=True) if meta else "N/A",
                "texto": body.get_text(strip=True) if body else "N/A",
                "alternativas": alternativas
            }
            data.append(item)
        return data
    except Exception as e:
        print(f"⚠️ Erro na página {page}: {e}")
        return []

async def run_gabaritou_engine():
    target = CONFIG["TARGET"]
    url = URL_MAP.get(target)
    pages = CONFIG["PAGINAS_PARA_EXTRAIR"]
    
    print(f"🚀 Iniciando Extração Elite: {target.upper()}")
    
    async with httpx.AsyncClient(headers=CONFIG["HEADERS"], follow_redirects=True) as client:
        # Processa em lotes de 10 páginas para não sobrecarregar
        all_results = []
        batch_size = 10
        for i in range(1, pages + 1, batch_size):
            tasks = [extrair_item(client, url, p) for p in range(i, min(i + batch_size, pages + 1))]
            batch_results = await asyncio.gather(*tasks)
            all_results.extend([item for sub in batch_results for item in sub])
            print(f"📈 Progresso: {len(all_results)} itens extraídos...")

        # Salva o arquivo final
        output_file = f"gabaritou_data_{target}.jsonl"
        with open(output_file, "w", encoding="utf-8") as f:
            for item in all_results:
                f.write(json.dumps(item, ensure_ascii=False) + "\n")
        
        print(f"\n✅ SUCESSO! {len(all_results)} dados salvos em: {output_file}")
        print(f"💡 Dica: Agora alimente sua IA com este arquivo para o treinamento preditivo.")

# EXECUÇÃO (Detecta se está no Google Colab ou PC local)
if __name__ == "__main__":
    try:
        # Tenta rodar normal no PC
        asyncio.run(run_gabaritou_engine())
    except RuntimeError:
        # Se falhar (erro de loop ativo), roda no modo Colab/Notebook
        import nest_asyncio
        nest_asyncio.apply()
        asyncio.run(run_gabaritou_engine())
