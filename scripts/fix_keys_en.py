#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import re

with open('public/locales/en/bolao.json', 'r', encoding='utf-8') as f:
    text = f.read()

replacements = [
    ('challenge_pulse_kicker', 'market_pulse_kicker'),
    ('challenge_pulse_title', 'market_pulse_title'),
    ('challenge_help_aria', 'market_help_aria'),
    ('extra_challenge_label', 'extra_market_label'),
    ('challenge_updated_desc', 'market_updated_desc'),
    ('more_challenges', 'more_markets'),
    ('challenge_short', 'market_short'),
    ('default_challenges', 'default_markets'),
    ('challenges_title', 'markets_title'),
    ('challenges_desc', 'markets_desc'),
    ('challenges_count', 'markets_count'),
    ('active_challenges', 'active_markets'),
    ('save_challenge', 'save_market'),
    ('save_challenge_error', 'save_market_error'),
    ('resolve_challenge_error', 'resolve_market_error'),
    ('challenge_closes_desc', 'market_closes_desc'),
    ('active_challenge_title', 'active_market_title'),
    ('active_challenge_desc', 'active_market_desc'),
    ('active_challenges_count', 'active_markets_count'),
    ('rule_active_challenges', 'rule_active_markets'),
    ('stats_challenges_sub', 'stats_markets_sub'),
]

def fix_keys(text):
    lines = text.split('\n')
    new_lines = []
    for line in lines:
        new_line = line
        for new_key, old_key in replacements:
            pattern = rf'"{re.escape(new_key)}":'
            replacement = rf'"{old_key}":'
            new_line = re.sub(pattern, replacement, new_line)
        new_lines.append(new_line)
    return '\n'.join(new_lines)

new_text = fix_keys(text)
with open('public/locales/en/bolao.json', 'w', encoding='utf-8') as f:
    f.write(new_text)

print('EN keys fixed')
