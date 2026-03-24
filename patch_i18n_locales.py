import json, os

base = r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\public\locales'

# ── NEW noticias keys per language ──────────────────────────────────────────
noticias_new = {
    'pt-BR': {
        "priority_team": "Prioridade do seu time",
        "priority_summary_fallback": "Notícia destacada para o seu time favorito.",
        "open_source": "Abrir fonte",
        "read_source": "Ler na fonte",
        "summary_fallback": "Notícia disponível na fonte original.",
        "date_unknown": "Data não informada",
        "categories": {
            "all": "Todas",
            "general": "Geral",
            "matches": "Partidas",
            "teams": "Seleções",
            "travel": "Turismo",
            "tickets": "Ingressos"
        }
    },
    'en': {
        "priority_team": "Your team's spotlight",
        "priority_summary_fallback": "Featured news for your favorite team.",
        "open_source": "Open source",
        "read_source": "Read more",
        "summary_fallback": "News available at the original source.",
        "date_unknown": "Date unavailable",
        "categories": {
            "all": "All",
            "general": "General",
            "matches": "Matches",
            "teams": "Teams",
            "travel": "Travel",
            "tickets": "Tickets"
        }
    },
    'es': {
        "priority_team": "Prioridad de tu equipo",
        "priority_summary_fallback": "Noticia destacada para tu equipo favorito.",
        "open_source": "Abrir fuente",
        "read_source": "Leer más",
        "summary_fallback": "Noticia disponible en la fuente original.",
        "date_unknown": "Fecha no informada",
        "categories": {
            "all": "Todas",
            "general": "General",
            "matches": "Partidos",
            "teams": "Selecciones",
            "travel": "Turismo",
            "tickets": "Entradas"
        }
    }
}

# ── NEW home keys per language ───────────────────────────────────────────────
home_new = {
    'pt-BR': {
        "my_pools": {
            "members": "{{count}} membros"
        },
        "hero": {
            "default_name": "Torcedor"
        },
        "upcoming": {
            "match_aria": "Ver detalhes: {{home}} vs {{away}}"
        }
    },
    'en': {
        "my_pools": {
            "members": "{{count}} members"
        },
        "hero": {
            "default_name": "Fan"
        },
        "upcoming": {
            "match_aria": "Match details: {{home}} vs {{away}}"
        }
    },
    'es': {
        "my_pools": {
            "members": "{{count}} miembros"
        },
        "hero": {
            "default_name": "Aficionado"
        },
        "upcoming": {
            "match_aria": "Detalles del partido: {{home}} vs {{away}}"
        }
    }
}

def deep_merge(base_dict, updates):
    """Merge updates into base_dict recursively."""
    for k, v in updates.items():
        if k in base_dict and isinstance(base_dict[k], dict) and isinstance(v, dict):
            deep_merge(base_dict[k], v)
        else:
            base_dict[k] = v

for lang in ['pt-BR', 'en', 'es']:
    # --- copa.json: add noticias section ---
    copa_path = os.path.join(base, lang, 'copa.json')
    with open(copa_path, encoding='utf-8') as f:
        copa = json.load(f)
    copa['noticias'] = noticias_new[lang]
    with open(copa_path, 'w', encoding='utf-8') as f:
        json.dump(copa, f, ensure_ascii=False, indent=2)
    print(f'Updated copa.json [{lang}]')

    # --- home.json: add missing keys (merge) ---
    home_path = os.path.join(base, lang, 'home.json')
    with open(home_path, encoding='utf-8') as f:
        home = json.load(f)
    deep_merge(home, home_new[lang])
    with open(home_path, 'w', encoding='utf-8') as f:
        json.dump(home, f, ensure_ascii=False, indent=2)
    print(f'Updated home.json [{lang}]')

print('All locale files updated.')
