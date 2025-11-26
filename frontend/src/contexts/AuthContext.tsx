'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { User } from '../app/shared/types';
import { apiClient } from '../lib/api/client';
import { API_BASE_URL } from '../constants';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_USER'; payload: User }
  | { type: 'CLEAR_ERROR' };

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        error: null,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Check for existing auth token on mount
    const token = localStorage.getItem('authToken');
    if (token) {
      // Validate token and get user info
      validateToken();
    } else {
      // No token, set loading to false immediately
      dispatch({ type: 'LOGIN_FAILURE', payload: 'No token found' });
    }
  }, []);

  const validateToken = async () => {
    try {
      dispatch({ type: 'LOGIN_START' });
      const userResponse = await apiClient.get<User>('/users/profile');
      dispatch({ type: 'SET_USER', payload: userResponse });
    } catch (error: unknown) {
      // Only logout if it's an authentication error (401/403)
      // Don't logout on network errors or server errors
      if (error instanceof Error && 
          (error.message.includes('401') || error.message.includes('403'))) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        dispatch({ type: 'LOGOUT' });
      } else {
        // For other errors (network, server down), keep user logged in but stop loading
        dispatch({ type: 'LOGIN_FAILURE', payload: 'Failed to validate token' });
        // Still try to get user from token if possible
        try {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            dispatch({ type: 'SET_USER', payload: JSON.parse(storedUser) });
          }
        } catch {
          // If can't parse stored user, logout
          localStorage.removeItem('authToken');
          dispatch({ type: 'LOGOUT' });
        }
      }
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      // Create form data for OAuth2 login
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      // Login API call
      const loginResponse = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        body: formData,
      });

      if (!loginResponse.ok) {
        throw new Error('Invalid credentials');
      }

      const { access_token } = await loginResponse.json();
      localStorage.setItem('authToken', access_token);

      // Get user profile
      const userResponse = await apiClient.get<User>('/users/profile');
      
      // Store user data for offline access
      localStorage.setItem('user', JSON.stringify(userResponse));
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: userResponse });
    } catch (error) {
      dispatch({ 
        type: 'LOGIN_FAILURE', 
        payload: error instanceof Error ? error.message : 'Login failed' 
      });
      throw error;
    }
  };

  const logout = (): void => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}