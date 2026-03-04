import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { loginUser } from '../services/storageService';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2, ArrowRight, Mail } from 'lucide-react';

interface LoginProps {
    onLogin: (u: User) => void;
    onNotify: (msg: string, type: 'info' | 'success' | 'error') => void;
}

export const AdminLogin: React.FC<LoginProps> = ({ onLogin, onNotify }) => {
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
            if (user && user.role === UserRole.ADMIN) {
                onLogin(user);
                navigate('/');
                onNotify(`Welcome Admin, ${user.name}`, 'success');
            } else if (user) {
                onNotify('Access Denied: You do not have Admin privileges.', 'error');
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
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
            <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl border border-slate-800">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-slate-100 p-4 rounded-full mb-4">
                        <img src="/logo.png" alt="EcoExpress" className="w-12 h-12 object-contain grayscale" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Portal</h1>
                    <p className="text-sm text-slate-500 font-medium">EcoExpress Logistics</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">Admin Email</label>
                        <div className="relative">
                            <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
                            <input
                                type="email"
                                className="w-full pl-12 p-4 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none transition-all font-medium text-slate-700"
                                placeholder="admin@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">Password</label>
                        <div className="relative">
                            <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
                            <input
                                type="password"
                                className="w-full pl-12 p-4 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none transition-all font-medium text-slate-700"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 mt-2 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 active:scale-[0.98] transition-all flex justify-center items-center"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="flex items-center">Access Dashboard <ArrowRight className="ml-2 w-4 h-4" /></span>}
                    </button>
                </form>
                <div className="mt-6 text-center">
                    <a href="/public" className="text-slate-400 text-sm hover:underline">Back to Home</a>
                </div>
            </div>
        </div>
    );
};
