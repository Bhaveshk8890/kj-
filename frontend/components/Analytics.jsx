import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Activity, 
  DollarSign, 
  MessageSquare, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Clock, 
  Shield,
  Download,
  Calendar,
  Sparkles,
  Target,
  Zap
} from 'lucide-react';


export default function Analytics({ user }) {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  // Define chart colors that work well in dark mode
  const chartColors = {
    primary: '#7C3AED', // Purple
    secondary: '#06B6D4', // Cyan  
    success: '#10B981', // Green
    warning: '#F59E0B', // Amber
    danger: '#EF4444', // Red
    axis: '#9CA3AF', // Gray-400 - visible in dark mode
    grid: '#374151', // Gray-700 - subtle grid lines
    text: '#D1D5DB' // Gray-300 - readable text
  };

  // Mock data - replace with actual API calls
  const usageData = [
    { date: '2024-01-01', queries: 25, tokens: 12500, cost: 0.75 },
    { date: '2024-01-02', queries: 32, tokens: 16000, cost: 0.96 },
    { date: '2024-01-03', queries: 28, tokens: 14000, cost: 0.84 },
    { date: '2024-01-04', queries: 45, tokens: 22500, cost: 1.35 },
    { date: '2024-01-05', queries: 38, tokens: 19000, cost: 1.14 },
    { date: '2024-01-06', queries: 41, tokens: 20500, cost: 1.23 },
    { date: '2024-01-07', queries: 35, tokens: 17500, cost: 1.05 },
  ];

  const categoryData = [
    { name: 'Code Generation', value: 35, color: '#7C3AED' },
    { name: 'Debugging', value: 25, color: '#06B6D4' },
    { name: 'Troubleshooting', value: 20, color: '#10B981' },
    { name: 'Research', value: 15, color: '#F59E0B' },
    { name: 'Other', value: 5, color: '#EF4444' },
  ];

  const tokenBreakdown = {
    input: 85420,
    output: 124680,
    total: 210100
  };

  const sensitiveDataAlerts = [
    { type: 'Password', count: 2, severity: 'high', lastDetected: '2 hours ago' },
    { type: 'API Key', count: 1, severity: 'critical', lastDetected: '1 day ago' },
    { type: 'Email Address', count: 5, severity: 'medium', lastDetected: '3 hours ago' },
    { type: 'Credit Card', count: 0, severity: 'critical', lastDetected: 'Never' },
  ];

  const kpiCards = [
    {
      title: 'Daily Queries',
      value: '37',
      change: '+12%',
      icon: MessageSquare,
      trend: 'up',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Total Tokens',
      value: '210K',
      change: '+8%',
      icon: Activity,
      trend: 'up',
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Estimated Cost',
      value: '$12.60',
      change: '+5%',
      icon: DollarSign,
      trend: 'up',
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Security Alerts',
      value: '8',
      change: '-2',
      icon: AlertTriangle,
      trend: 'down',
      color: 'from-orange-500 to-red-500',
    },
  ];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
  };

  // Custom tooltip component for better styling
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-foreground font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm text-foreground" style={{ color: entry.color }}>
              {entry.dataKey}: {typeof entry.value === 'number' && entry.dataKey === 'cost' 
                ? `$${entry.value.toFixed(2)}` 
                : entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-foreground font-medium">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">{payload[0].value}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Fixed Header Section */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border ml-72">
        <div className="p-6">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-medium text-foreground">Usage Insights</h1>
                    <p className="text-muted-foreground text-lg">Track your AI assistant usage and performance</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {['24h', '7d', '30d', '90d'].map((period) => (
                    <Button
                      key={period}
                      onClick={() => setSelectedPeriod(period)}
                      variant={selectedPeriod === period ? 'default' : 'outline'}
                      size="sm"
                      className="px-4"
                    >
                      {period}
                    </Button>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="shadow-sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {kpiCards.map((kpi, index) => (
                <Card key={index} className="bg-card border-border shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden group">
                  <CardContent className="p-6 relative">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground font-medium">{kpi.title}</p>
                        <p className="text-3xl font-medium text-foreground">{kpi.value}</p>
                        <div className="flex items-center space-x-1">
                          <TrendingUp className={`w-4 h-4 ${kpi.trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
                          <p className={`text-sm font-medium ${kpi.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                            {kpi.change} from last period
                          </p>
                        </div>
                      </div>
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${kpi.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                        <kpi.icon className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <div className={`absolute inset-0 bg-gradient-to-br ${kpi.color} opacity-5 group-hover:opacity-10 transition-opacity duration-200`}></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto pt-[280px]">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <Tabs defaultValue="usage" className="space-y-6">
              <TabsList className="bg-card border border-border shadow-sm">
                <TabsTrigger value="usage" className="data-[state=active]:bg-background">Usage Analytics</TabsTrigger>
                <TabsTrigger value="categories" className="data-[state=active]:bg-background">Query Categories</TabsTrigger>
                <TabsTrigger value="tokens" className="data-[state=active]:bg-background">Token Usage</TabsTrigger>
                <TabsTrigger value="security" className="data-[state=active]:bg-background">Security Insights</TabsTrigger>
              </TabsList>

              <TabsContent value="usage" className="space-y-6">
                {/* Usage Chart */}
                <Card className="bg-card border-border shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-foreground flex items-center space-x-2">
                      <Target className="w-5 h-5 text-blue-500" />
                      <span>Daily Usage Trends</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={usageData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                        <XAxis 
                          dataKey="date" 
                          stroke={chartColors.axis}
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: chartColors.text }}
                        />
                        <YAxis 
                          stroke={chartColors.axis}
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: chartColors.text }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line 
                          type="monotone" 
                          dataKey="queries" 
                          stroke={chartColors.primary}
                          strokeWidth={3}
                          dot={{ fill: chartColors.primary, strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: chartColors.primary, strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Cost Analysis */}
                <Card className="bg-card border-border shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-foreground flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-green-500" />
                      <span>Cost Analysis</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={usageData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                        <XAxis 
                          dataKey="date" 
                          stroke={chartColors.axis}
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: chartColors.text }}
                        />
                        <YAxis 
                          stroke={chartColors.axis}
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: chartColors.text }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="cost" fill={chartColors.success} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="categories" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Category Pie Chart */}
                  <Card className="bg-card border-border shadow-lg">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-foreground flex items-center space-x-2">
                        <Zap className="w-5 h-5 text-purple-500" />
                        <span>Query Categories</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelStyle={{ fill: chartColors.text, fontSize: '12px' }}
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomPieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Category List */}
                  <Card className="bg-card border-border shadow-lg">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-foreground">Category Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {categoryData.map((category, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
                            <div className="flex items-center space-x-3">
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: category.color }}
                              ></div>
                              <span className="text-foreground font-medium">{category.name}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="text-muted-foreground font-medium">{category.value}%</span>
                              <Progress value={category.value} className="w-20" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="tokens" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Token Breakdown */}
                  <Card className="bg-card border-border shadow-lg">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-foreground">Input Tokens</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-medium text-blue-500 mb-3">
                        {tokenBreakdown.input.toLocaleString()}
                      </div>
                      <p className="text-muted-foreground">Tokens sent to AI</p>
                      <div className="mt-4 w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(tokenBreakdown.input / tokenBreakdown.total) * 100}%` }}
                        ></div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border shadow-lg">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-foreground">Output Tokens</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-medium text-green-500 mb-3">
                        {tokenBreakdown.output.toLocaleString()}
                      </div>
                      <p className="text-muted-foreground">Tokens received from AI</p>
                      <div className="mt-4 w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(tokenBreakdown.output / tokenBreakdown.total) * 100}%` }}
                        ></div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border shadow-lg">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-foreground">Total Tokens</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-medium text-purple-500 mb-3">
                        {tokenBreakdown.total.toLocaleString()}
                      </div>
                      <p className="text-muted-foreground">Combined usage</p>
                      <div className="mt-4 w-full bg-muted rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full w-full transition-all duration-500"></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Token Usage Chart */}
                <Card className="bg-card border-border shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-foreground flex items-center space-x-2">
                      <Activity className="w-5 h-5 text-purple-500" />
                      <span>Token Usage Over Time</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={usageData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                        <XAxis 
                          dataKey="date" 
                          stroke={chartColors.axis}
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: chartColors.text }}
                        />
                        <YAxis 
                          stroke={chartColors.axis}
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: chartColors.text }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="tokens" fill={chartColors.warning} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-6">
                {/* Security Alerts */}
                <Card className="bg-card border-border shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-foreground flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-red-500" />
                      <span>Sensitive Data Detection</span>
                    </CardTitle>
                    <p className="text-muted-foreground text-sm">
                      Monitor and track potential sensitive information exposure
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {sensitiveDataAlerts.map((alert, index) => (
                        <div key={index} className="flex items-center justify-between p-6 bg-muted/30 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center space-x-4">
                            <div className={`w-3 h-3 rounded-full ${
                              alert.severity === 'critical' ? 'bg-red-500' :
                              alert.severity === 'high' ? 'bg-orange-500' :
                              alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}></div>
                            <div>
                              <p className="text-foreground font-medium">{alert.type}</p>
                              <p className="text-muted-foreground text-sm">
                                {alert.count} detection{alert.count !== 1 ? 's' : ''} • Last: {alert.lastDetected}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge className={`${getSeverityColor(alert.severity)} border`}>
                              {alert.severity}
                            </Badge>
                            <span className="text-2xl font-medium text-foreground">{alert.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Security Recommendations */}
                <Card className="bg-card border-border shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-foreground">Security Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                        <p className="text-yellow-400 text-sm">
                          <strong>Warning:</strong> API keys detected in recent conversations. Avoid sharing sensitive credentials.
                        </p>
                      </div>
                      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <p className="text-blue-400 text-sm">
                          <strong>Tip:</strong> Use environment variables or placeholders when discussing configuration.
                        </p>
                      </div>
                      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                        <p className="text-green-400 text-sm">
                          <strong>Good:</strong> No credit card information detected in your conversations.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}