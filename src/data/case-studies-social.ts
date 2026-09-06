import { CaseStudy } from '../types/system-design';

export const SOCIAL_CASE_STUDIES: CaseStudy[] = [
  {
    id: 'tinyurl',
    title: 'Design a URL Shortener (TinyURL / Bitly)',
    slug: 'url-shortener',
    tagline: 'High-throughput, read-heavy global URL redirection service with low latency and expiring links.',
    category: 'Social & Content',
    difficulty: 'Beginner',
    readTime: '15 min read',
    scaleSummary: {
      dau: '100 Million Active Users',
      qps: '11,600 Read QPS (Peak) / 116 Write QPS (Peak)',
      storage: '15 TB over 5 years (100M URLs created/month)',
      bandwidth: '5.8 MB/s Ingress / 58 MB/s Egress'
    },
    overview: 'A URL shortening service creates short aliases for long URLs (e.g. https://tinyurl.com/a9x3z1 -> https://en.wikipedia.org/wiki/Distributed_computing). The primary requirement is sub-15ms redirection latency, 99.999% availability, and resilient key generation without collisions.',
    keyChallenges: [
      'Generating unique 6-8 character short keys under high concurrent write loads without DB collisions',
      'Minimizing redirect latency (P99 < 10ms) using multi-tier caching and CDN edge redirects',
      'Handling 100:1 Read-to-Write ratio with 80/20 Pareto caching distribution',
      'Automated link expiration and analytics tracking without blocking the critical redirect path'
    ],
    functionalRequirements: [
      'Given a long URL, generate a unique, short alias (e.g., https://tiny.cc/xyz123)',
      'When accessing a short link, redirect user to the original long URL with HTTP 301 or 302',
      'Support custom vanity aliases (e.g. tiny.cc/my-awesome-link)',
      'Allow users to set optional expiration timestamps on links',
      'Collect basic analytics (click counts, referrer, geolocation)'
    ],
    nonFunctionalRequirements: [
      'High Availability: 99.999% uptime (redirections should never fail)',
      'Ultra Low Latency: Redirect lookup in < 15ms',
      'Short URLs must be unpredictable (prevent enumeration attacks)',
      'Read Heavy: Read-to-Write ratio of 100:1'
    ],
    outOfScope: [
      'Real-time fraud/malware deep inspection pipeline',
      'Complex enterprise user permissions and billing dashboards'
    ],
    capacityEstimations: {
      assumptions: [
        'New URL writes: 100 Million per month (100M / 30 / 86400 ≈ ~38.6 writes/sec avg, peak 116 QPS at 3x)',
        'URL reads/redirections: 10 Billion per month (~3,850 reads/sec average, peak 11,600 QPS at 3x)',
        'Storage retention: 5 years default',
        'Average URL mapping record size: 500 bytes (Short Key: 8 bytes, Long URL: 450 bytes, Timestamps, User ID)'
      ],
      metrics: [
        { label: 'Write QPS', value: '116 / sec', formula: '100M / (30 * 86,400) * 3x peak factor', description: 'Peak write generation requests (avg ~38.6 QPS)' },
        { label: 'Read QPS', value: '11,600 / sec', formula: '10B / (30 * 86,400) * 3x peak factor', description: 'Peak redirect lookups' },
        { label: '5-Year Storage', value: '15 TB', formula: '100M URLs/mo * 12 * 5 yrs * 500 bytes', description: 'Total database storage capacity required' },
        { label: 'Cache RAM (20% Daily Reads)', value: '38 GB', formula: '333M daily reads * 0.20 * 500 bytes', description: 'In-memory Redis cache for hot 20% URLs' }
      ],
      conclusion: 'A single high-spec server with Redis and a partitioned NoSQL Key-Value store (or PostgreSQL with B-tree index) can easily hold all 15TB of data and 38GB of RAM cache.'
    },
    architecture: {
      summary: 'Clients query Anycast DNS -> Edge CDN/Cloudflare (handles cached 301 redirects) -> Layer 7 Load Balancer -> Stateless Web Servers -> Key Generation Service (Pre-allocated token ranges via ZooKeeper/etcd) -> Redis Cache Cluster -> Partitioned Key-Value Database (DynamoDB / Cassandra) -> Async Kafka Event Stream for Analytics Workers.',
      nodes: [
        { id: 'client', label: 'Web / Mobile Clients', type: 'client', x: 8, y: 50, description: 'Initiates short link creation or redirect requests' },
        { id: 'dns_cdn', label: 'DNS & Edge CDN', type: 'cdn', x: 24, y: 50, description: 'Caches HTTP 301 permanent redirects at edge PoPs', techStack: ['Cloudflare', 'Anycast'] },
        { id: 'lb', label: 'Load Balancer (L7)', type: 'load_balancer', x: 40, y: 50, description: 'Routes traffic to stateless application clusters', techStack: ['Envoy', 'AWS ALB'] },
        { id: 'app_srv', label: 'URL Shortener API Service', type: 'service', x: 58, y: 50, description: 'Handles encoding, validation, and redirection logic', techStack: ['Go', 'Node.js'] },
        { id: 'redis', label: 'Redis Cache Cluster', type: 'cache', x: 76, y: 25, description: 'Stores hot short_key -> long_url mappings with LRU eviction', techStack: ['Redis 7 Cluster'], scaleMetric: '38 GB RAM, 95% Hit Ratio' },
        { id: 'db', label: 'Key-Value Database', type: 'database', x: 76, y: 75, description: 'Durable primary store for all URL records sharded by short_key', techStack: ['DynamoDB', 'PostgreSQL'], scaleMetric: '15 TB across 5 shards' },
        { id: 'kgs', label: 'Key Generation Service (KGS)', type: 'worker', x: 58, y: 15, description: 'Pre-generates random base62 keys using distributed ranges', techStack: ['etcd', 'Raft'] },
        { id: 'kafka', label: 'Kafka Analytics Stream', type: 'queue', x: 58, y: 85, description: 'Asynchronously buffers click events (IP, timestamp, user agent)', techStack: ['Apache Kafka'] },
        { id: 'click_worker', label: 'Analytics Aggregator', type: 'worker', x: 76, y: 92, description: 'Consumes click stream and updates ClickHouse OLAP', techStack: ['ClickHouse'] }
      ],
      edges: [
        { id: 'e1', from: 'client', to: 'dns_cdn', label: '1. GET /a9x3z1', protocol: 'HTTPS' },
        { id: 'e2', from: 'dns_cdn', to: 'lb', label: '2. Cache Miss Forward', protocol: 'HTTPS' },
        { id: 'e3', from: 'lb', to: 'app_srv', label: '3. Route Request', protocol: 'HTTPS' },
        { id: 'e4', from: 'app_srv', to: 'redis', label: '4. Check Cache (1ms)', protocol: 'TCP' },
        { id: 'e5', from: 'app_srv', to: 'db', label: '5. DB Fallback on Miss', protocol: 'NoSQL' },
        { id: 'e6', from: 'kgs', to: 'app_srv', label: 'Key Range Allocation', protocol: 'Internal RPC' },
        { id: 'e7', from: 'app_srv', to: 'kafka', label: 'Async Click Log', protocol: 'Async Queue', isAsync: true },
        { id: 'e8', from: 'kafka', to: 'click_worker', label: 'Stream Processing', protocol: 'Internal RPC', isAsync: true }
      ],
      flowSteps: [
        { step: 1, title: 'Client Request Received', description: 'User clicks https://tiny.cc/a9x3z1. The request reaches the nearest Edge CDN node.', activeNodes: ['client', 'dns_cdn'], highlightDetails: 'If CDN has cached 301 redirect, it immediately returns Location header (0ms origin load).', latencyEstimate: '5-10ms' },
        { step: 2, title: 'Load Balancer Routing', description: 'CDN misses and proxies request to the L7 Load Balancer, which routes to a healthy App Server instance.', activeNodes: ['dns_cdn', 'lb', 'app_srv'], highlightDetails: 'Stateless servers allow auto-scaling based on CPU & connection metrics.', latencyEstimate: '2ms' },
        { step: 3, title: 'In-Memory Cache Lookup', description: 'App server queries Redis Cluster using short key a9x3z1.', activeNodes: ['app_srv', 'redis'], highlightDetails: '95%+ hit ratio thanks to temporal locality (Pareto 80/20 rule).', latencyEstimate: '1-2ms' },
        { step: 4, title: 'Database Fallback (On Miss)', description: 'If cache miss, server queries DynamoDB / PostgreSQL using short_key as primary hash key.', activeNodes: ['app_srv', 'db'], highlightDetails: 'Result is populated back into Redis with TTL + Jitter.', latencyEstimate: '5-10ms' },
        { step: 5, title: 'Async Click Event Emitted', description: 'Server publishes click metadata (timestamp, geo, referrer) to Kafka and immediately sends HTTP 302/301 redirect to client.', activeNodes: ['app_srv', 'kafka', 'client'], highlightDetails: 'Analytics logging is non-blocking to keep redirection snappy.', latencyEstimate: '1ms' }
      ]
    },
    apiDesign: [
      {
        method: 'POST',
        path: '/api/v1/urls',
        description: 'Shorten a long URL',
        requestBody: '{\n  "long_url": "https://example.com/very/long/path",\n  "custom_alias": "my-promo-link",\n  "expire_at": 1780000000\n}',
        responseBody: '{\n  "short_url": "https://tiny.cc/my-promo-link",\n  "short_key": "my-promo-link",\n  "created_at": 1724000000\n}'
      },
      {
        method: 'GET',
        path: '/{short_key}',
        description: 'Redirect to target destination',
        responseBody: 'HTTP 302 Found\nLocation: https://example.com/very/long/path'
      },
      {
        method: 'GET',
        path: '/api/v1/urls/{short_key}/analytics',
        description: 'Retrieve click statistics',
        responseBody: '{\n  "total_clicks": 142850,\n  "top_countries": [{"country": "US", "count": 82000}],\n  "referrers": [{"source": "twitter.com", "count": 64000}]\n}'
      }
    ],
    databaseDesign: [
      {
        tableName: 'urls',
        type: 'NoSQL Key-Value',
        shardingKey: 'short_key',
        fields: [
          { name: 'short_key', type: 'VARCHAR(8)', isPrimary: true, notes: 'Base62 encoded unique identifier (Hash Key)' },
          { name: 'original_url', type: 'VARCHAR(2048)', notes: 'Destination destination address' },
          { name: 'user_id', type: 'UUID', isIndex: true, notes: 'Creator account ID' },
          { name: 'created_at', type: 'BIGINT', notes: 'Epoch timestamp' },
          { name: 'expire_at', type: 'BIGINT', isIndex: true, notes: 'Expiration timestamp for TTL cleanup' }
        ],
        notes: 'Sharded horizontally by MD5(short_key). 15TB total dataset.'
      },
      {
        tableName: 'url_clicks_daily',
        type: 'Time-Series',
        shardingKey: 'short_key, date',
        fields: [
          { name: 'short_key', type: 'VARCHAR(8)', isPrimary: true },
          { name: 'date', type: 'DATE', isPrimary: true },
          { name: 'clicks', type: 'BIGINT' },
          { name: 'country_code', type: 'CHAR(2)' },
          { name: 'referrer', type: 'VARCHAR(255)' }
        ],
        notes: 'Stored in ClickHouse or Cassandra for fast aggregation.'
      }
    ],
    deepDives: [
      {
        title: 'Key Generation: MD5 vs Base62 vs Pre-Allocated KGS Token Ranges',
        subtitle: 'How to avoid hash collisions and database write locks',
        content: `Generating a 7-character string using Base62 (a-z, A-Z, 0-9) yields 62^7 ≈ 3.52 Trillion unique URLs, which is more than enough for decades of writes.\n\nThree Approaches:\n1. Hash & Truncate (e.g. MD5(long_url) -> take first 7 chars): High probability of hash collision. Requires querying the DB to check if the key already exists (expensive read-before-write).\n2. Centralized Auto-Increment ID + Base62: Convert a 64-bit integer ID to Base62. Single SQL auto-increment creates a massive write bottleneck.\n3. Distributed Key Generation Service (KGS) with Range Allocation (The Best Pattern): A dedicated service (backed by ZooKeeper or etcd) pre-generates unique 64-bit ID ranges in memory (e.g. Server 1 gets IDs 1,000,000 to 1,999,999; Server 2 gets 2,000,000 to 2,999,999). Each app server encodes its assigned sequence number into Base62 locally without any network locks or DB checks!`,
        keyTakeaways: [
          'Pre-allocated ranges eliminate write locks and collision retries completely.',
          'If a server crashes, its unused pre-allocated IDs are simply skipped (negligible loss in a 3.5 Trillion pool).',
          'Base62 encoding is URL-safe and does not require escape characters.'
        ],
        tradeoffs: {
          optionA: 'MD5 Hash with Collision Retries',
          optionB: 'Pre-Allocated Distributed Range KGS',
          prosA: ['Same long URL produces same short URL naturally'],
          prosB: ['Zero collision checks, O(1) lock-free key generation, scales infinitely'],
          decision: 'KGS Range Allocation is superior for high concurrency.'
        }
      },
      {
        title: 'HTTP 301 Permanent Redirect vs HTTP 302 Temporary Redirect',
        subtitle: 'Balancing client caching vs server analytics visibility',
        content: `Choosing between 301 and 302 is a critical system design interview topic:\n- HTTP 301 (Moved Permanently): Browsers and Edge CDNs cache the redirection locally. Subsequent clicks go directly to target URL without hitting your shortener server. Result: Minimum latency for users, zero server load, BUT you lose the ability to track click analytics on repeat visits.\n- HTTP 302 (Found / Temporary Redirect): Browser always queries your shortener server on every click. Result: 100% accurate click analytics and tracking, at the cost of slightly higher server traffic.\n\nRecommended Hybrid Architecture: Return HTTP 302 by default for analytics fidelity, with a short Cache-Control: max-age=300 header to prevent browser DDoS while keeping stats fresh.`,
        keyTakeaways: [
          'Use 301 when infrastructure cost is primary priority and analytics are not monetized.',
          'Use 302 when detailed attribution, fraud monitoring, or real-time analytics are required.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Hot URL Sudden Spikes (e.g. Viral Super Bowl tweet)',
        impact: 'A single key gets 100,000 reads/sec, overloading a single Redis cache node (Hot Key Problem).',
        mitigation: 'Implement Local In-Memory Cache (e.g. Caffeine/LRU) directly on API web nodes for 10-30 seconds, or replicate hot keys across Redis shards using key suffix hashing (key:1, key:2).'
      },
      {
        bottleneck: 'Expired URLs Accumulation',
        impact: 'Database grows unbounded with dead links, degrading index efficiency and wasting storage.',
        mitigation: 'Use TTL features native to NoSQL (DynamoDB TTL automatically purges expired records at zero read unit cost) + asynchronous daily sweeping batch jobs.'
      }
    ],
    interviewQA: [
      {
        question: 'How do you prevent malicious users from guessing consecutive short URLs?',
        hint: 'Sequential Base62 IDs are predictable.',
        goodAnswer: 'Instead of linear Base62 encoding, pass the sequential ID through a deterministic Feistel cipher or multiplicative inverse (Fletcher-like hash) to scramble the bits before Base62 encoding, making consecutive IDs appear completely random.',
        pitfalls: 'Suggesting slow random string generation loops with DB duplicate checks.'
      },
      {
        question: 'How do you support custom vanity URLs (e.g., tiny.cc/my-brand)?',
        hint: 'Custom aliases can collide with system-generated IDs.',
        goodAnswer: 'Store custom aliases in the same database table with short_key as primary key. Check for existence using a fast Redis SET or Bloom Filter. If available, insert into DB with a reserved flag.',
        pitfalls: 'Creating a separate table that requires double querying on every redirect.'
      }
    ],
    similarSystems: ['Bitly', 'Dub.co', 'Ow.ly', 'Rebrandly'],
    tags: ['Key-Value Store', 'Base62', 'Redis', 'CDN', 'ZooKeeper']
  },
  {
    id: 'twitter-newsfeed',
    title: 'Design Twitter / X Timeline & News Feed',
    slug: 'twitter-news-feed',
    tagline: 'High-throughput social timeline generation supporting millions of concurrent reads, fanout-on-write, and the celebrity problem.',
    category: 'Social & Content',
    difficulty: 'Intermediate',
    readTime: '22 min read',
    scaleSummary: {
      dau: '300 Million Daily Active Users',
      qps: '350,000 Read QPS (Timeline) / 35,000 Write QPS (Tweets)',
      storage: '40 TB / day (Tweets + Media Metadata)',
      bandwidth: '70 GB/s Egress / 3.5 GB/s Ingress'
    },
    overview: 'Twitter allows users to post 280-character tweets, follow other users, and view a personalized Home Timeline of recent tweets from everyone they follow. The system must render feeds in under 100ms despite extreme write fanout and celebrity accounts with 100M+ followers.',
    keyChallenges: [
      'Fanout Write Amplification: A celebrity posting a tweet triggers 100M timeline cache updates',
      'Timeline Materialization: Choosing between Fanout-on-Write (Push) vs Fanout-on-Read (Pull) vs Hybrid',
      'Snowflake Distributed ID Generation: Generating 64-bit k-sorted unique IDs across datacenters',
      'High Availability and Partition Tolerance under massive live event spikes (e.g. World Cup, Elections)'
    ],
    functionalRequirements: [
      'Users can post new tweets (text, images, video links)',
      'Users can follow and unfollow other users',
      'Users can view their Home Timeline (reverse chronological or ranked tweets from followed accounts)',
      'Users can view a User Timeline (tweets posted by a specific user)'
    ],
    nonFunctionalRequirements: [
      'Home Timeline rendering latency < 100ms at P99',
      'Tweet posting latency < 500ms',
      'High Availability (99.99%) with graceful degradation during outages',
      'Eventual Consistency acceptable for timeline updates (within 2-5 seconds)'
    ],
    outOfScope: ['Live Video Streaming', 'Direct Messaging E2EE', 'Ad Auction Bidding Engine'],
    capacityEstimations: {
      assumptions: [
        '300M DAU; each user checks Home Timeline 5 times/day = 1.5B reads/day (~17,400 QPS avg, 350,000 peak QPS)',
        '100M tweets posted/day (~1,160 QPS avg, 35,000 peak QPS)',
        'Average follower count: 200 followers per user; Celebrities: up to 150M followers'
      ],
      metrics: [
        { label: 'Timeline Read QPS', value: '350,000 QPS', formula: '1.5B reads / 86,400 * 20x peak burst factor', description: 'Peak home timeline requests' },
        { label: 'Tweet Write QPS', value: '35,000 QPS', formula: '100M tweets / 86,400 * 30x peak event factor', description: 'Peak tweet creations' },
        { label: 'Home Timeline Cache Size', value: '240 GB RAM', formula: '300M users * 800 tweet IDs * 8 bytes (Active users only)', description: 'Redis timeline memory for active users' }
      ],
      conclusion: 'A hybrid Fanout model with Redis in-memory timeline lists is required to satisfy the sub-100ms timeline read latency SLA.'
    },
    architecture: {
      summary: 'Clients communicate via CDN & Load Balancers to Tweet Ingestion Service and Timeline Service. Tweets are assigned 64-bit Snowflake IDs and written to Cassandra and Redis. The Fanout Service determines whether to Push to followers Redis Timeline lists or Pull dynamically for celebrities.',
      nodes: [
        { id: 'client', label: 'Mobile & Web Clients', type: 'client', x: 8, y: 50, description: 'Post tweets and scroll timeline' },
        { id: 'lb', label: 'Layer 7 Load Balancer', type: 'load_balancer', x: 26, y: 50, description: 'Distributes traffic with TLS termination', techStack: ['Envoy', 'Nginx'] },
        { id: 'tweet_service', label: 'Tweet Ingestion Service', type: 'service', x: 45, y: 30, description: 'Validates tweets and writes to storage', techStack: ['Java / Scala'] },
        { id: 'timeline_service', label: 'Timeline Query Service', type: 'service', x: 45, y: 70, description: 'Fetches and hydrates user timelines', techStack: ['Go / Netty'] },
        { id: 'snowflake', label: 'Snowflake ID Generator', type: 'worker', x: 45, y: 10, description: 'Generates 64-bit time-ordered IDs', techStack: ['Twitter Snowflake'] },
        { id: 'fanout_queue', label: 'Fanout Message Queue', type: 'queue', x: 65, y: 30, description: 'Buffers fanout tasks for async workers', techStack: ['Kafka'] },
        { id: 'fanout_workers', label: 'Fanout Worker Cluster', type: 'worker', x: 82, y: 30, description: 'Updates Redis timeline lists for regular users', techStack: ['Go Workers'] },
        { id: 'timeline_cache', label: 'Timeline Redis Cluster', type: 'cache', x: 65, y: 70, description: 'Stores user_id -> [tweet_ids] lists (800 items)', techStack: ['Redis Cluster'], scaleMetric: '240 GB RAM' },
        { id: 'tweet_db', label: 'Tweet Store (Cassandra)', type: 'database', x: 82, y: 70, description: 'Durable write-optimized tweet storage', techStack: ['Apache Cassandra / ScyllaDB'] },
        { id: 'social_graph', label: 'Social Graph DB (Followers)', type: 'database', x: 65, y: 10, description: 'Indexes follow relationships', techStack: ['FlockDB / PostgreSQL'] }
      ],
      edges: [
        { id: 'e1', from: 'client', to: 'lb', label: 'HTTPS API', protocol: 'HTTPS' },
        { id: 'e2', from: 'lb', to: 'tweet_service', label: 'POST /tweet', protocol: 'HTTPS' },
        { id: 'e3', from: 'lb', to: 'timeline_service', label: 'GET /home_timeline', protocol: 'HTTPS' },
        { id: 'e4', from: 'tweet_service', to: 'snowflake', label: 'Get ID', protocol: 'gRPC' },
        { id: 'e5', from: 'tweet_service', to: 'tweet_db', label: 'Save Tweet', protocol: 'NoSQL' },
        { id: 'e6', from: 'tweet_service', to: 'fanout_queue', label: 'Publish Fanout Event', protocol: 'Async Queue', isAsync: true },
        { id: 'e7', from: 'fanout_queue', to: 'fanout_workers', label: 'Consume Job', protocol: 'Internal RPC', isAsync: true },
        { id: 'e8', from: 'fanout_workers', to: 'social_graph', label: 'Fetch Followers', protocol: 'SQL' },
        { id: 'e9', from: 'fanout_workers', to: 'timeline_cache', label: 'RPUSH tweet_id', protocol: 'TCP' },
        { id: 'e10', from: 'timeline_service', to: 'timeline_cache', label: 'LRANGE 0 20', protocol: 'TCP' },
        { id: 'e11', from: 'timeline_service', to: 'tweet_db', label: 'Hydrate Tweet Metadata', protocol: 'NoSQL' }
      ],
      flowSteps: [
        { step: 1, title: 'Tweet Ingestion', description: 'User posts tweet. Tweet Service requests unique 64-bit ID from Snowflake Generator and writes record to Cassandra.', activeNodes: ['client', 'lb', 'tweet_service', 'snowflake', 'tweet_db'], highlightDetails: 'Snowflake ID encodes timestamp directly, allowing natural time-based sorting.', latencyEstimate: '15ms' },
        { step: 2, title: 'Fanout Evaluation', description: 'Tweet Service publishes event to Kafka. Fanout Workers check author follower count in Social Graph DB.', activeNodes: ['tweet_service', 'fanout_queue', 'fanout_workers', 'social_graph'], highlightDetails: 'If author has < 25,000 followers, proceed to Push. If Celebrity (>25k followers), skip push!', latencyEstimate: '5ms' },
        { step: 3, title: 'Push Timeline Materialization', description: 'Workers execute LPUSH into each follower Redis timeline list and TRIM to keep the latest 800 tweet IDs.', activeNodes: ['fanout_workers', 'timeline_cache'], highlightDetails: 'Pipelined Redis commands write up to 10,000 lists in parallel.', latencyEstimate: '50-200ms' },
        { step: 4, title: 'Timeline Query & Hybrid Merge', description: 'When a user opens app, Timeline Service fetches cached tweet IDs from Redis, plus queries tweets from followed celebrities (Pull model), and merges them in memory.', activeNodes: ['client', 'timeline_service', 'timeline_cache', 'tweet_db'], highlightDetails: 'K-way merge on timestamp delivers personalized feed in < 30ms.', latencyEstimate: '25ms' }
      ]
    },
    apiDesign: [
      {
        method: 'POST',
        path: '/api/v2/tweets',
        description: 'Post a new tweet',
        requestBody: '{\n  "text": "Hello world! Building distributed systems.",\n  "media_ids": ["med_987"]\n}',
        responseBody: '{\n  "tweet_id": "189283748291039485",\n  "created_at": 1724000000\n}'
      },
      {
        method: 'GET',
        path: '/api/v2/timeline/home',
        description: 'Fetch user home timeline with pagination cursor',
        responseBody: '{\n  "tweets": [\n    {\n      "id": "189283748291039485",\n      "author_id": "usr_42",\n      "text": "Hello world!",\n      "likes_count": 1204\n    }\n  ],\n  "next_cursor": "189283748291039000"\n}'
      }
    ],
    databaseDesign: [
      {
        tableName: 'tweets',
        type: 'Wide-Column',
        shardingKey: 'author_id (Partition Key), tweet_id (Clustering Key DESC)',
        fields: [
          { name: 'author_id', type: 'UUID', isPrimary: true },
          { name: 'tweet_id', type: 'BIGINT', isPrimary: true, notes: 'Snowflake ID (time-ordered)' },
          { name: 'content', type: 'VARCHAR(280)' },
          { name: 'media_urls', type: 'LIST<VARCHAR>' },
          { name: 'created_at', type: 'TIMESTAMP' }
        ],
        notes: 'Cassandra cluster storing all historical tweets with fast partition slice queries.'
      },
      {
        tableName: 'follows',
        type: 'SQL',
        shardingKey: 'user_id',
        fields: [
          { name: 'user_id', type: 'UUID', isPrimary: true },
          { name: 'followee_id', type: 'UUID', isPrimary: true },
          { name: 'created_at', type: 'TIMESTAMP' }
        ],
        notes: 'Indexes both (user_id, followee_id) and reverse index (followee_id, user_id).'
      }
    ],
    deepDives: [
      {
        title: 'The Fanout Problem: Push vs Pull vs Hybrid Architecture',
        subtitle: 'Why pure Push and pure Pull fail at scale',
        content: `1. Fanout-on-Write (Push Model):\n- When user posts a tweet, the system immediately pushes the tweet ID into all followers' Redis timeline lists.\n- Pros: Reading the timeline is ultra-fast (O(1) Redis LRANGE lookup).\n- Cons: A celebrity with 100M followers (e.g. Elon Musk) triggers 100 Million write operations for a single tweet, overwhelming workers and memory.\n\n2. Fanout-on-Read (Pull Model):\n- When a user opens their timeline, the system dynamically queries tweets from all users they follow, sorts them by timestamp, and returns.\n- Pros: Zero write overhead when tweeting.\n- Cons: Read latency is terrible. If a user follows 2,000 people, the query must hit 2,000 partitions and perform a 2000-way merge at runtime on every refresh.\n\n3. The Hybrid Model (Twitter / Instagram Solution):\n- Regular Users (< 25,000 followers): Use Push (Fanout-on-Write) into followers' Redis caches.\n- Celebrities (> 25,000 followers): Do NOT push. Instead, when a follower requests their timeline, the system does a fast Pull for their followed celebrities' latest tweets and merges them with their pre-computed Redis timeline list.`,
        keyTakeaways: [
          'Hybrid fanout solves the celebrity write explosion while maintaining sub-50ms read latency.',
          'Active vs Inactive Users: Only materialize timelines for users who logged in within the last 14 days to save 80% Redis RAM.'
        ]
      },
      {
        title: 'Twitter Snowflake 64-bit ID Generation Deep Dive',
        subtitle: 'Generating 100,000 unique, time-sortable IDs per second across distributed nodes',
        content: `A 64-bit Snowflake ID consists of:\n- 1 bit: Unused sign bit (always 0)\n- 41 bits: Epoch timestamp in milliseconds (~69 years of lifetime)\n- 10 bits: Machine / Worker node ID (supports 1,024 independent generator nodes across datacenters)\n- 12 bits: Local Sequence number (0 to 4,095 per millisecond per node)\n\nCapacity: 1,024 nodes * 4,096 IDs/ms = 4.19 Million unique IDs per second without any cross-server coordination or locks!`,
        keyTakeaways: [
          'Naturally k-sorted by creation time, eliminating secondary timestamp indexes.',
          'NTP clock synchronization with max backward tolerance is required to prevent clock drift duplicates.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Celebrity Retweet Storm',
        impact: 'Millions of users simultaneously load and like the same tweet.',
        mitigation: 'Cache the hydrated tweet JSON object in Memcached/Redis clusters with read replicas and local memory tiering.'
      },
      {
        bottleneck: 'Social Graph DB Hotspot',
        impact: 'Querying followers of an account with 80M followers takes too long for the fanout queue.',
        mitigation: 'Partition social graph lists into chunks of 10,000 followers and spawn parallel Kafka worker sub-jobs.'
      }
    ],
    interviewQA: [
      {
        question: 'Why not use SQL JOINs to build the home timeline on the fly?',
        hint: 'Consider scale of 350,000 QPS over billions of follow relationships.',
        goodAnswer: 'A query like SELECT * FROM tweets WHERE author_id IN (SELECT followee_id FROM follows WHERE user_id = ?) ORDER BY created_at DESC LIMIT 20 requires scanning millions of rows across disk-based DB nodes. At 350k QPS, this would instantly lock the database. Pre-computed Redis timeline lists are mandatory.',
        pitfalls: 'Suggesting adding more SQL read replicas instead of architectural pre-computation.'
      }
    ],
    similarSystems: ['Facebook News Feed', 'LinkedIn Feed', 'Threads', 'Mastodon'],
    tags: ['Fanout-on-Write', 'Snowflake ID', 'Redis', 'Cassandra', 'Kafka']
  },
  {
    id: 'instagram-photo-sharing',
    title: 'Design Instagram / Photo Sharing Platform',
    slug: 'instagram-architecture',
    tagline: 'High-throughput photo and stories ingestion, multi-resolution image processing pipelines, and scalable social graph feeds.',
    category: 'Social & Content',
    difficulty: 'Intermediate',
    readTime: '20 min read',
    scaleSummary: {
      dau: '500 Million Daily Active Users',
      qps: '500,000 Read QPS / 25,000 Photo Upload QPS',
      storage: '100 TB / day of images & videos',
      bandwidth: '250 GB/s Egress / 12.5 GB/s Ingress'
    },
    overview: 'Instagram allows hundreds of millions of users to upload photos and short videos with filters, follow friends, view explore feeds, and post ephemeral 24-hour Stories. The system requires an asynchronous image transcoding pipeline and petabyte-scale distributed object storage.',
    keyChallenges: [
      'Ingesting and transcoding 100M photos/day into multiple resolutions (thumbnails, 1080p, compressed mobile formats)',
      'Optimizing CDN caching hit ratios to serve 250 GB/s of image downloads globally',
      'Implementing 24-hour ephemeral Stories with automatic expiration and fast sequential playback',
      'Feed ranking combining chronological timelines with machine learning engagement scores'
    ],
    functionalRequirements: [
      'Upload, crop, filter, and share photos/videos with captions',
      'User activity feed (photos from followed accounts)',
      'User profile page displaying uploaded photo grid',
      'Like, comment, and tag users in photos',
      'Ephemeral 24-hour Stories with view receipts'
    ],
    nonFunctionalRequirements: [
      'Upload completion in < 2 seconds for 5MB photo',
      'Feed loading latency < 200ms',
      '99.99% Availability and 99.999999999% (11 9s) photo durability',
      'Seamless multi-device image rendering with WebP / AVIF adaptive compression'
    ],
    outOfScope: ['Live Video Broadcast', 'Direct In-App Shopping Checkout'],
    capacityEstimations: {
      assumptions: [
        '500M DAU; 100M photos uploaded per day',
        'Average photo size after processing: 1 MB across all resolutions',
        'Storage per day = 100M * 1 MB = 100 TB/day (36.5 PB/year)',
        'Users view 40 photos/day on average = 20 Billion photo views/day (~231,000 QPS avg, 500,000 peak QPS)'
      ],
      metrics: [
        { label: 'Upload Ingress QPS', value: '25,000 QPS', formula: '100M / 86,400 * 20x peak burst', description: 'Peak photo creation requests' },
        { label: 'Photo View Egress QPS', value: '500,000 QPS', formula: '20B / 86,400 * 2x peak factor', description: 'Peak photo delivery requests' },
        { label: 'Annual Storage Growth', value: '36.5 Petabytes', formula: '100 TB/day * 365 days', description: 'Durable AWS S3 / GCS object storage capacity' }
      ],
      conclusion: 'Direct-to-S3 client uploads via pre-signed URLs and a global multi-CDN caching layer are non-negotiable.'
    },
    architecture: {
      summary: 'Clients request Pre-signed S3 URLs -> Direct upload to Object Store -> S3 Event triggers SQS -> Transcoding Workers generate WebP/AVIF thumbnails -> Metadata saved in PostgreSQL/Cassandra -> Hybrid Fanout feed generated into Redis.',
      nodes: [
        { id: 'client', label: 'Mobile App (iOS/Android)', type: 'client', x: 8, y: 50, description: 'Uploads media & scrolls visual feed' },
        { id: 'cdn', label: 'Global Image CDN', type: 'cdn', x: 26, y: 75, description: 'Caches static photo assets at PoPs', techStack: ['Fastly / CloudFront'] },
        { id: 'gateway', label: 'API Gateway', type: 'gateway', x: 26, y: 30, description: 'Auth token verification & rate limiting', techStack: ['Envoy'] },
        { id: 'upload_srv', label: 'Media Upload Service', type: 'service', x: 45, y: 20, description: 'Generates secure pre-signed S3 upload tokens', techStack: ['Python / Go'] },
        { id: 's3_raw', label: 'Raw Object Storage (S3)', type: 'storage', x: 65, y: 20, description: 'Receives direct client multipart uploads', techStack: ['AWS S3'] },
        { id: 'image_queue', label: 'Transcode Task Queue', type: 'queue', x: 82, y: 20, description: 'Buffers image processing jobs', techStack: ['RabbitMQ / SQS'] },
        { id: 'workers', label: 'Image Processing Workers', type: 'worker', x: 92, y: 40, description: 'Generates 150px, 640px, 1080p WebP assets', techStack: ['C++ libvips / FFmpeg'] },
        { id: 's3_processed', label: 'Processed Asset Store', type: 'storage', x: 65, y: 50, description: 'Serves optimized photos to CDN origin', techStack: ['AWS S3 Standard'] },
        { id: 'metadata_db', label: 'Metadata & Graph DB', type: 'database', x: 45, y: 70, description: 'Stores photo records, likes, comments, and follows', techStack: ['PostgreSQL (Sharded) / Cassandra'] }
      ],
      edges: [
        { id: 'e1', from: 'client', to: 'gateway', label: '1. Request Upload URL', protocol: 'HTTPS' },
        { id: 'e2', from: 'gateway', to: 'upload_srv', label: '2. Issue Presigned URL', protocol: 'Internal RPC' },
        { id: 'e3', from: 'client', to: 's3_raw', label: '3. Direct Binary PUT', protocol: 'HTTPS' },
        { id: 'e4', from: 's3_raw', to: 'image_queue', label: '4. S3 ObjectCreated Event', protocol: 'Async Queue', isAsync: true },
        { id: 'e5', from: 'image_queue', to: 'workers', label: '5. Pull Transcode Job', protocol: 'Internal RPC', isAsync: true },
        { id: 'e6', from: 'workers', to: 's3_processed', label: '6. Save WebP Variants', protocol: 'HTTPS' },
        { id: 'e7', from: 'workers', to: 'metadata_db', label: '7. Insert Photo Metadata', protocol: 'SQL' },
        { id: 'e8', from: 'client', to: 'cdn', label: '8. Fetch Images via CDN', protocol: 'HTTPS' },
        { id: 'e9', from: 'cdn', to: 's3_processed', label: 'Origin Fetch on Miss', protocol: 'HTTPS' }
      ],
      flowSteps: [
        { step: 1, title: 'Presigned Upload Authorization', description: 'Client asks API Gateway for an upload token. Media service validates user quota and issues signed S3 URL with 15-min TTL.', activeNodes: ['client', 'gateway', 'upload_srv'], highlightDetails: 'Bypasses application servers, keeping backend CPU and bandwidth free.', latencyEstimate: '20ms' },
        { step: 2, title: 'Direct Binary Upload', description: 'Client uploads compressed image directly to S3 bucket in 5MB chunks.', activeNodes: ['client', 's3_raw'], highlightDetails: 'HTTP PUT straight to AWS S3 multi-region edge.', latencyEstimate: '400ms' },
        { step: 3, title: 'Asynchronous Image Transcoding', description: 'S3 triggers notification to SQS. Processing workers fetch raw image, apply filters, and generate 4 resolution variants in WebP/AVIF.', activeNodes: ['s3_raw', 'image_queue', 'workers', 's3_processed'], highlightDetails: 'Libvips executes parallel SIMD image downscaling.', latencyEstimate: '350ms' },
        { step: 4, title: 'Feed Serving via CDN', description: 'Followers requesting photo feeds get optimized CDN URLs. CDN serves images from edge RAM cache in < 15ms.', activeNodes: ['client', 'cdn', 's3_processed'], highlightDetails: '98% CDN cache hit ratio for recent media.', latencyEstimate: '15ms' }
      ]
    },
    apiDesign: [
      {
        method: 'POST',
        path: '/api/v1/media/presign',
        description: 'Get pre-signed upload URL for direct S3 upload',
        requestBody: '{\n  "file_type": "image/jpeg",\n  "file_size": 3482910\n}',
        responseBody: '{\n  "upload_url": "https://ig-raw.s3.amazonaws.com/uploads/xyz.jpg?AWS...",\n  "media_id": "med_102938"\n}'
      },
      {
        method: 'POST',
        path: '/api/v1/posts',
        description: 'Publish post after upload confirmation',
        requestBody: '{\n  "media_id": "med_102938",\n  "caption": "Sunset in Malibu #travel",\n  "location": "Malibu, CA"\n}',
        responseBody: '{\n  "post_id": "pst_87654",\n  "status": "PUBLISHED"\n}'
      }
    ],
    databaseDesign: [
      {
        tableName: 'posts',
        type: 'SQL',
        shardingKey: 'user_id',
        fields: [
          { name: 'post_id', type: 'BIGINT', isPrimary: true },
          { name: 'user_id', type: 'UUID', isIndex: true },
          { name: 'media_urls', type: 'JSONB', notes: '{"thumb": "...", "medium": "...", "full": "..."}' },
          { name: 'caption', type: 'TEXT' },
          { name: 'likes_count', type: 'INT' },
          { name: 'created_at', type: 'TIMESTAMP', isIndex: true }
        ],
        notes: 'PostgreSQL sharded by user_id with Read Replicas.'
      }
    ],
    deepDives: [
      {
        title: 'Stories Architecture: 24-Hour Ephemeral Storage & Fast Scrubbing',
        subtitle: 'Handling billions of daily story views with zero disk garbage collection overhead',
        content: `Instagram Stories disappear after 24 hours. Storing them in primary relational databases causes high fragmentation due to mass DELETE queries.\n\nOptimized Architecture:\n1. Dedicated Stories Redis Cluster: Store active story metadata as a Redis ZSET with score = expiration_timestamp. Queries for user stories use ZRANGEBYSCORE to get only unexpired stories in O(log N).\n2. S3 Object Lifecycle Expiration: Media files in the S3 stories bucket have an automatic 24-hour expiration policy, delegating cleanup to AWS infrastructure without database I/O.\n3. Seen Receipts Tracking: Store a user seen status in a Redis Bitmap (1 bit per story ID) or client-side local cache to eliminate server roundtrips when showing colored story rings.`,
        keyTakeaways: [
          'Redis ZSET + S3 Lifecycle rules prevent database delete storms.',
          'Bitmap indexing allows checking if a user has watched 50 stories in a single bitwise operation.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'S3 Single Prefix Rate Limit (3,500 PUT / 5,500 GET per sec)',
        impact: 'Massive concurrent uploads to a single s3://bucket/photos/ folder trigger HTTP 503 SlowDown errors.',
        mitigation: 'Prefix S3 object keys with a hash or reverse timestamp (e.g., s3://bucket/2a8f/photos/med_123.jpg) to distribute requests across multiple S3 physical partition drives.'
      }
    ],
    interviewQA: [
      {
        question: 'How do you handle users scrolling very fast through thousands of photos on mobile?',
        hint: 'Network bandwidth and memory constraints on phones.',
        goodAnswer: 'Implement progressive image loading (BlurHash placeholder first, then low-res WebP, then full resolution on viewport lock) combined with client-side windowed recycling view and viewport prefetching for the next 3 items.',
        pitfalls: 'Downloading full 1080p uncompressed JPEG images immediately upon feed scroll.'
      }
    ],
    similarSystems: ['Pinterest', 'Flickr', 'Snapchat', 'BeReal'],
    tags: ['S3 Object Storage', 'CDN', 'Transcoding', 'Ephemeral Stories', 'PostgreSQL']
  },
  {
    id: 'youtube-netflix-video-streaming',
    title: 'Design YouTube / Netflix (Global Video Streaming)',
    slug: 'video-streaming-platform',
    tagline: 'Petabyte-scale video ingestion, multi-bitrate chunked transcoding (DASH/HLS), and edge CDN streaming architecture.',
    category: 'Social & Content',
    difficulty: 'Advanced',
    readTime: '25 min read',
    scaleSummary: {
      dau: '1 Billion Daily Active Users',
      qps: '5 Million Video Stream Requests/sec / 50,000 Video Uploads/hour',
      storage: '500 Petabytes active video library',
      bandwidth: '5 Terabits / second global egress'
    },
    overview: 'A global video streaming service ingests raw video files, encodes them into multiple resolutions (4K, 1080p, 720p, 360p) across multiple codecs (H.264, VP9, AV1), splits them into 2-6 second chunks, and streams them smoothly to clients using Adaptive Bitrate Streaming (HLS / MPEG-DASH).',
    keyChallenges: [
      'Transcoding massive 50GB raw video files quickly and cost-effectively using distributed DAG worker clusters',
      'Adaptive Bitrate (ABR) algorithm: Dynamically adjusting video quality based on changing client network bandwidth',
      'Minimizing CDN egress costs by deploying custom ISP edge appliances (Netflix Open Connect pattern)',
      'Near-instant video start time (Time-To-First-Frame < 200ms) with intelligent chunk prefetching'
    ],
    functionalRequirements: [
      'Upload and transcode videos in popular formats (.mp4, .mov, .avi)',
      'Stream video seamlessly on web, mobile, and smart TVs without buffering',
      'Adaptive resolution switching (auto-adjust quality to network speed)',
      'Search videos by title, tags, and description',
      'Track video view counts and watch history resume positions'
    ],
    nonFunctionalRequirements: [
      'Low Playback Latency: Playback starts in < 500ms',
      'Zero Stuttering / Buffering during network fluctuations',
      'High Durability: Video files must never be corrupted or lost (11 9s)',
      'Scale: Support millions of concurrent viewers during live events'
    ],
    outOfScope: ['Real-time 2-way WebRTC video calling', 'Digital Rights Management (DRM) licensing legal negotiations'],
    capacityEstimations: {
      assumptions: [
        '500 hours of video uploaded every minute = ~8.3 hours/sec',
        'Average raw video size: 300 MB per minute = 150 GB/min ingestion bandwidth',
        'Storage per minute after encoding into 5 resolutions: ~100 MB = 50 GB/min (72 TB/day new video)',
        'Active video library: 500 Petabytes',
        '1 Billion daily video views; Average watch time: 10 minutes at 2 Mbps = 150 MB per view'
      ],
      metrics: [
        { label: 'Ingress Bandwidth', value: '20 Gbps', formula: '500 hrs/min * 300 MB', description: 'Raw video upload ingestion traffic' },
        { label: 'Egress Bandwidth (Peak)', value: '5 Tbps', formula: '10M concurrent streams * 2 Mbps / 4 (CDN offload factor)', description: 'Total global video delivery bandwidth' },
        { label: 'Metadata QPS', value: '250,000 QPS', formula: 'Search, recommendations, and playback beacon logging', description: 'Backend API requests' }
      ],
      conclusion: 'Standard cloud egress costs would be astronomical; direct ISP peering and Edge Open Connect CDN appliances are mandatory.'
    },
    architecture: {
      summary: 'Clients upload raw video via pre-signed S3 URLs -> S3 event triggers Distributed DAG Transcoder (splits video into GOP chunks, encodes in parallel) -> Uploads HLS .m3u8 playlists and .ts segments to Object Storage -> Distributed to Global CDN and ISP Edge Caches -> Client player adapts bitrate dynamically.',
      nodes: [
        { id: 'client', label: 'Video Player Client', type: 'client', x: 8, y: 50, description: 'Adaptive Bitrate player (ExoPlayer, HLS.js)' },
        { id: 'cdn', label: 'Global Video CDN / ISP PoPs', type: 'cdn', x: 26, y: 70, description: 'Caches 2-second video chunks at ISP networks', techStack: ['Netflix Open Connect / Fastly'] },
        { id: 'gateway', label: 'API Gateway', type: 'gateway', x: 26, y: 30, description: 'Auth, recommendations, and search proxy', techStack: ['Envoy / Zuul'] },
        { id: 's3_raw', label: 'Raw Video Staging (S3)', type: 'storage', x: 45, y: 15, description: 'Stores original uploaded video before encoding', techStack: ['AWS S3'] },
        { id: 'dag_orchestrator', label: 'DAG Transcoding Engine', type: 'worker', x: 65, y: 15, description: 'Orchestrates chunking, audio extraction, and video filters', techStack: ['Temporal / Apache Airflow'] },
        { id: 'transcode_cluster', label: 'Transcode GPU Cluster', type: 'worker', x: 85, y: 15, description: 'Encodes chunks into AV1, VP9, H.264 at 4K/1080p/720p', techStack: ['FFmpeg + NVENC GPU'] },
        { id: 's3_encoded', label: 'Segmented Object Store', type: 'storage', x: 85, y: 50, description: 'Stores HLS master.m3u8 manifests and 4s video chunks', techStack: ['AWS S3 Standard'] },
        { id: 'metadata_db', label: 'Video Metadata Store', type: 'database', x: 45, y: 50, description: 'Indexes video titles, thumbnails, views, tags', techStack: ['Cassandra / Spanner'] },
        { id: 'search_cluster', label: 'Video Search Index', type: 'search', x: 45, y: 80, description: 'Full-text search over video metadata', techStack: ['Elasticsearch'] }
      ],
      edges: [
        { id: 'e1', from: 'client', to: 'gateway', label: '1. Get Upload Token', protocol: 'HTTPS' },
        { id: 'e2', from: 'client', to: 's3_raw', label: '2. Multipart Direct Upload', protocol: 'HTTPS' },
        { id: 'e3', from: 's3_raw', to: 'dag_orchestrator', label: '3. Trigger Workflow', protocol: 'Async Queue', isAsync: true },
        { id: 'e4', from: 'dag_orchestrator', to: 'transcode_cluster', label: '4. Parallel Chunk Transcode', protocol: 'Internal RPC', isAsync: true },
        { id: 'e5', from: 'transcode_cluster', to: 's3_encoded', label: '5. Write .m3u8 & .ts chunks', protocol: 'HTTPS' },
        { id: 'e6', from: 'dag_orchestrator', to: 'metadata_db', label: '6. Update Ready Status', protocol: 'SQL' },
        { id: 'e7', from: 'client', to: 'gateway', label: '7. Fetch .m3u8 Manifest', protocol: 'HTTPS' },
        { id: 'e8', from: 'client', to: 'cdn', label: '8. Stream 2s Chunks', protocol: 'HTTPS' },
        { id: 'e9', from: 'cdn', to: 's3_encoded', label: 'Fetch Chunk on Miss', protocol: 'HTTPS' }
      ],
      flowSteps: [
        { step: 1, title: 'Multipart Upload Ingestion', description: 'Client uploads 10GB raw video to S3 using S3 Multipart Upload API (uploading 20MB parts in parallel).', activeNodes: ['client', 's3_raw'], highlightDetails: 'If connection drops, only uncompleted 20MB parts need to be retransmitted.', latencyEstimate: '10-60s' },
        { step: 2, title: 'Chunk Splitting & DAG Transcoding', description: 'Temporal workflow splits video along GOP (Group of Pictures) boundaries into 100 small chunks and distributes to 50 GPU workers.', activeNodes: ['s3_raw', 'dag_orchestrator', 'transcode_cluster'], highlightDetails: 'Processes a 2-hour movie in under 4 minutes via massive parallelization.', latencyEstimate: '2-4 mins' },
        { step: 3, title: 'HLS Packaging & Manifest Creation', description: 'Workers stitch encoded chunks, generate master.m3u8 playlist file containing bandwidth profiles, and upload to S3.', activeNodes: ['transcode_cluster', 's3_encoded', 'metadata_db'], highlightDetails: 'Manifest lists multiple bitrates (e.g. 500kbps, 1500kbps, 4000kbps).', latencyEstimate: '500ms' },
        { step: 4, title: 'Adaptive Streaming Playback', description: 'Client player downloads master.m3u8, measures download throughput, and requests appropriate .ts chunk from nearest CDN edge.', activeNodes: ['client', 'cdn', 's3_encoded'], highlightDetails: 'Player automatically steps down to 720p if mobile signal weakens, preventing buffering.', latencyEstimate: '15-30ms' }
      ]
    },
    apiDesign: [
      {
        method: 'POST',
        path: '/api/v1/videos/upload-init',
        description: 'Initiate video upload session and get multipart upload ID',
        requestBody: '{\n  "title": "System Design Masterclass",\n  "file_size": 2147483648,\n  "duration_seconds": 3600\n}',
        responseBody: '{\n  "video_id": "vid_9876",\n  "upload_id": "mp_upload_abc123",\n  "part_size": 20971520\n}'
      },
      {
        method: 'GET',
        path: '/api/v1/videos/{video_id}/manifest.m3u8',
        description: 'Fetch HLS adaptive bitrate manifest',
        responseBody: '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=4500000,RESOLUTION=1920x1080\n1080p/playlist.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=1800000,RESOLUTION=1280x720\n720p/playlist.m3u8'
      }
    ],
    databaseDesign: [
      {
        tableName: 'videos',
        type: 'Wide-Column',
        shardingKey: 'video_id',
        fields: [
          { name: 'video_id', type: 'VARCHAR(16)', isPrimary: true },
          { name: 'uploader_id', type: 'UUID', isIndex: true },
          { name: 'title', type: 'VARCHAR(255)' },
          { name: 'manifest_url', type: 'VARCHAR(512)' },
          { name: 'duration', type: 'INT' },
          { name: 'status', type: 'VARCHAR(32)', notes: 'PROCESSING, READY, FAILED' },
          { name: 'views_count', type: 'BIGINT' }
        ],
        notes: 'ScyllaDB / Cassandra for high-throughput reads and concurrent view updates.'
      }
    ],
    deepDives: [
      {
        title: 'Adaptive Bitrate Streaming: HLS vs MPEG-DASH Protocols',
        subtitle: 'How modern players switch resolutions seamlessly without dropping frames',
        content: `Traditional progressive download (.mp4 file) downloads the entire file sequentially at fixed quality. If bandwidth drops below bitrate, video freezes.\n\nAdaptive Bitrate Architecture (HLS & DASH):\n1. Video is chopped into independent 2-6 second chunks (.ts or .m4s fragments).\n2. Each chunk is encoded at multiple resolutions/bitrates (e.g. 360p @ 400kbps, 720p @ 1.5Mbps, 1080p @ 4.5Mbps, 4K @ 15Mbps).\n3. Client player continuously measures download speed of the last chunk and buffer occupancy:\n   - If buffer is > 15s and network speed is high -> Request next chunk at 1080p.\n   - If buffer drops to < 4s (user enters subway tunnel) -> Instantly request next 2-second chunk at 360p.\n4. Result: Zero player stalls or buffering spinners!`,
        keyTakeaways: [
          'Master manifest (.m3u8 / .mpd) contains URIs for all bitrate streams.',
          'Chunk length trade-off: 2s chunks switch quality faster and reduce live latency; 6s chunks have better compression efficiency.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Massive Video View Counter Updates (Hot Video)',
        impact: 'A viral video gets 100,000 views/sec, causing write lock contention on a single DB row.',
        mitigation: 'Buffer view counts in Redis Distributed Counters (INCRBY) or Kafka stream and flush in batches of 1,000 views to the database every 10 seconds.'
      }
    ],
    interviewQA: [
      {
        question: 'How do you optimize CDN cache hits when 90% of videos in the long tail are rarely watched?',
        hint: 'Tiered caching and intelligent eviction.',
        goodAnswer: 'Implement Tiered Caching: Store popular top 10% videos on Edge CDN SSDs, warm the next 20% in regional Mid-Tier CDNs, and leave the remaining 70% cold long-tail videos stored on S3 Standard-IA, fetching on-demand only when requested.',
        pitfalls: 'Trying to cache all 500 Petabytes of video on edge servers.'
      }
    ],
    similarSystems: ['Netflix', 'Hulu', 'Twitch VOD', 'Disney+'],
    tags: ['HLS/DASH', 'Transcoding', 'Adaptive Bitrate', 'CDN', 'Cassandra']
  },
  {
    id: 'tiktok-short-video',
    title: 'Design TikTok (Short-Form Video Feed & Recommendation)',
    slug: 'tiktok-architecture',
    tagline: 'Ultra-low latency infinite vertical video swipe feed, real-time ML recommendation loops, and video prefetching.',
    category: 'Social & Content',
    difficulty: 'Advanced',
    readTime: '22 min read',
    scaleSummary: {
      dau: '800 Million Daily Active Users',
      qps: '1.2 Million Feed Requests/sec / 150,000 Video Creations/sec',
      storage: '250 TB / day',
      bandwidth: '800 GB/s Global Edge Bandwidth'
    },
    overview: 'TikTok delivers a personalized, infinite vertical scroll feed of 15-60 second videos with sub-100ms video start times on swipe. The architecture couples deep real-time machine learning feature stores (watch time, rewatches, skips, shares) with aggressive client-side chunk prefetching.',
    keyChallenges: [
      'Zero-Latency Video Swiping: Ensuring the next video plays instantly (< 50ms) when the user swipes up',
      'Real-Time Feedback Loop: User watch duration (e.g. watched 3s vs watched 100% vs instant skip) must update ML recommendation models within 2 seconds',
      'High-Concurrency Video Ingestion & Audio Sync Pipeline',
      'Edge CDN Prefetching: Predicting and pre-loading the first 2 seconds of the top 3 candidate videos'
    ],
    functionalRequirements: [
      'Infinite vertical swipe "For You Page" (FYP) with instant video playback',
      'Record, edit, apply music/effects, and publish 15-60s videos',
      'Collect micro-telemetry (exact watch milliseconds, loop count, pause, share)',
      'Real-time personalized recommendation ranking'
    ],
    nonFunctionalRequirements: [
      'Video Time-to-Play on swipe < 100ms (P99)',
      'Recommendation freshness: newly liked video influences next 5 feed items',
      'High availability 99.99%',
      'Bandwidth optimization on mobile cellular networks'
    ],
    outOfScope: ['Live Shopping Auctions', 'E2E Direct Messaging'],
    capacityEstimations: {
      assumptions: [
        '800M DAU; each user watches 80 videos/day = 64 Billion video views/day (~740,000 QPS avg, 1.2M peak QPS)',
        'Average short video size: 5 MB (compressed 720p 9:16 vertical video)',
        'Prefetching: Client downloads first 500 KB (initial 2 seconds) of next 3 videos in advance'
      ],
      metrics: [
        { label: 'Feed Recommendation QPS', value: '1,200,000 QPS', formula: 'Peak feed pagination requests', description: 'ML candidate retrieval + ranking' },
        { label: 'Telemetry Event Ingestion', value: '3,500,000 events/s', formula: 'Watch duration beacons + swipe events', description: 'Kafka clickstream ingestion' },
        { label: 'Daily Video Storage', value: '250 TB / day', formula: '50M new videos * 5 MB', description: 'Distributed object storage growth' }
      ],
      conclusion: 'The mobile client must intelligently prefetch only the first 2 seconds of candidate videos to save 60% cellular bandwidth.'
    },
    architecture: {
      summary: 'Clients communicate with API Gateway -> Recommendation Engine (Retrieval -> Filtering -> Heavy Deep Learning Scoring) -> Returns Ranked Video List -> Mobile App prefetches first 500KB of top 3 videos via Edge CDN -> Telemetry streaming into Kafka + Flink for real-time feature store updates.',
      nodes: [
        { id: 'client', label: 'Mobile Client (TikTok App)', type: 'client', x: 8, y: 50, description: 'Handles swipe gestures & prefetch cache' },
        { id: 'cdn', label: 'Edge Video CDN', type: 'cdn', x: 26, y: 75, description: 'Serves prefetched video chunks', techStack: ['Cloudflare / Edge POPs'] },
        { id: 'gateway', label: 'API Gateway', type: 'gateway', x: 26, y: 30, description: 'Routes FYP feed & telemetry requests', techStack: ['Envoy'] },
        { id: 'rec_service', label: 'Recommendation Orchestrator', type: 'service', x: 48, y: 30, description: 'Multi-stage candidate generation & ranking', techStack: ['Go / C++ Microservices'] },
        { id: 'retrieval', label: 'Candidate Retrieval (ANN)', type: 'search', x: 68, y: 15, description: 'Filters 100M videos down to 2,000 candidates', techStack: ['Vector DB / Milvus / HNSW'] },
        { id: 'ranking_model', label: 'Deep Ranking Engine', type: 'worker', x: 88, y: 15, description: 'Two-Tower & Transformer model scores top 100 videos', techStack: ['PyTorch / Triton GPU'] },
        { id: 'feature_store', label: 'Real-Time Feature Store', type: 'cache', x: 68, y: 45, description: 'User instant preferences (last 10 watched tags)', techStack: ['Redis / Feast'] },
        { id: 'kafka_telemetry', label: 'Telemetry Stream (Kafka)', type: 'queue', x: 48, y: 75, description: 'Ingests swipe, pause, and watch-time events', techStack: ['Apache Kafka'] },
        { id: 'flink', label: 'Flink Stream Processing', type: 'worker', x: 68, y: 75, description: 'Calculates real-time user engagement features', techStack: ['Apache Flink'] }
      ],
      edges: [
        { id: 'e1', from: 'client', to: 'gateway', label: '1. GET /feed/fyp', protocol: 'HTTPS' },
        { id: 'e2', from: 'gateway', to: 'rec_service', label: '2. Request Feed', protocol: 'Internal RPC' },
        { id: 'e3', from: 'rec_service', to: 'feature_store', label: '3. Get User Features', protocol: 'TCP' },
        { id: 'e4', from: 'rec_service', to: 'retrieval', label: '4. Retrieve Candidates', protocol: 'Internal RPC' },
        { id: 'e5', from: 'rec_service', to: 'ranking_model', label: '5. Deep Score Candidates', protocol: 'gRPC' },
        { id: 'e6', from: 'client', to: 'cdn', label: '6. Prefetch 2s Chunks', protocol: 'HTTPS' },
        { id: 'e7', from: 'client', to: 'kafka_telemetry', label: '7. Stream Watch Telemetry', protocol: 'Async Queue', isAsync: true },
        { id: 'e8', from: 'kafka_telemetry', to: 'flink', label: '8. Real-time Aggregation', protocol: 'Internal RPC', isAsync: true },
        { id: 'e9', from: 'flink', to: 'feature_store', label: '9. Update User Vector (1s)', protocol: 'TCP', isAsync: true }
      ],
      flowSteps: [
        { step: 1, title: 'Multi-Stage Recommendation Pipeline', description: 'When app requests feed, Retrieval stage pulls 2,000 candidate video IDs matching user interests using Vector ANN Search.', activeNodes: ['gateway', 'rec_service', 'feature_store', 'retrieval'], highlightDetails: 'Filters out already-watched videos using user Bloom Filters.', latencyEstimate: '25ms' },
        { step: 2, title: 'Deep Neural Ranking & Diversity Filtering', description: 'Triton GPU cluster evaluates candidates against user engagement embeddings, applies diversity rules (no 2 videos with same song in a row), and returns top 10 videos.', activeNodes: ['rec_service', 'ranking_model'], highlightDetails: 'Predicts Probability(Watch > 80%), Probability(Like), Probability(Share).', latencyEstimate: '35ms' },
        { step: 3, title: 'Smart Client Prefetching', description: 'Client player receives the 10 video URLs and immediately initiates parallel HTTP range requests for the first 500KB of videos #1, #2, and #3 from Edge CDN.', activeNodes: ['client', 'cdn'], highlightDetails: 'When user swipes up, video #2 plays from memory buffer in < 20ms.', latencyEstimate: '40ms' },
        { step: 4, title: 'Real-Time Telemetry Feedback Loop', description: 'As user watches video #1 for 14 seconds and likes it, telemetry beacon streams to Kafka -> Flink updates user preference vector in Redis in < 1 second.', activeNodes: ['client', 'kafka_telemetry', 'flink', 'feature_store'], highlightDetails: 'Next feed pagination reflects the updated taste profile immediately.', latencyEstimate: '500ms' }
      ]
    },
    apiDesign: [
      {
        method: 'GET',
        path: '/api/v2/feed/fyp',
        description: 'Fetch next batch of personalized short videos',
        responseBody: '{\n  "items": [\n    {\n      "video_id": "tk_192837",\n      "video_url": "https://cdn.tiktok.com/v/192837.mp4",\n      "author": "@techlead",\n      "music_id": "mus_402",\n      "duration": 22.4\n    }\n  ],\n  "cursor": "cur_987"\n}'
      },
      {
        method: 'POST',
        path: '/api/v2/telemetry/beacon',
        description: 'Stream micro-interaction metrics for video',
        requestBody: '{\n  "video_id": "tk_192837",\n  "watch_time_ms": 22400,\n  "completed_loops": 2,\n  "interacted": true\n}'
      }
    ],
    databaseDesign: [
      {
        tableName: 'user_watch_history_bloom',
        type: 'NoSQL Key-Value',
        shardingKey: 'user_id',
        fields: [
          { name: 'user_id', type: 'UUID', isPrimary: true },
          { name: 'bloom_filter_bits', type: 'BLOB', notes: 'Stores 10,000 watched video IDs in 12KB bitset' }
        ],
        notes: 'Enables sub-millisecond check to avoid showing duplicate videos.'
      }
    ],
    deepDives: [
      {
        title: 'Zero-Latency Swipe Engine: Client-Side Chunk Prefetching',
        subtitle: 'The secret to TikTok instant video playback',
        content: `If a mobile player waits for the user to swipe up before initiating a network request to load a video, network latency (150-400ms) creates an annoying black screen or loading spinner.\n\nTikTok Prefetch Engine Strategy:\n1. Top 1 Video (Currently Playing): Buffer entire video (or next 10 seconds).\n2. Top 2 Video (Directly Below): Prefetch initial 500 KB (Header + First 2 seconds of video frames).\n3. Top 3 Video: Prefetch first 200 KB.\n4. On Swipe Up: Top 2 video starts playing instantly from RAM buffer while background thread streams the remaining video chunks via HTTP Range: bytes=500000-.\n5. Cache Eviction: If user swipes fast without watching, discard prefetched bytes to prevent mobile device memory pressure.`,
        keyTakeaways: [
          'HTTP Range headers allow downloading partial video headers without fetching entire files.',
          'Saves 70% CDN bandwidth compared to downloading entire videos in advance.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Cold Start Problem for New Videos',
        impact: 'Newly uploaded videos have 0 historical views and never get recommended by ML models.',
        mitigation: 'Inject 5% "Explore / Exploration" traffic: every user feed receives 1 unrated new video per 20 items, collecting initial telemetry to bootstrap recommendation score.'
      }
    ],
    interviewQA: [
      {
        question: 'How do you prevent showing the user the same video twice within 7 days?',
        hint: 'Querying billions of historical view rows is too slow.',
        goodAnswer: 'Maintain a 10KB Scalable Bloom Filter or Redis Cuckoo Filter per user in memory. During candidate generation, test candidate video IDs against the user filter in O(1) time and prune matches.',
        pitfalls: 'Using SQL SELECT ... WHERE video_id NOT IN (SELECT ...).'
      }
    ],
    similarSystems: ['Instagram Reels', 'YouTube Shorts', 'Snapchat Spotlight'],
    tags: ['Vector Search', 'Recommendation System', 'Prefetching', 'Kafka', 'Flink']
  },
  {
    id: 'reddit-forum',
    title: 'Design Reddit / Community Forum & Hot Ranking',
    slug: 'reddit-architecture',
    tagline: 'High-concurrency voting engine, nested comment trees, and dynamic Hot ranking algorithm.',
    category: 'Social & Content',
    difficulty: 'Intermediate',
    readTime: '18 min read',
    scaleSummary: {
      dau: '70 Million Daily Active Users',
      qps: '80,000 Read QPS / 12,000 Vote & Comment QPS',
      storage: '10 TB / year text posts & comment trees',
      bandwidth: '15 GB/s Egress'
    },
    overview: 'Reddit is a community platform with thousands of subreddits where users submit links/text, vote (upvote/downvote), and participate in deeply nested hierarchical comment threads. The system requires an efficient voting aggregator and low-latency comment tree retrieval.',
    keyChallenges: [
      'High-concurrency atomic voting without database row lock contention',
      'Rendering deeply nested comment trees (10+ levels deep with millions of comments) in < 150ms',
      'The "Hot" Ranking Algorithm: Decaying post scores logarithmically over time',
      'Subreddit feed caching with real-time score updates'
    ],
    functionalRequirements: [
      'Create subreddits, submit posts (text, links, images)',
      'Upvote and downvote posts and comments',
      'Post nested comments (reply to comments recursively)',
      'Subreddit feed sorting: Hot, New, Top (day/week/all), Rising'
    ],
    nonFunctionalRequirements: [
      'Subreddit page load < 100ms',
      'Vote reflection latency < 1 second',
      'High Availability (99.99%)',
      'Comment tree retrieval in single query (prevent N+1 query problem)'
    ],
    outOfScope: ['Live Audio Rooms (Reddit Talk)', 'Direct Chat Encryption'],
    capacityEstimations: {
      assumptions: [
        '70M DAU; 50M votes cast per day (~600 votes/sec avg, 12,000 peak QPS)',
        '5M new comments posted per day (~60 comments/sec avg, 1,500 peak QPS)',
        'Read traffic: 300M page views/day (~3,500 QPS avg, 80,000 peak QPS)'
      ],
      metrics: [
        { label: 'Read QPS', value: '80,000 QPS', formula: 'Peak subreddit and comment thread views', description: 'Read traffic to CDN and App tier' },
        { label: 'Vote Ingestion QPS', value: '12,000 QPS', formula: 'Peak atomic upvote/downvote operations', description: 'Buffered write pipeline' }
      ],
      conclusion: 'Write-behind vote batching in Redis is necessary to avoid hammering SQL databases with single-row increment locks.'
    },
    architecture: {
      summary: 'Clients communicate via CDN -> API Gateway -> Post & Comment Service -> PostgreSQL (stores relational posts and path-enumerated comment trees) -> Redis Cluster (caches Subreddit Hot lists as Sorted Sets & batches vote deltas) -> Async Kafka Worker flushes aggregated votes to DB.',
      nodes: [
        { id: 'client', label: 'Web & Mobile Clients', type: 'client', x: 8, y: 50, description: 'Browses feeds and casts votes' },
        { id: 'cdn', label: 'Edge CDN', type: 'cdn', x: 26, y: 70, description: 'Caches public subreddit feeds for 10-30 seconds', techStack: ['Fastly'] },
        { id: 'gateway', label: 'API Gateway', type: 'gateway', x: 26, y: 30, description: 'Authentication and request routing', techStack: ['Envoy'] },
        { id: 'post_srv', label: 'Post & Subreddit Service', type: 'service', x: 50, y: 30, description: 'Manages posts and calculates hot scores', techStack: ['Python / Go'] },
        { id: 'comment_srv', label: 'Comment Tree Service', type: 'service', x: 50, y: 65, description: 'Fetches nested comment hierarchies', techStack: ['Go / Rust'] },
        { id: 'redis_hot', label: 'Subreddit Redis ZSETs', type: 'cache', x: 75, y: 20, description: 'Stores subreddit_id -> post_ids scored by Hot rating', techStack: ['Redis Sorted Sets'] },
        { id: 'redis_votes', label: 'Vote Buffer (Redis)', type: 'cache', x: 75, y: 45, description: 'Batches atomic vote deltas in memory', techStack: ['Redis Hashes'] },
        { id: 'db', label: 'Relational Database', type: 'database', x: 75, y: 80, description: 'Primary store for posts, comments, and users', techStack: ['PostgreSQL with LTree extension'] }
      ],
      edges: [
        { id: 'e1', from: 'client', to: 'cdn', label: 'GET /r/technology/hot', protocol: 'HTTPS' },
        { id: 'e2', from: 'cdn', to: 'gateway', label: 'Miss Forward', protocol: 'HTTPS' },
        { id: 'e3', from: 'gateway', to: 'post_srv', label: 'Route Post Query', protocol: 'Internal RPC' },
        { id: 'e4', from: 'gateway', to: 'comment_srv', label: 'Route Comment Query', protocol: 'Internal RPC' },
        { id: 'e5', from: 'post_srv', to: 'redis_hot', label: 'ZREVRANGEBYSCORE', protocol: 'TCP' },
        { id: 'e6', from: 'client', to: 'gateway', label: 'POST /vote', protocol: 'HTTPS' },
        { id: 'e7', from: 'post_srv', to: 'redis_votes', label: 'HINCRBY post_votes', protocol: 'TCP' },
        { id: 'e8', from: 'comment_srv', to: 'db', label: 'Query LTree Path Index', protocol: 'SQL' }
      ],
      flowSteps: [
        { step: 1, title: 'Subreddit Hot Feed Fetch', description: 'User opens /r/programming. Post Service queries Redis Sorted Set using ZREVRANGE to get top 25 post IDs by Hot score.', activeNodes: ['client', 'gateway', 'post_srv', 'redis_hot'], highlightDetails: 'Retrieves top 25 ranked IDs in < 1ms.', latencyEstimate: '2ms' },
        { step: 2, title: 'Nested Comment Tree Retrieval', description: 'When opening a post, Comment Service queries PostgreSQL using PostgreSQL LTree path enumeration (path <@ "root.c1.c4") to fetch entire subtree in a single indexed query.', activeNodes: ['client', 'comment_srv', 'db'], highlightDetails: 'Eliminates recursive N+1 database queries completely.', latencyEstimate: '18ms' },
        { step: 3, title: 'Atomic Vote Ingestion & Decay', description: 'User upvotes a post. Server updates user vote record in DB and increments Redis vote buffer. Background cron recalculates Hot score: Score = log10(max(1, |U - D|)) + (created_at - Epoch) / 45000.', activeNodes: ['client', 'post_srv', 'redis_votes', 'redis_hot'], highlightDetails: 'Logarithmic score decay ensures older viral posts make way for fresh content.', latencyEstimate: '500ms' }
      ]
    },
    apiDesign: [
      {
        method: 'POST',
        path: '/api/v1/posts/{post_id}/vote',
        description: 'Cast an upvote (1), downvote (-1), or unvote (0)',
        requestBody: '{\n  "direction": 1\n}',
        responseBody: '{\n  "success": true,\n  "new_score": 14502\n}'
      }
    ],
    databaseDesign: [
      {
        tableName: 'comments',
        type: 'SQL',
        shardingKey: 'post_id',
        fields: [
          { name: 'id', type: 'BIGINT', isPrimary: true },
          { name: 'post_id', type: 'BIGINT', isIndex: true },
          { name: 'parent_id', type: 'BIGINT', isIndex: true },
          { name: 'path', type: 'LTREE', isIndex: true, notes: 'Hierarchical path e.g. "root.102.109"' },
          { name: 'body', type: 'TEXT' },
          { name: 'score', type: 'INT' },
          { name: 'created_at', type: 'TIMESTAMP' }
        ],
        notes: 'PostgreSQL LTree extension allows single-query tree hierarchy retrieval with GIST indexes.'
      }
    ],
    deepDives: [
      {
        title: 'Modeling Hierarchical Comment Trees: Adjacency List vs Materialized Path vs Nested Sets',
        subtitle: 'Why Materialized Path (LTree) wins for social threaded discussions',
        content: `Three Ways to Store Nested Comments:\n1. Adjacency List (parent_id on each row): Simple inserts, but reading a 10-level tree requires recursive CTE queries or 10 separate queries (slow).\n2. Nested Sets (lft and rgt numbers): Fast reads, but inserting a new comment requires renumbering thousands of sibling rows (catastrophic write locks under active discussions).\n3. Materialized Path (PostgreSQL LTree):\n   - Each comment stores its complete path ancestry: "1.42.89".\n   - Fetching all children of comment 42 is a simple indexed query: WHERE path <@ '1.42'.\n   - Inserting a reply to 89 is O(1): insert with path = "1.42.89.102".\n   - Sorting: Order by path asc renders the visual tree in perfect depth-first preorder traversal!`,
        keyTakeaways: [
          'Materialized path provides O(1) inserts and single-query O(log N) subtree reads.',
          'PostgreSQL GiST index on LTree paths scales to millions of comments per post.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Vote Count Lock Contention on Viral Megathreads',
        impact: '10,000 users upvote the same breaking news post within seconds, locking the SQL row.',
        mitigation: 'Buffer vote deltas in Redis Hashes (HINCRBY) and flush batched increments to PostgreSQL every 5 seconds.'
      }
    ],
    interviewQA: [
      {
        question: 'How does Reddit prevent vote fuzzing and bot manipulation?',
        hint: 'Displaying exact vote numbers encourages bots.',
        goodAnswer: 'Reddit adds random noise / vote fuzzing (randomly displaying +/- 2-5 votes on each refresh) so bot operators cannot verify if their shadowbanned accounts are successfully altering vote tallies.',
        pitfalls: 'Assuming displayed votes are 100% strict real-time numbers.'
      }
    ],
    similarSystems: ['Hacker News', 'Stack Overflow', 'Discourse'],
    tags: ['Nested Comments', 'LTree', 'Hot Ranking', 'Redis ZSET', 'PostgreSQL']
  },
  {
    id: 'pastebin-snippet',
    title: 'Design Pastebin / Gist (Secure Code Snippet Storage)',
    slug: 'pastebin-architecture',
    tagline: 'High-throughput plain-text snippet storage with custom syntax highlighting, expiration TTLs, and deduplication.',
    category: 'Social & Content',
    difficulty: 'Beginner',
    readTime: '14 min read',
    scaleSummary: {
      dau: '10 Million Active Users',
      qps: '15,000 Read QPS / 1,500 Write QPS',
      storage: '2 TB / year text storage',
      bandwidth: '30 MB/s Egress / 3 MB/s Ingress'
    },
    overview: 'Pastebin enables developers to paste plain text or source code snippets, receive a unique shortened URL, and share it with syntax highlighting, optional password protection, and custom expiration dates.',
    keyChallenges: [
      'Handling large code snippets (up to 10MB) efficiently without exhausting relational database row limits',
      'Automated key expiration and scheduled garbage collection of millions of dead pastes',
      'Preventing abuse and malware hosting using automated scanning',
      'High-speed read caching for viral snippets'
    ],
    functionalRequirements: [
      'Create and save a new code paste (up to 10MB)',
      'Generate a unique 8-character URL for each paste',
      'Support expiration durations (10 min, 1 hour, 1 day, 1 month, Never)',
      'Optional password protection and syntax highlighting detection',
      'Delete or edit pastes for registered users'
    ],
    nonFunctionalRequirements: [
      'Read latency < 25ms',
      'High reliability: pastes must not be lost before expiration',
      'Unpredictable paste keys (prevent URL scraping attacks)'
    ],
    outOfScope: ['Real-time collaborative code execution (IDE playground)', 'Git version control branching'],
    capacityEstimations: {
      assumptions: [
        '10M daily users; 1M new pastes created per day (~12 writes/sec avg, 1,500 peak QPS)',
        '10M paste reads per day (~115 reads/sec avg, 15,000 peak QPS)',
        'Average paste size: 10 KB; Maximum paste size: 10 MB'
      ],
      metrics: [
        { label: 'Storage Growth', value: '10 GB / day', formula: '1M pastes/day * 10 KB average size', description: 'Object storage capacity growth' },
        { label: '5-Year Storage Total', value: '18.25 TB', formula: '10 GB/day * 365 * 5 years', description: 'Total durable S3 storage' }
      ],
      conclusion: 'Store paste metadata in PostgreSQL or DynamoDB, and store the actual snippet body in S3/MinIO object storage.'
    },
    architecture: {
      summary: 'Clients query API Gateway -> Paste Service -> S3 / MinIO (stores text content) -> PostgreSQL (indexes metadata: key, size, author, expiration) -> Redis (caches top 20% viral snippets) -> Background Cleaner removes expired S3 objects.',
      nodes: [
        { id: 'client', label: 'Client (Web / CLI / cURL)', type: 'client', x: 8, y: 50, description: 'Submits or reads code snippets' },
        { id: 'gateway', label: 'API Gateway', type: 'gateway', x: 28, y: 50, description: 'Rate limits abusive IPs and checks auth', techStack: ['Envoy'] },
        { id: 'paste_srv', label: 'Paste Service', type: 'service', x: 50, y: 50, description: 'Handles Base62 generation & encryption', techStack: ['Go / Node.js'] },
        { id: 'redis', label: 'Snippet Cache (Redis)', type: 'cache', x: 75, y: 25, description: 'Caches recent and viral pastes', techStack: ['Redis'] },
        { id: 's3', label: 'Object Storage (S3 / Blob)', type: 'storage', x: 75, y: 50, description: 'Durable storage for raw code text files', techStack: ['AWS S3 / MinIO'] },
        { id: 'db', label: 'Metadata Database', type: 'database', x: 75, y: 75, description: 'Indexes paste_id, user_id, expiry, syntax', techStack: ['PostgreSQL / DynamoDB'] }
      ],
      edges: [
        { id: 'e1', from: 'client', to: 'gateway', label: 'POST /api/v1/pastes', protocol: 'HTTPS' },
        { id: 'e2', from: 'gateway', to: 'paste_srv', label: 'Forward Request', protocol: 'Internal RPC' },
        { id: 'e3', from: 'paste_srv', to: 's3', label: 'Write Raw Text File', protocol: 'HTTPS' },
        { id: 'e4', from: 'paste_srv', to: 'db', label: 'Insert Metadata Row', protocol: 'SQL' },
        { id: 'e5', from: 'paste_srv', to: 'redis', label: 'Warm Cache', protocol: 'TCP' },
        { id: 'e6', from: 'client', to: 'gateway', label: 'GET /{paste_id}', protocol: 'HTTPS' },
        { id: 'e7', from: 'paste_srv', to: 'redis', label: 'Cache Lookup', protocol: 'TCP' }
      ],
      flowSteps: [
        { step: 1, title: 'Create New Paste', description: 'Client sends code snippet. Paste Service generates Base62 key, writes body to S3 bucket, and inserts metadata row into DB.', activeNodes: ['client', 'gateway', 'paste_srv', 's3', 'db'], highlightDetails: 'Separating metadata from text body keeps DB indexes compact and fast.', latencyEstimate: '20ms' },
        { step: 2, title: 'Retrieve Paste with Caching', description: 'User visits https://pastebin.com/k9a8x2. Server checks Redis cache. On hit, returns text immediately. On miss, fetches from S3 and populates Redis.', activeNodes: ['client', 'gateway', 'paste_srv', 'redis', 's3'], highlightDetails: 'Sub-10ms response time on cache hit.', latencyEstimate: '8ms' }
      ]
    },
    apiDesign: [
      {
        method: 'POST',
        path: '/api/v1/pastes',
        description: 'Create a new snippet',
        requestBody: '{\n  "content": "package main\\nfunc main() {}",\n  "syntax": "golang",\n  "expiry": "1D",\n  "password": null\n}',
        responseBody: '{\n  "paste_id": "g8x9a2k1",\n  "url": "https://pastebin.com/g8x9a2k1",\n  "expire_at": 1724086400\n}'
      }
    ],
    databaseDesign: [
      {
        tableName: 'pastes',
        type: 'SQL',
        shardingKey: 'paste_id',
        fields: [
          { name: 'paste_id', type: 'VARCHAR(8)', isPrimary: true },
          { name: 'user_id', type: 'UUID', isIndex: true },
          { name: 's3_path', type: 'VARCHAR(255)' },
          { name: 'syntax', type: 'VARCHAR(32)' },
          { name: 'size_bytes', type: 'INT' },
          { name: 'expire_at', type: 'TIMESTAMP', isIndex: true },
          { name: 'created_at', type: 'TIMESTAMP' }
        ],
        notes: 'PostgreSQL database with B-Tree index on (expire_at) for efficient batch cleanup.'
      }
    ],
    deepDives: [
      {
        title: 'Why Storing Text Blobs in SQL Degrades Database Performance',
        subtitle: 'The Architectural rule of Metadata vs Body Separation',
        content: `Relational databases store table rows in fixed-size 8KB disk pages (PostgreSQL pages). When a row exceeds page size (e.g. a 5MB code snippet), PostgreSQL must use TOAST (The Oversized-Attribute Storage Technique), breaking the data into multiple physical chunks across out-of-line tables.\n\nConsequences:\n- Database buffer pool (RAM) gets polluted with large cold text blobs instead of indexing metadata.\n- Database backups (pg_dump) take 10x longer.\n- Database IOPS spike on simple metadata lookups.\n\nSolution: Store only metadata in PostgreSQL (300 bytes per row) and store the snippet payload in AWS S3 or MinIO. S3 is designed specifically for cheap, high-throughput blob storage.`,
        keyTakeaways: [
          'Keep database rows small (< 1KB) so millions of index pages fit in server RAM.',
          'Use Object Storage (S3) for all payloads > 64KB.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Accumulation of Millions of Expired Pastes',
        impact: 'Dead pastes waste terabytes of storage.',
        mitigation: 'Use S3 Object Lifecycle Expiration rules to auto-delete objects after expiration timestamp, and run an hourly DB cron: DELETE FROM pastes WHERE expire_at < NOW() LIMIT 10000.'
      }
    ],
    interviewQA: [
      {
        question: 'How do you handle password-protected pastes safely?',
        hint: 'Never store plain passwords or decrypt server-side if zero-knowledge is required.',
        goodAnswer: 'Derive an AES-256 decryption key from the password client-side using PBKDF2/Argon2. The server only stores the encrypted ciphertext and cannot read the snippet without the user password.',
        pitfalls: 'Storing passwords in plain text in the database.'
      }
    ],
    similarSystems: ['GitHub Gist', 'Ghostbin', 'Hastebin'],
    tags: ['S3 Object Store', 'Base62', 'TTL Cleanup', 'PostgreSQL', 'Redis']
  }
];
