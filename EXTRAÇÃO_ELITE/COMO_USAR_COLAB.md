# 🕸️ GUIA DE EXTRAÇÃO ELITE — GABARITOU

Esta pasta contém as ferramentas para minerar milhões de dados (Questões, Provas, Simulados) para treinar sua IA.

## 📁 Arquivos nesta pasta:
1. `gabaritou_extractor.py`: O motor de extração em Python (Já ajustado para rodar no Colab).
2. `gran_cursos_amostra.jsonl`: Uma amostra real de 20 questões já extraídas para você validar.

## 🚀 Como usar no Google Colab (Passo a Passo Atualizado):

1. **Acesse:** [colab.research.google.com](https://colab.research.google.com/).
2. **Crie um Novo Notebook:** Clique no botão azul "Novo notebook".
3. **Primeira Célula (Instalação):** Cole o seguinte comando na primeira caixa cinza e dê o **Play (▶️)**:
   `!pip install httpx beautifulsoup4 nest_asyncio`
4. **Segunda Célula (Código):** Clique em **"+ Código"** para criar uma nova caixa cinza, copie todo o conteúdo do arquivo `gabaritou_extractor.py` desta pasta e cole lá.
5. **Dê o Start:** Pressione o botão **Play (▶️)** da segunda célula. O robô vai começar a extrair.
6. **Download:** Quando terminar, clique no ícone de **Pasta** na barra lateral esquerda do Colab e faça o download do arquivo `.jsonl` gerado.

## ⚙️ Como extrair outras coisas:
No código da segunda célula, procure pela linha `CONFIG = { "TARGET": "questoes", ... }`.
Mude o valor de "TARGET" para:
- `"provas"` -> Para extrair provas completas.
- `"discursivas"` -> Para extrair questões discursivas.
- `"simulados"` -> Para extrair simulados.
- `"concursos"` -> Para extrair editais abertos.

---
**💡 Dica de Elite:** O motor agora detecta automaticamente se você está no PC ou no Colab e resolve o problema do "Event Loop" sozinho. 🦈🕸️🎯
