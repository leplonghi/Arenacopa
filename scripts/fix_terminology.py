#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Replace 'mercado' → 'desafio' in i18n value strings only."""

import re
import json

def replace_mercado_in_values(text):
    """Replace mercado/mercados in JSON value strings, not keys."""
    # Process line by line for safety
    lines = text.split('\n')
    new_lines = []
    for line in lines:
        # Only replace inside quoted strings (values)
        # Keys look like: "key": "value"
        # We'll find quoted strings and replace inside them
        # Simple approach: replace mercado in the whole line (keys don't contain mercado in our files)
        new_line = line.replace('mercado', 'desafio').replace('Mercado', 'Desafio').replace('mercados', 'desafios').replace('Mercados', 'Desafios')
        new_lines.append(new_line)
    return '\n'.join(new_lines)

files = [
    'public/locales/pt-BR/bolao.json',
    'public/locales/es/bolao.json',
    'public/locales/en/bolao.json',
]

for path in files:
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()
    new_text = replace_mercado_in_values(text)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_text)
    changes = sum(1 for a, b in zip(text, new_text) if a != b)
    print(f"{path}: {changes} chars changed")

print("Done.")
