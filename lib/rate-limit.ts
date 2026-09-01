import { NextRequest, NextResponse } from "next/server";

interface RateLimitStore {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitStore>();


setInterval(() => {
  const now = Date.now();
  for (const [key, value] of memoryStore.entries()) {
    if (now > value.resetAt) {
      memoryStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}


export async function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { limit: 10, windowMs: 60 * 1000 }
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  
  if (redisUrl && redisToken) {
    try {
      const key = `ratelimit:${identifier}`;
      const res = await fetch(`${redisUrl}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${redisToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", key],
          ["PEXPIRE", key, options.windowMs],
        ]),
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        const currentCount = data[0]?.result || 1;
        const remaining = Math.max(0, options.limit - currentCount);
        const success = currentCount <= options.limit;
        const reset = Date.now() + options.windowMs;
        return { success, limit: options.limit, remaining, reset };
      }
    } catch (e) {
      console.error("[RateLimit Redis Error fallback to memory]:", e);
    }
  }

  
  const now = Date.now();
  const record = memoryStore.get(identifier);

  if (!record || now > record.resetAt) {
    memoryStore.set(identifier, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return {
      success: true,
      limit: options.limit,
      remaining: options.limit - 1,
      reset: now + options.windowMs,
    };
  }

  if (record.count >= options.limit) {
    return {
      success: false,
      limit: options.limit,
      remaining: 0,
      reset: record.resetAt,
    };
  }

  record.count += 1;
  memoryStore.set(identifier, record);

  return {
    success: true,
    limit: options.limit,
    remaining: options.limit - record.count,
    reset: record.resetAt,
  };
}

export function getClientIp(req: NextRequest | Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}
