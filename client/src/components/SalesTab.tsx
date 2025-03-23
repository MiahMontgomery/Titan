import React from 'react';

export function SalesTab() {
  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Marketing Section */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-5">
          <h3 className="text-lg font-medium mb-4">Marketing Performance</h3>
          
          {/* Platform breakdown */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Google</span>
                <span>350 visits</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '70%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Facebook</span>
                <span>120 visits</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '35%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Twitter</span>
                <span>90 visits</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Instagram</span>
                <span>78 visits</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '20%' }}></div>
              </div>
            </div>
          </div>
          
          {/* Engagement stats */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-gray-900 rounded p-4">
              <div className="text-gray-400 text-sm">Conversion Rate</div>
              <div className="text-2xl font-semibold mt-1">4.2%</div>
            </div>
            <div className="bg-gray-900 rounded p-4">
              <div className="text-gray-400 text-sm">Bounce Rate</div>
              <div className="text-2xl font-semibold mt-1">32%</div>
            </div>
            <div className="bg-gray-900 rounded p-4">
              <div className="text-gray-400 text-sm">Avg. Session</div>
              <div className="text-2xl font-semibold mt-1">3:42</div>
            </div>
            <div className="bg-gray-900 rounded p-4">
              <div className="text-gray-400 text-sm">Active Users</div>
              <div className="text-2xl font-semibold mt-1">217</div>
            </div>
          </div>
        </div>
        
        {/* Revenue Section */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-5">
          <h3 className="text-lg font-medium mb-4">Revenue & Sales</h3>
          
          {/* Chart placeholder */}
          <div className="bg-gray-900 rounded-lg p-4 h-56 flex items-center justify-center mb-4">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
              </svg>
              <p className="mt-2 text-gray-400">Revenue chart will appear here</p>
            </div>
          </div>
          
          {/* Revenue stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900 rounded p-4">
              <div className="text-gray-400 text-sm">Monthly Revenue</div>
              <div className="text-2xl font-semibold mt-1">$4,250</div>
              <div className="text-xs text-green-400 mt-1">↑ 12% vs last month</div>
            </div>
            <div className="bg-gray-900 rounded p-4">
              <div className="text-gray-400 text-sm">Weekly Sales</div>
              <div className="text-2xl font-semibold mt-1">127</div>
              <div className="text-xs text-red-400 mt-1">↓ 3% vs last week</div>
            </div>
            <div className="bg-gray-900 rounded p-4">
              <div className="text-gray-400 text-sm">Avg. Order Value</div>
              <div className="text-2xl font-semibold mt-1">$65.80</div>
              <div className="text-xs text-green-400 mt-1">↑ 5% vs last month</div>
            </div>
            <div className="bg-gray-900 rounded p-4">
              <div className="text-gray-400 text-sm">Refund Rate</div>
              <div className="text-2xl font-semibold mt-1">2.3%</div>
              <div className="text-xs text-green-400 mt-1">↓ 0.5% vs last month</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Note about placeholder data */}
      <div className="max-w-5xl mx-auto mt-6 bg-gray-900 p-4 rounded border border-gray-800">
        <div className="flex items-start">
          <svg className="h-5 w-5 text-blue-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <p className="text-sm text-gray-400">
              This tab contains placeholder UI for future PayPal and marketing integration. 
              Once the system is connected to actual data sources post-download, this section 
              will display real sales and marketing metrics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
