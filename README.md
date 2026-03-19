# HUB FDS

## Webhook WhatsApp (n8n)

Rota criada para registrar eventos da automacao de WhatsApp via n8n:

- Endpoint: `/api/webhook/whatsapp`
- Metodos:
	- `GET`: health check e lista de eventos aceitos
	- `POST`: processa eventos
- Autenticacao:
	- Header `Authorization: Bearer <token>` ou `x-n8n-token: <token>`
	- Variavel obrigatoria: `N8N_WEBHOOK_TOKEN`

### Eventos aceitos (`type`)

- `lead.upsert`: cria/atualiza lead
- `booking.create`: cria agendamento (e atualiza/cria lead)
- `booking.update_status`: atualiza status do agendamento
- `payment.register`: registra pagamento e reflete status na reserva

### Exemplo de payload

```json
{
	"type": "booking.create",
	"payload": {
		"name": "Maria Silva",
		"email": "maria@email.com",
		"phone": "11999999999",
		"room": "reuniao",
		"date": "2026-03-21",
		"time": "14:00",
		"notes": "Veio do WhatsApp",
		"source": "whatsapp_n8n"
	}
}
```
