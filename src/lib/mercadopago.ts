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

type InvoiceAutoPaymentInput = {
  amount: number
  description: string
  externalReference: string
  payerEmail: string
  payerFirstName?: string | null
  payerLastName?: string | null
  payerDocumentType?: 'CPF' | 'CNPJ' | null
  payerDocumentNumber?: string | null
  paymentMethodHint?: string | null
}

const onlyDigits = (value?: string | null) => (value || '').replace(/\D/g, '')

export async function generateInvoicePaymentCodes(input: InvoiceAutoPaymentInput) {
  const payment = new Payment(client)

  const methodHint = (input.paymentMethodHint || '').toLowerCase()
  const shouldTryPix = methodHint.includes('pix') || !methodHint
  const shouldTryBoleto = methodHint.includes('boleto') || methodHint.includes('barra')

  let pixCode: string | null = null
  let barcode: string | null = null

  if (shouldTryPix) {
    const pixResponse: any = await payment.create({
      body: {
        payment_method_id: 'pix',
        transaction_amount: input.amount,
        description: input.description,
        external_reference: input.externalReference,
        payer: {
          email: input.payerEmail,
        },
      },
    })

    pixCode = pixResponse?.point_of_interaction?.transaction_data?.qr_code || null
  }

  if (shouldTryBoleto) {
    const docType = input.payerDocumentType || 'CPF'
    const docNumber = onlyDigits(input.payerDocumentNumber) || (docType === 'CPF' ? '19119119100' : '19119119100000')

    const boletoResponse: any = await payment.create({
      body: {
        payment_method_id: 'bolbradesco',
        transaction_amount: input.amount,
        description: input.description,
        external_reference: input.externalReference,
        payer: {
          email: input.payerEmail,
          first_name: input.payerFirstName || undefined,
          last_name: input.payerLastName || undefined,
          identification: {
            type: docType,
            number: docNumber,
          },
        },
      },
    })

    barcode =
      boletoResponse?.transaction_details?.external_resource_url ||
      boletoResponse?.barcode?.content ||
      boletoResponse?.point_of_interaction?.transaction_data?.barcode ||
      null
  }

  return { pixCode, barcode }
}