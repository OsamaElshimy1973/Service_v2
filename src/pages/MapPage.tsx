import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import UserList from '../components/UserList';
import RatingModal from '../components/RatingModal';
import Header from '../components/Header';
import MapView from '../components/map/MapView';
import { User } from '../types';
import { useLocationTracking } from '../hooks/useLocationTracking';

const MapPage = () => {
  const location = useLocation();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userLimit, setUserLimit] = useState(5);
  
  const currentUser = useAuthStore((state) => state.user);
  const selectedService = location.state?.selectedService;

  const { nearbyUsers, error, loading } = useLocationTracking(
    currentUser,
    userLimit,
    60000 // Update every minute
  );

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
  };

  const handleRatingSubmit = (rating: number, comment: string) => {
    // Handle rating submission
    setShowRatingModal(false);
    setSelectedUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header title={`${selectedService?.name || 'Service'} Map`} />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 max-w-7xl mx-auto h-[calc(100vh-5rem)]">
        <div className="col-span-1 md:col-span-2 bg-white rounded-lg shadow-md overflow-hidden h-[600px] md:h-full">
          <MapView onUserSelect={handleUserSelect} />
        </div>
        
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-2">
              Nearby {currentUser?.role === 'provider' ? 'Customers' : 'Providers'}
            </h2>
            <p className="text-gray-600">Service: {selectedService?.name}</p>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                Show nearest
              </label>
              <select
                value={userLimit}
                onChange={(e) => setUserLimit(Number(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {[3, 5, 10, 15, 20].map((num) => (
                  <option key={num} value={num}>
                    {num} users
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="overflow-y-auto h-[calc(100vh-16rem)]">
            <UserList users={nearbyUsers} onSelect={handleUserSelect} />
          </div>
        </div>
      </div>

      {showRatingModal && selectedUser && (
        <RatingModal
          provider={selectedUser}
          onSubmit={handleRatingSubmit}
          onClose={() => setShowRatingModal(false)}
        />
      )}
    </div>
  );
};

export default MapPage;