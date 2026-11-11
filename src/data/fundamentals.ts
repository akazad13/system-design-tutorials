import { FundamentalTopic } from '../types/system-design';

export const FUNDAMENTAL_TOPICS: FundamentalTopic[] = [
  {
    id: 'dns-and-cdn',
    title: 'DNS, Anycast & Content Delivery Networks (CDN)',
    category: 'Networking & Routing',
    icon: 'Globe',
    summary: 'DNS and CDNs are the front door of every large web system. DNS turns a name like api.example.com into an IP address. A CDN keeps copies of content on servers close to users, so most requests never travel to your own data center. Anycast routing sends each user to the nearest of those servers.',
    readTime: '12 min read',
    diagram: {
      nodes: [
        { id: 'client', label: 'Client Browser', type: 'client', x: 8, y: 50, description: 'Asks for a web address such as api.example.com' },
        { id: 'resolver', label: 'Recursive Resolver (ISP / 8.8.8.8)', type: 'dns', x: 28, y: 25, description: 'Looks up the address for the client and caches the answer for the record TTL', techStack: ['Unbound', 'BIND'] },
        { id: 'root_tld', label: 'Root & TLD (.com) Servers', type: 'dns', x: 50, y: 15, description: 'Point the resolver to the name servers that own example.com' },
        { id: 'auth_dns', label: 'Authoritative GeoDNS', type: 'dns', x: 74, y: 25, description: 'Gives the final answer: the IP address closest to the user', techStack: ['AWS Route 53', 'Cloudflare'] },
        { id: 'cdn_pop', label: 'Anycast Edge CDN PoP', type: 'cdn', x: 50, y: 65, description: 'Nearby CDN server. It ends the TLS connection and serves cached content.', techStack: ['Cloudflare', 'CloudFront', 'Fastly'], scaleMetric: '<20ms Global TTFB' },
        { id: 'origin_server', label: 'Origin App Cluster', type: 'service', x: 85, y: 65, description: 'Your own servers. They answer only when the CDN does not have a fresh copy.', techStack: ['Nginx', 'K8s Cluster'] }
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
        { step: 1, title: 'Ask for the address', description: 'The browser asks a recursive resolver (often the ISP, or a public one such as 8.8.8.8) for the IP address of api.example.com.', activeNodes: ['client', 'resolver'], highlightDetails: 'If the resolver already has a cached answer that is still within its TTL, it replies at once.', latencyEstimate: '1-5ms' },
        { step: 2, title: 'Walk the DNS tree', description: 'On a cache miss, the resolver asks a root server, then the .com server, then the authoritative name server for example.com.', activeNodes: ['resolver', 'root_tld', 'auth_dns'], highlightDetails: 'GeoDNS on the authoritative server picks the IP address nearest to the user. It uses the client subnet when the resolver sends it (EDNS Client Subnet).', latencyEstimate: '10-30ms' },
        { step: 3, title: 'Connect to the nearest edge', description: 'The browser connects to that IP address. Because of Anycast, the network delivers the packets to the closest CDN point of presence (PoP).', activeNodes: ['client', 'cdn_pop'], highlightDetails: 'The TLS or QUIC handshake ends at the edge, so its round trips cover a short distance instead of crossing the world. This saves 100 ms or more.', latencyEstimate: '5-15ms' },
        { step: 4, title: 'Fetch from the origin on a miss', description: 'If the edge has no fresh copy, it fetches the file from the origin, stores it as the Cache-Control header allows, and returns it to the user.', activeNodes: ['cdn_pop', 'origin_server', 'client'], highlightDetails: 'The next users near this PoP get the cached copy. The origin does no work for them.', latencyEstimate: '20-50ms' }
      ]
    },
    keyConcepts: [
      {
        name: 'How DNS resolution works, and how DNS routes traffic',
        explanation: 'DNS (Domain Name System) translates a name such as api.example.com into an IP address. The lookup walks a tree: a recursive resolver asks a root server, which points to the .com server, which points to the authoritative name server for example.com. Every answer carries a TTL that says how long resolvers may cache it.\n\nThe authoritative server chooses the answer, so DNS can also steer traffic. Latency-based routing sends users to the fastest region. GeoDNS answers by country or region. Weighted routing sends a small share of users, for example 5%, to a new version (a canary release). Failover routing stops returning a region when it fails its health checks.',
        prosAndCons: {
          pros: [
            'Steers global traffic without any change to the application.',
            'Moves users to another region when a whole region fails (disaster recovery).',
            'Adds no load to your application servers.'
          ],
          cons: [
            'Changes take effect slowly. Resolvers and clients cache answers for the TTL, and some ignore short TTLs, so a change can take minutes or hours to reach everyone.',
            'DNS does not see live server load. It knows only what its health checks report.',
            'Without DNSSEC, attackers can poison resolver caches with fake answers. DNS servers are also common DDoS targets.'
          ]
        },
        codeSnippet: `// Example: Configuring DNS TTL vs Failover in Zone File
api.prod.example.com.   60   IN   A   198.51.100.24  ; Short TTL (60s) for active API endpoints
static.example.com.     86400 IN  CNAME d123.cloudfront.net. ; Long TTL (24h) for static assets CDN`
      },
      {
        name: 'How a CDN caches content at the edge',
        explanation: 'A CDN (content delivery network) is a set of proxy servers in many cities, and each location is called a point of presence (PoP). A user request reaches the nearest PoP through Anycast routing.\n\nIf the PoP has a fresh copy (a cache hit), it answers in about 10 to 20 ms. If not (a cache miss), it fetches the content from your origin server, stores it for as long as the Cache-Control header allows, and then answers.\n\nTwo headers matter most. s-maxage sets how long shared caches such as a CDN may keep the copy. stale-while-revalidate lets the CDN serve the old copy while it fetches a new one in the background.',
        prosAndCons: {
          pros: [
            'Removes 85 to 98% of origin traffic for images, video and other static files.',
            'Cuts time to first byte (TTFB) around the world, because TCP and TLS connections end close to the user.',
            'Absorbs DDoS floods (network and application level) at the edge, before they reach your servers.'
          ],
          cons: [
            'Cache invalidation is hard: purging a file from every PoP in the world takes time.',
            'Personalized pages cannot be cached as they are. They need edge compute (for example Cloudflare Workers or Lambda@Edge) or must bypass the cache.',
            'Bandwidth cost rises quickly if the cache hit ratio drops.'
          ]
        },
        codeSnippet: `// HTTP Caching Headers Best Practice
Cache-Control: public, max-age=31536000, immutable // For fingerprinted static bundles (app-v2.9a8.js)
Cache-Control: public, s-maxage=300, stale-while-revalidate=60 // For CDN Edge caching with background refresh`
      },
      {
        name: 'Anycast vs unicast routing',
        explanation: 'With unicast, one IP address belongs to one server. With anycast, many servers in different data centers announce the same IP address through BGP (Border Gateway Protocol), the routing system of the internet. Routers then deliver each packet to the nearest of those servers, measured by network path rather than by distance on a map.',
        prosAndCons: {
          pros: [
            'Spreads users across locations automatically.',
            'If one PoP fails, BGP stops announcing its route, and traffic flows to the next nearest PoP.'
          ],
          cons: [
            'If routes change in the middle of a long TCP connection, packets can reach a different server that does not know the connection. QUIC connection IDs or stateless edge proxies solve this.'
          ]
        }
      }
    ],
    cheatSheet: [
      'TTL: use a short TTL (about 60 s) for records you may need to fail over, and a long TTL (about 86,400 s, one day) for stable records such as CDN aliases.',
      'Edge compute (Cloudflare Workers, Fastly Compute, CloudFront Functions) runs small pieces of code at the PoP, for example routing, token checks and A/B tests.',
      'stale-while-revalidate lets the CDN serve a slightly old copy at once while it fetches a fresh one, so users never wait for the origin.'
    ],
    commonMistakes: [
      'Using DNS for fine-grained load balancing or instant failover. Many resolvers ignore low TTLs, so some users keep the old address for a long time.',
      'Forgetting Cache-Control: no-transform on media, so proxies re-compress files that are already compressed or change the payload.',
      'Not enabling HTTP/2 or HTTP/3 (QUIC) at the CDN edge, which loses request multiplexing and connection migration.'
    ],
    interviewTips: [
      'For any global system, start your high-level diagram with DNS and a CDN in front of everything else.',
      'Put a number on what the CDN saves. For example: at a 95% hit ratio, origin egress drops from 500 TB to 25 TB per month.'
    ]
  },
  {
    id: 'load-balancers-and-proxies',
    title: 'Load Balancers & Reverse Proxies (L4 vs L7)',
    category: 'Networking & Routing',
    icon: 'Network',
    summary: 'A load balancer spreads incoming requests over many servers, so no single server is overloaded and a failed server is taken out of rotation. A reverse proxy sits in front of your services and can also end TLS, route by URL path and add headers. Layer 4 balancers are fast and simple. Layer 7 balancers cost more CPU but understand HTTP.',
    readTime: '15 min read',
    diagram: {
      nodes: [
        { id: 'client', label: 'Client Ingress Traffic', type: 'client', x: 8, y: 50, description: 'Many users opening HTTP and TCP connections at the same time' },
        { id: 'l4_nlb', label: 'Layer 4 Network LB (IPVS/NLB)', type: 'load_balancer', x: 30, y: 50, description: 'Forwards TCP or UDP packets by IP address and port. It does not decrypt or read the request.', techStack: ['AWS NLB', 'IPVS', 'Maglev'], scaleMetric: 'Millions packets/sec' },
        { id: 'l7_alb_1', label: 'L7 Reverse Proxy 1 (Envoy)', type: 'gateway', x: 55, y: 30, description: 'Ends TLS, reads the HTTP request, routes by path and applies rate limits', techStack: ['Envoy Proxy', 'NGINX'] },
        { id: 'l7_alb_2', label: 'L7 Reverse Proxy 2 (Envoy)', type: 'gateway', x: 55, y: 70, description: 'Second proxy. Both proxies serve traffic at the same time (active-active), so one can fail safely.', techStack: ['Envoy Proxy', 'NGINX'] },
        { id: 'auth_svc', label: 'Auth Microservice', type: 'service', x: 85, y: 20, description: 'Receives requests for /api/auth', techStack: ['Go', 'K8s'] },
        { id: 'order_svc', label: 'Orders Microservice', type: 'service', x: 85, y: 50, description: 'Receives requests for /api/orders. The proxy picks the instance with the fewest open connections.', techStack: ['Java', 'K8s'] },
        { id: 'media_svc', label: 'Media Microservice', type: 'service', x: 85, y: 80, description: 'Receives streaming requests for /api/media', techStack: ['Rust', 'K8s'] }
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
        { step: 1, title: 'Spread packets (Layer 4)', description: 'TCP packets arrive at the Layer 4 load balancer. It hashes the connection details (source IP and port, destination IP and port, protocol) to pick one Layer 7 proxy.', activeNodes: ['client', 'l4_nlb'], highlightDetails: 'It never reads the payload, so it can forward packets at close to network speed.', latencyEstimate: '<0.5ms' },
        { step: 2, title: 'End TLS and read the request (Layer 7)', description: 'The Layer 7 proxy (Envoy) decrypts TLS and reads the HTTP request.', activeNodes: ['l4_nlb', 'l7_alb_1', 'l7_alb_2'], highlightDetails: 'The proxy adds an X-Forwarded-For header (the real client IP) and an X-Request-ID header (for distributed tracing).', latencyEstimate: '1-2ms' },
        { step: 3, title: 'Route by path', description: 'The proxy looks at the URL path and headers and sends the request to the right service. Inside that service, it picks the instance with the fewest active connections (weighted least connections).', activeNodes: ['l7_alb_1', 'auth_svc', 'order_svc'], highlightDetails: 'The proxy keeps connections open to each service (connection pooling), so it does not repeat TCP and TLS handshakes for every request.', latencyEstimate: '1-3ms' }
      ]
    },
    keyConcepts: [
      {
        name: 'Layer 4 vs Layer 7 load balancing',
        explanation: 'A Layer 4 load balancer (for example AWS NLB, IPVS, or HAProxy in TCP mode) works with IP addresses and ports only. It forwards packets without decrypting or reading them, so it uses little CPU and can handle millions of packets per second.\n\nA Layer 7 load balancer (for example AWS ALB, NGINX, Envoy or Traefik) works with the application protocol: HTTP, HTTPS, gRPC or WebSocket. It decrypts TLS and reads headers, cookies and the URL. This lets it route by path, rewrite headers and apply rate limits.',
        prosAndCons: {
          pros: [
            'Layer 4: very fast, low CPU cost, and passes TCP through unchanged.',
            'Layer 7: smart routing (for example /api/video to the video service and /api/auth to the auth service), TLS offloading, and sticky sessions with cookies.'
          ],
          cons: [
            'Layer 4: cannot route by URL path, cannot read cookies or headers, and cannot change the request.',
            'Layer 7: more CPU and memory per connection, because it decrypts TLS and parses HTTP.'
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
        name: 'Balancing algorithms and when to use each',
        explanation: 'The algorithm decides which server gets the next request. Round robin takes the servers in turn, which works when all requests cost about the same. Weighted round robin gives bigger servers a larger share.\n\nLeast connections picks the server with the fewest open connections, which suits long or uneven work such as WebSockets or heavy queries. IP hash always sends one client IP to the same server, which gives simple stickiness. Consistent hashing maps keys to servers so that adding or removing a server moves only a small share of the keys.',
        prosAndCons: {
          pros: ['With health checks and a suitable algorithm, an autoscaling group can grow from 5 to 500 instances without manual changes.'],
          cons: ['IP hash can overload one server when many users share one IP address, for example a company network behind a single NAT gateway.']
        }
      },
      {
        name: 'Keeping the load balancer itself available',
        explanation: 'A single load balancer is a single point of failure: if it stops, everything behind it stops. Self-managed setups run two machines that share a floating virtual IP (VIP). With VRRP and Keepalived, the standby machine takes over the VIP when heartbeats from the primary stop.\n\nManaged cloud load balancers (such as AWS ALB or NLB) already run in several availability zones. DNS or Anycast moves traffic away from a zone that fails.',
        prosAndCons: {
          pros: ['Failover in under a second when the primary machine fails.'],
          cons: ['Needs heartbeat monitoring and a floating virtual IP, which add setup work and new ways to fail.']
        }
      }
    ],
    cheatSheet: [
      'Two-tier pattern: a Layer 4 balancer at the outer edge for raw throughput, then Layer 7 proxies (Envoy or NGINX) that route to services by path.',
      'Keep connections open between the load balancer and the app servers (keepalive), so each request does not pay for new TCP and TLS handshakes.',
      'Use both kinds of health check: passive (watch real traffic for 5xx errors) and active (call /healthz every few seconds).'
    ],
    commonMistakes: [
      'Using round robin when request times vary a lot (for example 5 ms vs 5,000 ms). Slow requests pile up on some servers. Use least connections instead.',
      'Using sticky sessions in a stateless web app. They make autoscaling and deployments harder. Keep session state in a shared store instead.',
      'Forgetting to pass X-Forwarded-For and X-Forwarded-Proto, so services cannot see the real client IP or whether the request used HTTPS.'
    ],
    interviewTips: [
      'If asked how to remove the load balancer as a single point of failure, describe an active-standby pair with a floating VIP (Keepalived), or a managed multi-zone load balancer behind DNS or Anycast.',
      'Mention Envoy when the discussion turns to service meshes, distributed tracing or gRPC. gRPC sends many requests over one long HTTP/2 connection, so a Layer 4 balancer would pin them all to one server. gRPC needs per-request (Layer 7) balancing.'
    ]
  },
  {
    id: 'api-gateways-and-rate-limiting',
    title: 'API Gateways, Rate Limiting & Traffic Management',
    category: 'Compute & Proxies',
    icon: 'ShieldCheck',
    summary: 'An API gateway is the single front door for all client requests. It checks who the caller is, limits how fast each caller can send requests, and forwards each request to the right internal service. This keeps that shared work out of every individual service.',
    readTime: '14 min read',
    diagram: {
      nodes: [
        { id: 'client', label: 'Web & Mobile Clients', type: 'client', x: 8, y: 50, description: 'Send API requests (REST or GraphQL) with an access token' },
        { id: 'gateway', label: 'API Gateway (Kong / Envoy)', type: 'gateway', x: 35, y: 50, description: 'One entry point for all APIs: checks tokens, applies rate limits and translates protocols', techStack: ['Kong', 'Envoy', 'APISIX'], scaleMetric: '50,000 QPS' },
        { id: 'redis_token', label: 'Redis Rate Limiter Cluster', type: 'cache', x: 35, y: 15, description: 'Stores rate-limit state shared by all gateway instances. A Lua script checks and updates it in one atomic step.', techStack: ['Redis Cluster'], scaleMetric: '<1ms lookup' },
        { id: 'auth_jwt', label: 'IAM / Token Verifier', type: 'service', x: 60, y: 25, description: 'Publishes the public keys that verify token signatures, and the scopes each tenant may use', techStack: ['OIDC', 'OAuth2'] },
        { id: 'checkout_svc', label: 'Checkout Service', type: 'service', x: 85, y: 40, description: 'Internal business service, called over gRPC', techStack: ['Go', 'gRPC'] },
        { id: 'user_svc', label: 'User Account Service', type: 'service', x: 85, y: 70, description: 'Internal user profile service', techStack: ['Node.js', 'gRPC'] }
      ],
      edges: [
        { id: 'e1', from: 'client', to: 'gateway', label: '1. POST /checkout', protocol: 'HTTPS' },
        { id: 'e2', from: 'gateway', to: 'redis_token', label: '2. Consume Token', protocol: 'TCP' },
        { id: 'e3', from: 'gateway', to: 'auth_jwt', label: '3. Verify JWT Claims', protocol: 'Internal RPC' },
        { id: 'e4', from: 'gateway', to: 'checkout_svc', label: '4. Forward gRPC', protocol: 'gRPC' },
        { id: 'e5', from: 'gateway', to: 'user_svc', label: '4. Forward gRPC', protocol: 'gRPC' }
      ],
      flowSteps: [
        { step: 1, title: 'Request arrives', description: 'The client sends an HTTPS POST with a bearer token to the API gateway.', activeNodes: ['client', 'gateway'], highlightDetails: 'Clients see one address. The gateway hides how many internal services exist and where they run.', latencyEstimate: '2ms' },
        { step: 2, title: 'Check the rate limit', description: 'The gateway runs a Lua script in Redis that counts this caller’s recent requests and records the new one in a single atomic step.', activeNodes: ['gateway', 'redis_token'], highlightDetails: 'If the caller is over the limit (for example 100 requests per minute), the gateway rejects the request at once with HTTP 429 and a Retry-After header.', latencyEstimate: '1ms' },
        { step: 3, title: 'Verify the token and translate', description: 'The gateway checks the JWT signature with cached public keys, then converts the JSON request into Protobuf for the internal gRPC call.', activeNodes: ['gateway', 'auth_jwt'], highlightDetails: 'Services behind the gateway do not each need their own authentication code.', latencyEstimate: '1ms' },
        { step: 4, title: 'Forward to the service', description: 'The gateway sends the request over an open, shared gRPC connection to the Checkout Service.', activeNodes: ['gateway', 'checkout_svc'], highlightDetails: 'A circuit breaker stops calls to the service for a short time if its error rate goes above 50%, so the failure does not spread.', latencyEstimate: '5-15ms' }
      ]
    },
    keyConcepts: [
      {
        name: 'What an API gateway does',
        explanation: 'An API gateway is a reverse proxy between clients and your internal services. It does the work that every request needs, in one place.\n\nTypical jobs are routing requests to the right service, checking authentication tokens (for example JWTs), ending TLS, rate limiting, protocol translation (for example JSON over HTTP to gRPC inside), and central logging.\n\nA backend-for-frontend (BFF) is a gateway built for one kind of client. A mobile BFF can combine three service calls into one small response, because mobile networks are slow.',
        prosAndCons: {
          pros: [
            'Hides the internal network and service layout from the public internet.',
            'Removes duplicated authentication and logging code from dozens of services.',
            'Lets mobile and web clients get responses shaped for their own needs (BFF).'
          ],
          cons: [
            'Every request passes through it, so it must scale horizontally or it becomes a bottleneck and a single point of failure.',
            'Logic tends to pile up in the gateway over time, and some products lock you into one vendor.'
          ]
        }
      },
      {
        name: 'Rate limiting algorithms',
        explanation: 'A rate limiter caps how many requests a caller can make in a time window, to stop abuse and protect the services behind it. There are five common algorithms.\n1. Token bucket: a bucket holds up to N tokens and refills at r tokens per second. Each request takes one token. It allows short bursts up to N.\n2. Leaky bucket: requests wait in a queue that drains at a fixed rate, and new requests are dropped when the queue is full. It turns spiky traffic into a smooth flow.\n3. Fixed window counter: count requests per calendar minute. It is simple, but a caller can send the full limit at 0:59 and again at 1:00, which is 2× the limit in two seconds.\n4. Sliding window log: store the time of every request (for example in a Redis sorted set) and count the ones inside the last window. It is exact, but it uses memory for every request.\n5. Sliding window counter: keep only the counts for the current and previous windows, and weight the previous count by how much of it still overlaps. It is close to exact with only two counters.',
        prosAndCons: {
          pros: ['Protects databases and services from overload, abusive clients and some DDoS traffic.'],
          cons: ['With many gateway instances, the counters must live in shared storage such as Redis, which adds a network call to every request.']
        },
        codeSnippet: `-- Redis Lua script: atomic sliding window LOG (one sorted-set entry per request)
local key = KEYS[1]
local now = tonumber(ARGV[1])      -- current time in ms
local window = tonumber(ARGV[2])   -- window length in ms
local limit = tonumber(ARGV[3])
local member = ARGV[4]             -- unique request ID, so two requests in the same ms both count
local clearBefore = now - window

redis.call('ZREMRANGEBYSCORE', key, 0, clearBefore)
local currentRequests = redis.call('ZCARD', key)

if currentRequests < limit then
    redis.call('ZADD', key, now, member)
    redis.call('PEXPIRE', key, window)
    return 1 -- Allowed
else
    return 0 -- Rejected (HTTP 429 Too Many Requests)
end`
      }
    ],
    cheatSheet: [
      'Return the standard headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, and Retry-After on every 429.',
      'Run the check and the update in one Redis Lua script, so they are atomic and need only one network round trip.',
      'Limit at several levels: by IP at the CDN edge, by user at the API gateway, and by tenant at the service.'
    ],
    commonMistakes: [
      'Using a fixed window with no protection at the boundary, so a caller can send twice the limit across two adjacent windows.',
      'Reading the counter and incrementing it in two separate Redis calls. Under load, two requests can both read "99" and both pass a limit of 100.'
    ],
    interviewTips: [
      'If asked what happens when the rate limiter itself is down, explain fail-open vs fail-closed. Fail open (allow traffic) for revenue flows such as checkout. Fail closed (block traffic) for security endpoints such as login.'
    ]
  },
  {
    id: 'caching-strategies-and-eviction',
    title: 'Distributed Caching Strategies & Eviction Policies',
    category: 'Caching & Memory',
    icon: 'Layers',
    summary: 'A cache keeps copies of frequently read data in memory, so reads take about a millisecond instead of a database query. The hard parts are deciding when cached data is out of date, and stopping a cache failure from flooding the database.',
    readTime: '16 min read',
    diagram: {
      nodes: [
        { id: 'app_srv', label: 'Application Service', type: 'service', x: 10, y: 50, description: 'Reads product catalog data' },
        { id: 'bloom_filter', label: 'Bloom Filter Guard', type: 'gateway', x: 32, y: 20, description: 'Small structure that answers "this ID surely does not exist" for unknown IDs, so they never reach the database', techStack: ['RedisBloom', 'Guava'] },
        { id: 'local_l1', label: 'L1 In-Memory Cache', type: 'cache', x: 32, y: 75, description: 'Very fast cache inside the application process (for example Caffeine)', techStack: ['Caffeine Cache'], scaleMetric: '0.1ms latency' },
        { id: 'redis_l2', label: 'L2 Distributed Redis Cluster', type: 'cache', x: 58, y: 50, description: 'Cache shared by all application servers, with LRU eviction and replicas', techStack: ['Redis 7 Cluster'], scaleMetric: '1-2ms, 95% hit ratio' },
        { id: 'primary_db', label: 'Primary PostgreSQL Database', type: 'database', x: 86, y: 50, description: 'The durable source of truth, with ACID transactions', techStack: ['PostgreSQL'] },
        { id: 'async_warmer', label: 'Cache Warmer Worker', type: 'worker', x: 58, y: 85, description: 'Refreshes hot keys in the background before they expire', techStack: ['Cron Worker'] }
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
        { step: 1, title: 'Check the caches', description: 'The application first checks its own in-process cache (about 0.1 ms), then the shared Redis cluster (about 1 ms).', activeNodes: ['app_srv', 'local_l1', 'redis_l2'], highlightDetails: 'About 95% of reads end here and never touch the database.', latencyEstimate: '0.1 - 1ms' },
        { step: 2, title: 'Stop requests for IDs that do not exist', description: 'On a miss, a Bloom filter checks whether the ID can exist in the database at all.', activeNodes: ['app_srv', 'bloom_filter'], highlightDetails: 'A Bloom filter never says "no" for an ID that exists (no false negatives). When it says "no", the request ends without a database query.', latencyEstimate: '0.5ms' },
        { step: 3, title: 'Read the database, one request at a time', description: 'Before it queries PostgreSQL, the application takes a short lock in Redis for this key, so only one request loads the value.', activeNodes: ['app_srv', 'primary_db'], highlightDetails: 'One query reaches the database. The other requests for the same key wait briefly and then read the filled cache.', latencyEstimate: '10-25ms' },
        { step: 4, title: 'Fill the cache with a random TTL', description: 'The result is saved in Redis with a TTL plus a random offset (jitter), for example 3,600 s plus 0 to 300 s.', activeNodes: ['app_srv', 'redis_l2'], highlightDetails: 'Jitter stops many keys from expiring at the same moment and hitting the database together.', latencyEstimate: '1ms' }
      ]
    },
    keyConcepts: [
      {
        name: 'Where the cache lives: in-process vs distributed',
        explanation: 'An in-process cache (for example Caffeine or Guava inside the application) answers in about 0.1 ms. But its size is limited by the application memory, and each server has its own copy, so copies can disagree.\n\nA distributed cache (for example a Redis cluster or Memcached) answers in 1 to 3 ms. All application servers share it, and it can hold gigabytes to terabytes, with replicas for safety. Many systems use both: a small in-process cache in front of a shared one.',
        prosAndCons: {
          pros: ['Reads are 10 to 100 times faster than a disk-based database.', 'Removes many expensive database queries, such as large joins.'],
          cons: ['Cached data can be out of date for a while, and keeping copies in sync is a common source of bugs.']
        }
      },
      {
        name: 'Read and write patterns',
        explanation: 'The pattern decides who loads the cache and when writes reach the database.\n1. Cache-aside (lazy loading): the application reads the cache. On a miss, it reads the database, stores the result in the cache and returns it. This is the most common pattern.\n2. Write-through: every write goes to the cache and, before the write is confirmed, to the database. Reads are fresh, but writes are slower.\n3. Write-back (write-behind): writes go to the cache only, and the cache writes them to the database later in batches. Writes are very fast, but data is lost if a cache node crashes first.\n4. Write-around: writes go straight to the database, skipping the cache. Data that is written but rarely read does not fill up the cache.',
        prosAndCons: {
          pros: ['With cache-aside, only data that someone actually reads uses expensive memory.'],
          cons: ['Write-back needs a durable log or replicas to avoid losing writes.']
        },
        codeSnippet: `// Cache-aside with a lock (single flight), null caching and TTL jitter
async function getProduct(productId: string): Promise<Product | null> {
  const cacheKey = \`product:\${productId}\`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached); // "null" parses to null: a cached "does not exist"
  }

  // Cache miss: only one caller loads from the DB, to prevent a stampede
  const lockKey = \`lock:\${cacheKey}\`;
  const acquired = await redis.set(lockKey, "1", "NX", "EX", 5);

  if (!acquired) {
    await sleep(50); // Another caller is loading it; try the cache again
    return getProduct(productId);
  }

  try {
    const product = await db.products.findById(productId);
    if (!product) {
      await redis.set(cacheKey, "null", "EX", 60); // Cache the miss briefly (stops cache penetration)
      return null;
    }
    const ttl = 3600 + Math.floor(Math.random() * 300); // EX needs an integer; jitter stops mass expiry
    await redis.set(cacheKey, JSON.stringify(product), "EX", ttl);
    return product;
  } finally {
    await redis.del(lockKey);
  }
}`
      },
      {
        name: 'Four ways a cache can fail, and the fixes',
        explanation: 'Each failure ends the same way: a sudden flood of queries reaches the database.\n1. Stampede (thundering herd): a key expires, and thousands of requests miss at the same moment and all query the database. Fix: let only one request reload the key (a lock, also called single flight), or refresh popular keys a little before they expire.\n2. Breakdown: the stampede case for one very hot key, such as a celebrity profile. Fix: do not let hot keys expire on their own; refresh them with a background worker.\n3. Avalanche: many keys expire in the same second (for example all set at midnight with the same TTL), or a cache node fails. Fix: add random jitter to TTLs, and run cache replicas.\n4. Penetration: requests for IDs that do not exist (for example id = -999) miss the cache every time and always reach the database. Fix: a Bloom filter in front of the cache, or cache "not found" for a short time.',
        prosAndCons: {
          pros: ['A Bloom filter needs only about 10 bits per item for a 1% false positive rate, and it never gives false negatives.'],
          cons: ['A standard Bloom filter cannot remove items. A counting Bloom filter can, but it uses more memory.']
        }
      }
    ],
    cheatSheet: [
      'Eviction: LRU (least recently used) suits data that is popular for a short time. LFU (least frequently used) suits data that stays popular for a long time.',
      'Redis vs Memcached: Redis has rich data types (hashes, sets, sorted sets, bitmaps, streams), persistence (RDB and AOF) and pub/sub. Memcached is a simple multi-threaded key-value store.',
      'Always add random jitter to TTLs, so keys do not all expire at the same moment.'
    ],
    commonMistakes: [
      'Deleting the cache entry before the database transaction commits. A read in between can load the old value back into the cache. Delete after the commit, and optionally delete again a moment later.',
      'Writing the new value to the cache before the database write. If the database write fails, the cache holds data that never existed in the database.',
      'Storing large JSON values uncompressed. Compressing them (for example with Snappy or gzip) can save a lot of memory.'
    ],
    interviewTips: [
      'To size a cache, use the 80/20 rule: about 20% of the data gets about 80% of the reads, so cache roughly that 20%.'
    ]
  },
  {
    id: 'database-architectures-and-scaling',
    title: 'Database Architecture, Sharding & CAP Theorem',
    category: 'Data Storage & Partitioning',
    icon: 'Database',
    summary: 'How to choose a database and how to grow it. This topic compares SQL and NoSQL, explains how storage engines write data, and shows how replicas and sharding spread load over many machines. It ends with CAP, the rule that decides what a distributed database gives up when the network fails.',
    readTime: '20 min read',
    diagram: {
      nodes: [
        { id: 'app_clients', label: 'Application Cluster', type: 'service', x: 8, y: 50, description: 'Services that read and write data' },
        { id: 'sharding_proxy', label: 'Database Proxy (Vitess / Router)', type: 'gateway', x: 30, y: 50, description: 'Reads each SQL query, finds the sharding key and sends the query to the right shard', techStack: ['Vitess', 'ProxySQL', 'PgBouncer'] },
        { id: 'hash_ring', label: 'Consistent Hash Ring', type: 'search', x: 30, y: 15, description: 'Maps keys and shards onto a ring of 2^32 positions. Each shard owns many points (virtual nodes), so data spreads evenly and few keys move when a shard is added.', techStack: ['Consistent Hashing'] },
        { id: 'shard_0_master', label: 'Shard 0 Primary (~33M users)', type: 'database', x: 60, y: 25, description: 'Takes all writes for the users that hash to shard 0', techStack: ['PostgreSQL Primary'] },
        { id: 'shard_0_replica', label: 'Shard 0 Read Replica', type: 'database', x: 86, y: 25, description: 'Serves reads for shard 0. Replication lag is monitored.', techStack: ['PostgreSQL Replica'] },
        { id: 'shard_1_master', label: 'Shard 1 Primary (~33M users)', type: 'database', x: 60, y: 50, description: 'Takes all writes for the users that hash to shard 1', techStack: ['PostgreSQL Primary'] },
        { id: 'shard_1_replica', label: 'Shard 1 Read Replica', type: 'database', x: 86, y: 50, description: 'Serves reads for shard 1', techStack: ['PostgreSQL Replica'] },
        { id: 'shard_2_master', label: 'Shard 2 Primary (~33M users)', type: 'database', x: 60, y: 75, description: 'Takes all writes for the users that hash to shard 2', techStack: ['PostgreSQL Primary'] },
        { id: 'shard_2_replica', label: 'Shard 2 Read Replica', type: 'database', x: 86, y: 75, description: 'Serves reads for shard 2', techStack: ['PostgreSQL Replica'] }
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
        { step: 1, title: 'Find the shard', description: 'The application sends a SQL query that includes user_id. The proxy hashes user_id and finds its position on the consistent hash ring.', activeNodes: ['app_clients', 'sharding_proxy', 'hash_ring'], highlightDetails: 'Virtual nodes give each shard many small slices of the ring, so users spread evenly across shards.', latencyEstimate: '0.5ms' },
        { step: 2, title: 'Send writes and reads to different servers', description: 'INSERT and UPDATE go to the shard primary. SELECT goes to a read replica.', activeNodes: ['sharding_proxy', 'shard_0_master', 'shard_0_replica'], highlightDetails: 'Read-your-own-writes: for about 5 seconds after a user writes, that user’s reads also go to the primary, so they always see their own change.', latencyEstimate: '2-5ms' },
        { step: 3, title: 'Copy changes to replicas', description: 'The primary writes each transaction to its write-ahead log (WAL) and streams the log to the replicas in the background.', activeNodes: ['shard_0_master', 'shard_0_replica'], highlightDetails: 'Replicas usually lag by less than a second. They add read capacity without slowing down the primary.', latencyEstimate: '5-20ms' }
      ]
    },
    keyConcepts: [
      {
        name: 'SQL vs NoSQL: which kind of database for which data',
        explanation: 'The right database depends on the shape of the data and how you query it.\nSQL (PostgreSQL, MySQL): fixed schema, ACID transactions, strong consistency, foreign keys and joins. Use it for money, accounts and orders.\nDocument (MongoDB, Couchbase): flexible JSON documents. Use it for catalog items and user profiles.\nKey-value (DynamoDB, Redis): very fast lookups by key, at very high volume.\nWide-column (Cassandra, ScyllaDB): very high write volume, partitioned over many nodes. Use it for time series, event logs and chat history.\nGraph (Neo4j): data made of relationships. Use it for social networks and fraud detection.',
        prosAndCons: {
          pros: ['SQL keeps data correct with transactions. NoSQL stores scale writes by adding nodes.'],
          cons: ['Sharding a SQL database adds a lot of work in the application. Most NoSQL stores cannot run a transaction or join across many tables or partitions.']
        }
      },
      {
        name: 'Storage engines: B+ tree vs LSM tree',
        explanation: 'The storage engine decides how data is laid out on disk, which makes a database good at reads or good at writes.\n\nA B+ tree (PostgreSQL, MySQL InnoDB) keeps data in a balanced tree of pages. Reads are fast (O(log N)), but each write changes pages in place, which means random disk writes.\n\nAn LSM tree (log-structured merge tree, used by Cassandra, RocksDB, LevelDB and Bigtable) first writes to a log and an in-memory table. When that table is full, it is written to disk as a sorted, unchangeable file (an SSTable). A background job (compaction) merges these files. Writes are fast because they are sequential. Reads can be slower because they may check several files, and Bloom filters help skip files that cannot contain the key.',
        prosAndCons: {
          pros: ['LSM trees handle much higher write rates, which suits logs, IoT data and metrics.'],
          cons: ['Compaction uses a lot of disk I/O and can cause latency spikes if it is not tuned.']
        }
      },
      {
        name: 'Ways to shard data',
        explanation: 'Sharding splits rows across many databases, and the choice of method decides how evenly the load spreads and how hard it is to add a shard.\n1. Range sharding: each shard holds a range of keys (for example user IDs 1 to 1M on shard 1). It is simple and good for range queries, but the newest range is often the busiest, so one shard runs hot.\n2. Hash sharding: shard = hash(key) mod N. Data spreads evenly, but changing N moves almost every key.\n3. Consistent hashing with virtual nodes: keys and shards sit on a ring, and each key belongs to the next shard on the ring. Adding a shard moves only about 1/N of the keys.\n4. Directory sharding: a lookup table maps each key to its shard. It is the most flexible, but the lookup service is on every request path and must be fast and highly available.',
        prosAndCons: {
          pros: ['Lets a database grow past the storage and write limits of one machine.'],
          cons: ['Joins and transactions across shards are slow and complex (they need protocols such as two-phase commit).']
        }
      },
      {
        name: 'CAP theorem and PACELC',
        explanation: 'CAP says that when the network splits (a partition, P), a distributed database must choose between consistency (C: every read sees the latest write) and availability (A: every request gets a non-error answer, which may be old). Partitions will happen on real networks, so the real choice is C or A during a partition.\n\nPACELC adds the normal case. If there is a partition (P), choose availability (A) or consistency (C). Else (E), choose lower latency (L) or consistency (C). DynamoDB and Cassandra (in their default settings) favor availability and latency (PA/EL). Spanner and HBase favor consistency (PC/EC).',
        prosAndCons: {
          pros: ['Gives you a clear way to explain why you picked a database in an interview.'],
          cons: ['Often misread as "pick any 2 of 3". You cannot opt out of partitions, so you only choose what to give up when one happens.']
        }
      }
    ],
    cheatSheet: [
      'Read replicas copy data from the primary in the background. They add read capacity, but reads can be slightly stale (replication lag).',
      'Read-your-own-writes: send a user’s reads to the primary for 5 to 10 seconds after that user writes, then go back to the replicas.',
      'Choose a sharding key with many distinct values that spreads traffic evenly, such as user_id. Do not use keys like country_code or status.'
    ],
    commonMistakes: [
      'Choosing Cassandra for complex relational queries or for data that is updated often in place.',
      'Sharding too early, before trying indexes, read replicas, caching and a bigger machine.',
      'Running two-phase commit (2PC) across regions. It holds locks while it waits for every participant, so latency is high and one slow node blocks the rest.'
    ],
    interviewTips: [
      'When asked how to scale a database, go step by step: 1) fix indexes and queries, 2) add read replicas, 3) add a cache such as Redis, 4) move to a bigger machine, 5) split tables by feature into separate databases (functional partitioning), 6) shard horizontally. Explain why each step is not yet enough before moving to the next.'
    ]
  },
  {
    id: 'message-queues-and-event-streaming',
    title: 'Message Queues & Event Streaming (Kafka vs RabbitMQ vs SQS)',
    category: 'Asynchronous & Messaging',
    icon: 'Radio',
    summary: 'A queue lets one service hand work to another without waiting for it. This absorbs traffic spikes, keeps a slow service from slowing everyone else, and lets several services react to the same event. The hard parts are delivering each message exactly when it should be, in the right order, and never applying it twice.',
    readTime: '18 min read',
    diagram: {
      nodes: [
        { id: 'order_service', label: 'Order Placement Service', type: 'service', x: 8, y: 50, description: 'Handles checkout and creates orders' },
        { id: 'outbox_db', label: 'PostgreSQL (Transactional Outbox)', type: 'database', x: 28, y: 75, description: 'Saves the order and an outbox_events row in the same database transaction', techStack: ['PostgreSQL'] },
        { id: 'debezium', label: 'Debezium CDC Connector', type: 'worker', x: 45, y: 75, description: 'Reads new outbox rows from the PostgreSQL write-ahead log, so it does not need to poll the table', techStack: ['Debezium', 'Kafka Connect'] },
        { id: 'kafka_broker', label: 'Kafka Cluster (Orders Topic)', type: 'queue', x: 50, y: 40, description: 'A replicated log split into partitions. Order is kept inside each partition.', techStack: ['Apache Kafka', 'KRaft'], scaleMetric: '1M events/sec' },
        { id: 'inventory_consumer', label: 'Inventory Consumer Group', type: 'worker', x: 82, y: 20, description: 'Reduces warehouse stock. It ignores events it has already applied (idempotent consumer).', techStack: ['Go Consumer'] },
        { id: 'payment_consumer', label: 'Payment Consumer Group', type: 'worker', x: 82, y: 45, description: 'Starts the payment capture for each order', techStack: ['Java Consumer'] },
        { id: 'dlq', label: 'Dead Letter Queue (DLQ)', type: 'queue', x: 82, y: 75, description: 'Holds messages that still failed after 5 retries with backoff, for people to inspect', techStack: ['Kafka DLQ Topic'] }
      ],
      edges: [
        { id: 'e1', from: 'order_service', to: 'outbox_db', label: '1. ACID Transaction', protocol: 'SQL' },
        { id: 'e2', from: 'outbox_db', to: 'debezium', label: '2. WAL Change Stream', protocol: 'SQL' },
        { id: 'e3', from: 'debezium', to: 'kafka_broker', label: '3. Publish Event', protocol: 'Internal RPC' },
        { id: 'e4', from: 'kafka_broker', to: 'inventory_consumer', label: '4. Read Orders Topic', protocol: 'Internal RPC' },
        { id: 'e5', from: 'kafka_broker', to: 'payment_consumer', label: '4. Read Orders Topic', protocol: 'Internal RPC' },
        { id: 'e6', from: 'payment_consumer', to: 'dlq', label: '5. Poison Message to DLQ', protocol: 'Internal RPC', isAsync: true }
      ],
      flowSteps: [
        { step: 1, title: 'Save the order and the event together', description: 'The Order Service writes the order row and an outbox_events row in one local database transaction.', activeNodes: ['order_service', 'outbox_db'], highlightDetails: 'This solves the dual-write problem: if the service crashed between "save order" and "publish event", one would happen without the other. Here both commit or neither does.', latencyEstimate: '5-10ms' },
        { step: 2, title: 'Publish from the database log', description: 'Debezium reads the new outbox row from the write-ahead log (WAL) and publishes an OrderCreated event to Kafka.', activeNodes: ['outbox_db', 'debezium', 'kafka_broker'], highlightDetails: 'Reading the log adds little load to the database, because nothing polls the table.', latencyEstimate: '2-5ms' },
        { step: 3, title: 'Each service reads the stream', description: 'Events with the same key (order_id) always go to the same partition, so the events for one order stay in order. Each consumer group reads every partition and keeps its own position (offset).', activeNodes: ['kafka_broker', 'inventory_consumer', 'payment_consumer'], highlightDetails: 'Inventory and Payment read the same events independently. A slow consumer group does not hold back the other.', latencyEstimate: '2-5ms' },
        { step: 4, title: 'Move bad messages aside', description: 'If a message still fails after several retries with growing delays, the consumer moves it to the dead letter queue and continues with the next message.', activeNodes: ['payment_consumer', 'dlq'], highlightDetails: 'One bad message no longer blocks the whole partition. An alert tells the on-call engineer to look at it.', latencyEstimate: '1ms' }
      ]
    },
    keyConcepts: [
      {
        name: 'Message queue vs event stream',
        explanation: 'A message queue hands each message to one worker and then deletes it, while an event stream keeps every event in a log that many readers can read and replay.\n\nMessage queues (RabbitMQ, Amazon SQS): a worker takes a message, does the job and acknowledges it, and the queue then deletes it. RabbitMQ can route messages by rules (direct, topic and fanout exchanges). Use queues for background jobs such as sending email or resizing images.\n\nEvent streams (Apache Kafka, Amazon Kinesis): events are appended to a partitioned log and kept for days, weeks or forever, whether or not anyone read them. Each reader (consumer group) remembers its own position (offset) in the log. Many groups can read the same stream at different speeds and replay old events. Use streams for event sourcing, real-time analytics, change data capture (CDC) and audit logs.',
        prosAndCons: {
          pros: [
            'RabbitMQ: flexible routing, per-message acknowledgement, and simple to set up.',
            'Kafka: millions of events per second (it writes to disk sequentially and copies data with little CPU), and events can be replayed.'
          ],
          cons: [
            'RabbitMQ: slows down when millions of unacknowledged messages build up in a queue.',
            'Kafka: harder to operate (partitions, consumer rebalancing, and the KRaft or ZooKeeper controller).'
          ]
        }
      },
      {
        name: 'Delivery guarantees and idempotency',
        explanation: 'A delivery guarantee says how many times a message can arrive, and real systems choose at-least-once and make consumers safe to repeat.\n1. At-most-once: a message arrives 0 or 1 times. If a worker crashes mid-job, the message is lost. Fast, and never duplicated.\n2. At-least-once: a message arrives 1 or more times. The sender retries until it gets an acknowledgement, so a lost acknowledgement causes a duplicate. This is the usual choice.\n3. Exactly-once (in effect): every message takes effect once. In practice this is at-least-once delivery plus an idempotent consumer, which checks a unique idempotency key or a processed-events table before changing anything.',
        prosAndCons: {
          pros: ['Idempotent consumers make retries safe, so a retried payment message does not charge a customer twice.'],
          cons: ['Changing the database and publishing a message cannot share one transaction. You need a pattern such as the transactional outbox.']
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
        name: 'Partitions, parallelism and dead letter queues',
        explanation: 'In Kafka, the number of partitions sets the maximum parallelism of a consumer group: each partition is read by one consumer in the group at a time.\n\nA poison message is one that fails every time, for example because its data is malformed. After a few retries with growing delays (exponential backoff), the consumer moves it to a dead letter queue (DLQ) and moves on, so the partition is not blocked. People then inspect, fix and replay it.',
        prosAndCons: {
          pros: ['A DLQ isolates bad messages without stopping real-time processing.'],
          cons: ['You need monitoring and tools to inspect and replay dead-lettered messages, or they are silently forgotten.']
        }
      }
    ],
    cheatSheet: [
      'Partition key: Kafka sends all messages with the same key (for example order_id) to the same partition, so their order is kept.',
      'Rebalancing: when a consumer joins, leaves or misses heartbeats, the group reassigns partitions and pauses briefly. Tune max.poll.interval.ms so slow jobs do not trigger needless rebalances.',
      'Make every consumer idempotent, for example with a SQL UPSERT or a set of processed event IDs.'
    ],
    commonMistakes: [
      'Assuming Kafka keeps one global order across all partitions. It keeps order only inside each partition.',
      'Running more consumers in a group than there are partitions. The extra consumers sit idle.',
      'Publishing to the queue directly from the request handler, apart from the database transaction. If one succeeds and the other fails, the database and the event stream disagree (the dual-write problem).'
    ],
    interviewTips: [
      'Choose Kafka when the problem needs real-time analytics, event sourcing, replay, or a very high write rate.',
      'Mention the transactional outbox pattern whenever a service must both update its database and publish an event.'
    ]
  },
  {
    id: 'distributed-storage-and-object-stores',
    title: 'Object Storage & Distributed File Systems (S3 / HDFS / Blob)',
    category: 'Data Storage & Partitioning',
    icon: 'HardDrive',
    summary: 'Object storage (such as Amazon S3) holds large files like photos, videos and backups cheaply and very safely. This topic shows how to upload big files directly from the client, how to split files into chunks so uploads can resume and duplicates are stored once, and why file details belong in a separate database.',
    readTime: '13 min read',
    diagram: {
      nodes: [
        { id: 'client_uploader', label: 'Client (Web / Mobile)', type: 'client', x: 8, y: 50, description: 'Uploads a 500 MB video' },
        { id: 'api_server', label: 'API Gateway & Token Signer', type: 'gateway', x: 30, y: 25, description: 'Starts the multipart upload and signs one short-lived upload URL per part (valid for 15 minutes)', techStack: ['Node.js', 'AWS SDK'] },
        { id: 'metadata_db', label: 'Metadata Database (PostgreSQL)', type: 'database', x: 30, y: 75, description: 'Stores the file details: owner, status (PENDING), size and S3 location', techStack: ['PostgreSQL'] },
        { id: 's3_storage', label: 'Distributed Object Storage (S3)', type: 'storage', x: 60, y: 50, description: 'Stores objects across at least 3 availability zones, designed for 11 nines of durability', techStack: ['AWS S3', 'MinIO'], scaleMetric: '99.999999999% Durability' },
        { id: 's3_events', label: 'S3 Event Notification (SQS)', type: 'queue', x: 85, y: 25, description: 'Receives an s3:ObjectCreated event when the upload completes', techStack: ['AWS SQS'] },
        { id: 'transcoder', label: 'Video Transcoder Worker Cluster', type: 'worker', x: 85, y: 75, description: 'Reads the raw video and converts it into streaming formats (HLS or DASH, 1080p and 720p)', techStack: ['FFmpeg', 'Spot K8s'] }
      ],
      edges: [
        { id: 'e1', from: 'client_uploader', to: 'api_server', label: '1. POST /presign', protocol: 'HTTPS' },
        { id: 'e2', from: 'api_server', to: 'metadata_db', label: '2. Create Record', protocol: 'SQL' },
        { id: 'e3', from: 'api_server', to: 'client_uploader', label: '3. Return S3 Signed URLs', protocol: 'HTTPS' },
        { id: 'e4', from: 'client_uploader', to: 's3_storage', label: '4. Direct Binary PUT (Multi-part)', protocol: 'HTTPS' },
        { id: 'e5', from: 's3_storage', to: 's3_events', label: '5. ObjectCreated Notification', protocol: 'Async Queue', isAsync: true },
        { id: 'e6', from: 's3_events', to: 'transcoder', label: '6. Process Transcoding', protocol: 'Internal RPC', isAsync: true }
      ],
      flowSteps: [
        { step: 1, title: 'Get signed upload URLs', description: 'The client asks to upload. The API server checks who the user is, saves a PENDING record, starts a multipart upload in S3 and signs one upload URL for each part.', activeNodes: ['client_uploader', 'api_server', 'metadata_db'], highlightDetails: 'The video never passes through your servers, which saves their bandwidth and memory.', latencyEstimate: '10ms' },
        { step: 2, title: 'Upload the parts in parallel', description: 'The client uploads the parts (at least 5 MB each, except the last) directly to S3, several at a time. When all parts are done, it asks the server to complete the upload.', activeNodes: ['client_uploader', 's3_storage'], highlightDetails: 'If the connection drops, only the failed parts are sent again.', latencyEstimate: 'Network Dependent' },
        { step: 3, title: 'Process the file in the background', description: 'When S3 has joined all parts into one object, it sends an ObjectCreated event to SQS, and transcoding workers pick it up.', activeNodes: ['s3_storage', 's3_events', 'transcoder'], highlightDetails: 'The number of workers grows and shrinks with the length of the SQS queue.', latencyEstimate: '50-100ms' }
      ]
    },
    keyConcepts: [
      {
        name: 'Block vs file vs object storage',
        explanation: 'The three kinds of storage differ in how you address data and who can share it.\nBlock storage (Amazon EBS, SAN): a raw disk split into fixed-size blocks. It is very fast for random reads and writes, you format it with a file system such as ext4, and usually one server mounts it at a time. Use it for databases.\nFile storage (NFS, Amazon EFS): folders and files with normal file permissions, shared by many servers at the same time.\nObject storage (Amazon S3, Google Cloud Storage, MinIO): a flat set of objects, each found by a key and read or written over HTTP. Each object carries its own metadata. It is designed for 11 nines of durability, grows without practical limit and costs little per gigabyte.',
        prosAndCons: {
          pros: ['Object storage is nearly unlimited, keeps copies in several availability zones, and works directly with CDNs.'],
          cons: ['You cannot change part of an object, for example byte 50. You must upload the whole object again.']
        }
      },
      {
        name: 'Direct uploads with pre-signed URLs',
        explanation: 'A pre-signed URL lets a client upload straight to S3 without your servers ever handling the file. Sending a 2 GB video through your backend would tie up its memory, bandwidth and worker threads.\n\nInstead, the backend checks the user and signs a short-lived URL that allows one specific upload. For large files it starts a multipart upload and signs one URL per part. The client sends the data straight to S3, and S3 checks the signature.',
        prosAndCons: {
          pros: ['Your web servers carry no upload traffic or memory load.', 'Large files upload in parallel parts, and failed parts can be retried alone.'],
          cons: ['The backend never sees the file, so it must check it after the upload, for example from an S3 event (S3 to SQS to a worker).']
        },
        codeSnippet: `// S3 Direct Upload Flow:
// 1. Client calls: POST /api/v1/uploads/presign { filename: "vid.mp4", size: 104857600 }
// 2. Server generates secure pre-signed PUT URL with 15-minute expiration
//    (for multipart: CreateMultipartUpload, then one signed URL per part)
// 3. Client executes: PUT https://bucket.s3.amazonaws.com/uploads/vid.mp4?X-Amz-Signature=...
// 4. S3 triggers ObjectCreated event -> SQS -> Video Transcoding Worker Cluster`
      },
      {
        name: 'Chunking and content-addressed storage',
        explanation: 'Systems like Dropbox split each file into fixed-size chunks (Dropbox uses 4 MB) and name each chunk by its SHA-256 hash. The chunk is stored in object storage under that hash.\n\nIf two users upload the same file, or an edit leaves most chunks unchanged, the matching chunks already exist and are stored only once (deduplication). An upload sends only the chunks the server does not have yet.',
        prosAndCons: {
          pros: ['Large savings in storage and upload bandwidth.', 'Uploads can resume: after a failure, only the missing chunks are sent.'],
          cons: ['You need a database that maps each file to its chunks and counts references, so you know when a chunk can be deleted.']
        }
      }
    ],
    cheatSheet: [
      'Durability vs availability: durability is the chance of never losing data (S3 is designed for 11 nines, using copies or erasure coding across zones). Availability is the chance the service answers right now (for example 99.9% or 99.99%).',
      'Lifecycle rules move older objects to cheaper classes, for example S3 Standard, then Infrequent Access, then Glacier, which cuts storage cost a lot for data that is rarely read.',
      'Keep file details (owner, size, type, tags, S3 key) in a database such as PostgreSQL or DynamoDB, and search there. Object storage is not built for queries.'
    ],
    commonMistakes: [
      'Streaming large uploads through your own services instead of using pre-signed URLs.',
      'Listing a bucket to find files. Each list call returns at most 1,000 keys, so 10 million keys need 10,000 calls in a row. Query the metadata database instead.'
    ],
    interviewTips: [
      'For any video, photo or file-sharing design (YouTube, Instagram, Dropbox), say it clearly: "Media files go to object storage through pre-signed URLs, and their metadata goes to a database."'
    ]
  },
  {
    id: 'consensus-and-distributed-locking',
    title: 'Distributed Consensus & Coordination (Raft, Paxos, Zookeeper, etcd)',
    category: 'Reliability & Scaling',
    icon: 'Cpu',
    summary: 'Consensus lets a group of servers agree on one value, such as who the leader is, even when some servers fail or the network splits. Tools like etcd and ZooKeeper use it to provide leader election, configuration and distributed locks. This topic explains Raft and how to use a lock safely.',
    readTime: '15 min read',
    diagram: {
      nodes: [
        { id: 'worker_1', label: 'Application Worker 1', type: 'worker', x: 8, y: 30, description: 'Wants the lock for a flash-sale item' },
        { id: 'worker_2', label: 'Application Worker 2', type: 'worker', x: 8, y: 70, description: 'Wants the same lock at the same time' },
        { id: 'raft_leader', label: 'Raft Leader (etcd / Zookeeper)', type: 'service', x: 45, y: 50, description: 'Orders all changes and gives each lock holder a fencing token that always increases', techStack: ['etcd', 'Raft Consensus'], scaleMetric: 'Quorum Q = N/2 + 1' },
        { id: 'raft_node_1', label: 'Raft Follower 1', type: 'service', x: 75, y: 25, description: 'Keeps a copy of the log and votes in leader elections', techStack: ['etcd'] },
        { id: 'raft_node_2', label: 'Raft Follower 2', type: 'service', x: 75, y: 75, description: 'Keeps a copy of the log and votes in leader elections', techStack: ['etcd'] },
        { id: 'db_target', label: 'Target Database (Inventory)', type: 'database', x: 45, y: 90, description: 'The protected resource. It rejects any write with a fencing token older than the newest one it has seen.', techStack: ['PostgreSQL'] }
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
        { step: 1, title: 'Take the lock through consensus', description: 'Worker 1 asks for the lock with a lease (a lock that expires unless renewed). The Raft leader copies the lock record to a majority of nodes before it answers.', activeNodes: ['worker_1', 'raft_leader', 'raft_node_1', 'raft_node_2'], highlightDetails: 'Because a majority stored it, the lock survives if any one etcd node crashes.', latencyEstimate: '2-5ms' },
        { step: 2, title: 'Receive a fencing token', description: 'The leader grants the lock with a fencing token, a number that grows with every grant (here 42).', activeNodes: ['raft_leader', 'worker_1'], highlightDetails: 'The token protects against a holder that pauses (for example in a long garbage collection), loses its lease, and then wakes up thinking it still holds the lock.', latencyEstimate: '1ms' },
        { step: 3, title: 'Write with the token', description: 'Worker 2 waits on a watch for the lock key. Worker 1 writes to the database and records token 42, and the database accepts the write only if 42 is newer than the last token it saw.', activeNodes: ['worker_2', 'worker_1', 'db_target'], highlightDetails: 'If Worker 1 had paused and Worker 2 had already written with token 43, Worker 1’s late write with 42 is rejected.', latencyEstimate: '5ms' }
      ]
    },
    keyConcepts: [
      {
        name: 'Why coordination is hard: split brain',
        explanation: 'When the network splits, two servers can each believe they are the leader (split brain) and both accept writes, which corrupts data.\n\nConsensus algorithms such as Raft and Paxos prevent this by requiring a majority (a quorum, floor(N/2) + 1 of N nodes) to agree on every decision. Two majorities always share at least one node, so two sides of a split can never both make progress.',
        prosAndCons: {
          pros: ['Gives strong (linearizable) consistency and automatic failover with no human action.'],
          cons: ['Use an odd number of nodes (3, 5 or 7). Every write waits for a round trip to a majority, so writes are slower than on a single server.']
        }
      },
      {
        name: 'How Raft works',
        explanation: 'Raft splits consensus into three parts: electing a leader, copying the log, and keeping it safe.\n1. Leader election: every node starts as a follower with a random election timeout (150 to 300 ms in the Raft paper). If a follower hears no heartbeat from a leader in that time, it becomes a candidate and asks for votes. A candidate that gets a majority becomes the leader.\n2. Log replication: the leader receives client commands, appends them to its log, and sends them to followers (AppendEntries). When a majority has stored an entry, the leader commits it and answers the client.\n3. Safety: a node can win an election only if its log is at least as up to date as the majority that votes for it, so a new leader always has every committed entry.',
        prosAndCons: {
          pros: ['Much easier to understand and build than Multi-Paxos.', 'Proven correct.'],
          cons: ['All writes go through one leader, which limits write throughput. Systems such as TiKV run many independent Raft groups to spread the load.']
        }
      },
      {
        name: 'Distributed locks: etcd or ZooKeeper vs Redis Redlock',
        explanation: 'A distributed lock makes sure only one worker at a time touches a resource, such as the stock of one flash-sale item.\n\netcd and ZooKeeper store the lock through consensus (Raft or ZAB). The lock is tied to a lease or session that the holder keeps alive with heartbeats. If the holder crashes, the lease expires, and the next waiting worker is notified through a watch. This is the safer choice.\n\nRedis Redlock takes the lock on a majority of several independent Redis servers, using a random value and a TTL. It is fast, but Martin Kleppmann showed that clock jumps and long process pauses can let two workers hold it at once. With any lock, use fencing tokens so the storage layer rejects late writes.',
        prosAndCons: {
          pros: ['Fencing tokens (a number that grows with each lock grant) let the database reject writes from a holder whose lock has already expired.'],
          cons: ['A lock with no fencing token and no lease renewal can expire while the worker is still working, and then two workers run at once.']
        },
        codeSnippet: `// Distributed Locking with Fencing Token in etcd (pseudocode)
const lease = client.lease(10); // 10-second lease, renewed by heartbeats
const lock = await client.lock("resource/flash_sale_item_99").acquire({ lease });
const fencingToken = lock.revision; // etcd revision: grows with every write, so it is a valid fencing token

// Pass fencingToken to the DB write and store it, so older tokens are rejected:
// UPDATE inventory SET quantity = quantity - 1, version = :fencingToken
//   WHERE id = 99 AND version < :fencingToken;`
      }
    ],
    cheatSheet: [
      'Quorum math: 3 nodes survive 1 failure, 5 nodes survive 2, and 7 nodes survive 3.',
      'etcd is used for service discovery, Kubernetes cluster state and locks. ZooKeeper is used by HBase and by older Kafka versions (Kafka now uses its own KRaft).',
      'Always pair a distributed lock with a fencing token, to protect against long process pauses such as garbage collection.'
    ],
    commonMistakes: [
      'Running an even number of consensus nodes. 4 nodes still survive only 1 failure, like 3, but add more network traffic.',
      'Holding a distributed lock for a long batch job (10 minutes or more). Track the job state in a database row instead.'
    ],
    interviewTips: [
      'Mention fencing tokens whenever a design uses a distributed lock for something critical, such as a flash sale or ticket booking.'
    ]
  },
  {
    id: 'search-engines-and-indexing',
    title: 'Search Engines, Inverted Indexes & Vector Search',
    category: 'Search & Big Data',
    icon: 'Search',
    summary: 'A search engine finds documents by their words or their meaning in milliseconds. Keyword search uses an inverted index and BM25 ranking. Semantic search turns text into vectors (embeddings) and finds the closest ones. Many products combine both, and keep the search index in sync with the main database through a change stream.',
    readTime: '14 min read',
    diagram: {
      nodes: [
        { id: 'user_search', label: 'User Search Query', type: 'client', x: 8, y: 35, description: 'Searches for, say, "lightweight running shoes"' },
        { id: 'search_gateway', label: 'Search Query Gateway', type: 'service', x: 30, y: 35, description: 'Breaks the query into terms, reduces words to their stem, and sends it to both search backends', techStack: ['Go', 'Lucene Analyzer'] },
        { id: 'db_source', label: 'Primary PostgreSQL Database', type: 'database', x: 8, y: 75, description: 'The source of truth for the product catalog', techStack: ['PostgreSQL'] },
        { id: 'cdc_pipeline', label: 'Kafka CDC Pipeline (Debezium)', type: 'queue', x: 30, y: 75, description: 'Streams every database change to the search indexes, so the application does not write to them directly', techStack: ['Debezium', 'Kafka'] },
        { id: 'es_cluster', label: 'Elasticsearch (Inverted Index)', type: 'search', x: 60, y: 35, description: 'Keyword index: for each term, the list of documents that contain it, ranked with BM25', techStack: ['Elasticsearch 8', 'OpenSearch'], scaleMetric: '<15ms P99' },
        { id: 'vector_db', label: 'Vector Database (pgvector / HNSW)', type: 'search', x: 60, y: 75, description: 'Stores embeddings and finds the nearest ones, for search by meaning or by image', techStack: ['Qdrant', 'pgvector'] },
        { id: 'reranker', label: 'Hybrid Reranker (Reciprocal Rank Fusion)', type: 'worker', x: 86, y: 55, description: 'Merges the keyword ranking and the vector ranking into one list, using each result’s position in both lists', techStack: ['RRF Algorithm'] }
      ],
      edges: [
        { id: 'e1', from: 'db_source', to: 'cdc_pipeline', label: '1. Capture Insert/Update', protocol: 'SQL' },
        { id: 'e2', from: 'cdc_pipeline', to: 'es_cluster', label: '2. Index Terms', protocol: 'Internal RPC' },
        { id: 'e3', from: 'cdc_pipeline', to: 'vector_db', label: '2. Generate Embeddings', protocol: 'Internal RPC' },
        { id: 'e4', from: 'user_search', to: 'search_gateway', label: '3. Execute Search', protocol: 'HTTPS' },
        { id: 'e5', from: 'search_gateway', to: 'es_cluster', label: '4. BM25 Query', protocol: 'Internal RPC' },
        { id: 'e6', from: 'search_gateway', to: 'vector_db', label: '4. Cosine KNN Query', protocol: 'Internal RPC' },
        { id: 'e7', from: 'es_cluster', to: 'reranker', label: '5. Merge Rankings', protocol: 'Internal RPC' },
        { id: 'e8', from: 'vector_db', to: 'reranker', label: '5. Merge Rankings', protocol: 'Internal RPC' }
      ],
      flowSteps: [
        { step: 1, title: 'Keep the indexes in sync', description: 'When a product changes in PostgreSQL, Debezium sends the change through Kafka to Elasticsearch and to the vector database.', activeNodes: ['db_source', 'cdc_pipeline', 'es_cluster', 'vector_db'], highlightDetails: 'The application writes only to the database, so the database and the indexes cannot disagree because one write failed. Indexes are usually less than a second behind.', latencyEstimate: '50-200ms' },
        { step: 2, title: 'Analyze the query', description: 'The query is split into terms, common words such as "the" are removed, and each word is reduced to its stem (for example "running" becomes "run").', activeNodes: ['user_search', 'search_gateway'], highlightDetails: 'The same steps ran when the documents were indexed, so query terms match document terms. The query is also turned into an embedding for the vector search.', latencyEstimate: '2ms' },
        { step: 3, title: 'Search both indexes at once', description: 'The gateway queries the inverted index and the vector index in parallel.', activeNodes: ['search_gateway', 'es_cluster', 'vector_db'], highlightDetails: 'Keyword search intersects the document lists of the query terms. Vector search walks an HNSW graph to find close embeddings quickly.', latencyEstimate: '10-15ms' },
        { step: 4, title: 'Merge the two rankings', description: 'Reciprocal rank fusion (RRF) combines the two result lists and returns the top 20 products.', activeNodes: ['es_cluster', 'vector_db', 'reranker', 'user_search'], highlightDetails: 'Results that rank well in both lists rise to the top, so users get exact keyword matches and results that match their meaning.', latencyEstimate: '5ms' }
      ]
    },
    keyConcepts: [
      {
        name: 'The inverted index and text analysis',
        explanation: 'An inverted index maps each term to the list of documents that contain it (a posting list), which is the reverse of a normal document-to-words view.\n\nBefore indexing, text goes through an analysis pipeline:\n1. Character filters remove HTML tags and special characters.\n2. A tokenizer splits text into terms ("system design" becomes "system" and "design").\n3. Token filters lowercase terms, remove stop words ("the", "is") and reduce words to their stem ("running" and "runs" become "run", for example with the Porter stemmer).\n\nTo answer "distributed system", the engine intersects the posting lists of both terms.',
        prosAndCons: {
          pros: ['Keyword search in milliseconds across billions of documents.', 'AND and OR queries are fast intersections and unions of sorted posting lists.'],
          cons: ['Indexing costs CPU and disk space. In Elasticsearch, new documents become searchable only after a refresh, about 1 second by default.']
        }
      },
      {
        name: 'BM25 ranking vs vector search',
        explanation: 'BM25 ranks documents by matching words, while vector search ranks them by closeness in meaning.\n\nBM25 scores a document higher when a query term appears often in it (term frequency), when the term is rare across all documents (inverse document frequency), and when the document is not unusually long (length normalization). Extra repeats of the same term add less and less.\n\nVector search turns text or images into embeddings, lists of hundreds or thousands of numbers (for example 1,536), using an embedding model. It finds items whose embeddings are closest, usually by cosine similarity. Exact search is too slow at scale, so engines use approximate nearest neighbor (ANN) indexes such as HNSW, found in tools like pgvector, Qdrant, Milvus and Pinecone. This finds "down jackets" for the query "warm winter clothing".',
        prosAndCons: {
          pros: ['Hybrid search (BM25 plus vectors) gives exact keyword matches and an understanding of meaning.'],
          cons: ['Vector indexes such as HNSW need a lot of memory, and their results are approximate.']
        },
        codeSnippet: `// Example: Inverted Index Structure
{
  "distributed": [ { docId: 1, pos: 2 }, { docId: 4, pos: 10 } ],
  "system":      [ { docId: 1, pos: 3 }, { docId: 2, pos: 1 }, { docId: 4, pos: 11 } ],
  "cache":       [ { docId: 2, pos: 5 }, { docId: 3, pos: 1 } ]
}
// Query: "distributed system" -> Intersect Posting Lists for "distributed" (1,4) & "system" (1,2,4) -> [1, 4]
// Reciprocal rank fusion: score(doc) = sum over lists of 1 / (k + rank), with k usually 60`
      }
    ],
    cheatSheet: [
      'Keep the search index in sync with change data capture (Debezium and Kafka). Do not write to the database and Elasticsearch separately from the application.',
      'Fuzzy search (typo tolerance) uses edit distance (Levenshtein) and n-gram tokenizers.',
      'In Elasticsearch, the number of primary shards is set when the index is created (changing it needs a split or a reindex). Add replica shards to serve more search queries.'
    ],
    commonMistakes: [
      'Using SQL LIKE \'%query%\' on a production database. A leading wildcard cannot use a normal index, so every search scans the whole table.',
      'Treating Elasticsearch as the source of truth. It is a search index that can be rebuilt; keep the real records in the main database.'
    ],
    interviewTips: [
      'When a problem mentions a search bar, autocomplete or filtering by many tags, add Elasticsearch fed by a change data capture pipeline from the main database.'
    ]
  },
  {
    id: 'resiliency-and-observability',
    title: 'Resiliency Patterns, Chaos Engineering & Observability',
    category: 'Reliability & Scaling',
    icon: 'Activity',
    summary: 'Every dependency fails sometimes. Resiliency patterns such as circuit breakers, bulkheads and retries with backoff stop one failure from spreading through the system. Observability (metrics, logs and traces) tells you what broke and where, fast.',
    readTime: '15 min read',
    diagram: {
      nodes: [
        { id: 'traffic', label: 'Client Ingress Requests', type: 'client', x: 8, y: 50, description: 'Real user traffic' },
        { id: 'circuit_breaker', label: 'Resilience4j Circuit Breaker', type: 'gateway', x: 32, y: 50, description: 'Tracks the recent error rate and switches between closed, open and half-open', techStack: ['Resilience4j', 'Envoy Outlier'] },
        { id: 'flaky_svc', label: 'Downstream Payment Service', type: 'service', x: 60, y: 25, description: 'Currently returning 500 errors and responding slowly', techStack: ['Payment Microservice'] },
        { id: 'fallback_cache', label: 'Degraded Fallback Cache', type: 'cache', x: 60, y: 75, description: 'Returns a cached or default answer while the service is down', techStack: ['Redis Cache'] },
        { id: 'otel_agent', label: 'OpenTelemetry Collector', type: 'worker', x: 32, y: 85, description: 'Collects traces, request metrics and structured logs', techStack: ['OpenTelemetry Collector'] },
        { id: 'jaeger_prom', label: 'Prometheus & Jaeger Observability', type: 'search', x: 60, y: 90, description: 'Shows each request’s path across services and alerts when P99 latency is too high', techStack: ['Prometheus', 'Jaeger', 'Grafana'] }
      ],
      edges: [
        { id: 'e1', from: 'traffic', to: 'circuit_breaker', label: '1. Inbound Request', protocol: 'HTTPS' },
        { id: 'e2', from: 'circuit_breaker', to: 'flaky_svc', label: '2. Normal Call (Closed)', protocol: 'Internal RPC' },
        { id: 'e3', from: 'circuit_breaker', to: 'fallback_cache', label: '3. Fast-Fail Fallback (Open)', protocol: 'Internal RPC' },
        { id: 'e4', from: 'circuit_breaker', to: 'otel_agent', label: '4. Trace Context & Metrics', protocol: 'Internal RPC', isAsync: true },
        { id: 'e5', from: 'otel_agent', to: 'jaeger_prom', label: '5. Export Traces & Metrics', protocol: 'Internal RPC', isAsync: true }
      ],
      flowSteps: [
        { step: 1, title: 'Normal operation (closed)', description: 'While the circuit is closed, requests pass through to the payment service as usual.', activeNodes: ['traffic', 'circuit_breaker', 'flaky_svc'], highlightDetails: 'OpenTelemetry records the timing of each call and passes a trace ID in the W3C traceparent header.', latencyEstimate: '10ms' },
        { step: 2, title: 'Too many errors: the circuit opens', description: 'If more than 50% of calls fail within a 10-second window, the circuit opens.', activeNodes: ['circuit_breaker', 'flaky_svc'], highlightDetails: 'The struggling service stops receiving traffic, which gives it room to recover.', latencyEstimate: '0.1ms' },
        { step: 3, title: 'Fail fast with a fallback', description: 'While open, calls do not reach the payment service. The breaker returns the fallback answer at once.', activeNodes: ['circuit_breaker', 'fallback_cache', 'traffic'], highlightDetails: 'Users get a quick degraded answer instead of waiting for timeouts, and the caller’s threads are not tied up.', latencyEstimate: '1ms' },
        { step: 4, title: 'Test recovery (half-open)', description: 'After a 30-second cooldown, the circuit goes half-open and lets a few trial requests through.', activeNodes: ['circuit_breaker', 'flaky_svc', 'otel_agent', 'jaeger_prom'], highlightDetails: 'If the trial requests succeed, the circuit closes again. If they fail, it opens for another cooldown.', latencyEstimate: '10ms' }
      ]
    },
    keyConcepts: [
      {
        name: 'Circuit breaker',
        explanation: 'A circuit breaker stops calling a failing service for a while, so one slow dependency does not tie up every caller and spread the failure.\n- Closed: normal operation. Calls go through, and the breaker counts failures.\n- Open: when failures pass a threshold (for example 50% over 10 seconds), the breaker opens. Calls fail at once or return a fallback, without calling the service.\n- Half-open: after a cooldown (for example 30 seconds), a few trial calls go through. If they succeed, the breaker closes. If they fail, it opens again.',
        prosAndCons: {
          pros: ['Gives the failing service time to recover.', 'Stops callers from running out of threads and connections while they wait for timeouts.'],
          cons: ['You must design a useful fallback, such as cached recommendations or a default answer.']
        }
      },
      {
        name: 'Retries with exponential backoff and jitter',
        explanation: 'Retrying at once after a failure makes all clients retry together, and that retry storm can keep a recovering service down.\n\nExponential backoff makes each wait longer: delay = min(cap, base × 2^attempt). Full jitter then picks a random wait between 0 and that delay. This spreads the retries out evenly over time instead of in waves.',
        prosAndCons: {
          pros: ['Flattens traffic spikes while a service recovers.'],
          cons: ['Requests that need several retries take longer, which raises tail latency (P99).']
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
        name: 'Observability: metrics, logs and traces',
        explanation: 'Observability means you can tell from the outside what the system is doing, and it rests on three kinds of data.\n1. Metrics (Prometheus, Datadog): numbers over time, such as CPU use, requests per second, error rate and P99 latency. They tell you that something is wrong.\n2. Logs (Loki, Elasticsearch): structured event records with context. They tell you what happened.\n3. Distributed traces (OpenTelemetry, Jaeger): every request carries a trace ID in its headers (W3C Trace Context), and each service records a timed span. A trace shows one request across 20 services and points to the slow one.',
        prosAndCons: {
          pros: ['Turns hours of guessing about a latency problem into minutes of reading a trace.'],
          cons: ['Tracing everything produces huge volumes. Head sampling keeps a fixed share (for example 1%) decided at the start. Keeping every error trace needs tail sampling, which decides after the request ends.']
        }
      }
    ],
    cheatSheet: [
      'RED method for services: Rate (requests per second), Errors (failed requests per second), Duration (latency at P50, P90 and P99).',
      'USE method for resources: Utilization (percent busy), Saturation (queued work), Errors (hardware or network errors).',
      'Bulkhead pattern: give each dependency its own thread pool and connection pool, so a stuck payment service cannot freeze product browsing.'
    ],
    commonMistakes: [
      'Retrying operations that are not idempotent (such as POST /charge) without an idempotency key, which can charge a customer twice.',
      'Watching only average latency. An average can look fine while 1% of users wait 10 seconds. Always watch P99 and P99.9.'
    ],
    interviewTips: [
      'End every system design interview with operations: monitoring, alerts, SLOs and SLAs (for example 99.99% uptime), circuit breakers, and disaster recovery.'
    ]
  }
];

export function getFundamentalById(id: string): FundamentalTopic | undefined {
  return FUNDAMENTAL_TOPICS.find((topic) => topic.id === id);
}
