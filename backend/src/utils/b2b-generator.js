/**
 * B2B Lead Capture Generator — Gabaritou v3.2
 * Gera um dossiê interativo em HTML para prospecção de parceiros (Aether Engine / MiroFish)
 */

export function generateB2BFormHTML(data) {
  const { name = 'Parceiro', date = new Date().toLocaleDateString('pt-BR') } = data;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aether Engine | B2B Portal — Gabaritou</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #020205;
            --secondary: #0a1628;
            --accent: #22d3ee;
            --accent-violet: #8b5cf6;
            --text-primary: #ffffff;
            --text-secondary: rgba(255, 255, 255, 0.6);
            --gradient-ocean: linear-gradient(135deg, #020205 0%, #0a1628 100%);
            --gradient-accent: linear-gradient(135deg, #22d3ee, #8b5cf6);
            --card-bg: rgba(255, 255, 255, 0.03);
            --border: rgba(255, 255, 255, 0.1);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', sans-serif;
            background: var(--primary);
            color: var(--text-primary);
            overflow-x: hidden;
            line-height: 1.6;
        }

        .container { max-width: 1000px; margin: 0 auto; padding: 40px 24px; }

        /* HEADER */
        .header { text-align: center; margin-bottom: 60px; }
        .logo { font-size: 24px; font-weight: 900; letter-spacing: -1px; margin-bottom: 10px; }
        .logo span { background: var(--gradient-accent); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .header h1 { font-family: 'Playfair Display', serif; font-size: 42px; margin-bottom: 15px; }
        .header p { color: var(--text-secondary); max-width: 600px; margin: 0 auto; }

        /* MULTI-STEP FORM */
        .form-wrapper {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 24px;
            padding: 40px;
            backdrop-filter: blur(10px);
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }

        .progress-bar {
            display: flex; justify-content: space-between; margin-bottom: 40px;
            position: relative;
        }
        .progress-bar::after {
            content: ''; position: absolute; top: 15px; left: 0; right: 0;
            height: 2px; background: var(--border); z-index: 1;
        }
        .step-dot {
            width: 30px; height: 30px; background: var(--secondary);
            border: 2px solid var(--border); border-radius: 50%;
            z-index: 2; display: flex; align-items: center; justify-content: center;
            font-size: 12px; font-weight: 700; transition: all 0.3s;
        }
        .step-dot.active { border-color: var(--accent); background: var(--accent); color: var(--primary); box-shadow: 0 0 15px var(--accent); }
        .step-dot.done { border-color: #10b981; background: #10b981; }

        .form-step { display: none; }
        .form-step.active { display: block; animation: fadeIn 0.5s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .step-title { font-size: 24px; margin-bottom: 10px; font-weight: 700; color: var(--accent); }
        .step-desc { color: var(--text-secondary); margin-bottom: 30px; font-size: 14px; }

        .form-group { margin-bottom: 25px; }
        .form-group label { display: block; margin-bottom: 8px; font-size: 13px; font-weight: 600; color: var(--text-secondary); }
        .form-group input, .form-group select, .form-group textarea {
            width: 100%; background: rgba(255,255,255,0.05); border: 1px solid var(--border);
            border-radius: 12px; padding: 15px; color: white; font-family: inherit; font-size: 15px;
            outline: none; transition: all 0.3s;
        }
        .form-group input:focus, .form-group select:focus { border-color: var(--accent); background: rgba(255,255,255,0.08); }

        .grid-options { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
        .option-card {
            background: rgba(255,255,255,0.03); border: 1px solid var(--border);
            padding: 20px; border-radius: 15px; cursor: pointer; text-align: center;
            transition: all 0.3s;
        }
        .option-card:hover { border-color: var(--accent); background: rgba(34, 211, 238, 0.05); }
        .option-card.selected { border-color: var(--accent); background: rgba(34, 211, 238, 0.1); box-shadow: 0 0 20px rgba(34, 211, 238, 0.2); }
        .option-card i { display: block; font-size: 24px; margin-bottom: 10px; }
        .option-card span { font-weight: 700; font-size: 14px; }

        .nav-buttons { display: flex; justify-content: space-between; margin-top: 40px; }
        .btn {
            padding: 15px 35px; border-radius: 50px; font-weight: 700; cursor: pointer;
            transition: all 0.3s; border: none; font-family: inherit; font-size: 14px;
        }
        .btn-prev { background: transparent; color: var(--text-secondary); border: 1px solid var(--border); }
        .btn-prev:hover { background: rgba(255,255,255,0.05); }
        .btn-next { background: var(--gradient-accent); color: var(--primary); box-shadow: 0 10px 20px rgba(34, 211, 238, 0.3); }
        .btn-next:hover { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(34, 211, 238, 0.4); }
        .btn-send { background: #25d366; color: white; width: 100%; margin-top: 20px; }

        /* FOOTER */
        .footer { text-align: center; margin-top: 60px; color: var(--text-secondary); font-size: 12px; }

        @media (max-width: 600px) {
            .grid-options { grid-template-columns: 1fr; }
            .header h1 { font-size: 32px; }
            .form-wrapper { padding: 25px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <div class="logo">AETHER<span>ENGINE</span></div>
            <h1>B2B Partner Program</h1>
            <p>Integre a inteligência preditiva do Gabaritou no seu ecossistema. 100% White Label. 100% Escalável.</p>
        </header>

        <div class="form-wrapper">
            <div class="progress-bar">
                <div class="step-dot active" data-step="1">1</div>
                <div class="step-dot" data-step="2">2</div>
                <div class="step-dot" data-step="3">3</div>
                <div class="step-dot" data-step="4">4</div>
            </div>

            <form id="b2bForm">
                <!-- STEP 1: NICHO -->
                <div class="form-step active" id="step1">
                    <div class="step-title">Qual é o seu nicho?</div>
                    <div class="step-desc">Selecione o mercado onde deseja aplicar a predição.</div>
                    <div class="grid-options">
                        <div class="option-card" onclick="selectOption('niche', 'Concursos Públicos', this)">
                            <span>🏛️ Concursos</span>
                        </div>
                        <div class="option-card" onclick="selectOption('niche', 'ENEM / Vestibulares', this)">
                            <span>🎓 ENEM</span>
                        </div>
                        <div class="option-card" onclick="selectOption('niche', 'OAB / Exames', this)">
                            <span>⚖️ OAB</span>
                        </div>
                        <div class="option-card" onclick="selectOption('niche', 'Outros / Corporativo', this)">
                            <span>🚀 Outros</span>
                        </div>
                    </div>
                </div>

                <!-- STEP 2: ESCALA -->
                <div class="form-step" id="step2">
                    <div class="step-title">Volume de Alunos</div>
                    <div class="step-desc">Quantos alunos serão impactados pela Aether Engine?</div>
                    <div class="form-group">
                        <label>Número aproximado de alunos ativos</label>
                        <select id="aluno_count" onchange="toggleOtherStudents(this)">
                            <option value="0-500">Até 500 alunos</option>
                            <option value="500-5000">500 a 5.000 alunos</option>
                            <option value="5000-20000">5.000 a 20.000 alunos</option>
                            <option value="20000-100000">20.000 a 100.000 alunos</option>
                            <option value="100000-300000">100.000 a 300.000 alunos</option>
                            <option value="300000+">Acima de 300.000 alunos</option>
                            <option value="outros">Outros (especificar)</option>
                        </select>
                    </div>
                    <div class="form-group" id="other_students_group" style="display:none;">
                        <label>Especifique o número de alunos</label>
                        <input type="text" id="other_students_val" placeholder="Ex: 50.000 alunos">
                    </div>
                    <div class="form-group">
                        <label>Nome da Instituição / Empresa</label>
                        <input type="text" id="company_name" placeholder="Ex: Cursinho Gabarita Tudo">
                    </div>
                </div>

                <!-- STEP 3: TECNOLOGIA -->
                <div class="form-step" id="step3">
                    <div class="step-title">Nível de Integração</div>
                    <div class="step-desc">Como você deseja usar nossa tecnologia?</div>
                    <div class="grid-options">
                        <div class="option-card" onclick="selectOption('integration', 'API Rest (Backend)', this)">
                            <span>🔌 API Rest</span>
                        </div>
                        <div class="option-card" onclick="selectOption('integration', 'White Label (Frontend)', this)">
                            <span>🏷️ White Label</span>
                        </div>
                    </div>
                    <div class="form-group" style="margin-top: 20px;">
                        <label>Recursos Necessários</label>
                        <textarea id="requirements" placeholder="Ex: Predição de banca, simulador de nota de corte..."></textarea>
                    </div>
                </div>

                <!-- STEP 4: CONTATO -->
                <div class="form-step" id="step4">
                    <div class="step-title">Finalizar Qualificação</div>
                    <div class="step-desc">Insira seus dados para receber o orçamento do Setup Fee e documentação da API.</div>
                    <div class="form-group">
                        <label>Seu Nome</label>
                        <input type="text" id="user_name" placeholder="Seu nome completo">
                    </div>
                    <div class="form-group">
                        <label>E-mail Corporativo</label>
                        <input type="email" id="user_email" placeholder="email@empresa.com.br">
                    </div>
                    <div class="form-group">
                        <label>WhatsApp (Opcional)</label>
                        <input type="text" id="user_phone" placeholder="+55 ...">
                    </div>
                    <button type="button" class="btn btn-send" onclick="sendWhatsApp()">SOLICITAR ORÇAMENTO VIA WHATSAPP</button>
                    <div class="dm-note" style="text-align:center; font-size:11px; margin-top:10px; color:var(--text-secondary)">Ao clicar, os dados serão formatados para envio imediato ao nosso setor comercial.</div>
                </div>

                <div class="nav-buttons">
                    <button type="button" class="btn btn-prev" id="prevBtn" onclick="nextStep(-1)" style="display:none;">Voltar</button>
                    <button type="button" class="btn btn-next" id="nextBtn" onclick="nextStep(1)">Continuar</button>
                </div>
            </form>
        </div>

        <footer class="footer">
            <p>© ${new Date().getFullYear()} Gabaritou - Aether Engine v3.2. Todos os direitos reservados.</p>
            <p>Powered by MiroFish Swarm Intelligence.</p>
        </footer>
    </div>

    <script>
        let currentStep = 1;
        const selections = { niche: '', integration: '' };

        function selectOption(key, val, el) {
            selections[key] = val;
            const cards = el.parentElement.querySelectorAll('.option-card');
            cards.forEach(c => c.classList.remove('selected'));
            el.classList.add('selected');
        }

        function nextStep(n) {
            const steps = document.querySelectorAll('.form-step');
            const dots = document.querySelectorAll('.step-dot');
            
            // Validate
            if (n === 1 && currentStep === 1 && !selections.niche) return alert('Selecione um nicho.');
            if (n === 1 && currentStep === 3 && !selections.integration) return alert('Selecione a integração.');

            steps[currentStep-1].classList.remove('active');
            dots[currentStep-1].classList.remove('active');
            dots[currentStep-1].classList.add('done');

            currentStep += n;

            steps[currentStep-1].classList.add('active');
            dots[currentStep-1].classList.add('active');

            document.getElementById('prevBtn').style.display = currentStep === 1 ? 'none' : 'block';
            document.getElementById('nextBtn').style.display = currentStep === 4 ? 'none' : 'block';
        }

        function toggleOtherStudents(el) {
            document.getElementById('other_students_group').style.display = el.value === 'outros' ? 'block' : 'none';
        }

        function sendWhatsApp() {
            const company = document.getElementById('company_name').value;
            const studentsSelect = document.getElementById('aluno_count').value;
            const studentsOther = document.getElementById('other_students_val').value;
            const students = studentsSelect === 'outros' ? studentsOther : studentsSelect;
            
            const requirements = document.getElementById('requirements').value;
            const name = document.getElementById('user_name').value;
            const email = document.getElementById('user_email').value;
            const phone = document.getElementById('user_phone').value;

            if (!name || !email) return alert('Por favor, preencha seu nome e e-mail corporativo.');

            const msg = \`*NOVA QUALIFICAÇÃO B2B — AETHER ENGINE*%0A%0A\` +
                      \`*DADOS DO PARCEIRO:*%0A\` +
                      \`• *Nome:* \${name}%0A\` +
                      \`• *E-mail:* \${email}%0A\` +
                      \`• *Empresa:* \${company}%0A\` +
                      \`• *Nicho:* \${selections.niche}%0A\` +
                      \`• *Alunos:* \${students}%0A%0A\` +
                      \`*TECNOLOGIA:*%0A\` +
                      \`• *Integração:* \${selections.integration}%0A\` +
                      \`• *Requisitos:* \${requirements}%0A%0A\` +
                      \`*CONTATO:*%0A\` +
                      \`• *WhatsApp:* \${phone || 'Não informado'}%0A%0A\` +
                      \`_Formulário gerado pelo Gabaritou v3.2_\`;

            window.open(\`https://wa.me/5591988674047?text=\${msg}\`, '_blank');
        }
    </script>
</body>
</html>
  `;
}
