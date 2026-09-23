# PoliPrint — PRD

## Problema original
"Veja meu projeto e faça melhorias super inovadoras e me surpreenda com um design melhor, quero um nível elevado nesse projeto e acrescente automação para ir mensagem direta ao WhatsApp, quero um app pro. Esse meu app está com o código todo em Javascript."

App original: React Native (single-file) de gestão de assistência de impressoras "PoliPrint", com dados em memória e WhatsApp por link manual.

## Escolhas do usuário
- Plataforma: React Native / Expo (mesma base gera APK depois). Roda em Web para preview.
- WhatsApp: automático (Twilio) + link inteligente (wa.me) — as duas coisas.
- Banco de dados: persistente (MongoDB).
- Login: cadastro real de usuários com login seguro (JWT).
- Visual: azul e branco com degradês → tema navy profundo + ciano PRO.

## Arquitetura
- Frontend: Expo SDK 51 (react-native-web), navegação por stack próprio, expo-linear-gradient, AsyncStorage, axios. Porta 3000 via `expo start --web`.
- Backend: FastAPI + Motor (MongoDB), JWT (bcrypt + pyjwt), Twilio WhatsApp.
- Rotas backend sob prefixo /api.

## Personas / Perfis
- Cliente: abre chamados, pede suprimentos, bate ponto, acompanha chamados.
- Técnico: fila de chamados, assume/finaliza, navegação GPS, WhatsApp, ponto.
- Estoque: fila FIFO de pedidos, entrega, comprovante A4, gerenciar catálogo/estoque, ponto.
- GOD (Diretoria): relatórios gerais, banco de ponto, acessa todos os painéis, status da automação WhatsApp.

## Implementado (2026-09)
- Auth JWT (register/login/me) com roles + seed GOD.
- CRUD Chamados, Pedidos, Catálogo/Estoque (com baixa), Pontos.
- WhatsApp: envio automático via Twilio (graceful) + geração de links wa.me; notifica equipe/cliente nos eventos.
- Dashboard/stats. Design PRO navy+ciano com degradês, timeline, métricas, badges.
- App Expo rodando em web (preview) e pronto para build Android (APK).

## Backlog / Próximos
- P1: Configurar credenciais Twilio para ativar envio automático real.
- P1: Upload real de foto (expo-image-picker) no chamado e no ponto.
- P2: Push notifications, filtros/serch no histórico, exportar relatórios PDF.
- P2: Edição de perfil e gestão de usuários pelo GOD.
