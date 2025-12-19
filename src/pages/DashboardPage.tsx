import { useUser } from '@clerk/clerk-react';
import { useDataList } from '@/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  const { user } = useUser();
  const { data: dataList, isLoading, error } = useDataList({ page: 1, pageSize: 10 });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <Card className="mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2"></div>
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome back, {user?.firstName || 'User'}!
                </h1>
                <p className="text-gray-600 text-lg">
                  Here's what's happening with your account today.
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-3xl">👋</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Items"
            value={dataList?.total || 0}
            icon="📊"
            color="from-blue-500 to-blue-600"
            change="+12%"
            changeType="positive"
          />
          <StatCard
            title="Active Projects"
            value="12"
            icon="🚀"
            color="from-green-500 to-emerald-600"
            change="+8%"
            changeType="positive"
          />
          <StatCard
            title="Pending Tasks"
            value="5"
            icon="⏰"
            color="from-yellow-500 to-orange-600"
            change="-2%"
            changeType="negative"
          />
          <StatCard
            title="Revenue"
            value="$45.2K"
            icon="💰"
            color="from-purple-500 to-pink-600"
            change="+23%"
            changeType="positive"
          />
        </div>

        {/* Data List Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Recent Activity</CardTitle>
                <CardDescription>
                  Latest updates from your data sources
                </CardDescription>
              </div>
              <Badge className="cursor-pointer">
                View All
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            {isLoading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="text-gray-600 mt-2">Loading data...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <div className="text-red-500 mb-2">❌</div>
                <p className="text-gray-700 font-medium">Failed to load data</p>
                <p className="text-sm text-gray-500 mt-1">
                  Make sure your Python backend is running on http://localhost:8000
                </p>
              </div>
            )}

            {!isLoading && !error && dataList?.items && (
              <>
                {dataList.items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No data available yet</p>
                    <p className="text-sm mt-1">Start by creating some items in your backend</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dataList.items.map((item) => (
                      <DataItemCard key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* API Info Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-100">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-xl">
              🔗
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                API Integration Status
              </h3>
              <p className="text-gray-700 mb-4">
                Your application is securely connected to enterprise-grade APIs with automatic authentication.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">JWT Token Authentication</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">React Query Caching</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Type-Safe API Client</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Error Handling</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
  change,
  changeType,
}: {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
            {change && (
              <p className={`text-sm font-medium mt-1 ${
                changeType === 'positive' ? 'text-green-600' :
                changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {change} from last month
              </p>
            )}
          </div>
          <div className={`w-14 h-14 bg-gradient-to-r ${color} rounded-xl flex items-center justify-center text-2xl shadow-lg`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DataItemCard({ item }: { item: any }) {
  return (
    <Card className="hover:shadow-md transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
            </div>
            <p className="text-gray-600 mb-3 leading-relaxed">{item.description}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center space-x-1">
                <span>📅</span>
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              </span>
              <span className="flex items-center space-x-1">
                <span>🔄</span>
                <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
              </span>
            </div>
          </div>
          <Badge variant="outline" className="ml-6 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all duration-200">
            View Details
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
