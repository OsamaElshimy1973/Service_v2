import { User } from '../types';

export const serializeUser = (user: User): User => ({
  id: String(user.id),
  phoneNumber: String(user.phoneNumber),
  role: user.role,
  location: user.location ? {
    latitude: Number(user.location.latitude),
    longitude: Number(user.location.longitude),
  } : undefined,
  rating: user.rating ? Number(user.rating) : undefined,
});

export const serializeUsers = (users: User[]): User[] => 
  users.map(serializeUser);

export const safeJSONParse = <T>(data: string, fallback: T): T => {
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return fallback;
  }
};

export const safeJSONStringify = (data: any): string => {
  try {
    return JSON.stringify(data, (_, value) => {
      if (typeof value === 'symbol') {
        return value.toString();
      }
      return value;
    });
  } catch (error) {
    console.error('Error stringifying data:', error);
    return '[]';
  }
};