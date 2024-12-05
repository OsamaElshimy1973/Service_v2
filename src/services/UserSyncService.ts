import axios from 'axios';
import { User } from '../types';
import { useUserStore } from '../store/userStore';

class UserSyncService {
  private static instance: UserSyncService;
  private syncInterval: number = 30000;
  private intervalId?: NodeJS.Timeout;
  private apiUrl: string = 'https://service-marketplace-api.netlify.app/.netlify/functions/users';

  private constructor() {}

  static getInstance(): UserSyncService {
    if (!UserSyncService.instance) {
      UserSyncService.instance = new UserSyncService();
    }
    return UserSyncService.instance;
  }

  async fetchDeployedUsers(): Promise<User[]> {
    try {
      const response = await axios.get<User[]>(this.apiUrl);
      return response.data.map(user => ({
        ...user,
        id: user.id.toString(),
        phoneNumber: user.phoneNumber,
        role: user.role,
        location: user.location ? {
          latitude: Number(user.location.latitude),
          longitude: Number(user.location.longitude),
        } : undefined,
        rating: user.rating ? Number(user.rating) : undefined,
      }));
    } catch (error) {
      console.error('Error fetching deployed users:', error);
      return [];
    }
  }

  async updateDeployedUser(user: User): Promise<void> {
    try {
      const sanitizedUser = {
        ...user,
        id: user.id.toString(),
        phoneNumber: user.phoneNumber,
        role: user.role,
        location: user.location ? {
          latitude: Number(user.location.latitude),
          longitude: Number(user.location.longitude),
        } : undefined,
        rating: user.rating ? Number(user.rating) : undefined,
      };
      await axios.post(this.apiUrl, sanitizedUser);
    } catch (error) {
      console.error('Error updating deployed user:', error);
    }
  }

  startSync(): void {
    this.syncUsers();
    this.intervalId = setInterval(() => this.syncUsers(), this.syncInterval);
  }

  stopSync(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private async syncUsers(): Promise<void> {
    try {
      const deployedUsers = await this.fetchDeployedUsers();
      if (deployedUsers.length > 0) {
        const store = useUserStore.getState();
        store.syncUsers(deployedUsers);
      }
    } catch (error) {
      console.error('Error during user sync:', error);
    }
  }
}

export const userSyncService = UserSyncService.getInstance();