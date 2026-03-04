import React, { useState } from 'react';
import { UserRole } from '../types';
import { registerUser } from '../services/storageService';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, ArrowRight, UserPlus, Mail, Phone, Lock, User as UserIcon } from 'lucide-react';

export const SignUp: React.FC<{ onNotify: (msg: string, type: 'info' | 'success' | 'error') => void }> = ({ onNotify }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: UserRole.CUSTOMER
    });
    // For safety, maybe default to Customer? Or let them pick? 
    // Let's create a Customer Signup by default, or Driver if explicitly asked. 
    // For now, let's keep it generic but maybe default to Customer to avoid random Admins.
    // Actually, let's default to Customer.

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.password || !formData.phone) {
            return onNotify("Please fill all fields", "error");
        }

        setLoading(true);
        try {
            const user = await registerUser(formData.email, formData.password, formData.name, formData.phone, formData.role);
            // If we want "All types of customers", we should probably default to CUSTOMER if not specified.
            // But the request said "login credentials API for safety authentication for all type of customers".
            // Let's assume this page is for generic signup.

            if (user) {
                onNotify("Account created! Please login.", "success");
                navigate('/login');
            } else {
                onNotify("Registration failed. Email might be in use.", "error");
            }
        } catch (e) {
            onNotify("Error creating account", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-emerald-100">
            <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-xl border border-white/50 backdrop-blur-xl animate-fade-in">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Create Account</h1>
                    <p className="text-sm text-gray-500 font-medium">Join EcoExpress Logistics</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">Full Name</label>
                        <div className="relative">
                            <UserIcon className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
                            <input
                                type="text"
                                className="w-full pl-12 p-3.5 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">Email</label>
                        <div className="relative">
                            <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
                            <input
                                type="email"
                                className="w-full pl-12 p-3.5 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                placeholder="john@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">Phone</label>
                        <div className="relative">
                            <Phone className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
                            <input
                                type="tel"
                                className="w-full pl-12 p-3.5 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                placeholder="9876543210"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">Password</label>
                        <div className="relative">
                            <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
                            <input
                                type="password"
                                className="w-full pl-12 p-3.5 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Role Selector for Demo Purpose */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">Account Type</label>
                        <div className="relative">
                            <UserPlus className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
                            <select
                                className="w-full pl-12 p-3.5 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                            >
                                <option value={UserRole.CUSTOMER}>Customer</option>
                                <option value={UserRole.DRIVER}>Driver</option>
                                <option value={UserRole.ADMIN}>Admin</option>
                            </select>
                            <div className="absolute right-4 top-4 pointer-events-none">
                                <ArrowRight className="w-5 h-5 text-gray-400 rotate-90" />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 mt-2 bg-primary text-white font-bold rounded-xl shadow-lg shadow-green-200 hover:bg-primaryDark active:scale-[0.98] transition-all flex justify-center items-center"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="flex items-center">Sign Up <ArrowRight className="ml-2 w-4 h-4" /></span>}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-500 text-sm">
                        Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};
