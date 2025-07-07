import { NextRequest, NextResponse } from 'next/server';
import { getCostReport, alertIfHighCosts } from '@/lib/claude-optimized';

export async function GET(request: NextRequest) {
  try {
    const report = getCostReport();
    
    // Calculate some additional metrics
    const hoursActive = Math.max(1, Math.ceil(Date.now() / (1000 * 60 * 60)) % 24);
    const costPerHour = report.estimatedTotalCost / hoursActive;
    const messagesPerCall = report.totalCalls > 0 ? (report.totalInputTokens + report.totalOutputTokens) / report.totalCalls / 100 : 0; // Rough estimate
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      costs: {
        totalCalls: report.totalCalls,
        totalInputTokens: report.totalInputTokens,
        totalOutputTokens: report.totalOutputTokens,
        estimatedTotalCost: Number(report.estimatedTotalCost.toFixed(6)),
        averageCostPerCall: Number(report.averageCostPerCall.toFixed(6)),
        last24HoursCalls: report.last24Hours,
        costPerHour: Number(costPerHour.toFixed(6)),
        estimatedMessagesPerCall: Number(messagesPerCall.toFixed(1))
      },
      targetMetrics: {
        targetCostPerConversation: 0.02,
        targetCostPerMessage: 0.005,
        currentPerformance: {
          withinTarget: report.averageCostPerCall <= 0.005,
          percentOfTarget: Number(((report.averageCostPerCall / 0.005) * 100).toFixed(1))
        }
      },
      recommendations: generateCostRecommendations(report)
    });
  } catch (error) {
    console.error('Cost monitoring error:', error);
    return NextResponse.json({
      error: 'Failed to get cost report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Trigger cost alerts
    alertIfHighCosts();
    
    const report = getCostReport();
    
    return NextResponse.json({
      success: true,
      message: 'Cost alert check completed',
      currentCosts: {
        totalCost: report.estimatedTotalCost,
        averagePerCall: report.averageCostPerCall,
        totalCalls: report.totalCalls
      }
    });
  } catch (error) {
    console.error('Cost alert error:', error);
    return NextResponse.json({
      error: 'Failed to check cost alerts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateCostRecommendations(report: any): string[] {
  const recommendations = [];
  
  if (report.averageCostPerCall > 0.01) {
    recommendations.push('🚨 HIGH COST: Average cost per call exceeds $0.01. Consider reducing conversation history or system prompt size.');
  }
  
  if (report.totalInputTokens / Math.max(1, report.totalCalls) > 3000) {
    recommendations.push('📊 LARGE PROMPTS: Input tokens per call are high. Review system prompt and conversation history limits.');
  }
  
  if (report.totalOutputTokens / Math.max(1, report.totalCalls) > 500) {
    recommendations.push('📝 LONG RESPONSES: Output tokens per call are high. Consider reducing max_tokens parameter.');
  }
  
  if (report.last24Hours > 100) {
    recommendations.push('🔥 HIGH VOLUME: Over 100 calls in 24 hours. Monitor for unusual activity or loops.');
  }
  
  if (report.estimatedTotalCost > 5) {
    recommendations.push('💰 BUDGET ALERT: Total costs exceed $5. Consider implementing rate limiting.');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ Costs are within normal ranges. Current optimization is working well.');
  }
  
  return recommendations;
}