import React, { useState, useEffect } from 'react';
import CryptoSection from './CryptoSection';
import BankSection from './BankSection';
import AnalyticsSection from './AnalyticsSection';
import { FiCreditCard, FiLogIn, FiRefreshCw } from 'react-icons/fi';
import "./BankTracker.css";

const BankTracker = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('transactions');
  const [isConnected, setIsConnected] = useState(false);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-black text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-red-900' : 'bg-red-600'} shadow-lg`}>
        <div className="max-w-10xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold text-yellow-500">
                <FiCreditCard className="inline mr-2" />
                 Bank Tracker
              </h1>
              
            </div>
            <div className="flex items-center space-x-4">
              {isConnected ? (
                <button
                  onClick={syncWithBank}
                  className="flex items-center px-4 py-2 rounded-md bg-black text-yellow-400 border-2 border-yellow-400 hover:bg-yellow-400 hover:text-black transition-colors"
                >
                  <FiRefreshCw className="mr-2" />
                  Sync
                </button>
              ) : (
                <button
                 
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 border-2 border-red-700 transition-colors"
                >
                  <FiLogIn className="mr-2" />
                  Connect to OTP Bank
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[100%] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CryptoSection darkMode={darkMode} />
          <BankSection 
            darkMode={darkMode} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            isConnected={isConnected}
          />
        </div>
      </main>
    </div>
  );
};

export default BankTracker;