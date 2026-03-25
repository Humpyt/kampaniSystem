import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Mail, Lock, CheckCircle, Wrench } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      <div className="w-full max-w-7xl mx-4 flex flex-col lg:flex-row gap-0">
        {/* Left side - Branding (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 bg-white bg-opacity-10 backdrop-blur-lg p-12 flex-col justify-center">
          <div className="text-center">
            <Wrench className="w-32 h-32 text-white mx-auto mb-6" />
            <h1 className="text-5xl font-bold text-white mb-3">
              Wrench Repair POS
            </h1>
            <p className="text-xl text-purple-200 mb-12">
              Professional Wrench Repair Management
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4 text-white">
              <div className="w-10 h-10 bg-green-500 bg-opacity-20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-lg">Track Operations & Repairs</span>
            </div>

            <div className="flex items-center gap-4 text-white">
              <div className="w-10 h-10 bg-green-500 bg-opacity-20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-lg">Manage Sales & Inventory</span>
            </div>

            <div className="flex items-center gap-4 text-white">
              <div className="w-10 h-10 bg-green-500 bg-opacity-20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-lg">Customer Relationship Management</span>
            </div>

            <div className="flex items-center gap-4 text-white">
              <div className="w-10 h-10 bg-green-500 bg-opacity-20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-lg">Staff Performance Tracking</span>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="w-full lg:w-1/2 p-8 lg:p-12 flex items-center">
          <div className="w-full max-w-md">
            {/* Mobile logo (only on small screens) */}
            <div className="lg:hidden text-center mb-8">
              <Wrench className="w-20 h-20 text-white mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-white mb-2">
                Wrench Repair POS
              </h1>
              <p className="text-purple-200">
                Professional Wrench Repair Management
              </p>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 border border-white border-opacity-20 shadow-2xl">
              <h2 className="text-2xl font-semibold text-white mb-6">
                Welcome Back
              </h2>

              <form className="space-y-5" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-red-500 bg-opacity-80 text-white p-3 rounded-lg text-sm backdrop-blur-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-purple-200 mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-30 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-purple-200 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-30 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none"
                      placeholder="•••••••••"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-white bg-opacity-10 border border-white border-opacity-30 text-purple-600 focus:ring-purple-500 focus:ring-2"
                  />
                  <label htmlFor="remember" className="ml-2 block text-sm text-purple-200">
                    Remember me
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8 8 0 000-8 8 0 018 0 0z"></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              {!rememberMe && (
                <div className="mt-6 pt-6 border-t border-white border-opacity-20">
                  <p className="text-xs text-purple-200 mb-3">Test Accounts:</p>
                  <div className="space-y-1 text-xs text-gray-300">
                    <p className="bg-white bg-opacity-10 rounded px-2 py-1">
                      Admin: admin@repairpro.com / admin123
                    </p>
                    <p className="bg-white bg-opacity-10 rounded px-2 py-1">
                      Manager: manager@repairpro.com / manager123
                    </p>
                    <p className="bg-white bg-opacity-10 rounded px-2 py-1">
                      Staff: staff1@repairpro.com / staff123
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
