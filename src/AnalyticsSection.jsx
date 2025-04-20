import React from 'react';
import { 
  FiPieChart,
  FiBarChart2,
  FiDollarSign
} from 'react-icons/fi';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts';

const AnalyticsSection = ({ darkMode, bankData, timeRange, categories }) => {
  const prepareChartData = () => {
    const now = new Date();
    const filteredTransactions = bankData.transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
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
          return true;
      }
      
      return transactionDate >= fromDate;
    });

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
    
    return { expenseData, monthlyData };
  };

  const { expenseData, monthlyData } = prepareChartData();

  return (
    <div>
      <h3 className={`text-lg font-bold ${darkMode ? 'text-yellow-400' : 'text-gray-800'} mb-4`}>Financial Analytics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Expense by Category Pie Chart */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-4 rounded-lg border`}>
          <h4 className={`text-md font-bold ${darkMode ? 'text-yellow-400' : 'text-gray-800'} mb-4 flex items-center`}>
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
                    backgroundColor: darkMode ? '#1f2937' : '#ffffff', 
                    borderColor: darkMode ? '#4b5563' : '#e5e7eb',
                    color: darkMode ? '#ffffff' : '#111827'
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
                  wrapperStyle={{ color: darkMode ? '#d1d5db' : '#6b7280' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trends Bar Chart */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-4 rounded-lg border`}>
          <h4 className={`text-md font-bold ${darkMode ? 'text-yellow-400' : 'text-gray-800'} mb-4 flex items-center`}>
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
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#4b5563" : "#e5e7eb"} />
                <XAxis dataKey="name" stroke={darkMode ? "#d1d5db" : "#6b7280"} />
                <YAxis stroke={darkMode ? "#d1d5db" : "#6b7280"} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#1f2937' : '#ffffff', 
                    borderColor: darkMode ? '#4b5563' : '#e5e7eb',
                    color: darkMode ? '#ffffff' : '#111827'
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
                <Legend wrapperStyle={{ color: darkMode ? '#d1d5db' : '#6b7280' }} />
                <Bar dataKey="income" fill="#4CAF50" name="Income" />
                <Bar dataKey="expenses" fill="#F44336" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg shadow`}>
        <h4 className={`text-md font-medium mb-4 ${darkMode ? 'text-yellow-400' : 'text-gray-800'}`}>Category Breakdown</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>
                <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  darkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Category
                </th>
                <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  darkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Income
                </th>
                <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  darkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Expenses
                </th>
                <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  darkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Net
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${
              darkMode ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'
            }`}>
              {categories.map((category) => {
                const catData = bankData.categories[category.value] || { income: 0, expenses: 0 };
                const net = catData.income - catData.expenses;
                return (
                  <tr key={category.value}>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      darkMode ? 'text-gray-300' : 'text-gray-900'
                    } capitalize`}>
                      {category.label}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      darkMode ? 'text-green-400' : 'text-green-600'
                    }`}>
                      {catData.income.toLocaleString('hu-HU', {
                        style: 'currency',
                        currency: 'HUF',
                        minimumFractionDigits: 0
                      })}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      darkMode ? 'text-red-400' : 'text-red-600'
                    }`}>
                      {catData.expenses.toLocaleString('hu-HU', {
                        style: 'currency',
                        currency: 'HUF',
                        minimumFractionDigits: 0
                      })}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      net >= 0 ? (darkMode ? 'text-green-400' : 'text-green-600') : (darkMode ? 'text-red-400' : 'text-red-600')
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
  );
};

export default AnalyticsSection;