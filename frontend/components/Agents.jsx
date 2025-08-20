import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Bot, 
  Code, 
  Database, 
  Cloud, 
  Search, 
  Star, 
  Play, 
  Settings, 
  Users, 
  Zap,
  FileText,
  Terminal,
  Globe,
  Shield,
  Wrench,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Award
} from 'lucide-react';

export default function Agents() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const agents = [
    {
      id: 1,
      name: 'Code Generator Pro',
      description: 'Advanced code generation and optimization assistant',
      category: 'genai',
      team: 'Gen AI Team',
      iconde,
      rating: 4.8,
      usageCount: 1250,
      capabilities: ['Python', 'JavaScript', 'React', 'Node.js', 'API Development'],
      lastUpdated: '2 days ago',
      featuredue,
    },
    {
      id: 2,
      name: 'Debug Detective',
      description: 'Intelligent debugging and error analysis specialist',
      category: 'genai',
      team: 'Gen AI Team',
      iconarch,
      rating: 4.9,
      usageCount: 890,
      capabilities: ['Error Analysis', 'Stack Trace Reading', 'Performance Issues', 'Memory Leaks'],
      lastUpdated: '1 day ago',
      featuredue,
    },
    {
      id: 3,
      name: 'Data Pipeline Wizard',
      description: 'Expert in data processing, ETL, and pipeline optimization',
      category: 'data',
      team: 'Data Team',
      icontabase,
      rating: 4.7,
      usageCount: 678,
      capabilities: ['ETL Processes', 'SQL Optimization', 'Data Modeling', 'Apache Spark'],
      lastUpdated: '3 hours ago',
      featuredlse,
    },
    {
      id: 4,
      name: 'ML Troubleshooter',
      description: 'Machine learning model debugging and optimization',
      category: 'data',
      team: 'Data Team',
      icont,
      rating: 4.6,
      usageCount: 445,
      capabilities: ['Model Debugging', 'Feature Engineering', 'Performance Tuning', 'MLOps'],
      lastUpdated: '1 week ago',
      featuredlse,
    },
    {
      id: 5,
      name: 'Cloud Architect',
      description: 'Infrastructure as Code and cloud solution design',
      category: 'cloud',
      team: 'Cloud Team',
      iconoud,
      rating: 4.9,
      usageCount: 1100,
      capabilities: ['Terraform', 'CloudFormation', 'AWS', 'Azure', 'GCP'],
      lastUpdated: '5 hours ago',
      featuredue,
    },
    {
      id: 6,
      name: 'Log Analyzer',
      description: 'Advanced log analysis and monitoring specialist',
      category: 'cloud',
      team: 'Cloud Team',
      iconleText,
      rating: 4.5,
      usageCount: 750,
      capabilities: ['Log Parsing', 'Error Detection', 'Performance Analysis', 'Alert Setup'],
      lastUpdated: '2 days ago',
      featuredlse,
    },
    {
      id: 7,
      name: 'Security Scanner',
      description: 'Security vulnerability assessment and compliance',
      category: 'cloud',
      team: 'Cloud Team',
      iconield,
      rating: 4.8,
      usageCount: 520,
      capabilities: ['Vulnerability Scanning', 'Compliance Checks', 'Security Best Practices', 'Audit Reports'],
      lastUpdated: '6 hours ago',
      featuredlse,
    },
    {
      id: 8,
      name: 'DevOps Assistant',
      description: 'CI/CD pipeline optimization and automation',
      category: 'cloud',
      team: 'Cloud Team',
      iconench,
      rating: 4.7,
      usageCount: 680,
      capabilities: ['CI/CD', 'Docker', 'Kubernetes', 'Jenkins', 'GitHub Actions'],
      lastUpdated: '4 hours ago',
      featuredlse,
    },
  ];

  const categories = [
    { id: 'all', name: 'All Agents', count: agents.length, icon: Sparkles },
    { id: 'genai', name: 'Gen AI Team', count: agents.filter(a => a.category === 'genai').length, icon: Code },
    { id: 'data', name: 'Data Team', count: agents.filter(a => a.category === 'data').length, icon: Database },
    { id: 'cloud', name: 'Cloud Team', count: agents.filter(a => a.category === 'cloud').length, icon: Cloud },
  ];

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.capabilities.some(cap => cap.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || agent.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredAgents = agents.filter(agent => agent.featured);

  const handleStartChat = (agenty) => {
    // In real implementation, this would start a chat with the specific agent
    console.log(`Starting chat with ${agent.name}`);
  };

  const renderStarRating = (ratingmber) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-muted-foreground'}`}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-2">{rating}</span>
      </div>
    );
  };

  const getTeamColor = (category) => {
    switch (category) {
      case 'genai': return 'text-blue-400';
      case 'data': return 'text-green-400';
      case 'cloud': return 'text-purple-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center border border-border shadow-sm">
                  <Bot className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <h1 className="text-3xl font-medium text-foreground">AI Agents</h1>
                  <p className="text-muted-foreground text-lg">Specialized AI assistants for your team</p>
                </div>
              </div>
            </div>
            <Button variant="outline" className="shadow-sm">
              <Settings className="w-4 h-4 mr-2" />
              Manage Agents
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search agents by name, description, or capabilities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-card border-border text-foreground placeholder-muted-foreground h-12 shadow-sm"
              />
            </div>
            <div className="flex space-x-2 overflow-x-auto">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  className="flex items-center space-x-2 whitespace-nowrap px-4"
                >
                  <category.icon className="w-4 h-4" />
                  <span>{category.name} ({category.count})</span>
                </Button>
              ))}
            </div>
          </div>

          <Tabs defaultValue="browse" className="space-y-6">
            <TabsList className="bg-card border border-border shadow-sm">
              <TabsTrigger value="browse" className="data-[state=active]:bg-background">Browse Agents</TabsTrigger>
              <TabsTrigger value="featured" className="data-[state=active]:bg-background">Featured</TabsTrigger>
              <TabsTrigger value="popular" className="data-[state=active]:bg-background">Most Popular</TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="space-y-6">
              {/* Agent Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAgents.map((agent) => (
                  <Card key={agent.id} className="bg-card border-border hover:bg-accent/30 cursor-pointer transition-all duration-200 hover:shadow-lg group">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-200">
                            <agent.icon className="w-6 h-6 text-foreground" />
                          </div>
                          <div>
                            <CardTitle className="text-foreground text-lg">{agent.name}</CardTitle>
                            <p className={`text-sm font-medium ${getTeamColor(agent.category)}`}>{agent.team}</p>
                          </div>
                        </div>
                        {agent.featured && (
                          <Badge variant="secondary" className="bg-accent border-border">
                            <Award className="w-3 h-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground leading-relaxed">{agent.description}</p>
                      
                      {/* Rating and Usage */}
                      <div className="flex items-center justify-between">
                        {renderStarRating(agent.rating)}
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{agent.usageCount.toLocaleString()} uses</span>
                        </div>
                      </div>

                      {/* Capabilities */}
                      <div className="flex flex-wrap gap-2">
                        {agent.capabilities.slice(0, 3).map((capability, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-muted/50 border-border">
                            {capability}
                          </Badge>
                        ))}
                        {agent.capabilities.length > 3 && (
                          <Badge variant="outline" className="text-xs bg-muted/50 border-border">
                            +{agent.capabilities.length - 3} more
                          </Badge>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2">
                        <p className="text-xs text-muted-foreground">Updated {agent.lastUpdated}</p>
                        <Button
                          onClick={() => handleStartChat(agent)}
                          size="sm"
                          className="shadow-sm"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Start Chat
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredAgents.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-muted rounded-3xl mx-auto mb-6 flex items-center justify-center border border-border">
                    <Bot className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-medium text-foreground mb-2">No agents found</h3>
                  <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="featured" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {featuredAgents.map((agent) => (
                  <Card key={agent.id} className="bg-card border-border hover:shadow-lg transition-all duration-200 group">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-200">
                            <agent.icon className="w-8 h-8 text-foreground" />
                          </div>
                          <div>
                            <CardTitle className="text-foreground text-xl">{agent.name}</CardTitle>
                            <p className={`text-sm font-medium ${getTeamColor(agent.category)}`}>{agent.team}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-accent border-border">
                          <Award className="w-4 h-4 mr-1" />
                          Featured
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <p className="text-muted-foreground text-lg leading-relaxed">{agent.description}</p>
                      
                      <div className="flex items-center justify-between">
                        {renderStarRating(agent.rating)}
                        <div className="text-sm text-muted-foreground flex items-center space-x-1">
                          <TrendingUp className="w-4 h-4" />
                          <span>{agent.usageCount.toLocaleString()} users</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {agent.capabilities.map((capability, index) => (
                          <Badge key={index} variant="outline" className="bg-muted/50 border-border">
                            {capability}
                          </Badge>
                        ))}
                      </div>

                      <Button
                        onClick={() => handleStartChat(agent)}
                        className="w-full h-12 shadow-sm"
                      >
                        <Play className="w-5 h-5 mr-3" />
                        Start Conversation
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="popular" className="space-y-6">
              <div className="space-y-4">
                {agents
                  .sort((a, b) => b.usageCount - a.usageCount)
                  .slice(0, 6)
                  .map((agent, index) => (
                    <Card key={agent.id} className="bg-card border-border hover:bg-accent/30 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-6">
                            <div className="text-3xl font-medium text-muted-foreground w-12 text-center">
                              #{index + 1}
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center shadow-sm">
                              <agent.icon className="w-6 h-6 text-foreground" />
                            </div>
                            <div>
                              <h3 className="text-foreground font-medium text-lg">{agent.name}</h3>
                              <p className="text-muted-foreground">{agent.description}</p>
                              <div className="flex items-center space-x-4 mt-2">
                                {renderStarRating(agent.rating)}
                                <span className={`text-sm font-medium ${getTeamColor(agent.category)}`}>{agent.team}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-6">
                            <div className="text-right">
                              <p className="text-2xl font-medium text-foreground">{agent.usageCount.toLocaleString()}</p>
                              <p className="text-muted-foreground text-sm">uses</p>
                            </div>
                            <Button
                              onClick={() => handleStartChat(agent)}
                              size="sm"
                              variant="outline"
                              className="shadow-sm"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}