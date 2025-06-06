import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import prisma from '../../../../lib/prisma';
import { BookingStatus } from '../../../../types/booking';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid booking ID' });
  }

  switch (req.method) {
    case 'PATCH':
      return updateBookingStatus(req, res, session, id);
    default:
      res.setHeader('Allow', ['PATCH']);
      return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}

async function updateBookingStatus(
  req: NextApiRequest,
  res: NextApiResponse,
  session: any,
  bookingId: string
) {
  try {
    const { role, userId } = session.user;
    const { status } = req.body;

    if (!status || !Object.values(BookingStatus).includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Get the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check permissions
    if (role === 'PROFESSIONAL' && booking.professionalId !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }

    if (role === 'STUDENT' && booking.studentId !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }

    // Validate status transitions
    const validTransitions: Record<BookingStatus, BookingStatus[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
      CANCELLED: [],
      COMPLETED: [],
      NO_SHOW: [],
    };

    if (!validTransitions[booking.status].includes(status)) {
      return res.status(400).json({
        message: `Cannot transition from ${booking.status} to ${status}`,
      });
    }

    // Update the booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status },
      include: {
        professional: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return res.status(200).json(updatedBooking);
  } catch (error) {
    console.error('Error updating booking status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 