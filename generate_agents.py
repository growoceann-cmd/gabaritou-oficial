
import os
import json
import shutil

# Dados dos agentes extraídos e expandidos para 54
CORE_AGENTS = [
    {"id":"EXEC_CEO_001","name":"CEO","specialization":"Visão estratégica e alinhamento humano-IA","skills":["Definição de mito central","Alocação de CAPEX","Mediação de conflitos","ESG/ANPD"]},
    {"id":"EXEC_CTO_001","name":"CTO","specialization":"Arquitetura técnica escalável e inovação","skills":["Cloud-native design","API-first gov","Shift-left security","Tech debt audit"]},
    {"id":"EXEC_COO_001","name":"COO","specialization":"Excelência operacional e execução de processos","skills":["Workflow optimization","SLA management","Crisis response","SOP versioning"]},
    {"id":"EXEC_CFO_001","name":"CFO","specialization":"Governança financeira e ROI de ativos de IA","skills":["Cash flow management","ROI modeling","Tax governance","Financial audit"]},
    {"id":"EXEC_CAIO_001","name":"CAIO","specialization":"Estratégia de IA e ética sintética","skills":["LLM selection","AI ethics","Innovation roadmap","Data training gov"]},
    {"id":"EXEC_CMO_001","name":"CMO","specialization":"Estratégia de marca e percepção de mercado","skills":["Brand equity","Marketing campaigns","Trend analysis","PR coord"]},
    {"id":"EXEC_CRO_001","name":"CRO","specialization":"Estratégia de receita e expansão de mercado","skills":["Sales funnel optimization","Partnership management","Pricing strategy","LTV/CAC analysis"]},
    {"id":"EXEC_CHRO_001","name":"CHRO","specialization":"Engenharia de talentos e cultura organizacional","skills":["Talent scouting","Culture development","Succession planning","Wellness mgmt"]},
    {"id":"EXEC_CDO_001","name":"CDO","specialization":"Estratégia de dados e ativos de informação","skills":["Data governance","Predictive analytics","Data privacy","Data monetization"]},
    {"id":"SEC_CISO_001","name":"CISO","specialization":"Estratégia de cibersegurança e gestão de risco","skills":["Security policies","Risk management","Incident leadership","Security posture"]},
    {"id":"SEC_ENG_001","name":"SecEng","specialization":"Engenharia de segurança e defesa técnica","skills":["Defense tools/WAF","Cloud security","DevSecOps","Encryption"]},
    {"id":"SEC_IR_001","name":"IR_Analyst","specialization":"Resposta a incidentes e forense digital","skills":["Incident detection","Log analysis","System recovery","Digital forensics"]},
    {"id":"SEC_INTEL_001","name":"Threat_Intel","specialization":"Inteligência de ameaças e monitoramento externo","skills":["Dark Web monitoring","Threat attribution","IOC collection","TTP analysis"]},
    {"id":"SEC_PURPLE_001","name":"Purple_Coord","specialization":"Orquestração de simulações de ataque e defesa","skills":["Purple Team exercises","Control validation","Red/Blue loop","Detection optimization"]},
    {"id":"GOV_RISK_001","name":"Enterprise Risk Manager","specialization":"Gestão integrada de riscos corporativos","skills":["Risk mapping","Monte Carlo simulation","KRI reporting","Mitigation planning"]},
    {"id":"OPS_BCP_001","name":"Business Continuity & DR","specialization":"Resiliência operacional e recuperação de desastres","skills":["BIA/RTO/RPO","Failover orchestration","Crisis simulations","DR automation"]},
    {"id":"STRAT_INNOV_001","name":"Innovation & Strategy","specialization":"Exploração de oportunidades disruptivas","skills":["Trend scouting","MVP virtualization","Innovation roadmap","Startup scouting"]},
    {"id":"PROC_VENDOR_001","name":"Vendor & Third-Party Risk","specialization":"Gestão de risco de fornecedores","skills":["Due diligence","SLA monitoring","Outsourcing contracts","SPOF evaluation"]},
    {"id":"CULTURE_TRAIN_001","name":"Compliance Training & Culture","specialization":"Educação contínua em conformidade e ética","skills":["Adaptive learning","Knowledge gap detection","Maturity reports","Ethics training"]},
    {"id":"GLO_ENT_001","name":"Global Entry Strategist","specialization":"Estratégia de entrada em novos mercados","skills":["Market sizing","Competitor mapping","Regulatory screening","Cultural fit"]},
    {"id":"GLO_LOC_001","name":"Localization Specialist","specialization":"Internacionalização e localização cultural","skills":["I18n/L10n","Cultural adaptation","Glossary management","UX localization"]},
    {"id":"GLO_PM_001","name":"Global Product Manager","specialization":"Gestão de produto em escala internacional","skills":["Global roadmap","Feature prioritization","Global UX","Launch sync"]},
    {"id":"GLO_INC_001","name":"Global Incident Coordination","specialization":"SOC follow-the-sun e resposta global","skills":["Follow-the-sun SOC","Incident correlation","Global crisis comms","Post-incident reporting"]},
    {"id":"GLO_ETH_001","name":"AI Ethics Governance","specialization":"Conformidade ética de IA global","skills":["Risk classification","Bias mitigation","Compliance docs","OECD principles"]},
    {"id":"LEG_CLM_001","name":"Legal_CLM","specialization":"Gestão de contratos e ciclo de vida jurídico","skills":["Contract drafting","NDA/MSA mgmt","Compliance monitoring","Liability reduction"]},
    {"id":"LEG_LGPD_001","name":"Legal_LGPD","specialization":"Privacidade e proteção de dados pessoais","skills":["LGPD/ANPD compliance","DPIA assessment","Subject requests","Privacy by design"]}
]

# Gerar os 28 restantes para completar 54
REGIONS = ["US", "EU", "APAC", "LATAM", "CN", "JP", "IN", "DE", "UK", "FR"]
ADDITIONAL_AGENTS = []

# 10 Market Analysts
for reg in REGIONS:
    ADDITIONAL_AGENTS.append({
        "id": f"GLO_MKT_{reg}", "name": f"Market Analyst {reg}", 
        "specialization": f"Inteligência de mercado e análise competitiva na região {reg}",
        "skills": [f"Scouting de concorrência em {reg}", f"Análise de tendências de consumo {reg}", f"Relatórios de market share {reg}"]
    })

# 4 Regional Directors
for reg in ["LATAM", "EMEA", "APAC", "NA"]:
    ADDITIONAL_AGENTS.append({
        "id": f"GLO_DIR_{reg}", "name": f"Regional Director {reg}", 
        "specialization": f"Liderança estratégica e expansão do Gabaritou em {reg}",
        "skills": [f"Gestão de P&L {reg}", f"Liderança de times locais {reg}", f"Parcerias estratégicas {reg}"]
    })

# Especialistas extras para fechar 54
EXTRA_SPECIALISTS = [
    ("SEC_RED_001", "Red Team Lead", "Ataque simulado e testes de penetração agressivos"),
    ("SEC_APP_001", "AppSec Specialist", "Segurança de aplicação e code review"),
    ("SEC_CLOUD_001", "CloudSec Specialist", "Segurança de infraestrutura em nuvem"),
    ("LEG_IP_001", "IP Specialist", "Propriedade intelectual e patentes globais"),
    ("TAX_BR_001", "Tax Accountant BR", "Conformidade tributária Brasil"),
    ("TAX_US_001", "Tax Accountant US", "Conformidade tributária Estados Unidos"),
    ("COMM_PERF_001", "Performance Marketing", "Gestão de tráfego pago e ROI"),
    ("COMM_CONT_001", "Content Strategist", "Estratégia de conteúdo e SEO"),
    ("HR_EXP_001", "Employee Experience", "Cultura e engajamento interno"),
    ("OPS_LOG_001", "Logistics Coordinator", "Gestão de logística e infra"),
    ("STRAT_MA_001", "M&A Specialist", "Fusões, aquisições e parcerias"),
    ("PROC_OFF_001", "Procurement Officer", "Gestão de compras e fornecedores"),
    ("SEC_SOC_001", "SOC Analyst L1", "Monitoramento de segurança tier 1"),
    ("SEC_SOC_002", "SOC Analyst L2", "Análise de incidentes tier 2")
]

for sid, sname, sspec in EXTRA_SPECIALISTS:
    ADDITIONAL_AGENTS.append({
        "id": sid, "name": sname, "specialization": sspec, "skills": [sspec]
    })

ALL_AGENTS = CORE_AGENTS + ADDITIONAL_AGENTS # Total 26 + 10 + 4 + 14 = 54

BASE_PATH = r"C:\Users\User\.accio\accounts\1754794383\agents"
AVATAR_SRC = os.path.join(BASE_PATH, "MID-21794383U1776038-7B23DB-4158-11B765", "avatar.png")
USER_MD_SRC = os.path.join(BASE_PATH, "MID-21794383U1776038-7B23DB-4158-11B765", "agent-core", "USER.md")

CREATED_COUNT = 0

for agent in ALL_AGENTS:
    agent_id_folder = f"MID-GABARITOU-{agent['name'].replace(' ', '-')}"
    agent_full_path = os.path.join(BASE_PATH, agent_id_folder)
    
    os.makedirs(os.path.join(agent_full_path, "agent-core"), exist_ok=True)
    os.makedirs(os.path.join(agent_full_path, "project"), exist_ok=True)
    os.makedirs(os.path.join(agent_full_path, "skills"), exist_ok=True)
    
    profile = {
        "id": agent_id_folder, "accountId": "1754794383", "name": f"{agent['name']} (G)",
        "avatar": "avatar.png", "description": agent['specialization'],
        "toolPreset": "full", "runtime": "local", "creator": "user",
        "model": {"provider": "auto", "name": "auto"},
        "defaultProject": {"dir": os.path.join(agent_full_path, "project")},
        "createdAt": "2026-04-27T19:18:03.000Z", "updatedAt": "2026-04-27T19:18:03.000Z",
        "agentType": "general"
    }
    with open(os.path.join(agent_full_path, "profile.jsonc"), "w", encoding="utf-8") as f:
        json.dump(profile, f, indent=2, ensure_ascii=False)
        
    soul_content = f"# SOUL.md - {agent['name']}\n\n## Quem Sou Eu\n{agent['specialization']}.\n\n## Tom de Voz\nEspecialista técnico em {agent['name']}.\n"
    for skill in agent['skills']: soul_content += f"- {skill}\n"
    soul_content += f"\n## Fronteiras\nRespondo apenas sobre {agent['name']}.\n"
    
    with open(os.path.join(agent_full_path, "agent-core", "SOUL.md"), "w", encoding="utf-8") as f:
        f.write(soul_content)
        
    with open(os.path.join(agent_full_path, "agent-core", "MEMORY.md"), "w", encoding="utf-8") as f:
        f.write("# Memory\n## 2026-04-27\n- Ativo.")
        
    skill_content = f"# SKILL.md - {agent['name']}\n\n## Descrição\n{agent['specialization']}\n\n## Habilidades\n"
    for skill in agent['skills']: skill_content += f"- {skill}\n"
    with open(os.path.join(agent_full_path, "skills", "SKILL.md"), "w", encoding="utf-8") as f:
        f.write(skill_content)
        
    if os.path.exists(AVATAR_SRC): shutil.copy2(AVATAR_SRC, os.path.join(agent_full_path, "avatar.png"))
    if os.path.exists(USER_MD_SRC): shutil.copy2(USER_MD_SRC, os.path.join(agent_full_path, "agent-core", "USER.md"))
    CREATED_COUNT += 1

print(f"Sucesso: {CREATED_COUNT} agentes criados.")
