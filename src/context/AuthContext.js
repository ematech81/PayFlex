import React, { createContext, useContext } from 'react';
import { useWallet } from './WalletContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const walletContext = useWallet();

  // Derive auth state from wallet context
  const user = walletContext.wallet?.user || null;
  const isAuthenticated = !!walletContext.wallet?.token;
  const isLoading = walletContext.wallet?.isLoading || false;

  // Use wallet context methods directly
  const login = walletContext.login;
  const logout = walletContext.logout;
  const refreshUser = walletContext.refreshWallet;

  const updateUser = async (updates) => {
    if (!user) {
      throw new Error('No user to update');
    }

    const updatedUser = { ...user, ...updates };
    
    // Update wallet balance if provided
    if (updates.walletBalance !== undefined) {
      await walletContext.updateWalletBalance(updates.walletBalance);
    }
    
    // For other updates, we'll need to add a method to WalletContext
    // For now, return the updated user
    return updatedUser;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        updateUser,
        refreshUser,
        // Additional wallet-related data
        walletBalance: user?.walletBalance || 0,
        transactionPinSet: walletContext.wallet?.transactionPinSet || false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};