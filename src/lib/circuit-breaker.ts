/**
 * Circuit Breaker Pattern - Prevents cascading failures and infinite loops
 * Automatically stops calling failing services and provides fallbacks
 */

interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Failing - reject all calls
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

interface CircuitBreakerStats {
  failureCount: number;
  successCount: number;
  lastFailureTime: number;
  state: CircuitState;
}

class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private stats: CircuitBreakerStats;
  private name: string;

  constructor(name: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.name = name;
    this.config = {
      failureThreshold: config.failureThreshold || 5,
      resetTimeout: config.resetTimeout || 60000, // 1 minute
      monitoringPeriod: config.monitoringPeriod || 60000 // 1 minute
    };
    
    this.stats = {
      failureCount: 0,
      successCount: 0,
      lastFailureTime: 0,
      state: CircuitState.CLOSED
    };
  }

  async execute<T>(operation: () => Promise<T>, fallback?: () => T): Promise<T> {
    // Check if circuit should transition states
    this.updateState();

    // If circuit is OPEN, reject immediately
    if (this.stats.state === CircuitState.OPEN) {
      console.warn(`🚨 Circuit breaker ${this.name} is OPEN - rejecting call`);
      if (fallback) {
        return fallback();
      }
      throw new Error(`Circuit breaker ${this.name} is OPEN - service unavailable`);
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      if (fallback) {
        console.warn(`⚠️ Circuit breaker ${this.name} using fallback due to error:`, error);
        return fallback();
      }
      throw error;
    }
  }

  private onSuccess(): void {
    this.stats.successCount++;
    this.stats.failureCount = 0; // Reset failure count on success
    
    if (this.stats.state === CircuitState.HALF_OPEN) {
      this.stats.state = CircuitState.CLOSED;
      console.log(`✅ Circuit breaker ${this.name} recovered - state: CLOSED`);
    }
  }

  private onFailure(): void {
    this.stats.failureCount++;
    this.stats.lastFailureTime = Date.now();
    
    console.warn(`❌ Circuit breaker ${this.name} failure ${this.stats.failureCount}/${this.config.failureThreshold}`);
    
    if (this.stats.failureCount >= this.config.failureThreshold) {
      this.stats.state = CircuitState.OPEN;
      console.error(`🚨 Circuit breaker ${this.name} OPENED due to ${this.stats.failureCount} failures`);
    }
  }

  private updateState(): void {
    if (this.stats.state === CircuitState.OPEN) {
      const timeSinceLastFailure = Date.now() - this.stats.lastFailureTime;
      
      if (timeSinceLastFailure >= this.config.resetTimeout) {
        this.stats.state = CircuitState.HALF_OPEN;
        console.log(`🔄 Circuit breaker ${this.name} transitioning to HALF_OPEN`);
      }
    }
  }

  getStats(): CircuitBreakerStats & { name: string } {
    return { ...this.stats, name: this.name };
  }

  reset(): void {
    this.stats = {
      failureCount: 0,
      successCount: 0,
      lastFailureTime: 0,
      state: CircuitState.CLOSED
    };
    console.log(`🔄 Circuit breaker ${this.name} manually reset`);
  }
}

// Global circuit breakers for different services
export const circuitBreakers = {
  supabase: new CircuitBreaker('supabase', { failureThreshold: 3, resetTimeout: 30000 }),
  claude: new CircuitBreaker('claude', { failureThreshold: 2, resetTimeout: 60000 }),
  twilio: new CircuitBreaker('twilio', { failureThreshold: 3, resetTimeout: 45000 }),
  knowledgeBase: new CircuitBreaker('knowledge-base', { failureThreshold: 5, resetTimeout: 30000 })
};

export { CircuitBreaker, CircuitState };