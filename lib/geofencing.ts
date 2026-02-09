/**
 * Geofencing Utility for Amin Academy
 * Handles distance calculations and location verification.
 */

// Academy Coordinates: 31.369101, 74.363653
export const ACADEMY_LOCATION = {
    latitude: 31.369101,
    longitude: 74.363653
};

// Allowed radius from academy in meters (20 Marla plot area ~ 13m radius, 25m for GPS buffer)
export const ALLOWED_RADIUS_METERS = 25;

/**
 * Calculates the distance between two points in meters using the Haversine formula.
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * Checks if a given position is within the academy's radius.
 */
export function isWithinAcademyRadius(lat: number, lon: number): boolean {
    const distance = calculateDistance(
        lat,
        lon,
        ACADEMY_LOCATION.latitude,
        ACADEMY_LOCATION.longitude
    );
    return distance <= ALLOWED_RADIUS_METERS;
}

/**
 * Promise-based wrapper for Geolocation API
 */
export function getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation is not supported by your browser"));
            return;
        }

        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        });
    });
}
