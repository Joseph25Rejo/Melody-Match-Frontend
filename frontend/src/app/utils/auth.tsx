// Shared authentication utilities for Melody Match

export const AUTH_KEYS = {
  TOKEN: 'melody_match_token',
  USER_ID: 'melody_match_user_id',
  TOKEN_EXPIRY: 'melody_match_token_expiry',
  LOGIN_TIME: 'melody_match_login_time',
  ORIGIN: 'melody_match_origin'
};

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://thecodeworks.in/melodymatch';

// Define proper types
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

/**
 * Safely clear all authentication data from localStorage
 */
export const clearAuthData = (): void => {
  try {
    Object.values(AUTH_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    console.log('🧹 Auth data cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing auth data:', error);
  }
};

/**
 * Get stored token with basic validation
 */
export const getStoredToken = (): { token: string | null; isExpired: boolean } => {
  try {
    const token = localStorage.getItem(AUTH_KEYS.TOKEN);
    const tokenExpiry = localStorage.getItem(AUTH_KEYS.TOKEN_EXPIRY);
    
    if (!token) {
      return { token: null, isExpired: false };
    }
    
    // Check timestamp expiry
    const isExpired = tokenExpiry ? Date.now() > parseInt(tokenExpiry) : false;
    
    return { token, isExpired };
  } catch (error) {
    console.error('❌ Error getting stored token:', error);
    return { token: null, isExpired: true };
  }
};

/**
 * Validate token with server
 */
export const validateTokenWithServer = async (token: string): Promise<{ isValid: boolean; userData?: UserProfile }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const userData = await response.json();
      return { isValid: true, userData };
    } else if (response.status === 401) {
      return { isValid: false };
    } else {
      // Server error, assume token might still be valid
      console.warn('⚠️ Server error during token validation:', response.status);
      return { isValid: false };
    }
  } catch (error) {
    console.error('🌐 Network error during token validation:', error);
    // On network errors, we can't determine validity
    return { isValid: false };
  }
};

/**
 * Complete authentication check with cleanup
 */
export const checkAuthentication = async (): Promise<{ 
  isAuthenticated: boolean; 
  userData?: UserProfile; 
  shouldRedirect?: string 
}> => {
  const { token, isExpired } = getStoredToken();
  
  if (!token) {
    return { isAuthenticated: false };
  }
  
  if (isExpired) {
    console.log('🕐 Token expired by timestamp, cleaning up...');
    clearAuthData();
    return { isAuthenticated: false };
  }
  
  // Validate with server
  const { isValid, userData } = await validateTokenWithServer(token);
  
  if (!isValid) {
    console.log('🚫 Token invalid on server, cleaning up...');
    clearAuthData();
    return { isAuthenticated: false };
  }
  
  return { isAuthenticated: true, userData };
};

/**
 * Save user authentication data
 */
export const saveAuthData = (data: {
  token: string;
  user_id: string;
  expires_in?: number;
}): void => {
  try {
    localStorage.setItem(AUTH_KEYS.TOKEN, data.token);
    localStorage.setItem(AUTH_KEYS.USER_ID, data.user_id);
    
    if (data.expires_in) {
      const expiryTime = Date.now() + (data.expires_in * 1000);
      localStorage.setItem(AUTH_KEYS.TOKEN_EXPIRY, expiryTime.toString());
    }
    
    localStorage.setItem(AUTH_KEYS.LOGIN_TIME, Date.now().toString());
    console.log('💾 Auth data saved successfully');
  } catch (error) {
    console.error('❌ Failed to save auth data:', error);
  }
};