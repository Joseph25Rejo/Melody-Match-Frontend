'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Centralized auth utilities
const clearAuthData = () => {
  try {
    localStorage.removeItem('melody_match_token');
    localStorage.removeItem('melody_match_user_id');
    localStorage.removeItem('melody_match_token_expiry');
    localStorage.removeItem('melody_match_login_time');
    console.log('🧹 Auth data cleared');
  } catch (error) {
    console.error('❌ Error clearing auth data:', error);
  }
};

const HomePage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check authentication status
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('melody_match_token');
        const tokenExpiry = localStorage.getItem('melody_match_token_expiry');
        
        if (token) {
          // Check if token is expired by timestamp
          if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
            console.log('🕐 Token expired by timestamp, cleaning up...');
            // Token expired, clear data
            clearAuthData();
            setIsLoading(false);
            return;
          }
          
          // Token exists and not expired by timestamp, validate with server
          console.log('🔍 Validating token with server...');
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://thecodeworks.in/melodymatch'}/user/profile`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
            
            if (response.ok) {
              // Token is valid, redirect to dashboard
              console.log('✅ Token valid, redirecting to dashboard...');
              router.push('/dashboard');
              return;
            } else if (response.status === 401) {
              // Token is invalid/expired on server, clean up
              console.log('🚫 Token invalid on server, cleaning up...');
              clearAuthData();
            } else {
              // Other error, but don't redirect - stay on home page
              console.log('⚠️ Server error during token validation, staying on home page');
            }
          } catch (fetchError) {
            // Network error or server unavailable
            console.log('🌐 Network error during token validation:', fetchError);
            // Don't clear token on network errors, just stay on home page
          }
        }
      } catch (error) {
        console.error('❌ Error checking auth status:', error);
        // On any error, clear potentially corrupted data
        clearAuthData();
      }
      
      setIsLoading(false);
    };

    checkAuthStatus();
  }, [router]);

  const handleGetStarted = () => {
    router.push('/login');
  };

  // Floating background elements
  const FloatingElement = ({ icon, top, left, delay, size = 'text-2xl', opacity = 'opacity-20' }: {
    icon: string;
    top: string;
    left: string;
    delay: string;
    size?: string;
    opacity?: string;
  }) => {
    return (
      <div
        className={`absolute ${size} ${opacity} text-pink-300 pointer-events-none select-none animate-pulse`}
        style={{
          top,
          left,
          animation: `gentleFloat 8s ease-in-out infinite ${delay}s`
        }}
      >
        {icon}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <FloatingElement icon="♡" top="10%" left="15%" delay="0" size="text-6xl" opacity="opacity-30" />
        <FloatingElement icon="♪" top="20%" left="80%" delay="1.5" size="text-4xl" opacity="opacity-25" />
        <FloatingElement icon="♫" top="40%" left="10%" delay="3" size="text-3xl" opacity="opacity-20" />
        <FloatingElement icon="♡" top="60%" left="85%" delay="2" size="text-5xl" opacity="opacity-35" />
        <FloatingElement icon="♪" top="80%" left="20%" delay="4" size="text-2xl" opacity="opacity-25" />
        <FloatingElement icon="♡" top="30%" left="60%" delay="1" size="text-3xl" opacity="opacity-30" />
        <FloatingElement icon="♫" top="70%" left="70%" delay="3.5" size="text-4xl" opacity="opacity-25" />
        <FloatingElement icon="♡" top="90%" left="50%" delay="2.5" size="text-2xl" opacity="opacity-20" />
        <FloatingElement icon="♪" top="15%" left="40%" delay="4.5" size="text-xl" opacity="opacity-15" />
        <FloatingElement icon="♡" top="45%" left="90%" delay="1.8" size="text-xl" opacity="opacity-25" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo/Brand */}
          <div className="mb-8">
            <h1 className="text-6xl sm:text-7xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Melody Match
            </h1>
            <div className="flex items-center justify-center space-x-2 text-pink-500">
              <span className="text-2xl">♪</span>
              <span className="text-lg font-medium tracking-wide">Find Your Perfect Musical Match</span>
              <span className="text-2xl">♫</span>
            </div>
          </div>

          {/* Hero Text */}
          <div className="mb-12 space-y-6">
            <p className="text-xl sm:text-2xl text-gray-700 font-light leading-relaxed">
              Connect with people who share your music taste.
            </p>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover matches based on your Spotify preferences and communicate through the universal language of music.
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-12 max-w-3xl mx-auto">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-pink-100">
              <div className="text-3xl mb-4 text-pink-500">🎵</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Music Matching</h3>
              <p className="text-gray-600 text-sm">Find people with similar music taste based on your Spotify data</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-pink-100">
              <div className="text-3xl mb-4 text-purple-500">💌</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Song Messages</h3>
              <p className="text-gray-600 text-sm">Express yourself through songs with emotional context</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-pink-100">
              <div className="text-3xl mb-4 text-pink-500">🎶</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Shared Playlists</h3>
              <p className="text-gray-600 text-sm">Create collaborative playlists with your matches</p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="space-y-4">
            <button
              onClick={handleGetStarted}
              className="group relative bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-4 px-12 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <span className="relative z-10 flex items-center space-x-2">
                <span>Get Started with Spotify</span>
                <span className="text-xl group-hover:animate-pulse">♪</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            <p className="text-sm text-gray-500">
              Connect your Spotify account to find your musical soulmate
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-gray-400 text-sm">
            Made with <span className="text-pink-500">♡</span> for music lovers
          </p>
        </div>
      </div>

      {/* Custom Animation Styles */}
      <style jsx>{`
        @keyframes gentleFloat {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-10px) rotate(2deg);
          }
          50% {
            transform: translateY(-5px) rotate(-1deg);
          }
          75% {
            transform: translateY(-15px) rotate(1deg);
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;
