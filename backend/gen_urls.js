const ids = [
  '6391951797',
  '7032614241',
  '8206934939',
  '892635527',
  '5273204304',
  '1877966081',
  '178131017'
];
const token = '8620428138:AAET01fRGFBDv6DJGEYUun3GvrWGvLgxFps';
const message = `**RELATÓRIO DE INTELIGÊNCIA MATINAL — HERMES EM VIGÍLIA** 🔱🌅🤖

SÃOBENTO, o rastro de hoje (21/04/2026) foi varrido com precisão cirúrgica. Aqui estão as atualizações de impacto:

### 📄 Novos Editais e Oportunidades:
* **Bombeiros MG & Oficiais Médicos SP:** Inscrições abertas e rastro de questões já mapeado.
* **Correios:** Prorrogação para 548 vagas de Jovem Aprendiz.
* **INSS & Banco do Brasil:** Movimentação massiva para 7 mil novos servidores federais em 2026.

### ⚖️ Rastro de Jurisprudência (O "DNA" da Aprovação):
* **STF Tema 1.164:** Mudança crítica sobre direito subjetivo à nomeação. Foco em Dir. Administrativo.
* **Lei 14.751/2023:** STJ confirmou não-retroatividade em editais vigentes.

### 🎯 Oportunidades "Ocultas":
* **Conselhos Regionais (CRM/CREA):** Editais para TI/Dados com salários até **R$ 8.500**.
* **Data Flywheel:** Simulados inéditos capturados e sendo processados pelo Tutor Sniper.

**Não estude o que já caiu. Preveja o que VAI cair.** 🦈⚖️🕸️🚀`;

const urls = ids.map(id => `https://api.telegram.org/bot${token}/sendMessage?chat_id=${id}&text=${encodeURIComponent(message)}&parse_mode=Markdown`);
console.log(JSON.stringify(urls, null, 2));
