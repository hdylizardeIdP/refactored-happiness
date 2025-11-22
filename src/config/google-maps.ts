import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

/**
 * Google Maps API configuration
 */
const apiKey = process.env.GOOGLE_MAPS_API_KEY;

if (!apiKey) {
  logger.error('Missing Google Maps API key. Please set GOOGLE_MAPS_API_KEY environment variable.');
}

/**
 * Google Maps API base URL
 */
const GOOGLE_MAPS_BASE_URL = 'https://maps.googleapis.com/maps/api';

/**
 * Axios instance for Google Maps API calls
 */
export const googleMapsClient: AxiosInstance = axios.create({
  baseURL: GOOGLE_MAPS_BASE_URL,
  timeout: 10000,
});

/**
 * Geocoding API - Convert address to coordinates
 */
export async function geocodeAddress(address: string): Promise<{
  lat: number;
  lng: number;
  formattedAddress: string;
} | null> {
  try {
    const response = await googleMapsClient.get('/geocode/json', {
      params: {
        address,
        key: apiKey,
      },
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const result = response.data.results[0];
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        formattedAddress: result.formatted_address,
      };
    }

    logger.warn(`Geocoding failed for address: ${address}`, {
      status: response.data.status,
    });
    return null;
  } catch (error) {
    logger.error('Geocoding API error', { error, address });
    return null;
  }
}

/**
 * Directions API - Get route and ETA between two points
 */
export async function getDirections(
  origin: { lat: number; lng: number } | string,
  destination: { lat: number; lng: number } | string,
  departureTime: Date = new Date()
): Promise<{
  distance: number; // meters
  duration: number; // seconds
  durationInTraffic: number; // seconds
  polyline: string;
} | null> {
  try {
    const originStr =
      typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`;
    const destinationStr =
      typeof destination === 'string'
        ? destination
        : `${destination.lat},${destination.lng}`;

    const response = await googleMapsClient.get('/directions/json', {
      params: {
        origin: originStr,
        destination: destinationStr,
        departure_time: Math.floor(departureTime.getTime() / 1000),
        traffic_model: 'best_guess',
        key: apiKey,
      },
    });

    if (response.data.status === 'OK' && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      const leg = route.legs[0];

      return {
        distance: leg.distance.value,
        duration: leg.duration.value,
        durationInTraffic: leg.duration_in_traffic?.value || leg.duration.value,
        polyline: route.overview_polyline.points,
      };
    }

    logger.warn('Directions API returned no routes', {
      status: response.data.status,
      origin: originStr,
      destination: destinationStr,
    });
    return null;
  } catch (error) {
    logger.error('Directions API error', { error, origin, destination });
    return null;
  }
}

/**
 * Reverse geocoding - Convert coordinates to address
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string | null> {
  try {
    const response = await googleMapsClient.get('/geocode/json', {
      params: {
        latlng: `${lat},${lng}`,
        key: apiKey,
      },
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      return response.data.results[0].formatted_address;
    }

    logger.warn(`Reverse geocoding failed for coordinates: ${lat},${lng}`, {
      status: response.data.status,
    });
    return null;
  } catch (error) {
    logger.error('Reverse geocoding API error', { error, lat, lng });
    return null;
  }
}
