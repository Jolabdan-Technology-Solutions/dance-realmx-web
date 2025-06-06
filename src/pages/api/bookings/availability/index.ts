import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import prisma from '../../../../lib/prisma';
import { BookingAvailability } from '../../../../types/booking';

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

  switch (req.method) {
    case 'GET':
      return getAvailability(req, res, userId);
    case 'POST':
      return createAvailability(req, res, userId);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}

async function getAvailability(
  req: NextApiRequest,
  res: NextApiResponse,
  professionalId: string
) {
  try {
    const availabilities = await prisma.bookingAvailability.findMany({
      where: { professionalId },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return res.status(200).json(availabilities);
  } catch (error) {
    console.error('Error fetching availability:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function createAvailability(
  req: NextApiRequest,
  res: NextApiResponse,
  professionalId: string
) {
  try {
    const availabilityData: Omit<BookingAvailability, 'id' | 'createdAt' | 'updatedAt'> = req.body;

    // Validate availability data
    if (
      !availabilityData.dayOfWeek ||
      !availabilityData.startTime ||
      !availabilityData.endTime
    ) {
      return res.status(400).json({ message: 'Missing required availability information' });
    }

    // Validate day of week
    if (availabilityData.dayOfWeek < 0 || availabilityData.dayOfWeek > 6) {
      return res.status(400).json({ message: 'Invalid day of week' });
    }

    // Validate time format and range
    const startTime = new Date(`2000-01-01T${availabilityData.startTime}`);
    const endTime = new Date(`2000-01-01T${availabilityData.endTime}`);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return res.status(400).json({ message: 'Invalid time format' });
    }

    if (startTime >= endTime) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    // Check for overlapping availability
    const existingAvailability = await prisma.bookingAvailability.findFirst({
      where: {
        professionalId,
        dayOfWeek: availabilityData.dayOfWeek,
        OR: [
          {
            AND: [
              { startTime: { lte: availabilityData.startTime } },
              { endTime: { gt: availabilityData.startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: availabilityData.endTime } },
              { endTime: { gte: availabilityData.endTime } },
            ],
          },
        ],
      },
    });

    if (existingAvailability) {
      return res.status(409).json({ message: 'Time slot overlaps with existing availability' });
    }

    // Create the availability
    const availability = await prisma.bookingAvailability.create({
      data: {
        ...availabilityData,
        professionalId,
      },
    });

    return res.status(201).json(availability);
  } catch (error) {
    console.error('Error creating availability:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 