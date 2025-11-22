import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { geocodeAddress, getDirections, reverseGeocode } from '../config/google-maps';
import { Location, Trip } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Update user's current location
 */
export async function updateLocation(
  userId: string,
  latitude: number,
  longitude: number,
  address?: string,
  label?: string
): Promise<Location | null> {
  try {
    // Atomically mark all previous locations as not current and create new current location
    const [, location] = await prisma.$transaction([
      prisma.location.updateMany({
        where: {
          userId,
          isCurrent: true,
        },
        data: {
          isCurrent: false,
        },
      }),
      prisma.location.create({
        data: {
          userId,
          latitude: new Decimal(latitude),
          longitude: new Decimal(longitude),
          address,
          label,
          isCurrent: true,
        },
      }),
    ]);
    logger.info('Location updated', {
      userId,
      locationId: location.id,
      address,
    });

    return location;
  } catch (error) {
    logger.error('Error updating location', {
      error,
      userId,
      latitude,
      longitude,
    });
    return null;
  }
}

/**
 * Update location from address string
 */
export async function updateLocationFromAddress(
  userId: string,
  address: string,
  label?: string
): Promise<Location | null> {
  try {
    // Geocode address to get coordinates
    const geocodeResult = await geocodeAddress(address);

    if (!geocodeResult) {
      logger.warn('Failed to geocode address', { userId, address });
      return null;
    }

    return updateLocation(
      userId,
      geocodeResult.lat,
      geocodeResult.lng,
      geocodeResult.formattedAddress,
      label
    );
  } catch (error) {
    logger.error('Error updating location from address', {
      error,
      userId,
      address,
    });
    return null;
  }
}

/**
 * Get user's current location
 */
export async function getCurrentLocation(userId: string): Promise<Location | null> {
  try {
    const location = await prisma.location.findFirst({
      where: {
        userId,
        isCurrent: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return location;
  } catch (error) {
    logger.error('Error getting current location', {
      error,
      userId,
    });
    return null;
  }
}

/**
 * Start a new trip
 */
export async function startTrip(
  userId: string,
  destinationAddress: string,
  destinationLabel?: string
): Promise<Trip | null> {
  try {
    // Get current location as origin
    const currentLocation = await getCurrentLocation(userId);

    // Geocode destination
    const destGeocode = await geocodeAddress(destinationAddress);

    if (!destGeocode) {
      logger.warn('Failed to geocode destination', { userId, destinationAddress });
      return null;
    }

    // Calculate ETA
    let estimatedArrival: Date | undefined;

    if (currentLocation) {
      const directions = await getDirections(
        {
          lat: Number(currentLocation.latitude),
          lng: Number(currentLocation.longitude),
        },
        {
          lat: destGeocode.lat,
          lng: destGeocode.lng,
        }
      );

      if (directions) {
        const etaSeconds = directions.durationInTraffic;
        estimatedArrival = new Date(Date.now() + etaSeconds * 1000);
      }
    }

    // Create trip
    const trip = await prisma.trip.create({
      data: {
        userId,
        originLat: currentLocation ? currentLocation.latitude : null,
        originLng: currentLocation ? currentLocation.longitude : null,
        originAddress: currentLocation?.address || null,
        destinationLat: new Decimal(destGeocode.lat),
        destinationLng: new Decimal(destGeocode.lng),
        destinationAddress: destGeocode.formattedAddress,
        destinationLabel,
        estimatedArrival,
        status: 'active',
      },
    });

    logger.info('Trip started', {
      userId,
      tripId: trip.id,
      destination: destGeocode.formattedAddress,
      estimatedArrival,
    });

    return trip;
  } catch (error) {
    logger.error('Error starting trip', {
      error,
      userId,
      destinationAddress,
    });
    return null;
  }
}

/**
 * Get active trip for user
 */
export async function getActiveTrip(userId: string): Promise<Trip | null> {
  try {
    const trip = await prisma.trip.findFirst({
      where: {
        userId,
        status: 'active',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return trip;
  } catch (error) {
    logger.error('Error getting active trip', {
      error,
      userId,
    });
    return null;
  }
}

/**
 * Cancel active trip
 */
export async function cancelTrip(tripId: string): Promise<boolean> {
  try {
    await prisma.trip.update({
      where: { id: tripId },
      data: {
        status: 'cancelled',
        completedAt: new Date(),
      },
    });

    logger.info('Trip cancelled', { tripId });

    return true;
  } catch (error) {
    logger.error('Error cancelling trip', {
      error,
      tripId,
    });
    return false;
  }
}

/**
 * Calculate ETA between two locations
 */
export async function calculateEta(
  origin: { lat: number; lng: number } | string,
  destination: { lat: number; lng: number } | string
): Promise<{
  duration: number;
  durationInTraffic: number;
  distance: number;
  estimatedArrival: Date;
} | null> {
  try {
    const directions = await getDirections(origin, destination);

    if (!directions) {
      return null;
    }

    const estimatedArrival = new Date(Date.now() + directions.durationInTraffic * 1000);

    return {
      duration: directions.duration,
      durationInTraffic: directions.durationInTraffic,
      distance: directions.distance,
      estimatedArrival,
    };
  } catch (error) {
    logger.error('Error calculating ETA', {
      error,
      origin,
      destination,
    });
    return null;
  }
}
