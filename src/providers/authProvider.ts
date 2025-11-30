import type { AuthProvider } from "@refinedev/core";
import { API_BASE_URL } from "../config/api";

export const TOKEN_KEY = "refine-auth";
export const USER_KEY = "refine-user";

// Flag to track login state
let isLoginInProgress = false;

// Function to decode JWT payload
const decodeJWT = (token: string) => {
  try {
    const payload = token.split('.')[1];
    const decodedPayload = atob(payload);
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

export const authProvider: AuthProvider = {
  login: async ({ username, email, password }) => {
    try {
      console.log('Step 1: Starting login process');
      isLoginInProgress = true;
      
      // Step 1: Call backend
      const response = await fetch(`${API_BASE_URL}/login-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username || email,
          password: password
        }),
      });

      console.log('Step 2: Backend response received', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: {
            name: "LoginError",
            message: errorData.message || errorData.error || "Invalid credentials",
          },
        };
      }

      // Step 2: Parse response and get token
      const data = await response.json();
      console.log('Step 3: Response parsed, token present:', !!data.token);
      
      if (!data.token) {
        return {
          success: false,
          error: {
            name: "LoginError",
            message: "No token received from server",
          },
        };
      }

      // Step 3: Validate token
      const jwtPayload = decodeJWT(data.token);
      console.log('Step 4: Token decoded, valid:', !!jwtPayload);
      
      if (!jwtPayload) {
        return {
          success: false,
          error: {
            name: "LoginError",
            message: "Invalid token received",
          },
        };
      }

      // Step 4: Check token expiration
      if (jwtPayload.exp) {
        const currentTime = Date.now() / 1000;
        if (jwtPayload.exp < currentTime) {
          return {
            success: false,
            error: {
              name: "LoginError",
              message: "Token is already expired",
            },
          };
        }
      }
      console.log('Step 5: Token is valid and not expired');

      // Step 5: Prepare user info
      const extractFirstName = (email: string) => {
        if (email && email.includes('@')) {
          const localPart = email.split('@')[0];
          return localPart.charAt(0).toUpperCase() + localPart.slice(1);
        }
        return email;
      };

      const userEmail = jwtPayload?.email || jwtPayload?.username || username || email;
      const displayName = extractFirstName(userEmail);

      const userInfo = {
        id: jwtPayload?.sub || jwtPayload?.user_id || 1,
        name: displayName,
        email: userEmail,
        roles: jwtPayload?.roles || [] // Extract roles from JWT
      };

      // Step 6: Store token and user info
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(userInfo));
      console.log('Step 6: Token and user info stored');

      // Step 7: Verify storage
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      
      if (!storedToken || storedToken !== data.token) {
        return {
          success: false,
          error: {
            name: "LoginError",
            message: "Failed to store token",
          },
        };
      }
      
      if (!storedUser) {
        return {
          success: false,
          error: {
            name: "LoginError",
            message: "Failed to store user info",
          },
        };
      }
      
      console.log('Step 7: Storage verified successfully');

      // Step 8: Force a small delay to ensure localStorage is flushed
      await new Promise(resolve => setTimeout(resolve, 50));

      // Step 9: Final verification
      const finalToken = localStorage.getItem(TOKEN_KEY);
      if (!finalToken || finalToken !== data.token) {
        return {
          success: false,
          error: {
            name: "LoginError",
            message: "Token storage verification failed",
          },
        };
      }

      // Step 10: Login complete
      isLoginInProgress = false;
      console.log('Step 9: Login process completed with verified token storage');

      return {
        success: true,
        redirectTo: "/",
      };

    } catch (error) {
      console.error('Login error:', error);
      isLoginInProgress = false; // Reset flag on error
      return {
        success: false,
        error: {
          name: "LoginError",
          message: "Network error. Please try again.",
        },
      };
    }
  },
  logout: async () => {
    console.log('Step 1: Starting logout process');
    
    // Step 1: Remove from localStorage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    console.log('Step 2: Removed from localStorage');
    
    // Step 2: Verify complete removal
    const tokenStillThere = localStorage.getItem(TOKEN_KEY);
    const userStillThere = localStorage.getItem(USER_KEY);
    
    if (tokenStillThere || userStillThere) {
      console.error('Step 3: Cleanup failed, forcing clear');
      // Force clear all localStorage if specific removal failed
      localStorage.clear();
      
      // Double check
      const stillThere = localStorage.getItem(TOKEN_KEY) || localStorage.getItem(USER_KEY);
      if (stillThere) {
        console.error('Step 4: Force clear failed - this should not happen');
      } else {
        console.log('Step 4: Force clear successful');
      }
    } else {
      console.log('Step 3: Clean removal verified');
    }
    
    // Step 3: Also clear any browser caches/memory
    if (window.caches) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('Step 5: Browser caches cleared');
      } catch (error) {
        console.warn('Step 5: Could not clear caches:', error);
      }
    }
    
    console.log('Step 6: Logout complete');
    
    return {
      success: true,
      redirectTo: "/login",
    };
  },
  check: async () => {
    // If login is in progress, wait for it to complete
    if (isLoginInProgress) {
      console.log('Check: Login in progress, waiting...');
      // Wait for login to complete
      let attempts = 0;
      while (isLoginInProgress && attempts < 50) { // Max 5 seconds
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      console.log('Check: Login completed, proceeding with check');
    }
    
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      // Decode JWT to check expiration
      const jwtPayload = decodeJWT(token);
      if (jwtPayload && jwtPayload.exp) {
        const currentTime = Date.now() / 1000; // Convert to seconds
        if (jwtPayload.exp < currentTime) {
          // Token is expired, clear storage
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          return {
            authenticated: false,
            redirectTo: "/login",
            error: {
              name: "SessionExpired",
              message: "Your session has expired. Please login again.",
            },
          };
        }
      }
      
      return {
        authenticated: true,
      };
    }

    return {
      authenticated: false,
      redirectTo: "/login",
    };
  },
  getPermissions: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        // Return roles array from user info
        return user.roles || [];
      } catch {
        // Fallback: extract roles from JWT directly
        const jwtPayload = decodeJWT(token);
        return jwtPayload?.roles || [];
      }
    }

    return [];
  },
  getIdentity: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        return {
          id: user.id || 1,
          name: user.name || user.username || "User",
          email: user.email
        };
      } catch {
        // Extract first name from email format "prenom@provenceholidays.com" as fallback
        const extractFirstName = (email: string) => {
          if (email && email.includes('@')) {
            const localPart = email.split('@')[0];
            return localPart.charAt(0).toUpperCase() + localPart.slice(1);
          }
          return "User";
        };

        return {
          id: 1,
          name: extractFirstName(token),
        };
      }
    }
    return null;
  },
  onError: async (error) => {
    console.error(error);
    
    // Handle authentication errors (401 Unauthorized)
    if (error?.statusCode === 401) {
      // Clear stored authentication data
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      
      return {
        logout: true,
        redirectTo: "/login",
        error: {
          name: "AuthenticationError",
          message: "Your session has expired. Please login again.",
        },
      };
    }

    return { error };
  },
};
