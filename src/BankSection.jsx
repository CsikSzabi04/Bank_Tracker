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
  FiLogIn
} from 'react-icons/fi';
import AnalyticsSection from './AnalyticsSection';

const BankSection = ({ darkMode, activeTab, setActiveTab, isConnected }) => {
  const [bankData, setBankData] = useState({
    balance: 0,
    income: 0,
    expenses: 0,
    transactions: [],
    categories: {}
  });

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [transactionType, setTransactionType] = useState('income');
  const [category, setCategory] = useState('other');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRange, setTimeRange] = useState('month');

  const categories = [
    { value: 'salary', label: 'Salary' },
    { value: 'housing', label: 'Housing' },
    { value: 'food', label: 'Food' },
    { value: 'transport', label: 'Transport' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    const savedData = localStorage.getItem('bankData');
    if (savedData) {
      setBankData(JSON.parse(savedData));
    } else {
      const mockTransactions = generateMockTransactions();
      processTransactions(mockTransactions);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('bankData', JSON.stringify(bankData));
  }, [bankData]);

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

  const processTransactions = (transactions) => {
    let balance = 0;
    let income = 0;
    let expenses = 0;
    const categoriesData = {};
    
    categories.forEach(cat => {
      categoriesData[cat.value] = { income: 0, expenses: 0 };
    });

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
      default:
        return bankData.transactions;
    }
    
    return bankData.transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= fromDate;
    });
  };

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
      
      setAmount('');
      setDescription('');
      setIsSubmitting(false);
    }, 500);
  };

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

  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      localStorage.removeItem('bankData');
      setBankData({
        balance: 0,
        income: 0,
        expenses: 0,
        transactions: [],
        categories: {}
      });
    }
  };

  const syncWithBank = () => {
    console.log("Sync button clicked but function is disabled");
  };

  const connectToOTP = () => {
    console.log("Connect to OTP Bank clicked but function is disabled");
  };

  const TransactionsTab = ({ darkMode, bankData, timeRange, setTimeRange, deleteTransaction, clearAllData }) => {
    const filteredTransactions = filterTransactionsByTime();
    
    return (
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-3 sm:space-y-0 mt-5">
          <h3 className={`text-lg font-bold ${darkMode ? 'text-yellow-400' : 'text-gray-800'}`}>Recent Transactions</h3>
          <div className="flex items-center space-x-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className={`block w-full pl-3 pr-10 py-2 text-base border focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm rounded-md ${
                darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="week">Last Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="all">All Time</option>
            </select>
            <button
              onClick={clearAllData}
              className={`flex items-center px-3 py-2 border text-sm font-medium rounded-md ${
                darkMode ? 'border-red-500 text-red-400 bg-black hover:bg-red-900 hover:text-white' :
                'border-red-400 text-red-600 bg-white hover:bg-red-50'
              } transition-colors`}
            >
              <FiTrash2 className="mr-1" /> Clear
            </button>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            No transactions found
          </div>
        ) : (
          <div className={`overflow-hidden shadow ring-1 ${
            darkMode ? 'ring-black ring-opacity-5' : 'ring-gray-300'
          } rounded-lg`}>
            <table className="min-w-full divide-y divide-gray-700">
              <thead className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
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
              <tbody className={`divide-y ${darkMode ? 'divide-gray-800 bg-gray-900' : 'divide-gray-200 bg-white'}`}>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className={`${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}>
                    <td className={`whitespace-nowrap py-3 pl-4 pr-3 text-sm font-medium sm:pl-6 ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {transaction.description}
                    </td>
                    <td className={`whitespace-nowrap px-3 py-3 text-sm capitalize ${
                      darkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      {transaction.category}
                    </td>
                    <td className={`whitespace-nowrap px-3 py-3 text-sm ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
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
                        className={darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-800'}
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
    );
  };

  const AddTransactionTab = ({ 
    darkMode,
    transactionType,
    setTransactionType,
    amount,
    setAmount,
    description,
    setDescription,
    category,
    setCategory,
    isSubmitting,
    categories,
    handleTransaction
  }) => {
    return (
      <div>
        <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Add New Transaction</h3>
        <form onSubmit={handleTransaction}>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="transactionType" className={`block text-sm font-medium ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Type
              </label>
              <select
                id="transactionType"
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value)}
                className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm rounded-md ${
                  darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div>
              <label htmlFor="amount" className={`block text-sm font-medium ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Amount (HUF)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Ft</span>
                </div>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`focus:ring-yellow-500 focus:border-yellow-500 block w-full pl-12 sm:text-sm border rounded-md ${
                    darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="0"
                  min="1"
                  step="1"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className={`block text-sm font-medium ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Description
              </label>
              <input
                type="text"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`mt-1 focus:ring-yellow-500 focus:border-yellow-500 block w-full shadow-sm sm:text-sm border rounded-md ${
                  darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
                required
              />
            </div>

            <div>
              <label htmlFor="category" className={`block text-sm font-medium ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm rounded-md ${
                  darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
                required
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end ">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md  ${
                  darkMode ? 'text-black bg-yellow-400 hover:bg-yellow-500' : 'text-white bg-yellow-600 hover:bg-yellow-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 ${
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
    );
  };

  return (
    <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-lg overflow-hidden border-2 border-red-700`}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        {/* Balance Card */}
        <div className={`rounded-lg p-4 transition-all hover:shadow-lg border ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center">
            <div className={`p-2 rounded-full ${darkMode ? 'bg-black text-yellow-400 border-yellow-400' : 'bg-yellow-100 text-yellow-600 border-yellow-300'} border`}>
              <FiDollarSign className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <h3 className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Balance</h3>
              <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
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
        <div className={`rounded-lg p-4 transition-all hover:shadow-lg border ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center">
            <div className={`p-2 rounded-full ${darkMode ? 'bg-black text-green-400 border-green-400' : 'bg-green-100 text-green-600 border-green-300'} border`}>
              <FiArrowUp className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <h3 className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Income</h3>
              <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
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
        <div className={`rounded-lg p-4 transition-all hover:shadow-lg border ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center">
            <div className={`p-2 rounded-full ${darkMode ? 'bg-black text-red-400 border-red-400' : 'bg-red-100 text-red-600 border-red-300'} border`}>
              <FiArrowDown className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <h3 className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Expenses</h3>
              <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
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
      <div className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm mr-5 ml-5 ${
              activeTab === 'transactions'
                ? 'border-yellow-400 text-yellow-400'
                : `border-transparent ${darkMode ? 'text-gray-400 hover:text-gray-300 hover:border-gray-500' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`
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
                : `border-transparent ${darkMode ? 'text-gray-400 hover:text-gray-300 hover:border-gray-500' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`
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
                : `border-transparent ${darkMode ? 'text-gray-400 hover:text-gray-300 hover:border-gray-500' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`
            }`}
          >
            <FiPlus className="inline mr-2" />
            Add Transaction
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'transactions' && (
          <TransactionsTab 
            darkMode={darkMode}
            bankData={bankData}
            timeRange={timeRange}
            setTimeRange={setTimeRange}
            deleteTransaction={deleteTransaction}
            clearAllData={clearAllData}
          />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsSection 
            darkMode={darkMode}
            bankData={bankData}
            timeRange={timeRange}
            categories={categories}
          />
        )}
        {activeTab === 'add' && (
          <AddTransactionTab 
            darkMode={darkMode}
            transactionType={transactionType}
            setTransactionType={setTransactionType}
            amount={amount}
            setAmount={setAmount}
            description={description}
            setDescription={setDescription}
            category={category}
            setCategory={setCategory}
            isSubmitting={isSubmitting}
            categories={categories}
            handleTransaction={handleTransaction}
          />
        )}
      </div>
    </div>
  );
};

export default BankSection;