import { User } from '@prisma/client';
import { IntentResult } from '../types/intents';
import {
  updateLocationFromAddress,
  getCurrentLocation,
  startTrip,
  getActiveTrip,
  cancelTrip,
  calculateEta,
} from '../services/location.service';
import { formatDistance, formatDuration, formatEta } from '../utils/formatters';
import { logger } from '../utils/logger';

/**
 * Handle location update intent
 */
export async function handleLocationUpdate(
  intent: IntentResult,
  user: User
): Promise<string> {
  const location = intent.entities.location;

  if (!location) {
    return "I couldn't figure out where you are. Please specify a location or address.";
  }

  logger.info('Handling location update', {
    userId: user.id,
    location,
  });

  // Update location
  const updatedLocation = await updateLocationFromAddress(user.id, location);

  if (!updatedLocation) {
    return `Sorry, I couldn't find the location "${location}". Please try a more specific address.`;
  }

  return `Got it! I've updated your location to ${updatedLocation.address || location}.`;
}

/**
 * Handle trip start intent
 */
export async function handleTripStart(
  intent: IntentResult,
  user: User
): Promise<string> {
  const destination = intent.entities.destination || intent.entities.location;

  if (!destination) {
    return "I couldn't figure out where you're heading. Please specify a destination.";
  }

  logger.info('Handling trip start', {
    userId: user.id,
    destination,
  });

  // Start trip
  const trip = await startTrip(user.id, destination);

  if (!trip) {
    return `Sorry, I couldn't find the destination "${destination}". Please try a more specific address.`;
  }

  let response = `Got it! Heading to ${trip.destinationAddress}.`;

  if (trip.estimatedArrival) {
    response += ` ETA: ${formatEta(trip.estimatedArrival)}`;
  }

  return response;
}

/**
 * Handle trip cancel intent
 */
export async function handleTripCancel(
  _intent: IntentResult,
  user: User
): Promise<string> {
  logger.info('Handling trip cancel', {
    userId: user.id,
  });

  // Get active trip
  const activeTrip = await getActiveTrip(user.id);

  if (!activeTrip) {
    return "You don't have an active trip to cancel.";
  }

  // Cancel trip
  const cancelled = await cancelTrip(activeTrip.id);

  if (!cancelled) {
    return 'Sorry, I had trouble cancelling your trip. Please try again.';
  }

  return `Cancelled trip to ${activeTrip.destinationLabel || activeTrip.destinationAddress}.`;
}

/**
 * Handle location query intent
 */
export async function handleLocationQuery(
  intent: IntentResult,
  user: User
): Promise<string> {
  // For MVP, this is about querying the primary user's location
  // In Phase 2, we'll support querying other users' locations with permissions

  logger.info('Handling location query', {
    userId: user.id,
    contactName: intent.entities.contactName,
  });

  // Get current location
  const currentLocation = await getCurrentLocation(user.id);

  if (!currentLocation) {
    return "I don't have your current location. You can update it by saying something like 'I'm at the store' or 'I'm at [address]'.";
  }

  const address = currentLocation.address || `${currentLocation.latitude}, ${currentLocation.longitude}`;
  const label = currentLocation.label ? ` (${currentLocation.label})` : '';

  return `Your current location: ${address}${label}`;
}

/**
 * Handle ETA query intent
 */
export async function handleEtaQuery(
  intent: IntentResult,
  user: User
): Promise<string> {
  logger.info('Handling ETA query', {
    userId: user.id,
  });

  // Get active trip
  const activeTrip = await getActiveTrip(user.id);

  if (!activeTrip) {
    return "You don't have an active trip. Start one by saying something like 'I'm heading home'.";
  }

  // Get current location
  const currentLocation = await getCurrentLocation(user.id);

  if (!currentLocation || !activeTrip.estimatedArrival) {
    const destination = activeTrip.destinationLabel || activeTrip.destinationAddress;
    return `You're heading to ${destination}, but I don't have enough information to calculate ETA. Try updating your current location.`;
  }

  // Recalculate ETA with current location and traffic
  const eta = await calculateEta(
    {
      lat: Number(currentLocation.latitude),
      lng: Number(currentLocation.longitude),
    },
    {
      lat: Number(activeTrip.destinationLat),
      lng: Number(activeTrip.destinationLng),
    }
  );

  if (!eta) {
    return 'Sorry, I had trouble calculating your ETA. Please try again.';
  }

  const destination = activeTrip.destinationLabel || activeTrip.destinationAddress;
  const etaTime = formatEta(eta.estimatedArrival);
  const distance = formatDistance(eta.distance);
  const duration = formatDuration(eta.durationInTraffic);

  return `Heading to ${destination}. ETA: ${etaTime} (${distance}, ~${duration} in traffic)`;
}
