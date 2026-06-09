export interface GPSCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number; // in meters
  timestamp: number;
}

export interface GreenPoints {
  front: GPSCoordinates | null;
  center: GPSCoordinates | null;
  back: GPSCoordinates | null;
}

export interface HoleData {
  holeNumber: number; // 1 to 18
  greenPoints: GreenPoints;
}

export interface GolfCourse {
  id: string;
  name: string;
  holes: HoleData[]; // Array of 18 holes
  lastUpdated: number;
}

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'needs_sync';

export type GpsSource = 'phone' | 'watch_standalone';
