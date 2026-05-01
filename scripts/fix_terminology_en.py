#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Replace 'market' → 'challenge' in EN i18n value strings."""

import re

with open('public/locales/en/bolao.json', 'r', encoding='utf-8') as f:
    text = f.read()

new_text = text.replace('market', 'challenge').replace('Market', 'Challenge').replace('markets', 'challenges').replace('Markets', 'Challenges')

with open('public/locales/en/bolao.json', 'w', encoding='utf-8') as f:
    f.write(new_text)

changes = sum(1 for a, b in zip(text, new_text) if a != b)
print(f"EN: {changes} chars changed")
