import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import prisma from '../../../lib/prisma';
import { BookingRequest, BookingResponse } from '../../../types/booking';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  switch (req.method) {
    case 'GET':
      return getBookings(req, res, session);
    case 'POST':
      return createBooking(req, res, session);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}

async function getBookings(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const { role, userId } = session.user;
    const { status, startDate, endDate } = req.query;

    const where: any = {};

    if (role === 'PROFESSIONAL') {
      where.professionalId = userId;
    } else if (role === 'STUDENT') {
      where.studentId = userId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const bookings = await prisma.booking.findMany({
      where,
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
      orderBy: {
        startTime: 'desc',
      },
    });

    return res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function createBooking(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const { role, userId } = session.user;
    const bookingData: BookingRequest = req.body;

    if (role !== 'STUDENT') {
      return res.status(403).json({ message: 'Only students can create bookings' });
    }

    // Validate booking data
    if (!bookingData.professionalId || !bookingData.startTime || !bookingData.duration) {
      return res.status(400).json({ message: 'Missing required booking information' });
    }

    // Check if the professional exists
    const professional = await prisma.user.findUnique({
      where: { id: bookingData.professionalId },
    });

    if (!professional || professional.role !== 'PROFESSIONAL') {
      return res.status(404).json({ message: 'Professional not found' });
    }

    // Check if the time slot is available
    const startTime = new Date(bookingData.startTime);
    const endTime = new Date(startTime.getTime() + bookingData.duration * 60000);

    const existingBooking = await prisma.booking.findFirst({
      where: {
        professionalId: bookingData.professionalId,
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
        ],
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
    });

    if (existingBooking) {
      return res.status(409).json({ message: 'Time slot is not available' });
    }

    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        professionalId: bookingData.professionalId,
        studentId: userId,
        startTime,
        endTime,
        duration: bookingData.duration,
        type: bookingData.type,
        status: 'PENDING',
        price: 0, // This should be calculated based on professional's rates
        location: bookingData.location,
        notes: bookingData.notes,
      },
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

    const response: BookingResponse = {
      booking,
      message: 'Booking created successfully',
    };

    return res.status(201).json(response);
  } catch (error) {
    console.error('Error creating booking:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 