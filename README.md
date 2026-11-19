# Ponto — registro e controle de horas

App web (PWA) para registrar ponto pelo celular. Ele funciona **sem internet** e **sincroniza sozinho** quando a conexão volta.

- Registrar entrada, início e fim do intervalo e saída, com a hora corrigida pelo relógio do servidor
- Registros da semana, horas do dia e da semana, e banco de horas do mês
- Calendário com feriados nacionais automáticos e feriados próprios em 5 cores: federal, estadual, municipal, religioso e mundial
- Cadastro com regime, horário, intervalo (com validação pela CLT), dias de trabalho, salário, valor hora, reajuste por salário ou por valor hora e histórico salarial
- Tema claro e chumbo, com opção automática
- Backup em JSON

Não precisa de build, frameworks nem dependências: são só HTML, CSS e JavaScript.

## 1. Banco de dados (Supabase)

1. Crie um projeto em [supabase.com](https://supabase.com) (o plano gratuito basta).
2. Abra **SQL Editor › New query**, cole o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e clique em **Run**.
3. Em **Project Settings › API**, copie a **Project URL** e a chave **anon public**.
4. Opcional: coloque esses dois valores em `js/config.js`. Assim, no celular, basta entrar com e-mail e senha. Se deixar em branco, preencha pela tela **Cadastro › Nuvem e sincronização**.
5. Em **Authentication › Sign In / Providers › Email**, você pode desligar *Confirm email* para entrar sem precisar confirmar o e-mail.

A chave *anon* é pública por natureza. Os dados ficam protegidos pelo login e pelas regras RLS do `schema.sql`: cada conta só lê e grava os próprios registros.

## 2. Publicar no GitHub Pages

1. Envie esta pasta para um repositório no GitHub.
2. No repositório, vá em **Settings › Pages**. Em **Source**, escolha *Deploy from a branch*, depois `main` e `/ (root)`, e salve.
3. Em 1 ou 2 minutos o app fica disponível em `https://<seu-usuario>.github.io/<repositorio>/`.

## 3. Instalar no celular

- **Android (Chrome):** abra o link e toque em ⋮ › **Instalar app**.
- **iPhone (Safari):** abra o link e toque em Compartilhar › **Adicionar à Tela de Início**.

Instale o app em vez de usá-lo pela aba do navegador. Instalado, ele abre offline e, no iPhone, os dados locais não são apagados por falta de uso.

## Como funciona o modo offline

| Peça | Arquivo | O que faz |
|---|---|---|
| Service worker | `sw.js` | Guarda o app no aparelho para abrir sem internet |
| Banco local | `js/db.js` | IndexedDB. Todo registro é salvo aqui primeiro, com status `pendente` |
| Sincronização | `js/sync.js` | Envia os pendentes quando a conexão volta, ao abrir o app e a cada 60 segundos |

- **Sem duplicidade:** cada registro tem um id (UUID) criado no aparelho, e o envio é um *upsert*. Reenviar não duplica.
- **Relógio do celular:** a cada sincronização o app mede a diferença para a hora do servidor e usa essa diferença nos registros. A hora do aparelho também fica guardada, para auditoria.
- **Remoções:** um registro removido não é apagado, só marcado como removido. Correções viram marcações *manuais*.
- **Dois aparelhos:** o que ainda estiver pendente no aparelho tem prioridade, e o restante vem da nuvem.
- **Detecção automática:** a faixa no topo mostra Online, Sem conexão (com o número de pendentes), Sincronizando ou Erro.

## Publicar uma atualização

Altere os arquivos e aumente `VERSION` em `sw.js`, por exemplo para `ponto-v1.0.1`. O app mostra **"Nova versão disponível · Atualizar"**.

## Cálculos

- **Valor hora:** salário ÷ divisor mensal, sendo o divisor igual às horas semanais × 5. Com 44h o divisor é 220h: R$ 2.500,00 ÷ 220 = **R$ 11,36/h**.
- **Carga diária:** horas semanais ÷ dias de trabalho. Com 44h em 5 dias, dá 8h48.
- **Feriados e dias sem jornada:** a carga esperada é zero. O que for trabalhado nesses dias entra como saldo positivo.
- **Banco de horas:** soma de trabalhado − esperado no mês, a partir do primeiro registro. O dia de hoje só entra depois da saída.
- **Feriados nacionais:** são calculados todo ano, incluindo a Sexta-feira Santa pela data da Páscoa. Carnaval e Corpus Christi são ponto facultativo; cadastre-os se valerem na sua cidade.

> Para usar como ponto eletrônico oficial de funcionários CLT, confira os requisitos da Portaria MTP nº 671/2021.
