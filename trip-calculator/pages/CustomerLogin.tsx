import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { loginUser } from '../services/storageService';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Loader2, ArrowRight, User as UserIcon } from 'lucide-react';

interface LoginProps {
    onLogin: (u: User) => void;
    onNotify: (msg: string, type: 'info' | 'success' | 'error') => void;
}

export const CustomerLogin: React.FC<LoginProps> = ({ onLogin, onNotify }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return onNotify('Please fill in all fields', 'error');

        setIsLoading(true);
        try {
            const user = await loginUser(email, password);
            if (user && user.role === UserRole.CUSTOMER) {
                onLogin(user);
                navigate('/book'); // Redirect customers to booking directly
                onNotify(`Welcome back, ${user.name}`, 'success');
            } else if (user && user.role) {
                // Allow other roles too? Or strict? strict for now to avoid confusion
                onNotify(`Please use the ${user.role.toLowerCase()} login portal.`, 'error');
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
        <div className="min-h-screen flex items-center justify-center p-4 bg-orange-50">
            <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-xl border border-orange-100">
                <div className="flex flex-col items-center mb-8">
                    <div className="p-4 rounded-full mb-4">
                        <img src="/logo.png" alt="EcoExpress" className="w-16 h-16 object-contain" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Customer Login</h1>
                    <p className="text-sm text-gray-500 font-medium">Track your shipments & Book trips</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">Email</label>
                        <div className="relative">
                            <UserIcon className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
                            <input
                                type="email"
                                className="w-full pl-12 p-4 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all font-medium text-gray-700"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">Password</label>
                        <div className="relative">
                            <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
                            <input
                                type="password"
                                className="w-full pl-12 p-4 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all font-medium text-gray-700"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 mt-2 bg-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-200 hover:bg-orange-600 active:scale-[0.98] transition-all flex justify-center items-center"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="flex items-center">Login <ArrowRight className="ml-2 w-4 h-4" /></span>}
                    </button>
                </form>

                <div className="mt-8 text-center bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 mb-2 font-bold uppercase">Need an account?</p>
                    <Link to="/signup" className="text-orange-600 font-bold hover:underline">Sign Up</Link>
                </div>
                <div className="mt-4 text-center">
                    <a href="/public" className="text-gray-400 text-sm hover:underline">Back to Home</a>
                </div>
            </div>
        </div>
    );
};
