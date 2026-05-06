
import os
import json
import shutil

# Lista exata dos 11 snipers de segurança exigidos pelo Glawber
SECURITY_11 = [
    {"name": "Red Team Lead", "spec": "Exploração controlada cloud/infra BR, Bypass OAuth2/JWT APIs AWS/GCP, Simulação PIX/Open Banking"},
    {"name": "Vuln Analyst", "spec": "Gestão superfície ataque, Correlação CVE/CWE SBOM (SPDX) + Sigstore, Priorização CVSS 4.0"},
    {"name": "Eng. Social", "spec": "Simulação e mitigação vetores humanos, Phishing BR deepfake controlado, Análise UEBA"},
    {"name": "Exploit Dev", "spec": "Desenvolvimento e contenção PoCs, Exploits Rust/Go sandboxing, Validação matriz impacto BCB"},
    {"name": "Sec Metrics", "spec": "Otimização métricas SOC/Red Team, MTTD/MTTR modelagem bayesiana, Redução false positives"},
    {"name": "IR Analyst", "spec": "Contenção, erradicação e notificação, Isolamento ransomware Zero Trust, Playbooks ANPD"},
    {"name": "SecEng", "spec": "Arquitetura defesa nativa código/infra, Zero Trust SASE/mTLS, IaC scanning (Checkov)"},
    {"name": "Forense Digital", "spec": "Coleta, análise e validação jurídica, Artefatos voláteis serverless, Provas tribunais"},
    {"name": "Threat Intel", "spec": "Inteligência estratégica ecossistema BR, IOCs/TTPs dark web BR, Modelagem fintechs BCB"},
    {"name": "GRC Specialist", "spec": "Governança, risco e compliance contínuo, Mapeamento ISO 27001/NIST/LGPD, Automação auditorias"},
    {"name": "Purple Coord", "spec": "Orquestração red/blue contínuo, BAS automatizado, Gap analysis ATT&CK"}
]

BASE_PATH = r"C:\Users\User\.accio\accounts\1754794383\agents"
AVATAR_SRC = os.path.join(BASE_PATH, "MID-21794383U1776038-7B23DB-4158-11B765", "avatar.png")
USER_MD_SRC = os.path.join(BASE_PATH, "MID-21794383U1776038-7B23DB-4158-11B765", "agent-core", "USER.md")

CREATED_COUNT = 0

for agent in SECURITY_11:
    folder_name = f"MID-GABARITOU-{agent['name'].replace(' ', '-').replace('.', '-')}"
    agent_path = os.path.join(BASE_PATH, folder_name)
    
    # Criar diretórios se não existirem
    os.makedirs(os.path.join(agent_path, "agent-core"), exist_ok=True)
    os.makedirs(os.path.join(agent_path, "project"), exist_ok=True)
    os.makedirs(os.path.join(agent_path, "skills"), exist_ok=True)
    
    # profile.jsonc (Sempre sobrescrever para garantir o nome (S))
    profile = {
        "id": folder_name,
        "accountId": "1754794383",
        "name": f"{agent['name']} (S)",
        "avatar": "avatar.png",
        "description": agent['spec'],
        "toolPreset": "full",
        "runtime": "local",
        "creator": "user",
        "model": {"provider": "auto", "name": "auto"},
        "defaultProject": {"dir": os.path.join(agent_path, "project")},
        "createdAt": "2026-04-27T19:18:03.000Z",
        "updatedAt": "2026-04-27T19:18:03.000Z",
        "agentType": "general"
    }
    with open(os.path.join(agent_path, "profile.jsonc"), "w", encoding="utf-8") as f:
        json.dump(profile, f, indent=2, ensure_ascii=False)
        
    # SOUL.md
    soul_content = f"# SOUL.md - {agent['name']} (S)\n\n## Quem Sou Eu\nEspecialista de Segurança (S) focado em: {agent['spec']}.\n\n## Tom de Voz\nFrio, técnico, militar e focado estritamente em segurança.\n\n## Especialidade Rígida\n{agent['spec']}\n\n## Fronteiras\nRespondo apenas sobre segurança cibernética. Assuntos fora de domínio serão ignorados.\n"
    with open(os.path.join(agent_path, "agent-core", "SOUL.md"), "w", encoding="utf-8") as f:
        f.write(soul_content)
        
    # SKILL.md
    skill_content = f"# SKILL.md - {agent['name']} (S)\n\n## Habilidades de Segurança\n- {agent['spec'].replace(', ', '\n- ')}\n"
    with open(os.path.join(agent_path, "skills", "SKILL.md"), "w", encoding="utf-8") as f:
        f.write(skill_content)

    # Copiar recursos básicos
    if os.path.exists(AVATAR_SRC):
        shutil.copy2(AVATAR_SRC, os.path.join(agent_path, "avatar.png"))
    if os.path.exists(USER_MD_SRC):
        shutil.copy2(USER_MD_SRC, os.path.join(agent_path, "agent-core", "USER.md"))
        
    CREATED_COUNT += 1

print(f"Sucesso: Os {CREATED_COUNT} snipers de segurança foram criados/atualizados com (S).")
