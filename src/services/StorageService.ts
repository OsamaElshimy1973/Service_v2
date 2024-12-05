import { User } from '../types';

class StorageService {
  private static instance: StorageService;
  private readonly STORAGE_KEY = 'subscriber-locations';

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  saveUserLocation(user: User): void {
    try {
      const locations = this.getStoredLocations();
      const existingIndex = locations.findIndex(u => u.id === user.id);
      
      if (existingIndex >= 0) {
        locations[existingIndex] = user;
      } else {
        locations.push(user);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(locations));
    } catch (error) {
      console.error('Error saving user location:', error);
    }
  }

  getStoredLocations(): User[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error retrieving stored locations:', error);
      return [];
    }
  }

  clearStoredLocations(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

export const storageService = StorageService.getInstance();