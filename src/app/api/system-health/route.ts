import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Import safeguards
    const { circuitBreakers } = await import('@/lib/circuit-breaker');
    const { rateLimiters } = await import('@/lib/rate-limiter');
    const { safeDatabase } = await import('@/lib/safe-database');

    // Collect all system health data
    const healthData = {
      timestamp: new Date().toISOString(),
      
      // Circuit breaker statuses
      circuitBreakers: {
        supabase: circuitBreakers.supabase.getStats(),
        claude: circuitBreakers.claude.getStats(),
        twilio: circuitBreakers.twilio.getStats(),
        knowledgeBase: circuitBreakers.knowledgeBase.getStats()
      },
      
      // Rate limiter statuses
      rateLimiters: {
        webhook: rateLimiters.webhook.getStats(),
        api: rateLimiters.api.getStats(),
        claude: rateLimiters.claude.getStats(),
        knowledgeBase: rateLimiters.knowledgeBase.getStats()
      },
      
      // Database health
      database: {
        knowledgeBaseExists: await safeDatabase.tableExists('knowledge_base'),
        trainingDataExists: await safeDatabase.tableExists('training_data'),
        messagesExists: await safeDatabase.tableExists('messages')
      },
      
      // System status
      status: 'healthy'
    };

    // Check for issues
    let issues = [];
    
    // Check circuit breakers
    for (const [name, stats] of Object.entries(healthData.circuitBreakers)) {
      if (stats.state === 'OPEN') {
        issues.push(`Circuit breaker ${name} is OPEN`);
        healthData.status = 'degraded';
      } else if (stats.state === 'HALF_OPEN') {
        issues.push(`Circuit breaker ${name} is HALF_OPEN (recovering)`);
        if (healthData.status === 'healthy') healthData.status = 'recovering';
      }
    }
    
    // Check rate limiters for high usage
    for (const [name, stats] of Object.entries(healthData.rateLimiters)) {
      if (stats.activeKeys > 50) {
        issues.push(`Rate limiter ${name} has high usage (${stats.activeKeys} active keys)`);
        if (healthData.status === 'healthy') healthData.status = 'warning';
      }
    }
    
    // Check database tables
    if (!healthData.database.knowledgeBaseExists) {
      issues.push('Knowledge base table does not exist');
      if (healthData.status === 'healthy') healthData.status = 'warning';
    }

    return NextResponse.json({
      ...healthData,
      issues,
      issueCount: issues.length
    });

  } catch (error) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'critical',
      error: error instanceof Error ? error.message : 'Unknown error',
      issues: ['System health check failed']
    }, { status: 500 });
  }
}

// Emergency controls
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    const { circuitBreakers } = await import('@/lib/circuit-breaker');
    const { rateLimiters } = await import('@/lib/rate-limiter');

    switch (action) {
      case 'reset-circuit-breakers':
        Object.values(circuitBreakers).forEach(cb => cb.reset());
        return NextResponse.json({ message: 'All circuit breakers reset' });
        
      case 'reset-rate-limiters':
        Object.values(rateLimiters).forEach(rl => rl.reset());
        return NextResponse.json({ message: 'All rate limiters reset' });
        
      case 'emergency-reset':
        Object.values(circuitBreakers).forEach(cb => cb.reset());
        Object.values(rateLimiters).forEach(rl => rl.reset());
        return NextResponse.json({ message: 'Emergency reset completed - all safeguards reset' });
        
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}