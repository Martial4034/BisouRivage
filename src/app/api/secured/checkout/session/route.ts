import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { session_id } = req.query; // Extraction de session_id depuis la query string

  try {
    if (!session_id) {
      return res.status(400).json({ message: 'Session ID manquante.' });
    }

    // Récupérer la session Stripe avec l'ID de session
    const session = await stripe.checkout.sessions.retrieve(session_id as string);

    // Vérifie si la session existe et est valide
    if (!session) {
      return res.status(404).json({ message: 'Session introuvable.' });
    }

    res.status(200).json(session);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
