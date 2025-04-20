import React, { useState, useEffect } from 'react';
import { 
  FiArrowUp, 
  FiArrowDown, 
  FiDollarSign, 
  FiPlus, 
  FiTrash2, 
  FiPieChart,
  FiBarChart2,
  FiCreditCard,
  FiRefreshCw,
  FiLogIn,
  FiSearch,
  FiTrendingUp,
  FiTrendingDown,
  FiAlertCircle
} from 'react-icons/fi';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer, LineChart, Line } from 'recharts';
import "./BankTracker.css";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// API configuration
const API_CONFIG = {
  coinGecko: {
    baseUrl: 'https://api.coingecko.com/api/v3',
    endpoints: {
      markets: '/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=24h'
    }
  },
  cryptoCompare: {
    baseUrl: 'https://min-api.cryptocompare.com/data',
    endpoints: {
      price: '/price?fsym=BTC&tsyms=USD,EUR'
    }
  },
  binance: {
    baseUrl: 'https://api.binance.com/api/v3',
    endpoints: {
      price: '/ticker/price?symbol=BTCUSDT'
    }
  },
  coinMarketCap: {
    baseUrl: 'https://pro-api.coinmarketcap.com/v1',
    endpoints: {
      listings: '/cryptocurrency/listings/latest'
    },
    // Note: You'll need to add your API key here
    apiKey: 'YOUR_COINMARKETCAP_API_KEY'
  }
};

const BankTracker = () => {
  // State for bank data
  const [bankData, setBankData] = useState({
    balance: 0,
    income: 0,
    expenses: 0,
    transactions: [],
    categories: {}
  });
  
  // State for crypto data
  const [cryptoState, setCryptoState] = useState({
    cryptos: [],
    searchTerm: '',
    selectedCrypto: null,
    portfolio: [],
    showPortfolio: false,
    loading: true,
    error: null,
    apiStats: {
      coinGecko: { lastUpdated: null, status: 'idle' },
      cryptoCompare: { lastUpdated: null, status: 'idle' },
      binance: { lastUpdated: null, status: 'idle' },
      coinMarketCap: { lastUpdated: null, status: 'idle' }
    }
  });

  // Form state
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [transactionType, setTransactionType] = useState('income');
  const [category, setCategory] = useState('other');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // UI state
  const [activeTab, setActiveTab] = useState('transactions');
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [timeRange, setTimeRange] = useState('month');

  // Categories
  const categories = [
    { value: 'salary', label: 'Salary' },
    { value: 'housing', label: 'Housing' },
    { value: 'food', label: 'Food' },
    { value: 'transport', label: 'Transport' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'other', label: 'Other' }
  ];

  // Fetch data from all crypto APIs
  const fetchCryptoData = async () => {
    try {
      setCryptoState(prev => ({
        ...prev,
        loading: true,
        error: null,
        apiStats: {
          coinGecko: { ...prev.apiStats.coinGecko, status: 'loading' },
          cryptoCompare: { ...prev.apiStats.cryptoCompare, status: 'loading' },
          binance: { ...prev.apiStats.binance, status: 'loading' },
          coinMarketCap: { ...prev.apiStats.coinMarketCap, status: 'loading' }
        }
      }));

      // Fetch from CoinGecko (primary data source)
      const geckoResponse = await fetch(
        `${API_CONFIG.coinGecko.baseUrl}${API_CONFIG.coinGecko.endpoints.markets}`
      );
      if (!geckoResponse.ok) throw new Error('CoinGecko API failed');
      const geckoData = await geckoResponse.json();

      // Fetch from CryptoCompare
      const compareResponse = await fetch(
        `${API_CONFIG.cryptoCompare.baseUrl}${API_CONFIG.cryptoCompare.endpoints.price}`
      );
      const compareData = compareResponse.ok ? await compareResponse.json() : null;

      // Fetch from Binance
      const binanceResponse = await fetch(
        `${API_CONFIG.binance.baseUrl}${API_CONFIG.binance.endpoints.price}`
      );
      const binanceData = binanceResponse.ok ? await binanceResponse.json() : null;

      // Fetch from CoinMarketCap (requires API key)
      let cmcData = null;
      try {
        const cmcResponse = await fetch(
          `${API_CONFIG.coinMarketCap.baseUrl}${API_CONFIG.coinMarketCap.endpoints.listings}`,
          {
            headers: {
              'X-CMC_PRO_API_KEY': API_CONFIG.coinMarketCap.apiKey
            }
          }
        );
        cmcData = cmcResponse.ok ? await cmcResponse.json() : null;
      } catch (e) {
        console.warn('CoinMarketCap API failed (might need API key)');
      }

      // Process CoinGecko data (our primary source)
      const processedCryptos = geckoData.map(crypto => ({
        id: crypto.id,
        name: crypto.name,
        symbol: crypto.symbol.toUpperCase(),
        price: crypto.current_price,
        change24h: crypto.price_change_percentage_24h,
        marketCap: crypto.market_cap,
        volume: crypto.total_volume,
        circulatingSupply: crypto.circulating_supply,
        history: crypto.sparkline_in_7d.price.map((price, index) => ({
          date: new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000).toLocaleDateString(),
          price
        })),
        // Add data from other APIs where available
        compareData: compareData,
        binanceData: binanceData,
        cmcData: cmcData?.data?.find(c => c.symbol === crypto.symbol.toUpperCase())
      }));

      setCryptoState(prev => ({
        ...prev,
        cryptos: processedCryptos,
        selectedCrypto: processedCryptos.length > 0 ? processedCryptos[0] : null,
        loading: false,
        apiStats: {
          coinGecko: { lastUpdated: new Date(), status: 'success' },
          cryptoCompare: { lastUpdated: new Date(), status: compareData ? 'success' : 'error' },
          binance: { lastUpdated: new Date(), status: binanceData ? 'success' : 'error' },
          coinMarketCap: { lastUpdated: new Date(), status: cmcData ? 'success' : 'error' }
        }
      }));
    } catch (error) {
      setCryptoState(prev => ({
        ...prev,
        error: error.message,
        loading: false,
        apiStats: {
          ...prev.apiStats,
          coinGecko: { ...prev.apiStats.coinGecko, status: 'error' }
        }
      }));
    }
  };

  // Mock OTP Bank connection
  const connectToOTP = () => {

  };

  // Crypto functions
  const handleCryptoSearch = (e) => {
    setCryptoState(prev => ({
      ...prev,
      searchTerm: e.target.value
    }));
  };

  const selectCrypto = (crypto) => {
    setCryptoState(prev => ({
      ...prev,
      selectedCrypto: crypto
    }));
  };

  const addToPortfolio = (crypto, amount) => {
    setCryptoState(prev => ({
      ...prev,
      portfolio: [...prev.portfolio, {
        ...crypto,
        amount: parseFloat(amount) || 0,
        purchasePrice: crypto.price,
        date: new Date().toLocaleString()
      }]
    }));
  };

  const togglePortfolioView = () => {
    setCryptoState(prev => ({
      ...prev,
      showPortfolio: !prev.showPortfolio
    }));
  };

  const refreshCryptoData = () => {
    fetchCryptoData();
  };

  // Generate realistic mock transactions
  const generateMockTransactions = () => {
    const transactions = [];
    const now = new Date();
    
    // Salary (income)
    transactions.push({
      id: 1,
      amount: 250000,
      description: 'Monthly Salary',
      type: 'income',
      category: 'salary',
      date: new Date(now.getFullYear(), now.getMonth(), 1).toLocaleString()
    });

    // Rent (expense)
    transactions.push({
      id: 2,
      amount: 80000,
      description: 'Apartment Rent',
      type: 'expense',
      category: 'housing',
      date: new Date(now.getFullYear(), now.getMonth(), 2).toLocaleString()
    });

    // Groceries (multiple)
    for (let i = 0; i < 8; i++) {
      transactions.push({
        id: 3 + i,
        amount: Math.floor(5000 + Math.random() * 15000),
        description: ['Grocery', 'Supermarket', 'Food Market'][Math.floor(Math.random() * 3)],
        type: 'expense',
        category: 'food',
        date: new Date(now.getFullYear(), now.getMonth(), 3 + i * 3).toLocaleString()
      });
    }

    // Utilities
    transactions.push({
      id: 12,
      amount: 15000,
      description: 'Electricity Bill',
      type: 'expense',
      category: 'utilities',
      date: new Date(now.getFullYear(), now.getMonth(), 10).toLocaleString()
    });

    // Transport
    for (let i = 0; i < 4; i++) {
      transactions.push({
        id: 13 + i,
        amount: Math.floor(2000 + Math.random() * 5000),
        description: 'Public Transport',
        type: 'expense',
        category: 'transport',
        date: new Date(now.getFullYear(), now.getMonth(), 5 + i * 7).toLocaleString()
      });
    }

    // Entertainment
    transactions.push({
      id: 17,
      amount: 12000,
      description: 'Cinema',
      type: 'expense',
      category: 'entertainment',
      date: new Date(now.getFullYear(), now.getMonth(), 15).toLocaleString()
    });

    return transactions;
  };

  // Process transactions and update state
  const processTransactions = (transactions) => {
    let balance = 0;
    let income = 0;
    let expenses = 0;
    const categoriesData = {};
    
    // Initialize categories
    categories.forEach(cat => {
      categoriesData[cat.value] = { income: 0, expenses: 0 };
    });

    // Process each transaction
    transactions.forEach(transaction => {
      if (transaction.type === 'income') {
        balance += transaction.amount;
        income += transaction.amount;
        categoriesData[transaction.category].income += transaction.amount;
      } else {
        balance -= transaction.amount;
        expenses += transaction.amount;
        categoriesData[transaction.category].expenses += transaction.amount;
      }
    });

    setBankData({
      balance,
      income,
      expenses,
      transactions,
      categories: categoriesData
    });
  };

  // Filter transactions by time range
  const filterTransactionsByTime = () => {
    const now = new Date();
    let fromDate;
    
    switch (timeRange) {
      case 'week':
        fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'month':
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        fromDate = new Date(now.getFullYear(), 0, 1);
        break;
      default: // 'all'
        return bankData.transactions;
    }
    
    return bankData.transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= fromDate;
    });
  };

  // Load data from localStorage and APIs
  useEffect(() => {
    const savedData = localStorage.getItem('bankData');
    if (savedData) {
      setBankData(JSON.parse(savedData));
    }
    const savedCrypto = localStorage.getItem('cryptoData');
    if (savedCrypto) {
      setCryptoState(prev => ({
        ...JSON.parse(savedCrypto),
        loading: false
      }));
    } else {
      fetchCryptoData();
    }
  }, []);
  
  // Save to localStorage when data changes
  useEffect(() => {
    localStorage.setItem('bankData', JSON.stringify(bankData));
    localStorage.setItem('cryptoData', JSON.stringify({
      ...cryptoState,
      loading: false,
      error: null
    }));
  }, [bankData, cryptoState]);
  
  // Handle manual transaction
  const handleTransaction = (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    
    setIsSubmitting(true);
    
    const newTransaction = {
      id: Date.now(),
      amount: numAmount,
      description,
      type: transactionType,
      category,
      date: new Date().toLocaleString()
    };
    
    setTimeout(() => {
      setBankData(prev => {
        const newBalance = transactionType === 'income' 
          ? prev.balance + numAmount 
          : prev.balance - numAmount;
        
        const newIncome = transactionType === 'income' 
          ? prev.income + numAmount 
          : prev.income;
        
        const newExpenses = transactionType === 'expense' 
          ? prev.expenses + numAmount 
          : prev.expenses;
        
        const newCategories = { ...prev.categories };
        if (!newCategories[category]) {
          newCategories[category] = { income: 0, expenses: 0 };
        }
        
        if (transactionType === 'income') {
          newCategories[category].income += numAmount;
        } else {
          newCategories[category].expenses += numAmount;
        }
        
        return {
          balance: newBalance,
          income: newIncome,
          expenses: newExpenses,
          transactions: [newTransaction, ...prev.transactions],
          categories: newCategories
        };
      });
      
      // Reset form
      setAmount('');
      setDescription('');
      setIsSubmitting(false);
    }, 500);
  };
  
  // Sync with bank (non-functional as requested)
  const syncWithBank = () => {
    console.log("Sync button clicked but function is disabled");
  };

  // Clear all data
  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      localStorage.removeItem('bankData');
      localStorage.removeItem('cryptoData');
      setBankData({
        balance: 0,
        income: 0,
        expenses: 0,
        transactions: [],
        categories: {}
      });
      setCryptoState({
        cryptos: [],
        searchTerm: '',
        selectedCrypto: null,
        portfolio: [],
        showPortfolio: false,
        loading: true,
        error: null,
        apiStats: {
          coinGecko: { lastUpdated: null, status: 'idle' },
          cryptoCompare: { lastUpdated: null, status: 'idle' },
          binance: { lastUpdated: null, status: 'idle' },
          coinMarketCap: { lastUpdated: null, status: 'idle' }
        }
      });
      setIsConnected(false);
      fetchCryptoData(); // Refresh crypto data after clear
    }
  };
  
  // Delete transaction
  const deleteTransaction = (id) => {
    const transaction = bankData.transactions.find(t => t.id === id);
    if (!transaction) return;
    
    if (window.confirm(`Delete this ${transaction.type} transaction?`)) {
      setBankData(prev => {
        const newBalance = transaction.type === 'income' 
          ? prev.balance - transaction.amount 
          : prev.balance + transaction.amount;
        
        const newIncome = transaction.type === 'income' 
          ? prev.income - transaction.amount 
          : prev.income;
        
        const newExpenses = transaction.type === 'expense' 
          ? prev.expenses - transaction.amount 
          : prev.expenses;
        
        const newCategories = { ...prev.categories };
        if (transaction.type === 'income') {
          newCategories[transaction.category].income -= transaction.amount;
        } else {
          newCategories[transaction.category].expenses -= transaction.amount;
        }
        
        return {
          balance: newBalance,
          income: newIncome,
          expenses: newExpenses,
          transactions: prev.transactions.filter(t => t.id !== id),
          categories: newCategories
        };
      });
    }
  };
  
  // Prepare data for charts
  const prepareChartData = () => {
    const filteredTransactions = filterTransactionsByTime();
    
    // Expense by category
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.value] = { name: cat.label, value: 0 };
    });

    filteredTransactions.forEach(transaction => {
      if (transaction.type === 'expense') {
        categoryMap[transaction.category].value += transaction.amount;
      }
    });

    const expenseData = Object.values(categoryMap).filter(item => item.value > 0);
    
    // Monthly trend data
    const monthlyData = [];
    const now = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Get data for last 6 months
    for (let i = 5; i >= 0; i--) {
      const month = (now.getMonth() - i + 12) % 12;
      const year = now.getFullYear() - (i > now.getMonth() ? 1 : 0);
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);
      
      const monthTransactions = bankData.transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      });
      
      const monthIncome = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const monthExpenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      monthlyData.push({
        name: monthNames[month],
        income: monthIncome,
        expenses: monthExpenses
      });
    }
    
    return { expenseData, monthlyData, filteredTransactions };
  };
  
  const { expenseData, monthlyData, filteredTransactions } = prepareChartData();

  // Filter cryptos based on search term
  const filteredCryptos = cryptoState.cryptos.filter(crypto => 
    crypto.name.toLowerCase().includes(cryptoState.searchTerm.toLowerCase()) ||
    crypto.symbol.toLowerCase().includes(cryptoState.searchTerm.toLowerCase())
  );

  // Add this new state at the top of your component
const [darkMode, setDarkMode] = useState(true);
const [cryptoChartType, setCryptoChartType] = useState('line');
const [bankChartType, setBankChartType] = useState('bar');

// Add these toggle functions
const toggleDarkMode = () => {
  setDarkMode(!darkMode);
};

const toggleCryptoChart = () => {
  setCryptoChartType(cryptoChartType === 'line' ? 'bar' : 'line');
};

const toggleBankChart = () => {
  setBankChartType(bankChartType === 'bar' ? 'pie' : 'bar');
};

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-red-900 shadow-lg">
        <div className="max-w-10xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold text-yellow-400">
                <FiCreditCard className="inline mr-2" />
                OTP Bank Tracker
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
                  onClick={connectToOTP}
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
        {/* Dual columns layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column - Crypto Tracker */}
        <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden border-2 border-red-700">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
              <h2 className="text-xl font-bold text-yellow-400">Cryptocurrency & Commodities</h2>
              <div className="flex space-x-3">
                <button 
                  onClick={refreshCryptoData}
                  className="flex items-center px-3 py-1 text-sm bg-black text-yellow-400 rounded-md border border-yellow-400 hover:bg-yellow-400 hover:text-black transition-colors"
                >
                  <FiRefreshCw className="mr-1" /> Refresh
                </button>
                <button
                  onClick={togglePortfolioView}
                  className="flex items-center px-3 py-1 text-sm bg-black text-blue-400 rounded-md border border-blue-400 hover:bg-blue-400 hover:text-black transition-colors"
                >
                  {cryptoState.showPortfolio ? 'Hide' : 'Show'} Portfolio
                </button>
              </div>
            </div>
              
              {/* API Status Indicators */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  cryptoState.apiStats.coinGecko.status === 'success' ? 'bg-green-900 text-green-300' :
                  cryptoState.apiStats.coinGecko.status === 'error' ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300'
                }`}>
                  CoinGecko: {cryptoState.apiStats.coinGecko.status}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  cryptoState.apiStats.cryptoCompare.status === 'success' ? 'bg-green-900 text-green-300' :
                  cryptoState.apiStats.cryptoCompare.status === 'error' ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300'
                }`}>
                  CryptoCompare: {cryptoState.apiStats.cryptoCompare.status}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  cryptoState.apiStats.binance.status === 'success' ? 'bg-green-900 text-green-300' :
                  cryptoState.apiStats.binance.status === 'error' ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300'
                }`}>
                  Binance: {cryptoState.apiStats.binance.status}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  cryptoState.apiStats.coinMarketCap.status === 'success' ? 'bg-green-900 text-green-300' :
                  cryptoState.apiStats.coinMarketCap.status === 'error' ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300'
                }`}>
                  CoinMarketCap: {cryptoState.apiStats.coinMarketCap.status}
                </span>
              </div>
              
              {/* Search and filter */}
              <div className="mb-6 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search Bitcoin, Gold, etc..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-md leading-5 bg-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                  value={cryptoState.searchTerm}
                  onChange={handleCryptoSearch}
                />
              </div>
              
              {/* Crypto content */}
              {cryptoState.loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
                  <p className="mt-2 text-gray-400">Loading cryptocurrency data...</p>
                </div>
              ) : cryptoState.error ? (
                <div className="text-center py-8 text-red-400">
                  <FiAlertCircle className="inline-block text-2xl mb-2" />
                  <p>Error loading crypto data: {cryptoState.error}</p>
                  <button
                    onClick={fetchCryptoData}
                    className="mt-4 inline-flex items-center px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 border border-red-800"
                  >
                    <FiRefreshCw className="mr-2" />
                    Retry
                  </button>
                </div>
              ) : (
                <>
                  {!cryptoState.showPortfolio ? (
                    <>
                      <div className="mb-6 max-h-96 overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                          <thead className="bg-gray-800">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider">Asset</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider">Price</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider">24h</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider">Market Cap</th>
                            </tr>
                          </thead>
                          <tbody className="bg-gray-900 divide-y divide-gray-800">
                            {filteredCryptos.map((crypto) => (
                              <tr 
                                key={crypto.id} 
                                className={`hover:bg-gray-800 cursor-pointer ${
                                  cryptoState.selectedCrypto?.id === crypto.id ? 'bg-gray-800' : ''
                                }`}
                                onClick={() => selectCrypto(crypto)}
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10 bg-gray-700 rounded-full flex items-center justify-center">
                                      <span className="text-yellow-400 font-bold">{crypto.symbol}</span>
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-white">{crypto.name}</div>
                                      <div className="text-sm text-gray-400">{crypto.symbol}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-white">${crypto.price.toLocaleString()}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className={`text-sm ${
                                    crypto.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                                  }`}>
                                    {crypto.change24h >= 0 ? '+' : ''}{crypto.change24h?.toFixed(2)}%
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                  ${(crypto.marketCap / 1000000000).toFixed(2)}B
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Selected crypto details */}
                      {cryptoState.selectedCrypto && (
                        <div className="mb-6">
                          <h3 className="text-lg font-bold text-yellow-400 mb-3">
                            {cryptoState.selectedCrypto.name} ({cryptoState.selectedCrypto.symbol})
                          </h3>
                          
                          {/* Multi-source price comparison */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                              <div className="text-xs text-gray-400">CoinGecko</div>
                              <div className="font-medium text-white">${cryptoState.selectedCrypto.price?.toLocaleString()}</div>
                            </div>
                            {cryptoState.selectedCrypto.compareData && (
                              <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                                <div className="text-xs text-gray-400">CryptoCompare</div>
                                <div className="font-medium text-white">${cryptoState.selectedCrypto.compareData.USD?.toLocaleString()}</div>
                              </div>
                            )}
                            {cryptoState.selectedCrypto.binanceData && (
                              <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                                <div className="text-xs text-gray-400">Binance</div>
                                <div className="font-medium text-white">${parseFloat(cryptoState.selectedCrypto.binanceData.price)?.toLocaleString()}</div>
                              </div>
                            )}
                            {cryptoState.selectedCrypto.cmcData && (
                              <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                                <div className="text-xs text-gray-400">CoinMarketCap</div>
                                <div className="font-medium text-white">${cryptoState.selectedCrypto.cmcData.quote?.USD?.price?.toLocaleString()}</div>
                              </div>
                            )}
                          </div>
                          
                          {/* Price chart */}
                          <div className="h-64 mb-6">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={cryptoState.selectedCrypto.history}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                                <XAxis dataKey="date" stroke="#d1d5db" />
                                <YAxis domain={['auto', 'auto']} stroke="#d1d5db" />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#4b5563' }}
                                  formatter={(value) => [`$${value}`, 'Price']}
                                  labelFormatter={(label) => `Date: ${label}`}
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="price" 
                                  stroke="#f59e0b" 
                                  strokeWidth={2}
                                  dot={false} 
                                  activeDot={{ r: 6, fill: '#f59e0b' }} 
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                          
                          {/* Add to portfolio */}
                          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
                            <input
                              type="number"
                              placeholder="Amount"
                              className="block w-full px-3 py-2 border border-gray-700 rounded-md shadow-sm bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                              id="cryptoAmount"
                            />
                            <button
                              onClick={() => {
                                const amountInput = document.getElementById('cryptoAmount');
                                addToPortfolio(cryptoState.selectedCrypto, amountInput.value);
                                amountInput.value = '';
                              }}
                              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                            >
                              Add to Portfolio
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Portfolio view */
                    <div className="mt-2">
                      <h3 className="text-lg font-bold text-yellow-400 mb-4">My Crypto Portfolio</h3>
                      {cryptoState.portfolio.length === 0 ? (
                        <p className="text-gray-400 text-center py-6">Your portfolio is empty</p>
                      ) : (
                        <div className="space-y-4">
                          {cryptoState.portfolio.map((item, index) => {
                            const currentValue = item.price * item.amount;
                            const purchaseValue = item.purchasePrice * item.amount;
                            const profitLoss = currentValue - purchaseValue;
                            const profitLossPercent = (profitLoss / purchaseValue) * 100;
                            
                            return (
                              <div key={index} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                  <div className="mb-2 sm:mb-0">
                                    <h4 className="font-bold text-white">{item.name} ({item.symbol})</h4>
                                    <p className="text-sm text-gray-400">
                                      {item.amount} {item.symbol} · Purchased: {item.date}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-white">${currentValue.toLocaleString()}</p>
                                    <p className={`text-sm ${
                                      profitLoss >= 0 ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                      {profitLoss >= 0 ? '▲' : '▼'} {Math.abs(profitLossPercent).toFixed(2)}% (${Math.abs(profitLoss).toFixed(2)})
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
  
          {/* Right column - Bank Tracker */}
          <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden border-2 border-red-700">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
              {/* Balance Card */}
              <div className="bg-gray-800 rounded-lg p-4 transition-all hover:shadow-lg border border-gray-700">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-black text-yellow-400 border border-yellow-400">
                    <FiDollarSign className="h-5 w-5" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-xs font-medium text-gray-400">Balance</h3>
                    <p className="text-xl font-bold text-white">
                      {bankData.balance.toLocaleString('hu-HU', {
                        style: 'currency',
                        currency: 'HUF',
                        minimumFractionDigits: 0
                      })}
                    </p>
                  </div>
                </div>
              </div>
  
              {/* Income Card */}
              <div className="bg-gray-800 rounded-lg p-4 transition-all hover:shadow-lg border border-gray-700">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-black text-green-400 border border-green-400">
                    <FiArrowUp className="h-5 w-5" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-xs font-medium text-gray-400">Income</h3>
                    <p className="text-xl font-bold text-white">
                      {bankData.income.toLocaleString('hu-HU', {
                        style: 'currency',
                        currency: 'HUF',
                        minimumFractionDigits: 0
                      })}
                    </p>
                  </div>
                </div>
              </div>
  
              {/* Expenses Card */}
              <div className="bg-gray-800 rounded-lg p-4 transition-all hover:shadow-lg border border-gray-700">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-black text-red-400 border border-red-400">
                    <FiArrowDown className="h-5 w-5" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-xs font-medium text-gray-400">Expenses</h3>
                    <p className="text-xl font-bold text-white">
                      {bankData.expenses.toLocaleString('hu-HU', {
                        style: 'currency',
                        currency: 'HUF',
                        minimumFractionDigits: 0
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
  
            {/* Tabs */}
            <div className="border-b border-gray-700">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('transactions')}
                  className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm mr-5 ml-5 ${
                    activeTab === 'transactions'
                      ? 'border-yellow-400 text-yellow-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <FiCreditCard className="inline mr-2" />
                  Transactions
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium mr-5 text-sm ${
                    activeTab === 'analytics'
                      ? 'border-yellow-400 text-yellow-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <FiPieChart className="inline mr-2" />
                  Analytics
                </button>
                <button
                  onClick={() => setActiveTab('add')}
                  className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium mr-5 text-sm ${
                    activeTab === 'add'
                      ? 'border-yellow-400 text-yellow-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <FiPlus className="inline mr-2" />
                  Add Transaction
                </button>
              </nav>
            </div>
  
            {/* Tab Content */}
            <div className="p-4">
              {/* Transactions Tab */}
              {activeTab === 'transactions' && (
                <div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-3 sm:space-y-0">
                    <h3 className="text-lg font-bold text-yellow-400">Recent Transactions</h3>
                    <div className="flex items-center space-x-2">
                      <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-700 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm rounded-md"
                      >
                        <option value="week">Last Week</option>
                        <option value="month">This Month</option>
                        <option value="year">This Year</option>
                        <option value="all">All Time</option>
                      </select>
                      <button
                        onClick={clearAllData}
                        className="flex items-center px-3 py-2 border border-red-500 text-sm font-medium rounded-md text-red-400 bg-black hover:bg-red-900 hover:text-white transition-colors"
                      >
                        <FiTrash2 className="mr-1" /> Clear All
                      </button>
                    </div>
                  </div>
  
                  {filteredTransactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      No transactions found
                    </div>
                  ) : (
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-800">
                          <tr>
                            <th scope="col" className="py-3 pl-4 pr-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider sm:pl-6">
                              Description
                            </th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider">
                              Category
                            </th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider">
                              Date
                            </th>
                            <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-yellow-400 uppercase tracking-wider">
                              Amount
                            </th>
                            <th scope="col" className="relative py-3 pl-3 pr-4 sm:pr-6">
                              <span className="sr-only">Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800 bg-gray-900">
                          {filteredTransactions.map((transaction) => (
                            <tr key={transaction.id} className="hover:bg-gray-800">
                              <td className="whitespace-nowrap py-3 pl-4 pr-3 text-sm font-medium text-white sm:pl-6">
                                {transaction.description}
                              </td>
                              <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-300 capitalize">
                                {transaction.category}
                              </td>
                              <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-400">
                                {new Date(transaction.date).toLocaleDateString()}
                              </td>
                              <td className={`whitespace-nowrap px-3 py-3 text-sm text-right font-bold ${
                                transaction.type === 'income' ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {transaction.type === 'income' ? '+' : '-'}
                                {transaction.amount.toLocaleString('hu-HU', {
                                  style: 'currency',
                                  currency: 'HUF',
                                  minimumFractionDigits: 0
                                })}
                              </td>
                              <td className="relative whitespace-nowrap py-3 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                <button
                                  onClick={() => deleteTransaction(transaction.id)}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <FiTrash2 />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
  
              {/* Analytics Tab */}
              {activeTab === 'analytics' && (
                <div>
                  <h3 className="text-lg font-bold text-yellow-400 mb-4">Financial Analytics</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Expense by Category Pie Chart */}
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                      <h4 className="text-md font-bold text-yellow-400 mb-4 flex items-center">
                        <FiPieChart className="mr-2" /> Expenses by Category
                      </h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={expenseData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              nameKey="name"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {expenseData.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={[
                                    '#ef4444', // red
                                    '#f59e0b', // yellow
                                    '#3b82f6', // blue
                                    '#10b981', // green
                                    '#8b5cf6', // purple
                                    '#ec4899', // pink
                                    '#14b8a6'  // teal
                                  ][index % 7]} 
                                />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#1f2937', 
                                borderColor: '#4b5563',
                                color: '#ffffff'
                              }}
                              formatter={(value) => [
                                value.toLocaleString('hu-HU', {
                                  style: 'currency',
                                  currency: 'HUF',
                                  minimumFractionDigits: 0
                                }),
                                'Amount'
                              ]}
                            />
                            <Legend 
                              wrapperStyle={{ color: '#d1d5db' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
  
                    {/* Monthly Trends Bar Chart */}
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                      <h4 className="text-md font-bold text-yellow-400 mb-4 flex items-center">
                        <FiBarChart2 className="mr-2" /> Monthly Trends
                      </h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={monthlyData}
                            margin={{
                              top: 5,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                            <XAxis dataKey="name" stroke="#d1d5db" />
                            <YAxis stroke="#d1d5db" />
                            <Tooltip 
                formatter={(value) => [
                  value.toLocaleString('hu-HU', {
                    style: 'currency',
                    currency: 'HUF',
                    minimumFractionDigits: 0
                  }),
                  'Amount'
                ]}
              />
              <Legend />
              <Bar dataKey="income" fill="#4CAF50" name="Income" />
              <Bar dataKey="expenses" fill="#F44336" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>

    {/* Category Breakdown */}
    <div className="bg-white p-4 rounded-lg shadow">
      <h4 className="text-md font-medium mb-4">Category Breakdown</h4>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Income
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expenses
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Net
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map((category) => {
              const catData = bankData.categories[category.value] || { income: 0, expenses: 0 };
              const net = catData.income - catData.expenses;
              return (
                <tr key={category.value}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                    {category.label}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                    {catData.income.toLocaleString('hu-HU', {
                      style: 'currency',
                      currency: 'HUF',
                      minimumFractionDigits: 0
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                    {catData.expenses.toLocaleString('hu-HU', {
                      style: 'currency',
                      currency: 'HUF',
                      minimumFractionDigits: 0
                    })}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                    net >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {net.toLocaleString('hu-HU', {
                      style: 'currency',
                      currency: 'HUF',
                      minimumFractionDigits: 0
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}

{/* Add Transaction Tab */}
{activeTab === 'add' && (
  <div>
    <h3 className="text-lg font-medium mb-4">Add New Transaction</h3>
    <form onSubmit={handleTransaction}>
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label htmlFor="transactionType" className="block text-sm font-medium text-gray-700">
            Type
          </label>
          <select
            id="transactionType"
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
            Amount (HUF)
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">Ft</span>
            </div>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-12 sm:text-sm border-gray-300 rounded-md"
              placeholder="0"
              min="1"
              step="1"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            required
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            required
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <FiPlus className="-ml-1 mr-2 h-5 w-5" />
                Add Transaction
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  </div>
)}
</div>
</div>
</div>
</main>
{/* Add this animated notification component */}
{isSubmitting && (
      <div className="fixed bottom-4 right-4 z-50">
        <div className={`flex items-center p-4 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800 border border-yellow-400' : 'bg-yellow-100 border border-yellow-400'}`}>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500"></div>
          <span className="ml-3">Processing transaction...</span>
        </div>
      </div>
    )}
  </div>

);
};

export default BankTracker;