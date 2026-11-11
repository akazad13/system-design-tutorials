import { CaseStudy } from '../types/system-design';

export const SOCIAL_CASE_STUDIES: CaseStudy[] = [
  {
    id: 'tinyurl',
    title: 'Design a URL Shortener (TinyURL / Bitly)',
    slug: 'url-shortener',
    tagline: 'Turn long links into short ones, and redirect billions of clicks a month quickly and without downtime.',
    category: 'Social & Content',
    difficulty: 'Beginner',
    readTime: '15 min read',
    scaleSummary: {
      dau: '100 Million Active Users',
      qps: '11,600 Read QPS (Peak) / 116 Write QPS (Peak)',
      storage: '9 TB over 5 years (3 TB raw × 3 replicas)',
      bandwidth: '58 KB/s in / 5.8 MB/s out (peak)'
    },
    overview: 'A URL shortener maps a short key to a long URL. For example, https://tiny.cc/a9x3z1 can point to https://en.wikipedia.org/wiki/Distributed_computing. The service does two jobs: create short links (rare) and redirect clicks (very frequent, about 100 reads for every write). The design goals are redirects in under 15 ms, 99.999% availability, and short keys that never collide.',
    keyChallenges: [
      'Create unique 6 to 8 character keys while many servers write at the same time, without two links ever getting the same key.',
      'Keep redirects fast (P99 under 10 ms) with several cache layers, including the CDN edge.',
      'Serve about 100 reads for every write. A small share of links gets most of the clicks, so caching the hottest 20% handles most traffic.',
      'Expire old links and record click analytics without slowing down the redirect itself.'
    ],
    functionalRequirements: [
      'Create a short link for a long URL (for example https://tiny.cc/xyz123).',
      'Redirect a visitor from the short link to the long URL with HTTP 301 or 302.',
      'Let users choose a custom alias (for example tiny.cc/my-awesome-link).',
      'Let users set an optional expiry time on a link.',
      'Count clicks and record basic analytics: referrer and country.'
    ],
    nonFunctionalRequirements: [
      'Availability: 99.999% uptime, about 5 minutes of downtime per year. A failed redirect breaks the link everywhere it was shared.',
      'Latency: find and return a redirect in under 15 ms.',
      'Security: short keys must not be guessable, so nobody can list all links by counting up.',
      'Read-heavy: about 100 redirects for every new link.'
    ],
    outOfScope: [
      'Real-time scanning of links for fraud or malware.',
      'Enterprise features such as team permissions and billing dashboards.'
    ],
    capacityEstimations: {
      assumptions: [
        'New links: 100 million per month. 100M / (30 × 86,400 s) ≈ 38.6 writes/s on average. Peak traffic is about 3× the average, so about 116 writes/s.',
        'Redirects: 10 billion per month (100× the writes). That is about 3,860 reads/s on average and about 11,600 reads/s at peak.',
        'Links are kept for 5 years.',
        'One stored link is about 500 bytes: short key (8 B), long URL (up to about 450 B), timestamps and user ID.',
        'The database keeps 3 copies of every record (replication factor 3). Sizes are before compression.'
      ],
      metrics: [
        { label: 'Write QPS', value: '116 / sec', formula: '100M / (30 × 86,400) × 3 (peak factor)', description: 'Peak rate of new links (average about 38.6/s)' },
        { label: 'Read QPS', value: '11,600 / sec', formula: '10B / (30 × 86,400) × 3 (peak factor)', description: 'Peak rate of redirects' },
        { label: '5-Year Storage', value: '9 TB', formula: '100M links/month × 12 × 5 years × 500 B × 3 replicas', description: '6 billion links make 3 TB of raw data. Three copies for durability make 9 TB.' },
        { label: 'Cache RAM (20% of Daily Reads)', value: '33 GB', formula: '333M reads/day × 0.20 × 500 B', description: 'Redis memory for the hottest 20% of links. This is an upper bound: many reads are for the same link, so the real set of hot links is smaller.' },
        { label: 'Peak Egress Bandwidth', value: '5.8 MB/s', formula: '11,600 redirects/s × ~500 B per response', description: 'Outgoing redirect responses. Incoming create requests are only about 116 × 500 B ≈ 58 KB/s.' }
      ],
      conclusion: 'These numbers are small for modern hardware. A Redis cluster with about 33 GB of memory serves most redirects. A key-value database sharded by short_key, such as DynamoDB or Cassandra (or PostgreSQL with a B-tree index on the key), stores the 9 TB. The hard parts are not size but key generation, latency and availability.'
    },
    architecture: {
      summary: 'A click first reaches the nearest CDN edge through Anycast DNS, and the CDN can answer cached 301 redirects by itself. Other requests go through a Layer 7 load balancer to stateless API servers. To redirect, a server reads the key from Redis and falls back to the key-value database (DynamoDB or Cassandra) on a miss. To create a link, a server takes the next ID from a block of IDs that the Key Generation Service reserved for it in ZooKeeper or etcd. Click events go to Kafka and analytics workers process them later, so the redirect never waits for analytics.',
      nodes: [
        { id: 'client', label: 'Web / Mobile Clients', type: 'client', x: 8, y: 50, description: 'Create short links and follow them' },
        { id: 'dns_cdn', label: 'DNS & Edge CDN', type: 'cdn', x: 24, y: 50, description: 'Nearest edge server. It can answer cached 301 redirects without calling the origin.', techStack: ['Cloudflare', 'Anycast'] },
        { id: 'lb', label: 'Load Balancer (L7)', type: 'load_balancer', x: 40, y: 50, description: 'Spreads requests over the stateless API servers', techStack: ['Envoy', 'AWS ALB'] },
        { id: 'app_srv', label: 'URL Shortener API Service', type: 'service', x: 58, y: 50, description: 'Creates keys, checks input and answers redirects', techStack: ['Go', 'Node.js'] },
        { id: 'redis', label: 'Redis Cache Cluster', type: 'cache', x: 76, y: 25, description: 'Keeps hot short_key to long_url mappings in memory and evicts the least recently used (LRU) entries', techStack: ['Redis 7 Cluster'], scaleMetric: '33 GB RAM, ~95% Hit Ratio' },
        { id: 'db', label: 'Key-Value Database', type: 'database', x: 76, y: 75, description: 'Durable store for every link, sharded by short_key', techStack: ['DynamoDB', 'PostgreSQL'], scaleMetric: '9 TB (3 TB × 3 replicas)' },
        { id: 'kgs', label: 'Key Generation Service (KGS)', type: 'worker', x: 58, y: 15, description: 'Gives each API server its own block of unused IDs and records it in etcd, so no block is handed out twice', techStack: ['etcd', 'Raft'] },
        { id: 'kafka', label: 'Kafka Analytics Stream', type: 'queue', x: 58, y: 85, description: 'Buffers click events (IP, time, user agent) so the redirect does not wait for them', techStack: ['Apache Kafka'] },
        { id: 'click_worker', label: 'Analytics Aggregator', type: 'worker', x: 76, y: 92, description: 'Reads click events and writes totals to ClickHouse for analytics queries', techStack: ['ClickHouse'] }
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
        { step: 1, title: 'Request reaches the edge', description: 'A user clicks https://tiny.cc/a9x3z1. The request goes to the nearest CDN edge server.', activeNodes: ['client', 'dns_cdn'], highlightDetails: 'If the edge has a cached 301 for this key, it answers at once with the Location header. The origin does no work.', latencyEstimate: '5-10ms' },
        { step: 2, title: 'Load balancer picks a server', description: 'On a CDN miss, the request goes to the Layer 7 load balancer, which sends it to a healthy API server.', activeNodes: ['dns_cdn', 'lb', 'app_srv'], highlightDetails: 'The API servers keep no state, so you can add or remove them freely as CPU use and connections change.', latencyEstimate: '2ms' },
        { step: 3, title: 'Look up the key in Redis', description: 'The API server reads the key a9x3z1 from Redis.', activeNodes: ['app_srv', 'redis'], highlightDetails: 'About 95% of lookups hit the cache, because a small set of popular links gets most of the clicks.', latencyEstimate: '1-2ms' },
        { step: 4, title: 'Read the database on a miss', description: 'On a cache miss, the server reads the link from the database by its primary key, short_key.', activeNodes: ['app_srv', 'db'], highlightDetails: 'The server then writes the result into Redis with a TTL plus a small random offset (jitter), so many keys do not expire at the same moment.', latencyEstimate: '5-10ms' },
        { step: 5, title: 'Log the click and redirect', description: 'The server sends the click details (time, country, referrer) to Kafka and at once returns the 302 or 301 redirect.', activeNodes: ['app_srv', 'kafka', 'client'], highlightDetails: 'Logging does not block the redirect, so analytics never slows down users.', latencyEstimate: '1ms' }
      ]
    },
    apiDesign: [
      {
        method: 'POST',
        path: '/api/v1/urls',
        description: 'Create a short link',
        requestBody: '{\n  "long_url": "https://example.com/very/long/path",\n  "custom_alias": "my-promo-link",\n  "expire_at": 1780000000\n}',
        responseBody: '{\n  "short_url": "https://tiny.cc/my-promo-link",\n  "short_key": "my-promo-link",\n  "created_at": 1724000000\n}'
      },
      {
        method: 'GET',
        path: '/{short_key}',
        description: 'Redirect to the long URL',
        responseBody: 'HTTP 302 Found\nLocation: https://example.com/very/long/path'
      },
      {
        method: 'GET',
        path: '/api/v1/urls/{short_key}/analytics',
        description: 'Get click statistics for a link',
        responseBody: '{\n  "total_clicks": 142850,\n  "top_countries": [{"country": "US", "count": 82000}],\n  "referrers": [{"source": "twitter.com", "count": 64000}]\n}'
      }
    ],
    databaseDesign: [
      {
        tableName: 'urls',
        type: 'NoSQL Key-Value',
        shardingKey: 'short_key',
        fields: [
          { name: 'short_key', type: 'VARCHAR(8)', isPrimary: true, notes: 'Base62 key, unique (hash key)' },
          { name: 'original_url', type: 'VARCHAR(2048)', notes: 'The long URL to redirect to' },
          { name: 'user_id', type: 'UUID', isIndex: true, notes: 'Account that created the link' },
          { name: 'created_at', type: 'BIGINT', notes: 'Creation time (Unix epoch)' },
          { name: 'expire_at', type: 'BIGINT', isIndex: true, notes: 'Expiry time, used by TTL cleanup' }
        ],
        notes: 'Sharded by a hash of short_key, so keys spread evenly over the shards. About 9 TB including replicas.'
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
        notes: 'Daily click totals per link. Stored in ClickHouse or Cassandra for fast aggregation.'
      }
    ],
    deepDives: [
      {
        title: 'Key generation: hashing, a global counter, or reserved ID blocks',
        subtitle: 'How to create unique short keys without collisions or a write bottleneck',
        content: `Base62 uses 62 characters (a-z, A-Z, 0-9). A 7-character Base62 key gives 62^7 ≈ 3.52 trillion possible keys. At 100 million new links per month, that lasts about 2,900 years.\n\nThere are three common ways to create the key:\n1. Hash and cut. Hash the long URL (for example with MD5) and keep the first 7 characters. Different URLs can produce the same 7 characters (a collision), so every write must first check the database and retry on a clash. That read-before-write is slow under load.\n2. One global counter. Use a database auto-increment ID and convert it to Base62. Keys are unique, but every write in the system goes through one counter, which becomes a bottleneck and a single point of failure.\n3. Reserved ID blocks (recommended). A Key Generation Service, backed by ZooKeeper or etcd, gives each API server its own block of IDs. For example, server 1 gets 1,000,000 to 1,999,999 and server 2 gets 2,000,000 to 2,999,999. Each server counts through its block in memory and converts each number to Base62. There are no locks, network calls or database checks per write.`,
        keyTakeaways: [
          'Reserved ID blocks remove locks and collision retries.',
          'If a server crashes, the rest of its block is never used. That waste is tiny compared with 3.5 trillion keys.',
          'Base62 keys are safe in URLs and need no escaping.',
          'Counter values come out in order. Scramble each ID before encoding it (see the practice questions) so keys cannot be guessed.'
        ],
        tradeoffs: {
          optionA: 'Hash the URL and retry on collision',
          optionB: 'Reserved ID blocks from a key service',
          prosA: ['The same long URL always gets the same short key, so duplicate links are easy to detect.'],
          prosB: ['No collision checks and no locks. Each key costs O(1) work, and capacity grows by adding servers.'],
          decision: 'Use reserved ID blocks when many servers create links at the same time.'
        }
      },
      {
        title: 'HTTP 301 vs HTTP 302 redirects',
        subtitle: 'Fewer requests to your servers, or accurate click counts',
        content: `The status code decides who remembers the redirect.\n- 301 (Moved Permanently): browsers and CDNs cache the redirect. Later clicks go straight to the long URL without reaching your servers. Latency and server load are lowest, but you cannot count those repeat clicks.\n- 302 (Found, a temporary redirect): browsers ask your service on every click, unless a cache header allows reuse. Every click can be counted, at the cost of more traffic.\n\nA common middle path is to return 302 with a short Cache-Control: max-age=300 header. A browser that opens the same link again within 5 minutes reuses the answer, which protects your servers from rapid repeat clicks. You still see each visitor at least once every 5 minutes.`,
        keyTakeaways: [
          'Use 301 when infrastructure cost matters most and per-click analytics do not.',
          'Use 302 when you need accurate attribution, fraud checks or real-time analytics.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'A link suddenly goes viral (for example a Super Bowl tweet)',
        impact: 'One key gets 100,000 reads per second. All of them land on the single Redis node that owns the key (a hot key), and that node overloads.',
        mitigation: 'Keep a small in-process LRU cache (for example Caffeine) on each API server for 10 to 30 seconds. Or copy the hot key to several Redis shards under suffixed names (key:1, key:2, and so on) and pick one at random on each read.'
      },
      {
        bottleneck: 'Expired links pile up',
        impact: 'The database keeps growing with dead links, which wastes storage and makes indexes slower.',
        mitigation: 'Use the database TTL feature: DynamoDB TTL deletes expired items in the background without using write capacity. Deletion can lag by days, so also check expire_at on every read. A daily batch job can clean up stores that have no TTL feature.'
      }
    ],
    interviewQA: [
      {
        question: 'How do you prevent malicious users from guessing consecutive short URLs?',
        hint: 'Keys made from a counter come out in order.',
        goodAnswer: 'Scramble the counter value before encoding it. Pass the ID through a reversible permutation, for example a small Feistel cipher with a secret key, or multiply it by a large secret number that shares no factor with 62^7 and take the result modulo 62^7. Every ID still maps to exactly one key, so keys stay unique, but neighboring IDs produce keys that look random.',
        pitfalls: 'Generating random strings in a loop and checking the database for duplicates each time. It is slow, and it gets slower as the key space fills up.'
      },
      {
        question: 'How do you support custom vanity URLs (e.g., tiny.cc/my-brand)?',
        hint: 'A custom alias can clash with a key the system already created or will create later.',
        goodAnswer: 'Store custom aliases in the same table, with short_key as the primary key, so a redirect still needs only one lookup. Check that the alias is free with a fast Redis set or a Bloom filter, then insert it with a conditional write (insert only if the key does not exist), so two users cannot claim it at the same time. To avoid clashes with generated keys, give aliases a different shape, for example require a hyphen, which Base62 keys never contain.',
        pitfalls: 'Putting aliases in a separate table, so every redirect has to check two tables.'
      }
    ],
    similarSystems: ['Bitly', 'Dub.co', 'Ow.ly', 'Rebrandly'],
    tags: ['Key-Value Store', 'Base62', 'Redis', 'CDN', 'ZooKeeper']
  },
  {
    id: 'twitter-newsfeed',
    title: 'Design Twitter / X Timeline & News Feed',
    slug: 'twitter-news-feed',
    tagline: 'Build a home timeline that loads fast for hundreds of millions of readers, even when one account has over 100 million followers.',
    category: 'Social & Content',
    difficulty: 'Intermediate',
    readTime: '22 min read',
    scaleSummary: {
      dau: '300 Million Daily Active Users',
      qps: '350,000 Read QPS (Timeline) / 35,000 Write QPS (Tweets)',
      storage: '100 GB / day (Tweets + Media Metadata)',
      bandwidth: '70 GB/s Egress / 3.5 GB/s Ingress'
    },
    overview: 'Users post tweets of up to 280 characters, follow other users, and read a Home Timeline: a list of recent tweets from the accounts they follow. The hard part is that one tweet must show up in the timelines of all of its author\'s followers. For an account with over 100 million followers, that is a huge amount of work. The goal is to render a timeline in under 100 ms (P99, the slowest 1% of requests).',
    keyChallenges: [
      'Write amplification: one tweet from a celebrity would mean 100 million timeline updates.',
      'Choosing how to build timelines: fanout-on-write (push), fanout-on-read (pull), or a hybrid of both.',
      'Creating unique, time-ordered 64-bit IDs on many servers and in many data centers (Snowflake IDs).',
      'Staying available during sudden traffic spikes such as a World Cup final or an election.'
    ],
    functionalRequirements: [
      'Post a tweet (text, images, video links).',
      'Follow and unfollow other users.',
      'View the Home Timeline: tweets from followed accounts, newest first or ranked.',
      'View a User Timeline: the tweets posted by one account.'
    ],
    nonFunctionalRequirements: [
      'Latency: Home Timeline in under 100 ms at P99. Posting a tweet in under 500 ms.',
      'Availability: 99.99%. When part of the system fails, show a slightly stale or smaller timeline instead of an error.',
      'Consistency: eventual consistency is fine. A new tweet may take 2 to 5 seconds to reach follower timelines.'
    ],
    outOfScope: ['Live video streaming.', 'End-to-end encrypted direct messages.', 'The ad auction.'],
    capacityEstimations: {
      assumptions: [
        '300M daily active users, each opening the Home Timeline 5 times a day: 1.5B reads/day. That is about 17,400 reads/s on average and 350,000 reads/s at peak.',
        '100M tweets per day: about 1,160 writes/s on average and 35,000 writes/s at peak.',
        'The average user has 200 followers. The biggest accounts have up to 150M.',
        'A tweet record is about 1 KB (text and metadata; media files are stored elsewhere). That is 100 GB/day for one copy, before replication.'
      ],
      metrics: [
        { label: 'Timeline Read QPS', value: '350,000 QPS', formula: '1.5B reads / 86,400 * 20x peak burst factor', description: 'Peak Home Timeline requests per second' },
        { label: 'Tweet Write QPS', value: '35,000 QPS', formula: '100M tweets / 86,400 * 30x peak event factor', description: 'Peak tweet creations per second' },
        { label: 'Home Timeline Cache Size', value: '1.92 TB RAM', formula: '300M daily active users * 800 tweet IDs * 8 bytes', description: 'Redis memory to hold the latest 800 tweet IDs for every daily active user' }
      ],
      conclusion: 'Reading a timeline must be a single fast lookup, so the system keeps ready-made timelines in Redis. A pure push design cannot handle celebrity accounts, so it uses a hybrid: push for ordinary accounts, pull for celebrities.'
    },
    architecture: {
      summary: 'Clients reach the Tweet Ingestion Service and the Timeline Service through a load balancer. The Tweet Service gets a 64-bit Snowflake ID and saves the tweet in Cassandra. It then queues a fanout job. Fanout workers push the tweet ID into follower timelines in Redis, except for celebrity authors. When a user opens the app, the Timeline Service reads the ready-made list from Redis and adds recent tweets from followed celebrities.',
      nodes: [
        { id: 'client', label: 'Mobile & Web Clients', type: 'client', x: 8, y: 50, description: 'Post tweets and scroll the timeline' },
        { id: 'lb', label: 'Layer 7 Load Balancer', type: 'load_balancer', x: 26, y: 50, description: 'Spreads requests over servers and ends TLS (HTTPS encryption)', techStack: ['Envoy', 'Nginx'] },
        { id: 'tweet_service', label: 'Tweet Ingestion Service', type: 'service', x: 45, y: 30, description: 'Validates new tweets and saves them', techStack: ['Java / Scala'] },
        { id: 'timeline_service', label: 'Timeline Query Service', type: 'service', x: 45, y: 70, description: 'Reads a timeline and fills in the full tweet data (hydration)', techStack: ['Go / Netty'] },
        { id: 'snowflake', label: 'Snowflake ID Generator', type: 'worker', x: 45, y: 10, description: 'Creates unique 64-bit IDs that sort by time', techStack: ['Twitter Snowflake'] },
        { id: 'fanout_queue', label: 'Fanout Message Queue', type: 'queue', x: 65, y: 30, description: 'Holds fanout jobs until a worker is free', techStack: ['Kafka'] },
        { id: 'fanout_workers', label: 'Fanout Worker Cluster', type: 'worker', x: 82, y: 30, description: 'Adds new tweet IDs to follower timelines in Redis', techStack: ['Go Workers'] },
        { id: 'timeline_cache', label: 'Timeline Redis Cluster', type: 'cache', x: 65, y: 70, description: 'Keeps a list of the latest 800 tweet IDs for each user (user_id to tweet IDs)', techStack: ['Redis Cluster'], scaleMetric: '1.92 TB RAM' },
        { id: 'tweet_db', label: 'Tweet Store (Cassandra)', type: 'database', x: 82, y: 70, description: 'Durable storage for every tweet, built for heavy writes', techStack: ['Apache Cassandra / ScyllaDB'] },
        { id: 'social_graph', label: 'Social Graph DB (Followers)', type: 'database', x: 65, y: 10, description: 'Stores who follows whom', techStack: ['FlockDB / PostgreSQL'] }
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
        { id: 'e9', from: 'fanout_workers', to: 'timeline_cache', label: 'LPUSH tweet_id', protocol: 'TCP' },
        { id: 'e10', from: 'timeline_service', to: 'timeline_cache', label: 'LRANGE 0 20', protocol: 'TCP' },
        { id: 'e11', from: 'timeline_service', to: 'tweet_db', label: 'Hydrate Tweet Metadata', protocol: 'NoSQL' }
      ],
      flowSteps: [
        { step: 1, title: 'Save the tweet', description: 'A user posts a tweet. The Tweet Service gets a unique 64-bit ID from the Snowflake generator and writes the tweet to Cassandra.', activeNodes: ['client', 'lb', 'tweet_service', 'snowflake', 'tweet_db'], highlightDetails: 'A Snowflake ID starts with a timestamp, so sorting by ID also sorts by time.', latencyEstimate: '15ms' },
        { step: 2, title: 'Decide how to fan out', description: 'The Tweet Service publishes an event to Kafka. A fanout worker looks up the author\'s follower count in the Social Graph DB.', activeNodes: ['tweet_service', 'fanout_queue', 'fanout_workers', 'social_graph'], highlightDetails: 'Below a follower threshold (for example 25,000), push the tweet to followers. Above it, skip the push. The threshold is a tuning choice, not a fixed rule.', latencyEstimate: '5ms' },
        { step: 3, title: 'Push to follower timelines', description: 'The worker adds the tweet ID to the front of each follower\'s Redis list (LPUSH) and trims the list to the latest 800 IDs (LTRIM).', activeNodes: ['fanout_workers', 'timeline_cache'], highlightDetails: 'Workers batch many Redis commands into one network round trip (pipelining) and handle many follower lists at once.', latencyEstimate: '50-200ms' },
        { step: 4, title: 'Read and merge', description: 'When a user opens the app, the Timeline Service reads the cached tweet IDs from Redis. It also fetches recent tweets from the celebrities that user follows, then merges both lists by time.', activeNodes: ['client', 'timeline_service', 'timeline_cache', 'tweet_db'], highlightDetails: 'Both lists are already sorted by time, so the merge is cheap and happens in memory. The service then loads the full tweet data for the top results.', latencyEstimate: '25ms' }
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
        description: 'Get the Home Timeline, one page at a time (the cursor marks where the next page starts)',
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
          { name: 'tweet_id', type: 'BIGINT', isPrimary: true, notes: 'Snowflake ID (sorts by time)' },
          { name: 'content', type: 'VARCHAR(280)' },
          { name: 'media_urls', type: 'LIST<VARCHAR>' },
          { name: 'created_at', type: 'TIMESTAMP' }
        ],
        notes: 'Cassandra stores all tweets. Each author is one partition, with tweets sorted newest first, so "latest N tweets by this author" is a fast range read.'
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
        notes: 'Needs two lookups: who a user follows (user_id, followee_id), and who follows an account (followee_id, user_id). Keep a second index or copy for the reverse direction.'
      }
    ],
    deepDives: [
      {
        title: 'Fanout: push, pull, or hybrid',
        subtitle: 'Why pure push and pure pull both break at this scale',
        content: `Fanout means copying one new tweet to every place that needs it. There are two basic ways to do it.\n\n1. Fanout-on-write (push). When a user posts, the system adds the tweet ID to every follower's Redis timeline list right away.\n- Benefit: reading a timeline is one fast Redis lookup.\n- Cost: an account with 100 million followers causes 100 million writes for one tweet. That floods the workers and the cache.\n\n2. Fanout-on-read (pull). When a user opens the app, the system fetches recent tweets from everyone they follow, sorts them, and returns the result.\n- Benefit: posting is cheap, because nothing is copied.\n- Cost: reading is slow. A user who follows 2,000 accounts needs data from up to 2,000 partitions and a merge of 2,000 sorted lists on every refresh.\n\n3. Hybrid (the approach used by Twitter and others).\n- Ordinary accounts (below a follower threshold, for example 25,000): push into follower timelines.\n- Celebrity accounts (above the threshold): do not push. When a follower loads the timeline, the Timeline Service pulls the latest tweets from the celebrities that user follows and merges them with the ready-made list.\n\nThe threshold trades write cost against read cost. A lower threshold means fewer writes but more pulls on every read.`,
        keyTakeaways: [
          'The hybrid design avoids the celebrity write explosion and keeps reads fast, because each reader pulls from only a few celebrity accounts.',
          'Build and keep timelines only for recently active users (for example, users who logged in within the last 14 days). This saves Redis memory. Rebuild an inactive user\'s timeline from the tweet store when they return.'
        ]
      },
      {
        title: 'Snowflake 64-bit IDs',
        subtitle: 'Unique, time-sortable IDs from many servers without coordination',
        content: `A Snowflake ID has 64 bits:\n- 1 bit: unused sign bit (always 0).\n- 41 bits: time in milliseconds since a custom epoch (start date). This lasts about 69 years.\n- 10 bits: machine ID. This allows 1,024 generator nodes.\n- 12 bits: a sequence number that counts 0 to 4,095 within one millisecond on one node.\n\nCapacity: each node can create 4,096 IDs per millisecond, which is about 4.1 million IDs per second per node. With 1,024 nodes, the system can create about 4.2 billion IDs per second. Nodes never need to talk to each other, because each node has its own machine ID.\n\nThe design has one weak point: it trusts the clock. If a node's clock moves backward (for example after an NTP correction), it could repeat an ID. A node must wait, or refuse to issue IDs, until the clock passes the last timestamp it used.`,
        keyTakeaways: [
          'IDs sort by creation time (they are roughly time-ordered across nodes), so no separate timestamp index is needed for ordering.',
          'Clock handling matters. Detect backward clock jumps and pause ID generation instead of risking duplicates.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'A celebrity tweet gets a huge burst of reads and retweets',
        impact: 'Millions of users load and like the same tweet at once, so the same rows get hit again and again.',
        mitigation: 'Cache the full tweet object (a hot key) in Redis or Memcached with read replicas. Add a short-lived in-process cache on each Timeline Service server.'
      },
      {
        bottleneck: 'Reading the follower list of a very large account',
        impact: 'Fetching 80 million followers as one query is too slow for a fanout worker.',
        mitigation: 'Split the follower list into chunks of 10,000 and process each chunk as its own Kafka job, so many workers run in parallel. (Accounts above the celebrity threshold skip push, so this mostly helps accounts just below it.)'
      }
    ],
    interviewQA: [
      {
        question: 'Why not use SQL JOINs to build the home timeline on the fly?',
        hint: 'Think about 350,000 timeline reads per second and a very large follow graph.',
        goodAnswer: 'The query would be SELECT * FROM tweets WHERE author_id IN (SELECT followee_id FROM follows WHERE user_id = ?) ORDER BY created_at DESC LIMIT 20. For a user who follows thousands of accounts, it reads rows from many shards and sorts them, on every request. At 350,000 requests per second, that load would overwhelm the database. Building the timeline ahead of time (push) turns each read into one Redis lookup.',
        pitfalls: 'Answering "add more read replicas". Replicas add capacity, but each query still does the same expensive work.'
      }
    ],
    similarSystems: ['Facebook News Feed', 'LinkedIn Feed', 'Threads', 'Mastodon'],
    tags: ['Fanout-on-Write', 'Snowflake ID', 'Redis', 'Cassandra', 'Kafka']
  },
  {
    id: 'instagram-photo-sharing',
    title: 'Design Instagram / Photo Sharing Platform',
    slug: 'instagram-architecture',
    tagline: 'Accept photo uploads at scale, turn each one into several sizes in the background, and serve billions of views through a CDN.',
    category: 'Social & Content',
    difficulty: 'Intermediate',
    readTime: '20 min read',
    scaleSummary: {
      dau: '500 Million Daily Active Users',
      qps: '500,000 Read QPS / 25,000 Photo Upload QPS',
      storage: '100 TB / day of images & videos',
      bandwidth: '250 GB/s Egress / 12.5 GB/s Ingress'
    },
    overview: 'Users upload photos and short videos, apply filters, follow friends, browse an Explore feed, and post Stories that disappear after 24 hours. The system needs a background pipeline that turns each upload into several image sizes, and object storage that can hold petabytes.',
    keyChallenges: [
      'Receiving 100M photos a day and converting each one into several sizes and formats (thumbnail, 1080p, compressed formats for phones).',
      'Keeping the CDN cache hit ratio high so that 250 GB/s of image downloads mostly never reach the origin.',
      'Stories that expire after 24 hours and play back one after another without delay.',
      'Feed ranking that mixes time order with machine-learning engagement scores.'
    ],
    functionalRequirements: [
      'Upload, crop, filter and share photos and videos with captions.',
      'Show a feed of photos from followed accounts.',
      'Show a profile page with a grid of the user\'s photos.',
      'Like, comment on and tag users in photos.',
      'Post Stories that expire after 24 hours and show who viewed them.'
    ],
    nonFunctionalRequirements: [
      'Upload: finish a 5 MB photo in under 2 seconds on a good connection.',
      'Feed: load in under 200 ms.',
      'Availability 99.99%. Durability of 99.999999999% (eleven nines): stored photos are almost never lost.',
      'Adaptive formats: send WebP or AVIF to devices that support them, and JPEG to the rest.'
    ],
    outOfScope: ['Live video broadcast.', 'Checkout for in-app shopping.'],
    capacityEstimations: {
      assumptions: [
        '500M daily active users; 100M photos uploaded per day.',
        'Average size of one photo after processing, across all sizes: 1 MB.',
        'Storage per day: 100M * 1 MB = 100 TB (36.5 PB per year).',
        'Each user views 40 photos a day: 20 billion views/day, about 231,000/s on average and 500,000/s at peak.',
        'All storage figures are one copy, before replication.'
      ],
      metrics: [
        { label: 'Upload Ingress QPS', value: '25,000 QPS', formula: '100M / 86,400 * 20x peak burst', description: 'Peak photo uploads per second' },
        { label: 'Photo View Egress QPS', value: '500,000 QPS', formula: '20B / 86,400 * 2x peak factor', description: 'Peak photo requests per second' },
        { label: 'Annual Storage Growth', value: '36.5 Petabytes', formula: '100 TB/day * 365 days', description: 'New data per year in object storage such as S3 or GCS' }
      ],
      conclusion: 'Clients should upload straight to object storage with pre-signed URLs, so upload traffic never passes through the application servers. A CDN should serve the images, so most views never reach the origin.'
    },
    architecture: {
      summary: 'The client asks the Upload Service for a pre-signed S3 URL and uploads the photo straight to object storage. S3 sends an event to a queue. Workers create the smaller versions (WebP/AVIF), save them to a second bucket, and write the photo record to the database. Feeds are built by fanout into Redis (the same hybrid approach as the Twitter case study). Clients load images through the CDN.',
      nodes: [
        { id: 'client', label: 'Mobile App (iOS/Android)', type: 'client', x: 8, y: 50, description: 'Uploads media and scrolls the photo feed' },
        { id: 'cdn', label: 'Global Image CDN', type: 'cdn', x: 26, y: 75, description: 'Caches photos on edge servers close to users', techStack: ['Fastly / CloudFront'] },
        { id: 'gateway', label: 'API Gateway', type: 'gateway', x: 26, y: 30, description: 'Checks auth tokens and limits request rates', techStack: ['Envoy'] },
        { id: 'upload_srv', label: 'Media Upload Service', type: 'service', x: 45, y: 20, description: 'Creates pre-signed S3 upload URLs', techStack: ['Python / Go'] },
        { id: 's3_raw', label: 'Raw Object Storage (S3)', type: 'storage', x: 65, y: 20, description: 'Receives uploads directly from clients', techStack: ['AWS S3'] },
        { id: 'image_queue', label: 'Transcode Task Queue', type: 'queue', x: 82, y: 20, description: 'Holds image processing jobs until a worker is free', techStack: ['RabbitMQ / SQS'] },
        { id: 'workers', label: 'Image Processing Workers', type: 'worker', x: 92, y: 40, description: 'Create 150px, 640px and 1080p versions in WebP', techStack: ['C++ libvips / FFmpeg'] },
        { id: 's3_processed', label: 'Processed Asset Store', type: 'storage', x: 65, y: 50, description: 'Holds the finished images. This is the CDN origin.', techStack: ['AWS S3 Standard'] },
        { id: 'metadata_db', label: 'Metadata & Graph DB', type: 'database', x: 45, y: 70, description: 'Stores photo records, likes, comments and follows', techStack: ['PostgreSQL (Sharded) / Cassandra'] }
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
        { step: 1, title: 'Get an upload URL', description: 'The client asks the API Gateway for permission to upload. The Upload Service checks the user\'s quota and returns a signed S3 URL that expires after 15 minutes.', activeNodes: ['client', 'gateway', 'upload_srv'], highlightDetails: 'The photo bytes never pass through the application servers, which saves their CPU and bandwidth.', latencyEstimate: '20ms' },
        { step: 2, title: 'Upload straight to S3', description: 'The client sends the photo directly to the S3 bucket with an HTTP PUT. A typical photo fits in one request. Large files, such as videos, use multipart upload (several parts of at least 5 MB each).', activeNodes: ['client', 's3_raw'], highlightDetails: 'The signed URL limits the upload to one object key and a short time window.', latencyEstimate: '400ms' },
        { step: 3, title: 'Process in the background', description: 'S3 sends an event to the queue. A worker downloads the raw image, applies filters, and creates several sizes in WebP or AVIF. It saves them to the processed bucket and writes the photo record.', activeNodes: ['s3_raw', 'image_queue', 'workers', 's3_processed'], highlightDetails: 'libvips resizes images quickly and uses little memory. If a worker fails, the queue retries the job.', latencyEstimate: '350ms' },
        { step: 4, title: 'Serve through the CDN', description: 'Followers get CDN URLs for the optimized images. The CDN serves each image from the edge server nearest to the user. On a miss, it fetches the image from the processed bucket.', activeNodes: ['client', 'cdn', 's3_processed'], highlightDetails: 'Recent and popular photos stay in the edge cache, so most views never reach S3.', latencyEstimate: '15ms' }
      ]
    },
    apiDesign: [
      {
        method: 'POST',
        path: '/api/v1/media/presign',
        description: 'Get a pre-signed URL for uploading straight to S3',
        requestBody: '{\n  "file_type": "image/jpeg",\n  "file_size": 3482910\n}',
        responseBody: '{\n  "upload_url": "https://ig-raw.s3.amazonaws.com/uploads/xyz.jpg?AWS...",\n  "media_id": "med_102938"\n}'
      },
      {
        method: 'POST',
        path: '/api/v1/posts',
        description: 'Publish a post after the upload is done',
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
        notes: 'PostgreSQL, sharded by user_id, with read replicas for read traffic.'
      }
    ],
    deepDives: [
      {
        title: 'Stories: data that expires after 24 hours',
        subtitle: 'Expire data without large DELETE jobs',
        content: `Stories disappear after 24 hours. Storing them in the main relational database means large batches of DELETE statements, which leave dead rows and need heavy cleanup.\n\nA simpler design:\n1. Story metadata in Redis. Keep each user's active stories in a sorted set (ZSET) with the expiry time as the score. To list the stories that are still live, read the entries whose score is later than now (ZRANGEBYSCORE). Expired entries can be removed with ZREMRANGEBYSCORE or a key TTL.\n2. Media cleanup in S3. Put story media in its own bucket with a lifecycle rule that deletes objects one day after creation. S3 does this in the background, with no database work. Lifecycle rules work in whole days and run asynchronously, so an object can outlive its 24 hours. Always check the expiry time when serving a story, and do not rely on the delete alone.\n3. Seen state. To show the story ring as seen or unseen, cache the viewed state on the client. Keep the list of viewers for each story (for view receipts) in a Redis set, or in a store such as Cassandra if you need to keep it longer.`,
        keyTakeaways: [
          'A Redis sorted set with an expiry score plus an S3 lifecycle rule avoids large delete jobs in the main database.',
          'Lifecycle deletion is approximate. Enforce the 24-hour limit when reading, not only when deleting.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'S3 request limits per key prefix (3,500 writes and 5,500 reads per second per prefix)',
        impact: 'If all uploads go under one prefix, such as s3://bucket/photos/, peak traffic can exceed the limit and S3 returns HTTP 503 SlowDown errors.',
        mitigation: 'S3 applies the limit to each prefix and adds capacity as traffic grows, so spread keys over many prefixes (for example s3://bucket/2a8f/photos/med_123.jpg, where 2a8f comes from a hash of the ID). The CDN also absorbs most reads before they reach S3. Retry with exponential backoff when S3 returns 503.'
      }
    ],
    interviewQA: [
      {
        question: 'How do you handle users scrolling very fast through thousands of photos on mobile?',
        hint: 'Think about phone bandwidth and memory.',
        goodAnswer: 'Load images in stages: show a small placeholder first (for example a BlurHash, a tiny encoded preview), then a low-resolution WebP, then the full size once the photo stays on screen. Recycle off-screen views (a windowed list) to save memory, and prefetch the next few photos.',
        pitfalls: 'Downloading the full 1080p image for every photo as it scrolls past. It wastes data and memory on photos the user never looks at.'
      }
    ],
    similarSystems: ['Pinterest', 'Flickr', 'Snapchat', 'BeReal'],
    tags: ['S3 Object Storage', 'CDN', 'Transcoding', 'Ephemeral Stories', 'PostgreSQL']
  },
  {
    id: 'youtube-netflix-video-streaming',
    title: 'Design YouTube / Netflix (Global Video Streaming)',
    slug: 'video-streaming-platform',
    tagline: 'Accept uploaded videos, convert them into many qualities and small chunks, and stream them to viewers around the world through CDNs.',
    category: 'Social & Content',
    difficulty: 'Advanced',
    readTime: '25 min read',
    scaleSummary: {
      dau: '1 Billion Daily Active Users',
      qps: '5 Million Video Stream Requests/sec / 50,000 Video Uploads/hour',
      storage: '500 Petabytes active video library',
      bandwidth: '5 Terabits / second origin egress (after CDN offload)'
    },
    overview: 'A video streaming service takes raw video files, encodes (converts) them into several resolutions (4K, 1080p, 720p, 360p) and codecs (H.264, VP9, AV1), and cuts them into chunks of about 2 to 6 seconds. Players then stream the chunks with Adaptive Bitrate Streaming (ABR) over HLS or MPEG-DASH. The player picks the quality for each chunk based on the current network speed.',
    keyChallenges: [
      'Encoding very large source files (some are 50 GB) quickly and cheaply, by splitting the work across many workers in a workflow (a DAG, or directed acyclic graph, of tasks).',
      'Adaptive bitrate: the player must change quality as the viewer\'s network speed changes.',
      'Cutting delivery cost by placing cache servers inside ISP networks (the Netflix Open Connect approach).',
      'Fast start: show the first frame in under 500 ms by prefetching the first chunks.'
    ],
    functionalRequirements: [
      'Upload videos in common formats (.mp4, .mov, .avi) and encode them.',
      'Stream on web, mobile and smart TVs.',
      'Switch resolution automatically to match network speed.',
      'Search videos by title, tags and description.',
      'Count views and remember each viewer\'s watch position.'
    ],
    nonFunctionalRequirements: [
      'Fast start: playback begins in under 500 ms.',
      'Smooth playback: rebuffering (the video pausing to load) should be rare, even when the network speed changes.',
      'Durability: uploaded videos must not be corrupted or lost (eleven nines).',
      'Scale: serve millions of concurrent viewers during live events.'
    ],
    outOfScope: ['Real-time two-way video calls (WebRTC).', 'Negotiating DRM licenses with studios.'],
    capacityEstimations: {
      assumptions: [
        '500 hours of video are uploaded every minute. That is 30,000 video-minutes per minute, or about 8.3 hours of video per second.',
        'A raw video is about 300 MB per minute of video. So uploads arrive at 9 TB per minute (150 GB/s).',
        'After encoding into 5 resolutions, storage is about 100 MB per minute of video: 3 TB per minute, or 4.32 PB per day of new video (one copy, before replication).',
        'The active video library is 500 PB.',
        '1 billion video views per day. A view lasts 10 minutes on average at 2 Mbps, which is 150 MB per view.'
      ],
      metrics: [
        { label: 'Ingress Bandwidth', value: '1.2 Tbps', formula: '30,000 video-min/min * 300 MB = 150 GB/s', description: 'Incoming raw video uploads' },
        { label: 'Egress Bandwidth (Peak)', value: '5 Tbps', formula: '10M concurrent streams * 2 Mbps / 4 (CDN offload factor)', description: 'Traffic that still reaches the origin after the CDN and ISP caches. Total delivery to viewers is 20 Tbps.' },
        { label: 'Metadata QPS', value: '250,000 QPS', formula: 'Search, recommendations, and playback beacon logging', description: 'Backend API requests per second' }
      ],
      conclusion: 'Serving 20 Tbps from a central cloud region would cost far too much. Caches inside ISP networks and a CDN must serve most traffic, so the origin only handles cache misses.'
    },
    architecture: {
      summary: 'Clients upload raw video to S3 with pre-signed URLs. An S3 event starts a transcoding workflow that splits the video at keyframe boundaries (GOP chunks), encodes the chunks in parallel, and writes HLS playlists (.m3u8) and segments to object storage. The CDN and ISP caches then serve the segments. The player picks a quality for each chunk.',
      nodes: [
        { id: 'client', label: 'Video Player Client', type: 'client', x: 8, y: 50, description: 'An adaptive bitrate player (ExoPlayer, HLS.js)' },
        { id: 'cdn', label: 'Global Video CDN / ISP PoPs', type: 'cdn', x: 26, y: 70, description: 'Caches video chunks on servers inside ISP networks and at CDN points of presence (PoPs)', techStack: ['Netflix Open Connect / Fastly'] },
        { id: 'gateway', label: 'API Gateway', type: 'gateway', x: 26, y: 30, description: 'Handles auth and passes recommendation and search requests on', techStack: ['Envoy / Zuul'] },
        { id: 's3_raw', label: 'Raw Video Staging (S3)', type: 'storage', x: 45, y: 15, description: 'Holds the original upload until encoding finishes', techStack: ['AWS S3'] },
        { id: 'dag_orchestrator', label: 'DAG Transcoding Engine', type: 'worker', x: 65, y: 15, description: 'Runs the steps: split into chunks, extract audio, apply filters', techStack: ['Temporal / Apache Airflow'] },
        { id: 'transcode_cluster', label: 'Transcode GPU Cluster', type: 'worker', x: 85, y: 15, description: 'Encodes chunks into AV1, VP9 and H.264 at 4K, 1080p and 720p', techStack: ['FFmpeg + NVENC GPU'] },
        { id: 's3_encoded', label: 'Segmented Object Store', type: 'storage', x: 85, y: 50, description: 'Holds the HLS master manifest (master.m3u8) and the video chunks', techStack: ['AWS S3 Standard'] },
        { id: 'metadata_db', label: 'Video Metadata Store', type: 'database', x: 45, y: 50, description: 'Stores titles, thumbnails, view counts and tags', techStack: ['Cassandra / Spanner'] },
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
        { step: 1, title: 'Upload in parts', description: 'The client uploads a large raw video (for example 10 GB) to S3 with multipart upload. It sends the file in parts (for example 20 MB each), several at a time.', activeNodes: ['client', 's3_raw'], highlightDetails: 'If the connection drops, the client only resends the parts that did not finish.', latencyEstimate: '10-60s' },
        { step: 2, title: 'Split and encode in parallel', description: 'A Temporal workflow splits the video at keyframe boundaries (GOP, or Group of Pictures, boundaries) into many chunks. It spreads the chunks over GPU workers, and each worker encodes its chunks.', activeNodes: ['s3_raw', 'dag_orchestrator', 'transcode_cluster'], highlightDetails: 'Each chunk starts at a keyframe, so chunks can be encoded independently. Encoding many chunks at once finishes a long video much faster than encoding it in one piece.', latencyEstimate: '2-4 mins' },
        { step: 3, title: 'Package and publish', description: 'Workers write the encoded chunks and a master playlist (master.m3u8) that lists each quality and its bandwidth. They upload everything to S3 and mark the video as ready.', activeNodes: ['transcode_cluster', 's3_encoded', 'metadata_db'], highlightDetails: 'The manifest lists several bitrates (for example 500 kbps, 1,500 kbps and 4,000 kbps).', latencyEstimate: '500ms' },
        { step: 4, title: 'Play with adaptive bitrate', description: 'The player downloads the master playlist, measures how fast chunks download, and requests each next chunk at a suitable quality from the nearest CDN edge.', activeNodes: ['client', 'cdn', 's3_encoded'], highlightDetails: 'If the signal gets weaker, the player moves down to a lower quality (for example 720p) before its buffer runs out.', latencyEstimate: '15-30ms' }
      ]
    },
    apiDesign: [
      {
        method: 'POST',
        path: '/api/v1/videos/upload-init',
        description: 'Start an upload session and get a multipart upload ID',
        requestBody: '{\n  "title": "System Design Masterclass",\n  "file_size": 2147483648,\n  "duration_seconds": 3600\n}',
        responseBody: '{\n  "video_id": "vid_9876",\n  "upload_id": "mp_upload_abc123",\n  "part_size": 20971520\n}'
      },
      {
        method: 'GET',
        path: '/api/v1/videos/{video_id}/manifest.m3u8',
        description: 'Get the HLS manifest that lists the available qualities',
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
        notes: 'ScyllaDB or Cassandra handle many reads and writes. Do not update views_count on every view. Count views elsewhere (see the bottleneck below) and write the total in batches.'
      }
    ],
    deepDives: [
      {
        title: 'Adaptive bitrate streaming: HLS and MPEG-DASH',
        subtitle: 'How a player changes quality in the middle of a video',
        content: `With progressive download (one .mp4 file), the player downloads the whole file at one fixed quality. If the network is slower than the video bitrate, the video stalls.\n\nHLS and DASH solve this:\n1. The video is cut into short chunks (2 to 6 seconds), stored as .ts or .m4s (fragmented MP4) files.\n2. Each chunk is encoded at several qualities, for example 360p at 400 kbps, 720p at 1.5 Mbps, 1080p at 4.5 Mbps and 4K at 15 Mbps.\n3. The player measures how fast the last chunks downloaded and how much video is in its buffer. Then it picks the quality of the next chunk. For example:\n   - Buffer above 15 s and a fast network: ask for the next chunk at 1080p.\n   - Buffer below 4 s (the viewer enters a tunnel): ask for the next chunk at 360p.\n4. Result: the player can lower quality before the buffer is empty, so stalls are much less likely. They can still happen if the network drops below even the lowest quality.\n\nBoth protocols use a manifest file that lists the qualities: .m3u8 for HLS and .mpd for DASH.`,
        keyTakeaways: [
          'The master manifest (.m3u8 or .mpd) holds the URLs of every quality level.',
          'Chunk length is a trade-off. Short chunks (2 s) let the player switch quality faster and lower live-stream delay, but they cost more in compression efficiency and in requests. Longer chunks (6 s) compress better.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'View counter on a hot video',
        impact: 'A viral video gets 100,000 views per second. Updating one database row for each view causes lock contention on that row.',
        mitigation: 'Count views in Redis with INCRBY, or send view events to Kafka and aggregate them. Write the totals to the database in batches every few seconds. Viewers see a count that is a few seconds old, which is acceptable.'
      }
    ],
    interviewQA: [
      {
        question: 'How do you keep CDN cache hits high when most videos in the long tail are rarely watched?',
        hint: 'Use tiers of cache, and decide what to evict.',
        goodAnswer: 'Use tiered caching. Keep the most popular videos on edge servers (close to viewers). Keep a wider set on regional mid-tier caches. Leave rarely watched videos only in object storage, and fetch them from the origin on the first request. Use eviction rules that favor popular content, such as LRU (least recently used). Place new releases on edge servers ahead of time, during off-peak hours, if you expect them to be popular.',
        pitfalls: 'Trying to cache the whole 500 PB library on edge servers. Most of it would be almost never read.'
      }
    ],
    similarSystems: ['Netflix', 'Hulu', 'Twitch VOD', 'Disney+'],
    tags: ['HLS/DASH', 'Transcoding', 'Adaptive Bitrate', 'CDN', 'Cassandra']
  },
  {
    id: 'tiktok-short-video',
    title: 'Design TikTok (Short-Form Video Feed & Recommendation)',
    slug: 'tiktok-architecture',
    tagline: 'Serve an endless swipe feed of short videos that start playing at once, using a recommendation system that learns from each swipe.',
    category: 'Social & Content',
    difficulty: 'Advanced',
    readTime: '22 min read',
    scaleSummary: {
      dau: '800 Million Daily Active Users',
      qps: '1.2 Million Feed Requests/sec / 580 Video Uploads/sec avg',
      storage: '250 TB / day',
      bandwidth: '800 GB/s Global Edge Bandwidth'
    },
    overview: 'TikTok shows a personalized, endless vertical feed of short videos (15 to 60 seconds). Each video should start within about 100 ms of a swipe. To do this, the system combines a recommendation pipeline fed by live behavior signals (watch time, rewatches, skips, shares) with a client that downloads the start of upcoming videos in advance (prefetching).',
    keyChallenges: [
      'Instant playback: the next video should start almost immediately when the user swipes up.',
      'A fast feedback loop: signals such as "watched 3 seconds", "watched to the end" or "skipped at once" should reach the recommendation features within about 2 seconds.',
      'Uploading and processing many videos, including audio sync.',
      'Prefetching: loading the first few seconds of the next videos before the user asks for them, without wasting mobile data.'
    ],
    functionalRequirements: [
      'An endless vertical "For You" feed (FYP) where videos start playing at once.',
      'Record, edit, add music and effects, and publish 15 to 60 second videos.',
      'Collect fine-grained signals: exact watch time, loop count, pauses and shares.',
      'Rank videos for each user in near real time.'
    ],
    nonFunctionalRequirements: [
      'Time to play after a swipe: under 100 ms at P99.',
      'Freshness: a video the user just liked should affect the next few feed items (about 5).',
      'Availability: 99.99%.',
      'Save data on mobile networks.'
    ],
    outOfScope: ['Live shopping auctions.', 'End-to-end encrypted direct messages.'],
    capacityEstimations: {
      assumptions: [
        '800M daily active users, each watching 80 videos a day: 64 billion views/day. That is about 740,000 views/s on average and 1.2M/s at peak.',
        'An average short video is 5 MB (compressed 720p, 9:16 vertical).',
        'Prefetching: the client downloads the first 500 KB (about the first 2 seconds) of the next few videos ahead of time.',
        '50M new videos per day, about 580 uploads/s on average. Storage figures are one copy, before replication.'
      ],
      metrics: [
        { label: 'Feed Recommendation QPS', value: '1,200,000 QPS', formula: 'Peak feed pagination requests', description: 'Requests for candidate retrieval and ranking' },
        { label: 'Telemetry Event Ingestion', value: '3,500,000 events/s', formula: 'Watch duration beacons + swipe events', description: 'Events entering the Kafka stream' },
        { label: 'Daily Video Storage', value: '250 TB / day', formula: '50M new videos * 5 MB', description: 'New data per day in object storage' }
      ],
      conclusion: 'Prefetching the whole next videos would waste mobile data on videos the user skips. The client should prefetch only the first seconds, and load the rest if the user stays on the video.'
    },
    architecture: {
      summary: 'The client asks the API Gateway for a feed. The Recommendation Orchestrator reads user features, retrieves candidate videos, and ranks them with a neural model. It returns a ranked list. The app prefetches the start of the next videos from the CDN. Watch events flow through Kafka into Flink, which updates the user features that the next feed request uses.',
      nodes: [
        { id: 'client', label: 'Mobile Client (TikTok App)', type: 'client', x: 8, y: 50, description: 'Handles swipes and keeps the prefetch cache' },
        { id: 'cdn', label: 'Edge Video CDN', type: 'cdn', x: 26, y: 75, description: 'Serves video chunks, including prefetch requests', techStack: ['Cloudflare / Edge POPs'] },
        { id: 'gateway', label: 'API Gateway', type: 'gateway', x: 26, y: 30, description: 'Routes feed and telemetry requests', techStack: ['Envoy'] },
        { id: 'rec_service', label: 'Recommendation Orchestrator', type: 'service', x: 48, y: 30, description: 'Runs the steps: candidate retrieval, filtering, ranking', techStack: ['Go / C++ Microservices'] },
        { id: 'retrieval', label: 'Candidate Retrieval (ANN)', type: 'search', x: 68, y: 15, description: 'Narrows a huge video pool to a few thousand likely candidates with approximate nearest neighbor (ANN) search', techStack: ['Vector DB / Milvus / HNSW'] },
        { id: 'ranking_model', label: 'Deep Ranking Engine', type: 'worker', x: 88, y: 15, description: 'A neural network scores each candidate for this user, then the best are picked', techStack: ['PyTorch / Triton GPU'] },
        { id: 'feature_store', label: 'Real-Time Feature Store', type: 'cache', x: 68, y: 45, description: 'Holds fresh user signals, such as the topics of the last videos watched', techStack: ['Redis / Feast'] },
        { id: 'kafka_telemetry', label: 'Telemetry Stream (Kafka)', type: 'queue', x: 48, y: 75, description: 'Receives swipe, pause and watch-time events', techStack: ['Apache Kafka'] },
        { id: 'flink', label: 'Flink Stream Processing', type: 'worker', x: 68, y: 75, description: 'Computes user engagement features as events arrive', techStack: ['Apache Flink'] }
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
        { step: 1, title: 'Retrieve candidates', description: 'The app asks for a feed. The Orchestrator reads the user\'s features and uses vector search (ANN) to pull a few thousand candidate video IDs that match the user\'s interests.', activeNodes: ['gateway', 'rec_service', 'feature_store', 'retrieval'], highlightDetails: 'A per-user Bloom filter (a compact set that can say "probably seen") removes videos the user already watched.', latencyEstimate: '25ms' },
        { step: 2, title: 'Rank and diversify', description: 'A GPU cluster (Triton) scores the candidates for this user. Diversity rules then apply, for example no two videos with the same song in a row. The service returns the top videos, about 10.', activeNodes: ['rec_service', 'ranking_model'], highlightDetails: 'The model predicts the chance of events such as watching most of the video, liking it, and sharing it.', latencyEstimate: '35ms' },
        { step: 3, title: 'Prefetch', description: 'The app gets the list of video URLs. It then sends HTTP range requests to the CDN for the first part of the next videos (about 500 KB for the next one).', activeNodes: ['client', 'cdn'], highlightDetails: 'When the user swipes up, the next video starts from data already on the phone. The rest streams in while it plays.', latencyEstimate: '40ms' },
        { step: 4, title: 'Learn from behavior', description: 'The user watches video #1 for 14 seconds and likes it. The app sends the events to Kafka. Flink updates the user\'s features in Redis within about a second.', activeNodes: ['client', 'kafka_telemetry', 'flink', 'feature_store'], highlightDetails: 'The next feed request reads the updated features, so the like can change what comes next.', latencyEstimate: '500ms' }
      ]
    },
    apiDesign: [
      {
        method: 'GET',
        path: '/api/v2/feed/fyp',
        description: 'Get the next batch of personalized videos',
        responseBody: '{\n  "items": [\n    {\n      "video_id": "tk_192837",\n      "video_url": "https://cdn.tiktok.com/v/192837.mp4",\n      "author": "@techlead",\n      "music_id": "mus_402",\n      "duration": 22.4\n    }\n  ],\n  "cursor": "cur_987"\n}'
      },
      {
        method: 'POST',
        path: '/api/v2/telemetry/beacon',
        description: 'Send watch signals for one video',
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
        notes: 'A fast check to avoid showing the same video twice. A Bloom filter can give false positives (it may hide a video the user has not seen), but never false negatives.'
      }
    ],
    deepDives: [
      {
        title: 'Instant swipes: prefetching the start of videos',
        subtitle: 'How the next video can start without a loading spinner',
        content: `If the app waits for the swipe before it requests the next video, network delay (often 150 to 400 ms) shows up as a black screen or a spinner.\n\nA prefetch strategy:\n1. Current video: buffer ahead as it plays (for example the next 10 seconds, or the whole video if it is short).\n2. Next video: prefetch the first 500 KB, which covers the file header and about the first 2 seconds of frames.\n3. The video after that: prefetch a smaller piece, for example the first 200 KB.\n4. On swipe: the next video starts from the data already on the phone. In the background, the app requests the rest with an HTTP Range header (for example Range: bytes=500000-).\n5. Fast swipes: if the user skips a video, stop its download and drop the buffered data to save memory and mobile data.\n\nThe cost is that some prefetched data is wasted when the user skips a video. A short prefix wastes much less than downloading whole videos in advance, and the amount is a tuning choice.`,
        keyTakeaways: [
          'HTTP Range requests let the app download only the start of a file, so it needs no extra copy of the video.',
          'Prefetching only a short prefix costs far less data than prefetching whole videos, though it still uses some data on skipped videos.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Cold start for new videos',
        impact: 'A new video has no views, so a model that relies on past engagement will rarely pick it.',
        mitigation: 'Reserve a small share of the feed for exploration (for example 1 new video in 20, or 5%). Collect early watch signals from those showings, then use them to score the video.'
      }
    ],
    interviewQA: [
      {
        question: 'How do you avoid showing a user the same video twice within 7 days?',
        hint: 'Querying billions of watch-history rows for every feed request is too slow.',
        goodAnswer: 'Keep a compact probabilistic filter for each user in memory, for example a Bloom filter (about 12 KB for 10,000 videos at roughly a 1% false-positive rate). While generating candidates, test each video ID against the filter and drop the matches. A plain Bloom filter cannot delete entries, so use one filter per day and drop the oldest, or use a Cuckoo filter, which supports deletion. A false positive only hides a video that was not actually seen, which is harmless.',
        pitfalls: 'Using SQL such as SELECT ... WHERE video_id NOT IN (SELECT ...) on a large history table.'
      }
    ],
    similarSystems: ['Instagram Reels', 'YouTube Shorts', 'Snapchat Spotlight'],
    tags: ['Vector Search', 'Recommendation System', 'Prefetching', 'Kafka', 'Flink']
  },
  {
    id: 'reddit-forum',
    title: 'Design Reddit / Community Forum & Hot Ranking',
    slug: 'reddit-architecture',
    tagline: 'Handle heavy voting, store deeply nested comment threads, and rank posts with the Hot algorithm.',
    category: 'Social & Content',
    difficulty: 'Intermediate',
    readTime: '18 min read',
    scaleSummary: {
      dau: '70 Million Daily Active Users',
      qps: '80,000 Read QPS / 13,500 Vote & Comment QPS',
      storage: '10 TB / year text posts & comment trees',
      bandwidth: '15 GB/s Egress'
    },
    overview: 'Reddit is a community site with thousands of subreddits. Users submit links or text, vote posts and comments up or down, and reply to each other in nested comment threads. The system needs a fast way to count votes and a fast way to load a comment tree.',
    keyChallenges: [
      'Counting votes safely when many users vote at once, without row lock contention in the database.',
      'Loading deeply nested comment trees (10 or more levels, and very large threads) in under 150 ms.',
      'The Hot ranking algorithm: it combines the vote score (on a log scale) with the post age, so newer posts rank higher.',
      'Caching subreddit feeds while scores keep changing.'
    ],
    functionalRequirements: [
      'Create subreddits and submit posts (text, links, images).',
      'Upvote and downvote posts and comments.',
      'Reply to comments, to any depth.',
      'Sort a subreddit feed by Hot, New, Top (day, week, all time) or Rising.'
    ],
    nonFunctionalRequirements: [
      'A subreddit page loads in under 100 ms.',
      'A vote shows up in under 1 second.',
      'Availability: 99.99%.',
      'Load a comment tree with one query, not one query per comment (the N+1 query problem).'
    ],
    outOfScope: ['Live audio rooms (Reddit Talk).', 'Encrypted direct chat.'],
    capacityEstimations: {
      assumptions: [
        '70M daily active users; 50M votes per day: about 600 votes/s on average and 12,000/s at peak.',
        '5M new comments per day: about 60 comments/s on average and 1,500/s at peak.',
        'Reads: 300M page views per day: about 3,500/s on average and 80,000/s at peak.'
      ],
      metrics: [
        { label: 'Read QPS', value: '80,000 QPS', formula: 'Peak subreddit and comment thread views', description: 'Read traffic that reaches the CDN and the app servers' },
        { label: 'Vote Ingestion QPS', value: '12,000 QPS', formula: 'Peak atomic upvote/downvote operations', description: 'Peak votes per second, absorbed by a write buffer' }
      ],
      conclusion: 'Updating one SQL row for every vote would cause lock contention on popular posts. Buffering votes in Redis and writing totals to the database in batches avoids this. The cost is that the stored total lags behind by a few seconds, and a Redis crash can lose recent buffered votes unless each vote is also saved durably.'
    },
    architecture: {
      summary: 'Requests go through a CDN and an API Gateway to the Post Service and the Comment Service. PostgreSQL stores posts and comments (comments use a materialized path). Redis keeps each subreddit\'s Hot list as a sorted set and buffers vote counts. A background worker flushes the buffered votes to the database in batches.',
      nodes: [
        { id: 'client', label: 'Web & Mobile Clients', type: 'client', x: 8, y: 50, description: 'Browse feeds and cast votes' },
        { id: 'cdn', label: 'Edge CDN', type: 'cdn', x: 26, y: 70, description: 'Caches public subreddit feeds for 10 to 30 seconds. Logged-in pages are personal, so they are not cached this way.', techStack: ['Fastly'] },
        { id: 'gateway', label: 'API Gateway', type: 'gateway', x: 26, y: 30, description: 'Checks authentication and routes requests', techStack: ['Envoy'] },
        { id: 'post_srv', label: 'Post & Subreddit Service', type: 'service', x: 50, y: 30, description: 'Manages posts and computes Hot scores', techStack: ['Python / Go'] },
        { id: 'comment_srv', label: 'Comment Tree Service', type: 'service', x: 50, y: 65, description: 'Loads nested comment threads', techStack: ['Go / Rust'] },
        { id: 'redis_hot', label: 'Subreddit Redis ZSETs', type: 'cache', x: 75, y: 20, description: 'One sorted set per subreddit: post IDs ranked by Hot score', techStack: ['Redis Sorted Sets'] },
        { id: 'redis_votes', label: 'Vote Buffer (Redis)', type: 'cache', x: 75, y: 45, description: 'Collects vote changes in memory until they are written to the database', techStack: ['Redis Hashes'] },
        { id: 'db', label: 'Relational Database', type: 'database', x: 75, y: 80, description: 'Main store for posts, comments and users', techStack: ['PostgreSQL with LTree extension'] }
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
        { step: 1, title: 'Load the Hot feed', description: 'A user opens /r/programming. The Post Service reads the top 25 post IDs from the subreddit\'s Redis sorted set (ZREVRANGE), which is ordered by Hot score.', activeNodes: ['client', 'gateway', 'post_srv', 'redis_hot'], highlightDetails: 'Reading the top entries of a sorted set is fast, usually well under a millisecond in Redis itself.', latencyEstimate: '2ms' },
        { step: 2, title: 'Load a comment tree', description: 'When the user opens a post, the Comment Service runs one indexed query on the PostgreSQL ltree column (for example path <@ \'root.c1.c4\') to get a whole subtree.', activeNodes: ['client', 'comment_srv', 'db'], highlightDetails: 'One query replaces a chain of per-level queries. For very large threads, load the top levels first and fetch more on request ("load more comments").', latencyEstimate: '18ms' },
        { step: 3, title: 'Record a vote', description: 'A user upvotes a post. The server saves the user\'s vote in the database, and adds the change to the Redis vote buffer. The post\'s Hot score is recomputed from its new vote total. Hot score = sign(U - D) * log10(max(|U - D|, 1)) + (created_at - epoch) / 45000, where U is upvotes, D is downvotes, and times are in seconds.', activeNodes: ['client', 'post_srv', 'redis_votes', 'redis_hot'], highlightDetails: 'The vote term grows slowly (each 10x in net votes adds 1 point). The time term adds 1 point every 45,000 seconds (12.5 hours), so a newer post needs fewer votes to outrank an older one. A post\'s score only changes when its votes change.', latencyEstimate: '500ms' }
      ]
    },
    apiDesign: [
      {
        method: 'POST',
        path: '/api/v1/posts/{post_id}/vote',
        description: 'Upvote (1), downvote (-1) or remove a vote (0)',
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
        notes: 'The PostgreSQL ltree extension stores each comment\'s ancestry as a path. A GiST index on the path lets one query return a whole subtree.'
      }
    ],
    deepDives: [
      {
        title: 'Storing comment trees: adjacency list, nested sets, or materialized path',
        subtitle: 'Why a materialized path (ltree) suits threaded discussions',
        content: `There are three common ways to store nested comments.\n1. Adjacency list (each row has a parent_id). Inserts are simple. Reading a deep tree needs a recursive query (a recursive CTE) or one query per level, which is slow.\n2. Nested sets (each row has left and right numbers). Reads are fast. But inserting a comment means renumbering many other rows, which causes heavy locking in an active thread.\n3. Materialized path (PostgreSQL ltree). Each comment stores its full ancestry, for example "1.42.89".\n   - All descendants of comment 42: WHERE path <@ '1.42', an indexed query.\n   - Inserting a reply to 89: write one row with path "1.42.89.102". No other rows change.\n   - Display order: ORDER BY path gives the tree in depth-first order. One catch: ltree compares labels as text, so "10" sorts before "9". Pad IDs to a fixed width (for example 000009) or use an encoding that sorts correctly.\n\nThe cost of a materialized path is that moving a whole subtree to a new parent means rewriting every path in it. Comment threads rarely move, so this is rare. A very large thread can still be too big for one response, so load the top levels first and fetch deeper replies on demand.`,
        keyTakeaways: [
          'A materialized path gives cheap inserts and a one-query subtree read that uses an index.',
          'Pad path labels to a fixed width so that text sorting matches tree order.',
          'Load large threads in parts. Do not send a whole huge tree in one response.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Vote lock contention on a viral thread',
        impact: '10,000 users upvote the same breaking-news post within seconds. Each vote updates the same SQL row, so the updates queue behind row locks.',
        mitigation: 'Add vote changes to a Redis hash (HINCRBY) and write the batched totals to PostgreSQL every few seconds (for example 5). Also store each user\'s individual vote durably, so a Redis failure does not lose votes or allow double voting.'
      }
    ],
    interviewQA: [
      {
        question: 'How does Reddit prevent vote fuzzing and bot manipulation?',
        hint: 'Showing exact vote counts helps bot operators check whether their votes count.',
        goodAnswer: 'Reddit adds noise to the vote totals it displays ("vote fuzzing"), so a bot operator cannot tell from the number whether a particular vote was counted. Votes from spam or shadowbanned accounts can be ignored without telling the account owner. Together, these make it hard to test and tune a manipulation campaign. Rate limits and account-age checks add further protection.',
        pitfalls: 'Assuming the displayed vote count is always the exact, real-time total.'
      }
    ],
    similarSystems: ['Hacker News', 'Stack Overflow', 'Discourse'],
    tags: ['Nested Comments', 'LTree', 'Hot Ranking', 'Redis ZSET', 'PostgreSQL']
  },
  {
    id: 'pastebin-snippet',
    title: 'Design Pastebin / Gist (Secure Code Snippet Storage)',
    slug: 'pastebin-architecture',
    tagline: 'Store text and code snippets cheaply, share them by short URL, and delete them when they expire.',
    category: 'Social & Content',
    difficulty: 'Beginner',
    readTime: '14 min read',
    scaleSummary: {
      dau: '10 Million Active Users',
      qps: '15,000 Read QPS / 1,500 Write QPS',
      storage: '3.65 TB / year text storage',
      bandwidth: '150 MB/s Egress / 15 MB/s Ingress'
    },
    overview: 'Pastebin lets developers paste text or source code and get a short URL to share. Pastes can have syntax highlighting, an optional password, and an expiry date. The main design idea is to keep small metadata in a database and the large text body in object storage.',
    keyChallenges: [
      'Storing snippets of up to 10 MB without bloating the relational database.',
      'Deleting millions of expired pastes on time, in the database and in object storage.',
      'Limiting abuse, such as malware hosting, with automated scanning.',
      'Caching popular snippets so a viral paste does not overload storage.'
    ],
    functionalRequirements: [
      'Create and save a paste of up to 10 MB.',
      'Give each paste a unique 8-character URL.',
      'Support expiry times: 10 minutes, 1 hour, 1 day, 1 month, or never.',
      'Optional password protection, and syntax highlighting.',
      'Let registered users edit and delete their pastes.'
    ],
    nonFunctionalRequirements: [
      'Read latency under 25 ms.',
      'Reliability: a paste must not be lost before it expires.',
      'Unpredictable keys, so nobody can find pastes by guessing URLs.'
    ],
    outOfScope: ['Running code online (an IDE playground).', 'Git-style version control and branching.'],
    capacityEstimations: {
      assumptions: [
        '10M daily users; 1M new pastes per day: about 12 writes/s on average and 1,500/s at peak.',
        '10M paste reads per day: about 115 reads/s on average and 15,000/s at peak.',
        'An average paste is 10 KB. The maximum is 10 MB.',
        'Peak bandwidth: 15,000 reads * 10 KB = 150 MB/s out, and 1,500 writes * 10 KB = 15 MB/s in. Storage is one copy, before replication.'
      ],
      metrics: [
        { label: 'Storage Growth', value: '10 GB / day', formula: '1M pastes/day * 10 KB average size', description: 'New data per day in object storage' },
        { label: '5-Year Storage Total', value: '18.25 TB', formula: '10 GB/day * 365 * 5 years', description: 'Total in durable object storage (S3), if nothing expired' }
      ],
      conclusion: 'Keep paste metadata in PostgreSQL or DynamoDB, and keep the snippet text in S3 or MinIO object storage. The totals are small, so the design is about keeping the database lean and cleaning up expired data.'
    },
    architecture: {
      summary: 'Clients call the API Gateway, which forwards to the Paste Service. The service writes the text body to S3 (or MinIO) and the metadata (key, size, owner, expiry) to PostgreSQL. Redis caches popular snippets. A background cleaner removes expired pastes from both stores.',
      nodes: [
        { id: 'client', label: 'Client (Web / CLI / cURL)', type: 'client', x: 8, y: 50, description: 'Submits and reads snippets' },
        { id: 'gateway', label: 'API Gateway', type: 'gateway', x: 28, y: 50, description: 'Rate limits abusive IPs and checks authentication', techStack: ['Envoy'] },
        { id: 'paste_srv', label: 'Paste Service', type: 'service', x: 50, y: 50, description: 'Generates Base62 keys and handles encrypted pastes', techStack: ['Go / Node.js'] },
        { id: 'redis', label: 'Snippet Cache (Redis)', type: 'cache', x: 75, y: 25, description: 'Caches recent and popular pastes', techStack: ['Redis'] },
        { id: 's3', label: 'Object Storage (S3 / Blob)', type: 'storage', x: 75, y: 50, description: 'Durable storage for the paste text', techStack: ['AWS S3 / MinIO'] },
        { id: 'db', label: 'Metadata Database', type: 'database', x: 75, y: 75, description: 'Stores paste_id, user_id, expiry and syntax for each paste', techStack: ['PostgreSQL / DynamoDB'] }
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
        { step: 1, title: 'Create a paste', description: 'The client sends a snippet. The Paste Service creates a Base62 key, writes the text to S3, and inserts a metadata row into the database.', activeNodes: ['client', 'gateway', 'paste_srv', 's3', 'db'], highlightDetails: 'Keeping the text out of the database keeps rows and indexes small. Write the S3 object first. If the database insert then fails, the cleaner can remove the orphan object later.', latencyEstimate: '20ms' },
        { step: 2, title: 'Read a paste', description: 'A user opens https://pastebin.com/k9a8x2. The server checks Redis. On a hit it returns the text. On a miss it loads the text from S3 and stores it in Redis.', activeNodes: ['client', 'gateway', 'paste_srv', 'redis', 's3'], highlightDetails: 'A cache hit avoids the S3 request and is much faster. Check the expiry time before returning any paste.', latencyEstimate: '8ms' }
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
        notes: 'PostgreSQL. A B-tree index on expire_at lets the cleaner find expired pastes quickly.'
      }
    ],
    deepDives: [
      {
        title: 'Why large text should not live in the SQL database',
        subtitle: 'Keep metadata in the database and the body in object storage',
        content: `PostgreSQL stores rows in 8 KB pages. A value larger than about 2 KB is moved out of the row by TOAST (The Oversized-Attribute Storage Technique): PostgreSQL compresses it and stores it in chunks in a separate table. PostgreSQL can hold values up to 1 GB this way, so a 10 MB paste would work. The problem is cost, not a hard limit:\n- The database grows by terabytes of text, which is much more expensive than object storage.\n- Backups, restores and replication have to copy all that text.\n- Reading a large value ties up a database connection while the data streams out.\n- Large rows inflate the write-ahead log (WAL) and the work of vacuuming.\n\nA better split: keep only metadata in PostgreSQL (a few hundred bytes per row) and keep the snippet text in S3 or MinIO, which is built for cheap, durable storage of large objects.`,
        keyTakeaways: [
          'Keep database rows small so the indexes stay compact and cached in memory.',
          'Store large payloads (for example anything over a few tens of KB) in object storage and keep only a pointer in the database.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Millions of expired pastes pile up',
        impact: 'Dead pastes waste storage and make indexes larger.',
        mitigation: 'Run a cleaner job (for example hourly). It finds expired rows by the expire_at index, deletes their S3 objects, then deletes the rows, in small batches (for example 10,000 rows at a time). An S3 lifecycle rule can act as a backup. Lifecycle rules work by object age or tag, in whole days, so they cannot match every custom expiry. Always check expire_at when serving a paste, because cleanup can lag behind.'
      }
    ],
    interviewQA: [
      {
        question: 'How do you handle password-protected pastes safely?',
        hint: 'Never store a plain-text password. Decide whether the server may read the text.',
        goodAnswer: 'There are two options. (1) Server-side check: store only a slow salted hash of the password (bcrypt or Argon2), and check it before returning the paste. This is simple, but the server can still read the text. (2) Client-side encryption: the browser derives an AES-256 key from the password (with PBKDF2 or Argon2) and uploads only ciphertext, so the server cannot read the snippet. The cost is that the server cannot do syntax detection or scanning for abuse on the text, and a forgotten password means the paste is lost. Choose option 2 when users need privacy even from the service.',
        pitfalls: 'Storing passwords in plain text, or in a fast unsalted hash such as plain SHA-256.'
      }
    ],
    similarSystems: ['GitHub Gist', 'Ghostbin', 'Hastebin'],
    tags: ['S3 Object Store', 'Base62', 'TTL Cleanup', 'PostgreSQL', 'Redis']
  }
];
