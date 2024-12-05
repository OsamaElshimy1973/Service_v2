import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '../types';
import { userSyncService } from '../services/UserSyncService';
import { storageService } from '../services/StorageService';

interface UserState {
  users: User[];
  activeUsers: User[];
  addUser: (user: User) => void;
  updateUserLocation: (userId: string, latitude: number, longitude: number) => void;
  updateUserRating: (userId: string, rating: number) => void;
  addActiveUser: (user: User) => void;
  removeActiveUser: (userId: string) => void;
  syncUsers: (deployedUsers: User[]) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      users: [],
      activeUsers: [],
      addUser: (user) =>
        set((state) => {
          const existingUser = state.users.find(u => u.phoneNumber === user.phoneNumber);
          if (existingUser) {
            return state;
          }
          
          userSyncService.updateDeployedUser(user);
          storageService.saveUserLocation(user);
          
          const storedUsers = storageService.getStoredLocations();
          
          return {
            users: [...state.users, user],
            activeUsers: [...storedUsers, user],
          };
        }),
      updateUserLocation: (userId, latitude, longitude) =>
        set((state) => {
          const updatedUsers = state.users.map((user) =>
            user.id === userId ? { ...user, location: { latitude, longitude } } : user
          );
          
          const updatedUser = updatedUsers.find(u => u.id === userId);
          if (updatedUser) {
            userSyncService.updateDeployedUser(updatedUser);
            storageService.saveUserLocation(updatedUser);
          }
          
          const storedUsers = storageService.getStoredLocations();
          
          return {
            users: updatedUsers,
            activeUsers: storedUsers,
          };
        }),
      updateUserRating: (userId, rating) =>
        set((state) => {
          const updatedUsers = state.users.map((user) =>
            user.id === userId
              ? {
                  ...user,
                  rating: user.rating ? (user.rating + rating) / 2 : rating,
                }
              : user
          );
          
          const updatedUser = updatedUsers.find(u => u.id === userId);
          if (updatedUser) {
            userSyncService.updateDeployedUser(updatedUser);
            storageService.saveUserLocation(updatedUser);
          }
          
          return {
            users: updatedUsers,
            activeUsers: updatedUsers,
          };
        }),
      addActiveUser: (user) =>
        set((state) => {
          storageService.saveUserLocation(user);
          const storedUsers = storageService.getStoredLocations();
          return {
            ...state,
            activeUsers: storedUsers,
          };
        }),
      removeActiveUser: (userId) =>
        set((state) => ({
          ...state,
          activeUsers: state.activeUsers.filter((user) => user.id !== userId),
        })),
      syncUsers: (deployedUsers) =>
        set((state) => {
          const mergedUsers = [...state.users];
          
          deployedUsers.forEach(deployedUser => {
            const existingUserIndex = mergedUsers.findIndex(u => u.phoneNumber === deployedUser.phoneNumber);
            if (existingUserIndex === -1) {
              mergedUsers.push(deployedUser);
              storageService.saveUserLocation(deployedUser);
            } else {
              mergedUsers[existingUserIndex] = {
                ...mergedUsers[existingUserIndex],
                ...deployedUser,
              };
              storageService.saveUserLocation(deployedUser);
            }
          });

          const storedUsers = storageService.getStoredLocations();

          return {
            users: mergedUsers,
            activeUsers: storedUsers,
          };
        }),
    }),
    {
      name: 'user-storage',
      version: 4,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version: number) => {
        if (version === 3) {
          return {
            ...persistedState,
            activeUsers: storageService.getStoredLocations(),
          };
        }
        return persistedState;
      },
    }
  )
);