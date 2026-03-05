import React, { useState } from 'react';
import { Trip, TripStatus } from '../types';
import { saveTrip } from '../services/storageService';
import { MapPin, Calendar, Package, Phone, User as UserIcon, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { LocationPicker } from '../components/LocationPicker';
import { useNavigate } from 'react-router-dom';

export const CustomerBooking: React.FC<{ onNotify: (msg: string, type: 'info'|'success'|'error') => void }> = ({ onNotify }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    goodsType: '',
    pickup: '',
    pickupLat: 0,
    pickupLng: 0,
    drop: '',
    dropLat: 0,
    dropLng: 0,
    isMultiDrop: false,
    dropCount: 1,
    scheduledTime: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pickup || !formData.drop || !formData.scheduledTime) {
      onNotify('Please fill in all location and time details.', 'error');
      return;
    }

    setIsLoading(true);
    
    // Simulate network delay
    await new Promise(r => setTimeout(r, 1000));

    try {
      const trip: Trip = {
        id: `t_cust_${Date.now()}`,
        customerName: formData.name,
        customerPhone: formData.phone,
        // Critical: driverId is empty for customer requests until Admin assigns one
        driverId: '', 
        pickupLocation: formData.pickup,
        pickupLat: formData.pickupLat,
        pickupLng: formData.pickupLng,
        dropLocation: formData.drop,
        dropLat: formData.dropLat,
        dropLng: formData.dropLng,
        goodsType: formData.goodsType,
        isMultiDrop: formData.isMultiDrop,
        dropCount: formData.isMultiDrop ? formData.dropCount : 0,
        scheduledTime: formData.scheduledTime,
        status: TripStatus.PENDING_APPROVAL,
        isDriverRequested: false, // It is Customer requested
        createdAt: new Date().toISOString(),
        timeline: []
      };

      await saveTrip(trip);
      setIsSuccess(true);
      onNotify('Trip Request Sent Successfully!', 'success');
    } catch (error) {
      console.error(error);
      onNotify('Failed to submit request. Try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-soft max-w-md w-full text-center space-y-6 border border-green-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Request Received!</h2>
          <p className="text-gray-500">
            Thank you, {formData.name}. Our team will review your request for moving <strong>{formData.goodsType}</strong> and assign a driver shortly.
          </p>
          <div className="bg-gray-50 p-4 rounded-xl text-left text-sm space-y-2">
            <p><strong>Pickup:</strong> {formData.pickup}</p>
            <p><strong>Drop:</strong> {formData.drop}</p>
            <p><strong>Time:</strong> {new Date(formData.scheduledTime).toLocaleString()}</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform"
          >
            Book Another Trip
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-green-100 sticky top-0 z-30">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <img src="/generated-image (4).png" alt="Logo" className="w-8 h-8 object-contain"/>
              <span className="font-bold text-lg text-gray-800">Eco<span className="text-primary">Express</span></span>
           </div>
           <button onClick={() => navigate('/login')} className="text-sm font-bold text-primary hover:underline">
             Login
           </button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 animate-fade-in">
        <div className="text-center mb-6 mt-4">
          <h1 className="text-2xl font-bold text-gray-900">Book Your Trip</h1>
          <p className="text-gray-500 text-sm">Fast, reliable, and eco-friendly logistics.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Personal Info */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center">
              <UserIcon className="w-4 h-4 mr-2"/> Contact Details
            </h3>
            <div className="space-y-3">
              <input 
                type="text" 
                placeholder="Your Name (Required)" 
                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
              />
              <input 
                type="tel" 
                placeholder="Mobile Number (Required)" 
                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                required
              />
            </div>
          </div>

          {/* Cargo Info */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center">
              <Package className="w-4 h-4 mr-2"/> Cargo Details
            </h3>
            <div className="space-y-3">
              <input 
                type="text" 
                placeholder="Goods Type (e.g. Furniture, Electronics)" 
                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                value={formData.goodsType}
                onChange={e => setFormData({...formData, goodsType: e.target.value})}
                required
              />
              
              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer ${formData.isMultiDrop ? 'bg-primary border-primary' : 'bg-white border-gray-300'}`} onClick={() => setFormData(p => ({...p, isMultiDrop: !p.isMultiDrop}))}>
                    {formData.isMultiDrop && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className="text-sm font-medium text-gray-700">Multiple Drop Locations?</span>
                </div>
              </div>

              {formData.isMultiDrop && (
                <div className="animate-fade-in pl-4 border-l-2 border-primary">
                  <label className="text-xs font-bold text-gray-500 mb-1 block">How many drops?</label>
                  <input 
                    type="number" 
                    min="2"
                    max="10"
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                    value={formData.dropCount}
                    onChange={e => setFormData({...formData, dropCount: parseInt(e.target.value)})}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Locations */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
             <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center">
              <MapPin className="w-4 h-4 mr-2"/> Route
            </h3>
            <div className="space-y-4">
              <LocationPicker 
                label="Pickup Location"
                value={formData.pickup}
                onChange={(val) => setFormData(p => ({...p, pickup: val.address, pickupLat: val.lat, pickupLng: val.lng}))}
                required
                placeholder="Search pickup address"
              />
              <LocationPicker 
                label="Drop Location"
                value={formData.drop}
                onChange={(val) => setFormData(p => ({...p, drop: val.address, dropLat: val.lat, dropLng: val.lng}))}
                required
                placeholder="Search drop address"
              />
            </div>
          </div>

          {/* Time */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
             <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center">
              <Calendar className="w-4 h-4 mr-2"/> Schedule
            </h3>
            <input 
              type="datetime-local" 
              className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium"
              value={formData.scheduledTime}
              onChange={e => setFormData({...formData, scheduledTime: e.target.value})}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-4 bg-primary text-white font-bold text-lg rounded-xl shadow-lg shadow-green-200 flex items-center justify-center active:scale-95 transition-transform"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin"/> : <span className="flex items-center">Request Trip <ArrowRight className="ml-2 w-5 h-5"/></span>}
          </button>
        </form>
      </main>
    </div>
  );
};
