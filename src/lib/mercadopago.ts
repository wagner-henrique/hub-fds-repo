import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-TOKEN' 
});

export const createBookingPreference = async (bookingId: string, name: string, email: string, unitPrice: number) => {
  const preference = new Preference(client);
  
  const response = await preference.create({
    body: {
      items: [
        {
          id: bookingId,
          title: 'Reserva HUB FDS (50% Entrada)',
          quantity: 1,
          unit_price: unitPrice, 
          currency_id: 'BRL',
        }
      ],
      payer: {
        email: email,
        name: name,
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_URL}/booking/success`,
        failure: `${process.env.NEXT_PUBLIC_URL}/booking/failure`,
        pending: `${process.env.NEXT_PUBLIC_URL}/booking/pending`,
      },
      auto_return: 'approved',
      external_reference: bookingId,
      notification_url: `${process.env.NEXT_PUBLIC_URL}/api/webhooks/mercadopago`,
    }
  });

  return response.init_point;
};