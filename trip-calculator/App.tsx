import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Layout } from './components/Layout';
// Lazy Load Pages for Optimization
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const DriverDashboard = React.lazy(() => import('./pages/DriverDashboard').then(module => ({ default: module.DriverDashboard })));
const CustomerBooking = React.lazy(() => import('./pages/CustomerBooking').then(module => ({ default: module.CustomerBooking })));

import { SignUp } from './pages/SignUp';

import { AdminLogin } from './pages/AdminLogin';
import { DriverLogin } from './pages/DriverLogin';
import { CustomerLogin } from './pages/CustomerLogin';
import { LandingPage } from './pages/LandingPage';

import { loginUser, getSession, logoutUser, initStorage, supabase } from './services/storageService';
import { User, UserRole, Notification } from './types';
import { Loader2 } from 'lucide-react';



const ProtectedRoute: React.FC<{ children: React.ReactNode, user: User | null }> = ({ children, user }) => {
    if (!user) return <Navigate to="/login" replace />;
    return <>{children}</>;
};

function App() {
    const [user, setUser] = useState<User | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOnline, setIsOnline] = useState(false);

    useEffect(() => {
        // Init
        initStorage();
        const session = getSession();
        if (session) setUser(session);
        setIsOnline(true);

        // Auth Listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                if (profile) {
                    const u = { ...profile, email: session.user.email } as User;
                    setUser(u);
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleNotify = (message: string, type: 'info' | 'success' | 'error') => {
        const id = Date.now().toString();
        setNotifications(prev => [...prev, { id, message, type, timestamp: Date.now() }]);
    };

    const clearNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const handleLogout = () => {
        logoutUser();
        setUser(null);
    };

    const basename = '/trip-calculator';

    return (
        <BrowserRouter basename={basename}>
            <Layout
                user={user}
                notifications={notifications}
                clearNotification={clearNotification}
                onLogout={handleLogout}
                isOnline={isOnline}
            >
                <React.Suspense fallback={
                    <div className="min-h-screen flex items-center justify-center">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    </div>
                }>
                    <Routes>
                        {/* Public Route for Customers */}
                        <Route path="/book" element={<CustomerBooking onNotify={handleNotify} />} />

                        <Route path="/admin-login" element={
                            user ? <Navigate to="/" replace /> : <AdminLogin onLogin={setUser} onNotify={handleNotify} />
                        } />

                        <Route path="/driver-login" element={
                            user ? <Navigate to="/" replace /> : <DriverLogin onLogin={setUser} onNotify={handleNotify} />
                        } />

                        <Route path="/customer-login" element={
                            user ? <Navigate to="/" replace /> : <CustomerLogin onLogin={setUser} onNotify={handleNotify} />
                        } />

                        <Route path="/signup" element={
                            user ? <Navigate to="/" replace /> : <SignUp onNotify={handleNotify} />
                        } />

                        <Route path="/" element={
                            user ? (
                                user.role === UserRole.ADMIN ? (
                                    <AdminDashboard user={user} onNotify={handleNotify} />
                                ) : user.role === UserRole.DRIVER ? (
                                    <DriverDashboard user={user} onNotify={handleNotify} />
                                ) : user.role === UserRole.CUSTOMER ? (
                                    <Navigate to="/book" replace />
                                ) : (
                                    <div className="text-center p-10">Unknown Role</div>
                                )
                            ) : (
                                <LandingPage />
                            )
                        } />

                        {/* Redirect /public to / */}
                        <Route path="/public" element={<Navigate to="/" replace />} />
                        <Route path="*" element={user ? <Navigate to="/" replace /> : <LandingPage />} />
                    </Routes>
                </React.Suspense>
            </Layout>
        </BrowserRouter>
    );
}

export default App;
