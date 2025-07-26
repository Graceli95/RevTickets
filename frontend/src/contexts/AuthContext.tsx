'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { User } from '../app/shared/types';
import { apiClient } from '../lib/api/client';

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
    }
  }, []);

  const validateToken = async () => {
    try {
      const userResponse = await apiClient.get<User>('/users/profile');
      dispatch({ type: 'SET_USER', payload: userResponse });
    } catch {
      // Token is invalid, remove it
      localStorage.removeItem('authToken');
      dispatch({ type: 'LOGOUT' });
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
      const loginResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/login`, {
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