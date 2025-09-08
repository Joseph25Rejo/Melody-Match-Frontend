'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UserData {
  token: string;
  user_id: string;
  expires_in?: number;
}

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  const API_BASE_URL = 'https://thecodeworks.in/melodymatch';

  // Enhanced localStorage management
  const saveUserData = (userData: UserData) => {
    try {
      localStorage.setItem('melody_match_token', userData.token);
      localStorage.setItem('melody_match_user_id', userData.user_id);
      if (userData.expires_in) {
        const expiryTime = Date.now() + (userData.expires_in * 1000);
        localStorage.setItem('melody_match_token_expiry', expiryTime.toString());
      }
      localStorage.setItem('melody_match_login_time', Date.now().toString());
    } catch (error) {
      console.error('Failed to save user data to localStorage:', error);
    }
  };

  const clearUserData = () => {
    try {
      localStorage.removeItem('melody_match_token');
      localStorage.removeItem('melody_match_user_id');
      localStorage.removeItem('melody_match_token_expiry');
      localStorage.removeItem('melody_match_login_time');
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Failed to clear user data from localStorage:', error);
    }
  };

  const handleLogout = () => {
    console.log('🚪 Logging out user...');
    clearUserData();
    setAlertType('success');
    setAlertMessage('✅ Successfully logged out!');
    setShowAlert(true);
  };

  const handleSpotifyLogin = async () => {
  // Call your backend /auth/login to get the correct Spotify URL
  const res = await fetch(`${API_BASE_URL}/auth/login?redirect_uri=${window.location.origin}`);
  const authUrl = await res.text(); // backend should return a redirect or URL
  
  // Instead of fetch → redirect browser
  window.location.href = authUrl;
};

  // Enhanced callback handling for Spotify OAuth
  useEffect(() => {
    const handleSpotifyCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      const state = urlParams.get('state');
      
      console.log('🔍 Checking for Spotify callback:', {
        hasCode: !!code,
        hasError: !!error,
        error: error,
        state: state,
        fullUrl: window.location.href
      });
      
      if (error) {
        console.log('❌ Spotify OAuth Error:', error);
        clearUserData();
        setAlertType('error');
        
        let errorMessage = 'Authentication failed. Please try again.';
        if (error === 'access_denied') {
          errorMessage = '🚫 Access denied. You need to authorize the app to continue.';
        }
        
        setAlertMessage(errorMessage);
        setShowAlert(true);
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }
      
      if (code) {
        console.log('🎉 Got Spotify auth code, exchanging for tokens...');
        setIsLoading(true);
        
        try {
          // Call backend callback endpoint with the code
          const callbackUrl = `${API_BASE_URL}/auth/callback?code=${encodeURIComponent(code)}`;
          console.log('Calling callback endpoint:', callbackUrl);
          
          const response = await fetch(callbackUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          console.log('Callback response:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ Callback success data:', data);
            
            if (data.token && data.user_id) {
              const userData: UserData = {
                token: data.token,
                user_id: data.user_id.toString(),
                ...(data.expires_in && { expires_in: data.expires_in })
              };
              
              saveUserData(userData);
              setIsLoggedIn(true);
              setAlertType('success');
              setAlertMessage('🎵 Welcome to Melody Match! Login successful!');
              setShowAlert(true);
              
              // Clean URL
              window.history.replaceState({}, document.title, window.location.pathname);
              
              // Show success message
              setTimeout(() => {
                setAlertMessage('✨ You are now logged in! Dashboard coming soon...');
              }, 2000);
            } else {
              throw new Error('Invalid response: missing token or user_id');
            }
          } else {
            const errorData = await response.text();
            console.error('❌ Callback API Error:', errorData);
            throw new Error(`Callback failed: ${response.status} - ${errorData}`);
          }
        } catch (error) {
          console.error('❌ Callback processing error:', error);
          setAlertType('error');
          setAlertMessage('❌ Authentication failed. Please try logging in again.');
          setShowAlert(true);
          
          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    // Run callback handler
    handleSpotifyCallback();
  }, [API_BASE_URL]);

  // Check if user is already logged in
  useEffect(() => {
    const checkExistingAuth = () => {
      try {
        const token = localStorage.getItem('melody_match_token');
        const tokenExpiry = localStorage.getItem('melody_match_token_expiry');
        const userId = localStorage.getItem('melody_match_user_id');
        const loginTime = localStorage.getItem('melody_match_login_time');
        
        console.log('🔍 Checking existing login:', {
          hasToken: !!token,
          hasUserId: !!userId,
          tokenExpiry: tokenExpiry ? new Date(parseInt(tokenExpiry)).toLocaleString() : 'none',
          loginTime: loginTime ? new Date(parseInt(loginTime)).toLocaleString() : 'none',
          currentTime: new Date().toLocaleString()
        });
        
        if (token && userId) {
          if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
            console.log('⏰ Token expired, clearing data');
            clearUserData();
          } else {
            console.log('✅ User already logged in, redirecting to dashboard');
            setIsLoggedIn(true);
            router.push('/dashboard');
            return;
          }
        }
      } catch (error) {
        console.error('❌ Error checking existing auth:', error);
        // Clear potentially corrupted data
        clearUserData();
      }
    };
    
    checkExistingAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Custom CSS for floating animations */}
      <style jsx>{`
        @keyframes floatAcrossRight {
          0% { transform: translateX(-100vw) translateY(0) rotate(var(--rotation)); }
          100% { transform: translateX(100vw) translateY(-20px) rotate(calc(var(--rotation) + 360deg)); }
        }
        @keyframes floatAcrossLeft {
          0% { transform: translateX(100vw) translateY(0) rotate(var(--rotation)); }
          100% { transform: translateX(-100vw) translateY(-20px) rotate(calc(var(--rotation) - 360deg)); }
        }
        @keyframes floatAcrossUp {
          0% { transform: translateX(0) translateY(100vh) rotate(var(--rotation)); }
          100% { transform: translateX(30px) translateY(-100vh) rotate(calc(var(--rotation) + 180deg)); }
        }
        @keyframes floatAcrossDown {
          0% { transform: translateX(0) translateY(-100vh) rotate(var(--rotation)); }
          100% { transform: translateX(-30px) translateY(100vh) rotate(calc(var(--rotation) - 180deg)); }
        }
        @keyframes floatDiagonal1 {
          0% { transform: translateX(-50vw) translateY(100vh) rotate(var(--rotation)); }
          100% { transform: translateX(50vw) translateY(-100vh) rotate(calc(var(--rotation) + 270deg)); }
        }
        @keyframes floatDiagonal2 {
          0% { transform: translateX(50vw) translateY(100vh) rotate(var(--rotation)); }
          100% { transform: translateX(-50vw) translateY(-100vh) rotate(calc(var(--rotation) - 270deg)); }
        }
        @keyframes floatSlowRight {
          0% { transform: translateX(-100vw) translateY(0) rotate(var(--rotation)); }
          100% { transform: translateX(100vw) translateY(-30px) rotate(calc(var(--rotation) + 180deg)); }
        }
        @keyframes floatSlowLeft {
          0% { transform: translateX(100vw) translateY(0) rotate(var(--rotation)); }
          100% { transform: translateX(-100vw) translateY(-30px) rotate(calc(var(--rotation) - 180deg)); }
        }
        .float-right { animation: floatAcrossRight 25s linear infinite; }
        .float-left { animation: floatAcrossLeft 30s linear infinite; }
        .float-up { animation: floatAcrossUp 20s linear infinite; }
        .float-down { animation: floatAcrossDown 28s linear infinite; }
        .float-diagonal1 { animation: floatDiagonal1 35s linear infinite; }
        .float-diagonal2 { animation: floatDiagonal2 32s linear infinite; }
        .float-slow-right { animation: floatSlowRight 40s linear infinite; }
        .float-slow-left { animation: floatSlowLeft 38s linear infinite; }
      `}</style>
      
      {/* Subtle pink background */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-pink-25 to-rose-50 opacity-70"></div>
      <div className="absolute inset-0 bg-pink-50/30"></div>
      
      {/* Background hearts and music notes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Large floating hearts - moving across the screen */}
        <div className="absolute top-16 left-16 text-6xl text-pink-400/40 float-right" style={{'--rotation': '-12deg'} as React.CSSProperties}>
          ♡
        </div>
        <div className="absolute top-32 right-20 text-5xl text-purple-400/40 float-left" style={{'--rotation': '12deg', animationDelay: '3s'} as React.CSSProperties}>
          ♡
        </div>
        <div className="absolute bottom-32 left-32 text-5xl text-pink-400/40 float-up" style={{'--rotation': '6deg', animationDelay: '7s'} as React.CSSProperties}>
          ♡
        </div>
        <div className="absolute bottom-20 right-16 text-4xl text-purple-400/40 float-diagonal1" style={{'--rotation': '-6deg', animationDelay: '12s'} as React.CSSProperties}>
          ♡
        </div>
        <div className="absolute top-8 left-1/2 text-5xl text-pink-400/35 float-down" style={{'--rotation': '18deg', animationDelay: '15s'} as React.CSSProperties}>
          ♡
        </div>
        <div className="absolute bottom-8 right-1/2 text-4xl text-purple-400/35 float-diagonal2" style={{'--rotation': '-18deg', animationDelay: '18s'} as React.CSSProperties}>
          ♡
        </div>
        
        {/* Medium floating hearts */}
        <div className="absolute top-1/4 left-1/4 text-3xl text-pink-300/35 float-down" style={{'--rotation': '20deg', animationDelay: '5s'} as React.CSSProperties}>
          ♡
        </div>
        <div className="absolute top-3/4 right-1/4 text-3xl text-purple-300/35 float-diagonal2" style={{'--rotation': '-20deg', animationDelay: '8s'} as React.CSSProperties}>
          ♡
        </div>
        <div className="absolute top-1/2 left-12 text-2xl text-pink-300/30 float-right" style={{'--rotation': '45deg', animationDelay: '2s'} as React.CSSProperties}>
          ♡
        </div>
        <div className="absolute top-1/3 right-12 text-2xl text-purple-300/30 float-left" style={{'--rotation': '-45deg', animationDelay: '15s'} as React.CSSProperties}>
          ♡
        </div>
        <div className="absolute top-2/3 left-1/3 text-2xl text-pink-300/30 float-slow-right" style={{'--rotation': '75deg', animationDelay: '20s'} as React.CSSProperties}>
          ♡
        </div>
        <div className="absolute top-1/6 right-1/3 text-2xl text-purple-300/30 float-slow-left" style={{'--rotation': '-75deg', animationDelay: '22s'} as React.CSSProperties}>
          ♡
        </div>
        
        {/* Small floating hearts */}
        <div className="absolute top-24 left-1/2 text-xl text-pink-300/25 float-up" style={{'--rotation': '30deg', animationDelay: '4s'} as React.CSSProperties}>
          ♡
        </div>
        <div className="absolute bottom-24 right-1/2 text-xl text-purple-300/25 float-diagonal1" style={{'--rotation': '-30deg', animationDelay: '9s'} as React.CSSProperties}>
          ♡
        </div>
        <div className="absolute top-40 left-3/4 text-lg text-pink-300/20 float-down" style={{'--rotation': '60deg', animationDelay: '6s'} as React.CSSProperties}>
          ♡
        </div>
        <div className="absolute bottom-40 right-3/4 text-lg text-purple-300/20 float-diagonal2" style={{'--rotation': '-60deg', animationDelay: '11s'} as React.CSSProperties}>
          ♡
        </div>
        <div className="absolute top-52 left-1/5 text-lg text-pink-300/20 float-right" style={{'--rotation': '105deg', animationDelay: '17s'} as React.CSSProperties}>
          ♡
        </div>
        <div className="absolute bottom-52 right-1/5 text-lg text-purple-300/20 float-left" style={{'--rotation': '-105deg', animationDelay: '19s'} as React.CSSProperties}>
          ♡
        </div>
        
        {/* Additional floating tiny hearts */}
        <div className="absolute top-36 left-1/6 text-sm text-pink-300/20 float-right" style={{'--rotation': '90deg', animationDelay: '10s'} as React.CSSProperties}>
          ♡
        </div>
        <div className="absolute top-72 right-1/6 text-sm text-purple-300/20 float-left" style={{'--rotation': '-90deg', animationDelay: '13s'} as React.CSSProperties}>
          ♡
        </div>
        <div className="absolute bottom-36 left-2/3 text-sm text-pink-300/20 float-up" style={{'--rotation': '120deg', animationDelay: '1s'} as React.CSSProperties}>
          ♡
        </div>
        <div className="absolute bottom-72 right-2/3 text-sm text-purple-300/20 float-diagonal1" style={{'--rotation': '-120deg', animationDelay: '14s'} as React.CSSProperties}>
          ♡
        </div>
        <div className="absolute top-60 left-4/5 text-sm text-pink-300/15 float-diagonal2" style={{'--rotation': '150deg', animationDelay: '25s'} as React.CSSProperties}>
          ♡
        </div>
        <div className="absolute bottom-60 right-4/5 text-sm text-purple-300/15 float-slow-right" style={{'--rotation': '-150deg', animationDelay: '27s'} as React.CSSProperties}>
          ♡
        </div>
        <div className="absolute top-96 left-1/12 text-xs text-pink-300/15 float-up" style={{'--rotation': '180deg', animationDelay: '30s'} as React.CSSProperties}>
          ♡
        </div>
        <div className="absolute bottom-96 right-1/12 text-xs text-purple-300/15 float-down" style={{'--rotation': '-180deg', animationDelay: '32s'} as React.CSSProperties}>
          ♡
        </div>
        
        {/* Extra tiny hearts for richness */}
        <div className="absolute top-4 left-1/3 text-xs text-pink-300/15 float-diagonal1" style={{'--rotation': '200deg', animationDelay: '37s'} as React.CSSProperties}>
          ♡
        </div>
        <div className="absolute bottom-4 right-1/3 text-xs text-purple-300/15 float-diagonal2" style={{'--rotation': '-200deg', animationDelay: '39s'} as React.CSSProperties}>
          ♡
        </div>
        <div className="absolute top-20 left-11/12 text-xs text-pink-300/10 float-slow-left" style={{'--rotation': '225deg', animationDelay: '41s'} as React.CSSProperties}>
          ♡
        </div>
        <div className="absolute bottom-20 right-11/12 text-xs text-purple-300/10 float-slow-right" style={{'--rotation': '-225deg', animationDelay: '43s'} as React.CSSProperties}>
          ♡
        </div>
        <div className="absolute top-84 left-1/12 text-xs text-pink-300/10 float-up" style={{'--rotation': '255deg', animationDelay: '45s'} as React.CSSProperties}>
          ♡
        </div>
        <div className="absolute bottom-84 right-1/12 text-xs text-purple-300/10 float-down" style={{'--rotation': '-255deg', animationDelay: '47s'} as React.CSSProperties}>
          ♡
        </div>
        
        {/* Music notes - now floating like hearts instead of bouncing */}
        <div className="absolute top-20 left-1/3 text-4xl text-purple-400/45 float-right" style={{'--rotation': '12deg', animationDelay: '0.5s'} as React.CSSProperties}>
          ♪
        </div>
        <div className="absolute top-40 right-1/3 text-3xl text-pink-400/45 float-left" style={{'--rotation': '-12deg', animationDelay: '1.5s'} as React.CSSProperties}>
          ♫
        </div>
        <div className="absolute bottom-40 left-1/4 text-4xl text-purple-400/45 float-up" style={{'--rotation': '6deg', animationDelay: '2.5s'} as React.CSSProperties}>
          ♪
        </div>
        <div className="absolute bottom-56 right-1/4 text-3xl text-pink-400/45 float-diagonal1" style={{'--rotation': '-6deg', animationDelay: '3.5s'} as React.CSSProperties}>
          ♫
        </div>
        <div className="absolute top-1/5 left-4/5 text-3xl text-purple-400/40 float-diagonal2" style={{'--rotation': '25deg', animationDelay: '6s'} as React.CSSProperties}>
          ♪
        </div>
        <div className="absolute bottom-1/5 right-4/5 text-3xl text-pink-400/40 float-slow-right" style={{'--rotation': '-25deg', animationDelay: '8s'} as React.CSSProperties}>
          ♫
        </div>
        
        {/* Music notes - Medium */}
        <div className="absolute top-1/2 left-20 text-2xl text-purple-300/40 float-down" style={{'--rotation': '45deg', animationDelay: '4s'} as React.CSSProperties}>
          ♪
        </div>
        <div className="absolute top-1/3 right-24 text-2xl text-pink-300/40 float-up" style={{'--rotation': '-45deg', animationDelay: '0.8s'} as React.CSSProperties}>
          ♫
        </div>
        <div className="absolute top-64 right-32 text-2xl text-purple-300/40 float-left" style={{'--rotation': '15deg', animationDelay: '3.2s'} as React.CSSProperties}>
          ♪
        </div>
        <div className="absolute bottom-64 left-40 text-2xl text-pink-300/40 float-right" style={{'--rotation': '-15deg', animationDelay: '4.2s'} as React.CSSProperties}>
          ♫
        </div>
        <div className="absolute top-80 left-1/2 text-2xl text-purple-300/35 float-diagonal1" style={{'--rotation': '35deg', animationDelay: '7.5s'} as React.CSSProperties}>
          ♪
        </div>
        <div className="absolute bottom-80 right-1/2 text-2xl text-pink-300/35 float-diagonal2" style={{'--rotation': '-35deg', animationDelay: '9.5s'} as React.CSSProperties}>
          ♫
        </div>
        <div className="absolute top-48 left-1/8 text-2xl text-purple-300/35 float-slow-left" style={{'--rotation': '65deg', animationDelay: '11.5s'} as React.CSSProperties}>
          ♪
        </div>
        <div className="absolute bottom-48 right-1/8 text-2xl text-pink-300/35 float-slow-right" style={{'--rotation': '-65deg', animationDelay: '13.5s'} as React.CSSProperties}>
          ♫
        </div>
        
        {/* Music notes - Small scattered */}
        <div className="absolute top-12 left-2/3 text-lg text-purple-300/35 float-up" style={{'--rotation': '25deg', animationDelay: '1.8s'} as React.CSSProperties}>
          ♪
        </div>
        <div className="absolute top-80 right-1/3 text-lg text-pink-300/35 float-down" style={{'--rotation': '-25deg', animationDelay: '2.3s'} as React.CSSProperties}>
          ♫
        </div>
        <div className="absolute bottom-12 left-1/5 text-lg text-purple-300/35 float-right" style={{'--rotation': '35deg', animationDelay: '0.9s'} as React.CSSProperties}>
          ♪
        </div>
        <div className="absolute bottom-80 right-1/5 text-lg text-pink-300/35 float-left" style={{'--rotation': '-35deg', animationDelay: '3.9s'} as React.CSSProperties}>
          ♫
        </div>
        <div className="absolute top-1/4 right-1/2 text-lg text-purple-300/30 float-diagonal1" style={{'--rotation': '55deg', animationDelay: '2.7s'} as React.CSSProperties}>
          ♪
        </div>
        <div className="absolute bottom-1/4 left-1/2 text-lg text-pink-300/30 float-diagonal2" style={{'--rotation': '-55deg', animationDelay: '4.7s'} as React.CSSProperties}>
          ♫
        </div>
        <div className="absolute top-44 left-3/5 text-lg text-purple-300/30 float-slow-left" style={{'--rotation': '85deg', animationDelay: '16s'} as React.CSSProperties}>
          ♪
        </div>
        <div className="absolute bottom-44 right-3/5 text-lg text-pink-300/30 float-slow-right" style={{'--rotation': '-85deg', animationDelay: '21s'} as React.CSSProperties}>
          ♫
        </div>
        <div className="absolute top-88 left-5/6 text-lg text-purple-300/25 float-up" style={{'--rotation': '95deg', animationDelay: '24s'} as React.CSSProperties}>
          ♪
        </div>
        <div className="absolute bottom-88 right-5/6 text-lg text-pink-300/25 float-down" style={{'--rotation': '-95deg', animationDelay: '26s'} as React.CSSProperties}>
          ♫
        </div>
        
        {/* Treble clef symbols - also floating */}
        <div className="absolute top-28 right-1/5 text-2xl text-purple-300/25 float-left" style={{'--rotation': '20deg', animationDelay: '1.3s'} as React.CSSProperties}>
          𝄞
        </div>
        <div className="absolute bottom-28 left-1/5 text-2xl text-pink-300/25 float-right" style={{'--rotation': '-20deg', animationDelay: '3.3s'} as React.CSSProperties}>
          𝄞
        </div>
        <div className="absolute top-56 left-3/4 text-xl text-purple-300/20 float-diagonal1" style={{'--rotation': '40deg', animationDelay: '14s'} as React.CSSProperties}>
          𝄞
        </div>
        <div className="absolute bottom-56 right-3/4 text-xl text-pink-300/20 float-diagonal2" style={{'--rotation': '-40deg', animationDelay: '16s'} as React.CSSProperties}>
          𝄞
        </div>
        <div className="absolute top-68 left-1/8 text-sm text-purple-300/20 float-slow-right" style={{'--rotation': '135deg', animationDelay: '28s'} as React.CSSProperties}>
          ♪
        </div>
        <div className="absolute bottom-68 right-1/8 text-sm text-pink-300/20 float-slow-left" style={{'--rotation': '-135deg', animationDelay: '31s'} as React.CSSProperties}>
          ♫
        </div>
        <div className="absolute top-76 left-7/8 text-sm text-purple-300/15 float-up" style={{'--rotation': '165deg', animationDelay: '33s'} as React.CSSProperties}>
          ♪
        </div>
        <div className="absolute bottom-76 right-7/8 text-sm text-pink-300/15 float-down" style={{'--rotation': '-165deg', animationDelay: '35s'} as React.CSSProperties}>
          ♫
        </div>
      </div>
      
      {/* Main container - horizontal layout */}
      <div className="bg-white shadow-2xl rounded-2xl border border-gray-100 max-w-5xl w-full grid md:grid-cols-2 gap-0 relative z-10 overflow-hidden">
        
        {/* Left side - Branding */}
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-12 flex flex-col justify-center text-white relative">
          <div className="absolute top-8 right-8 text-white/20 text-2xl">♪</div>
          <div className="absolute bottom-12 left-8 text-white/20 text-xl">♫</div>
          
          <div className="space-y-6">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-white text-2xl">♪</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold">Melody Match</h1>
                <p className="text-purple-100 text-sm">Connect through music</p>
              </div>
            </div>
            
            {/* Headline */}
            <div className="space-y-4">
              <h2 className="text-4xl font-bold leading-tight">
                Find Your Perfect
                <span className="block text-pink-200">Musical Match</span>
              </h2>
              <p className="text-purple-100 text-lg">
                Discover meaningful connections through shared musical experiences.
              </p>
            </div>
            
            {/* Features */}
            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-pink-300 rounded-full"></div>
                <span className="text-sm text-purple-100">Smart music-based matching</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-pink-300 rounded-full"></div>
                <span className="text-sm text-purple-100">Express yourself through songs</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-pink-300 rounded-full"></div>
                <span className="text-sm text-purple-100">Create shared playlists</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right side - Login/Dashboard */}
        <div className="p-12 flex flex-col justify-center">
          <div className="space-y-8">
            {!isLoggedIn ? (
              // Login Form
              <>
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold text-gray-800">Welcome Back</h3>
                  <p className="text-gray-600">Sign in to continue your musical journey</p>
                </div>
                
                <button
                  onClick={handleSpotifyLogin}
                  disabled={isLoading}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-3 shadow-md"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                      </svg>
                      <span>Continue with Spotify</span>
                    </>
                  )}
                </button>
                
                <div className="text-center space-y-4">
                  <p className="text-xs text-gray-500">
                    Secure login powered by Spotify. We never store your password.
                  </p>
                  <div className="flex justify-center gap-6 text-xs text-gray-400">
                    <a href="#" className="hover:text-purple-600">Privacy</a>
                    <a href="#" className="hover:text-purple-600">Terms</a>
                  </div>
                </div>
              </>
            ) : (
              // Logged In Dashboard
              <>
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold text-gray-800">Welcome! 🎵</h3>
                  <p className="text-gray-600">You&apos;re successfully logged in to Melody Match</p>
                </div>
                
                {/* User Info */}
                <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-2xl">♪</span>
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <h4 className="font-semibold text-gray-900">User ID: {localStorage.getItem('melody_match_user_id')}</h4>
                    <p className="text-sm text-gray-600">Status: Active ✅</p>
                    <p className="text-xs text-gray-500">
                      Login Time: {localStorage.getItem('melody_match_login_time') ? 
                        new Date(parseInt(localStorage.getItem('melody_match_login_time') || '0')).toLocaleString() : 
                        'Unknown'
                      }
                    </p>
                  </div>
                </div>
                
                {/* Coming Soon Features */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800 text-center">Coming Soon 🚀</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                      <div className="text-2xl mb-1">🎯</div>
                      <p className="text-xs text-gray-600">Find Matches</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                      <div className="text-2xl mb-1">💌</div>
                      <p className="text-xs text-gray-600">Send Songs</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                      <div className="text-2xl mb-1">🎶</div>
                      <p className="text-xs text-gray-600">Playlists</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                      <div className="text-2xl mb-1">📊</div>
                      <p className="text-xs text-gray-600">Profile</p>
                    </div>
                  </div>
                </div>
                
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-[1.02]"
                >
                  🚪 Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Alert */}
      {showAlert && (
        <div className="fixed top-6 right-6 z-50">
          <div className={`p-4 rounded-xl shadow-lg border ${
            alertType === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span>{alertType === 'success' ? '✓' : '⚠'}</span>
                <p className="text-sm font-medium">{alertMessage}</p>
              </div>
              <button onClick={() => setShowAlert(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;