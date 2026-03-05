import React, { useState, useEffect, useRef } from 'react';
import { User, Trip, TripStatus } from '../types';
import { subscribeToTrips, saveTrip } from '../services/storageService';
import { MapPin, Navigation, DollarSign, Upload, CheckCircle, Clock, PlusCircle, ChevronRight, Truck, Loader2, Calendar, Share2, ArrowRight } from 'lucide-react';
import { LocationPicker } from '../components/LocationPicker';

interface DriverDashboardProps {
  user: User;
  onNotify: (msg: string, type: 'info' | 'success' | 'error') => void;
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({ user, onNotify }) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [view, setView] = useState<'list' | 'detail' | 'request'>('list');
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const selectedTrip = trips.find(t => t.id === selectedTripId) || null;
  
  const firstLoad = useRef(true);
  const prevTripsRef = useRef<Trip[]>([]);
  const isMounted = useRef(true);
  
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CASH'>('CASH');
  const [amount, setAmount] = useState('');
  const [proof, setProof] = useState<string | null>(null);
  
  // Helper to get local ISO string for input[type="datetime-local"]
  const getLocalNow = () => {
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16);
  };

  // Request trip form state
  const [reqTrip, setReqTrip] = useState({ 
    cust: '', 
    from: '', fromLat: 0, fromLng: 0,
    to: '', toLat: 0, toLng: 0,
    scheduledTime: getLocalNow()
  });

  useEffect(() => {
    isMounted.current = true;
    
    const unsubscribe = subscribeToTrips((allTrips) => {
        if (!isMounted.current) return;
        
        // Filter trips assigned to this driver
        const myTrips = allTrips.filter(t => t.driverId === user.id && t.status !== TripStatus.COMPLETED && t.status !== TripStatus.CANCELLED);
        const sorted = myTrips.sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
        
        if (!firstLoad.current && prevTripsRef.current.length > 0) {
            const prevIds = new Set(prevTripsRef.current.map(t => t.id));
            const newAssignments = sorted.filter(t => !prevIds.has(t.id));

            if (newAssignments.length > 0) {
                onNotify(`You have ${newAssignments.length} new trip(s)!`, 'info');
            }

            sorted.forEach(t => {
                const prev = prevTripsRef.current.find(p => p.id === t.id);
                if (prev && prev.status === TripStatus.PENDING_APPROVAL && t.status === TripStatus.SCHEDULED) {
                     onNotify(`Trip for ${t.customerName} Approved!`, 'success');
                }
            });
        }

        setTrips(sorted);
        prevTripsRef.current = sorted;
        firstLoad.current = false;
        setIsLoading(false);
    });

    return () => {
        isMounted.current = false;
        unsubscribe();
    };
  }, [user.id]);

  const handleStatusUpdate = async (status: TripStatus) => {
    if (!selectedTrip) return;
    
    const updated: Trip = {
      ...selectedTrip,
      status: status,
      timeline: [...selectedTrip.timeline, { status, timestamp: new Date().toISOString() }]
    };
    
    await saveTrip(updated);
    onNotify(`Status updated: ${status.replace(/_/g, ' ')}`, 'success');
  };

  const handleCompleteTrip = async () => {
    if (!selectedTrip) return;
    if (!amount) return onNotify('Please enter amount received', 'error');

    const updated: Trip = {
      ...selectedTrip,
      status: TripStatus.COMPLETED,
      paymentMethod,
      paymentAmount: parseFloat(amount),
      paymentProofUrl: proof || undefined,
      timeline: [...selectedTrip.timeline, { status: TripStatus.COMPLETED, timestamp: new Date().toISOString() }]
    };

    await saveTrip(updated);
    onNotify('Trip Completed! Payment Recorded.', 'success');
    setSelectedTripId(null);
    setView('list');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProof(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqTrip.cust || !reqTrip.from || !reqTrip.to) return;

    const trip: Trip = {
      id: `t_req_${Date.now()}`,
      customerName: reqTrip.cust,
      driverId: user.id,
      pickupLocation: reqTrip.from,
      pickupLat: reqTrip.fromLat,
      pickupLng: reqTrip.fromLng,
      dropLocation: reqTrip.to,
      dropLat: reqTrip.toLat,
      dropLng: reqTrip.toLng,
      scheduledTime: reqTrip.scheduledTime || new Date().toISOString(),
      status: TripStatus.PENDING_APPROVAL,
      isDriverRequested: true,
      createdAt: new Date().toISOString(),
      timeline: []
    };
    await saveTrip(trip);
    onNotify('Request submitted for approval.', 'info');
    // Reset form but keep time current
    setReqTrip({ cust: '', from: '', fromLat: 0, fromLng: 0, to: '', toLat: 0, toLng: 0, scheduledTime: getLocalNow() });
    setView('list');
  };

  const startNavigation = (lat?: number, lng?: number, address?: string) => {
    if (lat && lng) {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    } else if (address) {
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
    }
  };

  const sendWhatsAppUpdate = () => {
    if(!selectedTrip) return;
    const text = `Update for Trip ${selectedTrip.id.substring(0,6)}:
Customer: ${selectedTrip.customerName}
Status: ${selectedTrip.status.replace(/_/g, ' ')}
Current Location: https://maps.google.com/?q=${selectedTrip.pickupLat},${selectedTrip.pickupLng}`; 
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Render buttons strictly based on the current state to enforce workflow
  const renderWorkflowAction = () => {
      if (!selectedTrip) return null;

      switch(selectedTrip.status) {
          case TripStatus.SCHEDULED:
              return (
                <button onClick={() => handleStatusUpdate(TripStatus.STARTED)} className="w-full py-5 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-green-200 text-xl active:scale-95 transition-transform flex items-center justify-center">
                  START TRIP <ArrowRight className="ml-3 w-6 h-6"/>
                </button>
              );
          case TripStatus.STARTED:
              return (
                <div className="space-y-3">
                    <p className="text-center text-sm text-gray-500 font-medium">Head to the pickup location.</p>
                    <button onClick={() => handleStatusUpdate(TripStatus.PICKUP_REACHED)} className="w-full py-5 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 text-xl active:scale-95 transition-transform flex items-center justify-center">
                    REACHED PICKUP <MapPin className="ml-3 w-6 h-6"/>
                    </button>
                </div>
              );
          case TripStatus.PICKUP_REACHED:
              return (
                 <div className="bg-orange-50 p-5 rounded-2xl text-center border border-orange-100 shadow-sm">
                     <h3 className="text-orange-900 font-bold text-lg mb-1">Loading Phase</h3>
                     <p className="text-orange-700/80 font-medium mb-4 text-sm">Load goods into the vehicle securely.</p>
                     <button onClick={() => handleStatusUpdate(TripStatus.PICKUP_COMPLETED)} className="w-full py-4 bg-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-200 text-lg active:scale-95 transition-transform flex items-center justify-center">
                        CONFIRM GOODS LOADED <CheckCircle className="ml-2 w-6 h-6"/>
                    </button>
                 </div>
              );
          case TripStatus.PICKUP_COMPLETED:
              return (
                <div className="space-y-3">
                     <p className="text-center text-sm text-gray-500 font-medium">Ready to move towards drop location?</p>
                    <button onClick={() => handleStatusUpdate(TripStatus.IN_TRANSIT)} className="w-full py-5 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 text-xl active:scale-95 transition-transform flex items-center justify-center">
                    START DELIVERY <Truck className="ml-3 w-6 h-6"/>
                    </button>
                </div>
              );
          case TripStatus.IN_TRANSIT:
              return (
                 <div className="space-y-3">
                    <p className="text-center text-sm text-gray-500 font-medium">Driving to destination...</p>
                    <button onClick={() => handleStatusUpdate(TripStatus.DROP_REACHED)} className="w-full py-5 bg-purple-600 text-white font-bold rounded-2xl shadow-lg shadow-purple-200 text-xl active:scale-95 transition-transform flex items-center justify-center">
                        REACHED DROP LOCATION <MapPin className="ml-3 w-6 h-6"/>
                    </button>
                 </div>
              );
          case TripStatus.DROP_REACHED:
              return (
                <div className="space-y-5 bg-surface p-5 rounded-2xl border border-green-200 animate-fade-in">
                  <h3 className="font-bold text-gray-800 text-center flex items-center justify-center"><DollarSign className="w-5 h-5 mr-1 text-primary"/> Collect Payment</h3>
                  
                  <div className="flex gap-2 p-1 bg-white rounded-xl border border-gray-200">
                    <button 
                      onClick={() => setPaymentMethod('CASH')}
                      className={`flex-1 py-3 rounded-lg font-bold transition-all ${paymentMethod === 'CASH' ? 'bg-secondary text-white shadow-md' : 'text-gray-500'}`}
                    >Cash</button>
                     <button 
                      onClick={() => setPaymentMethod('UPI')}
                      className={`flex-1 py-3 rounded-lg font-bold transition-all ${paymentMethod === 'UPI' ? 'bg-secondary text-white shadow-md' : 'text-gray-500'}`}
                    >UPI</button>
                  </div>

                  <div className="relative">
                    <span className="absolute left-4 top-4 text-gray-400 font-bold">₹</span>
                    <input 
                      type="number" 
                      placeholder="Amount" 
                      className="w-full pl-10 p-4 rounded-xl border border-gray-200 text-lg font-bold outline-none focus:ring-2 focus:ring-primary"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                    />
                  </div>

                  {paymentMethod === 'UPI' && (
                    <div>
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-green-300 bg-white rounded-xl cursor-pointer hover:bg-green-50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 text-primary mb-2" />
                            <p className="text-sm text-gray-500 font-medium">{proof ? 'Screenshot Attached' : 'Upload Payment Screenshot'}</p>
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                      </label>
                    </div>
                  )}

                  <button onClick={handleCompleteTrip} className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-green-200 text-lg flex justify-center items-center active:scale-95 transition-transform">
                    <CheckCircle className="mr-2 w-6 h-6" /> COLLECTED PAYMENT & COMPLETE
                  </button>
                </div>
              );
          case TripStatus.PENDING_APPROVAL:
              return (
                  <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 text-center">
                      <p className="text-yellow-800 font-bold">Waiting for Admin Approval</p>
                      <p className="text-xs text-yellow-600 mt-1">You can start this trip once approved.</p>
                  </div>
              );
          default:
              return null;
      }
  };

  if (view === 'request') {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-soft mt-2 animate-fade-in border border-green-50">
        <h2 className="text-xl font-bold mb-6 text-gray-800">Request Ad-hoc Trip</h2>
        <form onSubmit={submitRequest} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">Customer Name</label>
            <input 
                className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-primary outline-none text-lg"
                placeholder="e.g. Walk-in Client"
                value={reqTrip.cust}
                onChange={e => setReqTrip({...reqTrip, cust: e.target.value})}
                required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">Scheduled Date & Time</label>
            <div className="relative">
                <Calendar className="absolute left-4 top-4 text-gray-400 w-5 h-5"/>
                <input 
                    type="datetime-local"
                    className="w-full pl-12 p-4 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-primary outline-none text-lg font-medium"
                    value={reqTrip.scheduledTime}
                    onChange={e => setReqTrip({...reqTrip, scheduledTime: e.target.value})}
                    required
                />
            </div>
          </div>
          
          <LocationPicker 
            label="Pickup Location"
            value={reqTrip.from}
            onChange={(val) => setReqTrip(prev => ({...prev, from: val.address, fromLat: val.lat, fromLng: val.lng}))}
            required
            placeholder="Pickup address..."
          />

          <LocationPicker 
            label="Drop Location"
            value={reqTrip.to}
            onChange={(val) => setReqTrip(prev => ({...prev, to: val.address, toLat: val.lat, toLng: val.lng}))}
            required
            placeholder="Drop address..."
          />

          <div className="flex space-x-3 pt-4">
            <button type="button" onClick={() => setView('list')} className="flex-1 py-4 text-gray-600 font-bold bg-gray-100 rounded-xl text-lg">Cancel</button>
            <button type="submit" className="flex-1 py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-green-200 text-lg flex items-center justify-center">
                Submit Request <ArrowRight className="ml-2 w-5 h-5"/>
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (selectedTrip) {
    // Detailed Workflow View
    return (
      <div className="space-y-4 animate-fade-in">
        <button onClick={() => { setSelectedTripId(null); setView('list'); }} className="flex items-center text-sm font-bold text-gray-500 mb-2 p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors">
            <div className="bg-white rounded-full p-1 mr-2 shadow-sm border border-gray-200"><ChevronRight className="rotate-180 w-4 h-4"/></div>
            Back to Queue
        </button>
        
        <div className="bg-white rounded-3xl shadow-soft overflow-hidden border border-green-50">
          {/* Header */}
          <div className="bg-secondary p-6 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10"><Truck className="w-24 h-24"/></div>
             <div className="flex justify-between items-start z-10 relative">
               <div>
                  <h2 className="text-2xl font-bold leading-tight">{selectedTrip.customerName}</h2>
                  <div className="flex items-center mt-2 opacity-90">
                    <Clock className="w-4 h-4 mr-1"/>
                    <span className="text-sm font-medium">{new Date(selectedTrip.scheduledTime).toLocaleString([], { weekday: 'short', hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
               </div>
               <button onClick={sendWhatsAppUpdate} className="bg-white/20 p-2.5 rounded-xl hover:bg-white/30 transition backdrop-blur-sm">
                  <Share2 className="w-5 h-5 text-white" />
               </button>
             </div>
          </div>
          
          <div className="p-6 space-y-8">
            {/* Step Indicator */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Current Status</p>
                <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                        [TripStatus.SCHEDULED, TripStatus.PENDING_APPROVAL].includes(selectedTrip.status) ? 'bg-yellow-400 animate-pulse' :
                        [TripStatus.COMPLETED].includes(selectedTrip.status) ? 'bg-green-500' : 'bg-blue-500 animate-pulse'
                    }`}></div>
                    <span className="text-lg font-extrabold text-gray-800">
                        {selectedTrip.status.replace(/_/g, ' ')}
                    </span>
                </div>
            </div>

            {/* Location Details */}
            <div className="space-y-6 relative">
              {/* Vertical Line */}
              <div className="absolute left-[27px] top-8 bottom-8 w-0.5 bg-gray-200"></div>

              <div className={`flex items-start gap-4 transition-opacity ${[TripStatus.PICKUP_COMPLETED, TripStatus.IN_TRANSIT, TripStatus.DROP_REACHED].includes(selectedTrip.status) ? 'opacity-50' : 'opacity-100'}`}>
                <div className="mt-1 bg-green-100 p-2 rounded-full relative z-10 border-4 border-white shadow-sm">
                    <MapPin className="text-primary w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-400 font-bold uppercase mb-1">Pickup From</p>
                  <p className="font-bold text-gray-800 text-lg leading-tight mb-2">{selectedTrip.pickupLocation}</p>
                  <button 
                    onClick={() => startNavigation(selectedTrip.pickupLat, selectedTrip.pickupLng, selectedTrip.pickupLocation)}
                    className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center w-max active:bg-blue-100 border border-blue-100"
                  >
                    <Navigation className="w-4 h-4 mr-2" /> Navigate
                  </button>
                </div>
              </div>

              <div className={`flex items-start gap-4 transition-opacity ${[TripStatus.SCHEDULED, TripStatus.STARTED, TripStatus.PICKUP_REACHED].includes(selectedTrip.status) ? 'opacity-50' : 'opacity-100'}`}>
                <div className="mt-1 bg-red-50 p-2 rounded-full relative z-10 border-4 border-white shadow-sm">
                    <MapPin className="text-red-500 w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-400 font-bold uppercase mb-1">Deliver To</p>
                  <p className="font-bold text-gray-800 text-lg leading-tight mb-2">{selectedTrip.dropLocation}</p>
                   <button 
                    onClick={() => startNavigation(selectedTrip.dropLat, selectedTrip.dropLng, selectedTrip.dropLocation)}
                    className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center w-max active:bg-blue-100 border border-blue-100"
                   >
                    <Navigation className="w-4 h-4 mr-2" /> Navigate
                  </button>
                </div>
              </div>
            </div>

            {/* Workflow Actions */}
            <div className="pt-6 border-t border-gray-100">
               {renderWorkflowAction()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
         <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
         <p className="text-gray-400 font-medium">Loading Trips...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-end mb-6 sticky top-20 z-30 bg-surface/95 backdrop-blur py-2">
        <div>
            <h2 className="text-2xl font-bold text-gray-800 leading-none">My Queue</h2>
            <p className="text-xs text-gray-400 font-medium mt-1">Today's Schedule</p>
        </div>
        <button 
          onClick={() => setView('request')}
          className="bg-secondary text-white px-5 py-3 rounded-xl text-sm font-bold flex items-center shadow-lg active:scale-95 transition-transform"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Request Trip
        </button>
      </div>

      <div className="space-y-4 pb-12">
        {trips.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 text-gray-300">
             <Clock className="w-16 h-16 mb-4 opacity-50" />
             <p className="font-medium">No trips assigned.</p>
             <p className="text-xs">Enjoy your break!</p>
           </div>
        ) : (
          trips.map(trip => (
            <div 
              key={trip.id} 
              onClick={() => { setSelectedTripId(trip.id); setView('detail'); }}
              className={`bg-white rounded-2xl shadow-soft border-l-[6px] active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden group ${
                  trip.status === TripStatus.PENDING_APPROVAL ? 'border-orange-400' : 'border-primary'
              }`}
            >
              <div className="absolute right-0 top-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="text-gray-300"/>
              </div>

              {/* Explicit Date and Time Display - Top Header */}
              <div className="bg-gray-50 border-b border-gray-100 p-3 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-sm font-extrabold text-gray-800">
                        {new Date(trip.scheduledTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                 </div>
                 <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-sm font-extrabold text-gray-800">
                        {new Date(trip.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                 </div>
              </div>

              <div className="p-4 pt-3">
                <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{trip.customerName}</h3>
                    <span className={`text-[10px] px-2 py-1 rounded-md font-extrabold uppercase tracking-wide ${
                    trip.status === TripStatus.SCHEDULED ? 'bg-blue-50 text-blue-600' : 
                    trip.status === TripStatus.PENDING_APPROVAL ? 'bg-orange-50 text-orange-600' :
                    'bg-yellow-50 text-yellow-600'
                    }`}>
                    {trip.status.replace(/_/g, ' ')}
                    </span>
                </div>
                
                <div className="space-y-2 mb-2">
                    <div className="flex items-center text-gray-600">
                        <div className="w-6 flex justify-center mr-2"><div className="w-2 h-2 rounded-full bg-primary ring-2 ring-green-100"></div></div>
                        <p className="text-sm font-medium line-clamp-1">{trip.pickupLocation}</p>
                    </div>
                    <div className="flex items-center text-gray-600">
                        <div className="w-6 flex justify-center mr-2"><div className="w-2 h-2 rounded-full bg-red-400 ring-2 ring-red-100"></div></div>
                        <p className="text-sm font-medium line-clamp-1">{trip.dropLocation}</p>
                    </div>
                </div>

                {trip.estimatedDistance && 
                    <div className="flex justify-end pt-2 border-t border-gray-50 mt-2">
                        <span className="text-[10px] text-gray-400 font-semibold">{trip.estimatedDistance}</span>
                    </div>
                }
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
