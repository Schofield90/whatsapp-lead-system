'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle, Zap, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface CostReport {
  success: boolean;
  timestamp: string;
  costs: {
    totalCalls: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    estimatedTotalCost: number;
    averageCostPerCall: number;
    last24HoursCalls: number;
    costPerHour: number;
    estimatedMessagesPerCall: number;
  };
  targetMetrics: {
    targetCostPerConversation: number;
    targetCostPerMessage: number;
    currentPerformance: {
      withinTarget: boolean;
      percentOfTarget: number;
    };
  };
  recommendations: string[];
}

export default function CostMonitorPage() {
  const [costReport, setCostReport] = useState<CostReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchCostReport = async () => {
    try {
      const response = await fetch('/api/cost-monitor');
      const data = await response.json();
      
      if (data.success) {
        setCostReport(data);
        setLastUpdated(new Date());
      } else {
        toast.error('Failed to fetch cost report');
      }
    } catch (error) {
      console.error('Error fetching cost report:', error);
      toast.error('Error loading cost data');
    } finally {
      setLoading(false);
    }
  };

  const triggerCostAlert = async () => {
    try {
      const response = await fetch('/api/cost-monitor', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        toast.success('Cost alert check completed');
        fetchCostReport(); // Refresh data
      } else {
        toast.error('Failed to trigger cost alert');
      }
    } catch (error) {
      console.error('Error triggering cost alert:', error);
      toast.error('Error checking cost alerts');
    }
  };

  useEffect(() => {
    fetchCostReport();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchCostReport, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Cost Monitor</h1>
        </div>
        <div className="grid gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">Loading cost data...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!costReport) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Cost Monitor</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              Failed to load cost data. Please try again.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { costs, targetMetrics, recommendations } = costReport;
  const isPerformingWell = targetMetrics.currentPerformance.withinTarget;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cost Monitor</h1>
          <p className="text-muted-foreground">
            Track Claude API costs and optimize spending
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchCostReport}>
            Refresh
          </Button>
          <Button onClick={triggerCostAlert}>
            Check Alerts
          </Button>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${costs.estimatedTotalCost.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">
              {costs.totalCalls} API calls made
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Per Call</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${costs.averageCostPerCall.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">
              Target: ${targetMetrics.targetCostPerMessage.toFixed(3)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">24h Activity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{costs.last24HoursCalls}</div>
            <p className="text-xs text-muted-foreground">
              ${costs.costPerHour.toFixed(4)}/hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            {isPerformingWell ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {targetMetrics.currentPerformance.percentOfTarget}%
            </div>
            <p className="text-xs text-muted-foreground">
              {isPerformingWell ? 'Within target' : 'Above target'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            Performance Status
            <Badge 
              variant={isPerformingWell ? 'default' : 'destructive'} 
              className="ml-2"
            >
              {isPerformingWell ? 'Good' : 'Needs Attention'}
            </Badge>
          </CardTitle>
          <CardDescription>
            Current cost efficiency compared to targets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-medium mb-2">Cost Targets</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Target per conversation:</span>
                  <span className="font-mono">${targetMetrics.targetCostPerConversation.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Target per message:</span>
                  <span className="font-mono">${targetMetrics.targetCostPerMessage.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current average:</span>
                  <span className={`font-mono ${isPerformingWell ? 'text-green-600' : 'text-red-600'}`}>
                    ${costs.averageCostPerCall.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Token Usage</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total input tokens:</span>
                  <span className="font-mono">{costs.totalInputTokens.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total output tokens:</span>
                  <span className="font-mono">{costs.totalOutputTokens.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg tokens per call:</span>
                  <span className="font-mono">
                    {Math.round((costs.totalInputTokens + costs.totalOutputTokens) / Math.max(1, costs.totalCalls))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="mr-2 h-5 w-5" />
            Cost Optimization Recommendations
          </CardTitle>
          <CardDescription>
            Actionable steps to reduce API costs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations.map((recommendation, index) => {
              const isAlert = recommendation.includes('🚨') || recommendation.includes('💰');
              const isWarning = recommendation.includes('📊') || recommendation.includes('📝') || recommendation.includes('🔥');
              
              return (
                <div key={index} className={`p-3 rounded border text-sm ${
                  isAlert ? 'border-red-200 bg-red-50 text-red-800' : 
                  isWarning ? 'border-yellow-200 bg-yellow-50 text-yellow-800' : 
                  'border-green-200 bg-green-50 text-green-800'
                }`}>
                  {recommendation}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Details</CardTitle>
          <CardDescription>
            Detailed cost breakdown and system information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-medium mb-2">Cost Breakdown</h3>
              <div className="space-y-1 text-sm font-mono">
                <div>Input cost: ${((costs.totalInputTokens / 1000000) * 0.25).toFixed(6)}</div>
                <div>Output cost: ${((costs.totalOutputTokens / 1000000) * 1.25).toFixed(6)}</div>
                <div className="pt-1 border-t">
                  Total: ${costs.estimatedTotalCost.toFixed(6)}
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">System Info</h3>
              <div className="space-y-1 text-sm">
                <div>Model: claude-3-haiku-20240307</div>
                <div>Max tokens: 300</div>
                <div>Conversation limit: 10 messages</div>
                <div>Last updated: {lastUpdated?.toLocaleTimeString()}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}