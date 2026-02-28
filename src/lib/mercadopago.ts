import { MercadoPagoConfig, Payment, Preference } from 'mercadopago'

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN as string,
  options: { timeout: 5000 }
})

export async function processDirectPayment(paymentData: any, externalReference: string) {
  const payment = new Payment(client)
  
  const payload = {
    ...paymentData,
    description: 'Reserva de Espaço - HUB FDS',
    external_reference: externalReference
  }

  const response = await payment.create({
    body: payload
  })
  
  return response
}

export async function getPaymentById(paymentId: number | string) {
  const payment = new Payment(client)
  return payment.get({ id: String(paymentId) })
}

export async function createBookingPreference(id: string, name: string, email: string, price: number) {
  const preference = new Preference(client)

  const response = await preference.create({
    body: {
      items: [
        {
          id: 'reserva_hub_fds',
          title: 'Reserva de Espaço - HUB FDS',
          quantity: 1,
          unit_price: price,
          currency_id: 'BRL',
        }
      ],
      payer: {
        name,
        email,
      },
      external_reference: id,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/sucesso`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/`
      },
      auto_return: 'approved',
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/mercadopago`,
    }
  })

  return response.init_point
}