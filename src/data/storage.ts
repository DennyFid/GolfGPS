import { Platform } from 'react-native';
import { GolfCourse } from '../types';

const STORAGE_KEYS = {
  COURSES: 'golfgps_courses',
  ACTIVE_COURSE: 'golfgps_active_course_id',
};

// Memory fallback for Native environments or when localStorage isn't available
const memoryStore: Record<string, string> = {};

// Helper to initialize some default courses if none exist
const DEFAULT_COURSES: GolfCourse[] = [
  {
    id: 'pebble-beach',
    name: 'Pebble Beach Golf Links',
    lastUpdated: Date.now(),
    holes: Array.from({ length: 18 }, (_, i) => ({
      holeNumber: i + 1,
      greenPoints: {
        // Let's pre-populate some coordinates near Pebble Beach green (approx 36.5684° N, 121.9566° W)
        // with slight variance for F/C/B to demonstrate the UI out-of-the-box
        front: {
          latitude: 36.5684 + (i * 0.0001) - 0.00005,
          longitude: -121.9566 + (i * 0.0001) - 0.00005,
          accuracy: 1.5,
          timestamp: Date.now()
        },
        center: {
          latitude: 36.5684 + (i * 0.0001),
          longitude: -121.9566 + (i * 0.0001),
          accuracy: 1.2,
          timestamp: Date.now()
        },
        back: {
          latitude: 36.5684 + (i * 0.0001) + 0.00005,
          longitude: -121.9566 + (i * 0.0001) + 0.00005,
          accuracy: 1.6,
          timestamp: Date.now()
        }
      }
    }))
  },
  {
    id: 'augusta-national',
    name: 'Augusta National GC',
    lastUpdated: Date.now(),
    holes: Array.from({ length: 18 }, (_, i) => ({
      holeNumber: i + 1,
      greenPoints: {
        front: null,
        center: null,
        back: null
      }
    }))
  }
];

export const StorageService = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        console.error('Failed to read from localStorage:', e);
      }
    }
    return memoryStore[key] || null;
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch (e) {
        console.error('Failed to write to localStorage:', e);
      }
    }
    memoryStore[key] = value;
  },

  async getCourses(): Promise<GolfCourse[]> {
    const raw = await this.getItem(STORAGE_KEYS.COURSES);
    if (!raw) {
      // Seed default courses if empty
      await this.setItem(STORAGE_KEYS.COURSES, JSON.stringify(DEFAULT_COURSES));
      return DEFAULT_COURSES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_COURSES;
    }
  },

  async saveCourse(course: GolfCourse): Promise<void> {
    const courses = await this.getCourses();
    const idx = courses.findIndex(c => c.id === course.id);
    if (idx >= 0) {
      courses[idx] = course;
    } else {
      courses.push(course);
    }
    await this.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
  },

  async deleteCourse(courseId: string): Promise<void> {
    const courses = await this.getCourses();
    const updated = courses.filter(c => c.id !== courseId);
    await this.setItem(STORAGE_KEYS.COURSES, JSON.stringify(updated));
  },

  async getActiveCourseId(): Promise<string | null> {
    const active = await this.getItem(STORAGE_KEYS.ACTIVE_COURSE);
    return active || 'pebble-beach'; // Default to Pebble Beach if none active
  },

  async setActiveCourseId(id: string | null): Promise<void> {
    await this.setItem(STORAGE_KEYS.ACTIVE_COURSE, id || '');
  }
};
