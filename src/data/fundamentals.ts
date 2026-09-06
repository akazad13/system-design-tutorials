import { FundamentalTopic } from '../types/system-design';

export const FUNDAMENTAL_TOPICS: FundamentalTopic[] = [
  {
    id: 'dns-and-cdn',
    title: 'DNS, Anycast & Content Delivery Networks (CDN)',
    category: 'Networking & Routing',
    icon: 'Globe',
    summary: 'The critical entry tier of distributed systems: translating human domains to IP addresses, utilizing Anycast BGP routing, and caching static & dynamic media at worldwide Edge Points of Presence (PoPs).',
    readTime: '12 min read',
    diagram: {
      nodes: [
        { id: 'client', label: 'Client Browser', type: 'client', x: 8, y: 50, description: 'Requests web domain (e.g. api.example.com)' },
        { id: 'resolver', label: 'Recursive Resolver (ISP / 8.8.8.8)', type: 'dns', x: 28, y: 25, description: 'Performs recursive DNS hierarchy lookup with TTL cache', techStack: ['Unbound', 'BIND'] },
        { id: 'root_tld', label: 'Root & TLD (.com) Servers', type: 'dns', x: 50, y: 15, description: 'Delegates query down to Authoritative Nameservers' },
        { id: 'auth_dns', label: 'Authoritative GeoDNS', type: 'dns', x: 74, y: 25, description: 'Resolves hostname to closest Anycast IP based on geo-proximity', techStack: ['AWS Route 53', 'Cloudflare'] },
        { id: 'cdn_pop', label: 'Anycast Edge CDN PoP', type: 'cdn', x: 50, y: 65, description: 'Edge proxy terminating TLS/QUIC and caching static/dynamic media', techStack: ['Cloudflare', 'CloudFront', 'Fastly'], scaleMetric: '<20ms Global TTFB' },
        { id: 'origin_server', label: 'Origin App Cluster', type: 'service', x: 85, y: 65, description: 'Backing backend service serving dynamic responses and cache misses', techStack: ['Nginx', 'K8s Cluster'] }
      ],
      edges: [
        { id: 'e1', from: 'client', to: 'resolver', label: '1. Resolve IP', protocol: 'HTTPS' },
        { id: 'e2', from: 'resolver', to: 'root_tld', label: '2. TLD Query', protocol: 'Internal RPC' },
        { id: 'e3', from: 'resolver', to: 'auth_dns', label: '3. GeoDNS Query', protocol: 'Internal RPC' },
        { id: 'e4', from: 'auth_dns', to: 'client', label: '4. Anycast IP', protocol: 'HTTPS' },
        { id: 'e5', from: 'client', to: 'cdn_pop', label: '5. HTTP/3 Request', protocol: 'HTTPS' },
        { id: 'e6', from: 'cdn_pop', to: 'origin_server', label: '6. Cache Miss Fetch', protocol: 'HTTPS' }
      ],
      flowSteps: [
        { step: 1, title: 'Recursive DNS Query', description: 'Client queries Recursive Resolver for api.example.com IP address.', activeNodes: ['client', 'resolver'], highlightDetails: 'Resolver checks local DNS cache before querying external nameservers.', latencyEstimate: '1-5ms' },
        { step: 2, title: 'Hierarchical Resolution', description: 'Resolver traverses Root, .com TLD, and hits Authoritative GeoDNS.', activeNodes: ['resolver', 'root_tld', 'auth_dns'], highlightDetails: 'GeoDNS chooses closest Anycast IP address based on client subnet (EDNS Client Subnet).', latencyEstimate: '10-30ms' },
        { step: 3, title: 'Anycast Edge Connection', description: 'Client connects to nearest CDN Point of Presence (PoP) via BGP Anycast routing.', activeNodes: ['client', 'cdn_pop'], highlightDetails: 'TLS 1.3 / QUIC handshake terminates at the Edge, saving 100ms+ roundtrips.', latencyEstimate: '5-15ms' },
        { step: 4, title: 'Edge Cache Miss & Origin Shield', description: 'On cache miss, Edge pulls from Origin Server, stores in CDN cache with stale-while-revalidate, and returns to client.', activeNodes: ['cdn_pop', 'origin_server', 'client'], highlightDetails: 'Subsequent global requests for this resource will hit Edge cache with 0ms origin load.', latencyEstimate: '20-50ms' }
      ]
    },
    keyConcepts: [
      {
        name: 'DNS Resolution Flow & Routing Strategies',
        explanation: 'DNS (Domain Name System) translates hostnames like api.example.com to IP addresses through a hierarchical resolution tree: Root Servers -> TLD Servers (.com) -> Authoritative Nameservers -> Local Recursive Resolvers (ISP/8.8.8.8). Routing strategies include Latency-based Routing (directs users to closest datacenter), GeoDNS (country/region specific routing), Weighted Round-Robin (canary testing/blue-green deployments), and Failover Routing with health check heartbeats.',
        prosAndCons: {
          pros: [
            'Global traffic steering without application-layer changes',
            'Enables seamless disaster recovery failover across multiple cloud regions',
            'Zero infrastructure overhead on the app server tier'
          ],
          cons: [
            'DNS propagation delays (TTL caching on clients and ISP recursive resolvers can take minutes to hours)',
            'No visibility into real-time server load or connection health unless active synthetic checks are integrated',
            'Vulnerable to DNS cache poisoning and DDoS without DNSSEC'
          ]
        },
        codeSnippet: `// Example: Configuring DNS TTL vs Failover in Zone File
api.prod.example.com.   60   IN   A   198.51.100.24  ; Short TTL (60s) for active API endpoints
static.example.com.     86400 IN  CNAME d123.cloudfront.net. ; Long TTL (24h) for static assets CDN`
      },
      {
        name: 'CDN Architecture & Edge Caching Mechanics',
        explanation: 'A Content Delivery Network is a geographically distributed network of proxy servers (PoPs). When a user requests an asset (images, video chunks, CSS, JavaScript, or static JSON), the request hits the nearest Edge Server via Anycast IP routing. If cache hit, asset returns in <10-20ms. If cache miss, the Edge pulls from Origin Server, stores it locally based on Cache-Control headers (s-maxage, stale-while-revalidate), and returns to client.',
        prosAndCons: {
          pros: [
            'Reduces Origin server load by 85-98% for media and static assets',
            'Drastically decreases latency (TTFB) globally by terminating TLS/TCP close to the end user',
            'DDoS mitigation layer absorb volumetric floods (L3/L4/L7) before hitting application backend'
          ],
          cons: [
            'Cache invalidation complexity (Purging CDN tags globally takes time)',
            'Dynamic personalized content requires Edge Compute (Workers / Lambda@Edge) or bypass',
            'Cost overhead on egress bandwidth if cache hit ratio drops'
          ]
        },
        codeSnippet: `// HTTP Caching Headers Best Practice
Cache-Control: public, max-age=31536000, immutable // For fingerprinted static bundles (app-v2.9a8.js)
Cache-Control: public, s-maxage=300, stale-while-revalidate=60 // For CDN Edge caching with background refresh`
      },
      {
        name: 'Anycast vs Unicast Routing',
        explanation: 'In Unicast, an IP address maps to exactly one physical server/interface. In Anycast, the SAME IP address is announced via BGP (Border Gateway Protocol) by multiple servers across different data centers globally. The Internet routing infrastructure automatically sends packets from a client to the topologically closest server.',
        prosAndCons: {
          pros: ['Natural geographical load balancing', 'High resilience: if one PoP dies, BGP withdraws route and traffic routes to next nearest PoP'],
          cons: ['Stateful TCP connections can be tricky if BGP routes flap mid-connection (solved by QUIC or stateless front-proxies)']
        }
      }
    ],
    cheatSheet: [
      'TTL (Time-to-Live): Lower (60s) for dynamic failover endpoints; High (86400s) for stable CDN aliases.',
      'Edge Compute (Cloudflare Workers, Fastly Compute@Edge, CloudFront Functions) runs lightweight routing, auth token verification, and A/B testing at the edge.',
      'Use CDN for dynamic content using stale-while-revalidate to achieve 0ms perception for slightly stale feeds.'
    ],
    commonMistakes: [
      'Relying on DNS for fine-grained load balancing or instant instant cutover (ISP resolvers often ignore low TTLs).',
      'Forgetting to configure Cache-Control: no-transform, causing CDN proxies to compress already compressed media or alter payloads.',
      'Not enabling HTTP/2 or HTTP/3 (QUIC) on the CDN edge, losing multiplexing and connection migration advantages.'
    ],
    interviewTips: [
      'Always start your High-Level Architecture (HLA) diagram with DNS and CDN on the edge for any global scale system.',
      'Quantify the bandwidth savings when introducing CDN: e.g. 500 TB/month origin egress reduced to 25 TB/month.'
    ]
  },
  {
    id: 'load-balancers-and-proxies',
    title: 'Load Balancers & Reverse Proxies (L4 vs L7)',
    category: 'Networking & Routing',
    icon: 'Network',
    summary: 'Distributing ingress requests across horizontally scaled compute clusters while preventing server overload, performing SSL termination, and maintaining health checks.',
    readTime: '15 min read',
    diagram: {
      nodes: [
        { id: 'client', label: 'Client Ingress Traffic', type: 'client', x: 8, y: 50, description: 'High-volume concurrent HTTP and TCP connections' },
        { id: 'l4_nlb', label: 'Layer 4 Network LB (IPVS/NLB)', type: 'load_balancer', x: 30, y: 50, description: 'Routes raw TCP/UDP packets by IP + Port without TLS decryption', techStack: ['AWS NLB', 'IPVS', 'Maglev'], scaleMetric: 'Millions packets/sec' },
        { id: 'l7_alb_1', label: 'L7 Reverse Proxy 1 (Envoy)', type: 'gateway', x: 55, y: 30, description: 'Terminates TLS, inspects headers, path routing, and rate limits', techStack: ['Envoy Proxy', 'NGINX'] },
        { id: 'l7_alb_2', label: 'L7 Reverse Proxy 2 (Envoy)', type: 'gateway', x: 55, y: 70, description: 'High-availability active-active pair with keepalive pools', techStack: ['Envoy Proxy', 'NGINX'] },
        { id: 'auth_svc', label: 'Auth Microservice', type: 'service', x: 85, y: 20, description: 'Handles /api/auth path traffic', techStack: ['Go', 'K8s'] },
        { id: 'order_svc', label: 'Orders Microservice', type: 'service', x: 85, y: 50, description: 'Handles /api/orders path traffic with Least Connections', techStack: ['Java', 'K8s'] },
        { id: 'media_svc', label: 'Media Microservice', type: 'service', x: 85, y: 80, description: 'Handles /api/media streaming traffic', techStack: ['Rust', 'K8s'] }
      ],
      edges: [
        { id: 'e1', from: 'client', to: 'l4_nlb', label: '1. Ingress TCP', protocol: 'TCP' },
        { id: 'e2', from: 'l4_nlb', to: 'l7_alb_1', label: '2. Forward Packets', protocol: 'TCP' },
        { id: 'e3', from: 'l4_nlb', to: 'l7_alb_2', label: '2. Forward Packets', protocol: 'TCP' },
        { id: 'e4', from: 'l7_alb_1', to: 'auth_svc', label: '3. /api/auth', protocol: 'HTTPS' },
        { id: 'e5', from: 'l7_alb_1', to: 'order_svc', label: '3. /api/orders', protocol: 'Internal RPC' },
        { id: 'e6', from: 'l7_alb_2', to: 'media_svc', label: '3. /api/media', protocol: 'Internal RPC' }
      ],
      flowSteps: [
        { step: 1, title: 'L4 Packet Distribution', description: 'Incoming TCP packets hit Layer 4 NLB, which uses consistent 5-tuple hashing to forward to L7 proxies.', activeNodes: ['client', 'l4_nlb'], highlightDetails: 'Zero payload inspection allows L4 to achieve wire-speed packet throughput.', latencyEstimate: '<0.5ms' },
        { step: 2, title: 'L7 TLS Termination & Parsing', description: 'Layer 7 Envoy proxies terminate TLS certificates and buffer HTTP/2 frames.', activeNodes: ['l4_nlb', 'l7_alb_1', 'l7_alb_2'], highlightDetails: 'Proxies inject X-Forwarded-For and X-Request-ID headers for distributed tracing.', latencyEstimate: '1-2ms' },
        { step: 3, title: 'Intelligent Path-Based Routing', description: 'Envoy inspects URL path and headers, dispatching to target upstream clusters using Weighted Least Connections.', activeNodes: ['l7_alb_1', 'auth_svc', 'order_svc'], highlightDetails: 'HTTP connection pooling eliminates TLS handshakes between proxy and internal services.', latencyEstimate: '1-3ms' }
      ]
    },
    keyConcepts: [
      {
        name: 'Layer 4 (Transport) vs Layer 7 (Application) Load Balancing',
        explanation: 'Layer 4 Load Balancers (like AWS NLB, IPVS, HAProxy in TCP mode) operate at the transport layer (IP + TCP/UDP port). They route packets without decrypting or inspecting the application payload, achieving ultra-high throughput (millions of packets/sec with minimal CPU). Layer 7 Load Balancers (like AWS ALB, NGINX, Envoy, Traefik) operate at the application layer (HTTP/HTTPS/gRPC/WebSocket). They decrypt TLS, inspect HTTP headers, cookies, URLs, and perform path-based routing, header rewriting, and rate limiting.',
        prosAndCons: {
          pros: [
            'L4: Extreme performance, minimal CPU overhead, transparent TCP proxying',
            'L7: Intelligent routing (e.g. /api/video to video service, /api/auth to auth service), SSL offloading, sticky sessions via cookies'
          ],
          cons: [
            'L4: Cannot route by URL path, cannot read HTTP cookies or headers, no SSL termination with payload modification',
            'L7: Higher memory & CPU overhead per connection due to TLS decryption and HTTP buffer parsing'
          ]
        },
        codeSnippet: `# NGINX Layer 7 Configuration with Least Connections & Health Check
upstream backend_cluster {
    least_conn; # Routing algorithm
    server app-node-1.internal:8080 weight=3 max_fails=3 fail_timeout=10s;
    server app-node-2.internal:8080 weight=2 max_fails=3 fail_timeout=10s;
    keepalive 64; # Connection pooling
}

server {
    listen 443 ssl http2;
    server_name api.example.com;
    
    location /api/v1/checkout/ {
        proxy_pass http://checkout_service;
    }
    location / {
        proxy_pass http://backend_cluster;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}`
      },
      {
        name: 'Balancing Algorithms & Selection Criteria',
        explanation: 'Common balancing algorithms include: Round Robin (equal distribution for uniform tasks), Weighted Round Robin (accommodates heterogeneous server capacities), Least Connections (best for long-lived sessions like WebSockets or heavy DB queries), IP Hash (ensures same client IP hits same node for basic statefulness), and Consistent Hashing (distributes requests with minimal key movement on node scaling).',
        prosAndCons: {
          pros: ['Allows dynamic autoscaling groups to scale from 5 to 500 instances seamlessly'],
          cons: ['IP Hash can cause hotspots if corporate networks route all users through a single NAT gateway IP']
        }
      },
      {
        name: 'Load Balancer High Availability (Active-Passive vs Active-Active)',
        explanation: 'To prevent the load balancer itself from becoming a Single Point of Failure (SPOF), production systems use VRRP (Virtual Router Redundancy Protocol) with Keepalived, or multi-AZ managed load balancers (like AWS ALB/NLB) mapped to multiple Anycast IPs with automatic DNS failover.',
        prosAndCons: {
          pros: ['Sub-second failover if a primary load balancer hardware host fails'],
          cons: ['Requires heartbeat monitoring and floating Virtual IP (VIP) infrastructure']
        }
      }
    ],
    cheatSheet: [
      'Two-tier LB pattern: L4 (NLB/IPVS) at the outer edge for high throughput -> forwards to L7 (Envoy/NGINX) for microservice path routing.',
      'Always configure Connection Keepalive between LB and upstream app servers to eliminate TLS/TCP handshake latency overhead.',
      'Differentiate between Passive Health Checks (detecting 5xx on live traffic) and Active Synthetic Health Checks (/healthz probing every 5s).'
    ],
    commonMistakes: [
      'Using Round Robin for workloads with wildly varying request processing times (e.g. 5ms vs 5000ms), causing queue pile-ups on slower nodes.',
      'Relying on sticky sessions for stateless web apps (breaks horizontal autoscaling and makes deploys difficult).',
      'Forgetting to pass X-Forwarded-For and X-Forwarded-Proto headers to backend microservices.'
    ],
    interviewTips: [
      'When asked how to eliminate Single Point of Failure at the LB tier, mention Keepalived Active-Standby VIP or Cloud Managed Multi-AZ Anycast DNS.',
      'Mention Envoy Proxy if discussing modern service meshes, distributed tracing, and gRPC load balancing.'
    ]
  },
  {
    id: 'api-gateways-and-rate-limiting',
    title: 'API Gateways, Rate Limiting & Traffic Management',
    category: 'Compute & Proxies',
    icon: 'ShieldCheck',
    summary: 'The unified front door for client communications: managing authentication, SSL offloading, distributed rate limiting algorithms, request transformation, and circuit breaking.',
    readTime: '14 min read',
    diagram: {
      nodes: [
        { id: 'client', label: 'Web & Mobile Clients', type: 'client', x: 8, y: 50, description: 'Sends authenticated REST/GraphQL API requests' },
        { id: 'gateway', label: 'API Gateway (Kong / Envoy)', type: 'gateway', x: 35, y: 50, description: 'Centralized edge gateway: JWT validation, rate limiting, and protocol translation', techStack: ['Kong', 'Envoy', 'APISIX'], scaleMetric: '50,000 QPS' },
        { id: 'redis_token', label: 'Redis Rate Limiter Cluster', type: 'cache', x: 35, y: 15, description: 'Maintains atomic sliding window counters via Redis Lua scripts', techStack: ['Redis Cluster'], scaleMetric: '<1ms lookup' },
        { id: 'auth_jwt', label: 'IAM / Token Verifier', type: 'service', x: 60, y: 25, description: 'Validates public RSA/ECDSA keys and tenant scopes', techStack: ['OIDC', 'OAuth2'] },
        { id: 'checkout_svc', label: 'Checkout Service', type: 'service', x: 85, y: 40, description: 'Internal gRPC core business service', techStack: ['Go', 'gRPC'] },
        { id: 'user_svc', label: 'User Account Service', type: 'service', x: 85, y: 70, description: 'Internal user profile microservice', techStack: ['Node.js', 'gRPC'] }
      ],
      edges: [
        { id: 'e1', from: 'client', to: 'gateway', label: '1. POST /checkout', protocol: 'HTTPS' },
        { id: 'e2', from: 'gateway', to: 'redis_token', label: '2. Consume Token', protocol: 'TCP' },
        { id: 'e3', from: 'gateway', to: 'auth_jwt', label: '3. Verify JWT Claims', protocol: 'Internal RPC' },
        { id: 'e4', from: 'gateway', to: 'checkout_svc', label: '4. Forward gRPC', protocol: 'gRPC' },
        { id: 'e5', from: 'gateway', to: 'user_svc', label: '4. Forward gRPC', protocol: 'gRPC' }
      ],
      flowSteps: [
        { step: 1, title: 'Ingress API Request', description: 'Client sends HTTPS POST with Bearer token to API Gateway.', activeNodes: ['client', 'gateway'], highlightDetails: 'Gateway acts as the unified reverse proxy, hiding microservice topology.', latencyEstimate: '2ms' },
        { step: 2, title: 'Distributed Rate Limit Check', description: 'Gateway executes atomic Lua script against Redis cluster using Sliding Window Counter.', activeNodes: ['gateway', 'redis_token'], highlightDetails: 'If user exceeds 100 req/min, gateway immediately rejects with HTTP 429 and Retry-After header.', latencyEstimate: '1ms' },
        { step: 3, title: 'Cryptographic Auth & Translation', description: 'Gateway validates JWT signature against cached public keys and translates JSON/HTTP payload to Protobuf.', activeNodes: ['gateway', 'auth_jwt'], highlightDetails: 'Saves downstream services from having to duplicate authentication logic.', latencyEstimate: '1ms' },
        { step: 4, title: 'Upstream gRPC Dispatch', description: 'Gateway dispatches request via multiplexed gRPC connection to internal Checkout Service.', activeNodes: ['gateway', 'checkout_svc'], highlightDetails: 'Circuit breaker trips open if checkout service error rate exceeds 50%.', latencyEstimate: '5-15ms' }
      ]
    },
    keyConcepts: [
      {
        name: 'API Gateway Responsibilities (BFF Pattern vs Enterprise Gateway)',
        explanation: 'An API Gateway acts as the reverse proxy between clients and internal microservices. Core capabilities: Request Routing, Authentication/JWT validation, SSL Termination, Distributed Rate Limiting, Response Aggregation (Backend-for-Frontend / BFF pattern), Protocol Translation (e.g. HTTP/JSON to internal gRPC/Protobuf), and Centralized Logging.',
        prosAndCons: {
          pros: [
            'Shields internal microservice network topology from public exposure',
            'Prevents duplicating auth and telemetry boilerplate across 50+ microservices',
            'Optimizes client payloads for mobile vs desktop via BFF tailored endpoints'
          ],
          cons: [
            'Can become an architectural bottleneck or single point of failure if not scaled horizontally',
            'Potential vendor lock-in or complex orchestration pipelines'
          ]
        }
      },
      {
        name: 'Distributed Rate Limiting Algorithms',
        explanation: 'Algorithms to throttle abusive traffic and protect internal services:\n1. Token Bucket: Bucket holds tokens up to max capacity. Refills at rate r tokens/sec. Request consumes 1 token. Allows controlled bursts.\n2. Leaky Bucket: Requests enter a FIFO queue; leaks out at a constant smooth rate. Drops if queue full. Perfect for smoothing spiky traffic.\n3. Fixed Window Counter: Divides time into 1-minute blocks. Counts requests. Vulnerable to 2x traffic burst at window boundaries (59s -> 01s).\n4. Sliding Window Log: Stores exact timestamps in Redis Sorted Set (ZSET). Removes timestamps older than (now - window). Highly accurate, high memory.\n5. Sliding Window Counter: Hybrid approach combining current and previous window counts using weighted overlap. Memory efficient (~2 counters) and smooth.',
        prosAndCons: {
          pros: ['Protects downstream DBs and services from cascading failures and DDoS attacks'],
          cons: ['Distributed rate limiting requires shared memory state (Redis Cluster) with low-latency network hop']
        },
        codeSnippet: `// Redis Lua Script for Atomic Sliding Window Counter (Zero Race Conditions)
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local clearBefore = now - window

redis.call('ZREMRANGEBYSCORE', key, 0, clearBefore)
local currentRequests = redis.call('ZCARD', key)

if currentRequests < limit then
    redis.call('ZADD', key, now, now)
    redis.call('EXPIRE', key, math.ceil(window / 1000))
    return 1 -- Allowed
else
    return 0 -- Rejected (HTTP 429 Too Many Requests)
end`
      }
    ],
    cheatSheet: [
      'Return standard HTTP headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, and Retry-After on 429.',
      'Use Redis Lua scripts to execute rate limit checks atomically in a single network round-trip.',
      'Implement multi-tier rate limiting: IP-based at Edge CDN -> User-ID based at API Gateway -> Tenant-based at Service Tier.'
    ],
    commonMistakes: [
      'Using Fixed Window without boundary mitigation, allowing attackers to send 200% of the limit across the boundary.',
      'Checking and incrementing rate limit counters in two separate Redis calls (causes critical race condition under high concurrency).'
    ],
    interviewTips: [
      'If the interviewer asks how to handle rate limiter downtime, explain the fail-open vs fail-closed policy (fail-open for revenue flows, fail-closed for security auth endpoints).'
    ]
  },
  {
    id: 'caching-strategies-and-eviction',
    title: 'Distributed Caching Strategies & Eviction Policies',
    category: 'Caching & Memory',
    icon: 'Layers',
    summary: 'Sub-millisecond data retrieval using in-memory data structures (Redis, Memcached), caching topologies, cache invalidation strategies, and thundering herd mitigations.',
    readTime: '16 min read',
    diagram: {
      nodes: [
        { id: 'app_srv', label: 'Application Service', type: 'service', x: 10, y: 50, description: 'Queries product catalog data' },
        { id: 'bloom_filter', label: 'Bloom Filter Guard', type: 'gateway', x: 32, y: 20, description: 'Probabilistic set membership to prevent Cache Penetration for invalid IDs', techStack: ['RedisBloom', 'Guava'] },
        { id: 'local_l1', label: 'L1 In-Memory Cache', type: 'cache', x: 32, y: 75, description: 'Ultra-fast JVM/process heap cache (Caffeine)', techStack: ['Caffeine Cache'], scaleMetric: '0.1ms latency' },
        { id: 'redis_l2', label: 'L2 Distributed Redis Cluster', type: 'cache', x: 58, y: 50, description: 'Shared distributed cache with LRU eviction and replication', techStack: ['Redis 7 Cluster'], scaleMetric: '1-2ms, 95% hit ratio' },
        { id: 'primary_db', label: 'Primary PostgreSQL Database', type: 'database', x: 86, y: 50, description: 'Durable ACID source of truth', techStack: ['PostgreSQL'] },
        { id: 'async_warmer', label: 'Cache Warmer Worker', type: 'worker', x: 58, y: 85, description: 'Refreshes hot keys asynchronously via probabilistic early expiry (XFetch)', techStack: ['Cron Worker'] }
      ],
      edges: [
        { id: 'e1', from: 'app_srv', to: 'bloom_filter', label: '1. Test Key Exists', protocol: 'Internal RPC' },
        { id: 'e2', from: 'app_srv', to: 'local_l1', label: '2. Check L1 Heap', protocol: 'Internal RPC' },
        { id: 'e3', from: 'app_srv', to: 'redis_l2', label: '3. Check L2 Redis', protocol: 'TCP' },
        { id: 'e4', from: 'app_srv', to: 'primary_db', label: '4. DB Query on Miss', protocol: 'SQL' },
        { id: 'e5', from: 'app_srv', to: 'redis_l2', label: '5. Set Cache + Jitter', protocol: 'TCP' },
        { id: 'e6', from: 'async_warmer', to: 'redis_l2', label: 'Background Warmup', protocol: 'TCP', isAsync: true }
      ],
      flowSteps: [
        { step: 1, title: 'Multi-Tier Cache Lookup', description: 'Application first checks L1 in-process heap (0.1ms), then queries distributed Redis Cluster (1ms).', activeNodes: ['app_srv', 'local_l1', 'redis_l2'], highlightDetails: '95% of reads return here without ever touching the primary database.', latencyEstimate: '0.1 - 1ms' },
        { step: 2, title: 'Penetration Defense via Bloom Filter', description: 'If key is missing, Bloom filter checks if the ID could exist in the database.', activeNodes: ['app_srv', 'bloom_filter'], highlightDetails: 'If Bloom filter returns False, query is rejected immediately without DB hit (0% false negatives).', latencyEstimate: '0.5ms' },
        { step: 3, title: 'Cache-Aside DB Read with Mutex', description: 'App server acquires a single-flight mutex lock in Redis before hitting PostgreSQL to prevent Thundering Herd.', activeNodes: ['app_srv', 'primary_db'], highlightDetails: 'Only 1 query hits the DB; concurrent requests wait and read from cache once filled.', latencyEstimate: '10-25ms' },
        { step: 4, title: 'Cache Population with TTL Jitter', description: 'Result is saved into Redis with randomized TTL (e.g. 3600s + rand(0, 300s)) to eliminate Cache Avalanche.', activeNodes: ['app_srv', 'redis_l2'], highlightDetails: 'Randomized jitter ensures keys do not expire simultaneously at midnight.', latencyEstimate: '1ms' }
      ]
    },
    keyConcepts: [
      {
        name: 'Caching Topologies: Application vs Distributed vs CDN',
        explanation: 'Local In-Memory Cache (e.g. Guava, Caffeine in JVM heap): 0.1ms latency, but memory limited and out-of-sync across nodes. Distributed Cache (Redis Cluster, Memcached): 1-3ms latency, shared across all application servers, supports gigabytes to terabytes with master-replica replication and clustering.',
        prosAndCons: {
          pros: ['10x to 100x lower latency than disk-based databases', 'Massive reduction in expensive relational DB JOIN queries'],
          cons: ['Data volatility, eventual consistency window, cache synchronization bugs']
        }
      },
      {
        name: 'Caching Design Patterns',
        explanation: '1. Cache-Aside (Lazy Loading): App checks cache. If hit, return. If miss, app reads from DB, writes to cache, and returns. Most popular.\n2. Write-Through: App writes to Cache, cache synchronously writes to DB before confirming. Strong consistency, higher write latency.\n3. Write-Back (Write-Behind): App writes to Cache immediately; cache asynchronously batches writes to DB. Ultra-fast writes, risk of data loss on cache node crash.\n4. Write-Around: App writes directly to DB without touching cache. Prevents cache pollution from cold data that is written but rarely read.',
        prosAndCons: {
          pros: ['Cache-aside ensures only actually requested data occupies expensive RAM'],
          cons: ['Write-back requires durable write-ahead logging or replication to prevent data loss']
        },
        codeSnippet: `// Idiomatic Cache-Aside Pattern with Probabilistic Early Expiration (XFetch)
async function getProduct(productId: string): Promise<Product> {
  const cacheKey = \`product:\${productId}\`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Cache Miss: Query DB with distributed mutex to prevent Thundering Herd
  const lockKey = \`lock:\${cacheKey}\`;
  const acquired = await redis.set(lockKey, "1", "NX", "EX", 5);
  
  if (!acquired) {
    await sleep(50); // Wait for other worker to fill cache
    return getProduct(productId);
  }
  
  try {
    const product = await db.products.findById(productId);
    if (!product) {
      await redis.set(cacheKey, "null", "EX", 60); // Cache Null to prevent Cache Penetration!
      return null;
    }
    await redis.set(cacheKey, JSON.stringify(product), "EX", 3600 + Math.random() * 300); // Jitter TTL!
    return product;
  } finally {
    await redis.del(lockKey);
  }
}`
      },
      {
        name: 'The 4 Deadly Cache Failure Modes & Defenses',
        explanation: '1. Cache Stampede / Thundering Herd: Key expires, 10,000 concurrent requests all miss and hammer DB at once. Fix: Mutex lock (single flight) or Probabilistic early refresh (XFetch).\n2. Cache Breakdown: A hot celebrity key expires. Fix: Never expire hot keys explicitly; update via background cron worker.\n3. Cache Avalanche: Thousands of keys expire at the exact same second (e.g. at midnight). Fix: Add random Jitter to TTLs (e.g. TTL = 3600 + rand(0, 600)).\n4. Cache Penetration: Queries for non-existent IDs (e.g. ID=-999) bypass cache and hit DB continuously. Fix: Bloom Filter before cache, or cache null objects with short TTL.',
        prosAndCons: {
          pros: ['Bloom filters use only ~10 bits per item to check set membership in O(1) with 0% false negatives'],
          cons: ['Bloom filters cannot remove elements unless Counting Bloom Filter is used']
        }
      }
    ],
    cheatSheet: [
      'Eviction Policies: LRU (Least Recently Used) is best for temporal locality; LFU (Least Frequently Used) is best for persistent hot data.',
      'Redis vs Memcached: Redis supports rich data structures (Hashes, Sets, ZSets, Bitmaps, Streams), persistence (RDB/AOF), and Pub/Sub; Memcached is pure multi-threaded key-value.',
      'Always use TTL Jitter to prevent Cache Avalanche.'
    ],
    commonMistakes: [
      'Deleting cache after DB update without handling transactional rollback (if DB commit fails, cache is invalidated unnecessarily).',
      'Updating cache before DB write (leaves stale data in cache if DB write fails).',
      'Forgetting to compress large JSON objects in Redis (Snappy or Gzip reduces RAM by 70%).'
    ],
    interviewTips: [
      'When designing an architecture with Redis, always mention the 80/20 Pareto principle (20% of data generates 80% of read traffic) to calculate cache RAM size.'
    ]
  },
  {
    id: 'database-architectures-and-scaling',
    title: 'Database Architecture, Sharding & CAP Theorem',
    category: 'Data Storage & Partitioning',
    icon: 'Database',
    summary: 'Relational vs NoSQL trade-offs, B-Trees vs LSM-Trees, Replication topologies, Horizontal Sharding, Consistent Hashing, and distributed consistency models.',
    readTime: '20 min read',
    diagram: {
      nodes: [
        { id: 'app_clients', label: 'Application Cluster', type: 'service', x: 8, y: 50, description: 'Microservices executing reads and writes' },
        { id: 'sharding_proxy', label: 'Database Proxy (Vitess / Router)', type: 'gateway', x: 30, y: 50, description: 'Inspects query SQL, extracts sharding key, and routes queries', techStack: ['Vitess', 'ProxySQL', 'PgBouncer'] },
        { id: 'hash_ring', label: 'Consistent Hash Ring', type: 'search', x: 30, y: 15, description: 'Coordinates 2^32 virtual nodes to minimize rebalancing data movement', techStack: ['Consistent Hashing'] },
        { id: 'shard_0_master', label: 'Shard 0 Primary (Users 0-33M)', type: 'database', x: 60, y: 25, description: 'Handles ACID writes for Shard 0', techStack: ['PostgreSQL Primary'] },
        { id: 'shard_0_replica', label: 'Shard 0 Read Replica', type: 'database', x: 86, y: 25, description: 'Handles read traffic with replication lag monitoring', techStack: ['PostgreSQL Replica'] },
        { id: 'shard_1_master', label: 'Shard 1 Primary (Users 33-66M)', type: 'database', x: 60, y: 50, description: 'Handles ACID writes for Shard 1', techStack: ['PostgreSQL Primary'] },
        { id: 'shard_1_replica', label: 'Shard 1 Read Replica', type: 'database', x: 86, y: 50, description: 'Handles read traffic', techStack: ['PostgreSQL Replica'] },
        { id: 'shard_2_master', label: 'Shard 2 Primary (Users 66-100M)', type: 'database', x: 60, y: 75, description: 'Handles ACID writes for Shard 2', techStack: ['PostgreSQL Primary'] },
        { id: 'shard_2_replica', label: 'Shard 2 Read Replica', type: 'database', x: 86, y: 75, description: 'Handles read traffic', techStack: ['PostgreSQL Replica'] }
      ],
      edges: [
        { id: 'e1', from: 'app_clients', to: 'sharding_proxy', label: '1. SQL Query', protocol: 'SQL' },
        { id: 'e2', from: 'sharding_proxy', to: 'hash_ring', label: '2. Resolve Shard Key', protocol: 'Internal RPC' },
        { id: 'e3', from: 'sharding_proxy', to: 'shard_0_master', label: '3. Write Query', protocol: 'SQL' },
        { id: 'e4', from: 'sharding_proxy', to: 'shard_1_master', label: '3. Write Query', protocol: 'SQL' },
        { id: 'e5', from: 'sharding_proxy', to: 'shard_0_replica', label: '3. Read Query', protocol: 'SQL' },
        { id: 'e6', from: 'shard_0_master', to: 'shard_0_replica', label: 'Streaming Replication', protocol: 'SQL', isAsync: true }
      ],
      flowSteps: [
        { step: 1, title: 'Query Parsing & Shard Resolution', description: 'Application submits SQL query containing user_id. Sharding proxy hashes user_id onto the Consistent Hash ring.', activeNodes: ['app_clients', 'sharding_proxy', 'hash_ring'], highlightDetails: 'Consistent hashing with virtual nodes ensures even data distribution across shards.', latencyEstimate: '0.5ms' },
        { step: 2, title: 'Read / Write Split Routing', description: 'If query is an INSERT/UPDATE, proxy routes to Shard Master. If SELECT, proxy routes to nearest Read Replica.', activeNodes: ['sharding_proxy', 'shard_0_master', 'shard_0_replica'], highlightDetails: 'Read-Your-Own-Writes consistency is maintained by routing reads for recently updated users to the primary for 5 seconds.', latencyEstimate: '2-5ms' },
        { step: 3, title: 'Asynchronous WAL Streaming', description: 'Master writes transaction to Write-Ahead Log (WAL) and streams changes asynchronously to read replicas.', activeNodes: ['shard_0_master', 'shard_0_replica'], highlightDetails: 'Replicas maintain sub-second lag, providing high read scale without locking primary tables.', latencyEstimate: '5-20ms' }
      ]
    },
    keyConcepts: [
      {
        name: 'Relational (SQL) vs NoSQL Paradigm Matrix',
        explanation: 'SQL (PostgreSQL, MySQL): Structured schema, ACID transactions, strong consistency, foreign keys & complex JOINs. Best for financial ledgers, user accounts, transactional orders.\nNoSQL Document (MongoDB, Couchbase): Flexible schema, hierarchical JSON data. Best for catalog items, user profiles.\nNoSQL Key-Value (DynamoDB, Redis): High throughput, ultra-low latency, O(1) lookups by primary key.\nNoSQL Wide-Column (Cassandra, ScyllaDB): High write throughput, distributed partitioned storage. Best for time-series, event telemetry, chat logs.\nNoSQL Graph (Neo4j): Connected graphs, relationship traversals. Best for social networks, fraud detection.',
        prosAndCons: {
          pros: ['SQL guarantees strict transactional integrity; NoSQL delivers linear horizontal write scalability'],
          cons: ['SQL sharding requires application complexity; NoSQL lacks cross-table ACID joins']
        }
      },
      {
        name: 'Storage Engines: B+ Tree vs LSM Tree',
        explanation: 'B+ Tree (PostgreSQL, MySQL InnoDB): Data stored in balanced hierarchical page tree on disk. Fast random reads (O(log N)), but random writes require modifying pages in-place, leading to write amplification and disk random I/O.\nLSM-Tree (Log-Structured Merge-Tree) (Cassandra, RocksDB, LevelDB, Bigtable): Writes append sequentially to in-memory MemTable and Write-Ahead Log (WAL). When full, MemTable flushes to disk as immutable SSTable. Periodic Compaction merges SSTables. Ultra-fast sequential writes, slower reads (mitigated by Bloom filters).',
        prosAndCons: {
          pros: ['LSM-Tree delivers 5-10x higher write throughput for write-heavy systems (logs, IoT, metrics)'],
          cons: ['LSM Compaction spikes disk I/O and can cause latency hiccups if not tuned']
        }
      },
      {
        name: 'Horizontal Database Sharding Strategies',
        explanation: '1. Range-Based Sharding: Shards partitioned by value ranges (e.g., User ID 1-1M -> Shard 1; 1M-2M -> Shard 2). Simple, but creates hot shards if new users are active.\n2. Hash-Based Sharding: Shard ID = hash(key) % N. Even distribution, but adding a new node requires rehashing almost all data.\n3. Consistent Hashing with Virtual Nodes: Maps keys and nodes onto a circular 2^32 ring. Adding/removing a node only shifts K/N keys, eliminating massive rebalancing storms.\n4. Directory-Based Sharding: A lookup service maintains a mapping table of Key -> Shard ID. Highly flexible, but lookup service is in the critical read path.',
        prosAndCons: {
          pros: ['Enables relational DBs to scale beyond single-node 64TB disk and 100k QPS limits'],
          cons: ['Cross-shard JOINs and distributed multi-shard transactions (2PC) are notoriously slow and complex']
        }
      },
      {
        name: 'CAP Theorem & PACELC Deep Dive',
        explanation: 'CAP Theorem states that in the presence of a Network Partition (P), a distributed system MUST choose between Consistency (C - every read receives most recent write) OR Availability (A - every request receives non-error response without guarantee of latest write).\nPACELC extends this for normal operations (when no partition occurs): If Partition (P), choose Availability (A) or Consistency (C); Else (E), choose Latency (L) or Consistency (C). Example: DynamoDB / Cassandra prioritize Availability and Latency (PA/EL); Spanner / HBase prioritize Consistency (PC/EC).',
        prosAndCons: {
          pros: ['Provides a rigorous theoretical framework to justify database selection in interview discussions'],
          cons: ['Misunderstood as "pick 2 of 3" (Network partitions are a physical reality of distributed networks and cannot be opted out of)']
        }
      }
    ],
    cheatSheet: [
      'Read Replicas: Asynchronous replication from Master/Leader. Scales reads horizontally, but subject to Replication Lag (stale reads).',
      'Read-Your-Own-Writes Consistency: Route reads for recently updated users to Master DB for 5-10 seconds, then fallback to replicas.',
      'Sharding Key Selection: Choose high-cardinality keys that distribute traffic evenly (e.g. user_id or uuid, NOT country_code or status).'
    ],
    commonMistakes: [
      'Choosing Cassandra for complex relational querying or frequent row updates.',
      'Sharding too early before exhausting vertical scaling, read replicas, database indexing, and caching.',
      'Using distributed two-phase commit (2PC) over wide-area networks (causes blocking locks and high latency).'
    ],
    interviewTips: [
      'When asked how to scale a database, follow this exact progression: 1) Index optimization -> 2) Read replicas -> 3) Database caching (Redis) -> 4) Vertical scaling -> 5) Functional Partitioning (vertical sharding) -> 6) Horizontal Sharding.'
    ]
  },
  {
    id: 'message-queues-and-event-streaming',
    title: 'Message Queues & Event Streaming (Kafka vs RabbitMQ vs SQS)',
    category: 'Asynchronous & Messaging',
    icon: 'Radio',
    summary: 'Decoupling services asynchronously, absorbing traffic spikes, managing backpressure, event-driven architectures, and achieving exactly-once processing semantics.',
    readTime: '18 min read',
    diagram: {
      nodes: [
        { id: 'order_service', label: 'Order Placement Service', type: 'service', x: 8, y: 50, description: 'Processes user checkout transactions' },
        { id: 'outbox_db', label: 'PostgreSQL (Transactional Outbox)', type: 'database', x: 28, y: 75, description: 'Commits business records and outbox_events in the SAME local ACID transaction', techStack: ['PostgreSQL'] },
        { id: 'debezium', label: 'Debezium CDC Connector', type: 'worker', x: 45, y: 75, description: 'Tails Postgres WAL change data capture without polling overhead', techStack: ['Debezium', 'Kafka Connect'] },
        { id: 'kafka_broker', label: 'Kafka Cluster (Orders Topic)', type: 'queue', x: 50, y: 40, description: 'Distributed partitioned commit log with strict per-partition ordering', techStack: ['Apache Kafka', 'KRaft'], scaleMetric: '1M events/sec' },
        { id: 'inventory_consumer', label: 'Inventory Consumer Group', type: 'worker', x: 82, y: 20, description: 'Deducts warehouse stock (Idempotent Consumer)', techStack: ['Go Consumer'] },
        { id: 'payment_consumer', label: 'Payment Consumer Group', type: 'worker', x: 82, y: 45, description: 'Initiates payment gateway capture', techStack: ['Java Consumer'] },
        { id: 'dlq', label: 'Dead Letter Queue (DLQ)', type: 'queue', x: 82, y: 75, description: 'Holds poisoned messages that failed after 5 retries with backoff', techStack: ['Kafka DLQ Topic'] }
      ],
      edges: [
        { id: 'e1', from: 'order_service', to: 'outbox_db', label: '1. ACID Transaction', protocol: 'SQL' },
        { id: 'e2', from: 'outbox_db', to: 'debezium', label: '2. WAL Change Stream', protocol: 'SQL' },
        { id: 'e3', from: 'debezium', to: 'kafka_broker', label: '3. Publish Event', protocol: 'Internal RPC' },
        { id: 'e4', from: 'kafka_broker', to: 'inventory_consumer', label: '4. Consume Partition 0', protocol: 'Internal RPC' },
        { id: 'e5', from: 'kafka_broker', to: 'payment_consumer', label: '4. Consume Partition 1', protocol: 'Internal RPC' },
        { id: 'e6', from: 'payment_consumer', to: 'dlq', label: '5. Poison Message to DLQ', protocol: 'Internal RPC', isAsync: true }
      ],
      flowSteps: [
        { step: 1, title: 'Transactional Outbox Atomic Commit', description: 'Order Service writes to orders table and outbox_events table in a single local database transaction.', activeNodes: ['order_service', 'outbox_db'], highlightDetails: 'Solves the Dual-Write Problem: avoids inconsistent states if app crashes before queue publish.', latencyEstimate: '5-10ms' },
        { step: 2, title: 'Zero-Overhead CDC Ingestion', description: 'Debezium tails the database Write-Ahead Log (WAL) and publishes OrderCreated events to Kafka topic.', activeNodes: ['outbox_db', 'debezium', 'kafka_broker'], highlightDetails: 'Zero polling load on production database; sub-millisecond event streaming.', latencyEstimate: '2-5ms' },
        { step: 3, title: 'Partitioned Parallel Consumption', description: 'Kafka routes messages with partition key = order_id to specific partitions, ensuring strict FIFO ordering per order.', activeNodes: ['kafka_broker', 'inventory_consumer', 'payment_consumer'], highlightDetails: 'Independent consumer groups advance their own committed offsets independently.', latencyEstimate: '2-5ms' },
        { step: 4, title: 'Fault Isolation via Dead Letter Queue', description: 'If a poisoned message fails processing after exponential retries, it is forwarded to DLQ, unblocking the partition.', activeNodes: ['payment_consumer', 'dlq'], highlightDetails: 'Alerts on-call engineers while normal orders continue processing uninterrupted.', latencyEstimate: '1ms' }
      ]
    },
    keyConcepts: [
      {
        name: 'Message Queues (RabbitMQ/SQS) vs Event Streaming (Apache Kafka/Pulsar)',
        explanation: 'Traditional Message Queue (RabbitMQ, AWS SQS):\n- Focuses on individual message delivery to workers.\n- Messages are acknowledged and deleted from the queue once processed.\n- Complex routing (Topic, Fanout, Direct exchanges) via AMQP.\n- Best for: Background job processing, task queues (email sending, image resizing).\n\nEvent Streaming Platform (Apache Kafka, AWS Kinesis):\n- Distributed, append-only partitioned commit log.\n- Messages are retained for days/weeks/indefinitely, regardless of whether they have been read.\n- Consumers track their own Offset pointer in the log. Multiple independent consumer groups can read the same stream at different speeds and replay historic events.\n- Best for: High-throughput event sourcing, real-time analytics, change data capture (CDC), financial audit logs.',
        prosAndCons: {
          pros: [
            'RabbitMQ: Rich routing keys, fine-grained message acknowledgment, low setup complexity',
            'Kafka: Millions of events/sec throughput via sequential disk I/O, zero-copy OS transfers, and persistent replayability'
          ],
          cons: [
            'RabbitMQ: Throughput degrades when queues grow to millions of unacknowledged messages',
            'Kafka: Steeper operational curve (partitions, consumer rebalancing, ZooKeeper/KRaft consensus)'
          ]
        }
      },
      {
        name: 'Delivery Guarantees & Idempotency',
        explanation: '1. At-Most-Once: Message delivered 0 or 1 time. If worker crashes during processing, message is lost. Fast, no duplicates.\n2. At-Least-Once: Message delivered 1 or more times. Producer retries until ACK received. Duplicates can occur if network ACK drops. (Industry standard!)\n3. Exactly-Once: Message delivered and processed effectively once. Achieved via Idempotent Consumers (checking unique idempotency_key or transaction log before applying state changes).',
        prosAndCons: {
          pros: ['Idempotent consumers guarantee safe retries without accidental double-charges in payment flows'],
          cons: ['Distributed transactions across queue and DB require transactional outbox pattern']
        },
        codeSnippet: `// Transactional Outbox Pattern: Atomic DB & Event Publishing
BEGIN TRANSACTION;
  -- 1. Insert order into business table
  INSERT INTO orders (id, user_id, amount, status) VALUES ('ord_102', 'usr_42', 99.00, 'PENDING');
  
  -- 2. Insert event into outbox table in SAME ACID transaction
  INSERT INTO outbox_events (id, aggregate_type, aggregate_id, payload, created_at)
  VALUES (gen_random_uuid(), 'Order', 'ord_102', '{"event":"OrderCreated","amount":99.00}', NOW());
COMMIT;

-- 3. CDC engine (Debezium / polling worker) tails outbox_events and publishes to Kafka!`
      },
      {
        name: 'Backpressure, Partitioning & Dead Letter Queues (DLQ)',
        explanation: 'Kafka partitions dictate the maximum parallel consumer concurrency (1 consumer per partition per group). When a consumer fails to process a poisoned message after max retries with exponential backoff, it forwards the payload to a Dead Letter Queue (DLQ) for alerting and manual inspection, preventing queue blockages.',
        prosAndCons: {
          pros: ['DLQ isolates malformed messages without stopping the real-time processing pipeline'],
          cons: ['Requires dedicated monitoring and reprocessing tooling for dead-lettered messages']
        }
      }
    ],
    cheatSheet: [
      'Partition Key: Kafka routes all messages with the same partition key (e.g. order_id) to the same partition, guaranteeing strict order within that key.',
      'Consumer Rebalancing: Triggered when a consumer joins/leaves a group or fails heartbeats; minimize rebalance storms by tuning max.poll.interval.ms.',
      'Always design downstream consumers to be idempotent (e.g. SQL UPSERT or checking Redis SET of processed event IDs).'
    ],
    commonMistakes: [
      'Assuming Kafka guarantees global ordering across all partitions (it only guarantees ordering strictly per-partition).',
      'Having more consumers in a group than partitions in a topic (extra consumers sit completely idle).',
      'Publishing to message queue directly inside HTTP request handler without DB transaction (risk of split brain if network crashes).'
    ],
    interviewTips: [
      'Use Kafka whenever the prompt asks for real-time analytics, event sourcing, or handling >50,000 writes/sec.',
      'Mention the Transactional Outbox Pattern to solve the dual-write problem between database commits and message queue publishes.'
    ]
  },
  {
    id: 'distributed-storage-and-object-stores',
    title: 'Object Storage & Distributed File Systems (S3 / HDFS / Blob)',
    category: 'Data Storage & Partitioning',
    icon: 'HardDrive',
    summary: 'Architecting petabyte-scale unstructured media storage, chunking, multipart parallel uploads, pre-signed URLs, deduplication, and metadata separation.',
    readTime: '13 min read',
    diagram: {
      nodes: [
        { id: 'client_uploader', label: 'Client (Web / Mobile)', type: 'client', x: 8, y: 50, description: 'Uploads 500MB video file' },
        { id: 'api_server', label: 'API Gateway & Token Signer', type: 'gateway', x: 30, y: 25, description: 'Generates secure pre-signed PUT URLs with 15-minute validity', techStack: ['Node.js', 'AWS SDK'] },
        { id: 'metadata_db', label: 'Metadata Database (PostgreSQL)', type: 'database', x: 30, y: 75, description: 'Stores file metadata: user_id, status (PENDING), size, S3 bucket path', techStack: ['PostgreSQL'] },
        { id: 's3_storage', label: 'Distributed Object Storage (S3)', type: 'storage', x: 60, y: 50, description: 'Stores immutable binary chunks with 11 9s durability across 3 availability zones', techStack: ['AWS S3', 'MinIO'], scaleMetric: '99.999999999% Durability' },
        { id: 's3_events', label: 'S3 Event Notification (SQS)', type: 'queue', x: 85, y: 25, description: 'Receives s3:ObjectCreated:Put event triggers', techStack: ['AWS SQS'] },
        { id: 'transcoder', label: 'Video Transcoder Worker Cluster', type: 'worker', x: 85, y: 75, description: 'Pulls raw video chunks, transcodes into HLS/DASH 1080p/720p', techStack: ['FFmpeg', 'Spot K8s'] }
      ],
      edges: [
        { id: 'e1', from: 'client_uploader', to: 'api_server', label: '1. POST /presign', protocol: 'HTTPS' },
        { id: 'e2', from: 'api_server', to: 'metadata_db', label: '2. Create Record', protocol: 'SQL' },
        { id: 'e3', from: 'api_server', to: 'client_uploader', label: '3. Return S3 Signed URL', protocol: 'HTTPS' },
        { id: 'e4', from: 'client_uploader', to: 's3_storage', label: '4. Direct Binary PUT (Multi-part)', protocol: 'HTTPS' },
        { id: 'e5', from: 's3_storage', to: 's3_events', label: '5. ObjectCreated Notification', protocol: 'Async Queue', isAsync: true },
        { id: 'e6', from: 's3_events', to: 'transcoder', label: '6. Process Transcoding', protocol: 'Internal RPC', isAsync: true }
      ],
      flowSteps: [
        { step: 1, title: 'Pre-Signed URL Generation', description: 'Client requests permission to upload file. API server verifies auth and signs an S3 URL with HMAC credentials.', activeNodes: ['client_uploader', 'api_server', 'metadata_db'], highlightDetails: 'Backend server never touches the heavy binary payload, saving bandwidth and RAM.', latencyEstimate: '10ms' },
        { step: 2, title: 'Direct Parallel Multipart Upload', description: 'Client streams 5MB chunks directly to closest S3 edge endpoint in parallel via HTTP PUT.', activeNodes: ['client_uploader', 's3_storage'], highlightDetails: 'Resumable uploads: if connection drops, only failed 5MB chunks are retried.', latencyEstimate: 'Network Dependent' },
        { step: 3, title: 'Event-Driven Async Processing', description: 'Once S3 assembles all chunks, it fires an ObjectCreated event to SQS, triggering async transcoding workers.', activeNodes: ['s3_storage', 's3_events', 'transcoder'], highlightDetails: 'Decoupled worker tier scales elastically based on SQS queue depth.', latencyEstimate: '50-100ms' }
      ]
    },
    keyConcepts: [
      {
        name: 'Block Storage vs File Storage vs Object Storage',
        explanation: 'Block Storage (EBS, SAN): Raw storage volumes split into fixed blocks. High IOPS, formatted with OS filesystem (ext4), attached to single instance.\nFile Storage (NFS, EFS): Hierarchical folder structure, POSIX compliance, shared across multiple servers concurrently.\nObject Storage (AWS S3, Google Cloud Storage, MinIO): Flat namespace of immutable objects accessed via HTTP/REST APIs. Metadata and data stored together. Designed for 99.999999999% (11 9s) durability, unlimited horizontal scalability, and low cost per GB.',
        prosAndCons: {
          pros: ['Object storage is virtually infinite, highly durable across multiple availability zones, and natively integrates with CDNs'],
          cons: ['Objects are immutable (cannot modify byte 50 of an object; must overwrite entire object)']
        }
      },
      {
        name: 'Direct Client Uploads via Pre-Signed S3 URLs',
        explanation: 'Instead of routing 2GB video uploads through application backend servers (which exhausts server RAM, network bandwidth, and HTTP worker threads), the client requests a temporary, cryptographically signed pre-signed URL from API Gateway. The client then uploads the binary payload directly to S3 via HTTP PUT.',
        prosAndCons: {
          pros: ['Zero upload bandwidth or memory overhead on backend web servers', 'Enables multipart chunked uploads directly to nearest S3 edge bucket'],
          cons: ['Backend must validate file metadata after upload completes via S3 Event Notification (S3 -> SQS -> Worker)']
        },
        codeSnippet: `// S3 Direct Upload Flow:
// 1. Client calls: POST /api/v1/uploads/presign { filename: "vid.mp4", size: 104857600 }
// 2. Server generates secure pre-signed PUT URL with 15-minute expiration
// 3. Client executes: PUT https://bucket.s3.amazonaws.com/uploads/vid.mp4?AWSAccessKeyId=...
// 4. S3 triggers ObjectCreated webhook -> SQS -> Video Transcoding Worker Cluster`
      },
      {
        name: 'Chunking & Content-Addressable Storage (CAS)',
        explanation: 'Systems like Dropbox and Google Drive divide large files into 4MB chunks, compute SHA-256 hash for each chunk, and store them in Object Storage with key = hash. If two users upload identical files or identical chunks across edits, the system stores the chunk once (Deduplication), saving up to 60% storage.',
        prosAndCons: {
          pros: ['Drastic storage and bandwidth savings', 'Resumable uploads: if upload fails, only missing 4MB chunks are resent'],
          cons: ['Requires chunk index database to track file-to-chunk mapping and reference counts']
        }
      }
    ],
    cheatSheet: [
      'Durability vs Availability: Durability is probability of not losing data (e.g. 11 9s via erasure coding across 3+ data centers); Availability is uptime (e.g. 99.9%).',
      'S3 Lifecycle Rules: Transition older objects from S3 Standard -> S3 Infrequent Access (IA) -> S3 Glacier to save up to 80% cost.',
      'Metadata Separation: Never store business queries in object storage; store object metadata (size, owner, mime, tags, S3 URI) in PostgreSQL or DynamoDB.'
    ],
    commonMistakes: [
      'Streaming large file uploads through backend microservice instances instead of using Pre-signed URLs.',
      'Scanning S3 buckets synchronously to list files (listing 10M keys in S3 takes hours; query metadata DB instead).'
    ],
    interviewTips: [
      'Whenever designing video, photo, or file sharing platforms (YouTube, Instagram, Dropbox), explicitly state: "Media files are stored in S3/Object Storage with pre-signed URLs, while metadata is indexed in a relational/document database."'
    ]
  },
  {
    id: 'consensus-and-distributed-locking',
    title: 'Distributed Consensus & Coordination (Raft, Paxos, Zookeeper, etcd)',
    category: 'Reliability & Scaling',
    icon: 'Cpu',
    summary: 'Solving leader election, split-brain protection, distributed mutual exclusion locks, configuration management, and the Raft consensus algorithm.',
    readTime: '15 min read',
    diagram: {
      nodes: [
        { id: 'worker_1', label: 'Application Worker 1', type: 'worker', x: 8, y: 30, description: 'Attempting to acquire lock for Flash Sale checkout' },
        { id: 'worker_2', label: 'Application Worker 2', type: 'worker', x: 8, y: 70, description: 'Concurrent worker attempting same lock' },
        { id: 'raft_leader', label: 'Raft Leader (etcd / Zookeeper)', type: 'service', x: 45, y: 50, description: 'Coordinates distributed consensus and issues sequential fencing tokens', techStack: ['etcd', 'Raft Consensus'], scaleMetric: 'Quorum Q = N/2 + 1' },
        { id: 'raft_node_1', label: 'Raft Follower 1', type: 'service', x: 75, y: 25, description: 'Maintains replicated log and participates in leader election', techStack: ['etcd'] },
        { id: 'raft_node_2', label: 'Raft Follower 2', type: 'service', x: 75, y: 75, description: 'Maintains replicated log and participates in leader election', techStack: ['etcd'] },
        { id: 'db_target', label: 'Target Database (Inventory)', type: 'database', x: 45, y: 90, description: 'Guarded resource checking Fencing Token > current_version', techStack: ['PostgreSQL'] }
      ],
      edges: [
        { id: 'e1', from: 'worker_1', to: 'raft_leader', label: '1. Acquire Lock + Lease', protocol: 'gRPC' },
        { id: 'e2', from: 'raft_leader', to: 'raft_node_1', label: '2. AppendEntries Consensus', protocol: 'Internal RPC' },
        { id: 'e3', from: 'raft_leader', to: 'raft_node_2', label: '2. AppendEntries Consensus', protocol: 'Internal RPC' },
        { id: 'e4', from: 'raft_leader', to: 'worker_1', label: '3. Grant Lock (Token: 42)', protocol: 'gRPC' },
        { id: 'e5', from: 'worker_2', to: 'raft_leader', label: '4. Lock Blocked (Watch Key)', protocol: 'gRPC' },
        { id: 'e6', from: 'worker_1', to: 'db_target', label: '5. Write with Version=42', protocol: 'SQL' }
      ],
      flowSteps: [
        { step: 1, title: 'Consensus Lock Acquisition', description: 'Worker 1 requests a distributed mutex lease. Raft Leader replicates lock entry across majority quorum of nodes.', activeNodes: ['worker_1', 'raft_leader', 'raft_node_1', 'raft_node_2'], highlightDetails: 'Consensus ensures lock ownership survives even if one etcd node crashes.', latencyEstimate: '2-5ms' },
        { step: 2, title: 'Fencing Token Generation', description: 'Leader grants lock with a monotonically increasing Fencing Token (version = 42).', activeNodes: ['raft_leader', 'worker_1'], highlightDetails: 'Defends against long GC pause race conditions identified in Martin Kleppmann research.', latencyEstimate: '1ms' },
        { step: 3, title: 'Conflict Mitigation & Monotonic Write', description: 'Worker 2 is queued on an etcd Watcher. Worker 1 writes to DB with WHERE version < 42.', activeNodes: ['worker_2', 'worker_1', 'db_target'], highlightDetails: 'If Worker 1 stalled due to GC pause, any delayed stale write is rejected by the database.', latencyEstimate: '5ms' }
      ]
    },
    keyConcepts: [
      {
        name: 'The Distributed Coordination Problem & Split-Brain',
        explanation: 'In distributed clusters, network partitions can cause two nodes to each believe they are the legitimate leader (Split-Brain), leading to concurrent conflicting writes and data corruption. Consensus algorithms like Raft and Paxos ensure agreement across a majority quorum (Q = N/2 + 1) of nodes.',
        prosAndCons: {
          pros: ['Guarantees strong linearizable consistency and automatic failover without human intervention'],
          cons: ['Requires odd number of nodes (3, 5, or 7). Write latency bound by network round-trip to majority']
        }
      },
      {
        name: 'Raft Consensus Algorithm Fundamentals',
        explanation: 'Raft divides consensus into 3 decomposed subproblems:\n1. Leader Election: Nodes start as Followers with randomized election timeouts (150-300ms). If no heartbeat received, a node becomes Candidate and requests votes. First to get majority votes becomes Leader.\n2. Log Replication: Leader receives client commands, appends to its log, broadcasts AppendEntries RPC. Once majority replicas write entry, Leader commits and responds to client.\n3. Safety: A node can only be elected Leader if its log contains all committed entries (Log Completeness).',
        prosAndCons: {
          pros: ['Easier to understand and implement than Multi-Paxos', 'Formal correctness guarantees'],
          cons: ['Leader bottleneck under extreme write concurrency (mitigated by multi-Raft groups like TiKV)']
        }
      },
      {
        name: 'Distributed Locking: Redis Redlock vs etcd/ZooKeeper Leases',
        explanation: 'Distributed locks ensure only one worker processes a critical resource (e.g. inventory checkout) across multiple servers.\n- etcd / ZooKeeper: Strong consistency via Raft/ZAB. Creates ephemeral sequential nodes with heartbeat leases. If node crashes, lease expires and next waiting node is notified via Watcher. Safe and robust.\n- Redis Redlock: Acquires lock on N independent Redis masters with random value + TTL. Fast, but controversial in academic circles due to clock drift and GC pause risks (Martin Kleppmann critique: use Fencing Tokens).',
        prosAndCons: {
          pros: ['Fencing tokens (monotonically increasing version counter) ensure stale delayed writes are rejected by storage tier'],
          cons: ['Naive locks without fencing or heartbeat renewal can release lock while worker is still processing']
        },
        codeSnippet: `// Distributed Locking with Fencing Token in etcd
const lease = client.lease(10); // 10-second lease
const lock = await client.lock("resource/flash_sale_item_99").acquire({ lease });
const fencingToken = lock.revision; // Monotonically increasing revision counter

// Pass fencingToken to DB write:
// UPDATE inventory SET quantity = quantity - 1 WHERE id = 99 AND version < fencingToken;`
      }
    ],
    cheatSheet: [
      'Quorum Math: 3 nodes tolerate 1 failure; 5 nodes tolerate 2 failures; 7 nodes tolerate 3 failures.',
      'Use etcd for service discovery, Kubernetes cluster state, and distributed mutexes; use ZooKeeper for Kafka (legacy) and HBase.',
      'Always use Fencing Tokens with distributed locks to defend against long garbage collection (GC) pause race conditions.'
    ],
    commonMistakes: [
      'Deploying an even number of consensus nodes (e.g. 4 nodes still only tolerates 1 failure and increases network overhead).',
      'Using distributed locks for long-running batch jobs (10+ minutes); use database status state machines instead.'
    ],
    interviewTips: [
      'Mention fencing tokens when discussing distributed locking in concurrency-critical designs like Amazon Flash Sale or Ticketmaster.'
    ]
  },
  {
    id: 'search-engines-and-indexing',
    title: 'Search Engines, Inverted Indexes & Vector Search',
    category: 'Search & Big Data',
    icon: 'Search',
    summary: 'Full-text search mechanics, Lucene inverted index internals, tokenization, BM25 ranking, and modern Vector Embeddings for semantic AI similarity.',
    readTime: '14 min read',
    diagram: {
      nodes: [
        { id: 'user_search', label: 'User Search Query', type: 'client', x: 8, y: 35, description: 'Searches e.g. "lightweight running shoes"' },
        { id: 'search_gateway', label: 'Search Query Gateway', type: 'service', x: 30, y: 35, description: 'Analyzes query tokens, stems words, and dispatches to hybrid search backends', techStack: ['Go', 'Lucene Analyzer'] },
        { id: 'db_source', label: 'Primary PostgreSQL Database', type: 'database', x: 8, y: 75, description: 'System of record for product catalog', techStack: ['PostgreSQL'] },
        { id: 'cdc_pipeline', label: 'Kafka CDC Pipeline (Debezium)', type: 'queue', x: 30, y: 75, description: 'Streams DB changes to keep search indexes in sync without dual-writes', techStack: ['Debezium', 'Kafka'] },
        { id: 'es_cluster', label: 'Elasticsearch (Inverted Index)', type: 'search', x: 60, y: 35, description: 'Inverted index posting lists with BM25 term frequency relevance ranking', techStack: ['Elasticsearch 8', 'OpenSearch'], scaleMetric: '<15ms P99' },
        { id: 'vector_db', label: 'Vector Database (pgvector / HNSW)', type: 'search', x: 60, y: 75, description: 'High-dimensional embeddings for semantic and visual similarity', techStack: ['Qdrant', 'pgvector'] },
        { id: 'reranker', label: 'Hybrid Reranker (Reciprocal Rank Fusion)', type: 'worker', x: 86, y: 55, description: 'Combines BM25 exact match and Vector cosine similarity for final search ranking', techStack: ['RRF Algorithm'] }
      ],
      edges: [
        { id: 'e1', from: 'db_source', to: 'cdc_pipeline', label: '1. Capture Insert/Update', protocol: 'SQL' },
        { id: 'e2', from: 'cdc_pipeline', to: 'es_cluster', label: '2. Index Terms', protocol: 'Internal RPC' },
        { id: 'e3', from: 'cdc_pipeline', to: 'vector_db', label: '2. Generate Embeddings', protocol: 'Internal RPC' },
        { id: 'e4', from: 'user_search', to: 'search_gateway', label: '3. Execute Search', protocol: 'HTTPS' },
        { id: 'e5', from: 'search_gateway', to: 'es_cluster', label: '4. BM25 Query', protocol: 'Internal RPC' },
        { id: 'e6', from: 'search_gateway', to: 'vector_db', label: '4. Cosine KNN Query', protocol: 'Internal RPC' },
        { id: 'e7', from: 'es_cluster', to: 'reranker', label: '5. Merge Scores', protocol: 'Internal RPC' },
        { id: 'e8', from: 'vector_db', to: 'reranker', label: '5. Merge Scores', protocol: 'Internal RPC' }
      ],
      flowSteps: [
        { step: 1, title: 'Asynchronous CDC Indexing', description: 'When products are modified in Postgres, Debezium streams CDC events via Kafka to update Elasticsearch and Vector DB.', activeNodes: ['db_source', 'cdc_pipeline', 'es_cluster', 'vector_db'], highlightDetails: 'Eliminates application dual-write failure modes while maintaining sub-second index freshness.', latencyEstimate: '50-200ms' },
        { step: 2, title: 'Query Analysis & Tokenization', description: 'User search query is tokenized, stripped of stop words, and stemmed (e.g. "running" -> "run").', activeNodes: ['user_search', 'search_gateway'], highlightDetails: 'Analyzers prepare exact term tokens and invoke embedding model for semantic search.', latencyEstimate: '2ms' },
        { step: 3, title: 'Hybrid BM25 + Vector Retrieval', description: 'Query hits Elasticsearch inverted index posting lists and Vector DB HNSW index concurrently.', activeNodes: ['search_gateway', 'es_cluster', 'vector_db'], highlightDetails: 'Posting list bitwise intersection delivers sub-10ms keyword precision.', latencyEstimate: '10-15ms' },
        { step: 4, title: 'Reciprocal Rank Fusion (RRF)', description: 'Reranker merges BM25 keyword matches with semantic vector results to produce the top 20 relevant products.', activeNodes: ['es_cluster', 'vector_db', 'reranker', 'user_search'], highlightDetails: 'Achieves both high keyword precision and robust natural language understanding.', latencyEstimate: '5ms' }
      ]
    },
    keyConcepts: [
      {
        name: 'Inverted Index & Text Analysis Pipeline',
        explanation: 'Standard databases index Document -> Terms. An Inverted Index flips this to Term -> List of Document IDs (Posting List).\nText Analysis Pipeline:\n1. Character Filter: Strip HTML tags, special chars.\n2. Tokenizer: Split sentences into words ("system design" -> ["system", "design"]).\n3. Token Filters: Lowercase, remove Stop Words ("the", "is"), and Stemming ("running", "runs" -> "run" via Porter Stemmer).',
        prosAndCons: {
          pros: ['Sub-10ms full-text keyword searches across billions of documents', 'Posting lists support fast Boolean intersection and union via bitwise operations'],
          cons: ['High write latency and disk space overhead compared to raw key-value storage']
        }
      },
      {
        name: 'BM25 (Best Matching 25) vs Vector Search',
        explanation: 'BM25 calculates keyword relevance based on Term Frequency (TF - how often word appears in doc) and Inverse Document Frequency (IDF - how rare word is across entire corpus).\nVector Search (HNSW / Milvus / Pinecone / pgvector): Converts text/images into high-dimensional vector embeddings (e.g. 1536 floats via embedding model). Finds semantically similar items using Cosine Similarity or Approximate Nearest Neighbors (ANN), enabling natural language search ("warm winter clothing" finds "down jackets").',
        prosAndCons: {
          pros: ['Hybrid Search (BM25 + Vector Search) gives the best of exact keyword precision and semantic understanding'],
          cons: ['Vector indexes require large RAM footprints and specialized vector indexing structures (HNSW graphs)']
        },
        codeSnippet: `// Example: Inverted Index Structure
{
  "distributed": [ { docId: 1, pos: 2 }, { docId: 4, pos: 10 } ],
  "system":      [ { docId: 1, pos: 3 }, { docId: 2, pos: 1 }, { docId: 4, pos: 11 } ],
  "cache":       [ { docId: 2, pos: 5 }, { docId: 3, pos: 1 } ]
}
// Query: "distributed system" -> Intersect Posting Lists for "distributed" (1,4) & "system" (1,2,4) -> [1, 4]`
      }
    ],
    cheatSheet: [
      'Dual-Write vs CDC for Search Sync: Avoid writing to DB and Elasticsearch simultaneously in web app; use Change Data Capture (Debezium + Kafka) to asynchronously stream DB changes to Elasticsearch.',
      'Fuzzy Search: Handled via Levenshtein edit distance and N-gram tokenizers.',
      'Sharding in Elasticsearch: Primary shards are fixed at index creation; route search queries to replica shards to scale read QPS.'
    ],
    commonMistakes: [
      'Using SQL LIKE "%query%" queries in production databases instead of dedicated inverted indexes (causes full table scans).',
      'Treating Elasticsearch as the primary source of truth (ES is an auxiliary search index; keep durable records in SQL/NoSQL DB).'
    ],
    interviewTips: [
      'Whenever an interview question mentions "search bar", "auto-complete", or "filter by multiple tags", introduce Elasticsearch with an asynchronous CDC pipeline from the primary database.'
    ]
  },
  {
    id: 'resiliency-and-observability',
    title: 'Resiliency Patterns, Chaos Engineering & Observability',
    category: 'Reliability & Scaling',
    icon: 'Activity',
    summary: 'Building fault-tolerant systems: Circuit Breakers, Bulkheads, Exponential Backoff with Jitter, Distributed Tracing, and the RED/USE monitoring metrics.',
    readTime: '15 min read',
    diagram: {
      nodes: [
        { id: 'traffic', label: 'Client Ingress Requests', type: 'client', x: 8, y: 50, description: 'Production user traffic' },
        { id: 'circuit_breaker', label: 'Resilience4j Circuit Breaker', type: 'gateway', x: 32, y: 50, description: 'Monitors error rate sliding window (Closed -> Open -> Half-Open)', techStack: ['Resilience4j', 'Envoy Outlier'] },
        { id: 'flaky_svc', label: 'Downstream Payment Service', type: 'service', x: 60, y: 25, description: 'Experiencing 500 errors and high latency', techStack: ['Payment Microservice'] },
        { id: 'fallback_cache', label: 'Degraded Fallback Cache', type: 'cache', x: 60, y: 75, description: 'Returns cached recommendations or generic default payload', techStack: ['Redis Cache'] },
        { id: 'otel_agent', label: 'OpenTelemetry Collector', type: 'worker', x: 32, y: 85, description: 'Collects traces, RED metrics, and structured JSON logs', techStack: ['OpenTelemetry Collector'] },
        { id: 'jaeger_prom', label: 'Prometheus & Jaeger Observability', type: 'search', x: 60, y: 90, description: 'Traces request spans across microservices and fires P99 latency alerts', techStack: ['Prometheus', 'Jaeger', 'Grafana'] }
      ],
      edges: [
        { id: 'e1', from: 'traffic', to: 'circuit_breaker', label: '1. Inbound Request', protocol: 'HTTPS' },
        { id: 'e2', from: 'circuit_breaker', to: 'flaky_svc', label: '2. Normal Call (Closed)', protocol: 'Internal RPC' },
        { id: 'e3', from: 'circuit_breaker', to: 'fallback_cache', label: '3. Fast-Fail Fallback (Open)', protocol: 'Internal RPC' },
        { id: 'e4', from: 'circuit_breaker', to: 'otel_agent', label: '4. Trace Context & Metrics', protocol: 'Internal RPC', isAsync: true },
        { id: 'e5', from: 'otel_agent', to: 'jaeger_prom', label: '5. Scrape Metrics', protocol: 'Internal RPC', isAsync: true }
      ],
      flowSteps: [
        { step: 1, title: 'Closed State Normal Operations', description: 'Under normal conditions, circuit is CLOSED. Requests flow to downstream payment microservice.', activeNodes: ['traffic', 'circuit_breaker', 'flaky_svc'], highlightDetails: 'OpenTelemetry agent records latency spans with W3C Trace Context headers.', latencyEstimate: '10ms' },
        { step: 2, title: 'Threshold Breach & Circuit Trip', description: 'If error rate exceeds 50% over a 10-second rolling window, the circuit trips to OPEN.', activeNodes: ['circuit_breaker', 'flaky_svc'], highlightDetails: 'Protects the struggling downstream service from cascading overload.', latencyEstimate: '0.1ms' },
        { step: 3, title: 'Fast-Fail Graceful Degradation', description: 'Subsequent calls fail immediately without calling downstream service, returning cached fallback.', activeNodes: ['circuit_breaker', 'fallback_cache', 'traffic'], highlightDetails: 'Zero latency degradation for users while downstream service recovers.', latencyEstimate: '1ms' },
        { step: 4, title: 'Half-Open Probe & Automated Recovery', description: 'After 30-second cooldown, circuit transitions to HALF-OPEN and permits trial requests to confirm recovery.', activeNodes: ['circuit_breaker', 'flaky_svc', 'otel_agent', 'jaeger_prom'], highlightDetails: 'If trial requests succeed, circuit automatically resets to CLOSED.', latencyEstimate: '10ms' }
      ]
    },
    keyConcepts: [
      {
        name: 'Circuit Breaker Pattern',
        explanation: 'Prevents cascading failure when a downstream service is struggling.\n- Closed State: Normal operation. Requests pass through.\n- Open State: If error rate exceeds threshold (e.g. 50% failures over 10s), circuit trips Open. All subsequent requests fail fast immediately or return cached fallback without calling downstream service.\n- Half-Open State: After a cooldown timeout (e.g. 30s), a trial probe request is allowed. If successful, circuit resets to Closed; if fails, resets to Open.',
        prosAndCons: {
          pros: ['Gives failing downstream services breathing room to recover', 'Eliminates thread exhaustion and socket timeouts on upstream callers'],
          cons: ['Requires graceful degradation fallback logic (e.g. return cached recommendations or generic fallback)']
        }
      },
      {
        name: 'Exponential Backoff with Full Jitter',
        explanation: 'When retrying failed network requests, retrying immediately causes a Retry Storm (thundering herd) that keeps the recovering service permanently dead.\nExponential Backoff increases delay exponentially: t = min(cap, base * 2^attempt).\nFull Jitter adds randomness: sleep = random_between(0, t). This spreads retry requests evenly across time.',
        prosAndCons: {
          pros: ['Dramatically flattens traffic spikes during recovery periods'],
          cons: ['Increases overall tail latency (P99) for operations that experience multiple retries']
        },
        codeSnippet: `// Exponential Backoff with Full Jitter (AWS Recommended Pattern)
async function fetchWithRetry(fn: () => Promise<any>, maxRetries = 4, base = 100, cap = 3000) {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= maxRetries) throw err;
      const exponentialDelay = Math.min(cap, base * Math.pow(2, attempt));
      const sleepDuration = Math.random() * exponentialDelay; // Full Jitter!
      await new Promise(r => setTimeout(r, sleepDuration));
      attempt++;
    }
  }
}`
      },
      {
        name: 'Distributed Tracing & The Three Pillars of Observability',
        explanation: '1. Metrics (Prometheus, Datadog): Numerical aggregations over time (CPU %, QPS, Error Rate, P99 Latency).\n2. Logs (Loki, Elasticsearch): Structured JSON event streams with contextual metadata.\n3. Distributed Tracing (OpenTelemetry, Jaeger): Injects a unique Trace ID and Span ID into HTTP/gRPC headers (W3C Trace Context). Traces a single user request across 20 microservices, pinpointing exact bottlenecks.',
        prosAndCons: {
          pros: ['Cuts root-cause analysis time for P99 latency regressions from hours to seconds'],
          cons: ['High trace volume requires head/tail sampling strategies (e.g. sample 1% normal traces, 100% error traces)']
        }
      }
    ],
    cheatSheet: [
      'RED Method for Services: Rate (QPS), Errors (Failed requests/sec), Duration (Latency distribution P50/P90/P99).',
      'USE Method for Infrastructure: Utilization (% busy), Saturation (queue depth), Errors (hardware/network errors).',
      'Bulkhead Pattern: Isolate thread pools and connection pools per dependency so failure of payment service does not freeze browse service.'
    ],
    commonMistakes: [
      'Retrying non-idempotent operations (like POST /charge) without an idempotency key.',
      'Measuring only Average Latency (Averages hide the fact that 1% of your users are experiencing 10-second timeouts; always measure P99 and P99.9).'
    ],
    interviewTips: [
      'Conclude any system design interview by discussing monitoring, alerts, SLOs/SLAs (e.g. 99.99% uptime), circuit breakers, and disaster recovery.'
    ]
  }
];

export function getFundamentalById(id: string): FundamentalTopic | undefined {
  return FUNDAMENTAL_TOPICS.find((topic) => topic.id === id);
}
