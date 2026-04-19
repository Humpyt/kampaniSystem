import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Mail, Lock } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = (hours % 12 || 12).toString().padStart(2, '0');
    return { hour: hour12, minute: minutes, second: seconds, ampm };
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-red-900">
      <div className="w-full max-w-7xl mx-4 flex flex-col lg:flex-row gap-0">
        {/* Left side - Logo Only (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center">
          <img
            src="/Kampani logo.png"
            alt="Kampani Logo"
            className="w-[500px] h-[500px] object-contain drop-shadow-[0_0_80px_rgba(220,38,38,0.4)]"
          />
        </div>

        {/* Right side - Login Form */}
        <div className="w-full lg:w-1/2 p-8 lg:p-12 flex items-center">
          <div className="w-full max-w-md">
            {/* Mobile logo (only on small screens) */}
            <div className="lg:hidden text-center mb-8">
              <img
                src="/Kampani logo.png"
                alt="Kampani Logo"
                className="w-40 h-40 object-contain mx-auto mb-4"
              />
            </div>

            {/* Date & Time Display */}
            <div className="mb-8 text-center">
              <div className="relative inline-block">
                <div className="text-6xl md:text-7xl font-bold text-white tracking-wider" style={{ textShadow: '0 0 40px rgba(220,38,38,0.5), 0 0 80px rgba(220,38,38,0.3)' }}>
                  {formatTime(currentTime).hour}
                  <span className="text-red-500 animate-pulse">:</span>
                  {formatTime(currentTime).minute}
                  <span className="text-red-500 animate-pulse">:</span>
                  {formatTime(currentTime).second}
                </div>
                <div className="absolute -right-8 top-4 text-lg font-medium text-red-400 uppercase tracking-widest">
                  {formatTime(currentTime).ampm}
                </div>
              </div>
              <div className="mt-3 text-lg text-red-200/80 tracking-widest uppercase font-light">
                {formatDate(currentTime)}
              </div>
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
                  <label htmlFor="email" className="block text-sm font-medium text-red-200 mb-2">
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
                      className="w-full pl-10 pr-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-30 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent focus:outline-none"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-red-200 mb-2">
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
                      className="w-full pl-10 pr-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-30 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent focus:outline-none"
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
                    className="w-4 h-4 rounded bg-white bg-opacity-10 border border-white border-opacity-30 text-red-600 focus:ring-red-500 focus:ring-2"
                  />
                  <label htmlFor="remember" className="ml-2 block text-sm text-red-200">
                    Remember me
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8 -8a8 8 0 0 0 -8 8a8 8 0 0 1 8 0z"></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
