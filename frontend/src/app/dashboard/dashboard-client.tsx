'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from "next/image";

interface UserProfile {
  user: {
    id: number;
    username: string;
    email?: string;
    profile_image?: string;
  };
  profile?: {
    bio?: string;
    age?: number;
    location?: string;
    interests?: string[];
  };
  music_data?: {
    personality_vector?: number[];
    last_updated?: string;
  };
}

const DashboardClient = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://thecodeworks.in/melodymatch';

  // Utility to clear auth data
  const clearAuth = useCallback(() => {
    localStorage.removeItem('melody_match_token');
    localStorage.removeItem('melody_match_user_id');
    localStorage.removeItem('melody_match_token_expiry');
    localStorage.removeItem('melody_match_login_time');
  }, []);

  // Handle auth tokens from query params (first redirect) or localStorage (subsequent visits)
  const handleAuthTokens = useCallback(() => {
    // First, check if we have tokens in the URL (from backend redirect)
    const tokenFromUrl = searchParams.get('token');
    const userIdFromUrl = searchParams.get('user_id');
    const expiresInFromUrl = searchParams.get('expires_in');

    if (tokenFromUrl && userIdFromUrl && expiresInFromUrl) {
      // We have tokens from the backend redirect
      const expiryTime = Date.now() + (parseInt(expiresInFromUrl) * 1000);
      
      // Save to localStorage
      localStorage.setItem('melody_match_token', tokenFromUrl);
      localStorage.setItem('melody_match_user_id', userIdFromUrl);
      localStorage.setItem('melody_match_token_expiry', expiryTime.toString());
      localStorage.setItem('melody_match_login_time', Date.now().toString());

      // Clean up the URL by removing query parameters
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      url.searchParams.delete('user_id');
      url.searchParams.delete('expires_in');
      window.history.replaceState({}, '', url.pathname);

      return { token: tokenFromUrl, userId: userIdFromUrl, expiry: expiryTime };
    } else {
      // Check localStorage for existing tokens (subsequent visits)
      const token = localStorage.getItem('melody_match_token');
      const userId = localStorage.getItem('melody_match_user_id');
      const expiry = localStorage.getItem('melody_match_token_expiry');

      if (!token || !userId) {
        return null; // No auth data found
      }

      if (expiry && Date.now() > parseInt(expiry)) {
        clearAuth(); // Token expired
        return null;
      }

      return { token, userId, expiry: parseInt(expiry || '0') };
    }
  }, [searchParams, clearAuth]);

  // Fetch profile from API
  const fetchUserProfile = useCallback(async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const profileData = await response.json();
        setUserProfile(profileData);
      } else if (response.status === 401) {
        clearAuth();
        router.push('/');
      } else {
        setError(`Server error (${response.status}). Please try again later.`);
      }
    } catch (err) {
      console.error('❌ Error fetching profile:', err);
      setError('Unable to connect. Please check your internet connection.');
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE_URL, clearAuth, router]);

  // On mount → handle auth tokens and fetch profile
  useEffect(() => {
    const authData = handleAuthTokens();
    
    if (!authData) {
      // No valid auth data found, redirect to home
      router.push('/');
      return;
    }

    // We have valid auth data, fetch the user profile
    fetchUserProfile(authData.token);
  }, [handleAuthTokens, fetchUserProfile, router]);

  // Handle logout
  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  // Handle refresh music data
  const handleRefreshMusic = async () => {
    const token = localStorage.getItem('melody_match_token');
    if (!token) {
      router.push('/');
      return;
    }
    
    setIsLoading(true);
    await fetchUserProfile(token);
  };

  // Floating background elements
  const FloatingElement = ({ icon, top, left, delay, size = 'text-2xl', opacity = 'opacity-10' }: {
    icon: string;
    top: string;
    left: string;
    delay: string;
    size?: string;
    opacity?: string;
  }) => (
    <div
      className={`absolute ${size} ${opacity} text-pink-300 pointer-events-none select-none`}
      style={{ top, left, animation: `gentleFloat 12s ease-in-out infinite ${delay}s` }}
    >
      {icon}
    </div>
  );

  // Loading UI
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-rose-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your musical world...</p>
        </div>
      </div>
    );
  }

  // Error UI
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-rose-50 to-pink-50">
        <div className="text-center">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-full transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <FloatingElement icon="♡" top="5%" left="10%" delay="0" size="text-4xl" opacity="opacity-15" />
        <FloatingElement icon="♪" top="15%" left="85%" delay="2" size="text-3xl" opacity="opacity-12" />
        <FloatingElement icon="♫" top="25%" left="5%" delay="4" size="text-2xl" opacity="opacity-10" />
        <FloatingElement icon="♡" top="40%" left="90%" delay="1" size="text-3xl" opacity="opacity-15" />
        <FloatingElement icon="♪" top="60%" left="15%" delay="3" size="text-2xl" opacity="opacity-12" />
        <FloatingElement icon="♡" top="75%" left="80%" delay="5" size="text-4xl" opacity="opacity-15" />
        <FloatingElement icon="♫" top="85%" left="25%" delay="1.5" size="text-3xl" opacity="opacity-10" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 bg-white/80 backdrop-blur-sm border-b border-pink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Melody Match
              </span>
              <span className="text-pink-500">♪</span>
            </div>
            <button onClick={handleLogout} className="text-gray-600 hover:text-pink-600 transition-colors">
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-pink-100">
            <div className="flex items-center space-x-4 mb-4">
              {userProfile?.user.profile_image ? (
                <Image
                  src={userProfile.user.profile_image}
                  alt="Profile"
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full border-2 border-pink-200 object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                  {userProfile?.user.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Welcome back, {userProfile?.user.username}! 🎵
                </h1>
                <p className="text-gray-600">Ready to find your musical match?</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-pink-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Your Profile</h3>
              <span className="text-2xl">👤</span>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600"><span className="font-medium">Bio:</span> {userProfile?.profile?.bio || 'Not set'}</p>
              <p className="text-sm text-gray-600"><span className="font-medium">Age:</span> {userProfile?.profile?.age || 'Not set'}</p>
              <p className="text-sm text-gray-600"><span className="font-medium">Location:</span> {userProfile?.profile?.location || 'Not set'}</p>
            </div>
            <button
              onClick={() => router.push('/profile/edit')}
              className="mt-4 w-full bg-pink-500 hover:bg-pink-600 text-white py-2 rounded-lg transition-colors text-sm"
            >
              Update Profile
            </button>
          </div>

          {/* Music Data Card */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-pink-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Music Profile</h3>
              <span className="text-2xl">🎶</span>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600"><span className="font-medium">Status:</span> {userProfile?.music_data?.personality_vector ? 'Analyzed' : 'Pending'}</p>
              <p className="text-sm text-gray-600"><span className="font-medium">Last Updated:</span> {userProfile?.music_data?.last_updated ? new Date(userProfile.music_data.last_updated).toLocaleDateString() : 'Never'}</p>
            </div>
            <button onClick={handleRefreshMusic} className="mt-4 w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg transition-colors text-sm">
              Refresh Music Data
            </button>
          </div>

          {/* Matches Card */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-pink-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Matches</h3>
              <span className="text-2xl">💕</span>
            </div>
            <div className="text-center py-4">
              <div className="text-3xl mb-2">🔍</div>
              <p className="text-gray-600 text-sm">Ready to discover matches!</p>
            </div>
            <button className="mt-4 w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-2 rounded-lg transition-all text-sm">
              Find Matches
            </button>
          </div>
        </div>

        {/* Coming Soon Banner */}
        <div className="mt-8 bg-gradient-to-r from-pink-500/20 to-purple-600/20 backdrop-blur-sm rounded-2xl p-6 border border-pink-200">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">🚧 Dashboard Under Construction 🚧</h2>
            <p className="text-gray-600 mb-4">We&apos;re building amazing features for you! Full functionality coming soon.</p>
            <p className="text-sm text-gray-500">Your profile is active and ready. Matching features are being developed.</p>
          </div>
        </div>
      </div>

      {/* Custom Animation Styles */}
      <style jsx>{`
        @keyframes gentleFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-8px) rotate(1deg); }
          50% { transform: translateY(-4px) rotate(-0.5deg); }
          75% { transform: translateY(-12px) rotate(0.5deg); }
        }
      `}</style>
    </div>
  );
};

export default DashboardClient;