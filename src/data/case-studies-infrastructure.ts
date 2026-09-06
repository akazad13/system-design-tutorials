import { CaseStudy } from '../types/system-design';

export const INFRASTRUCTURE_CASE_STUDIES: CaseStudy[] = [
  {
    id: 'google-web-crawler',
    title: 'Design Google Web Crawler & Distributed Search Indexer',
    slug: 'google-web-crawler',
    tagline: 'Petabyte-scale distributed web crawler, URL frontier politeness, PageRank, and inverted index construction.',
    category: 'Search & Big Data',
    difficulty: 'Advanced',
    readTime: '26 min read',
    scaleSummary: {
      dau: '5 Billion Daily Searches / 50 Billion Web Pages Indexed',
      qps: '150,000 Search QPS / 50,000 Pages Crawled/sec',
      storage: '250 Petabytes raw HTML and inverted index data',
      bandwidth: '50 GB/s Continuous Ingress'
    },
    overview: 'A distributed web crawler discovers, fetches, and parses billions of web pages from the public internet. It extracts outbound links, feeds them into a prioritized and polite URL Frontier, deduplicates content, and builds an inverted index for Google Search queries.',
    keyChallenges: [
      'Politeness & Rate Limiting: Not crashing external web servers by respecting robots.txt and throttling crawls per domain',
      'URL Frontier Priority & Refresh Cycles: Ensuring high-authority pages (Wikipedia, NYTimes) are recrawled hourly while dead blogs are crawled monthly',
      'Content & URL Deduplication: Detecting duplicate content using SimHash / MinHash across 50 Billion pages',
      'Spider Traps & Infinite Loops: Handling infinite calendar generation pages (e.g. /calendar?year=2026&month=9)'
    ],
    functionalRequirements: [
      'Given seed URLs, crawl the web breadth-first and extract hyperlinks',
      'Parse HTML, extract text, and compute inverted indexes',
      'Respect robots.txt politeness protocols and crawling delays',
      'Deduplicate URLs and duplicate content',
      'Serve full-text search queries ranked by BM25 + PageRank'
    ],
    nonFunctionalRequirements: [
      'High Throughput: Crawl 1 Billion web pages per week (~2,000 pages/sec continuous)',
      'Fault Tolerance: Crawler worker crashes must not lose frontier queue state',
      'Scalability: Easily add new crawler worker nodes to scale ingestion',
      'Search query response time < 200ms at P99'
    ],
    outOfScope: ['Deep web password-protected site crawling', 'Dark web onion network routing'],
    capacityEstimations: {
      assumptions: [
        '50 Billion web pages in global index',
        'Average page HTML size: 500 KB compressed -> 50B * 500 KB = 25 Petabytes raw storage',
        'Crawl rate: 50,000 pages/sec continuous (25 Gbps sustained bandwidth)',
        'Inverted Index: ~5 PB compressed text index across Bigtable / SSDs'
      ],
      metrics: [
        { label: 'Crawl Ingress Bandwidth', value: '25 Gbps', formula: '50,000 pages/sec * 500 KB average size', description: 'Network crawler throughput' },
        { label: 'Indexed Web Pages', value: '50 Billion', formula: 'Global searchable page corpus', description: 'Bigtable storage' },
        { label: 'URL Frontier Queue Size', value: '100 Billion URLs', formula: 'Buffered unvisited hyperlinks', description: 'Distributed disk queues' }
      ],
      conclusion: 'A two-tier URL Frontier (Priority Queues + Politeness Queues per host) is required to prevent DDoS on external websites.'
    },
    architecture: {
      summary: 'Seed URLs -> URL Frontier (Priority & Politeness Queues) -> Distributed Fetcher Workers -> DNS Resolver Cache -> HTML Content Parser -> Content Deduplicator (SimHash) -> Link Extractor -> URL Filter & Deduplicator -> Primary Bigtable / Inverted Indexer.',
      nodes: [
        { id: 'seeds', label: 'Seed URLs & Sitemaps', type: 'service', x: 8, y: 30, description: 'Bootstrap URLs for crawling' },
        { id: 'frontier', label: 'URL Frontier', type: 'queue', x: 28, y: 30, description: 'Prioritizes and enforces politeness delays per domain', techStack: ['Kafka + RocksDB'] },
        { id: 'fetchers', label: 'Distributed Fetcher Workers', type: 'worker', x: 50, y: 30, description: 'Asynchronously downloads web pages', techStack: ['Go / C++ Async HTTP'] },
        { id: 'dns_cache', label: 'Dedicated DNS Cache Cluster', type: 'cache', x: 50, y: 10, description: 'Caches 50M domain IP lookups in RAM', techStack: ['Redis / BIND'] },
        { id: 'parser', label: 'HTML Parser & Text Extractor', type: 'service', x: 72, y: 30, description: 'Extracts text, metadata, and <a> href links', techStack: ['libxml2 / Rust'] },
        { id: 'dedup', label: 'Content Dedup (SimHash)', type: 'search', x: 92, y: 30, description: 'Detects duplicate pages using 64-bit fingerprints', techStack: ['SimHash Index'] },
        { id: 'doc_store', label: 'Raw Page Store (Bigtable)', type: 'storage', x: 92, y: 70, description: 'Stores raw HTML & parsed text', techStack: ['Google Cloud Bigtable / GCS'] },
        { id: 'indexer', label: 'Inverted Index Builder (MapReduce)', type: 'worker', x: 68, y: 70, description: 'Constructs Term -> DocIDs posting lists', techStack: ['MapReduce / Apache Spark'] },
        { id: 'search_engine', label: 'Search Query Engine', type: 'service', x: 35, y: 70, description: 'Evaluates user queries with PageRank', techStack: ['C++ Query Server'] }
      ],
      edges: [
        { id: 'e1', from: 'seeds', to: 'frontier', label: 'Initialize Seeds', protocol: 'Internal RPC' },
        { id: 'e2', from: 'frontier', to: 'fetchers', label: '1. Pop Polite URL', protocol: 'Internal RPC' },
        { id: 'e3', from: 'fetchers', to: 'dns_cache', label: '2. Resolve Host IP', protocol: 'TCP' },
        { id: 'e4', from: 'fetchers', to: 'parser', label: '3. Stream HTML Body', protocol: 'Internal RPC' },
        { id: 'e5', from: 'parser', to: 'dedup', label: '4. Check SimHash', protocol: 'Internal RPC' },
        { id: 'e6', from: 'parser', to: 'frontier', label: '5. Push Discovered URLs', protocol: 'Async Queue', isAsync: true },
        { id: 'e7', from: 'parser', to: 'doc_store', label: '6. Store Page', protocol: 'NoSQL' },
        { id: 'e8', from: 'doc_store', to: 'indexer', label: '7. Batch Indexing', protocol: 'Internal RPC', isAsync: true },
        { id: 'e9', from: 'indexer', to: 'search_engine', label: '8. Load Inverted Index', protocol: 'Internal RPC' }
      ],
      flowSteps: [
        { step: 1, title: 'URL Frontier Politeness Scheduling', description: 'Frontier pops a URL for "nytimes.com". Politeness queue ensures at least 500ms has elapsed since the last fetch from nytimes.com, preventing server overload.', activeNodes: ['frontier', 'fetchers'], highlightDetails: 'Separates Priority (PageRank score) from Politeness (one queue per hostname).', latencyEstimate: '5ms' },
        { step: 2, title: 'High-Speed Async Page Fetching', description: 'Fetcher worker checks local DNS cache (avoiding 50ms DNS lookup) and downloads HTML payload asynchronously over HTTP/2 with a 5-second timeout.', activeNodes: ['fetchers', 'dns_cache'], highlightDetails: 'Handles 50,000 parallel connections per worker server.', latencyEstimate: '120ms' },
        { step: 3, title: 'SimHash Deduplication & Link Extraction', description: 'Parser extracts body text, computes 64-bit SimHash fingerprint, and checks if identical content exists in DB (if Hamming distance <= 3, discard as duplicate). Extracted links are pushed back to URL Frontier.', activeNodes: ['parser', 'dedup', 'frontier', 'doc_store'], highlightDetails: 'Filters out 40% of internet pages as exact or near-duplicate mirrors.', latencyEstimate: '20ms' },
        { step: 4, title: 'Distributed Inverted Index Construction', description: 'MapReduce batch pipeline aggregates all parsed pages into compressed Posting Lists (Word -> [DocID1, DocID2]) sorted by PageRank + BM25 score.', activeNodes: ['doc_store', 'indexer', 'search_engine'], highlightDetails: 'Enables sub-50ms search query lookups across 50 Billion documents.', latencyEstimate: '10 mins (Batch)' }
      ]
    },
    apiDesign: [
      {
        method: 'GET',
        path: '/search?q=distributed+systems&page=1',
        description: 'Execute full-text search across indexed web pages',
        responseBody: '{\n  "total_hits": 48200000,\n  "took_ms": 18,\n  "results": [\n    {\n      "title": "Distributed Computing - Wikipedia",\n      "url": "https://en.wikipedia.org/wiki/Distributed_computing",\n      "snippet": "Distributed computing is a field of computer science...",\n      "pagerank": 0.94\n    }\n  ]\n}'
      }
    ],
    databaseDesign: [
      {
        tableName: 'crawled_documents',
        type: 'Wide-Column',
        shardingKey: 'reverse_domain_url (e.g. com.nytimes.www/tech/article1)',
        fields: [
          { name: 'url_hash', type: 'VARCHAR(64)', isPrimary: true },
          { name: 'original_url', type: 'VARCHAR(2048)' },
          { name: 'simhash', type: 'BIGINT', isIndex: true },
          { name: 'html_compressed_s3', type: 'VARCHAR(512)' },
          { name: 'last_crawled_at', type: 'TIMESTAMP' },
          { name: 'pagerank_score', type: 'FLOAT' }
        ],
        notes: 'Google Cloud Bigtable storing petabytes of parsed web pages with row-key compression.'
      }
    ],
    deepDives: [
      {
        title: 'The URL Frontier: Priority Queues + Politeness Queues Architecture',
        subtitle: 'The two-tiered queue design that makes web crawling polite and efficient',
        content: `A naive FIFO queue crawls millions of links from the first domain it finds (e.g. Wikipedia), resulting in a Denial of Service (DDoS) attack on Wikipedia while starving all other websites.\n\nMercator URL Frontier Two-Tier Design:\n1. Front Queues (Priority / Freshness):\n   - URLs enter F1 to FN priority queues based on PageRank and update frequency.\n   - High PageRank URLs (homepage of CNN) are placed in Top Priority queue.\n2. Back Queues (Politeness / Hostname):\n   - Each distinct hostname (e.g. nytimes.com, github.com) has its own dedicated FIFO Back Queue B1 to BK.\n   - A Host-to-Queue table maps hostnames to active back queues.\n   - A Min-Heap of (QueueID, NextAvailableTime) schedules when each host can be queried next.\n   - When a fetcher is idle, it pops the queue with the earliest NextAvailableTime, fetches 1 page, and pushes NextAvailableTime = Now + Delay (e.g. 500ms) back into the heap.\n\nResult: Strictly 1 request per host at a time, while 10,000 distinct hosts are crawled in parallel!`,
        keyTakeaways: [
          'Front queues determine WHAT to crawl next based on importance.',
          'Back queues determine WHEN to crawl next based on host politeness.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Spider Traps (Infinite Dynamic Calendar URLs)',
        impact: 'A website with /calendar?year=2026&month=9 links to next month forever, causing crawler to download 10M useless pages.',
        mitigation: 'Implement URL path length caps, maximum URL parameter depth filters, and per-domain page count caps.'
      }
    ],
    interviewQA: [
      {
        question: 'How do you detect near-duplicate web pages (e.g., same article with different ads/timestamps)?',
        hint: 'SimHash and Locality-Sensitive Hashing (LSH).',
        goodAnswer: 'Compute a 64-bit SimHash fingerprint of the page text (tokens weighted by TF-IDF). Near-duplicate pages produce fingerprints that differ by only 1 to 3 bits (Hamming Distance <= 3). We index 64-bit hashes into 4 tables of 16-bit blocks to find matching fingerprints in O(1) time.',
        pitfalls: 'Using MD5 or SHA-256 (cryptographic hashes change completely even if 1 character changes).'
      }
    ],
    similarSystems: ['Bing Web Crawler', 'Common Crawl', 'Apache Nutch', 'Googlebot'],
    tags: ['URL Frontier', 'SimHash', 'Bigtable', 'MapReduce', 'Inverted Index']
  },
  {
    id: 'google-drive-dropbox',
    title: 'Design Google Drive / Dropbox (File Sync & Deduplication)',
    slug: 'google-drive-sync',
    tagline: 'Cross-device file synchronization, 4MB block chunking, rolling checksum deduplication, and metadata concurrency.',
    category: 'Storage & Infrastructure',
    difficulty: 'Advanced',
    readTime: '24 min read',
    scaleSummary: {
      dau: '500 Million Active Users',
      qps: '100,000 Sync QPS / 200,000 File Chunk Uploads/sec',
      storage: '100 Petabytes user files in S3',
      bandwidth: '40 GB/s Ingress & Egress'
    },
    overview: 'A cloud file storage and synchronization service allows users to upload, edit, and access files from desktops, mobiles, and browsers. The system synchronizes delta changes across devices with minimal bandwidth using 4MB chunking, rolling hashes, and content-addressable storage.',
    keyChallenges: [
      'Delta Sync Algorithm: If a user modifies 1 sentence in a 2GB PDF, sync only the modified 4MB block, not the entire 2GB file',
      'Cross-User Deduplication: If 100,000 users save the same 1GB installer file, store it ONCE in S3 (Content-Addressable Storage)',
      'Concurrent Edit Conflicts: Handling two offline devices editing the same document simultaneously',
      'Real-Time Desktop Client Notification: Pushing sync events down long-lived WebSocket/HTTP long-poll channels'
    ],
    functionalRequirements: [
      'Upload, download, and delete files/folders',
      'Automatic cross-device background file synchronization',
      'Chunk-level delta sync (upload only modified blocks)',
      'File version history with 30-day restore',
      'File sharing and folder permission management'
    ],
    nonFunctionalRequirements: [
      'Zero Data Loss: 99.999999999% (11 9s) file durability',
      'Fast Sync Latency: Local edit synced to other devices in < 3 seconds',
      'Bandwidth Optimization: Extreme deduplication and compression',
      'High Availability: 99.99% for API and sync servers'
    ],
    outOfScope: ['Live multi-cursor collaborative document editing (Google Docs)'],
    capacityEstimations: {
      assumptions: [
        '500M users; 100M daily active users syncing files',
        'Average user edits 5 files/day; Average file size: 10 MB (divided into 4MB chunks)',
        'Storage: 500M * average 2 GB stored = 1 Exabyte (reduced to ~100 Petabytes after deduplication)'
      ],
      metrics: [
        { label: 'Chunk Upload Rate', value: '200,000 chunks/s', formula: 'Peak 4MB delta chunk uploads', description: 'Object Storage Ingress' },
        { label: 'Metadata QPS', value: '100,000 QPS', formula: 'Sync status and directory tree updates', description: 'PostgreSQL Metadata DB' },
        { label: 'Deduplication Ratio', value: '60% Savings', formula: 'Hash-based Content-Addressable Storage', description: 'Storage cost reduction' }
      ],
      conclusion: 'Separating metadata (PostgreSQL) from binary chunks (S3/Content-Addressable Store) is mandatory.'
    },
    architecture: {
      summary: 'Desktop Client watches local filesystem (FSEvents/inotify) -> Splits file into 4MB chunks -> Hashes chunks with SHA-256 -> Calls Metadata DB to check which hashes exist -> Uploads ONLY missing chunks directly to S3 -> Commits new file version in PostgreSQL -> Sync Service broadcasts update to client other devices.',
      nodes: [
        { id: 'client_laptop', label: 'Desktop Client (Mac/PC)', type: 'client', x: 8, y: 30, description: 'Runs local Chunking & Sync Engine' },
        { id: 'client_phone', label: 'Mobile App', type: 'client', x: 8, y: 70, description: 'Receives real-time sync notification' },
        { id: 'gateway', label: 'API & Sync Gateway', type: 'gateway', x: 30, y: 50, description: 'Routes chunk verification and sync sockets', techStack: ['Envoy / Go'] },
        { id: 'sync_srv', label: 'Sync & Conflict Service', type: 'service', x: 55, y: 30, description: 'Manages file versions and commit sequences', techStack: ['Rust / Go'] },
        { id: 'meta_db', label: 'File Metadata Store', type: 'database', x: 80, y: 30, description: 'Directory trees, chunk maps, user quotas', techStack: ['PostgreSQL (Sharded)'] },
        { id: 'block_store', label: 'Chunk Storage (S3 / CAS)', type: 'storage', x: 80, y: 70, description: 'Stores immutable 4MB chunks named by SHA-256', techStack: ['AWS S3 Standard'] },
        { id: 'notify_srv', label: 'Sync Notification Gateway', type: 'worker', x: 55, y: 70, description: 'Pushes sync events down WebSockets', techStack: ['Redis Pub/Sub + WebSockets'] }
      ],
      edges: [
        { id: 'e1', from: 'client_laptop', to: 'gateway', label: '1. POST /sync/check_hashes', protocol: 'HTTPS' },
        { id: 'e2', from: 'gateway', to: 'sync_srv', label: '2. Verify Missing Hashes', protocol: 'Internal RPC' },
        { id: 'e3', from: 'sync_srv', to: 'meta_db', label: '3. Query Chunk Registry', protocol: 'SQL' },
        { id: 'e4', from: 'client_laptop', to: 'block_store', label: '4. Upload Missing 4MB Chunk', protocol: 'HTTPS' },
        { id: 'e5', from: 'client_laptop', to: 'sync_srv', label: '5. Commit Version [H1, H2_new, H3]', protocol: 'HTTPS' },
        { id: 'e6', from: 'sync_srv', to: 'meta_db', label: '6. Update File Tree Version', protocol: 'SQL' },
        { id: 'e7', from: 'sync_srv', to: 'notify_srv', label: '7. Publish FileChanged Event', protocol: 'Async Queue', isAsync: true },
        { id: 'e8', from: 'notify_srv', to: 'client_phone', label: '8. Push "Download Chunk H2_new"', protocol: 'WebSocket' }
      ],
      flowSteps: [
        { step: 1, title: 'Local File Change Detection & Chunking', description: 'User edits presentation.pptx. Desktop client splits 40MB file into ten 4MB chunks and calculates SHA-256 hash for each chunk [H1, H2... H10].', activeNodes: ['client_laptop'], highlightDetails: 'Only Chunk #4 hash changed; remaining 9 chunks are untouched.', latencyEstimate: '15ms' },
        { step: 2, title: 'Hash Registry Verification & Deduplication', description: 'Client sends list of 10 hashes to Sync Service. Server checks database: 9 chunks already exist in S3. Server responds: "Upload only Chunk #4 (H4_new)".', activeNodes: ['client_laptop', 'gateway', 'sync_srv', 'meta_db'], highlightDetails: 'Saves 90% upload bandwidth and S3 storage cost.', latencyEstimate: '25ms' },
        { step: 3, title: 'Direct Chunk Upload to S3', description: 'Client uploads the single 4MB chunk directly to S3 with key = SHA256(H4_new).', activeNodes: ['client_laptop', 'block_store'], highlightDetails: 'Content-Addressable Storage guarantees immutable deduplication.', latencyEstimate: '350ms' },
        { step: 4, title: 'Atomic Version Commit & Real-Time Sync Push', description: 'Sync Service creates Version 2 pointing to [H1, H2, H3, H4_new, H5... H10] in PostgreSQL and emits notification to all user connected devices to fetch H4_new.', activeNodes: ['sync_srv', 'meta_db', 'notify_srv', 'client_phone'], highlightDetails: 'Mobile app downloads only the single 4MB delta chunk in < 1 second.', latencyEstimate: '200ms' }
      ]
    },
    apiDesign: [
      {
        method: 'POST',
        path: '/api/v1/files/verify-chunks',
        description: 'Check which chunk hashes already exist on server',
        requestBody: '{\n  "file_id": "fl_9821",\n  "chunk_hashes": ["a8f9...", "b2c1...", "c3d4..."]\n}',
        responseBody: '{\n  "missing_chunks": ["b2c1..."],\n  "upload_urls": { "b2c1...": "https://s3.../b2c1..." }\n}'
      }
    ],
    databaseDesign: [
      {
        tableName: 'file_versions',
        type: 'SQL',
        shardingKey: 'file_id',
        fields: [
          { name: 'file_id', type: 'UUID', isPrimary: true },
          { name: 'version', type: 'INT', isPrimary: true },
          { name: 'chunk_hashes', type: 'JSONB', notes: 'Ordered array of 4MB SHA-256 chunk keys' },
          { name: 'size_bytes', type: 'BIGINT' },
          { name: 'updated_at', type: 'TIMESTAMP' }
        ],
        notes: 'PostgreSQL table maintaining immutable history of file chunk mappings.'
      }
    ],
    deepDives: [
      {
        title: 'Conflict Resolution: Handling Concurrent Edits Across Multiple Devices',
        subtitle: 'How Dropbox resolves simultaneous offline file modifications without data loss',
        content: `Scenario: User edits "report.docx" on Laptop while on an airplane (offline). Simultaneously, User edits "report.docx" on Office Desktop.\n\nWhen Laptop connects to Wi-Fi:\n1. Laptop attempts to commit Version 3 based on base Version 2.\n2. Server checks Metadata DB: Office Desktop already committed Version 3 based on Version 2 (Optimistic Concurrency Check).\n3. Conflict Resolution Policy:\n   - Server commits Laptop changes as a branched conflict file: "report (User's conflicted copy 2026-08-28).docx".\n   - Both versions are preserved in full; zero user data is ever overwritten or lost!\n   - Desktop client displays a subtle notification explaining the conflicted copy creation.`,
        keyTakeaways: [
          'Optimistic concurrency control with base_version checks prevents silent overwrites.',
          'Creating conflicted copies is the battle-tested standard for binary file conflicts.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'S3 Garbage Collection of Orphaned Chunks',
        impact: 'When users delete old file versions, reference counts on shared chunks must be managed to avoid deleting chunks still used by other files.',
        mitigation: 'Maintain a Chunk Reference Count Table: Increment ref_count when a file references a chunk hash; decrement when deleted. Only delete from S3 when ref_count == 0 via asynchronous background Sweeper.'
      }
    ],
    interviewQA: [
      {
        question: 'Why fixed-size 4MB chunking vs variable-size content-defined chunking (Rabin Fingerprinting)?',
        hint: 'Inserting 1 byte at the start of a file shifts all subsequent fixed 4MB boundaries.',
        goodAnswer: 'In fixed-size chunking, inserting 1 byte at byte 0 shifts all chunk boundaries, invalidating all subsequent chunk hashes. Advanced sync engines (Dropbox) use Content-Defined Chunking (CDC via Rabin Fingerprints / FastCDC) where chunk boundaries are determined by byte content patterns, keeping unchanged chunks identical even after inserts.',
        pitfalls: 'Assuming fixed-size chunking is optimal for all text file insert scenarios.'
      }
    ],
    similarSystems: ['Dropbox', 'Box', 'OneDrive', 'iCloud Drive'],
    tags: ['Chunking', 'Deduplication', 'Content-Addressable Storage', 'S3', 'Delta Sync']
  },
  {
    id: 'distributed-rate-limiter',
    title: 'Design a Distributed Rate Limiter Service',
    slug: 'distributed-rate-limiter',
    tagline: 'High-throughput, low-latency API traffic throttling, Redis sliding window counters, and edge token bucket proxies.',
    category: 'Storage & Infrastructure',
    difficulty: 'Intermediate',
    readTime: '18 min read',
    scaleSummary: {
      dau: '10 Billion API Requests / day',
      qps: '1,000,000 Requests/sec peak rate limiting checks',
      storage: '50 GB Redis in-memory sliding window counters',
      bandwidth: '5 GB/s Network Filter'
    },
    overview: 'A distributed rate limiter protects backend services from DDoS attacks, API abuse, brute-force login attempts, and resource exhaustion by throttling requests based on IP address, User ID, or API Key with sub-millisecond overhead.',
    keyChallenges: [
      'Sub-Millisecond Evaluation: Rate check must execute in < 2ms without becoming the bottleneck for the entire infrastructure',
      'Race Conditions in Distributed Clusters: Preventing 10 concurrent requests from bypassing rate limits during read-update-write cycles',
      'Memory Efficiency: Tracking limits for 100M active client keys without consuming terabytes of RAM',
      'Fail-Open vs Fail-Closed Strategy: Deciding whether to allow traffic if the rate limiter Redis cluster crashes'
    ],
    functionalRequirements: [
      'Limit API calls by IP, User ID, or API Token (e.g. 100 requests per minute)',
      'Return standard HTTP 429 Too Many Requests with Retry-After headers',
      'Support configurable tiers (Free: 60 req/min, Pro: 10,000 req/min)',
      'Support burst allowances (Token Bucket) and smooth traffic (Leaky Bucket)'
    ],
    nonFunctionalRequirements: [
      'Ultra Low Latency: Rate check latency < 1ms at P99',
      'High Availability 99.999%',
      'Minimal Memory Footprint per rate limited entity (< 32 bytes)'
    ],
    outOfScope: ['Web Application Firewall (WAF) SQL Injection payload inspection'],
    capacityEstimations: {
      assumptions: [
        '1 Million QPS peak API requests evaluated',
        '100 Million active users/tokens tracked concurrently',
        'Memory per key using Sliding Window Counter: 32 bytes (2 integer counters in Redis)'
      ],
      metrics: [
        { label: 'Evaluation QPS', value: '1,000,000 QPS', formula: 'Peak global gateway traffic', description: 'Redis Cluster throughput' },
        { label: 'Total Redis RAM', value: '3.2 GB RAM', formula: '100M keys * 32 bytes', description: 'Memory for all rate limit counters' }
      ],
      conclusion: 'A 10-node Redis Cluster running atomic Lua scripts evaluates 1M checks/sec effortlessly.'
    },
    architecture: {
      summary: 'Incoming request arrives at API Gateway -> Rate Limiter Filter executes atomic Lua script against nearest Redis Cluster -> If allowed, proxies to Backend Microservice; If exceeded, immediately returns HTTP 429.',
      nodes: [
        { id: 'client', label: 'API Consumer', type: 'client', x: 8, y: 50, description: 'Sends HTTP requests with API key' },
        { id: 'gateway', label: 'API Gateway (Envoy / Kong)', type: 'gateway', x: 35, y: 50, description: 'Runs rate limit filter middleware', techStack: ['Envoy / Nginx'] },
        { id: 'local_cache', label: 'Local Memory Tier (Caffeine)', type: 'cache', x: 35, y: 15, description: 'Blocks banned IPs locally for 60s', techStack: ['In-Memory RAM'] },
        { id: 'redis_cluster', label: 'Redis Rate Limiter Cluster', type: 'cache', x: 65, y: 50, description: 'Stores sliding window counters', techStack: ['Redis 7 Cluster'], scaleMetric: 'Sub-millisecond Lua script' },
        { id: 'backend', label: 'Protected Backend Service', type: 'service', x: 92, y: 50, description: 'Core application business logic', techStack: ['Microservices'] }
      ],
      edges: [
        { id: 'e1', from: 'client', to: 'gateway', label: '1. GET /api/v1/resource', protocol: 'HTTPS' },
        { id: 'e2', from: 'gateway', to: 'local_cache', label: '2. Check Local Blacklist', protocol: 'Internal RPC' },
        { id: 'e3', from: 'gateway', to: 'redis_cluster', label: '3. Eval Lua Script (Redis)', protocol: 'TCP' },
        { id: 'e4', from: 'gateway', to: 'backend', label: '4. If Allowed: Forward Request', protocol: 'Internal RPC' },
        { id: 'e5', from: 'gateway', to: 'client', label: 'If Exceeded: HTTP 429', protocol: 'HTTPS' }
      ],
      flowSteps: [
        { step: 1, title: 'Request Interception at Gateway', description: 'API Gateway extracts identifier (e.g. rate_limit:user_42) and checks local memory cache for active ban.', activeNodes: ['client', 'gateway', 'local_cache'], highlightDetails: 'Bypasses Redis network hop for repeat abusive attackers.', latencyEstimate: '0.1ms' },
        { step: 2, title: 'Atomic Redis Sliding Window Counter', description: 'Gateway executes Lua script in Redis: calculates weighted average of requests in current and previous minute window. If under limit, increments counter and returns 1 (Allowed).', activeNodes: ['gateway', 'redis_cluster'], highlightDetails: 'Atomic execution avoids race conditions in 1 network roundtrip.', latencyEstimate: '0.8ms' },
        { step: 3, title: 'Response Headers & Gateway Routing', description: 'Gateway attaches X-RateLimit-Remaining: 42 and forwards request to backend microservice.', activeNodes: ['gateway', 'backend'], highlightDetails: 'If rejected, returns 429 Too Many Requests with Retry-After: 12.', latencyEstimate: '0.1ms' }
      ]
    },
    apiDesign: [
      {
        method: 'GET',
        path: '/api/v1/data',
        description: 'Standard rate limited endpoint',
        headers: ['X-RateLimit-Limit: 100', 'X-RateLimit-Remaining: 84', 'X-RateLimit-Reset: 1724000060'],
        responseBody: '{\n  "data": "Success"\n}'
      }
    ],
    databaseDesign: [
      {
        tableName: 'rate_limit_rules',
        type: 'SQL',
        shardingKey: 'tier_name',
        fields: [
          { name: 'tier_name', type: 'VARCHAR(32)', isPrimary: true },
          { name: 'max_requests_per_minute', type: 'INT' },
          { name: 'burst_capacity', type: 'INT' }
        ],
        notes: 'Cached in API Gateway memory for zero DB latency lookups.'
      }
    ],
    deepDives: [
      {
        title: 'Sliding Window Counter Algorithm: The Optimal Memory-Accuracy Balance',
        subtitle: 'Why Sliding Window Counter beats Fixed Window and Sliding Window Log',
        content: `Comparison of Rate Limiting Algorithms:\n1. Fixed Window: 100 req/min. If user sends 100 requests at 00:59 and 100 requests at 01:01, 200 requests pass in a 2-second interval (2x traffic spike!).\n2. Sliding Window Log (Redis ZSET): Stores timestamps of every request. Extremely accurate, but memory is O(N) requests (100k requests consume megabytes of RAM).\n3. Sliding Window Counter (Cloudflare / Stripe Standard):\n   - Stores only 2 counters: Previous Window Count and Current Window Count.\n   - Formula: Requests = (Previous_Count * (1 - % of current window elapsed)) + Current_Count.\n   - Memory is strictly O(1) (~32 bytes per key) with 99.9% smoothing accuracy!`,
        keyTakeaways: [
          'Sliding Window Counter uses 95% less RAM than Sliding Window Log.',
          'Completely eliminates boundary burst vulnerabilities.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Redis Rate Limiter Cluster Outage',
        impact: 'If Redis cluster fails, does the entire company website crash?',
        mitigation: 'Fail-Open Policy: If Redis network timeout occurs (> 5ms), log an alert and let the request proceed to avoid taking down critical customer traffic.'
      }
    ],
    interviewQA: [
      {
        question: 'How do you handle rate limiting across multiple global cloud regions (US, EU, Asia)?',
        hint: 'Cross-region synchronization latency.',
        goodAnswer: 'Instead of syncing every counter cross-region (which adds 150ms WAN latency), use Local Regional Rate Limiters with partitioned quotas (e.g. if global limit is 1,000 req/min, assign 400 to US, 400 to EU, 200 to Asia) with periodic asynchronous batch synchronization.',
        pitfalls: 'Calling a single central US Redis instance from European servers on every request.'
      }
    ],
    similarSystems: ['Cloudflare Rate Limiting', 'Kong Rate Limiter', 'AWS WAF', 'Envoy Ratelimit'],
    tags: ['Redis Lua', 'Sliding Window Counter', 'Token Bucket', 'API Gateway', 'Envoy']
  },
  {
    id: 'notification-system',
    title: 'Design a Scalable Distributed Notification System',
    slug: 'notification-platform',
    tagline: 'Multi-channel alert routing (APNs, FCM, SMS, Email), priority queues, rate limits, and batch digest engines.',
    category: 'Storage & Infrastructure',
    difficulty: 'Intermediate',
    readTime: '20 min read',
    scaleSummary: {
      dau: '1 Billion Notifications / day',
      qps: '50,000 Alerts/sec peak ingestion',
      storage: '20 TB / year notification log and user preferences',
      bandwidth: '10 GB/s Network Egress'
    },
    overview: 'A central notification platform routes transactional and promotional alerts across iOS Push (Apple APNs), Android Push (Google FCM), SMS (Twilio), and Email (SendGrid/SES). The system handles user preferences, deduplication, rate limiting, and batch digests.',
    keyChallenges: [
      'Multi-Channel Provider Abstraction: Handling varying latency and failure modes of third-party vendors (APNs, FCM, Twilio, SendGrid)',
      'User Preference & Do-Not-Disturb (DND) Enforcement: Suppressing non-critical alerts during user quiet hours',
      'Notification Batching & Digesting: Aggregating "Alice liked your post, Bob liked your post..." into a single digest alert',
      'Priority Queue Routing: Ensuring OTP verification codes are delivered in < 2 seconds while marketing newsletters are throttled'
    ],
    functionalRequirements: [
      'Send alerts across Push, SMS, Email, and In-App notification center',
      'Support Priority levels (Critical OTP vs Marketing Broadcast)',
      'Enforce user channel preferences and unsubscribe settings',
      'Notification batching / digest window (e.g. group likes every 15 minutes)',
      'Track delivery, open, and bounce receipts'
    ],
    nonFunctionalRequirements: [
      'Critical OTP delivery latency < 3 seconds (P99)',
      'High Reliability: Zero lost transactional notifications',
      'Scalable to 1 Billion messages per day',
      'Rate limiting to prevent spamming users'
    ],
    outOfScope: ['Rich marketing email HTML drag-and-drop template designer'],
    capacityEstimations: {
      assumptions: [
        '1 Billion notifications/day (~11,600 /sec avg, 50,000 peak QPS)',
        'Breakdown: 70% Push (APNs/FCM), 20% In-App, 8% Email, 2% SMS',
        'Average notification payload: 500 bytes'
      ],
      metrics: [
        { label: 'Ingestion QPS', value: '50,000 / sec', formula: 'Peak notification triggers', description: 'Kafka topic ingestion' },
        { label: 'Push Delivery Rate', value: '35,000 push/sec', formula: 'Concurrent APNs/FCM HTTP/2 streams', description: 'Push Worker Fleet' }
      ],
      conclusion: 'Dedicated Kafka priority topics per channel prevent slow email queues from stalling critical SMS OTP codes.'
    },
    architecture: {
      summary: 'Internal Services trigger notification API -> Notification Service checks user preferences in Redis/DB -> Routes to Kafka Priority Topics (High/Med/Low) -> Channel Workers (Push, SMS, Email) execute HTTP/2 calls to APNs, FCM, Twilio, SendGrid -> Logs delivery status to Cassandra.',
      nodes: [
        { id: 'services', label: 'Internal Microservices', type: 'service', x: 8, y: 50, description: 'Order, Auth, and Social services trigger alerts' },
        { id: 'gateway', label: 'Notification API Service', type: 'service', x: 30, y: 50, description: 'Validates payload & deduplicates events', techStack: ['Go / Node.js'] },
        { id: 'pref_cache', label: 'User Preferences (Redis)', type: 'cache', x: 30, y: 15, description: 'Opt-in channels, DND hours, device tokens', techStack: ['Redis'] },
        { id: 'kafka_high', label: 'High Priority Queue (OTP)', type: 'queue', x: 55, y: 25, description: 'Zero lag queue for auth codes & fraud alerts', techStack: ['Kafka'] },
        { id: 'kafka_low', label: 'Low Priority Queue (Marketing)', type: 'queue', x: 55, y: 75, description: 'Batched marketing & promotional stream', techStack: ['Kafka'] },
        { id: 'push_workers', label: 'Push Workers (APNs/FCM)', type: 'worker', x: 80, y: 20, description: 'Maintains HTTP/2 connection pool to Apple/Google', techStack: ['Go Workers'] },
        { id: 'sms_workers', label: 'SMS Workers (Twilio)', type: 'worker', x: 80, y: 50, description: 'Dispatches SMS via carrier aggregators', techStack: ['Twilio API'] },
        { id: 'email_workers', label: 'Email Workers (SES/SendGrid)', type: 'worker', x: 80, y: 80, description: 'Renders templates & sends SMTP/API emails', techStack: ['AWS SES'] }
      ],
      edges: [
        { id: 'e1', from: 'services', to: 'gateway', label: '1. Trigger Alert', protocol: 'Internal RPC' },
        { id: 'e2', from: 'gateway', to: 'pref_cache', label: '2. Check User Preferences', protocol: 'TCP' },
        { id: 'e3', from: 'gateway', to: 'kafka_high', label: '3. Enqueue High Priority', protocol: 'Async Queue', isAsync: true },
        { id: 'e4', from: 'gateway', to: 'kafka_low', label: '3. Enqueue Low Priority', protocol: 'Async Queue', isAsync: true },
        { id: 'e5', from: 'kafka_high', to: 'push_workers', label: '4. Consume Push Job', protocol: 'Internal RPC', isAsync: true },
        { id: 'e6', from: 'kafka_high', to: 'sms_workers', label: '4. Consume SMS Job', protocol: 'Internal RPC', isAsync: true },
        { id: 'e7', from: 'kafka_low', to: 'email_workers', label: '4. Consume Email Job', protocol: 'Internal RPC', isAsync: true }
      ],
      flowSteps: [
        { step: 1, title: 'Notification Ingestion & Deduplication', description: 'Auth Service sends OTP alert. Notification Service checks Redis for identical notification_fingerprint in last 60 seconds (prevents duplicate sends).', activeNodes: ['services', 'gateway'], highlightDetails: 'Deduplication window avoids accidental double-charges on SMS.', latencyEstimate: '5ms' },
        { step: 2, title: 'Preference Check & Channel Routing', description: 'Checks user settings in Redis: user enabled Push + SMS, DND disabled. Routes OTP to High Priority Kafka Topic.', activeNodes: ['gateway', 'pref_cache', 'kafka_high'], highlightDetails: 'Sub-millisecond preference evaluation.', latencyEstimate: '3ms' },
        { step: 3, title: 'Direct APNs/FCM HTTP/2 Execution', description: 'Push Worker pulls job and streams payload over persistent TLS HTTP/2 connection to Apple APNs server in < 100ms.', activeNodes: ['kafka_high', 'push_workers'], highlightDetails: 'Persistent HTTP/2 multiplexing eliminates handshake overhead.', latencyEstimate: '150ms' }
      ]
    },
    apiDesign: [
      {
        method: 'POST',
        path: '/api/v1/notifications/send',
        description: 'Trigger notification to a user',
        requestBody: '{\n  "recipient_id": "usr_9921",\n  "template_id": "otp_verification",\n  "priority": "HIGH",\n  "params": { "code": "849201" }\n}',
        responseBody: '{\n  "notification_id": "notif_88192",\n  "status": "QUEUED"\n}'
      }
    ],
    databaseDesign: [
      {
        tableName: 'user_device_tokens',
        type: 'SQL',
        shardingKey: 'user_id',
        fields: [
          { name: 'user_id', type: 'UUID', isPrimary: true },
          { name: 'device_token', type: 'VARCHAR(255)', isPrimary: true },
          { name: 'platform', type: 'VARCHAR(10)', notes: 'IOS, ANDROID, WEB' },
          { name: 'last_active_at', type: 'TIMESTAMP' }
        ],
        notes: 'PostgreSQL table indexing mobile push registration tokens.'
      }
    ],
    deepDives: [
      {
        title: 'Notification Digesting & Debouncing Engine',
        subtitle: 'Turning 50 separate "liked your post" alerts into 1 summary notification',
        content: `When a viral post gets 500 likes in 10 minutes, sending 500 individual push notifications causes users to uninstall the application.\n\nDigest Aggregation Architecture:\n1. When a social event occurs, do not dispatch push immediately. Push the event into a Redis Sorted Set keyed by user_id and post_id.\n2. Set a delayed timer (e.g. 5 minutes) via Kafka Delayed Message or Redis Expiration.\n3. When timer fires, worker pops all events from Redis ZSET: Count = 42 likes.\n4. Renders single template: "Alice and 41 others liked your photo" and sends 1 push notification!`,
        keyTakeaways: [
          'Reduces notification volume by 80% while improving user engagement.',
          'Redis ZSET provides atomic aggregation per user.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Apple APNs / Google FCM Outage or Rate Limit',
        impact: 'Third-party push vendor rejects requests with HTTP 429 or 503 errors.',
        mitigation: 'Implement Dead-Letter Queues (DLQ) with Exponential Backoff + Jitter retries, and fallback to SMS channel for critical OTP codes after 20 seconds.'
      }
    ],
    interviewQA: [
      {
        question: 'How do you prevent sending marketing push notifications in the middle of the night (User Timezone DND)?',
        hint: 'Timezone-aware scheduling.',
        goodAnswer: 'Store the user local timezone in their profile. When a marketing campaign is scheduled for 10:00 AM, calculate the delivery UTC timestamp per user: Target_UTC = 10:00 AM - User_Timezone_Offset, and schedule the delivery job in a partitioned time-bucket queue.',
        pitfalls: 'Blasting all global users at 10:00 AM PST simultaneously.'
      }
    ],
    similarSystems: ['Braze', 'OneSignal', 'Airship', 'AWS Pinpoint'],
    tags: ['APNs/FCM', 'Priority Queues', 'Kafka', 'Notification Digest', 'Twilio']
  },
  {
    id: 'snowflake-id-generator',
    title: 'Design a Distributed Unique ID Generator (Twitter Snowflake)',
    slug: 'distributed-id-generator',
    tagline: 'Generating 64-bit globally unique, time-sortable, k-ordered IDs at 1,000,000 IDs/sec with zero database coordination.',
    category: 'Storage & Infrastructure',
    difficulty: 'Intermediate',
    readTime: '16 min read',
    scaleSummary: {
      dau: '10 Billion IDs generated / day',
      qps: '1,000,000 IDs/sec peak generation throughput',
      storage: '64-bit integer format (8 bytes per ID)',
      bandwidth: '8 MB/s Network Payload'
    },
    overview: 'A distributed ID generator produces 64-bit unique identifiers across hundreds of distributed server instances. The IDs must be naturally time-sortable (k-sorted), high performance, and fit into standard 64-bit integer database primary keys (BIGINT).',
    keyChallenges: [
      'Zero Database Write Locks: Generating IDs without relying on centralized database auto-increment locks',
      'Time-Ordered Property: IDs generated at time t2 must be numerically larger than IDs generated at t1',
      'Clock Drift & NTP Leap Seconds: Handling server system clock moving backward without producing duplicate IDs',
      'Worker Node ID Allocation: Assigning unique 10-bit machine IDs across autoscaling cloud container clusters'
    ],
    functionalRequirements: [
      'Generate 64-bit globally unique integer IDs',
      'IDs must be roughly time-sortable by creation timestamp',
      'Support up to 10,000 independent worker generator nodes',
      'Generate > 1,000,000 unique IDs per second across cluster'
    ],
    nonFunctionalRequirements: [
      'Sub-microsecond generation latency (< 1 microsecond in-memory)',
      'High Availability 99.999% (zero single points of failure)',
      'Id compactness: exactly 64 bits (fits in SQL BIGINT)'
    ],
    outOfScope: ['UUIDv4 128-bit random string formatting'],
    capacityEstimations: {
      assumptions: [
        '10 Billion IDs created daily (~115,000 IDs/sec avg, 1M peak IDs/sec)',
        '64-bit integer size = 8 bytes'
      ],
      metrics: [
        { label: 'Max ID Generation Rate', value: '4,096,000 IDs/ms', formula: '1,024 nodes * 4,096 sequence numbers per ms', description: 'Theoretical Snowflake limit' },
        { label: 'Lifetime Span', value: '69.7 Years', formula: '41 bits = 2^41 milliseconds', description: 'Epoch lifespan before overflow' }
      ],
      conclusion: 'The 64-bit Snowflake format easily satisfies decades of high-concurrency scaling.'
    },
    architecture: {
      summary: 'Snowflake structure: 1 bit sign + 41 bits millisecond timestamp + 10 bits machine/datacenter ID + 12 bits sequence number. Machine IDs are assigned via ZooKeeper/etcd leases on startup.',
      nodes: [
        { id: 'client', label: 'App Services', type: 'service', x: 10, y: 50, description: 'Calls local embedded Snowflake generator' },
        { id: 'snowflake_node', label: 'Snowflake Worker Instance', type: 'worker', x: 45, y: 50, description: 'Bit-shifts timestamp and sequence in memory', techStack: ['Go / Rust / Java'] },
        { id: 'zookeeper', label: 'Worker ID Coordinator', type: 'database', x: 80, y: 50, description: 'Maintains 10-bit worker ID leases (0-1023)', techStack: ['ZooKeeper / etcd'] }
      ],
      edges: [
        { id: 'e1', from: 'snowflake_node', to: 'zookeeper', label: 'Acquire Worker ID (e.g. Node 42)', protocol: 'Internal RPC' },
        { id: 'e2', from: 'client', to: 'snowflake_node', label: 'Generate ID (0.001ms)', protocol: 'Internal RPC' }
      ],
      flowSteps: [
        { step: 1, title: 'Worker Node ID Assignment', description: 'On startup, the worker creates an ephemeral sequential node in ZooKeeper to acquire a unique 10-bit machine ID (e.g. Machine 105).', activeNodes: ['snowflake_node', 'zookeeper'], highlightDetails: 'Guarantees no two servers share the same machine ID.', latencyEstimate: '20ms (Startup only)' },
        { step: 2, title: 'In-Memory Bitwise Generation', description: 'Application requests ID. Worker reads current Unix millisecond timestamp, increments local 12-bit sequence number (0-4095), and combines them using bitwise OR: (Timestamp << 22) | (MachineID << 12) | Sequence.', activeNodes: ['snowflake_node', 'client'], highlightDetails: 'Executes in CPU registers in under 50 nanoseconds.', latencyEstimate: '< 0.001ms' }
      ]
    },
    apiDesign: [
      {
        method: 'GET',
        path: '/api/v1/id',
        description: 'Get next unique 64-bit Snowflake ID',
        responseBody: '{\n  "id": "189283748291039485",\n  "timestamp": 1724000000123,\n  "machine_id": 42\n}'
      }
    ],
    databaseDesign: [
      {
        tableName: 'snowflake_allocations',
        type: 'SQL',
        shardingKey: 'machine_id',
        fields: [
          { name: 'machine_id', type: 'INT', isPrimary: true },
          { name: 'pod_ip', type: 'VARCHAR(45)' },
          { name: 'lease_expires_at', type: 'TIMESTAMP' }
        ],
        notes: 'Worker ID lease registry in etcd or PostgreSQL.'
      }
    ],
    deepDives: [
      {
        title: 'Clock Drift & Backward NTP Adjustments: The Snowflake Failure Mode',
        subtitle: 'What happens when server clock moves backward by 10 milliseconds?',
        content: `If a server clock is adjusted backward by NTP (Network Time Protocol), the worker might generate timestamp T which it already used 5ms ago, producing duplicate IDs!\n\nDefenses:\n1. Clock Backward Check: On every ID generation, if (current_timestamp < last_timestamp):\n   - If drift is < 5ms: Sleep/spin-wait for (last_timestamp - current_timestamp) until clock catches up.\n   - If drift is > 5ms: Refuse to generate IDs, raise an alert, or request a new Worker Machine ID from ZooKeeper to change the 10-bit machine partition immediately!`,
        keyTakeaways: [
          'Spin-wait handles minor sub-5ms clock drift seamlessly.',
          'Never ignore negative clock drift in distributed ID generators.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'More than 4,096 IDs requested in a single millisecond on one node',
        impact: '12-bit sequence counter overflows past 4,095.',
        mitigation: 'When sequence hits 4,096, block and wait for the next millisecond (while timestamp <= last_timestamp { timestamp = now() }) and reset sequence to 0.'
      }
    ],
    interviewQA: [
      {
        question: 'Why is Snowflake ID (64-bit int) superior to UUIDv4 (128-bit string) as a database primary key?',
        hint: 'B+ Tree index fragmentation.',
        goodAnswer: 'UUIDv4 is 128 bits (16 bytes vs 8 bytes) and completely random. Inserting random UUIDs into a B+ Tree index causes massive page splits and random disk I/O, destroying database write throughput. Snowflake IDs are 64 bits and naturally sequential, appending cleanly to the right-most B+ Tree leaf page with 0 page splits.',
        pitfalls: 'Claiming UUIDv4 has same indexing performance as integer IDs.'
      }
    ],
    similarSystems: ['Sonyflake', 'Instagram ID Generator', 'UUIDv7', 'Segment KSUID'],
    tags: ['Snowflake ID', 'Bitwise Operations', 'ZooKeeper', 'B-Tree Indexing', 'Distributed Systems']
  },
  {
    id: 'webhook-delivery-system',
    title: 'Design a Distributed Webhook Delivery & Dispatch Service',
    slug: 'webhook-delivery-platform',
    tagline: 'Reliable event delivery to external HTTP endpoints, exponential backoff retries, dead-letter queues, and HMAC signature verification.',
    category: 'Storage & Infrastructure',
    difficulty: 'Intermediate',
    readTime: '20 min read',
    scaleSummary: {
      dau: '500 Million Webhook Events / day',
      qps: '25,000 Deliveries/sec peak throughput',
      storage: '5 TB / month delivery attempt logs in ClickHouse',
      bandwidth: '5 GB/s HTTP Egress'
    },
    overview: 'A webhook delivery engine reliably transmits event notifications (e.g. payment.succeeded, order.created) over public HTTPS POST requests to customer-provided endpoint URLs. The system handles slow customer servers, exponential retries, and cryptographic HMAC signing.',
    keyChallenges: [
      'Unreliable External Endpoints: 20% of customer webhook servers timeout or return 500 errors',
      'Preventing Worker Thread Exhaustion: A customer endpoint taking 30 seconds to respond must not freeze the worker queue',
      'Exponential Backoff Scheduling: Retrying failed webhooks over 72 hours (after 1m, 5m, 30m, 2h, 12h, 24h)',
      'Security: Cryptographically signing payloads using HMAC-SHA256 and defending against Server-Side Request Forgery (SSRF)'
    ],
    functionalRequirements: [
      'Register webhook URLs with event topic subscriptions',
      'Sign every outgoing HTTP payload with HMAC-SHA256 header (Stripe-Signature)',
      'Automatic retry policy with exponential backoff for up to 72 hours',
      'Dead Letter Queue (DLQ) and customer alert when webhook permanently fails',
      'Customer dashboard with delivery attempt logs and manual redrive button'
    ],
    nonFunctionalRequirements: [
      'At-Least-Once Delivery guarantee',
      'Initial delivery attempt within 500ms of event trigger',
      'SSRF Protection: Block internal IP ranges (127.0.0.1, 169.254.169.254, 10.0.0.0/8)',
      'High Availability 99.99%'
    ],
    outOfScope: ['Bilateral bidirectional WebSocket tunnels'],
    capacityEstimations: {
      assumptions: [
        '500M webhook events/day (~5,800 events/sec avg, 25,000 peak QPS)',
        'Average HTTP response time of external customer servers: 800ms'
      ],
      metrics: [
        { label: 'Dispatch QPS', value: '25,000 / sec', formula: 'Peak outgoing HTTP POST requests', description: 'Async HTTP Dispatch Fleet' },
        { label: 'Concurrent HTTP Sockets', value: '20,000 Sockets', formula: '25,000 QPS * 0.8s response time', description: 'Non-blocking I/O Event Loop' }
      ],
      conclusion: 'Async Non-Blocking I/O (Go / Node.js / Rust Tokio) is mandatory to hold 20k open sockets.'
    },
    architecture: {
      summary: 'Internal Service emits event -> Webhook Dispatcher enqueues to Kafka -> Dispatch Worker validates URL against SSRF filter, generates HMAC signature, and sends HTTP POST. If failed, schedules into Delayed Retry Queue.',
      nodes: [
        { id: 'service', label: 'Internal Business Service', type: 'service', x: 8, y: 50, description: 'Publishes payment or order events' },
        { id: 'kafka_events', label: 'Webhook Event Topic', type: 'queue', x: 30, y: 50, description: 'Buffers new outgoing events', techStack: ['Kafka'] },
        { id: 'dispatcher', label: 'Async HTTP Dispatch Workers', type: 'worker', x: 55, y: 50, description: 'Executes non-blocking HTTPS POSTs with HMAC', techStack: ['Go / Rust Tokio'] },
        { id: 'customer_server', label: 'Customer Webhook Server', type: 'client', x: 85, y: 50, description: 'Receives POST /webhook payload' },
        { id: 'delayed_queue', label: 'Delayed Retry Queue', type: 'queue', x: 55, y: 80, description: 'Schedules exponential backoff retries', techStack: ['Kafka Delayed / RabbitMQ DLX'] },
        { id: 'log_db', label: 'Delivery Log Store (ClickHouse)', type: 'database', x: 55, y: 20, description: 'Stores status codes, latency, response body', techStack: ['ClickHouse'] }
      ],
      edges: [
        { id: 'e1', from: 'service', to: 'kafka_events', label: '1. Publish Event', protocol: 'Async Queue', isAsync: true },
        { id: 'e2', from: 'kafka_events', to: 'dispatcher', label: '2. Consume Job', protocol: 'Internal RPC', isAsync: true },
        { id: 'e3', from: 'dispatcher', to: 'customer_server', label: '3. HTTPS POST (5s timeout)', protocol: 'HTTPS' },
        { id: 'e4', from: 'dispatcher', to: 'log_db', label: '4. Log Attempt (200 OK / 500)', protocol: 'SQL', isAsync: true },
        { id: 'e5', from: 'dispatcher', to: 'delayed_queue', label: '5. If Failed: Schedule Retry', protocol: 'Async Queue', isAsync: true }
      ],
      flowSteps: [
        { step: 1, title: 'Event Ingestion & HMAC Signing', description: 'Worker receives event, looks up customer shared webhook secret, and calculates HMAC-SHA256 signature over timestamp + JSON payload.', activeNodes: ['kafka_events', 'dispatcher'], highlightDetails: 'Injected into Stripe-Signature header to prevent spoofing.', latencyEstimate: '1ms' },
        { step: 2, title: 'SSRF Shielding & DNS Validation', description: 'Worker resolves customer hostname. If IP falls in private RFC 1918 ranges (10.0.0.0/8, 127.0.0.1, 169.254.169.254 cloud metadata), request is rejected immediately.', activeNodes: ['dispatcher'], highlightDetails: 'Prevents malicious users from probing internal infrastructure.', latencyEstimate: '5ms' },
        { step: 3, title: 'Non-Blocking HTTP POST & Retry Scheduling', description: 'Worker dispatches HTTP POST with a 5-second timeout. If customer server returns 500 error or times out, worker pushes payload to Delayed Retry Queue for retry in 5 minutes.', activeNodes: ['dispatcher', 'customer_server', 'delayed_queue', 'log_db'], highlightDetails: 'Retries repeat with exponential backoff up to 72 hours.', latencyEstimate: '800ms' }
      ]
    },
    apiDesign: [
      {
        method: 'POST',
        path: '/v1/webhook_endpoints',
        description: 'Register a new webhook listener URL',
        requestBody: '{\n  "url": "https://api.mycompany.com/webhooks/stripe",\n  "enabled_events": ["charge.succeeded", "charge.failed"]\n}',
        responseBody: '{\n  "id": "we_102938",\n  "secret": "whsec_98a7b6c5..."\n}'
      }
    ],
    databaseDesign: [
      {
        tableName: 'webhook_delivery_attempts',
        type: 'Time-Series',
        shardingKey: 'webhook_id, date',
        fields: [
          { name: 'attempt_id', type: 'UUID', isPrimary: true },
          { name: 'webhook_id', type: 'VARCHAR(32)', isIndex: true },
          { name: 'response_status', type: 'INT' },
          { name: 'execution_time_ms', type: 'INT' },
          { name: 'created_at', type: 'TIMESTAMP' }
        ],
        notes: 'Stored in ClickHouse for real-time customer debugging analytics.'
      }
    ],
    deepDives: [
      {
        title: 'SSRF (Server-Side Request Forgery) Defense in Webhook Engines',
        subtitle: 'How attackers use webhook URLs to steal AWS IAM credentials and how to stop them',
        content: `A malicious user creates an account and sets their webhook URL to http://169.254.169.254/latest/meta-data/iam/security-credentials/. When a webhook fires, your internal worker fetches AWS metadata and sends your company root AWS keys straight to the attacker!\n\nZero-Trust SSRF Defense Pipeline:\n1. DNS Resolution Check: Resolve hostname to IP before making the socket connection.\n2. IP Range Blacklist: Reject any IP in:\n   - 127.0.0.0/8 (Loopback)\n   - 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 (Private subnets)\n   - 169.254.169.254 (Cloud link-local metadata service)\n   - 0.0.0.0/8 and IPv6 equivalents.\n3. Prevent DNS Rebinding: Pin the resolved IP address on the HTTP client socket so malicious DNS servers cannot return a public IP first and a private IP second!`,
        keyTakeaways: [
          'Socket IP pinning prevents DNS rebinding exploits.',
          'Never execute HTTP requests to customer-provided URLs without strict IP validation.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Single Customer Endpoint Outage Backlog',
        impact: 'A large customer server goes down, flooding retry queues with 10M failed tasks and delaying other customers webhooks.',
        mitigation: 'Per-Tenant Queue Isolation: Isolate retry queues per customer ID so 1 failing customer never affects delivery to other tenants.'
      }
    ],
    interviewQA: [
      {
        question: 'Why must webhooks include a timestamp in the signature header?',
        hint: 'Replay attacks.',
        goodAnswer: 'Including timestamp t in the signature (t=1724000000,v1=hash(t + "." + payload)) allows recipient servers to reject any webhook older than 5 minutes, completely preventing malicious attackers from capturing and replaying old payment confirmation webhooks.',
        pitfalls: 'Signing only the payload body without timestamp.'
      }
    ],
    similarSystems: ['Stripe Webhooks', 'Svix', 'GitHub Webhooks', 'Hookdeck'],
    tags: ['HMAC Signature', 'SSRF Defense', 'Exponential Backoff', 'Kafka', 'ClickHouse']
  },
  {
    id: 'realtime-metrics-monitoring',
    title: 'Design a Real-Time Distributed Metrics & Monitoring System (Prometheus / Datadog)',
    slug: 'metrics-monitoring-platform',
    tagline: 'High-throughput time-series ingestion, Gorilla time-series compression, PromQL aggregation, and sub-second anomaly alerting.',
    category: 'Search & Big Data',
    difficulty: 'Advanced',
    readTime: '24 min read',
    scaleSummary: {
      dau: '100,000 Monitored Servers & Services',
      qps: '10,000,000 Metric Data Points / sec',
      storage: '50 TB / day Time-Series Data',
      bandwidth: '20 GB/s Telemetry Stream'
    },
    overview: 'A distributed observability platform ingests millions of counter, gauge, and histogram metric data points per second from servers and containers. The system compresses timeseries data using Gorilla delta-of-delta encoding, executes PromQL queries, and evaluates real-time alert rules.',
    keyChallenges: [
      'Extreme Ingestion Throughput: Ingesting 10 Million metrics/sec without disk I/O bottlenecks',
      'High Cardinality Explosion: Millions of unique label combinations (e.g. {service="api", pod="pod-99", user_id="123"}) ballooning memory',
      'Time-Series Compression: Compressing 16-byte (timestamp, float64 value) points down to ~1.37 bytes using Facebook Gorilla algorithm',
      'Sub-Second Alerting: Evaluating 50,000 alert rules every 15 seconds across sliding windows'
    ],
    functionalRequirements: [
      'Ingest multi-dimensional metrics (metric_name, labels, timestamp, value)',
      'Query timeseries data using PromQL (Rate, Sum, Histogram Quantile P99)',
      'Configurable retention policies (Raw: 14 days, 1-min rollup: 90 days, 1-hour rollup: 1 year)',
      'Alerting engine evaluating PromQL rules and notifying PagerDuty/Slack'
    ],
    nonFunctionalRequirements: [
      'Query latency < 500ms for 7-day dashboard charts',
      'High Compression: > 10x compression factor on disk and RAM',
      'High Availability 99.99%'
    ],
    outOfScope: ['Distributed APM distributed tracing spans (OpenTelemetry Jaeger)'],
    capacityEstimations: {
      assumptions: [
        '10M metric points ingested per second',
        'Raw point: Timestamp (8 bytes) + Float64 (8 bytes) = 16 bytes',
        'Uncompressed Ingestion = 10M * 16 bytes = 160 MB/sec = 13.8 TB/day',
        'With Gorilla Compression (1.37 bytes/point): Storage drops to 1.18 TB/day!'
      ],
      metrics: [
        { label: 'Ingestion Throughput', value: '10,000,000 points/s', formula: 'Peak telemetry stream', description: 'Kafka + ClickHouse TSDB' },
        { label: 'Gorilla Compression Ratio', value: '11.6x Compression', formula: '16 bytes -> 1.37 bytes per point', description: 'Delta-of-Delta + XOR encoding' }
      ],
      conclusion: 'Time-series specialized storage engines (ClickHouse / Prometheus TSDB / VictoriaMetrics) are mandatory.'
    },
    architecture: {
      summary: 'Prometheus Agents scrape endpoints -> Push metrics to Kafka -> Flink aggregates high-cardinality rollups -> Ingested into ClickHouse / TSDB with Gorilla compression -> Query Service evaluates PromQL -> Alertmanager fires alerts.',
      nodes: [
        { id: 'agents', label: 'Metric Exporters / Agents', type: 'worker', x: 8, y: 50, description: 'Scrapes /metrics on 100k servers' },
        { id: 'kafka', label: 'Metrics Ingestion Stream', type: 'queue', x: 30, y: 50, description: 'Buffers 10M points/sec', techStack: ['Kafka'] },
        { id: 'flink', label: 'Stream Aggregator (Flink)', type: 'worker', x: 55, y: 30, description: 'Calculates 1-minute rollups & downsampling', techStack: ['Apache Flink'] },
        { id: 'tsdb', label: 'Time-Series Store (ClickHouse / TSDB)', type: 'database', x: 75, y: 50, description: 'Stores Gorilla-compressed column blocks', techStack: ['ClickHouse / VictoriaMetrics'] },
        { id: 'query_srv', label: 'PromQL Query Engine', type: 'service', x: 92, y: 30, description: 'Evaluates Grafana dashboard queries', techStack: ['Go PromQL Engine'] },
        { id: 'alertmanager', label: 'Alert Evaluator', type: 'service', x: 92, y: 70, description: 'Fires PagerDuty & Slack alerts', techStack: ['Alertmanager'] }
      ],
      edges: [
        { id: 'e1', from: 'agents', to: 'kafka', label: '1. Push Metrics (gRPC)', protocol: 'gRPC' },
        { id: 'e2', from: 'kafka', to: 'flink', label: '2. Stream Points', protocol: 'Internal RPC', isAsync: true },
        { id: 'e3', from: 'kafka', to: 'tsdb', label: '3. Batch Insert', protocol: 'Internal RPC', isAsync: true },
        { id: 'e4', from: 'query_srv', to: 'tsdb', label: '4. Execute PromQL Query', protocol: 'SQL' },
        { id: 'e5', from: 'alertmanager', to: 'tsdb', label: '5. Poll Alert Rules (15s)', protocol: 'SQL' }
      ],
      flowSteps: [
        { step: 1, title: 'High-Throughput Push Ingestion', description: 'Agents push metric vectors to Kafka. Kafka partitions distribute write load evenly across 50 broker nodes.', activeNodes: ['agents', 'kafka'], highlightDetails: 'Zero write lock contention.', latencyEstimate: '2ms' },
        { step: 2, title: 'Gorilla Delta-of-Delta Compression', description: 'TSDB batches points into 2-hour chunks. Timestamps are compressed using Delta-of-Delta (most deltas = 0, storing 1 bit). Values are compressed using XOR floating point encoding.', activeNodes: ['tsdb'], highlightDetails: 'Reduces 16 bytes down to 1.37 bytes (91% RAM savings).', latencyEstimate: '10ms' },
        { step: 3, title: 'Sub-Second PromQL Querying', description: 'User loads Grafana dashboard. Query engine scans columnar TSDB blocks in parallel, evaluating rate(http_requests_total[5m]) in < 150ms.', activeNodes: ['query_srv', 'tsdb'], highlightDetails: 'Columnar memory format allows scanning 100M rows/sec per CPU core.', latencyEstimate: '120ms' }
      ]
    },
    apiDesign: [
      {
        method: 'POST',
        path: '/api/v1/query_range',
        description: 'Query PromQL timeseries over a time range',
        requestBody: '{\n  "query": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) by (service)",\n  "start": 1724000000,\n  "end": 1724003600,\n  "step": "15s"\n}'
      }
    ],
    databaseDesign: [
      {
        tableName: 'metrics_time_series',
        type: 'Time-Series',
        shardingKey: 'metric_name, date',
        fields: [
          { name: 'metric_hash', type: 'BIGINT', isPrimary: true },
          { name: 'timestamp', type: 'DATETIME', isPrimary: true },
          { name: 'value', type: 'FLOAT64' },
          { name: 'labels', type: 'MAP(String, String)' }
        ],
        notes: 'ClickHouse table with MergeTree engine partitioned by toYYYYMM(date).'
      }
    ],
    deepDives: [
      {
        title: 'Gorilla Time-Series Compression Algorithm Deep Dive',
        subtitle: 'The Facebook paper that revolutionized modern monitoring systems',
        content: `Two-Part Compression Algorithm:\n1. Timestamp Compression (Delta-of-Delta):\n   - Metrics arrive at fixed intervals (e.g. every 15s). The delta between timestamps is constant: D = t_n - t_{n-1} = 15.\n   - Delta of Delta = D_n - D_{n-1} = 15 - 15 = 0.\n   - If delta-of-delta is 0, store a SINGLE BIT '0'!\n\n2. Value Compression (XOR Floating Point):\n   - Most metrics change very little between consecutive scrapes (e.g. CPU 42.1% -> 42.2%).\n   - XOR current float64 with previous float64: V_xor = V_n XOR V_{n-1}.\n   - If values are identical, V_xor = 0 (store single bit '0').\n   - If values are close, V_xor has many leading and trailing zero bits. Store only the meaningful bits with a length prefix.\n\nResult: 16-byte raw data point compresses to an average of 1.37 bytes (11.6x compression ratio)!`,
        keyTakeaways: [
          'Delta-of-Delta timestamp compression turns 8 bytes into 1 bit for regular scrapes.',
          'XOR compression exploits floating point mantissa bit redundancy.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'High Cardinality Explosion (e.g. putting user_id in metric label)',
        impact: 'Millions of unique timeseries streams overwhelm the inverted index in memory, causing OOM crashes.',
        mitigation: 'Implement Cardinality Protections: Reject metrics with > 10,000 unique label series and downsample raw metrics via Apache Flink.'
      }
    ],
    interviewQA: [
      {
        question: 'Pull (Prometheus) vs Push (Datadog/StatsD) architecture: which is better?',
        hint: 'Service discovery vs firewall traversal.',
        goodAnswer: 'Pull (Prometheus scrapes /metrics): Central server controls scrape rate and easily detects dead nodes (if scrape fails, node is down). Best for static/Kubernetes infra. Push (Agents send to gateway): Better for ephemeral serverless functions (AWS Lambda) and multi-cloud firewalls where central server cannot initiate inbound connections.',
        pitfalls: 'Declaring one paradigm as universally superior without trade-off context.'
      }
    ],
    similarSystems: ['Prometheus', 'Datadog', 'VictoriaMetrics', 'Grafana Mimir', 'InfluxDB'],
    tags: ['Gorilla Compression', 'PromQL', 'Time-Series DB', 'ClickHouse', 'Flink']
  },
  {
    id: 'proximity-service-yelp',
    title: 'Design a Proximity Service / Yelp (Nearby Places Search)',
    slug: 'proximity-service-yelp',
    tagline: 'High-speed spatial point-of-interest lookups, Geohash grid partitioning, QuadTrees, and Google Places search ranking.',
    category: 'Search & Big Data',
    difficulty: 'Intermediate',
    readTime: '20 min read',
    scaleSummary: {
      dau: '100 Million Search Queries / day',
      qps: '30,000 Search QPS / 100 Million Places Indexed',
      storage: '200 GB spatial database index',
      bandwidth: '5 GB/s Search Egress'
    },
    overview: 'A proximity service enables users to discover nearby restaurants, coffee shops, and businesses within a given radius (e.g. 5km) based on GPS coordinates. The system requires spatial indexing with sub-20ms search latencies.',
    keyChallenges: [
      'Fast 2D Spatial Search: Finding points within radius R of (latitude, longitude) without scanning all 100M places',
      'Handling Variable Density: Downtown Manhattan has 10,000 businesses per km², while rural Alaska has 1 business per 100 km²',
      'Search Ranking combining distance, star rating, price tier, and open hours',
      'Read-Heavy Workload (1000:1 read to write ratio; business locations change rarely)'
    ],
    functionalRequirements: [
      'Search places by location (lat, lng), radius (e.g. 3km), and category (Italian food)',
      'Add and edit business profiles (photos, hours, address, phone)',
      'Filter results by rating, price level, and currently open status'
    ],
    nonFunctionalRequirements: [
      'Search query latency < 25ms (P99)',
      'High Availability 99.99%',
      'Support 30,000 search QPS globally'
    ],
    outOfScope: ['Live turn-by-turn navigation audio routing'],
    capacityEstimations: {
      assumptions: [
        '100 Million business places globally; 100M search queries per day (~1,160 QPS avg, 30,000 peak QPS)',
        'Place record size: 2 KB (ID, name, lat, lng, category, rating, metadata)',
        'Total Storage: 100M * 2 KB = 200 GB'
      ],
      metrics: [
        { label: 'Spatial Search QPS', value: '30,000 QPS', formula: 'Peak nearby place queries', description: 'Redis Geohash / PostGIS' },
        { label: 'Total Places Storage', value: '200 GB', formula: '100M businesses * 2 KB', description: 'Easily fits in server RAM!' }
      ],
      conclusion: 'The entire 200GB global business database can be cached in RAM across a Redis cluster.'
    },
    architecture: {
      summary: 'Clients query API Gateway -> Proximity Search Service -> Queries Redis Geohash Spatial Index (or PostGIS) -> Fetches business metadata from PostgreSQL -> Caches hot search tiles in CDN.',
      nodes: [
        { id: 'client', label: 'Yelp Mobile / Web App', type: 'client', x: 8, y: 50, description: 'Searches nearby restaurants' },
        { id: 'gateway', label: 'API Gateway', type: 'gateway', x: 30, y: 50, description: 'Auth, rate limit, geo-routing', techStack: ['Envoy'] },
        { id: 'search_srv', label: 'Proximity Search Service', type: 'service', x: 55, y: 50, description: 'Calculates Geohash boxes and filters results', techStack: ['Go / Java'] },
        { id: 'geo_cache', label: 'Geohash Spatial Index (Redis)', type: 'cache', x: 80, y: 25, description: 'Stores geohash:prefix -> [place_ids]', techStack: ['Redis Geospatial'] },
        { id: 'db', label: 'Places DB (PostgreSQL + PostGIS)', type: 'database', x: 80, y: 75, description: 'Durable place metadata with R-Tree spatial index', techStack: ['PostgreSQL + PostGIS'] }
      ],
      edges: [
        { id: 'e1', from: 'client', to: 'gateway', label: '1. GET /places/nearby?lat=..&lng=..', protocol: 'HTTPS' },
        { id: 'e2', from: 'gateway', to: 'search_srv', label: '2. Route Query', protocol: 'Internal RPC' },
        { id: 'e3', from: 'search_srv', to: 'geo_cache', label: '3. GEORADIUS / Geohash Lookup', protocol: 'TCP' },
        { id: 'e4', from: 'search_srv', to: 'db', label: '4. Hydrate Business Details', protocol: 'SQL' }
      ],
      flowSteps: [
        { step: 1, title: 'Geohash Prefix Expansion', description: 'Client sends (lat 37.7749, lng -122.4194, radius 2km). Service converts coordinates to 6-character Geohash "9q8yyk" (~1.2km box) and fetches 8 neighboring Geohash boxes.', activeNodes: ['client', 'search_srv'], highlightDetails: 'Guarantees boundary places are not missed.', latencyEstimate: '1ms' },
        { step: 2, title: 'In-Memory Spatial Point Retrieval', description: 'Search Service queries Redis using GEOSEARCH to retrieve candidate place IDs within 2km in < 2ms.', activeNodes: ['search_srv', 'geo_cache'], highlightDetails: 'Filters 100M places down to 50 local candidates in RAM.', latencyEstimate: '2ms' },
        { step: 3, title: 'Filtering & Composite Ranking', description: 'Service filters candidates by open hours and category, ranks them by Score = (Rating * 0.5) + (1 / Distance * 0.3) + (ReviewCount * 0.2), and returns top 20.', activeNodes: ['search_srv', 'db', 'client'], highlightDetails: 'Total search roundtrip under 15ms.', latencyEstimate: '10ms' }
      ]
    },
    apiDesign: [
      {
        method: 'GET',
        path: '/api/v1/places/nearby?lat=37.7749&lng=-122.4194&radius=2000&category=cafe',
        description: 'Search nearby businesses',
        responseBody: '{\n  "places": [\n    {\n      "id": "pl_1029",\n      "name": "Blue Bottle Coffee",\n      "distance_meters": 350,\n      "rating": 4.8,\n      "is_open": true\n    }\n  ]\n}'
      }
    ],
    databaseDesign: [
      {
        tableName: 'places',
        type: 'SQL',
        shardingKey: 'geohash_4 (City Partition)',
        fields: [
          { name: 'id', type: 'UUID', isPrimary: true },
          { name: 'name', type: 'VARCHAR(255)' },
          { name: 'location', type: 'GEOMETRY(Point, 4326)', isIndex: true },
          { name: 'geohash', type: 'VARCHAR(12)', isIndex: true },
          { name: 'rating', type: 'FLOAT' }
        ],
        notes: 'PostgreSQL with PostGIS SP-GiST / R-Tree index for spatial queries.'
      }
    ],
    deepDives: [
      {
        title: 'Geohash vs QuadTree for Proximity Search',
        subtitle: 'Why Geohash prefix partitioning wins for distributed caching',
        content: `1. Geohash Encoding:\n- Interleaves latitude and longitude into Base32 characters.\n- Prefix property: Places sharing the same 5-character prefix "9q8yy" are in the exact same 4.9km x 4.9km bounding box.\n- Sharding: Sharding the database by Geohash Prefix 4 (e.g. "9q8y") groups all businesses in San Francisco onto a single database shard!\n\n2. QuadTree:\n- Hierarchically subdivides space until each quadrant has <= 100 places.\n- Pros: Adapts to density (Manhattan has tiny sub-quadrants, rural areas have huge quadrants).\n- Cons: Harder to shard across distributed cache nodes than flat Geohash strings.`,
        keyTakeaways: [
          'Geohashes are string keys, making them trivial to store in Redis and SQL B-Trees.',
          'Always query the central Geohash + 8 surrounding neighbor cells to prevent boundary misses.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Boundary Edge Miss Problem',
        impact: 'A user standing at the right edge of a Geohash box misses a restaurant 10 meters away on the left edge of the neighboring box.',
        mitigation: 'Always query the 8 adjacent neighboring Geohash boxes (3x3 grid) and filter by true Euclidean / Haversine distance.'
      }
    ],
    interviewQA: [
      {
        question: 'How do you cache search results when users have infinite possible GPS coordinates?',
        hint: 'Coordinate rounding / Grid quantization.',
        goodAnswer: 'Round user coordinates to a 6-character Geohash (quantizing space into 1.2km grid cells). Cache search results in Redis keyed by geohash:category (e.g. cache:9q8yyk:cafe) for 10 minutes, achieving an 85% cache hit ratio.',
        pitfalls: 'Caching by exact float coordinates (lat 37.77492819) which almost never repeat.'
      }
    ],
    similarSystems: ['Google Maps Nearby', 'TripAdvisor', 'Foursquare', 'Zomato'],
    tags: ['Geohash', 'PostGIS', 'Spatial Index', 'QuadTree', 'Redis']
  },
  {
    id: 'distributed-cache-cluster',
    title: 'Design a Distributed Cache System (Redis / Memcached Cluster)',
    slug: 'distributed-cache-system',
    tagline: 'High-performance in-memory key-value cluster, Consistent Hashing with virtual nodes, master-replica failover, and LRU memory management.',
    category: 'Storage & Infrastructure',
    difficulty: 'Advanced',
    readTime: '22 min read',
    scaleSummary: {
      dau: '100 Million Active Cache Keys',
      qps: '5,000,000 Cache Reads/sec / 500,000 Writes/sec',
      storage: '2 Terabytes RAM in distributed cluster',
      bandwidth: '50 GB/s In-Memory Throughput'
    },
    overview: 'A distributed in-memory cache system provides sub-millisecond key-value storage across a horizontally scaled cluster of nodes. The system implements Consistent Hashing with Virtual Nodes to distribute keys evenly and minimize rebalancing data migration during node additions or failures.',
    keyChallenges: [
      'Consistent Hashing & Virtual Nodes: Distributing 100M keys evenly across 100 nodes without hash ring hot spots',
      'Node Failure & Rebalancing: Adding or removing a node should only shift K/N keys rather than invalidating the entire cache',
      'High-Throughput Concurrency: Sub-millisecond P99 latency under 5 Million QPS',
      'Memory Eviction under Pressure: LRU / LFU eviction when memory reaches 90% capacity'
    ],
    functionalRequirements: [
      'GET(key), SET(key, value, ttl), DEL(key) operations in < 1ms',
      'Automatic key expiration (TTL) and LRU eviction',
      'Dynamic node scaling with minimal key rebalancing',
      'Master-Replica replication with automatic failover'
    ],
    nonFunctionalRequirements: [
      'Latency: P99 < 1ms for all operations',
      'High Availability 99.999%',
      'Linear scalability: Adding 10 nodes increases capacity by 10x'
    ],
    outOfScope: ['Multi-table SQL relational query engine'],
    capacityEstimations: {
      assumptions: [
        '5M reads/sec; 500k writes/sec peak; 100M keys stored',
        'Average key + value size: 1 KB -> 100M * 1 KB = 100 GB RAM active dataset (replicated 3x = 300 GB RAM)'
      ],
      metrics: [
        { label: 'Cluster Read Throughput', value: '5,000,000 ops/s', formula: 'Distributed across 50 cache nodes (100k ops/node)', description: 'Redis in-memory execution' },
        { label: 'Key Migration on Resharding', value: 'Only 1/N Keys', formula: 'Consistent Hashing ring property', description: 'Minimal rebalance overhead' }
      ],
      conclusion: 'Consistent hashing with 256 virtual nodes per physical server ensures balanced memory distribution.'
    },
    architecture: {
      summary: 'Smart Client or Proxy (Twemproxy/Envoy) hashes key on 2^32 Consistent Hashing Ring with Virtual Nodes -> Routes request directly to target Redis Master node -> Async replication to Read Replica -> Gossip protocol monitors node health.',
      nodes: [
        { id: 'client', label: 'Application Servers', type: 'client', x: 8, y: 50, description: 'Calls GET/SET with smart hash ring router' },
        { id: 'proxy', label: 'Cache Router / Proxy', type: 'gateway', x: 35, y: 50, description: 'Maintains Consistent Hashing ring & connection pool', techStack: ['Envoy / Twemproxy'] },
        { id: 'node_1', label: 'Redis Master Node 1', type: 'cache', x: 70, y: 20, description: 'Holds Ring Range 0 - 33%', techStack: ['Redis'] },
        { id: 'node_2', label: 'Redis Master Node 2', type: 'cache', x: 70, y: 50, description: 'Holds Ring Range 33% - 66%', techStack: ['Redis'] },
        { id: 'node_3', label: 'Redis Master Node 3', type: 'cache', x: 70, y: 80, description: 'Holds Ring Range 66% - 100%', techStack: ['Redis'] },
        { id: 'replica', label: 'Read Replica Nodes', type: 'cache', x: 92, y: 50, description: 'Asynchronous replication & hot standby', techStack: ['Redis Replica'] }
      ],
      edges: [
        { id: 'e1', from: 'client', to: 'proxy', label: '1. GET user:1029', protocol: 'TCP' },
        { id: 'e2', from: 'proxy', to: 'proxy', label: '2. Hash(user:1029) -> Node 2', protocol: 'Internal RPC' },
        { id: 'e3', from: 'proxy', to: 'node_2', label: '3. Forward GET', protocol: 'TCP' },
        { id: 'e4', from: 'node_2', to: 'replica', label: '4. Async Replication Stream', protocol: 'TCP', isAsync: true }
      ],
      flowSteps: [
        { step: 1, title: 'Key Hashing & Ring Mapping', description: 'Proxy calculates hash = Murmur3("user:1029") % 2^32. It searches the circular sorted array of virtual nodes (Binary Search in O(log V)) to locate the closest clockwise server.', activeNodes: ['client', 'proxy'], highlightDetails: 'Deterministic O(log V) routing in < 0.05ms.', latencyEstimate: '0.05ms' },
        { step: 2, title: 'In-Memory Key-Value Retrieval', description: 'Target Redis node retrieves value from in-memory hash table in O(1) time and updates key position in Doubly Linked List for LRU tracking.', activeNodes: ['proxy', 'node_2'], highlightDetails: 'Sub-millisecond data return.', latencyEstimate: '0.5ms' }
      ]
    },
    apiDesign: [
      {
        method: 'POST',
        path: '/v1/cache/set',
        description: 'Set cache key with TTL',
        requestBody: '{\n  "key": "user:profile:1029",\n  "value": "{\\"name\\":\\"Alex\\"}",\n  "ttl_seconds": 3600\n}'
      }
    ],
    databaseDesign: [
      {
        tableName: 'cluster_topology',
        type: 'NoSQL Key-Value',
        shardingKey: 'cluster_name',
        fields: [
          { name: 'node_id', type: 'VARCHAR(32)', isPrimary: true },
          { name: 'ip_address', type: 'VARCHAR(45)' },
          { name: 'virtual_nodes_count', type: 'INT' },
          { name: 'status', type: 'VARCHAR(10)' }
        ],
        notes: 'Gossip protocol state tracking cluster topology.'
      }
    ],
    deepDives: [
      {
        title: 'Consistent Hashing with Virtual Nodes: Mathematical Proof',
        subtitle: 'Why traditional Hash(key) % N destroys caches and how consistent hashing fixes it',
        content: `Traditional Hashing: Node = Hash(key) % N.\nIf N=10 and 1 node fails (N becomes 9), almost 100% of existing keys map to a completely different server index. Result: Massive cache miss storm (Thundering Herd) that immediately crashes the primary database!\n\nConsistent Hashing Ring:\n1. Hash ring represents a circular range from 0 to 2^32 - 1.\n2. Server nodes are hashed onto points along the ring.\n3. Keys are mapped to the first server encountered moving CLOCKWISE.\n4. When a node is added or removed, ONLY keys falling between that node and its predecessor are migrated (exactly K/N keys migrated, while (N-1)/N keys remain valid!).\n\nVirtual Nodes (Vnodes):\nAssigning 200 virtual tokens per physical node (e.g. Node1#1, Node1#2... Node1#200) spreads data with < 5% variance across all physical servers!`,
        keyTakeaways: [
          'Consistent hashing minimizes key migration to exactly K/N on scaling.',
          'Virtual nodes eliminate hot spots on the ring.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Hot Key Overloading Single Cache Node',
        impact: 'A viral key gets 200,000 reads/sec, saturating a single Redis node NIC bandwidth.',
        mitigation: 'Key Suffix Replication: Store viral key under 10 replicas (key#1, key#2... key#10) and have clients randomly choose a suffix.'
      }
    ],
    interviewQA: [
      {
        question: 'How does Redis implement LRU eviction when memory is full without high memory overhead?',
        hint: 'Approximated LRU with random sampling.',
        goodAnswer: 'Instead of maintaining a massive true doubly linked list of 100M keys (which consumes huge RAM), Redis uses Approximated LRU: it samples 5 random keys, inspects their 24-bit last-access timestamps (lru clock), and evicts the oldest key among the sample. This achieves 99% accuracy of true LRU with zero extra memory pointers.',
        pitfalls: 'Claiming Redis maintains a single global linked list across all keys.'
      }
    ],
    similarSystems: ['Redis Cluster', 'Memcached', 'Twemproxy', 'AWS ElastiCache'],
    tags: ['Consistent Hashing', 'Virtual Nodes', 'LRU Eviction', 'Redis Cluster', 'Hot Keys']
  },
  {
    id: 'realtime-gaming-leaderboard',
    title: 'Design a Real-Time Multiplayer Gaming Leaderboard',
    slug: 'gaming-leaderboard',
    tagline: 'Millions of concurrent score updates, Redis Sorted Sets (Skip Lists), dense rank calculations, and global top 100 feeds.',
    category: 'Financial & High Throughput',
    difficulty: 'Intermediate',
    readTime: '18 min read',
    scaleSummary: {
      dau: '50 Million Active Gamers',
      qps: '150,000 Score Updates/sec / 50,000 Leaderboard Views/sec',
      storage: '10 GB In-Memory Skip List Ranking Store',
      bandwidth: '5 GB/s Real-Time Egress'
    },
    overview: 'A real-time gaming leaderboard ranks millions of players by score, calculates exact percentile and player rank (e.g. "Rank #42,891 out of 5,000,000 players"), and serves live Top 100 leaderboards with sub-10ms response times.',
    keyChallenges: [
      'High-Concurrency Score Increments: 150,000 players submitting match scores per second',
      'Real-Time Rank Calculation: Finding player exact integer rank in O(log N) time rather than scanning millions of rows',
      'Tie-Breaking: Ranking players with identical scores by who achieved the score first (FIFO)',
      'Leaderboard Segmentation: Global, Country-specific, and Friends-only leaderboards'
    ],
    functionalRequirements: [
      'Submit new player score or increment score (ZADD / ZINCRBY)',
      'Fetch global Top 100 players list with avatars and scores',
      'Fetch current player rank and +/- 5 surrounding neighbor ranks',
      'Daily, Weekly, and All-Time seasonal leaderboard resets'
    ],
    nonFunctionalRequirements: [
      'Rank query latency < 10ms',
      'Score update reflection in < 500ms',
      'High Availability 99.99%'
    ],
    outOfScope: ['In-game cheat detection anti-tamper memory scanner'],
    capacityEstimations: {
      assumptions: [
        '50M active players; 150,000 score submissions/sec peak',
        'Redis Sorted Set entry: user_id (UUID 36 bytes) + score (Float64 8 bytes) + Skip List node overhead = ~100 bytes',
        '50M players * 100 bytes = 5 GB RAM total in Redis!'
      ],
      metrics: [
        { label: 'Score Update QPS', value: '150,000 / sec', formula: 'Peak ZINCRBY operations', description: 'Redis Cluster Ingestion' },
        { label: 'Leaderboard RAM', value: '5 GB RAM', formula: '50M players in Redis ZSET', description: 'Skip List + Hash Table in memory' }
      ],
      conclusion: 'Redis Sorted Sets (Skip Lists) handle 50M player ranks with O(log N) updates and lookups in RAM.'
    },
    architecture: {
      summary: 'Game Clients submit scores -> Game Service -> Redis Sorted Set (ZSET) updates score -> Queries ZREVRANK for exact rank -> Periodic Kafka stream archives leaderboard snapshots to PostgreSQL for historical seasons.',
      nodes: [
        { id: 'client', label: 'Game Client (Mobile / PC)', type: 'client', x: 8, y: 50, description: 'Submits score after match' },
        { id: 'gateway', label: 'Leaderboard API Gateway', type: 'gateway', x: 30, y: 50, description: 'Rate limits and validates signed score tokens', techStack: ['Envoy'] },
        { id: 'leader_srv', label: 'Leaderboard Service', type: 'service', x: 55, y: 50, description: 'Manages seasonal ZSETs and rank queries', techStack: ['Go / Node.js'] },
        { id: 'redis_zset', label: 'Redis Sorted Sets (ZSET)', type: 'cache', x: 80, y: 30, description: 'In-memory Skip List holding 50M scores', techStack: ['Redis Cluster'], scaleMetric: 'O(log N) rank lookup' },
        { id: 'archive_db', label: 'Season Archive DB', type: 'database', x: 80, y: 70, description: 'PostgreSQL storing historical season winners', techStack: ['PostgreSQL'] }
      ],
      edges: [
        { id: 'e1', from: 'client', to: 'gateway', label: '1. POST /scores/submit', protocol: 'HTTPS' },
        { id: 'e2', from: 'gateway', to: 'leader_srv', label: '2. Route Score', protocol: 'Internal RPC' },
        { id: 'e3', from: 'leader_srv', to: 'redis_zset', label: '3. ZINCRBY leaderboard:global 500', protocol: 'TCP' },
        { id: 'e4', from: 'leader_srv', to: 'redis_zset', label: '4. ZREVRANK (Get User Rank)', protocol: 'TCP' },
        { id: 'e5', from: 'leader_srv', to: 'archive_db', label: '5. Daily Snapshot', protocol: 'SQL', isAsync: true }
      ],
      flowSteps: [
        { step: 1, title: 'Atomic Score Update', description: 'Client finishes game with 500 points. Leaderboard Service executes ZINCRBY leaderboard:season_5 500 "user_42" in Redis.', activeNodes: ['client', 'leader_srv', 'redis_zset'], highlightDetails: 'Skip List updates node position in O(log N) time (approx 26 pointer adjustments).', latencyEstimate: '1ms' },
        { step: 2, title: 'Rank & Surrounding Players Query', description: 'Client requests rank. Server calls ZREVRANK to get player rank (#1,240) and ZREVRANGE to get top 100 players.', activeNodes: ['leader_srv', 'redis_zset', 'client'], highlightDetails: 'Returns Top 100 leaderboard in < 3ms.', latencyEstimate: '2ms' }
      ]
    },
    apiDesign: [
      {
        method: 'POST',
        path: '/api/v1/leaderboard/submit',
        description: 'Submit game match score',
        requestBody: '{\n  "player_id": "ply_9821",\n  "score_delta": 450,\n  "match_token": "sig_a89x20"\n}',
        responseBody: '{\n  "new_total_score": 14250,\n  "global_rank": 482\n}'
      }
    ],
    databaseDesign: [
      {
        tableName: 'historical_leaderboards',
        type: 'SQL',
        shardingKey: 'season_id',
        fields: [
          { name: 'season_id', type: 'VARCHAR(32)', isPrimary: true },
          { name: 'player_id', type: 'UUID', isPrimary: true },
          { name: 'final_score', type: 'BIGINT' },
          { name: 'final_rank', type: 'INT' }
        ],
        notes: 'PostgreSQL table archiving final standings of concluded seasons.'
      }
    ],
    deepDives: [
      {
        title: 'Redis Sorted Set Internals: Skip List + Hash Table Architecture',
        subtitle: 'Why Skip Lists beat Balanced Trees (AVL / Red-Black) for concurrent ranking',
        content: `A Redis Sorted Set (ZSET) combines two data structures:\n1. Hash Table: Maps member (user_id) -> score in O(1) time.\n2. Skip List (Probabilistic Hierarchical Linked List):\n   - Multiple forward-pointer layers with skip step spans.\n   - Inserting or updating score is O(log N) with zero complex tree rebalancing rotations.\n   - Range queries (ZREVRANGEBYSCORE) are simple pointer traversals along the base linked list.\n   - Rank lookup (ZREVRANK) is O(log N) because each skip list pointer stores the span distance (number of elements jumped), allowing rank calculation by summing span counters during search!`,
        keyTakeaways: [
          'Span annotations on skip list pointers enable O(log N) rank calculation.',
          'Skip lists have superior concurrency characteristics compared to Red-Black trees.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Tie-Breaking for Identical Scores',
        impact: 'If two players have 10,000 points, who is Rank #1?',
        mitigation: 'Decimal Timestamp Inversion: Store score as: FloatScore = Score + (1 - (Timestamp / 1e12)). Earlier timestamps yield slightly higher floating point values, deterministically breaking ties in FIFO order.'
      }
    ],
    interviewQA: [
      {
        question: 'How do you handle Friends-Only Leaderboards (ranking among 50 friends)?',
        hint: 'Batch querying vs dedicated ZSET.',
        goodAnswer: 'Do NOT create a dedicated ZSET for every user friends list (millions of small sets waste RAM). Instead, fetch friend IDs from Social Graph DB, perform ZSCORE in batch (MGET) from the Global ZSET for those 50 IDs, and sort the 50 items in application memory in O(K log K) time (< 1ms).',
        pitfalls: 'Creating a separate Redis ZSET for every user friendship circle.'
      }
    ],
    similarSystems: ['PlayFab Leaderboard', 'GameLift', 'Steam Leaderboards', 'Duolingo League'],
    tags: ['Redis ZSET', 'Skip List', 'Leaderboard', 'Ranking', 'O(log N)']
  },
  {
    id: 'ecommerce-recommendation-engine',
    title: 'Design an E-Commerce Real-Time Recommendation Engine',
    slug: 'ecommerce-recommendation-engine',
    tagline: 'Two-Tower deep neural retrieval, real-time user session feature stores, approximate nearest neighbor (ANN) vector search, and reranking.',
    category: 'Search & Big Data',
    difficulty: 'Advanced',
    readTime: '24 min read',
    scaleSummary: {
      dau: '100 Million Active Shoppers / 50 Million Products',
      qps: '80,000 Recommendation QPS / 1,000,000 Cart & Click Telemetry/sec',
      storage: '20 TB Vector Embeddings & Feature Store in Milvus/Redis',
      bandwidth: '10 GB/s Real-Time Serving'
    },
    overview: 'A personalized e-commerce recommendation engine dynamically recommends "Products You May Also Like" and "Frequently Bought Together" on product pages and homefeeds based on real-time browsing behavior, cart additions, and collaborative filtering embeddings.',
    keyChallenges: [
      'Sub-50ms Multi-Stage Recommendation Pipeline (Candidate Retrieval -> Filtering -> Heavy Deep Neural Ranking -> Business Rules)',
      'Real-Time In-Session Personalization: If a user clicks 3 mountain bikes, the next page load MUST reflect outdoor cycling recommendations immediately',
      'High-Dimensional Vector Search: Finding the top 500 nearest products from 50M items using HNSW / Milvus in < 15ms',
      'Cold Start Problem for New Products and New Guest Shoppers'
    ],
    functionalRequirements: [
      'Personalized homepage feed recommendations ("Recommended for You")',
      'Related item recommendations on product detail page ("Similar Items")',
      'Cart cross-sell recommendations ("Frequently Bought Together")',
      'Real-time ingestion of clicks, adds-to-cart, and search queries'
    ],
    nonFunctionalRequirements: [
      'Serving latency < 50ms (P99)',
      'High availability 99.99% (fallback to trending products on model failure)',
      'Recommendation freshness < 3 seconds after user interaction'
    ],
    outOfScope: ['Automated ad bidding PPC auction pricing'],
    capacityEstimations: {
      assumptions: [
        '100M active shoppers; 50M products in catalog',
        'Item Embedding: 256 float32 dimensions = 1 KB per product -> 50M * 1 KB = 50 GB Vector Index',
        '80,000 recommendation requests/sec peak'
      ],
      metrics: [
        { label: 'Recommendation QPS', value: '80,000 QPS', formula: 'Peak page view recommendations', description: 'Triton GPU & Vector Search' },
        { label: 'Vector Index Size', value: '50 GB RAM', formula: '50M products * 256-dim embeddings in HNSW', description: 'Milvus / FAISS RAM footprint' }
      ],
      conclusion: 'A Two-Tower neural model separating Item Embeddings (offline/cached) from User Query Embeddings (real-time GPU) is required.'
    },
    architecture: {
      summary: 'User clicks stream to Kafka -> Flink updates Real-Time Feature Store (Redis) -> Recommendation Orchestrator generates User Embedding -> Vector DB (Milvus) retrieves top 500 candidates via ANN -> Deep Ranking Model scores candidates -> Business Filter ensures diversity -> Return Top 10 items.',
      nodes: [
        { id: 'client', label: 'Shopper App', type: 'client', x: 8, y: 50, description: 'Browses products & views recommendations' },
        { id: 'gateway', label: 'API Gateway', type: 'gateway', x: 26, y: 50, description: 'Proxies request to Rec Orchestrator', techStack: ['Envoy'] },
        { id: 'rec_srv', label: 'Recommendation Orchestrator', type: 'service', x: 48, y: 50, description: 'Coordinates candidate generation & ranking', techStack: ['Go / Java'] },
        { id: 'feature_store', label: 'Real-Time Feature Store', type: 'cache', x: 48, y: 15, description: 'Last 10 clicked categories & user profile', techStack: ['Redis / Feast'] },
        { id: 'vector_db', label: 'Vector ANN Index (Milvus)', type: 'search', x: 72, y: 30, description: 'Indexes 50M product embeddings via HNSW', techStack: ['Milvus / Pinecone'] },
        { id: 'ranking_gpu', label: 'Deep Ranking Engine (Triton)', type: 'worker', x: 72, y: 70, description: 'Cross-Network Neural Model scores candidates', techStack: ['PyTorch / NVIDIA Triton'] },
        { id: 'catalog_db', label: 'Product Catalog DB', type: 'database', x: 92, y: 50, description: 'Hydrates prices, stock, and images', techStack: ['PostgreSQL / Cassandra'] }
      ],
      edges: [
        { id: 'e1', from: 'client', to: 'gateway', label: '1. GET /rec/home', protocol: 'HTTPS' },
        { id: 'e2', from: 'gateway', to: 'rec_srv', label: '2. Request Recs', protocol: 'Internal RPC' },
        { id: 'e3', from: 'rec_srv', to: 'feature_store', label: '3. Fetch User Features', protocol: 'TCP' },
        { id: 'e4', from: 'rec_srv', to: 'vector_db', label: '4. Query 500 Nearest Vectors', protocol: 'gRPC' },
        { id: 'e5', from: 'rec_srv', to: 'ranking_gpu', label: '5. Deep Score Candidates', protocol: 'gRPC' },
        { id: 'e6', from: 'rec_srv', to: 'catalog_db', label: '6. Hydrate Top 10 Details', protocol: 'SQL' }
      ],
      flowSteps: [
        { step: 1, title: 'Feature Retrieval & Query Embedding', description: 'Orchestrator pulls user recent browsing history (last 5 items viewed in session) from Redis and converts user context into a 256-dim embedding vector.', activeNodes: ['rec_srv', 'feature_store'], highlightDetails: 'Session features update in < 500ms after user clicks.', latencyEstimate: '5ms' },
        { step: 2, title: 'Candidate Generation via HNSW Vector Search', description: 'Milvus performs Approximate Nearest Neighbor (ANN) search over 50M product vectors, returning 500 candidate products in 8ms.', activeNodes: ['rec_srv', 'vector_db'], highlightDetails: 'Cosine similarity on HNSW graph.', latencyEstimate: '8ms' },
        { step: 3, title: 'Deep Neural Ranking & Business Filtering', description: 'Triton GPU scores 500 candidates for Probability(Purchase), filters out out-of-stock items, applies category diversity rules, and returns Top 10 products.', activeNodes: ['rec_srv', 'ranking_gpu', 'catalog_db', 'client'], highlightDetails: 'End-to-end recommendation served in < 35ms.', latencyEstimate: '20ms' }
      ]
    },
    apiDesign: [
      {
        method: 'GET',
        path: '/api/v1/recommendations/homepage?user_id=usr_982',
        description: 'Get personalized product recommendations',
        responseBody: '{\n  "recommendations": [\n    {\n      "product_id": "prod_8819",\n      "title": "Gravel Bike Helmet",\n      "price": 89.99,\n      "score": 0.94\n    }\n  ]\n}'
      }
    ],
    databaseDesign: [
      {
        tableName: 'product_embeddings',
        type: 'Search',
        shardingKey: 'product_id',
        fields: [
          { name: 'product_id', type: 'VARCHAR(32)', isPrimary: true },
          { name: 'embedding', type: 'ARRAY<FLOAT>(256)' },
          { name: 'category_id', type: 'INT' },
          { name: 'in_stock', type: 'BOOLEAN' }
        ],
        notes: 'Milvus vector index using HNSW M=16, efConstruction=200.'
      }
    ],
    deepDives: [
      {
        title: 'The Two-Tower Neural Network Architecture',
        subtitle: 'How modern AI systems separate user and item representations for real-time serving',
        content: `Why naive deep learning is too slow at runtime:\nEvaluating a complex 50-layer neural network between 1 user and 50,000,000 products on every click would require 50 Million neural network forward passes (taking minutes per request).\n\nTwo-Tower Solution:\n1. Item Tower (Offline): Generates and indexes 256-dimensional embeddings for all 50M products offline in background batch jobs.\n2. User Tower (Online): Takes user real-time features (device, location, recent clicks) and computes 1 single 256-dim User Vector in < 2ms.\n3. Inner Product (Dot Product): The predicted affinity score is simply DotProduct(User_Vector, Item_Vector)!\n4. Vector DB (Milvus/FAISS) computes nearest dot products across 50M items in < 10ms using HNSW graphs.`,
        keyTakeaways: [
          'Decouples offline item computation from fast online query inference.',
          'Enables sub-20ms candidate retrieval from 50 Million items.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Vector DB CPU Saturation during Traffic Spikes',
        impact: 'ANN search latency spikes from 8ms to 200ms.',
        mitigation: 'Cache the Top 100 candidate product IDs in Redis for common user persona clusters (e.g. "Male_Tech_Shopper_25-34") with a 30-minute TTL.'
      }
    ],
    interviewQA: [
      {
        question: 'How do you handle the "Filter Bubble" where users are only recommended items identical to what they just viewed?',
        hint: 'Exploration vs Exploitation (Epsilon-Greedy / Multi-Armed Bandits).',
        goodAnswer: 'Introduce an Exploration Stage (e.g. 10% epsilon-greedy or Multi-Armed Bandits) that injects popular or serendipitous items from adjacent categories into the final reranking stage, measuring if the user engages with novel item domains.',
        pitfalls: 'Only relying on nearest neighbor similarity without diversity constraints.'
      }
    ],
    similarSystems: ['Amazon Recommendations', 'Alibaba Taobao Recs', 'Pinterest Visual Search', 'Netflix Recommendations'],
    tags: ['Two-Tower Model', 'Vector Search', 'Milvus', 'HNSW', 'Feature Store']
  },
  {
    id: 'stock-exchange-matching-engine',
    title: 'Design a High-Frequency Stock Exchange & Order Matching Engine',
    slug: 'stock-exchange-matching-engine',
    tagline: 'Ultra-low microsecond latency order matching, LMAX Disruptor ring buffer, limit order book (LOB), and deterministic audit logging.',
    category: 'Financial & High Throughput',
    difficulty: 'Advanced',
    readTime: '26 min read',
    scaleSummary: {
      dau: '500,000 Active Traders / 10,000 Tickers',
      qps: '1,000,000 Order Messages / sec (Microsecond P99 Latency)',
      storage: '100% Deterministic Sequential Journal (Zero data loss)',
      bandwidth: '20 GB/s Multicast UDP Market Data Feed'
    },
    overview: 'A financial stock exchange matching engine processes Limit and Market Buy/Sell orders for equity symbols (e.g. AAPL, GOOG). The system requires deterministic price-time priority execution (FIFO), sub-10 microsecond matching latency, and high-speed UDP market data multicast.',
    keyChallenges: [
      'Microsecond Execution Latency: P99 latency must be < 15 microseconds (Java GC pauses and OS context switches are intolerable)',
      'Price-Time Priority (FIFO): Orders at the same price level MUST execute in strict arrival timestamp order',
      'Lock-Free Single-Threaded Architecture (LMAX Disruptor Pattern)',
      'High-Speed Market Data Dissemination (ITCH / OUCH Binary Protocols over UDP Multicast)'
    ],
    functionalRequirements: [
      'Submit Limit Orders (Buy/Sell at specific price) and Market Orders (Buy/Sell at best available price)',
      'Cancel and modify active working orders',
      'Match incoming orders against Limit Order Book (LOB) using Price-Time Priority',
      'Broadcast Level 2 Market Data depth feeds (Top 10 bids/asks) to market participants',
      'Generate trade execution confirmations and settlement trade reports'
    ],
    nonFunctionalRequirements: [
      'Ultra Low Latency: Order execution latency < 10 microseconds (µs)',
      'Deterministic Execution: Replaying journal input log reproduces identical trade outputs',
      'Zero Data Loss: Every order written to sequential NVMe journal before matching',
      'High Availability: Hot-Standby replica with zero-downtime failover'
    ],
    outOfScope: ['Post-trade physical paper certificate delivery settlement (T+1 clearing house)'],
    capacityEstimations: {
      assumptions: [
        '1 Million order messages/sec peak during market open (9:30 AM EST)',
        'Binary order struct: 64 bytes (order_id, symbol_id, price, qty, side, timestamp)',
        'Sequential Journal Ingress = 1M * 64 bytes = 64 MB/sec (sequential disk I/O on NVMe SSD)'
      ],
      metrics: [
        { label: 'Order Execution Latency', value: '< 10 µs', formula: 'In-memory single-threaded matching loop', description: 'Sub-10 microsecond execution' },
        { label: 'Throughput', value: '1,000,000 orders/s', formula: 'Single-thread core processing with LMAX Disruptor', description: 'Lock-free ring buffer' }
      ],
      conclusion: 'A single-threaded, lock-free CPU core per stock symbol running in C++ or zero-GC Java (Disruptor) is mandatory.'
    },
    architecture: {
      summary: 'Traders send FIX/OUCH binary orders over 10GbE network -> Gateway assigns sequential sequence number and writes to NVMe Sequential Journal -> Pushes to Lock-Free Ring Buffer (LMAX Disruptor) -> Single-Threaded Matching Engine matches against Limit Order Book (B-Tree + Doubly Linked List) -> Publishes trades via UDP Multicast (ITCH).',
      nodes: [
        { id: 'trader', label: 'Trading Firm (HFT / Broker)', type: 'client', x: 8, y: 50, description: 'Sends binary FIX / OUCH orders' },
        { id: 'gateway', label: 'Order Entry Gateway', type: 'gateway', x: 28, y: 50, description: 'Assigns sequence number & performs pre-trade risk', techStack: ['C++ / Kernel Bypass (Solarflare DPDK)'] },
        { id: 'journal', label: 'Sequential NVMe Journal', type: 'storage', x: 50, y: 15, description: 'Append-only raw order log (Zero data loss)', techStack: ['Direct NVMe I/O (O_DIRECT)'] },
        { id: 'disruptor', label: 'Lock-Free Ring Buffer', type: 'queue', x: 50, y: 50, description: 'LMAX Disruptor inter-thread queue', techStack: ['Memory-Mapped Ring Buffer'] },
        { id: 'matching_core', label: 'Matching Engine Core', type: 'worker', x: 75, y: 50, description: 'Single-threaded CPU pinned core per ticker', techStack: ['C++ Order Book (B-Tree + Doubly Linked List)'] },
        { id: 'multicast', label: 'Market Data UDP Multicast', type: 'service', x: 92, y: 50, description: 'Broadcasts ITCH Level 2 depth feeds', techStack: ['UDP Multicast (ITCH protocol)'] }
      ],
      edges: [
        { id: 'e1', from: 'trader', to: 'gateway', label: '1. Binary Order (OUCH)', protocol: 'TCP' },
        { id: 'e2', from: 'gateway', to: 'journal', label: '2. Append to Disk Journal', protocol: 'Internal RPC' },
        { id: 'e3', from: 'gateway', to: 'disruptor', label: '3. Push to Ring Buffer', protocol: 'Internal RPC' },
        { id: 'e4', from: 'disruptor', to: 'matching_core', label: '4. Pop Order Event', protocol: 'Internal RPC' },
        { id: 'e5', from: 'matching_core', to: 'multicast', label: '5. Broadcast Executed Trade', protocol: 'TCP' },
        { id: 'e6', from: 'matching_core', to: 'trader', label: '6. Order ACK / Fill', protocol: 'TCP' }
      ],
      flowSteps: [
        { step: 1, title: 'Kernel Bypass Ingestion & Risk Check', description: 'Order arrives over 10GbE network. Solarflare DPDK / Solarflare Onload kernel-bypass driver copies packet straight to user space RAM, bypassing OS kernel context switches.', activeNodes: ['trader', 'gateway'], highlightDetails: 'Cuts network latency from 50µs to 1.2µs.', latencyEstimate: '1.2 µs' },
        { step: 2, title: 'Sequential NVMe Journaling', description: 'Gateway appends order to an append-only NVMe journal file with fsync. Guarantees 100% crash recovery replayability.', activeNodes: ['gateway', 'journal'], highlightDetails: 'Sequential SSD writes take < 2 µs.', latencyEstimate: '2 µs' },
        { step: 3, title: 'Single-Threaded Lock-Free Matching', description: 'Matching engine core (pinned to dedicated CPU core #4) pops order from Ring Buffer. It walks the Limit Order Book (B-Tree of Price levels, each containing a FIFO Doubly Linked List of Orders) and executes the trade.', activeNodes: ['disruptor', 'matching_core'], highlightDetails: 'Zero locks, zero mutexes, zero context switches.', latencyEstimate: '1.5 µs' },
        { step: 4, title: 'UDP Multicast Trade Dissemination', description: 'Engine formats binary ITCH trade message and broadcasts over UDP Multicast to all market participant trading desks simultaneously.', activeNodes: ['matching_core', 'multicast', 'trader'], highlightDetails: 'Sub-microsecond market data broadcast.', latencyEstimate: '1.8 µs' }
      ]
    },
    apiDesign: [
      {
        method: 'POST',
        path: '/v1/orders/enter',
        description: 'Enter new Limit Buy order (OUCH Protocol Binary Spec)',
        requestBody: '{\n  "symbol": "AAPL",\n  "side": "BUY",\n  "price": 185.50,\n  "shares": 100,\n  "time_in_force": "DAY"\n}',
        responseBody: '{\n  "order_token": "ord_8829102",\n  "status": "FILLED",\n  "executed_price": 185.50,\n  "executed_shares": 100\n}'
      }
    ],
    databaseDesign: [
      {
        tableName: 'order_book_memory_struct',
        type: 'NoSQL Key-Value',
        shardingKey: 'symbol',
        fields: [
          { name: 'price_level', type: 'INT', isPrimary: true, notes: 'Integer cents (e.g. 18550)' },
          { name: 'head_order_ptr', type: 'POINTER', notes: 'FIFO Doubly Linked List of resting orders' },
          { name: 'total_volume', type: 'BIGINT' }
        ],
        notes: 'In-memory C++ cache-line aligned B-Tree struct.'
      }
    ],
    deepDives: [
      {
        title: 'The Limit Order Book (LOB) Data Structure: B-Tree + Doubly Linked List',
        subtitle: 'How to achieve O(1) order cancellation, insertion, and matching',
        content: `A Limit Order Book must support 3 critical operations:\n1. Insert Order: O(1) if price level exists; O(log P) to insert new price level.\n2. Cancel Order: Must be STRICTLY O(1) (Traders cancel millions of orders/sec when price moves).\n3. Match Order: O(1) at top of book.\n\nOptimal Data Structure:\n- Price Levels Map: A balanced B-Tree (or sparse array) mapping Price -> PriceLevel pointer.\n- Order Queue per Price Level: A Doubly Linked List of Orders (Head = oldest order, Tail = newest order).\n- Global Order Lookup Hash Map: Maps order_id -> Direct memory pointer to Order node in the doubly linked list.\n\nWhy this is unbeatable:\n- Cancel Order: Hash map resolves pointer in O(1); node removes itself from doubly linked list in O(1) (node->prev->next = node->next)! Zero list traversal needed!`,
        keyTakeaways: [
          'Doubly linked list allows O(1) cancellations at any depth of the book.',
          'Price levels are stored as integers to eliminate float rounding errors.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'OS Context Switches and Thread Lock Contention',
        impact: 'A POSIX mutex lock contention stalls execution by 5 to 50 microseconds.',
        mitigation: 'LMAX Disruptor Pattern: Single-threaded execution loop pinned to isolated CPU core (isolcpus=4) using lock-free ring buffers with CPU cache-line padding (preventing False Sharing in L1/L2 cache).'
      }
    ],
    interviewQA: [
      {
        question: 'Why is a single-threaded matching engine faster than a 64-thread multi-threaded matching engine for a single stock?',
        hint: 'Cache coherency and CPU cache-line bouncing (MESI protocol).',
        goodAnswer: 'In a multi-threaded engine, multiple threads modifying the same Order Book memory cause CPU cache-lines to constantly bounce across CPU core caches (MESI invalidation storm) and require mutex locks. A single thread pinned to 1 CPU core keeps the entire active Order Book in L1/L2 CPU cache (0.5ns latency) and eliminates all locking overhead.',
        pitfalls: 'Assuming more CPU threads always means faster execution.'
      }
    ],
    similarSystems: ['Nasdaq INET', 'NYSE Pillar', 'LMAX Exchange', 'Binance Matching Engine', 'Coinbase Engine'],
    tags: ['Matching Engine', 'LMAX Disruptor', 'Kernel Bypass', 'Limit Order Book', 'Low Latency']
  }
];
