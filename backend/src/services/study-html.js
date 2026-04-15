/**
 * Serviço de Geração de HTML Portátil para Estudos.
 * Permite que o aluno estude no PC com uma interface rica e offline-friendly.
 * 
 * Gabaritou v3.1 - Strategic Study Layer
 */

import fs from 'fs';
import path from 'path';

/**
 * Gera o conteúdo HTML completo para uma sessão de estudo/simulado.
 * 
 * @param {Object} data - Dados da sessão (questões, banca, matéria, etc.)
 * @returns {string} HTML completo
 */
export function generateStudyHTML(data) {
  const { 
    userId, 
    userName = 'Estudante', 
    banca = 'CEBRASPE', 
    materia = 'Geral', 
    questoes = [], 
    tempoLimite = 60,
    sessionId = `sess_${Date.now()}`
  } = data;

  const questionsJSON = JSON.stringify(questoes);

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gabaritou | Sessão de Estudo Portátil</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #0a0a0c;
            --card: #141417;
            --primary: #8b5cf6;
            --secondary: #06b6d4;
            --text: #f4f4f5;
            --text-muted: #a1a1aa;
            --neon: #22d3ee;
            --gold: #fbbf24;
            --success: #10b981;
            --danger: #ef4444;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--bg);
            color: var(--text);
            line-height: 1.6;
            overflow-x: hidden;
        }

        .container { max-width: 900px; margin: 0 auto; padding: 40px 20px; }

        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 1px solid #27272a;
        }

        .logo { font-size: 24px; font-weight: 800; display: flex; align-items: center; gap: 10px; }
        .logo span { background: linear-gradient(135deg, var(--primary), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

        .session-info { text-align: right; }
        .session-info h2 { font-size: 14px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
        .session-info p { font-size: 18px; font-weight: 700; color: var(--neon); }

        .timer-card {
            background: var(--card);
            padding: 15px 25px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 15px;
            position: sticky;
            top: 20px;
            z-index: 100;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            border: 1px solid #27272a;
            margin-bottom: 30px;
        }
        .timer-val { font-size: 24px; font-weight: 800; color: var(--gold); font-variant-numeric: tabular-nums; }

        .question-card {
            background: var(--card);
            padding: 30px;
            border-radius: 20px;
            margin-bottom: 24px;
            border: 1px solid #27272a;
            transition: transform 0.2s, border-color 0.2s;
        }
        .question-card:hover { border-color: var(--primary); }

        .q-header { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .q-num { background: #27272a; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; color: var(--text-muted); }
        .q-tag { font-size: 12px; color: var(--secondary); font-weight: 600; text-transform: uppercase; }

        .q-text { font-size: 18px; font-weight: 600; margin-bottom: 25px; color: var(--text); }

        .options { display: flex; flex-direction: column; gap: 12px; }
        .option {
            background: #1c1c1f;
            padding: 15px 20px;
            border-radius: 12px;
            cursor: pointer;
            border: 2px solid transparent;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .option:hover { background: #27272a; border-color: #3f3f46; }
        .option.selected { background: rgba(139, 92, 246, 0.1); border-color: var(--primary); }
        .option-letter { 
            width: 30px; height: 30px; background: #27272a; 
            display: flex; align-items: center; justify-content: center; 
            border-radius: 8px; font-weight: 800; font-size: 14px;
        }
        .option.selected .option-letter { background: var(--primary); color: white; }

        .actions { margin-top: 50px; text-align: center; }
        .btn {
            padding: 16px 40px;
            border-radius: 50px;
            font-size: 16px;
            font-weight: 800;
            cursor: pointer;
            border: none;
            transition: all 0.3s;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .btn-primary { background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; box-shadow: 0 10px 25px rgba(139, 92, 246, 0.3); }
        .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 15px 35px rgba(139, 92, 246, 0.5); }

        /* Result Modal */
        #result-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); backdrop-filter: blur(10px);
            display: none; align-items: center; justify-content: center; z-index: 1000;
        }
        .result-card {
            background: var(--card); padding: 50px; border-radius: 30px;
            max-width: 500px; width: 90%; text-align: center; border: 1px solid var(--primary);
        }
        .result-score { font-size: 72px; font-weight: 900; color: var(--neon); margin: 20px 0; }
        .result-msg { font-size: 20px; color: var(--text-muted); margin-bottom: 30px; }

        @media (max-width: 600px) {
            .container { padding: 20px; }
            .q-text { font-size: 16px; }
            header { flex-direction: column; text-align: center; gap: 20px; }
            .session-info { text-align: center; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div class="logo">🎯 <span>Gabaritou</span></div>
            <div class="session-info">
                <h2>Sessão de Estudos</h2>
                <p id="materia-display">${banca} | ${materia}</p>
            </div>
        </header>

        <div class="timer-card">
            <div style="font-size: 24px;">⏱️</div>
            <div class="timer-val" id="timer">00:00</div>
            <div style="color: var(--text-muted); font-size: 12px; font-weight: 600;">TEMPO RESTANTE</div>
        </div>

        <div id="questions-container">
            <!-- Questoes injetadas aqui -->
        </div>

        <div class="actions">
            <button class="btn btn-primary" onclick="finishSession()">Finalizar e Ver Resultado</button>
        </div>
    </div>

    <div id="result-overlay">
        <div class="result-card">
            <h2>🎯 Resultado Final</h2>
            <div class="result-score" id="final-score">0%</div>
            <p class="result-msg" id="final-msg">Incrível! Você está no caminho da aprovação.</p>
            
            <div style="background: #1c1c1f; padding: 20px; border-radius: 15px; margin-bottom: 25px; text-align: left;">
                <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">CÓDIGO DE SINCRONIZAÇÃO</p>
                <code id="sync-code" style="color: var(--neon); font-family: monospace; font-size: 16px; font-weight: 800; word-break: break-all;">GAB-XXXX-XXXX</code>
            </div>

            <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 25px;">
                Envie este código para o Bot no Telegram para salvar seu progresso.
            </p>

            <button class="btn btn-primary" onclick="window.close()">Fechar Sessão</button>
        </div>
    </div>

    <script>
        const questions = ${questionsJSON};
        const userAnswers = {};
        let timeLeft = ${tempoLimite * 60};
        
        function renderQuestions() {
            const container = document.getElementById('questions-container');
            container.innerHTML = questions.map((q, i) => \`
                <div class="question-card" id="q-card-\${i}">
                    <div class="q-header">
                        <span class="q-num">QUESTÃO \${i + 1}</span>
                        <span class="q-tag">\${q.topico || 'Geral'}</span>
                    </div>
                    <div class="q-text">\${q.enunciado}</div>
                    <div class="options">
                        \${q.alternativas.map(alt => \`
                            <div class="option" onclick="selectOption(\${i}, '\${alt.letra}')" id="opt-\${i}-\${alt.letra}">
                                <div class="option-letter">\${alt.letra}</div>
                                <div class="option-text">\${alt.texto}</div>
                            </div>
                        \`).join('')}
                    </div>
                </div>
            \`).join('');
        }

        function selectOption(qIdx, letter) {
            userAnswers[qIdx] = letter;
            
            // UI Update
            const options = document.querySelectorAll(\`#q-card-\${qIdx} .option\`);
            options.forEach(opt => opt.classList.remove('selected'));
            document.getElementById(\`opt-\${qIdx}-\${letter}\`).classList.add('selected');
        }

        function startTimer() {
            const display = document.getElementById('timer');
            const interval = setInterval(() => {
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                display.innerText = \`\${String(minutes).padStart(2, '0')}:\${String(seconds).padStart(2, '0')}\`;
                
                if (timeLeft <= 0) {
                    clearInterval(interval);
                    finishSession();
                }
                timeLeft--;
            }, 1000);
        }

        function finishSession() {
            let correctCount = 0;
            questions.forEach((q, i) => {
                if (userAnswers[i] === q.resposta_correta) {
                    correctCount++;
                }
            });

            const score = Math.round((correctCount / questions.length) * 100);
            
            // Show result
            document.getElementById('final-score').innerText = \`\${score}%\`;
            document.getElementById('result-overlay').style.display = 'flex';
            
            // Generate simple sync code (Base64 simulated)
            const syncData = {
                s: '${sessionId}',
                u: '${userId}',
                c: correctCount,
                t: questions.length,
                p: score
            };
            const code = 'GAB-' + btoa(JSON.stringify(syncData)).substring(0, 16).toUpperCase();
            document.getElementById('sync-code').innerText = code;
        }

        window.onload = () => {
            renderQuestions();
            startTimer();
        };
    </script>
</body>
</html>
  `;
}
