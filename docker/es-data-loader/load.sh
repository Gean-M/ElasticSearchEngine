#!/bin/bash
# Cria o índice (com o mapping usado pela aplicação) e importa o wiki.json,
# reproduzindo o passo "Passo 2" do README original, mas de forma automática
# e idempotente (não duplica os dados se o container rodar de novo).
set -e

ES_URL="https://es01:9200"
INDEX="${ES_INDEX:-wikipedia}"
AUTH="elastic:${ELASTIC_PASSWORD}"

echo "[data-loader] Aguardando Elasticsearch responder em ${ES_URL}..."
until curl -s -k -u "${AUTH}" "${ES_URL}" > /dev/null; do
  sleep 3
done
echo "[data-loader] Elasticsearch respondendo."

# Se o índice já existe e já tem documentos, não faz nada (evita duplicar
# dados a cada "docker compose up").
STATUS=$(curl -s -k -o /dev/null -w "%{http_code}" -u "${AUTH}" "${ES_URL}/${INDEX}")
if [ "$STATUS" = "200" ]; then
  COUNT=$(curl -s -k -u "${AUTH}" "${ES_URL}/${INDEX}/_count" | grep -o '"count":[0-9]*' | grep -o '[0-9]*')
  if [ "${COUNT:-0}" -gt 0 ]; then
    echo "[data-loader] Índice \"${INDEX}\" já existe com ${COUNT} documento(s). Nada a fazer."
    exit 0
  fi
fi

echo "[data-loader] Criando índice \"${INDEX}\" (mapping compatível com a aplicação)..."
curl -s -k -u "${AUTH}" -X PUT "${ES_URL}/${INDEX}" \
  -H "Content-Type: application/json" \
  -d '{
        "mappings": {
          "properties": {
            "title":        {
              "type": "text",
              "fields": { "keyword": { "type": "keyword", "ignore_above": 256 } }
            },
            "url":          { "type": "keyword" },
            "content":      { "type": "text" },
            "reading_time": { "type": "integer" },
            "dt_creation":  { "type": "date", "format": "yyyy-MM-dd||strict_date_optional_time" },
            "label":        { "type": "keyword" }
          }
        }
      }' > /dev/null

if [ ! -f /data/wiki.json ]; then
  echo "[data-loader] AVISO: /data/wiki.json não encontrado - pulei a importação."
  echo "[data-loader] Coloque o arquivo wiki.json na raiz do repositório para que ele seja montado aqui."
  exit 0
fi

echo "[data-loader] Importando /data/wiki.json em \"${INDEX}\" via _bulk..."
RESPONSE=$(curl -s -k -u "${AUTH}" -H "Content-Type: application/x-ndjson" \
  -X POST "${ES_URL}/${INDEX}/_bulk" --data-binary "@/data/wiki.json")

if echo "$RESPONSE" | grep -q '"errors":true'; then
  echo "[data-loader] ATENÇÃO: o Elasticsearch reportou erros durante o bulk. Resposta:"
  echo "$RESPONSE"
  exit 1
fi

curl -s -k -u "${AUTH}" -X POST "${ES_URL}/${INDEX}/_refresh" > /dev/null
COUNT=$(curl -s -k -u "${AUTH}" "${ES_URL}/${INDEX}/_count" | grep -o '"count":[0-9]*' | grep -o '[0-9]*')
echo "[data-loader] Importação concluída. Índice \"${INDEX}\" agora tem ${COUNT:-?} documento(s)."
