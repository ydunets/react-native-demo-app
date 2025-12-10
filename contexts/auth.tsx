// FILE 10: contexts/auth.tsx
/**
 * Authentication Context with OAuth Discovery
 * Provides app-wide authentication setup and discovery document
 */

import React, { ReactNode, useEffect, useState } from 'react';
import * as AuthSession from 'expo-auth-session';
import { useAuthStore } from '@/store/authStore';
import { useRefreshTokens } from '@/api/keycloak-integration/useRefreshTokens';
import { envConfig } from '@/configs/env-config';
import { logoutFromKeycloak } from '@/api/keycloak-integration/keycloakLogout';


/**
 * Auth context value type
 */
interface AuthContextValue {
  discovery: AuthSession.DiscoveryDocument | null;
  isDiscoveryLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
}

/**
 * Create auth context with initial null value
 */
export const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

/**
 * Auth provider props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Provider Component
 * Initializes OAuth discovery and manages app-wide auth state
 * 
 * @param children - Child components
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { isLoggedIn, logoutFromKeycloak } = useAuthStore();
  const { isRefreshing, canUseTokens } = useRefreshTokens();
  const [discovery, setDiscovery] = useState<AuthSession.DiscoveryDocument | null>(null);
  const [isDiscoveryLoading, setIsDiscoveryLoading] = useState(true);

  /**
   * Fetch OAuth discovery document on mount
   */
  useEffect(() => {
    const fetchDiscovery = async () => {
      try {
        setIsDiscoveryLoading(true);
        const discoveryUrl = `${envConfig.keycloakURL}/realms/${envConfig.realm}`;
        
        const discoveryDoc = await AuthSession.fetchDiscoveryAsync(discoveryUrl);
        setDiscovery(discoveryDoc);
      } catch (error) {
        console.error('Failed to fetch OAuth discovery document:', error);
        setDiscovery(null);
      } finally {
        setIsDiscoveryLoading(false);
      }
    };

    fetchDiscovery();
  }, []);

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    try {
      console.log('Starting logout...');
      
      // // Call Keycloak logout - this invalidates server session
      // await logoutFromKeycloak();
      
      // Clear local auth state
      await logoutFromKeycloak();
      
      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('❌ Error during logout:', error);
      // Force local logout even if Keycloak logout fails
      await logoutFromKeycloak();
    }
  };

  /**
   * Determine if user is authenticated
   * User must be logged in and tokens must be valid
   */
  const isAuthenticated = isLoggedIn && canUseTokens && !isRefreshing;

  const value: AuthContextValue = {
    discovery,
    isDiscoveryLoading,
    isAuthenticated,
    logout: handleLogout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use auth context
 * @throws Error if used outside AuthProvider
 */
export const useAuthContext = (): AuthContextValue => {
  const context = React.useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }

  return context;
};

/**
 * Custom hook to use OAuth discovery
 * Provides access to discovered endpoints
 */
export const useOAuthDiscovery = (): AuthSession.DiscoveryDocument | null => {
  const { discovery } = useAuthContext();
  return discovery;
};