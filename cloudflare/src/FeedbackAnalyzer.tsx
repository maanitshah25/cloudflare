import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, MessageSquare, AlertCircle, ThumbsUp, ThumbsDown, Filter, Search, Sparkles, Download, RefreshCw } from 'lucide-react';

const CHANNELS = ['Support Ticket', 'Discord', 'GitHub', 'Email', 'Twitter', 'Forum'];
const SENTIMENTS = ['Positive', 'Neutral', 'Negative'];
const THEMES = ['Feature Request', 'Bug Report', 'Performance', 'UX/UI', 'Documentation', 'Integration', 'Pricing', 'Other'];

const COLORS: Record<string, string> = {
  Positive: '#10b981',
  Neutral: '#6b7280',
  Negative: '#ef4444',
  'Feature Request': '#3b82f6',
  'Bug Report': '#ef4444',
  'Performance': '#f59e0b',
  'UX/UI': '#8b5cf6',
  'Documentation': '#06b6d4',
  'Integration': '#ec4899',
  'Pricing': '#10b981',
  'Other': '#6b7280'
};

interface FeedbackItem {
  id: string;
  channel: string;
  text: string;
  sentiment: string;
  theme: string;
  urgency: number;
  value: number;
  timestamp: string;
  author: string;
}

interface AIInsights {
  themes?: string[];
  urgentIssues?: string[];
  opportunities?: string[];
  recommendations?: string[];
}

interface AnthropicResponse {
  content: Array<{ text: string }>;
}

// Mock feedback data generator
const generateMockFeedback = () => {
  const templates = [
    { text: "The new dashboard is amazing! Love the clean interface and quick load times.", sentiment: "Positive", theme: "UX/UI", urgency: 2, value: 4 },
    { text: "Getting frequent timeouts when exporting large datasets. This is blocking our workflow.", sentiment: "Negative", theme: "Bug Report", urgency: 9, value: 8 },
    { text: "Would be great to have dark mode support", sentiment: "Positive", theme: "Feature Request", urgency: 3, value: 6 },
    { text: "API documentation is unclear about rate limits", sentiment: "Negative", theme: "Documentation", urgency: 5, value: 7 },
    { text: "Integration with Slack would save us hours every week", sentiment: "Positive", theme: "Integration", urgency: 6, value: 9 },
    { text: "App crashes when uploading files over 50MB", sentiment: "Negative", theme: "Bug Report", urgency: 10, value: 9 },
    { text: "The pricing seems fair for what we get", sentiment: "Positive", theme: "Pricing", urgency: 1, value: 3 },
    { text: "Search functionality could be faster", sentiment: "Neutral", theme: "Performance", urgency: 6, value: 7 },
    { text: "Love the new collaboration features!", sentiment: "Positive", theme: "Feature Request", urgency: 2, value: 5 },
    { text: "Mobile app needs significant improvements", sentiment: "Negative", theme: "UX/UI", urgency: 7, value: 8 }
  ];

  return Array.from({ length: 50 }, (_, i) => {
    const template = templates[Math.floor(Math.random() * templates.length)];
    return {
      id: `feedback-${i + 1}`,
      channel: CHANNELS[Math.floor(Math.random() * CHANNELS.length)],
      text: template.text,
      sentiment: template.sentiment,
      theme: template.theme,
      urgency: template.urgency,
      value: template.value,
      timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      author: `user${Math.floor(Math.random() * 100)}`
    };
  });
};

export default function FeedbackAnalyzer() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [filteredFeedback, setFilteredFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    channel: 'All',
    sentiment: 'All',
    theme: 'All',
    search: ''
  });
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [generatingInsights, setGeneratingInsights] = useState(false);

  useEffect(() => {
    loadFeedback();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [feedback, filters]);

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem('feedback-data');
      if (stored) {
        setFeedback(JSON.parse(stored));
      } else {
        const mock = generateMockFeedback();
        setFeedback(mock);
        localStorage.setItem('feedback-data', JSON.stringify(mock));
      }
    } catch (error) {
      const mock = generateMockFeedback();
      setFeedback(mock);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...feedback];
    
    if (filters.channel !== 'All') {
      filtered = filtered.filter(f => f.channel === filters.channel);
    }
    if (filters.sentiment !== 'All') {
      filtered = filtered.filter(f => f.sentiment === filters.sentiment);
    }
    if (filters.theme !== 'All') {
      filtered = filtered.filter(f => f.theme === filters.theme);
    }
    if (filters.search) {
      filtered = filtered.filter(f => 
        f.text.toLowerCase().includes(filters.search.toLowerCase())
      );
    }
    
    setFilteredFeedback(filtered);
  };

  const generateAIInsights = async () => {
    setGeneratingInsights(true);
    try {
      const topFeedback = filteredFeedback
        .sort((a, b) => (b.urgency + b.value) - (a.urgency + a.value))
        .slice(0, 20)
        .map(f => `[${f.channel}] ${f.text} (Urgency: ${f.urgency}, Value: ${f.value})`)
        .join('\n');

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `As a product manager, analyze this customer feedback and provide:
1. Top 3 themes/patterns
2. Most urgent issues to address
3. Highest value opportunities
4. Recommended next actions

Feedback:
${topFeedback}

Respond in JSON format with keys: themes (array), urgentIssues (array), opportunities (array), recommendations (array)`
            }
          ],
        })
      });

      const data = await response.json() as AnthropicResponse;
      const text = data.content[0].text.replace(/```json|```/g, '').trim();
      const insights = JSON.parse(text) as AIInsights;
      setAiInsights(insights);
    } catch (error) {
      console.error('Error generating insights:', error);
      setAiInsights({
        themes: ["Unable to generate insights", "Please try again"],
        urgentIssues: ["Error occurred"],
        opportunities: ["Error occurred"],
        recommendations: ["Check console for details"]
      });
    }
    setGeneratingInsights(false);
  };

  const resetData = async () => {
    const mock = generateMockFeedback();
    setFeedback(mock);
    localStorage.setItem('feedback-data', JSON.stringify(mock));
    setAiInsights(null);
  };

  // Analytics calculations
  const sentimentData = SENTIMENTS.map(s => ({
    name: s,
    count: filteredFeedback.filter(f => f.sentiment === s).length
  }));

  const channelData = CHANNELS.map(c => ({
    name: c,
    count: filteredFeedback.filter(f => f.channel === c).length
  }));

  const themeData = THEMES.map(t => ({
    name: t,
    count: filteredFeedback.filter(f => f.theme === t).length,
    avgUrgency: filteredFeedback.filter(f => f.theme === t).reduce((acc, f) => acc + f.urgency, 0) / 
                (filteredFeedback.filter(f => f.theme === t).length || 1)
  })).filter(t => t.count > 0);

  const avgSentiment = filteredFeedback.length > 0 ? 
    filteredFeedback.reduce((acc, f) => {
      if (f.sentiment === 'Positive') return acc + 1;
      if (f.sentiment === 'Negative') return acc - 1;
      return acc;
    }, 0) / filteredFeedback.length : 0;

  const avgUrgency = filteredFeedback.length > 0 ?
    filteredFeedback.reduce((acc, f) => acc + f.urgency, 0) / filteredFeedback.length : 0;

  const highPriority = filteredFeedback.filter(f => f.urgency >= 7 && f.value >= 7);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading feedback data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Feedback Analysis Dashboard</h1>
              <p className="text-gray-600 mt-1">Aggregate insights from all your feedback channels</p>
            </div>
            <button
              onClick={resetData}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reset Data
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Channel</label>
              <select
                value={filters.channel}
                onChange={(e) => setFilters({...filters, channel: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option>All</option>
                {CHANNELS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sentiment</label>
              <select
                value={filters.sentiment}
                onChange={(e) => setFilters({...filters, sentiment: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option>All</option>
                {SENTIMENTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
              <select
                value={filters.theme}
                onChange={(e) => setFilters({...filters, theme: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option>All</option>
                {THEMES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  placeholder="Search feedback..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Feedback</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{filteredFeedback.length}</p>
              </div>
              <MessageSquare className="w-10 h-10 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Sentiment</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{avgSentiment.toFixed(2)}</p>
              </div>
              {avgSentiment > 0 ? <ThumbsUp className="w-10 h-10 text-green-600" /> : <ThumbsDown className="w-10 h-10 text-red-600" />}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Urgency</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{avgUrgency.toFixed(1)}/10</p>
              </div>
              <TrendingUp className="w-10 h-10 text-orange-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{highPriority.length}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Feedback by Channel</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={channelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Sentiment Distribution</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Themes by Volume & Urgency</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={themeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="count" fill="#3b82f6" name="Count" />
                <Bar yAxisId="right" dataKey="avgUrgency" fill="#f59e0b" name="Avg Urgency" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              AI-Powered Insights
            </h2>
            <button
              onClick={generateAIInsights}
              disabled={generatingInsights}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {generatingInsights ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Insights
                </>
              )}
            </button>
          </div>

          {aiInsights ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Top Themes</h3>
                <ul className="space-y-2">
                  {aiInsights.themes?.map((theme, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-purple-600 font-semibold">{i + 1}.</span>
                      <span className="text-gray-700">{theme}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Urgent Issues</h3>
                <ul className="space-y-2">
                  {aiInsights.urgentIssues?.map((issue, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">High-Value Opportunities</h3>
                <ul className="space-y-2">
                  {aiInsights.opportunities?.map((opp, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{opp}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Recommended Actions</h3>
                <ul className="space-y-2">
                  {aiInsights.recommendations?.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-blue-600 font-semibold">{i + 1}.</span>
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Click "Generate Insights" to get AI-powered analysis of your feedback
            </div>
          )}
        </div>

        {/* High Priority Items */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">High Priority Feedback (Urgency ≥7, Value ≥7)</h2>
          <div className="space-y-3">
            {highPriority.length > 0 ? (
              highPriority.map(f => (
                <div key={f.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">{f.channel}</span>
                        <span className={`px-2 py-1 text-xs rounded text-white`} style={{backgroundColor: COLORS[f.sentiment]}}>{f.sentiment}</span>
                        <span className={`px-2 py-1 text-xs rounded text-white`} style={{backgroundColor: COLORS[f.theme]}}>{f.theme}</span>
                      </div>
                      <p className="text-gray-900 mb-2">{f.text}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Urgency: <strong className="text-red-600">{f.urgency}/10</strong></span>
                        <span>Value: <strong className="text-green-600">{f.value}/10</strong></span>
                        <span>{new Date(f.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No high priority items match current filters</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}