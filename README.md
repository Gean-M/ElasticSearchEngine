# Elasticsearch GUI - Turma 2026

Interface web (**React** + **Node/TypeScript**) para o Elasticsearch,
desenvolvida com base:

- nos requisitos do README do repositório de exemplo
  [`fbgonzaga/elasticsearch_example`](https://github.com/fbgonzaga/elasticsearch_example);
- no material de aula (PDF "Elasticsearch - turma 2026"), que ensina os
  recursos do Elasticsearch usados aqui (queries bool, filtros por range,
  ordenação, highlight, fuzziness, suggest, agregações, paginação, etc.);
- na versão anterior deste projeto, feita em **Java Swing**, cujas
  funcionalidades foram integralmente migradas.

Diferente da versão Swing (aplicação desktop que conversava diretamente com
o Elasticsearch), esta versão é composta por três peças que rodam juntas via
**Docker Compose**, em qualquer sistema operacional (Windows, Linux, macOS):

| Peça | Tecnologia | Papel |
|------|------------|-------|
| `frontend/` | React + Vite + TypeScript + Tailwind | Interface que roda no navegador |
| `backend/`  | Node.js + Express + TypeScript | API que conversa com o Elasticsearch |
| Elasticsearch + Kibana | Docker (`docker/`) | Banco de busca + ferramenta administrativa |

Um quarto serviço, o **data-loader**, sobe junto e importa automaticamente o
`wiki.json` no índice na primeira vez que o ambiente é levantado.

**Não é necessário instalar Node, Java ou qualquer outra ferramenta na sua
máquina** - o único pré-requisito é ter o Docker instalado. Todo resto
(compilação do frontend, do backend, carga dos dados) acontece dentro dos
containers.


## Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) e Docker Compose (já incluso
  no Docker Desktop, no Windows/macOS; no Linux, `docker compose` faz parte
  do pacote `docker-ce` mais recente).
- O arquivo `wiki.json` (dataset de exemplo) na raiz do repositório - ele é
  montado automaticamente no container `data-loader`.
- Portas livres no host: `9200` (Elasticsearch), `5601` (Kibana), `4000`
  (API) e `8080` (interface web). Todas são configuráveis em `docker/.env`.


## Guia passo a passo (do zero até a primeira busca)

### Passo 1 - Clonar/baixar o repositório

Garanta que a estrutura fique assim:

```
.
├── docker/
│   ├── docker-compose.yml
│   ├── .env
│   └── es-data-loader/
├── backend/
├── frontend/
├── wiki.json
└── README.md   (este arquivo)
```
Todo conteúdo deve estar contido em uma pasta única.

### Passo 2 - Subir tudo com um único comando

Abra um terminal na raiz do repositório e rode:

```bash
cd docker
docker compose up -d --build
```

Esse comando faz tudo sozinho:
1. Sobe os dois nós do Elasticsearch e configura TLS/segurança e o Kibana;
2. Assim que o Elasticsearch fica saudável, o container `data-loader` cria
   o índice (com o mapping esperado pela aplicação: `title`, `url`,
   `content`, `reading_time`, `dt_creation`, `label`) e importa o
   `wiki.json` via `_bulk` - só na primeira vez (não há duplicação);
3. Compila a imagem do **backend** (TypeScript → JavaScript) e sobe a API;
4. Compila a imagem do **frontend** (React, build de produção com Vite) e
   sobe um Nginx servindo os arquivos estáticos e repassando `/api` para o
   backend.

A primeira subida demora alguns minutos (build das imagens + inicialização
do cluster). Para acompanhar o progresso:

```bash
docker compose logs -f data-loader backend frontend
```

Você deve ver, na saída do `data-loader`, uma mensagem como:

```
[data-loader] Importação concluída. Índice "wikipedia" agora tem N documento(s).
```

### Passo 3 - Confirmar que os containers estão de pé

```bash
docker compose ps
```

Todos os serviços devem aparecer como `running` (ou `healthy`, no caso do
Elasticsearch/Kibana).

### Passo 4 - Abrir a interface

Acesse **http://localhost:8080** no navegador. A tela abre já na aba
**Busca**, e a barra inferior mostra o status da conexão com o Elasticsearch
(host, índice e usuário usados pelo backend).

Se quiser conferir o cluster pelo Kibana também, ele continua disponível em
**http://localhost:5601** (usuário `elastic`, senha `user123`).

### Passo 5 - Fazer a primeira busca

1. Na aba **Busca**, digite um termo no campo "Buscar em `content`" (por
   exemplo, `square root`) e clique em **Buscar** (ou tecle Enter).
2. Os resultados aparecem na tabela; clique em qualquer linha para ver,
   logo abaixo, o título completo, a URL e um trecho do conteúdo com os
   termos buscados destacados.
3. Use o painel à esquerda para filtrar por tempo de leitura, data de
   criação ou classificação, e o combo "Ordenar por" para mudar a
   ordenação; depois clique em **Aplicar filtros**.
4. Use o botão "Filtrar" para acessar o menu de filtragem com as opções
   de filtrar por tempo de leitura, data de criação ou classificação.
5. Para ordenar os resultados, basta clicar no título da coluna (filtragem 
   ascendente e descendente).
6. Use a barra inferior para navegar entre páginas, mudar quantos
   resultados aparecem por página, ou ver as estatísticas agregadas do
   conjunto filtrado. 
7. Para acompanhar a saúde do cluster, os nós e os índices disponíveis,
   troque para a aba **Cluster**.

### Passo 6 - Encerrar

```bash
cd docker
docker compose down
```

Isso mantém os dados salvos nos volumes Docker (Elasticsearch, Kibana); a
próxima subida não precisa reimportar o `wiki.json`. Para apagar tudo do
zero (inclusive os dados), use `docker compose down -v`.


## Configuração

Todas as configurações ficam em `docker/.env`:

| Variável | Padrão | Para que serve |
|----------|--------|-----------------|
| `ELASTIC_PASSWORD` / `KIBANA_PASSWORD` | `user123` | Credenciais do cluster (mesmas da aula) |
| `STACK_VERSION` | `8.17.2` | Versão do Elasticsearch/Kibana |
| `ES_PORT` / `KIBANA_PORT` | `9200` / `5601` | Portas expostas no host |
| `ES_INDEX` | `wikipedia` | Índice usado pela aplicação e pelo data-loader |
| `BACKEND_PORT` | `4000` | Porta da API no host |
| `FRONTEND_PORT` | `8080` | Porta da interface web no host |

Depois de alterar o `.env`, rode `docker compose up -d --build` novamente
para aplicar.

> Se você já tem um Elasticsearch rodando fora do Docker Compose deste
> projeto (por exemplo, o ambiente que já usava com a versão Swing), basta
> apontar as variáveis `ES_HOST`/`ES_PORT`/`ES_SCHEME` do serviço `backend`
> (em `docker/docker-compose.yml`) para ele, em vez de usar os serviços
> `es01`/`es02` deste `docker-compose.yml`.


## O que a aba "Busca" cobre

Os mesmos recursos da versão Swing, agora na web - com a ordenação
incorporada diretamente aos cabeçalhos da tabela:

| Recurso | Onde na interface |
|---------|--------------------|
| Busca por termo no campo `content` | Campo de texto no cabeçalho + botão "Buscar" |
| Paginação (`from`/`size`, total de páginas) | Barra inferior (Anterior/Próxima/Ir para) - as 3 primeiras páginas já vêm pré-carregadas na primeira busca |
| Tamanho de página configurável | Combo "Resultados por página" (10/20/50) |
| Operador AND/OR, fuzziness, frase exata, destaque | Dentro do menu "Filtrar" (ao lado do botão "Buscar") |
| Filtro por faixa de `reading_time` e `dt_creation` | Dentro do menu "Filtrar" |
| Filtro por `label` (rápido/médio/demorado) | Dentro do menu "Filtrar" |
| **Ordenação por qualquer coluna** (título, tempo de leitura, classificação, data, score) | Clique no cabeçalho da coluna na tabela - uma seta indica a direção (▲/▼); clique de novo para inverter. Padrão: Score (relevância) |
| Sugestão de correção ("você quis dizer?") | Aparece automaticamente com 0 resultados |
| Estatísticas do conjunto (`stats` aggregation) | Botão "Ver estatísticas do conjunto" |
| Status de conexão com o Elasticsearch | Barra inferior, sempre visível |

> Observação sobre `label`: esse campo só é preenchido se o `wiki.json`
> já tiver esse campo ou se você rodar um pipeline de reindex (aula de
> 13/04) sobre o índice. Se não tiver, deixe os filtros de classificação
> desmarcados - eles simplesmente não vão casar com nenhum documento.

> **Atualizando de uma versão anterior?** O mapping do índice ganhou um
> sub-campo (`title.keyword`) necessário para ordenar por título. Como o
> Elasticsearch não permite alterar o mapping de um campo já existente, se
> você já tinha subido o ambiente antes, rode `docker compose down -v`
> (apaga os volumes) e depois `docker compose up -d --build` de novo, para
> o `data-loader` recriar o índice do zero com o mapping atualizado.


## O que a aba "Cluster" cobre

Reproduz os comandos administrativos vistos na aula de 09/03:

- **Saúde do cluster** (`GET /_cat/health?v`);
- **Nós do cluster** (`GET /_cat/nodes?v`);
- **Índices** (`GET /_cat/indices?v`).


## Arquitetura do projeto

```
.
├── docker/
│   ├── docker-compose.yml     Orquestra ES, Kibana, data-loader, backend e frontend
│   ├── .env                   Todas as variáveis de configuração
│   └── es-data-loader/        Container que cria o índice e importa o wiki.json
├── backend/
│   └── src/
│       ├── config/            Configuração de conexão
│       ├── elasticsearch/     Cliente HTTP para a API REST do ES
│       ├── models/            Tipos TypeScript
│       ├── services/          Monta as queries bool/range/highlight/sort
│       ├── routes/            Endpoints REST consumidos pelo frontend
│       └── server.ts          Ponto de entrada (Express)
├── frontend/
│   └── src/
│       ├── api/               Cliente HTTP para o backend
│       ├── hooks/             useSearch: todo o estado de busca, ordenação e pré-carregamento de páginas
│       ├── components/        SearchHeaderBar, FilterDropdown, ResultsPanel, PaginationBar, StatsModal, ClusterPanel...
│       ├── pages/             SearchResultsArea, ClusterPage
│       └── types/             Tipos TypeScript espelhando o backend
└── wiki.json                  Dataset de exemplo importado pelo data-loader
```


## Desenvolvimento local (sem rebuildar as imagens a cada mudança)

Para trabalhar no código com hot-reload, sem precisar rodar
`docker compose build` a cada alteração:

```bash
# 1. Suba só o Elasticsearch/Kibana via Docker
cd docker
docker compose up -d es01 es02 kibana data-loader

# 2. Rode o backend localmente
cd ../backend
npm install
ES_HOST=localhost ES_TRUST_ALL_CERTS=true npm run dev

# 3. Em outro terminal, rode o frontend localmente
cd ../frontend
npm install
npm run dev
```

O frontend em modo dev (`npm run dev`, porta `5173`) já faz proxy de `/api`
para `http://localhost:4000` (ver `frontend/vite.config.ts`).


## Erros comuns

- **"Falha de conexão com https://es01:9200..."** (nos logs do backend) -
  verifique se os containers `es01`/`es02` estão `healthy`
  (`docker compose ps`); a primeira subida do cluster pode levar mais de um
  minuto.
- **Índice vazio / 0 resultados sempre** - confira os logs do
  `data-loader` (`docker compose logs data-loader`); se o `wiki.json` não
  foi encontrado, ele avisa e pula a importação.
- **"index_not_found_exception"** - confira se `ES_INDEX` (em
  `docker/.env`) é o mesmo nome usado pelo `data-loader` e pelo `backend`
  (por padrão, `wikipedia`).
- **Porta já em uso** - altere `ES_PORT`, `KIBANA_PORT`, `BACKEND_PORT` ou
  `FRONTEND_PORT` em `docker/.env` e rode `docker compose up -d --build`
  novamente.


## Sobre a versão anterior (Java Swing)

O código da interface desktop original (Java Swing) está preservado em
`ElasticSearch_Project/`, para referência histórica e comparação - ele não é mais
necessário para rodar a aplicação e pode ser removido do repositório
quando não for mais útil.
