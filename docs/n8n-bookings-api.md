# Integracao n8n -> Banco (Reservas)

## Autenticacao

Todas as rotas exigem token no header:

- `Authorization: Bearer SEU_N8N_API_KEY`
- ou `x-n8n-key: SEU_N8N_API_KEY`

Configure em `.env` do projeto:

- `N8N_API_KEY=uma-chave-forte`

## Base URL

- Desenvolvimento local: `http://localhost:3000`
- Endpoint base: `/api/n8n/bookings`

## 1) Criar reserva

- Metodo: `POST`
- URL: `/api/n8n/bookings`

Payload compativel com seu fluxo atual:

```json
{
  "idReserva": "RSV-123456",
  "nomeCliente": "Joao Silva",
  "email": "joao@email.com",
  "telefone": "5582999999999",
  "tipoEspaco": "Sala de Reuniao",
  "dataAgendamento": "27/03/2026",
  "horarioInicio": "14:00",
  "horarioFim": "16:00",
  "numeroPessoas": 4,
  "observacoes": "Reuniao comercial",
  "status": "PENDING"
}
```

Resposta:

```json
{
  "data": {
    "id": "cm...",
    "name": "Joao Silva"
  },
  "idReserva": "RSV-123456"
}
```

## 2) Modificar reserva

- Metodo: `PATCH`
- URL: `/api/n8n/bookings`

Use `bookingId` (id do banco) ou `idReserva` (RSV-XXXXXX):

```json
{
  "idReserva": "RSV-123456",
  "dataAgendamento": "29/03/2026",
  "horarioInicio": "15:00",
  "horarioFim": "17:00",
  "numeroPessoas": 5,
  "observacoes": "Horario alterado"
}
```

## 3) Cancelar reserva

- Metodo: `DELETE`
- URL: `/api/n8n/bookings`

```json
{
  "idReserva": "RSV-123456"
}
```

A reserva e marcada como `CANCELLED` no banco.

## 4) Buscar reservas

- Metodo: `GET`
- URL: `/api/n8n/bookings`

Filtros disponiveis por query string:

- `idReserva`
- `bookingId`
- `telefone`
- `room` (`reuniao`, `treinamento`, `coworking`)
- `date` (`DD/MM/AAAA` ou ISO)
- `status`
- `page`
- `limit`

Exemplos:

- Reserva especifica por idReserva:
  - `/api/n8n/bookings?idReserva=RSV-123456`
- Reservas por telefone:
  - `/api/n8n/bookings?telefone=5582999999999&page=1&limit=20`

## Mapeamento sugerido para o seu JSON n8n

Substitua os 4 tools de planilha por 4 nodes HTTP Request:

1. `Criar reserva`
- `POST /api/n8n/bookings`
- Mapear:
  - `ID_Reserva -> idReserva`
  - `Nome_Cliente -> nomeCliente`
  - `Telefone -> telefone`
  - `Tipo_Espaco -> tipoEspaco`
  - `Data_Agendamento -> dataAgendamento`
  - `Horario_Inicio -> horarioInicio`
  - `Horario_Fim -> horarioFim`
  - `Numero_Pessoas -> numeroPessoas`
  - `Observacoes -> observacoes`
  - `Status -> status`

2. `Modificar reserva`
- `PATCH /api/n8n/bookings`
- Enviar `idReserva` e somente campos alterados.

3. `Cancelar reserva`
- `DELETE /api/n8n/bookings`
- Enviar `{ "idReserva": "..." }`.

4. `Buscar reserva`
- `GET /api/n8n/bookings?telefone={{...}}`
- Ou por `idReserva` quando o cliente informar o codigo.

## Observacoes importantes

- Se `email` nao vier no payload, a API gera um email tecnico com base no telefone para atender a estrutura atual do banco.
- Para evitar conflito de horario, a API respeita a regra de unicidade de sala + data + horario quando a migration estiver aplicada.
