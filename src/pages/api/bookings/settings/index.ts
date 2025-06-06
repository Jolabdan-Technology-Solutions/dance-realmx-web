import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import prisma from '../../../../lib/prisma';
import { BookingSettings } from '../../../../types/booking';

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
    return res.status(403).json({ message: 'Only professionals can manage booking settings' });
  }

  switch (req.method) {
    case 'GET':
      return getSettings(req, res, userId);
    case 'PUT':
      return updateSettings(req, res, userId);
    default:
      res.setHeader('Allow', ['GET', 'PUT']);
      return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}

async function getSettings(
  req: NextApiRequest,
  res: NextApiResponse,
  professionalId: string
) {
  try {
    let settings = await prisma.bookingSettings.findUnique({
      where: { professionalId },
    });

    if (!settings) {
      // Create default settings if they don't exist
      settings = await prisma.bookingSettings.create({
        data: {
          professionalId,
          minNoticeHours: 24,
          maxAdvanceDays: 30,
          cancellationPolicy: {
            allowedUntilHours: 24,
            refundPercentage: 100,
          },
          bufferTime: 15,
          defaultDuration: 60,
          defaultPrice: 50,
        },
      });
    }

    return res.status(200).json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function updateSettings(
  req: NextApiRequest,
  res: NextApiResponse,
  professionalId: string
) {
  try {
    const settingsData: Partial<BookingSettings> = req.body;

    // Validate settings data
    if (settingsData.minNoticeHours !== undefined && settingsData.minNoticeHours < 0) {
      return res.status(400).json({ message: 'Minimum notice hours must be non-negative' });
    }

    if (settingsData.maxAdvanceDays !== undefined && settingsData.maxAdvanceDays < 1) {
      return res.status(400).json({ message: 'Maximum advance days must be at least 1' });
    }

    if (settingsData.cancellationPolicy) {
      if (
        settingsData.cancellationPolicy.allowedUntilHours !== undefined &&
        settingsData.cancellationPolicy.allowedUntilHours < 0
      ) {
        return res.status(400).json({
          message: 'Cancellation allowed until hours must be non-negative',
        });
      }

      if (
        settingsData.cancellationPolicy.refundPercentage !== undefined &&
        (settingsData.cancellationPolicy.refundPercentage < 0 ||
          settingsData.cancellationPolicy.refundPercentage > 100)
      ) {
        return res.status(400).json({
          message: 'Refund percentage must be between 0 and 100',
        });
      }
    }

    if (settingsData.bufferTime !== undefined && settingsData.bufferTime < 0) {
      return res.status(400).json({ message: 'Buffer time must be non-negative' });
    }

    if (settingsData.defaultDuration !== undefined && settingsData.defaultDuration < 15) {
      return res.status(400).json({ message: 'Default duration must be at least 15 minutes' });
    }

    if (settingsData.defaultPrice !== undefined && settingsData.defaultPrice < 0) {
      return res.status(400).json({ message: 'Default price must be non-negative' });
    }

    // Update or create settings
    const settings = await prisma.bookingSettings.upsert({
      where: { professionalId },
      update: settingsData,
      create: {
        ...settingsData,
        professionalId,
        minNoticeHours: settingsData.minNoticeHours ?? 24,
        maxAdvanceDays: settingsData.maxAdvanceDays ?? 30,
        cancellationPolicy: settingsData.cancellationPolicy ?? {
          allowedUntilHours: 24,
          refundPercentage: 100,
        },
        bufferTime: settingsData.bufferTime ?? 15,
        defaultDuration: settingsData.defaultDuration ?? 60,
        defaultPrice: settingsData.defaultPrice ?? 50,
      },
    });

    return res.status(200).json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 