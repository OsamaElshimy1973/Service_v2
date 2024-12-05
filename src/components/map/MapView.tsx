import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { User } from '../../types';
import { MapController } from './MapController';
import { UserMarker } from './UserMarker';
import { MapControls } from './MapControls';
import { useLocationTracking } from '../../hooks/useLocationTracking';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { storageService } from '../../services/StorageService';
import { AlertCircle } from 'lucide-react';

interface MapViewProps {
  onUserSelect?: (user: User) => void;
}

const MapView: React.FC<MapViewProps> = ({ onUserSelect }) => {
  const mapRef = useRef<L.Map>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const currentUser = useAuthStore((state) => state.user);
  const allUsers = useUserStore((state) => state.activeUsers);
  
  const { currentLocation, error, loading } = useLocationTracking(
    currentUser,
    10,
    30000
  );

  useEffect(() => {
    // Load stored locations when component mounts
    const storedLocations = storageService.getStoredLocations();
    storedLocations.forEach(user => {
      if (user.id !== currentUser?.id) {
        useUserStore.getState().addActiveUser(user);
      }
    });
  }, [currentUser?.id]);

  const nearbyUsers = allUsers.filter(user => 
    user.id !== currentUser?.id && 
    user.location && 
    user.role !== currentUser?.role
  );

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.invalidateSize();
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-gray-600">Loading map...</div>
      </div>
    );
  }

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    onUserSelect?.(user);
  };

  return (
    <div className="relative h-full w-full">
      {error && (
        <div className="absolute top-4 left-4 right-4 z-[1000] bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      <MapContainer
        center={[currentLocation.latitude, currentLocation.longitude]}
        zoom={13}
        className="h-full w-full"
        ref={mapRef}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        
        {currentUser && currentLocation && (
          <UserMarker
            user={{
              ...currentUser,
              location: currentLocation
            }}
            isCurrentUser={true}
          />
        )}

        {nearbyUsers.map((user) => (
          <UserMarker
            key={user.id}
            user={user}
            isSelected={selectedUser?.id === user.id}
            onClick={handleUserClick}
          />
        ))}

        <MapController 
          center={[currentLocation.latitude, currentLocation.longitude]}
          zoom={13}
        />
        
        <MapControls
          mapRef={mapRef}
          currentLocation={[currentLocation.latitude, currentLocation.longitude]}
        />
      </MapContainer>
    </div>
  );
};

export default MapView;