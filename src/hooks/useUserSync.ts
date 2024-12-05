import { useEffect } from 'react';
import { userSyncService } from '../services/UserSyncService';

export const useUserSync = () => {
  useEffect(() => {
    userSyncService.startSync();
    return () => userSyncService.stopSync();
  }, []);
};