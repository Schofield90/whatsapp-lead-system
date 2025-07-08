/**
 * Rate Limiter - Prevents too many requests in a time window
 * Protects against infinite loops and DoS scenarios
 */

interface RateLimiterConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (req: any) => string;
}

interface RequestLog {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private config: RateLimiterConfig;
  private requests = new Map<string, RequestLog>();
  private name: string;

  constructor(name: string, config: RateLimiterConfig) {
    this.name = name;
    this.config = config;
    
    // Clean up old entries periodically
    setInterval(() => this.cleanup(), this.config.windowMs);
  }

  async checkLimit(identifier: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const key = identifier;
    
    let requestLog = this.requests.get(key);
    
    // Initialize or reset if window expired
    if (!requestLog || now >= requestLog.resetTime) {
      requestLog = {
        count: 0,
        resetTime: now + this.config.windowMs
      };
      this.requests.set(key, requestLog);
    }
    
    // Check if limit exceeded
    if (requestLog.count >= this.config.maxRequests) {
      console.warn(`🚨 Rate limit exceeded for ${this.name}: ${key} (${requestLog.count}/${this.config.maxRequests})`);
      return {
        allowed: false,
        remaining: 0,
        resetTime: requestLog.resetTime
      };
    }
    
    // Increment count
    requestLog.count++;
    
    const remaining = this.config.maxRequests - requestLog.count;
    
    if (remaining <= 2) {
      console.warn(`⚠️ Rate limit warning for ${this.name}: ${key} (${requestLog.count}/${this.config.maxRequests})`);
    }
    
    return {
      allowed: true,
      remaining,
      resetTime: requestLog.resetTime
    };
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, log] of this.requests.entries()) {
      if (now >= log.resetTime) {
        this.requests.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Rate limiter ${this.name} cleaned up ${cleaned} expired entries`);
    }
  }

  getStats(): { name: string; activeKeys: number; totalRequests: number } {
    let totalRequests = 0;
    for (const log of this.requests.values()) {
      totalRequests += log.count;
    }
    
    return {
      name: this.name,
      activeKeys: this.requests.size,
      totalRequests
    };
  }

  reset(): void {
    this.requests.clear();
    console.log(`🔄 Rate limiter ${this.name} reset`);
  }
}

// Global rate limiters
export const rateLimiters = {
  webhook: new RateLimiter('webhook', { maxRequests: 10, windowMs: 60000 }), // 10 req/minute
  api: new RateLimiter('api', { maxRequests: 100, windowMs: 60000 }), // 100 req/minute
  claude: new RateLimiter('claude', { maxRequests: 20, windowMs: 60000 }), // 20 req/minute
  knowledgeBase: new RateLimiter('knowledge-base', { maxRequests: 50, windowMs: 60000 }) // 50 req/minute
};

export { RateLimiter };