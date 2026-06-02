# ArenaCopa — Instruções para Agentes de IA

Este arquivo é lido automaticamente por Claude Code, Codex e ferramentas compatíveis.
**Siga estas regras em toda sessão, sem exceções.**

---

## Regra de Ouro: Git

> **Nunca commite direto em `main`. Nunca force-push. Nunca delete branches sem confirmar.**

### Fluxo obrigatório

```
main (origem/produção)
  └── feat/<nome-curto>   ← crie aqui, trabalhe aqui
        └── PR → merge → delete branch
```

1. **Sempre comece com `git pull origin main`** antes de criar um branch novo
2. **Nomeie branches como** `feat/`, `fix/`, `chore/` + descrição curta em inglês
3. **Depois do merge**, delete o branch local e remoto
4. **Nunca trabalhe em branches de outra ferramenta** (ex: branch criado pelo Codex, não mexa pelo Claude sem avisar o usuário)

### Estado atual dos branches (atualizar ao finalizar cada sessão)

| Branch | Propósito | Status |
|---|---|---|
| `main` | Produção — segue `origin/main` | ✅ Limpo |
| `feat/nav-bolao-news-fixes` | CSP + nav mobile + 3h buffer | 🔵 Aberto, aguarda PR merge |
| `feat/campaign-system-backend` | 13 Cloud Functions de campanha deployadas | 🟡 Backup — aguarda integração ao main |

---

## Stack do Projeto

- **Frontend**: React 18 + Vite + TypeScript + Tailwind + shadcn/ui
- **Backend**: Firebase (Hosting + Firestore + Cloud Functions Node.js)
- **Pagamentos**: Stripe (checkout, produtos, webhooks)
- **Auth**: Firebase Auth + Capacitor (Android/iOS)
- **Testes**: Vitest (frontend), Jest (functions)

## Comandos Úteis

```bash
# Sincronizar com produção antes de qualquer trabalho
git checkout main && git pull origin main

# Criar branch de feature
git checkout -b feat/minha-feature

# Rodar app localmente
npm run dev

# Rodar testes frontend
npx vitest run

# Rodar testes de functions
cd functions && node --test test/<arquivo>.test.js

# Deploy hosting (frontend)
npm run build && firebase deploy --only hosting

# Deploy function específica
firebase deploy --only functions:<nomeDaFunction>
```

## Contexto do Projeto

ArenaCopa é uma plataforma de bolões esportivos com:
- Bolões públicos e privados com palpites por partida
- Sistema de ranking e premiação
- Grupos de usuários
- ArenaTV (conteúdo de vídeo)
- Sistema de campanhas comerciais (em desenvolvimento)
- App Android nativo via Capacitor

## Avisos Importantes

- O `src/` do frontend existe **somente em `origin/main`** — nunca em branches criados do zero
- As 13 Cloud Functions de campanha estão em `feat/campaign-system-backend` e já deployadas — ainda precisam ser integradas ao `origin/main`
- A CSP do `firebase.json` em `origin/main` é a política real de produção — edite com cuidado
- Stripe keys ficam em `.env` (ignorado pelo git) — nunca commitar
