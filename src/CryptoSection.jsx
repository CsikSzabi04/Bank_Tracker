import React, { useState, useEffect } from 'react';
import { 
  FiRefreshCw, 
  FiLogIn,
  FiSearch,
  FiTrendingUp,
  FiTrendingDown,
  FiAlertCircle
} from 'react-icons/fi';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer, LineChart, Line } from 'recharts';

const CryptoSection = ({ darkMode }) => {
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
      apiKey: 'YOUR_COINMARKETCAP_API_KEY'
    }
  };

  useEffect(() => {
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

        const geckoResponse = await fetch(
          `${API_CONFIG.coinGecko.baseUrl}${API_CONFIG.coinGecko.endpoints.markets}`
        );
        if (!geckoResponse.ok) throw new Error('CoinGecko API failed');
        const geckoData = await geckoResponse.json();

        const compareResponse = await fetch(
          `${API_CONFIG.cryptoCompare.baseUrl}${API_CONFIG.cryptoCompare.endpoints.price}`
        );
        const compareData = compareResponse.ok ? await compareResponse.json() : null;

        const binanceResponse = await fetch(
          `${API_CONFIG.binance.baseUrl}${API_CONFIG.binance.endpoints.price}`
        );
        const binanceData = binanceResponse.ok ? await binanceResponse.json() : null;

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

    fetchCryptoData();
  }, []);

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

  const filteredCryptos = cryptoState.cryptos.filter(crypto => 
    crypto.name.toLowerCase().includes(cryptoState.searchTerm.toLowerCase()) ||
    crypto.symbol.toLowerCase().includes(cryptoState.searchTerm.toLowerCase())
  );

  return (
    <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-lg overflow-hidden border-2 border-red-700`}>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <h2 className="text-xl font-bold text-yellow-400">Cryptocurrency & Commodities</h2>
          <div className="flex space-x-3">
            <button
              onClick={togglePortfolioView}
              className={`flex items-center px-3 py-1 text-sm ${darkMode ? 'bg-black text-blue-400 border border-blue-400 hover:bg-blue-400 hover:text-black' : 'bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200'} rounded-md transition-colors`}
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
            className={`block w-full pl-10 pr-3 py-2 border rounded-md leading-5 ${
              darkMode ? 'bg-gray-800 border-gray-700 placeholder-gray-400 focus:ring-yellow-500 focus:border-yellow-500' :
              'bg-white border-gray-300 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
            } sm:text-sm`}
            value={cryptoState.searchTerm}
            onChange={handleCryptoSearch}
          />
        </div>
        
        {/* Crypto content */}
        {cryptoState.loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
            <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading cryptocurrency data...</p>
          </div>
        ) : cryptoState.error ? (
          <div className={`text-center py-8 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
            <FiAlertCircle className="inline-block text-2xl mb-2" />
            <p>Error loading crypto data: {cryptoState.error}</p>
            <button
              onClick={fetchCryptoData}
              className={`mt-4 inline-flex items-center px-4 py-2 rounded-md border ${
                darkMode ? 'bg-red-700 text-white border-red-800 hover:bg-red-800' :
                'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
              }`}
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
                    <thead className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider">Asset</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider">24h</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider">Market Cap</th>
                      </tr>
                    </thead>
                    <tbody className={`${darkMode ? 'bg-gray-900 divide-gray-800' : 'bg-white divide-gray-200'}`}>
                      {filteredCryptos.map((crypto) => (
                        <tr 
                          key={crypto.id} 
                          className={`${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'} cursor-pointer ${
                            cryptoState.selectedCrypto?.id === crypto.id ? (darkMode ? 'bg-gray-800' : 'bg-gray-100') : ''
                          }`}
                          onClick={() => selectCrypto(crypto)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-200'
                              }`}>
                                <span className="text-yellow-400 font-bold">{crypto.symbol}</span>
                              </div>
                              <div className="ml-4">
                                <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{crypto.name}</div>
                                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{crypto.symbol}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>${crypto.price.toLocaleString()}</div>
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
                    <h3 className={`text-lg font-bold text-yellow-400 mb-3`}>
                      {cryptoState.selectedCrypto.name} ({cryptoState.selectedCrypto.symbol})
                    </h3>
                    
                    {/* Multi-source price comparison */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className={`p-3 rounded-lg border ${
                        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>CoinGecko</div>
                        <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>${cryptoState.selectedCrypto.price?.toLocaleString()}</div>
                      </div>
                      {cryptoState.selectedCrypto.compareData && (
                        <div className={`p-3 rounded-lg border ${
                          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>CryptoCompare</div>
                          <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>${cryptoState.selectedCrypto.compareData.USD?.toLocaleString()}</div>
                        </div>
                      )}
                      {cryptoState.selectedCrypto.binanceData && (
                        <div className={`p-3 rounded-lg border ${
                          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Binance</div>
                          <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>${parseFloat(cryptoState.selectedCrypto.binanceData.price)?.toLocaleString()}</div>
                        </div>
                      )}
                      {cryptoState.selectedCrypto.cmcData && (
                        <div className={`p-3 rounded-lg border ${
                          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>CoinMarketCap</div>
                          <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>${cryptoState.selectedCrypto.cmcData.quote?.USD?.price?.toLocaleString()}</div>
                        </div>
                      )}
                    </div>
                    
                    {/* Price chart */}
                    <div className="h-64 mb-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={cryptoState.selectedCrypto.history}>
                          <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#4b5563" : "#e5e7eb"} />
                          <XAxis dataKey="date" stroke={darkMode ? "#d1d5db" : "#6b7280"} />
                          <YAxis domain={['auto', 'auto']} stroke={darkMode ? "#d1d5db" : "#6b7280"} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: darkMode ? '#1f2937' : '#ffffff', 
                              borderColor: darkMode ? '#4b5563' : '#e5e7eb',
                              color: darkMode ? '#ffffff' : '#111827'
                            }}
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
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm ${
                          darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        id="cryptoAmount"
                      />
                      <button
                        onClick={() => {
                          const amountInput = document.getElementById('cryptoAmount');
                          addToPortfolio(cryptoState.selectedCrypto, amountInput.value);
                          amountInput.value = '';
                        }}
                        className={`w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${
                          darkMode ? 'text-black bg-yellow-400 hover:bg-yellow-500' : 'text-white bg-yellow-600 hover:bg-yellow-700'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500`}
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
                <h3 className={`text-lg font-bold text-yellow-400 mb-4`}>My Crypto Portfolio</h3>
                {cryptoState.portfolio.length === 0 ? (
                  <p className={`text-center py-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Your portfolio is empty</p>
                ) : (
                  <div className="space-y-4">
                    {cryptoState.portfolio.map((item, index) => {
                      const currentValue = item.price * item.amount;
                      const purchaseValue = item.purchasePrice * item.amount;
                      const profitLoss = currentValue - purchaseValue;
                      const profitLossPercent = (profitLoss / purchaseValue) * 100;
                      
                      return (
                        <div key={index} className={`p-4 rounded-lg border ${
                          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}>
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                            <div className="mb-2 sm:mb-0">
                              <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.name} ({item.symbol})</h4>
                              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {item.amount} {item.symbol} · Purchased: {item.date}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>${currentValue.toLocaleString()}</p>
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
  );
};

export default CryptoSection;