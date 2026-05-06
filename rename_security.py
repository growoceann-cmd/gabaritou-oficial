
import os
import json
import re

# Lista completa e exata baseada no list anterior
SECURITY_AGENTS = [
    "Red-Team-Lead",
    "Vuln-Analyst",
    "Eng.-Social",
    "Exploit-Dev",
    "Sec-Metrics",
    "IR_Analyst",
    "SecEng",
    "Forense-Digital",
    "Threat_Intel",
    "GRC-Specialist",
    "Purple_Coord",
    "AppSec-Specialist",
    "CloudSec-Specialist",
    "SOC-Analyst-L1",
    "SOC-Analyst-L2"
]

BASE_PATH = r"C:\Users\User\.accio\accounts\1754794383\agents"
RENAMED_COUNT = 0

for folder_suffix in SECURITY_AGENTS:
    folder_name = f"MID-GABARITOU-{folder_suffix}"
    path = os.path.join(BASE_PATH, folder_name)
    
    if os.path.exists(path):
        profile_path = os.path.join(path, "profile.jsonc")
        if os.path.exists(profile_path):
            with open(profile_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            # Extrair o nome atual do agente
            match = re.search(r'"name":\s*"(.*?)"', content)
            if match:
                current_name = match.group(1)
                # Remove (G) ou (S) se já existir e coloca (S)
                clean_name = current_name.replace(" (G)", "").replace(" (S)", "")
                new_name = f"{clean_name} (S)"
                
                new_content = re.sub(r'"name":\s*".*?"', f'"name": "{new_name}"', content)
                
                with open(profile_path, "w", encoding="utf-8") as f:
                    f.write(new_content)
                RENAMED_COUNT += 1

print(f"Sucesso: {RENAMED_COUNT} agentes de segurança atualizados com o sufixo (S).")
