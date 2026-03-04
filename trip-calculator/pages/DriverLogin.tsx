import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { loginUser } from '../services/storageService';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Loader2, ArrowRight, Truck } from 'lucide-react';

interface LoginProps {
    onLogin: (u: User) => void;
    onNotify: (msg: string, type: 'info' | 'success' | 'error') => void;
}

export const DriverLogin: React.FC<LoginProps> = ({ onLogin, onNotify }) => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!identifier || !password) return onNotify('Please fill in all fields', 'error');

        setIsLoading(true);
        try {
            const user = await loginUser(identifier, password);
            if (user && user.role === UserRole.DRIVER) {
                onLogin(user);
                navigate('/');
                onNotify(`Welcome Captain ${user.name}`, 'success');
            } else if (user) {
                onNotify('Looking for Admin or Customer login? Check the main menu.', 'error');
            } else {
                onNotify('Invalid credentials', 'error');
            }
        } catch (error) {
            onNotify('Login error occurred', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-emerald-100">
            <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-xl border border-white/50 backdrop-blur-xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-primary/10 p-4 rounded-full mb-4">
                        <img src="/logo.png" alt="EcoExpress" className="w-16 h-16 object-contain" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Driver Partner</h1>
                    <p className="text-sm text-gray-500 font-medium">Login to manage your trips</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">Email or Phone</label>
                        <div className="relative">
                            <Truck className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
                            <input
                                type="text"
                                className="w-full pl-12 p-4 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-gray-700"
                                placeholder="driver@ecoexpress.com"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">Password</label>
                        <div className="relative">
                            <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
                            <input
                                type="password"
                                className="w-full pl-12 p-4 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-gray-700"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 mt-2 bg-primary text-white font-bold rounded-xl shadow-lg shadow-green-200 hover:bg-primaryDark active:scale-[0.98] transition-all flex justify-center items-center"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="flex items-center">Login <ArrowRight className="ml-2 w-4 h-4" /></span>}
                    </button>
                </form>

                <div className="mt-8 text-center bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 mb-2 font-bold uppercase">New Driver?</p>
                    <Link to="/signup" className="text-primary font-bold hover:underline">Register Here</Link>
                </div>
                <div className="mt-4 text-center">
                    <a href="/public" className="text-gray-400 text-sm hover:underline">Back to Home</a>
                </div>
            </div>
        </div>
    );
};
