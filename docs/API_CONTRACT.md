# Contrato de API - Baseline (v0.1)

Este documento congela as definições atuais dos endpoints fundamentais para garantir que a refatoração preserve a compatibilidade.

## Autenticação
A autenticação é feita via Supabase Auth (JWT no cabeçalho `Authorization: Bearer [...]`).

---

## Endpoints de Ponto

### 1. Registrar Ponto
`POST /functions/v1/registro-ponto` (Exemplo baseado no Edge Function local)

**Request Payload:**
```json
{
  "usuario_id": "uuid",
  "tipo": "entrada" | "saida",
  "data_hora": "ISO8601",
  "geolocalizacao": { "lat": -23.5, "lng": -46.6 }
}
```

**Response (Success - 200/201):**
```json
{
  "id": "uuid",
  "status": "sucesso",
  "mensagem": "Ponto registrado com sucesso"
}
```

---

### 2. Listar Histórico de Ponto
`GET /rest/v1/pontos?select=*&usuario_id=eq.uuid`

**Request Query Params:**
- `select`: campos a retornar
- `usuario_id`: UUID do colaborador

**Response (Success - 200):**
```json
[
  {
    "id": "uuid",
    "usuario_id": "uuid",
    "entrada": "2024-03-31T08:00:00Z",
    "saida": "2024-03-31T12:00:00Z",
    "orgao_id": "uuid"
  }
]
```

---

## Regras de Negócio (Baseline)
- Não é permitido registrar ponto futuro.
- É obrigatório informar o órgão_id para usuários multi-tenant.
