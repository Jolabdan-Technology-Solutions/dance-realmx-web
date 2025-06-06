import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import prisma from '../../../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { role, userId } = session.user;

  if (role !== 'PROFESSIONAL') {
    return res.status(403).json({ message: 'Only professionals can manage availability' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid availability ID' });
  }

  switch (req.method) {
    case 'DELETE':
      return deleteAvailability(req, res, userId, id);
    default:
      res.setHeader('Allow', ['DELETE']);
      return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}

async function deleteAvailability(
  req: NextApiRequest,
  res: NextApiResponse,
  professionalId: string,
  availabilityId: string
) {
  try {
    // Check if the availability exists and belongs to the professional
    const availability = await prisma.bookingAvailability.findFirst({
      where: {
        id: availabilityId,
        professionalId,
      },
    });

    if (!availability) {
      return res.status(404).json({ message: 'Availability not found' });
    }

    // Delete the availability
    await prisma.bookingAvailability.delete({
      where: { id: availabilityId },
    });

    return res.status(204).end();
  } catch (error) {
    console.error('Error deleting availability:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 