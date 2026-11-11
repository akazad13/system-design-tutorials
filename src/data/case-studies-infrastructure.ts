import { CaseStudy } from '../types/system-design';

export const INFRASTRUCTURE_CASE_STUDIES: CaseStudy[] = [
  {
    id: 'google-web-crawler',
    title: 'Design Google Web Crawler & Distributed Search Indexer',
    slug: 'google-web-crawler',
    tagline: 'Crawl billions of web pages politely, avoid duplicates, and build the index that powers search.',
    category: 'Search & Big Data',
    difficulty: 'Advanced',
    readTime: '26 min read',
    scaleSummary: {
      dau: '5 Billion Daily Searches / 50 Billion Web Pages Indexed',
      qps: '150,000 Search QPS / 50,000 Pages Crawled/sec',
      storage: '30 Petabytes HTML and inverted index data',
      bandwidth: '25 GB/s (200 Gbps) Continuous Ingress'
    },
    overview: 'A web crawler finds, downloads and reads web pages. It pulls the links out of each page and adds them to a queue of pages to visit (the URL Frontier). It skips pages it has already seen, then builds an inverted index (a map from each word to the pages that contain it) so search queries can be answered quickly.',
    keyChallenges: [
      'Politeness: do not overload other websites. Obey robots.txt (a site\'s crawling rules) and limit how often each domain is fetched.',
      'Freshness: recrawl important, fast-changing pages (a news homepage) often and rarely changing pages (a dormant blog) much less often.',
      'Duplicates: detect pages with the same or nearly the same content among 50 billion pages, using fingerprints such as SimHash.',
      'Spider traps: avoid pages that generate endless links, such as a calendar page (/calendar?year=2026&month=9) that always links to the next month.'
    ],
    functionalRequirements: [
      'Start from seed URLs, fetch pages, and follow the links they contain.',
      'Parse the HTML, extract the text, and build an inverted index.',
      'Obey robots.txt rules and crawl delays.',
      'Remove duplicate URLs and duplicate content.',
      'Answer full-text search queries, ranked by BM25 (a text-match score) and PageRank (a link-based importance score).'
    ],
    nonFunctionalRequirements: [
      'Throughput: crawl about 50,000 pages per second, which is about 4 billion pages per day. At that rate the whole 50-billion-page index can be refreshed in under two weeks.',
      'Fault tolerance: if a crawler worker crashes, the frontier state must not be lost.',
      'Scalability: adding crawler workers should increase crawl speed.',
      'Search latency: under 200 ms at P99 (99% of queries are faster).'
    ],
    outOfScope: ['Crawling pages behind a login (the deep web).', 'Dark web (onion network) crawling.'],
    capacityEstimations: {
      assumptions: [
        'The index holds 50 billion web pages.',
        'An average page is 500 KB compressed, so 50B × 500 KB = 25 PB of page storage.',
        'The crawl rate is 50,000 pages/s sustained: 50,000 × 500 KB = 25 GB/s (200 Gbps).',
        'The inverted index takes about 5 PB compressed, stored in Bigtable or on SSDs.',
        'Total: 25 PB of pages + 5 PB of index = 30 PB for one copy, or 90 PB with 3 replicas.'
      ],
      metrics: [
        { label: 'Crawl Ingress Bandwidth', value: '200 Gbps', formula: '50,000 pages/sec * 500 KB average size', description: 'Network bandwidth the crawler needs' },
        { label: 'Indexed Web Pages', value: '50 Billion', formula: 'Global searchable page corpus', description: 'Pages stored and indexed in Bigtable' },
        { label: 'URL Frontier Queue Size', value: '100 Billion URLs', formula: 'Buffered unvisited hyperlinks', description: 'Unvisited links held in disk-backed queues' }
      ],
      conclusion: 'The URL Frontier needs two layers: priority queues (what to crawl next) and one politeness queue per host (when each host may be fetched again). Without the second layer, the crawler could flood a single website.'
    },
    architecture: {
      summary: 'Seed URLs go into the URL Frontier (priority and politeness queues). Fetcher workers pop URLs, look up the host IP in a DNS cache, and download the pages. The parser extracts text and links. A SimHash check removes duplicate content. New links go back to the frontier. Pages are stored in Bigtable, and a batch job builds the inverted index for the query engine.',
      nodes: [
        { id: 'seeds', label: 'Seed URLs & Sitemaps', type: 'service', x: 8, y: 30, description: 'Starting URLs and sitemaps' },
        { id: 'frontier', label: 'URL Frontier', type: 'queue', x: 28, y: 30, description: 'Decides which URL is crawled next and enforces a delay per domain', techStack: ['Kafka + RocksDB'] },
        { id: 'fetchers', label: 'Distributed Fetcher Workers', type: 'worker', x: 50, y: 30, description: 'Download web pages without blocking while they wait on the network', techStack: ['Go / C++ Async HTTP'] },
        { id: 'dns_cache', label: 'Dedicated DNS Cache Cluster', type: 'cache', x: 50, y: 10, description: 'Keeps domain-to-IP lookups in memory so fetchers skip slow DNS calls', techStack: ['Redis / BIND'] },
        { id: 'parser', label: 'HTML Parser & Text Extractor', type: 'service', x: 72, y: 30, description: 'Extracts text, metadata and links (<a href>) from the HTML', techStack: ['libxml2 / Rust'] },
        { id: 'dedup', label: 'Content Dedup (SimHash)', type: 'search', x: 92, y: 30, description: 'Finds duplicate pages by comparing 64-bit SimHash fingerprints', techStack: ['SimHash Index'] },
        { id: 'doc_store', label: 'Raw Page Store (Bigtable)', type: 'storage', x: 92, y: 70, description: 'Stores raw HTML and parsed text', techStack: ['Google Cloud Bigtable / GCS'] },
        { id: 'indexer', label: 'Inverted Index Builder (MapReduce)', type: 'worker', x: 68, y: 70, description: 'Builds posting lists (word to list of page IDs)', techStack: ['MapReduce / Apache Spark'] },
        { id: 'search_engine', label: 'Search Query Engine', type: 'service', x: 35, y: 70, description: 'Answers user queries and ranks results with PageRank', techStack: ['C++ Query Server'] }
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
        { step: 1, title: 'URL Frontier politeness scheduling', description: 'The frontier picks a URL for nytimes.com. The politeness queue checks that at least 500 ms have passed since the last fetch from that host, so the crawler does not overload the site.', activeNodes: ['frontier', 'fetchers'], highlightDetails: 'Priority (importance score) and politeness (one queue per host) are handled separately.', latencyEstimate: '5ms' },
        { step: 2, title: 'Asynchronous page fetching', description: 'The fetcher looks up the host IP in the local DNS cache, which avoids a DNS lookup of about 50 ms. It then downloads the page over HTTP with a 5-second timeout.', activeNodes: ['fetchers', 'dns_cache'], highlightDetails: 'Non-blocking I/O lets one worker keep thousands of downloads in flight at once.', latencyEstimate: '120ms' },
        { step: 3, title: 'Duplicate detection and link extraction', description: 'The parser extracts the body text and computes a 64-bit SimHash fingerprint. If a stored fingerprint differs by 3 bits or fewer (Hamming distance <= 3), the page is a near-duplicate and is dropped. The links it found go back to the URL Frontier.', activeNodes: ['parser', 'dedup', 'frontier', 'doc_store'], highlightDetails: 'The crawler does not store or index near-duplicate copies of the same content.', latencyEstimate: '20ms' },
        { step: 4, title: 'Building the inverted index', description: 'A MapReduce batch job reads all parsed pages and builds compressed posting lists (word to [DocID1, DocID2, ...]). Pages are ordered by a score that combines PageRank and BM25.', activeNodes: ['doc_store', 'indexer', 'search_engine'], highlightDetails: 'The query engine can look up a word in the index without scanning the 50 billion documents.', latencyEstimate: '10 mins (Batch)' }
      ]
    },
    apiDesign: [
      {
        method: 'GET',
        path: '/search?q=distributed+systems&page=1',
        description: 'Run a full-text search over the indexed pages',
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
        notes: 'Stored in Google Cloud Bigtable. Rows are keyed by reversed domain, so pages from one site sit next to each other and compress well.'
      }
    ],
    deepDives: [
      {
        title: 'The URL Frontier: priority queues plus politeness queues',
        subtitle: 'The two-layer queue that keeps a crawler polite and efficient',
        content: `A simple first-in-first-out queue would crawl millions of links from the first big site it finds (for example Wikipedia). That would overload that site and starve every other site.\n\nThe Mercator crawler solves this with two layers of queues:\n1. Front queues (what to crawl next):\n   - URLs enter one of several priority queues (F1 to FN), based on PageRank and how often the page changes.\n   - A high-priority URL, such as the CNN homepage, goes into a top-priority queue.\n2. Back queues (when to crawl):\n   - Each back queue (B1 to BK) holds URLs for one host at a time, in first-in-first-out order.\n   - A host-to-queue table records which back queue serves which host.\n   - A min-heap of (queue ID, next allowed time) tells the crawler which host may be fetched next.\n   - An idle fetcher pops the queue with the earliest next allowed time and fetches one page. It then puts that queue back in the heap with next allowed time = now + delay (for example 500 ms).\n\nResult: at most one request per host at a time, while thousands of different hosts are fetched in parallel.`,
        keyTakeaways: [
          'Front queues decide what to crawl next, based on importance.',
          'Back queues decide when to crawl next, based on how polite we must be to each host.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Spider traps (endless dynamic URLs)',
        impact: 'A site with /calendar?year=2026&month=9 links to the next month forever, so the crawler downloads an endless stream of useless pages.',
        mitigation: 'Cap the URL length, the number of query parameters and path depth, and the number of pages crawled per domain.'
      }
    ],
    interviewQA: [
      {
        question: 'How do you detect near-duplicate web pages (e.g., same article with different ads/timestamps)?',
        hint: 'SimHash and locality-sensitive hashing (LSH).',
        goodAnswer: 'Compute a 64-bit SimHash of the page text, with each word weighted (for example by TF-IDF). Near-duplicate pages get fingerprints that differ by only a few bits (Hamming distance of 3 or less). To find matches fast, split the fingerprint into 4 blocks of 16 bits and keep a lookup table per block. Any fingerprint within 3 bits of another must match it exactly in at least one block, so a lookup returns a small set of candidates. Then compare the full fingerprints of those candidates.',
        pitfalls: 'Using MD5 or SHA-256. A cryptographic hash changes completely when one character changes, so it only finds exact copies.'
      }
    ],
    similarSystems: ['Bing Web Crawler', 'Common Crawl', 'Apache Nutch', 'Googlebot'],
    tags: ['URL Frontier', 'SimHash', 'Bigtable', 'MapReduce', 'Inverted Index']
  },
  {
    id: 'google-drive-dropbox',
    title: 'Design Google Drive / Dropbox (File Sync & Deduplication)',
    slug: 'google-drive-sync',
    tagline: 'Sync files across devices by splitting them into 4 MB chunks, storing each unique chunk once, and handling edit conflicts.',
    category: 'Storage & Infrastructure',
    difficulty: 'Advanced',
    readTime: '24 min read',
    scaleSummary: {
      dau: '500 Million Active Users',
      qps: '100,000 Sync QPS / 10,000 File Chunk Uploads/sec',
      storage: '100 Petabytes user files in S3',
      bandwidth: '40 GB/s Ingress & Egress'
    },
    overview: 'A cloud storage and sync service lets users upload files and open them on a laptop, phone and browser. When a file changes, the client uploads only the changed 4 MB chunks (blocks of the file). Each chunk is stored once under its SHA-256 hash (content-addressable storage), so identical chunks are never stored twice.',
    keyChallenges: [
      'Delta sync: if a user changes one sentence in a 2 GB file, upload only the changed 4 MB chunk, not the whole file. This works for edits that do not shift the rest of the file.',
      'Cross-user deduplication: if 100,000 users save the same 1 GB installer, store it once, using content-addressable storage (each chunk is stored under the hash of its content).',
      'Edit conflicts: two offline devices can edit the same document at the same time.',
      'Real-time notification: tell the other devices about a change quickly, over long-lived WebSocket or HTTP long-poll connections.'
    ],
    functionalRequirements: [
      'Upload, download and delete files and folders.',
      'Sync files between devices automatically in the background.',
      'Delta sync at chunk level: upload only the modified chunks.',
      'Keep file version history, with restore for 30 days.',
      'Share files and manage folder permissions.'
    ],
    nonFunctionalRequirements: [
      'Durability: 99.999999999% (11 nines), so files are not lost.',
      'Sync latency: a local edit reaches other devices in under 3 seconds.',
      'Bandwidth: save bandwidth with deduplication and compression.',
      'Availability: 99.99% for the API and sync servers.'
    ],
    outOfScope: ['Live multi-cursor document editing (as in Google Docs).'],
    capacityEstimations: {
      assumptions: [
        '500M registered users; 100M of them are daily active users who sync files.',
        'A user edits 5 files a day, so 100M × 5 = 500M edits per day. The average file is 10 MB (about 3 chunks of 4 MB).',
        'Storage: 500M users × 2 GB stored on average = 1 EB. The estimate assumes deduplication cuts this to about 100 PB.',
        'Delta sync uploads about 1 changed 4 MB chunk per edit: 500M chunks/day ≈ 5,800 chunks/s on average, 10,000 chunks/s at peak = 40 GB/s of ingress.',
        '100 PB is one deduplicated copy, before S3 replication.'
      ],
      metrics: [
        { label: 'Chunk Upload Rate', value: '10,000 chunks/s', formula: '500M edits/day * 1 changed 4 MB chunk = 5,800/s avg, ~1.7x peak', description: 'Chunk writes to object storage' },
        { label: 'Metadata QPS', value: '100,000 QPS', formula: 'Sync status and directory tree updates', description: 'Reads and writes to the PostgreSQL metadata database' },
        { label: 'Deduplication Ratio', value: '90% Savings', formula: '1 EB logical -> ~100 PB physical via content-addressable chunks', description: 'Storage saved by keeping each unique chunk once' }
      ],
      conclusion: 'Keep metadata (PostgreSQL) and file data (chunks in S3 or a similar content-addressable store) in separate systems. Metadata needs transactions and fast lookups. Chunks are large, never change, and are cheap to keep in object storage.'
    },
    architecture: {
      summary: 'The desktop client watches the local file system (FSEvents or inotify), splits a changed file into 4 MB chunks, and hashes each chunk with SHA-256. It asks the metadata service which hashes already exist, then uploads only the missing chunks directly to S3. It then commits the new file version in PostgreSQL. The Sync Service tells the user other devices, which download the new chunks.',
      nodes: [
        { id: 'client_laptop', label: 'Desktop Client (Mac/PC)', type: 'client', x: 8, y: 30, description: 'Runs the local chunking and sync engine' },
        { id: 'client_phone', label: 'Mobile App', type: 'client', x: 8, y: 70, description: 'Receives sync notifications and downloads changed chunks' },
        { id: 'gateway', label: 'API & Sync Gateway', type: 'gateway', x: 30, y: 50, description: 'Routes hash checks and sync connections', techStack: ['Envoy / Go'] },
        { id: 'sync_srv', label: 'Sync & Conflict Service', type: 'service', x: 55, y: 30, description: 'Tracks file versions and commits changes in order', techStack: ['Rust / Go'] },
        { id: 'meta_db', label: 'File Metadata Store', type: 'database', x: 80, y: 30, description: 'Holds directory trees, chunk maps and user quotas', techStack: ['PostgreSQL (Sharded)'] },
        { id: 'block_store', label: 'Chunk Storage (S3 / CAS)', type: 'storage', x: 80, y: 70, description: 'Stores immutable 4 MB chunks, each named by its SHA-256 hash', techStack: ['AWS S3 Standard'] },
        { id: 'notify_srv', label: 'Sync Notification Gateway', type: 'worker', x: 55, y: 70, description: 'Pushes sync events to connected devices over WebSockets', techStack: ['Redis Pub/Sub + WebSockets'] }
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
        { step: 1, title: 'Detect the change and split the file into chunks', description: 'The user edits presentation.pptx. The desktop client splits the 40 MB file into ten 4 MB chunks and computes a SHA-256 hash for each one (H1 to H10).', activeNodes: ['client_laptop'], highlightDetails: 'Only chunk 4 has a new hash. The other 9 chunks are unchanged.', latencyEstimate: '15ms' },
        { step: 2, title: 'Check which chunks the server already has', description: 'The client sends the list of 10 hashes to the Sync Service. The server checks its chunk registry and finds that 9 chunks already exist. It replies: upload only chunk 4 (H4_new).', activeNodes: ['client_laptop', 'gateway', 'sync_srv', 'meta_db'], highlightDetails: 'In this example 9 of 10 chunks are not uploaded, which saves bandwidth and storage.', latencyEstimate: '25ms' },
        { step: 3, title: 'Upload the new chunk to S3', description: 'The client uploads the single 4 MB chunk directly to S3, using a pre-signed URL from the server. The object key is the chunk hash, H4_new.', activeNodes: ['client_laptop', 'block_store'], highlightDetails: 'The key is the hash of the content, so a stored chunk never changes and identical chunks are stored once.', latencyEstimate: '350ms' },
        { step: 4, title: 'Commit the new version and notify other devices', description: 'The Sync Service writes version 2 in PostgreSQL, pointing to [H1, H2, H3, H4_new, H5 ... H10]. It then tells the user other devices to fetch H4_new.', activeNodes: ['sync_srv', 'meta_db', 'notify_srv', 'client_phone'], highlightDetails: 'The phone downloads one 4 MB chunk instead of the whole 40 MB file.', latencyEstimate: '200ms' }
      ]
    },
    apiDesign: [
      {
        method: 'POST',
        path: '/api/v1/files/verify-chunks',
        description: 'Ask which chunk hashes the server does not have yet',
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
          { name: 'chunk_hashes', type: 'JSONB', notes: 'Ordered list of the SHA-256 keys of the 4 MB chunks' },
          { name: 'size_bytes', type: 'BIGINT' },
          { name: 'updated_at', type: 'TIMESTAMP' }
        ],
        notes: 'PostgreSQL table with the immutable version history of each file (the chunk list for every version).'
      }
    ],
    deepDives: [
      {
        title: 'Conflict resolution: concurrent edits on several devices',
        subtitle: 'How a sync service keeps both versions when two devices edit the same file offline',
        content: `Scenario: a user edits report.docx on a laptop while offline on a plane. The same user also edits report.docx on an office desktop.\n\nWhen the laptop reconnects:\n1. The laptop tries to commit version 3, based on version 2.\n2. The server checks the metadata DB. The desktop already committed version 3 based on version 2, so the laptop commit is based on an out-of-date version. This is a conflict, found by an optimistic concurrency check.\n3. Resolution policy:\n   - The server saves the laptop's changes as a separate conflicted copy, for example "report (User's conflicted copy 2026-08-28).docx".\n   - Both versions are kept in full, so no edit is lost.\n   - The client shows a short notice that a conflicted copy was created.\n\nThe user then merges the two files by hand. Automatic merging is only safe for formats the service understands, so for binary files a conflicted copy is the standard approach.`,
        keyTakeaways: [
          'Check the base version on every commit (optimistic concurrency control). This stops one device from silently overwriting another.',
          'For binary files, creating a conflicted copy is the standard, safe approach.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Garbage collection of unreferenced chunks in S3',
        impact: 'When users delete old versions, a chunk may still be used by other files or users. Deleting it too early would corrupt those files.',
        mitigation: 'Keep a reference count per chunk. Increase it when a file version uses the chunk and decrease it when that version is deleted. A background sweeper deletes a chunk from S3 only when its count is 0 and has stayed at 0 for a grace period, so a chunk that a new upload is about to reference is not removed.'
      }
    ],
    interviewQA: [
      {
        question: 'Why fixed-size 4MB chunking vs variable-size content-defined chunking (Rabin Fingerprinting)?',
        hint: 'Inserting one byte at the start of a file shifts every fixed 4 MB boundary after it.',
        goodAnswer: 'With fixed-size chunks, inserting 1 byte at the start of a file shifts every chunk boundary, so all later chunks get new hashes and must be uploaded again. With content-defined chunking (CDC, for example Rabin fingerprints or FastCDC), a boundary is chosen where the file content matches a pattern. An insert changes only the chunks around it, and the rest keep the same hashes. The cost is more CPU work and chunks of varying size. Dropbox uses fixed 4 MB blocks, which is simple and works well for in-place edits. Backup tools such as restic use CDC.',
        pitfalls: 'Assuming fixed-size chunking is best for every kind of edit, including inserts near the start of a file.'
      }
    ],
    similarSystems: ['Dropbox', 'Box', 'OneDrive', 'iCloud Drive'],
    tags: ['Chunking', 'Deduplication', 'Content-Addressable Storage', 'S3', 'Delta Sync']
  },
  {
    id: 'distributed-rate-limiter',
    title: 'Design a Distributed Rate Limiter Service',
    slug: 'distributed-rate-limiter',
    tagline: 'Throttle API traffic with fast checks, using Redis sliding-window counters and a local cache at the gateway.',
    category: 'Storage & Infrastructure',
    difficulty: 'Intermediate',
    readTime: '18 min read',
    scaleSummary: {
      dau: '10 Billion API Requests / day',
      qps: '1,000,000 Requests/sec peak rate limiting checks',
      storage: '3.2 GB Redis in-memory sliding window counters',
      bandwidth: '5 GB/s Network Filter'
    },
    overview: 'A distributed rate limiter protects backend services from abuse, brute-force login attempts and overload. It limits requests per IP address, user ID or API key, and the check adds about a millisecond or less to each request.',
    keyChallenges: [
      'Speed: the check must take about 1 ms, so it does not become the bottleneck for every request.',
      'Race conditions: if 10 requests arrive at once, a read-then-update sequence can let all of them through. The check must be atomic (it runs as one indivisible step).',
      'Memory: track limits for 100M active keys without needing terabytes of RAM.',
      'Failure policy: decide whether to allow traffic (fail open) or block it (fail closed) when the Redis cluster is down.'
    ],
    functionalRequirements: [
      'Limit calls by IP, user ID or API token (for example 100 requests per minute).',
      'Return HTTP 429 Too Many Requests with a Retry-After header when the limit is exceeded.',
      'Support limit tiers (Free: 60 requests/min, Pro: 10,000 requests/min).',
      'Support bursts (token bucket) and smooth, steady traffic (leaky bucket).'
    ],
    nonFunctionalRequirements: [
      'Latency: the rate check takes under 1 ms at P99.',
      'Availability: 99.999%.',
      'Memory: under 32 bytes of counter data per tracked key.'
    ],
    outOfScope: ['Web application firewall (WAF) inspection, such as detecting SQL injection in request bodies.'],
    capacityEstimations: {
      assumptions: [
        '1 million requests per second at peak, each needing a rate check.',
        '100 million active users or tokens are tracked at once.',
        'A sliding window counter needs about 32 bytes per key (two integer counters).',
        '100M keys × 32 bytes = 3.2 GB for one copy, before replication. Real Redis keys carry extra overhead (the key name and internal structures), so treat 3.2 GB as a lower bound.'
      ],
      metrics: [
        { label: 'Evaluation QPS', value: '1,000,000 QPS', formula: 'Peak global gateway traffic', description: 'Throughput the Redis cluster must handle' },
        { label: 'Total Redis RAM', value: '3.2 GB RAM', formula: '100M keys * 32 bytes', description: 'Memory for all rate limit counters' }
      ],
      conclusion: 'About 10 Redis Cluster nodes can cover 1M checks per second if each handles about 100,000. A Lua script runs each check atomically in one round trip. Add nodes if load tests show a node cannot keep up.'
    },
    architecture: {
      summary: 'A request reaches the API gateway. The rate limit filter first checks a local ban list, then runs an atomic Lua script on the nearest Redis cluster. If the request is allowed, the gateway forwards it to the backend. If the limit is exceeded, the gateway returns HTTP 429 at once.',
      nodes: [
        { id: 'client', label: 'API Consumer', type: 'client', x: 8, y: 50, description: 'Sends HTTP requests with an API key' },
        { id: 'gateway', label: 'API Gateway (Envoy / Kong)', type: 'gateway', x: 35, y: 50, description: 'Runs the rate limit filter', techStack: ['Envoy / Nginx'] },
        { id: 'local_cache', label: 'Local Memory Tier (Caffeine)', type: 'cache', x: 35, y: 15, description: 'Blocks banned IPs locally for 60 seconds, without a Redis call', techStack: ['In-Memory RAM'] },
        { id: 'redis_cluster', label: 'Redis Rate Limiter Cluster', type: 'cache', x: 65, y: 50, description: 'Stores the sliding window counters', techStack: ['Redis 7 Cluster'], scaleMetric: 'Sub-millisecond Lua script' },
        { id: 'backend', label: 'Protected Backend Service', type: 'service', x: 92, y: 50, description: 'Core application logic', techStack: ['Microservices'] }
      ],
      edges: [
        { id: 'e1', from: 'client', to: 'gateway', label: '1. GET /api/v1/resource', protocol: 'HTTPS' },
        { id: 'e2', from: 'gateway', to: 'local_cache', label: '2. Check Local Blacklist', protocol: 'Internal RPC' },
        { id: 'e3', from: 'gateway', to: 'redis_cluster', label: '3. Eval Lua Script (Redis)', protocol: 'TCP' },
        { id: 'e4', from: 'gateway', to: 'backend', label: '4. If Allowed: Forward Request', protocol: 'Internal RPC' },
        { id: 'e5', from: 'gateway', to: 'client', label: 'If Exceeded: HTTP 429', protocol: 'HTTPS' }
      ],
      flowSteps: [
        { step: 1, title: 'Intercept the request at the gateway', description: 'The gateway extracts the identifier (for example rate_limit:user_42) and checks its local memory cache for an active ban.', activeNodes: ['client', 'gateway', 'local_cache'], highlightDetails: 'Repeat offenders are blocked without a network call to Redis.', latencyEstimate: '0.1ms' },
        { step: 2, title: 'Check the sliding window counter in Redis', description: 'The gateway runs a Lua script in Redis. It estimates the requests in the last minute from the previous window count (weighted by how much of that window still overlaps) plus the current window count. If the total is under the limit, it increments the counter and returns 1 (allowed).', activeNodes: ['gateway', 'redis_cluster'], highlightDetails: 'The script runs atomically in one network round trip, so concurrent requests cannot race.', latencyEstimate: '0.8ms' },
        { step: 3, title: 'Set response headers and route the request', description: 'The gateway adds X-RateLimit-Remaining: 42 and forwards the request to the backend.', activeNodes: ['gateway', 'backend'], highlightDetails: 'A rejected request gets 429 Too Many Requests with a Retry-After header (for example Retry-After: 12).', latencyEstimate: '0.1ms' }
      ]
    },
    apiDesign: [
      {
        method: 'GET',
        path: '/api/v1/data',
        description: 'A normal endpoint protected by the rate limiter',
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
        notes: 'Cached in gateway memory, so rule lookups do not need a database call.'
      }
    ],
    deepDives: [
      {
        title: 'Sliding window counter: a good balance of memory and accuracy',
        subtitle: 'Why it beats the fixed window and the sliding window log',
        content: `Three common algorithms:\n1. Fixed window: limit 100 requests per minute. A user can send 100 requests at 00:59 and 100 more at 01:01. Then 200 requests pass in 2 seconds, twice the limit.\n2. Sliding window log (a Redis sorted set): stores the timestamp of every request. It is exact, but memory grows with the number of requests in the window (for example 100,000 timestamps for one busy key).\n3. Sliding window counter (used by Cloudflare):\n   - Stores only 2 counters: the previous window count and the current window count.\n   - Estimate = Previous_Count × (1 - fraction of the current window already elapsed) + Current_Count.\n   - Memory is O(1) per key (about 32 bytes of counters).\n   - It is an approximation. It assumes the previous window's requests were spread evenly. In practice this is close enough.`,
        keyTakeaways: [
          'The sliding window counter uses a small, fixed amount of memory per key. The sliding window log grows with the request count.',
          'It greatly reduces the burst problem at window edges, though it is not exact.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Redis rate limiter cluster outage',
        impact: 'If Redis is down, every request that needs a rate check could fail, and the whole product could go down with it.',
        mitigation: 'Fail open: if a Redis call times out (for example after 5 ms), log an alert and let the request through, so a limiter failure does not take down customer traffic. The cost is that abuse is not limited during the outage. A coarse in-memory limit on each gateway can cover that gap.'
      }
    ],
    interviewQA: [
      {
        question: 'How do you handle rate limiting across multiple global cloud regions (US, EU, Asia)?',
        hint: 'Cross-region synchronization latency.',
        goodAnswer: 'Do not sync every counter across regions. A cross-region round trip often takes 100 ms or more, far above the 1 ms budget. Instead, run a rate limiter in each region and split the global quota between them (for example, of 1,000 requests/min: 400 for the US, 400 for the EU, 200 for Asia). Regions then sync their usage in the background in batches and can rebalance the quotas. The limit can be slightly exceeded between syncs.',
        pitfalls: 'Calling one central Redis in the US from European servers on every request.'
      }
    ],
    similarSystems: ['Cloudflare Rate Limiting', 'Kong Rate Limiter', 'AWS WAF', 'Envoy Ratelimit'],
    tags: ['Redis Lua', 'Sliding Window Counter', 'Token Bucket', 'API Gateway', 'Envoy']
  },
  {
    id: 'notification-system',
    title: 'Design a Scalable Distributed Notification System',
    slug: 'notification-platform',
    tagline: 'Send alerts to phones, SMS and email through one system, with priority queues, rate limits and digests.',
    category: 'Storage & Infrastructure',
    difficulty: 'Intermediate',
    readTime: '20 min read',
    scaleSummary: {
      dau: '1 Billion Notifications / day',
      qps: '50,000 Alerts/sec peak ingestion',
      storage: '182.5 TB / year notification log and user preferences',
      bandwidth: '25 MB/s Peak Network Egress'
    },
    overview: 'A notification platform sends transactional and promotional messages through iOS push (Apple APNs), Android push (Google FCM), SMS (Twilio) and email (SendGrid or SES). It also applies user preferences, removes duplicates, limits send rates, and groups many events into one digest.',
    keyChallenges: [
      'Provider differences: each vendor (APNs, FCM, Twilio, SendGrid) has its own speed, limits and failure modes, so hide them behind one interface.',
      'User preferences and Do Not Disturb (DND): hold back non-urgent alerts during a user quiet hours.',
      'Batching: combine "Alice liked your post", "Bob liked your post" and so on into one digest notification.',
      'Priorities: deliver one-time passcodes (OTP) within 3 seconds, while marketing messages can wait and are throttled.'
    ],
    functionalRequirements: [
      'Send alerts by push, SMS, email and an in-app notification center.',
      'Support priority levels (critical OTP vs marketing broadcast).',
      'Respect user channel preferences and unsubscribe settings.',
      'Group events into a digest over a time window (for example, likes every 15 minutes).',
      'Track delivery, open and bounce receipts.'
    ],
    nonFunctionalRequirements: [
      'OTP delivery in under 3 seconds at P99.',
      'Reliability: no transactional notification may be lost (deliver at least once).',
      'Scale: 1 billion messages per day.',
      'Rate limits so users are not spammed.'
    ],
    outOfScope: ['A drag-and-drop designer for rich marketing email templates.'],
    capacityEstimations: {
      assumptions: [
        '1 billion notifications/day: about 11,600/s on average and 50,000/s at peak.',
        'Mix: 70% push (APNs/FCM), 20% in-app, 8% email, 2% SMS.',
        'An average payload is 500 bytes.',
        'Logging every notification at 500 bytes = 500 GB/day (182.5 TB/year), one copy before replication. Peak egress = 50,000 × 500 bytes = 25 MB/s.'
      ],
      metrics: [
        { label: 'Ingestion QPS', value: '50,000 / sec', formula: 'Peak notification triggers', description: 'Messages per second entering the Kafka topic' },
        { label: 'Push Delivery Rate', value: '35,000 push/sec', formula: 'Concurrent APNs/FCM HTTP/2 streams', description: 'Push worker fleet sending over HTTP/2 connections' }
      ],
      conclusion: 'Use separate Kafka topics per priority, so a slow backlog of bulk email cannot delay critical SMS OTP codes.'
    },
    architecture: {
      summary: 'Internal services call the notification API. The API removes duplicates and checks user preferences in Redis, then routes the message to a Kafka topic by priority (high, medium or low). Channel workers (push, SMS, email) call APNs, FCM, Twilio and SendGrid. Delivery status is logged to Cassandra.',
      nodes: [
        { id: 'services', label: 'Internal Microservices', type: 'service', x: 8, y: 50, description: 'Order, auth and social services that trigger alerts' },
        { id: 'gateway', label: 'Notification API Service', type: 'service', x: 30, y: 50, description: 'Validates the request and removes duplicate events', techStack: ['Go / Node.js'] },
        { id: 'pref_cache', label: 'User Preferences (Redis)', type: 'cache', x: 30, y: 15, description: 'Holds opt-in channels, DND hours and device tokens', techStack: ['Redis'] },
        { id: 'kafka_high', label: 'High Priority Queue (OTP)', type: 'queue', x: 55, y: 25, description: 'Short, fast queue for auth codes and fraud alerts', techStack: ['Kafka'] },
        { id: 'kafka_low', label: 'Low Priority Queue (Marketing)', type: 'queue', x: 55, y: 75, description: 'Slower stream for marketing and promotional messages', techStack: ['Kafka'] },
        { id: 'push_workers', label: 'Push Workers (APNs/FCM)', type: 'worker', x: 80, y: 20, description: 'Keeps a pool of HTTP/2 connections to Apple and Google', techStack: ['Go Workers'] },
        { id: 'sms_workers', label: 'SMS Workers (Twilio)', type: 'worker', x: 80, y: 50, description: 'Sends SMS through carrier aggregators', techStack: ['Twilio API'] },
        { id: 'email_workers', label: 'Email Workers (SES/SendGrid)', type: 'worker', x: 80, y: 80, description: 'Renders templates and sends email through SMTP or an API', techStack: ['AWS SES'] }
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
        { step: 1, title: 'Receive the event and remove duplicates', description: 'The auth service sends an OTP alert. The notification service checks Redis for an identical notification fingerprint in the last 60 seconds, which stops duplicate sends.', activeNodes: ['services', 'gateway'], highlightDetails: 'The dedup window avoids sending the same SMS twice, which would cost money and annoy the user.', latencyEstimate: '5ms' },
        { step: 2, title: 'Check preferences and pick channels', description: 'The service reads the user settings in Redis: push and SMS are on, and DND is off. It routes the OTP to the high-priority Kafka topic.', activeNodes: ['gateway', 'pref_cache', 'kafka_high'], highlightDetails: 'A Redis lookup is fast, so this check adds little delay.', latencyEstimate: '3ms' },
        { step: 3, title: 'Send the push over HTTP/2', description: 'A push worker takes the job and sends the payload to Apple APNs over a persistent TLS HTTP/2 connection.', activeNodes: ['kafka_high', 'push_workers'], highlightDetails: 'Reusing connections avoids a new TLS handshake for every message.', latencyEstimate: '150ms' }
      ]
    },
    apiDesign: [
      {
        method: 'POST',
        path: '/api/v1/notifications/send',
        description: 'Send a notification to a user',
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
        notes: 'PostgreSQL table of mobile push registration tokens.'
      }
    ],
    deepDives: [
      {
        title: 'Digests and debouncing',
        subtitle: 'Turning 50 separate "liked your post" alerts into one summary',
        content: `When a viral post gets 500 likes in 10 minutes, 500 separate push notifications annoy users and may make them turn notifications off.\n\nHow a digest works:\n1. When a social event occurs, do not send a push right away. Add the event to a Redis sorted set keyed by user_id and post_id.\n2. Schedule a delay (for example 5 minutes). Kafka has no built-in delayed delivery, so use a separate scheduler, a delay queue such as RabbitMQ with message TTL, or a job that scans for digests that are due.\n3. When the timer fires, a worker reads and removes all events from the sorted set. Suppose the count is 42 likes.\n4. It renders one message, "Alice and 41 others liked your photo", and sends a single push.`,
        keyTakeaways: [
          'One digest replaces many notifications, so users see less noise.',
          'Redis can read and clear the set in one atomic step (a transaction or Lua script), so concurrent likes are not lost.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Apple APNs or Google FCM outage or rate limit',
        impact: 'The push vendor rejects requests with HTTP 429 (too many requests) or 503 (service unavailable).',
        mitigation: 'Retry with exponential backoff plus jitter (a random delay). Send jobs that keep failing to a dead-letter queue (DLQ) for review. For critical OTP codes, fall back to SMS after 20 seconds.'
      }
    ],
    interviewQA: [
      {
        question: 'How do you prevent sending marketing push notifications in the middle of the night (User Timezone DND)?',
        hint: 'Timezone-aware scheduling.',
        goodAnswer: 'Store each user timezone in the profile as an IANA name such as America/New_York, not a fixed offset, so daylight saving time is handled. For a campaign set for 10:00 AM local time, compute each user delivery time in UTC (UTC = local time minus the timezone offset) and put the job in a time-bucketed queue.',
        pitfalls: 'Sending to every user at 10:00 AM Pacific time at once.'
      }
    ],
    similarSystems: ['Braze', 'OneSignal', 'Airship', 'AWS Pinpoint'],
    tags: ['APNs/FCM', 'Priority Queues', 'Kafka', 'Notification Digest', 'Twilio']
  },
  {
    id: 'snowflake-id-generator',
    title: 'Design a Distributed Unique ID Generator (Twitter Snowflake)',
    slug: 'distributed-id-generator',
    tagline: 'Generate unique 64-bit IDs that sort by time, at 1,000,000 IDs per second, with no coordination between servers for each ID.',
    category: 'Storage & Infrastructure',
    difficulty: 'Intermediate',
    readTime: '16 min read',
    scaleSummary: {
      dau: '10 Billion IDs generated / day',
      qps: '1,000,000 IDs/sec peak generation throughput',
      storage: '64-bit integer format (8 bytes per ID)',
      bandwidth: '8 MB/s Network Payload'
    },
    overview: 'A distributed ID generator creates unique 64-bit IDs on many servers at once. The IDs sort roughly by creation time (k-sorted, meaning nearly in order), and they fit in a standard 64-bit database key (BIGINT).',
    keyChallenges: [
      'No central lock: generate IDs without a shared database counter (auto-increment) that every server must wait on.',
      'Time order: an ID created later should be larger. This is exact within one server. Across servers, clocks differ slightly, so the order is only approximate.',
      'Clock problems: if a server clock moves backward (for example after an NTP correction), the server must not create duplicate IDs.',
      'Worker ID assignment: give each server a unique 10-bit worker ID, even when containers start and stop automatically.'
    ],
    functionalRequirements: [
      'Generate globally unique 64-bit integer IDs.',
      'IDs sort roughly by creation time.',
      'Support up to 1,024 worker nodes (the limit of a 10-bit worker ID).',
      'Generate more than 1,000,000 unique IDs per second across the cluster.'
    ],
    nonFunctionalRequirements: [
      'Generation takes under 1 microsecond, because it happens in memory.',
      'Availability: 99.999%, with no single point of failure for generating IDs.',
      'Compact: exactly 64 bits, so the ID fits in a SQL BIGINT.'
    ],
    outOfScope: ['128-bit random UUIDv4 strings.'],
    capacityEstimations: {
      assumptions: [
        '10 billion IDs per day: about 115,000 IDs/s on average and 1M IDs/s at peak.',
        'A 64-bit integer takes 8 bytes.'
      ],
      metrics: [
        { label: 'Max ID Generation Rate', value: '4,194,304 IDs/ms', formula: '1,024 nodes * 4,096 sequence numbers per ms', description: 'Theoretical limit: 1,024 workers × 4,096 IDs per ms is about 4.2 million IDs per ms' },
        { label: 'Lifetime Span', value: '69.7 Years', formula: '41 bits = 2^41 milliseconds', description: 'How long the timestamp lasts before it overflows' }
      ],
      conclusion: 'The 64-bit Snowflake format is far more than this system needs. One worker can make up to 4,096 IDs per millisecond, and the timestamp lasts about 69 years from the chosen start date (epoch).'
    },
    architecture: {
      summary: 'A Snowflake ID has 1 sign bit, a 41-bit timestamp in milliseconds, a 10-bit worker ID and a 12-bit sequence number. Each worker claims its worker ID at startup through a ZooKeeper or etcd lease.',
      nodes: [
        { id: 'client', label: 'App Services', type: 'service', x: 10, y: 50, description: 'Calls the Snowflake generator that runs inside the same process' },
        { id: 'snowflake_node', label: 'Snowflake Worker Instance', type: 'worker', x: 45, y: 50, description: 'Combines the timestamp, worker ID and sequence number in memory with bit shifts', techStack: ['Go / Rust / Java'] },
        { id: 'zookeeper', label: 'Worker ID Coordinator', type: 'database', x: 80, y: 50, description: 'Holds leases for the 10-bit worker IDs (0 to 1023)', techStack: ['ZooKeeper / etcd'] }
      ],
      edges: [
        { id: 'e1', from: 'snowflake_node', to: 'zookeeper', label: 'Acquire Worker ID (e.g. Node 42)', protocol: 'Internal RPC' },
        { id: 'e2', from: 'client', to: 'snowflake_node', label: 'Generate ID (0.001ms)', protocol: 'Internal RPC' }
      ],
      flowSteps: [
        { step: 1, title: 'Claim a worker ID', description: 'At startup, the worker claims a free worker ID between 0 and 1023 through a ZooKeeper node (or an etcd lease). The node disappears if the worker dies, so the ID can be reused.', activeNodes: ['snowflake_node', 'zookeeper'], highlightDetails: 'No two live servers hold the same worker ID.', latencyEstimate: '20ms (Startup only)' },
        { step: 2, title: 'Generate the ID in memory', description: 'The app asks for an ID. The worker reads the current time in milliseconds since a custom start date (epoch). It also uses a 12-bit sequence number (0 to 4095) that counts the IDs made in the same millisecond and restarts at 0 in a new millisecond. It builds the ID with bit operations: (Timestamp << 22) | (WorkerID << 12) | Sequence.', activeNodes: ['snowflake_node', 'client'], highlightDetails: 'This takes a few CPU operations and no network call.', latencyEstimate: '< 0.001ms' }
      ]
    },
    apiDesign: [
      {
        method: 'GET',
        path: '/api/v1/id',
        description: 'Get the next unique 64-bit ID',
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
        notes: 'Registry of worker ID leases, kept in etcd or PostgreSQL.'
      }
    ],
    deepDives: [
      {
        title: 'Clock drift and backward clock changes: the Snowflake failure mode',
        subtitle: 'What happens if a server clock moves back by 10 milliseconds?',
        content: `If NTP (Network Time Protocol) moves a server clock backward, the worker may reuse a timestamp it already used a few milliseconds ago. It can then create duplicate IDs.\n\nDefenses:\n1. On every ID, compare the current time with the last timestamp used. If the current time is earlier:\n   - If the gap is small (for example under 5 ms), wait until the clock catches up.\n   - If the gap is larger, refuse to generate IDs and raise an alert. Another option is to claim a new worker ID, so new IDs cannot collide with earlier ones.\n2. Store the last timestamp on disk or in the coordinator, so a restarted worker also refuses to issue IDs until the clock passes that value.\n3. Configure NTP to adjust the clock gradually (slewing) instead of jumping it.`,
        keyTakeaways: [
          'Waiting out a small clock gap is simple and safe.',
          'Never ignore a backward clock jump in an ID generator.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'More than 4,096 IDs requested in a single millisecond on one node',
        impact: 'The 12-bit sequence counter overflows after 4,095.',
        mitigation: 'When the sequence reaches 4,096, wait for the next millisecond (while timestamp <= last_timestamp { timestamp = now() }) and reset the sequence to 0.'
      }
    ],
    interviewQA: [
      {
        question: 'Why is Snowflake ID (64-bit int) superior to UUIDv4 (128-bit string) as a database primary key?',
        hint: 'B+ tree index fragmentation.',
        goodAnswer: 'A UUIDv4 is 128 bits (16 bytes, double the 8 bytes of a Snowflake ID) and fully random. Random inserts land on random pages of a B+ tree index, which causes many page splits and random disk I/O, and this slows writes. Snowflake IDs are 64 bits and mostly increasing, so new rows go to the right-most leaf page. That page still splits when it fills, but far less often, and writes stay sequential. Time-ordered UUIDs such as UUIDv7 give the same benefit at 128 bits.',
        pitfalls: 'Claiming UUIDv4 has the same indexing performance as integer IDs.'
      }
    ],
    similarSystems: ['Sonyflake', 'Instagram ID Generator', 'UUIDv7', 'Segment KSUID'],
    tags: ['Snowflake ID', 'Bitwise Operations', 'ZooKeeper', 'B-Tree Indexing', 'Distributed Systems']
  },
  {
    id: 'webhook-delivery-system',
    title: 'Design a Distributed Webhook Delivery & Dispatch Service',
    slug: 'webhook-delivery-platform',
    tagline: 'Deliver events to customer HTTP endpoints reliably, with retries, a dead-letter queue and signed payloads.',
    category: 'Storage & Infrastructure',
    difficulty: 'Intermediate',
    readTime: '20 min read',
    scaleSummary: {
      dau: '500 Million Webhook Events / day',
      qps: '25,000 Deliveries/sec peak throughput',
      storage: '5 TB / month delivery attempt logs in ClickHouse',
      bandwidth: '50 MB/s Peak HTTP Egress'
    },
    overview: 'A webhook delivery service sends event notifications (such as payment.succeeded or order.created) as HTTPS POST requests to URLs that customers provide. It copes with slow or failing customer servers, retries with exponential backoff (growing delays), and signs each request with an HMAC so the receiver can verify it.',
    keyChallenges: [
      'Unreliable endpoints: customer servers are often slow, down or returning errors, so failure is normal.',
      'Worker exhaustion: a customer endpoint that takes 30 seconds to answer must not tie up workers and block other deliveries.',
      'Retry schedule: retry failed deliveries for up to 72 hours with growing gaps (for example 1 minute, 5 minutes, 30 minutes, 2 hours, 12 hours, then daily).',
      'Security: sign payloads with HMAC-SHA256 and defend against SSRF (server-side request forgery, where an attacker makes your server call internal addresses).'
    ],
    functionalRequirements: [
      'Register webhook URLs and subscribe them to event types.',
      'Sign every request with an HMAC-SHA256 signature in a header (Stripe uses Stripe-Signature).',
      'Retry failed deliveries with exponential backoff for up to 72 hours.',
      'Move permanently failing deliveries to a dead-letter queue (DLQ) and alert the customer.',
      'Give customers a dashboard with delivery attempt logs and a button to resend an event.'
    ],
    nonFunctionalRequirements: [
      'At-least-once delivery: an event may arrive more than once, so each event carries a unique ID that receivers can use to ignore duplicates.',
      'First delivery attempt within 500 ms of the event.',
      'SSRF protection: block internal IP ranges (127.0.0.1, 169.254.169.254, 10.0.0.0/8).',
      'Availability: 99.99%.'
    ],
    outOfScope: ['Two-way WebSocket tunnels.'],
    capacityEstimations: {
      assumptions: [
        '500M webhook events per day: about 5,800/s on average and 25,000/s at peak.',
        'Customer servers take 800 ms on average to respond.',
        'An average payload is about 2 KB of JSON: 25,000 × 2 KB = 50 MB/s of peak egress.'
      ],
      metrics: [
        { label: 'Dispatch QPS', value: '25,000 / sec', formula: 'Peak outgoing HTTP POST requests', description: 'Outgoing HTTP POST requests at peak' },
        { label: 'Concurrent HTTP Sockets', value: '20,000 Sockets', formula: '25,000 QPS * 0.8s response time', description: 'Open connections held by non-blocking I/O' }
      ],
      conclusion: 'The fleet must hold about 20,000 open connections at once, so use non-blocking I/O (Go, Node.js or Rust with Tokio). The 5-second timeout limits how long a slow endpoint can hold a connection.'
    },
    architecture: {
      summary: 'An internal service emits an event and the dispatcher queues it in Kafka. A dispatch worker checks the destination URL against the SSRF filter, signs the payload with HMAC, and sends the HTTP POST. If delivery fails, the event goes to a delayed retry queue.',
      nodes: [
        { id: 'service', label: 'Internal Business Service', type: 'service', x: 8, y: 50, description: 'Publishes payment or order events' },
        { id: 'kafka_events', label: 'Webhook Event Topic', type: 'queue', x: 30, y: 50, description: 'Buffers new outgoing events', techStack: ['Kafka'] },
        { id: 'dispatcher', label: 'Async HTTP Dispatch Workers', type: 'worker', x: 55, y: 50, description: 'Send HTTPS POSTs with non-blocking I/O and add the HMAC signature', techStack: ['Go / Rust Tokio'] },
        { id: 'customer_server', label: 'Customer Webhook Server', type: 'client', x: 85, y: 50, description: 'Receives the POST /webhook request' },
        { id: 'delayed_queue', label: 'Delayed Retry Queue', type: 'queue', x: 55, y: 80, description: 'Holds failed events until their next retry time (exponential backoff)', techStack: ['Kafka Delayed / RabbitMQ DLX'] },
        { id: 'log_db', label: 'Delivery Log Store (ClickHouse)', type: 'database', x: 55, y: 20, description: 'Stores status codes, latency and response bodies for each attempt', techStack: ['ClickHouse'] }
      ],
      edges: [
        { id: 'e1', from: 'service', to: 'kafka_events', label: '1. Publish Event', protocol: 'Async Queue', isAsync: true },
        { id: 'e2', from: 'kafka_events', to: 'dispatcher', label: '2. Consume Job', protocol: 'Internal RPC', isAsync: true },
        { id: 'e3', from: 'dispatcher', to: 'customer_server', label: '3. HTTPS POST (5s timeout)', protocol: 'HTTPS' },
        { id: 'e4', from: 'dispatcher', to: 'log_db', label: '4. Log Attempt (200 OK / 500)', protocol: 'SQL', isAsync: true },
        { id: 'e5', from: 'dispatcher', to: 'delayed_queue', label: '5. If Failed: Schedule Retry', protocol: 'Async Queue', isAsync: true }
      ],
      flowSteps: [
        { step: 1, title: 'Receive the event and sign it', description: 'The worker takes the event, looks up the customer shared webhook secret, and computes an HMAC-SHA256 signature over the timestamp and the JSON payload.', activeNodes: ['kafka_events', 'dispatcher'], highlightDetails: 'The signature goes in a header, so the receiver can check that the sender is genuine.', latencyEstimate: '1ms' },
        { step: 2, title: 'Check the URL for SSRF', description: 'The worker resolves the customer hostname. If the IP is in a private or internal range (10.0.0.0/8, 127.0.0.1, or 169.254.169.254, the cloud metadata address), the request is rejected at once.', activeNodes: ['dispatcher'], highlightDetails: 'This stops attackers from using your servers to probe your internal network.', latencyEstimate: '5ms' },
        { step: 3, title: 'Send the POST and schedule retries', description: 'The worker sends the HTTP POST with a 5-second timeout. If the customer server returns a 5xx error or times out, the worker puts the event in the delayed retry queue, with a short first delay (for example 1 minute).', activeNodes: ['dispatcher', 'customer_server', 'delayed_queue', 'log_db'], highlightDetails: 'Each retry waits longer than the last, up to 72 hours in total.', latencyEstimate: '800ms' }
      ]
    },
    apiDesign: [
      {
        method: 'POST',
        path: '/v1/webhook_endpoints',
        description: 'Register a new webhook URL',
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
        notes: 'Stored in ClickHouse so customers can inspect delivery attempts quickly.'
      }
    ],
    deepDives: [
      {
        title: 'SSRF (server-side request forgery) defense in webhook systems',
        subtitle: 'How an attacker can use a webhook URL to reach cloud credentials, and how to stop it',
        content: `A malicious user signs up and sets their webhook URL to http://169.254.169.254/latest/meta-data/iam/security-credentials/. When an event fires, your worker fetches the cloud metadata service and may send the temporary credentials of its own IAM role back to the attacker. Newer metadata versions such as AWS IMDSv2 make this harder, but you should not rely on them alone.\n\nDefense pipeline:\n1. Resolve the hostname to an IP address before opening the connection.\n2. Reject any IP in these ranges:\n   - 127.0.0.0/8 (loopback)\n   - 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 (private networks)\n   - 169.254.0.0/16 (link-local, including the cloud metadata service at 169.254.169.254)\n   - 0.0.0.0/8, and the IPv6 equivalents.\n3. Stop DNS rebinding: connect to the IP you just checked (pin it on the socket). Otherwise a malicious DNS server could return a public IP for the check and a private IP for the real connection.\n4. Do not follow HTTP redirects automatically. A public URL can redirect to an internal address, so check each redirect target the same way.`,
        keyTakeaways: [
          'Pinning the checked IP on the socket prevents DNS rebinding.',
          'Never send requests to customer-supplied URLs without strict IP checks.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'One failing customer endpoint creates a retry backlog',
        impact: 'A large customer server goes down and floods the retry queues with a huge number of failed events, which delays webhooks for other customers.',
        mitigation: 'Isolate retry queues per customer (per tenant), so one failing customer cannot slow down others. Also pause delivery to an endpoint that keeps failing (a circuit breaker) and resume it with a test request.'
      }
    ],
    interviewQA: [
      {
        question: 'Why must webhooks include a timestamp in the signature header?',
        hint: 'Replay attacks.',
        goodAnswer: 'Put the timestamp t in the signed data (for example t=1724000000,v1=HMAC(t + "." + payload)). The receiver rejects any webhook whose timestamp is older than a few minutes (for example 5), so an attacker cannot replay a captured request later. Inside that window, the receiver should also remember event IDs to catch repeats.',
        pitfalls: 'Signing only the payload body, without the timestamp.'
      }
    ],
    similarSystems: ['Stripe Webhooks', 'Svix', 'GitHub Webhooks', 'Hookdeck'],
    tags: ['HMAC Signature', 'SSRF Defense', 'Exponential Backoff', 'Kafka', 'ClickHouse']
  },
  {
    id: 'realtime-metrics-monitoring',
    title: 'Design a Real-Time Distributed Metrics & Monitoring System (Prometheus / Datadog)',
    slug: 'metrics-monitoring-platform',
    tagline: 'Collect millions of metric points per second, compress them with Gorilla encoding, query them with PromQL, and evaluate alert rules.',
    category: 'Search & Big Data',
    difficulty: 'Advanced',
    readTime: '24 min read',
    scaleSummary: {
      dau: '100,000 Monitored Servers & Services',
      qps: '10,000,000 Metric Data Points / sec',
      storage: '1.18 TB / day compressed Time-Series Data (13.8 TB raw)',
      bandwidth: '160 MB/s Raw Telemetry Stream'
    },
    overview: 'A monitoring platform collects millions of metric points per second (counters, gauges and histograms) from servers and containers. It compresses the time series with Gorilla delta-of-delta encoding, answers PromQL queries, and checks alert rules on a schedule.',
    keyChallenges: [
      'Ingestion: accept 10 million points per second without disk I/O becoming the bottleneck.',
      'High cardinality: every unique label combination (for example {service="api", pod="pod-99", user_id="123"}) is a separate time series. Millions of them can use up memory.',
      'Compression: shrink each 16-byte point (timestamp plus float64 value) to about 1.37 bytes, the average reported in the Facebook Gorilla paper.',
      'Alert evaluation: check 50,000 alert rules every 15 seconds over windows of recent data.'
    ],
    functionalRequirements: [
      'Ingest multi-dimensional metrics (metric name, labels, timestamp, value).',
      'Query time series with PromQL (rate, sum, P99 histogram quantile).',
      'Configurable retention: raw data 14 days, 1-minute rollups 90 days, 1-hour rollups 1 year.',
      'Evaluate alert rules written in PromQL and notify PagerDuty or Slack.'
    ],
    nonFunctionalRequirements: [
      'Query latency under 500 ms for a 7-day dashboard chart.',
      'Compression of more than 10x on disk and in memory.',
      'Availability: 99.99%.'
    ],
    outOfScope: ['Distributed tracing spans (OpenTelemetry, Jaeger).'],
    capacityEstimations: {
      assumptions: [
        '10M metric points are ingested per second.',
        'A raw point is a timestamp (8 bytes) plus a float64 value (8 bytes) = 16 bytes.',
        'Uncompressed: 10M × 16 bytes = 160 MB/s = 13.8 TB/day.',
        'With Gorilla compression (1.37 bytes per point), storage drops to 1.18 TB/day.',
        'Storage figures are for one copy, before replication.'
      ],
      metrics: [
        { label: 'Ingestion Throughput', value: '10,000,000 points/s', formula: 'Peak telemetry stream', description: 'Points per second through Kafka into the time-series store' },
        { label: 'Gorilla Compression Ratio', value: '11.6x Compression', formula: '16 bytes -> 1.37 bytes per point', description: 'Delta-of-delta for timestamps and XOR for values' }
      ],
      conclusion: 'Use a storage engine built for time series (ClickHouse, Prometheus TSDB or VictoriaMetrics). A general-purpose database would struggle with this write rate and would not compress the data as well.'
    },
    architecture: {
      summary: 'Agents scrape metric endpoints and push the points to Kafka. Flink computes rollups and downsampled data. A time-series database (ClickHouse, Prometheus TSDB or VictoriaMetrics) stores the points with Gorilla-style compression. The query service evaluates PromQL, and the alert evaluator checks rules and sends alerts through Alertmanager.',
      nodes: [
        { id: 'agents', label: 'Metric Exporters / Agents', type: 'worker', x: 8, y: 50, description: 'Scrapes the /metrics endpoint on about 100,000 servers' },
        { id: 'kafka', label: 'Metrics Ingestion Stream', type: 'queue', x: 30, y: 50, description: 'Buffers the 10M points per second', techStack: ['Kafka'] },
        { id: 'flink', label: 'Stream Aggregator (Flink)', type: 'worker', x: 55, y: 30, description: 'Computes 1-minute rollups and downsampled data', techStack: ['Apache Flink'] },
        { id: 'tsdb', label: 'Time-Series Store (ClickHouse / TSDB)', type: 'database', x: 75, y: 50, description: 'Stores Gorilla-compressed column blocks', techStack: ['ClickHouse / VictoriaMetrics'] },
        { id: 'query_srv', label: 'PromQL Query Engine', type: 'service', x: 92, y: 30, description: 'Runs the queries behind Grafana dashboards', techStack: ['Go PromQL Engine'] },
        { id: 'alertmanager', label: 'Alert Evaluator', type: 'service', x: 92, y: 70, description: 'Sends alerts to PagerDuty and Slack', techStack: ['Alertmanager'] }
      ],
      edges: [
        { id: 'e1', from: 'agents', to: 'kafka', label: '1. Push Metrics (gRPC)', protocol: 'gRPC' },
        { id: 'e2', from: 'kafka', to: 'flink', label: '2. Stream Points', protocol: 'Internal RPC', isAsync: true },
        { id: 'e3', from: 'kafka', to: 'tsdb', label: '3. Batch Insert', protocol: 'Internal RPC', isAsync: true },
        { id: 'e4', from: 'query_srv', to: 'tsdb', label: '4. Execute PromQL Query', protocol: 'SQL' },
        { id: 'e5', from: 'alertmanager', to: 'tsdb', label: '5. Poll Alert Rules (15s)', protocol: 'SQL' }
      ],
      flowSteps: [
        { step: 1, title: 'High-throughput push ingestion', description: 'Agents push batches of metric points to Kafka. Kafka partitions spread the write load across many brokers.', activeNodes: ['agents', 'kafka'], highlightDetails: 'Partitions let many producers write in parallel.', latencyEstimate: '2ms' },
        { step: 2, title: 'Gorilla delta-of-delta compression', description: 'The time-series store groups points into 2-hour blocks. It stores timestamps as a delta of deltas (for regular scrapes the delta of deltas is 0, which takes 1 bit). It stores values with XOR floating-point encoding.', activeNodes: ['tsdb'], highlightDetails: 'A 16-byte point shrinks to about 1.37 bytes on average (about 91% smaller).', latencyEstimate: '10ms' },
        { step: 3, title: 'PromQL querying', description: 'A user opens a Grafana dashboard. The query engine scans the columnar blocks in parallel and evaluates rate(http_requests_total[5m]).', activeNodes: ['query_srv', 'tsdb'], highlightDetails: 'Columnar storage lets the engine read only the columns and time ranges the query needs.', latencyEstimate: '120ms' }
      ]
    },
    apiDesign: [
      {
        method: 'POST',
        path: '/api/v1/query_range',
        description: 'Query a time series over a time range with PromQL',
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
        notes: 'ClickHouse MergeTree table, partitioned by month in this example (toYYYYMM(date)). At this ingest rate, daily partitions would also work and make dropping old data cheaper.'
      }
    ],
    deepDives: [
      {
        title: 'Gorilla time-series compression',
        subtitle: 'The Facebook technique that many time-series databases use or adapt',
        content: `Gorilla uses two techniques:\n1. Timestamps (delta-of-delta):\n   - Metrics usually arrive at a fixed interval (for example every 15 s). The gap between timestamps is constant: D = t_n - t_(n-1) = 15.\n   - The delta of deltas is D_n - D_(n-1) = 15 - 15 = 0.\n   - When it is 0, store a single bit, '0'.\n\n2. Values (XOR of floats):\n   - Most metrics change little between scrapes (for example CPU 42.1% to 42.2%).\n   - XOR the current float64 with the previous one: V_xor = V_n XOR V_(n-1).\n   - If the values are identical, V_xor = 0, and a single bit '0' is stored.\n   - If the values are close, V_xor has many leading and trailing zero bits. Store only the meaningful middle bits, with a short length prefix.\n\nResult: on Facebook data, a 16-byte point took an average of 1.37 bytes, a reduction of more than 11x.`,
        keyTakeaways: [
          'For regular scrapes, delta-of-delta turns an 8-byte timestamp into about 1 bit.',
          'XOR encoding works because consecutive values often share most of their bits.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'High cardinality (for example, user_id used as a metric label)',
        impact: 'Millions of unique time series overwhelm the in-memory index and can crash the server with out-of-memory (OOM) errors.',
        mitigation: 'Limit the number of series per metric (for example 10,000) and reject new series above the limit. Keep unbounded values such as user_id out of labels. Flink rollups reduce storage over time, but they do not reduce the number of series, so the limit is what protects memory.'
      }
    ],
    interviewQA: [
      {
        question: 'Pull (Prometheus) vs Push (Datadog/StatsD) architecture: which is better?',
        hint: 'Service discovery vs firewall traversal.',
        goodAnswer: 'Pull (Prometheus scrapes /metrics): the central server controls the scrape rate, and it sees a dead node at once because the scrape fails. It works well for static infrastructure and Kubernetes, where service discovery finds the targets. Push (agents send to a gateway): it suits short-lived jobs such as AWS Lambda functions and networks where the central server cannot open connections to the targets.',
        pitfalls: 'Calling one model better in every case without discussing the trade-offs.'
      }
    ],
    similarSystems: ['Prometheus', 'Datadog', 'VictoriaMetrics', 'Grafana Mimir', 'InfluxDB'],
    tags: ['Gorilla Compression', 'PromQL', 'Time-Series DB', 'ClickHouse', 'Flink']
  },
  {
    id: 'proximity-service-yelp',
    title: 'Design a Proximity Service / Yelp (Nearby Places Search)',
    slug: 'proximity-service-yelp',
    tagline: 'Find nearby places fast, using geohash grid cells, spatial indexes, and ranking by distance and rating.',
    category: 'Search & Big Data',
    difficulty: 'Intermediate',
    readTime: '20 min read',
    scaleSummary: {
      dau: '100 Million Search Queries / day',
      qps: '30,000 Search QPS / 100 Million Places Indexed',
      storage: '200 GB spatial database index',
      bandwidth: '5 GB/s Search Egress'
    },
    overview: 'A proximity service lets users find nearby restaurants, cafes and other businesses within a radius (for example 5 km) of a GPS location. It needs a spatial index so a search takes under 25 ms.',
    keyChallenges: [
      'Fast 2D search: find points within radius R of a (latitude, longitude) without scanning all 100M places.',
      'Uneven density: a dense city center can have thousands of businesses per km², while a rural area has almost none.',
      'Ranking: combine distance, star rating, price level and opening hours.',
      'Read-heavy load: reads far outnumber writes, because business locations change rarely.'
    ],
    functionalRequirements: [
      'Search places by location (lat, lng), radius (for example 3 km) and category (for example Italian food).',
      'Add and edit business profiles (photos, hours, address, phone).',
      'Filter results by rating, price level and whether the place is open now.'
    ],
    nonFunctionalRequirements: [
      'Search latency under 25 ms at P99.',
      'Availability: 99.99%.',
      'Support 30,000 search queries per second worldwide.'
    ],
    outOfScope: ['Turn-by-turn navigation.'],
    capacityEstimations: {
      assumptions: [
        '100M business places worldwide; 100M searches per day: about 1,160 QPS on average and 30,000 QPS at peak.',
        'A place record is 2 KB (ID, name, lat, lng, category, rating, metadata).',
        'Storage: 100M × 2 KB = 200 GB.'
      ],
      metrics: [
        { label: 'Spatial Search QPS', value: '30,000 QPS', formula: 'Peak nearby place queries', description: 'Redis geospatial index or PostGIS' },
        { label: 'Total Places Storage', value: '200 GB', formula: '100M businesses * 2 KB', description: 'Fits in the memory of a small cluster, before replication and overhead' }
      ],
      conclusion: 'About 200 GB of place data fits in the memory of a small Redis cluster, so reads can come from RAM. Plan for extra memory for indexes and replicas. Split the index into many keys (for example one per geohash prefix), because a single Redis key lives on a single node.'
    },
    architecture: {
      summary: 'The client calls the API gateway, which forwards the query to the proximity search service. The service looks up candidate place IDs in a Redis geohash index (or PostGIS), loads business details from PostgreSQL, ranks the results, and returns the top ones. Results for popular areas can be cached (for example at a CDN).',
      nodes: [
        { id: 'client', label: 'Yelp Mobile / Web App', type: 'client', x: 8, y: 50, description: 'Searches for nearby restaurants' },
        { id: 'gateway', label: 'API Gateway', type: 'gateway', x: 30, y: 50, description: 'Handles auth, rate limits and routing by region', techStack: ['Envoy'] },
        { id: 'search_srv', label: 'Proximity Search Service', type: 'service', x: 55, y: 50, description: 'Computes geohash cells, filters and ranks candidates', techStack: ['Go / Java'] },
        { id: 'geo_cache', label: 'Geohash Spatial Index (Redis)', type: 'cache', x: 80, y: 25, description: 'Maps a geohash prefix to a list of place IDs', techStack: ['Redis Geospatial'] },
        { id: 'db', label: 'Places DB (PostgreSQL + PostGIS)', type: 'database', x: 80, y: 75, description: 'Durable place data, with a GiST spatial index', techStack: ['PostgreSQL + PostGIS'] }
      ],
      edges: [
        { id: 'e1', from: 'client', to: 'gateway', label: '1. GET /places/nearby?lat=..&lng=..', protocol: 'HTTPS' },
        { id: 'e2', from: 'gateway', to: 'search_srv', label: '2. Route Query', protocol: 'Internal RPC' },
        { id: 'e3', from: 'search_srv', to: 'geo_cache', label: '3. GEORADIUS / Geohash Lookup', protocol: 'TCP' },
        { id: 'e4', from: 'search_srv', to: 'db', label: '4. Hydrate Business Details', protocol: 'SQL' }
      ],
      flowSteps: [
        { step: 1, title: 'Find the geohash cells to search', description: 'The client sends (lat 37.7749, lng -122.4194, radius 2 km). The service converts the point to a 5-character geohash, "9q8yy" (a cell about 4.9 km wide), and adds the 8 neighboring cells.', activeNodes: ['client', 'search_srv'], highlightDetails: 'The cell is larger than the radius, so the 3x3 block of cells covers the whole search circle and boundary places are not missed.', latencyEstimate: '1ms' },
        { step: 2, title: 'Look up candidates in memory', description: 'The search service asks Redis for the places in those cells, using GEOSEARCH to keep only those within 2 km. Redis answers from memory.', activeNodes: ['search_srv', 'geo_cache'], highlightDetails: 'This narrows 100M places down to a short list of local candidates.', latencyEstimate: '2ms' },
        { step: 3, title: 'Filter and rank', description: 'The service filters candidates by opening hours and category, loads their details from PostgreSQL, and ranks them with a weighted score of normalized rating, closeness and review count (for example weights 0.5, 0.3 and 0.2). It returns the top 20.', activeNodes: ['search_srv', 'db', 'client'], highlightDetails: 'Most of the work happens in memory, so the whole search stays fast.', latencyEstimate: '10ms' }
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
        notes: 'PostgreSQL with PostGIS. A GiST index (an R-tree variant) speeds up spatial queries.'
      }
    ],
    deepDives: [
      {
        title: 'Geohash vs QuadTree for proximity search',
        subtitle: 'Why geohash prefixes fit distributed caches well',
        content: `1. Geohash:\n- It interleaves the bits of latitude and longitude and writes them as base-32 characters.\n- Prefix property: places that share a 5-character prefix such as "9q8yy" are in the same box, about 4.9 km by 4.9 km.\n- Sharding: sharding by a 4-character prefix (for example "9q8y") puts all of San Francisco on one shard. The cost is uneven shards, because dense cities get far more places than rural areas.\n- Weakness: two nearby points can have different prefixes if they sit on opposite sides of a cell edge. That is why a search also reads the 8 neighboring cells.\n\n2. QuadTree:\n- It splits space into four quadrants again and again, until each quadrant holds 100 places or fewer.\n- Pro: it adapts to density. Manhattan gets many small quadrants and rural areas get a few large ones.\n- Con: it is a tree in memory, which is harder to split across cache nodes than flat geohash string keys.`,
        keyTakeaways: [
          'Geohashes are plain strings, so they are easy to use as keys in Redis and as B-tree indexes in SQL.',
          'Always search the center cell and its 8 neighbors, so you do not miss places near a cell edge.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Missing places near a cell boundary',
        impact: 'A user standing at the right edge of one geohash cell does not see a restaurant 10 meters away, just across the edge, in the next cell.',
        mitigation: 'Always query the 8 neighboring cells (a 3x3 block) and filter by true distance, using the Haversine formula (distance between two points on a sphere).'
      }
    ],
    interviewQA: [
      {
        question: 'How do you cache search results when users have infinite possible GPS coordinates?',
        hint: 'Coordinate rounding (grid quantization).',
        goodAnswer: 'Round each user location to a geohash cell sized to the search radius (for example 5 characters, about 4.9 km, for a 2 km search). Cache the candidate places in Redis by cell and category, for example cache:9q8yy:cafe, for about 10 minutes. Then compute the exact distance and ranking for each request. The hit rate depends on how many users search in the same cells.',
        pitfalls: 'Caching by exact coordinates (for example lat 37.77492819), which almost never repeat.'
      }
    ],
    similarSystems: ['Google Maps Nearby', 'TripAdvisor', 'Foursquare', 'Zomato'],
    tags: ['Geohash', 'PostGIS', 'Spatial Index', 'QuadTree', 'Redis']
  },
  {
    id: 'distributed-cache-cluster',
    title: 'Design a Distributed Cache System (Redis / Memcached Cluster)',
    slug: 'distributed-cache-system',
    tagline: 'An in-memory key-value cluster that spreads keys with consistent hashing, fails over to replicas, and evicts old keys when memory is full.',
    category: 'Storage & Infrastructure',
    difficulty: 'Advanced',
    readTime: '22 min read',
    scaleSummary: {
      dau: '100 Million Active Cache Keys',
      qps: '5,000,000 Cache Reads/sec / 500,000 Writes/sec',
      storage: '300 GB RAM in distributed cluster (100 GB x 3 replicas)',
      bandwidth: '5.5 GB/s In-Memory Throughput'
    },
    overview: 'A distributed cache stores key-value data in memory across many nodes and answers in under a millisecond. It uses consistent hashing with virtual nodes to spread keys evenly, so adding or removing a node moves only a small share of the keys.',
    keyChallenges: [
      'Even key spread: distribute 100M keys evenly across 50 nodes, without hot spots on the hash ring, using consistent hashing and virtual nodes.',
      'Changing the node count: adding or removing a node should move only about K/N keys (K keys, N nodes), not invalidate the whole cache.',
      'Concurrency: keep P99 latency under 1 ms at 5 million requests per second.',
      'Eviction: when memory reaches its limit, remove keys with an LRU (least recently used) or LFU (least frequently used) policy.'
    ],
    functionalRequirements: [
      'GET(key), SET(key, value, ttl) and DEL(key), each in under 1 ms.',
      'Expire keys automatically with a TTL (time to live), and evict keys with LRU when memory is full.',
      'Add or remove nodes with little key movement.',
      'Replicate each master to replicas, with automatic failover.'
    ],
    nonFunctionalRequirements: [
      'Latency: P99 under 1 ms for all operations.',
      'Availability: 99.999%.',
      'Scalability: capacity grows roughly in proportion to the number of nodes.'
    ],
    outOfScope: ['A relational SQL query engine with multi-table queries.'],
    capacityEstimations: {
      assumptions: [
        'Peak load: 5M reads/s and 500k writes/s, with 100M keys stored.',
        'A key plus value averages 1 KB, so 100M × 1 KB = 100 GB of active data. With 3 copies in total, that is 300 GB of RAM.',
        'Throughput: (5M reads + 500k writes) × 1 KB = 5.5 GB/s.'
      ],
      metrics: [
        { label: 'Cluster Read Throughput', value: '5,000,000 ops/s', formula: 'Distributed across 50 cache nodes (100k ops/node)', description: 'Read operations handled by the Redis nodes' },
        { label: 'Key Migration on Resharding', value: 'Only 1/N Keys', formula: 'Consistent Hashing ring property', description: 'Little data moves when the node count changes' }
      ],
      conclusion: 'Consistent hashing with 256 virtual nodes per physical server spreads memory evenly across the servers.'
    },
    architecture: {
      summary: 'A smart client or proxy (Twemproxy or Envoy) hashes each key onto a ring from 0 to 2^32 - 1, where each server owns many virtual nodes. It sends the request to the master that owns that spot. The master replicates asynchronously to a replica, and a gossip protocol (nodes sharing health information with each other) detects failed nodes.',
      nodes: [
        { id: 'client', label: 'Application Servers', type: 'client', x: 8, y: 50, description: 'Calls GET and SET through a client library that knows the hash ring' },
        { id: 'proxy', label: 'Cache Router / Proxy', type: 'gateway', x: 35, y: 50, description: 'Holds the consistent hashing ring and the connection pool', techStack: ['Envoy / Twemproxy'] },
        { id: 'node_1', label: 'Redis Master Node 1', type: 'cache', x: 70, y: 20, description: 'In this diagram, owns about one third of the ring (as many small ranges)', techStack: ['Redis'] },
        { id: 'node_2', label: 'Redis Master Node 2', type: 'cache', x: 70, y: 50, description: 'In this diagram, owns about one third of the ring (as many small ranges)', techStack: ['Redis'] },
        { id: 'node_3', label: 'Redis Master Node 3', type: 'cache', x: 70, y: 80, description: 'In this diagram, owns about one third of the ring (as many small ranges)', techStack: ['Redis'] },
        { id: 'replica', label: 'Read Replica Nodes', type: 'cache', x: 92, y: 50, description: 'Receives asynchronous replication and can take over if its master fails', techStack: ['Redis Replica'] }
      ],
      edges: [
        { id: 'e1', from: 'client', to: 'proxy', label: '1. GET user:1029', protocol: 'TCP' },
        { id: 'e2', from: 'proxy', to: 'proxy', label: '2. Hash(user:1029) -> Node 2', protocol: 'Internal RPC' },
        { id: 'e3', from: 'proxy', to: 'node_2', label: '3. Forward GET', protocol: 'TCP' },
        { id: 'e4', from: 'node_2', to: 'replica', label: '4. Async Replication Stream', protocol: 'TCP', isAsync: true }
      ],
      flowSteps: [
        { step: 1, title: 'Hash the key and find its node', description: 'The proxy computes a 32-bit hash of "user:1029" (for example Murmur3). It binary-searches the sorted list of virtual nodes (O(log V)) to find the first one clockwise from that hash.', activeNodes: ['client', 'proxy'], highlightDetails: 'Routing is deterministic and fast: a binary search over the ring.', latencyEstimate: '0.05ms' },
        { step: 2, title: 'Read the value from memory', description: 'The target Redis node looks up the key in its in-memory hash table in O(1) time and updates the key last-access time, which eviction uses later. Redis uses an approximate LRU, while Memcached keeps a linked list for LRU.', activeNodes: ['proxy', 'node_2'], highlightDetails: 'The data is already in RAM, so the read returns in well under a millisecond.', latencyEstimate: '0.5ms' }
      ]
    },
    apiDesign: [
      {
        method: 'POST',
        path: '/v1/cache/set',
        description: 'Set a cache key with a TTL',
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
        notes: 'Cluster topology, shared between nodes by the gossip protocol.'
      }
    ],
    deepDives: [
      {
        title: 'Consistent hashing with virtual nodes',
        subtitle: 'Why Hash(key) % N breaks a cache when N changes, and how consistent hashing fixes it',
        content: `Simple hashing: node = Hash(key) % N.\nIf N = 10 and one node fails, N becomes 9. Most keys (about 90%) now map to a different server. The result is a flood of cache misses (a cache stampede) that can overload the database.\n\nConsistent hashing ring:\n1. The ring covers the range 0 to 2^32 - 1.\n2. Each server is hashed to a point on the ring.\n3. A key goes to the first server found moving clockwise from the key position.\n4. When a node is added or removed, only the keys between that node and its predecessor move. On average that is about K/N of K keys, and the other (N-1)/N stay where they are.\n\nVirtual nodes:\nGive each physical server many points on the ring (for example 256 tokens: Node1#1, Node1#2, ..., Node1#256). More points per server make the spread more even and also spread a failed node load across many survivors.\n\nHow real systems differ: Redis Cluster does not use a ring. It splits the key space into 16,384 hash slots and assigns slots to nodes. Moving slots moves only part of the data, which gives the same benefit. Memcached clients commonly use consistent hashing.`,
        keyTakeaways: [
          'Consistent hashing moves only about K/N keys when the node count changes.',
          'Virtual nodes spread keys more evenly and avoid hot spots on the ring.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'A hot key overloads one cache node',
        impact: 'A viral key gets 200,000 reads/s, more than the node that holds it can serve (about 100,000 operations/s in this design).',
        mitigation: 'Store the hot key under several names (key#1, key#2, ... key#10) and let clients pick one at random, so the copies land on different nodes. A short-lived cache inside each client process also helps. The cost: every write must update all the copies.'
      }
    ],
    interviewQA: [
      {
        question: 'How does Redis implement LRU eviction when memory is full without high memory overhead?',
        hint: 'Approximated LRU with random sampling.',
        goodAnswer: 'A true LRU needs a linked list over all 100M keys, which adds pointers (extra memory) to every key and a list update on every read. Redis uses an approximated LRU instead. When memory is full, it samples a few random keys (5 by default), reads the 24-bit last-access clock of each, and evicts the oldest of the sample. Raising the sample size makes the result closer to a true LRU. It needs no extra pointers.',
        pitfalls: 'Claiming that Redis keeps one global linked list of all keys.'
      }
    ],
    similarSystems: ['Redis Cluster', 'Memcached', 'Twemproxy', 'AWS ElastiCache'],
    tags: ['Consistent Hashing', 'Virtual Nodes', 'LRU Eviction', 'Redis Cluster', 'Hot Keys']
  },
  {
    id: 'realtime-gaming-leaderboard',
    title: 'Design a Real-Time Multiplayer Gaming Leaderboard',
    slug: 'gaming-leaderboard',
    tagline: 'Rank millions of players in real time with Redis sorted sets, exact player ranks, and a global top 100.',
    category: 'Financial & High Throughput',
    difficulty: 'Intermediate',
    readTime: '18 min read',
    scaleSummary: {
      dau: '50 Million Active Gamers',
      qps: '150,000 Score Updates/sec / 50,000 Leaderboard Views/sec',
      storage: '5 GB In-Memory Skip List Ranking Store (10 GB with 1 replica)',
      bandwidth: '500 MB/s Real-Time Egress'
    },
    overview: 'A real-time leaderboard ranks millions of players by score. It returns a player exact rank (for example "#42,891 out of 5,000,000") and a live top 100, in under 10 ms.',
    keyChallenges: [
      'Write volume: 150,000 score updates per second.',
      'Fast rank lookup: find a player exact rank in O(log N) time, without scanning millions of rows.',
      'Ties: when two players have the same score, rank the one who reached it first higher.',
      'Several boards: global, per country, and friends-only leaderboards.'
    ],
    functionalRequirements: [
      'Submit a new score or add to a score (Redis ZADD or ZINCRBY).',
      'Fetch the global top 100 with avatars and scores.',
      'Fetch a player rank and the 5 players above and below.',
      'Reset daily, weekly and seasonal leaderboards, and keep an all-time board.'
    ],
    nonFunctionalRequirements: [
      'Rank query latency under 10 ms.',
      'A score update shows up in under 500 ms.',
      'Availability: 99.99%.'
    ],
    outOfScope: ['Cheat detection (anti-tamper checks inside the game).'],
    capacityEstimations: {
      assumptions: [
        '50M active players; 150,000 score submissions per second at peak.',
        'One Redis sorted set entry holds a user ID (36-byte UUID), a score (8-byte float64) and skip list node overhead: roughly 100 bytes in this estimate.',
        '50M players × 100 bytes = 5 GB of RAM. Real Redis overhead is higher, so treat this as a rough lower bound.',
        'A leaderboard view is about 10 KB (top 100 entries): 50,000 views/s × 10 KB = 500 MB/s of egress.'
      ],
      metrics: [
        { label: 'Score Update QPS', value: '150,000 / sec', formula: 'Peak ZINCRBY operations', description: 'Peak ZINCRBY operations on Redis' },
        { label: 'Leaderboard RAM', value: '5 GB RAM', formula: '50M players in Redis ZSET', description: 'Skip list plus hash table in memory' }
      ],
      conclusion: 'A Redis sorted set (a skip list plus a hash table) can hold 50M players in RAM with O(log N) updates and rank lookups. One sorted set lives on one Redis node, and one node handles roughly 100,000 simple operations per second. To reach 150,000 updates per second, split the players across several sorted sets (for example by score range) or batch the writes.'
    },
    architecture: {
      summary: 'Game clients submit scores to the game service, which updates a Redis sorted set (ZSET) and reads the player rank with ZREVRANK. A periodic job sends leaderboard snapshots through Kafka to PostgreSQL, which keeps the history of past seasons.',
      nodes: [
        { id: 'client', label: 'Game Client (Mobile / PC)', type: 'client', x: 8, y: 50, description: 'Submits the score after a match' },
        { id: 'gateway', label: 'Leaderboard API Gateway', type: 'gateway', x: 30, y: 50, description: 'Rate limits requests and checks signed score tokens', techStack: ['Envoy'] },
        { id: 'leader_srv', label: 'Leaderboard Service', type: 'service', x: 55, y: 50, description: 'Manages seasonal sorted sets and rank queries', techStack: ['Go / Node.js'] },
        { id: 'redis_zset', label: 'Redis Sorted Sets (ZSET)', type: 'cache', x: 80, y: 30, description: 'In-memory skip list that holds the scores of 50M players', techStack: ['Redis Cluster'], scaleMetric: 'O(log N) rank lookup' },
        { id: 'archive_db', label: 'Season Archive DB', type: 'database', x: 80, y: 70, description: 'PostgreSQL store for the results of past seasons', techStack: ['PostgreSQL'] }
      ],
      edges: [
        { id: 'e1', from: 'client', to: 'gateway', label: '1. POST /scores/submit', protocol: 'HTTPS' },
        { id: 'e2', from: 'gateway', to: 'leader_srv', label: '2. Route Score', protocol: 'Internal RPC' },
        { id: 'e3', from: 'leader_srv', to: 'redis_zset', label: '3. ZINCRBY leaderboard:global 500', protocol: 'TCP' },
        { id: 'e4', from: 'leader_srv', to: 'redis_zset', label: '4. ZREVRANK (Get User Rank)', protocol: 'TCP' },
        { id: 'e5', from: 'leader_srv', to: 'archive_db', label: '5. Daily Snapshot', protocol: 'SQL', isAsync: true }
      ],
      flowSteps: [
        { step: 1, title: 'Update the score atomically', description: 'A client finishes a match with 500 points. The leaderboard service runs ZINCRBY leaderboard:season_5 500 "user_42" in Redis.', activeNodes: ['client', 'leader_srv', 'redis_zset'], highlightDetails: 'The skip list moves the entry to its new position in O(log N) steps.', latencyEstimate: '1ms' },
        { step: 2, title: 'Query the rank and the top players', description: 'The client asks for its rank. The server calls ZREVRANK for the player rank (Redis counts ranks from 0, so add 1 for display, for example #1,240). It calls ZREVRANGE for the top 100, and again for the players just above and below the player.', activeNodes: ['leader_srv', 'redis_zset', 'client'], highlightDetails: 'Each call is O(log N) plus the number of entries returned, so the top 100 comes back quickly.', latencyEstimate: '2ms' }
      ]
    },
    apiDesign: [
      {
        method: 'POST',
        path: '/api/v1/leaderboard/submit',
        description: 'Submit a match score',
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
        notes: 'PostgreSQL table that stores the final standings of finished seasons.'
      }
    ],
    deepDives: [
      {
        title: 'Redis sorted set internals: skip list plus hash table',
        subtitle: 'Why Redis uses a skip list rather than a balanced tree for ranking',
        content: `A Redis sorted set (ZSET) combines two data structures:\n1. A hash table maps each member (user_id) to its score in O(1) time.\n2. A skip list (a linked list with extra layers of forward pointers that let a search skip over many nodes):\n   - Inserting or updating a score takes O(log N) on average, with no tree rebalancing or rotations.\n   - Range queries (ZREVRANGEBYSCORE) walk along the bottom linked list.\n   - Rank lookups (ZREVRANK) are O(log N) because each pointer stores its span (how many entries it jumps over). Adding up the spans along the search path gives the rank.\n\nRedis is single-threaded for commands, so lock-free concurrency is not the reason for this choice. Skip lists are simpler to implement than balanced trees and make range queries easy.`,
        keyTakeaways: [
          'Span counts on skip list pointers make rank lookups O(log N).',
          'A skip list is simpler than a balanced tree and supports fast range queries. Redis is single-threaded, so concurrency is not the reason.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Ties between equal scores',
        impact: 'If two players both have 10,000 points, who is rank #1?',
        mitigation: 'Fold a time-based tie-breaker into the score: stored_score = Score + (1 - timestamp_seconds / 1e10). Earlier timestamps give slightly larger values, so the earlier player ranks higher. Keep the added part below 1. A float64 has about 15 to 16 significant digits, so very large scores can lose the tie-breaker.'
      }
    ],
    interviewQA: [
      {
        question: 'How do you handle Friends-Only Leaderboards (ranking among 50 friends)?',
        hint: 'Batch lookups vs a dedicated ZSET.',
        goodAnswer: 'Do not create a sorted set for every user friend list, because millions of small sets waste memory. Instead, load the friend IDs from the social graph database, read their scores from the global sorted set in one batch with ZMSCORE (or pipelined ZSCORE calls), and sort the 50 results in application memory in O(K log K) time (under 1 ms).',
        pitfalls: 'Creating a separate Redis sorted set for every friend circle.'
      }
    ],
    similarSystems: ['PlayFab Leaderboard', 'GameLift', 'Steam Leaderboards', 'Duolingo League'],
    tags: ['Redis ZSET', 'Skip List', 'Leaderboard', 'Ranking', 'O(log N)']
  },
  {
    id: 'ecommerce-recommendation-engine',
    title: 'Design an E-Commerce Real-Time Recommendation Engine',
    slug: 'ecommerce-recommendation-engine',
    tagline: 'Recommend products in real time with a two-tower model, session features, approximate nearest neighbor (ANN) search, and reranking.',
    category: 'Search & Big Data',
    difficulty: 'Advanced',
    readTime: '24 min read',
    scaleSummary: {
      dau: '100 Million Active Shoppers / 50 Million Products',
      qps: '80,000 Recommendation QPS / 1,000,000 Cart & Click Telemetry/sec',
      storage: '50 GB Item Vector Index in Milvus + Redis Feature Store',
      bandwidth: '10 GB/s Real-Time Serving'
    },
    overview: 'A recommendation engine suggests products such as "You may also like" and "Frequently bought together" on product pages and the home feed. It uses what the shopper just browsed, what they added to the cart, and embeddings (vectors of numbers that place similar items and users close together).',
    keyChallenges: [
      'Latency: a multi-stage pipeline (candidate retrieval, filtering, neural ranking, business rules) must finish in under 50 ms.',
      'In-session personalization: if a user clicks 3 mountain bikes, the next page load should already show cycling items.',
      'Vector search: find the 500 nearest products among 50M items in under 15 ms, using an HNSW index (a graph-based approximate search index) such as Milvus.',
      'Cold start: new products and new guest shoppers have no history to learn from.'
    ],
    functionalRequirements: [
      'Personalized home feed ("Recommended for You").',
      'Related items on the product page ("Similar Items").',
      'Cart cross-sell ("Frequently Bought Together").',
      'Ingest clicks, add-to-cart events and searches in real time.'
    ],
    nonFunctionalRequirements: [
      'Serving latency under 50 ms at P99.',
      'Availability: 99.99%. If a model fails, fall back to trending products.',
      'Freshness: recommendations reflect a user action within 3 seconds.'
    ],
    outOfScope: ['Ad bidding and pay-per-click auction pricing.'],
    capacityEstimations: {
      assumptions: [
        '100M active shoppers; 50M products in the catalog.',
        'An item embedding has 256 float32 dimensions = 1 KB per product, so 50M × 1 KB = 50 GB of vectors (the HNSW graph adds more).',
        '80,000 recommendation requests per second at peak.'
      ],
      metrics: [
        { label: 'Recommendation QPS', value: '80,000 QPS', formula: 'Peak page view recommendations', description: 'Peak recommendation requests (GPU ranking plus vector search)' },
        { label: 'Vector Index Size', value: '50 GB RAM', formula: '50M products * 256-dim embeddings in HNSW', description: 'Memory for the vectors in Milvus or FAISS, not counting the graph overhead' }
      ],
      conclusion: 'Use a two-tower model: item embeddings are computed offline and stored in the index, and only the user embedding is computed at request time on a GPU. This keeps request-time work small.'
    },
    architecture: {
      summary: 'Click events stream into Kafka, and Flink updates a real-time feature store in Redis. At request time, the orchestrator builds a user embedding and asks the vector database (Milvus) for the 500 nearest products by ANN search. A deep ranking model scores those candidates. Business rules add diversity and remove out-of-stock items, and the service returns the top 10.',
      nodes: [
        { id: 'client', label: 'Shopper App', type: 'client', x: 8, y: 50, description: 'Browses products and shows recommendations' },
        { id: 'gateway', label: 'API Gateway', type: 'gateway', x: 26, y: 50, description: 'Forwards the request to the orchestrator', techStack: ['Envoy'] },
        { id: 'rec_srv', label: 'Recommendation Orchestrator', type: 'service', x: 48, y: 50, description: 'Coordinates candidate retrieval and ranking', techStack: ['Go / Java'] },
        { id: 'feature_store', label: 'Real-Time Feature Store', type: 'cache', x: 48, y: 15, description: 'Holds the user profile and the last 10 clicked categories', techStack: ['Redis / Feast'] },
        { id: 'vector_db', label: 'Vector ANN Index (Milvus)', type: 'search', x: 72, y: 30, description: 'Indexes the embeddings of 50M products with HNSW', techStack: ['Milvus / Pinecone'] },
        { id: 'ranking_gpu', label: 'Deep Ranking Engine (Triton)', type: 'worker', x: 72, y: 70, description: 'A neural ranking model scores the candidates on GPUs', techStack: ['PyTorch / NVIDIA Triton'] },
        { id: 'catalog_db', label: 'Product Catalog DB', type: 'database', x: 92, y: 50, description: 'Provides current prices, stock and images', techStack: ['PostgreSQL / Cassandra'] }
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
        { step: 1, title: 'Fetch features and build the user embedding', description: 'The orchestrator reads the user recent browsing history (the last 5 items viewed in this session) from Redis. The user tower model turns that context into a 256-dimension embedding.', activeNodes: ['rec_srv', 'feature_store'], highlightDetails: 'Click events update the features within seconds.', latencyEstimate: '5ms' },
        { step: 2, title: 'Retrieve candidates with HNSW vector search', description: 'Milvus runs an approximate nearest neighbor (ANN) search over 50M product vectors and returns 500 candidates in about 8 ms.', activeNodes: ['rec_srv', 'vector_db'], highlightDetails: 'Similarity is the inner product of the vectors (the same as cosine similarity when vectors are normalized).', latencyEstimate: '8ms' },
        { step: 3, title: 'Rank with a neural model and apply business rules', description: 'A Triton GPU server scores the 500 candidates by the predicted probability of purchase. The orchestrator removes out-of-stock items, applies category diversity rules, and returns the top 10.', activeNodes: ['rec_srv', 'ranking_gpu', 'catalog_db', 'client'], highlightDetails: 'The end-to-end target is under 35 ms, inside the 50 ms budget.', latencyEstimate: '20ms' }
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
        notes: 'Milvus vector index built with HNSW (M=16, efConstruction=200). M is the number of links per node and efConstruction is the search width while building. Higher values give better recall but use more memory and build time.'
      }
    ],
    deepDives: [
      {
        title: 'The two-tower architecture',
        subtitle: 'How separating user and item models makes real-time serving possible',
        content: `Why a full model is too slow at request time:\nScoring every one of 50M products with a large neural network for each click would need 50M model runs per request. That is far too slow for a 50 ms budget.\n\nTwo-tower solution:\n1. Item tower (offline): batch jobs compute a 256-dimension embedding for every product and load them into the vector index. New products get an embedding when they are added.\n2. User tower (online): takes real-time features (device, location, recent clicks) and computes one 256-dimension user vector in about 2 ms.\n3. Inner product: the predicted affinity is DotProduct(User_Vector, Item_Vector).\n4. Vector database (Milvus or FAISS): finds the items with the highest inner product among 50M using an HNSW graph, in about 10 ms.\n\nA second, heavier ranking model then scores only the few hundred retrieved candidates.`,
        keyTakeaways: [
          'Item embeddings are computed offline, so only a small model runs per request.',
          'Candidate retrieval becomes an approximate nearest neighbor lookup instead of scoring every item.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Vector database CPU overload in traffic spikes',
        impact: 'ANN search latency rises from 8 ms to 200 ms.',
        mitigation: 'Cache the top 100 candidate product IDs in Redis for common user segments (for example cycling enthusiasts), with a 30-minute TTL. The cost is less personalization for cached results.'
      }
    ],
    interviewQA: [
      {
        question: 'How do you handle the "Filter Bubble" where users are only recommended items identical to what they just viewed?',
        hint: 'Exploration vs exploitation (epsilon-greedy or multi-armed bandits).',
        goodAnswer: 'Add an exploration step. For example, with an epsilon-greedy policy (10% of slots) or a multi-armed bandit, put popular or surprising items from nearby categories into the final reranking. Then measure whether users engage with them. This trades a little short-term relevance for variety.',
        pitfalls: 'Relying only on nearest-neighbor similarity, with no diversity rules.'
      }
    ],
    similarSystems: ['Amazon Recommendations', 'Alibaba Taobao Recs', 'Pinterest Visual Search', 'Netflix Recommendations'],
    tags: ['Two-Tower Model', 'Vector Search', 'Milvus', 'HNSW', 'Feature Store']
  },
  {
    id: 'stock-exchange-matching-engine',
    title: 'Design a High-Frequency Stock Exchange & Order Matching Engine',
    slug: 'stock-exchange-matching-engine',
    tagline: 'Match buy and sell orders in microseconds, using a single-threaded engine, a ring buffer, a limit order book and a replayable journal.',
    category: 'Financial & High Throughput',
    difficulty: 'Advanced',
    readTime: '26 min read',
    scaleSummary: {
      dau: '500,000 Active Traders / 10,000 Tickers',
      qps: '1,000,000 Order Messages / sec (Microsecond P99 Latency)',
      storage: '100% Deterministic Sequential Journal (Zero data loss)',
      bandwidth: '64 MB/s Multicast UDP Market Data Feed'
    },
    overview: 'A stock exchange matching engine takes limit and market buy and sell orders for symbols such as AAPL and GOOG. It matches them by price-time priority (the best price first, and among equal prices the earliest order first), in about 10 microseconds, and broadcasts the results to all participants over UDP multicast.',
    keyChallenges: [
      'Latency: matching must stay in the single-digit microsecond range, so garbage collection pauses and OS context switches are not acceptable.',
      'Price-time priority: orders at the same price must execute in the exact order they arrived.',
      'Single-threaded, lock-free design: the LMAX Disruptor pattern (a ring buffer that passes orders to one matching thread without locks).',
      'Market data: send updates fast using binary protocols such as ITCH (market data) and OUCH (order entry), with ITCH sent over UDP multicast.'
    ],
    functionalRequirements: [
      'Accept limit orders (buy or sell at a given price) and market orders (buy or sell at the best available price).',
      'Cancel and modify working orders.',
      'Match incoming orders against the limit order book (LOB) by price-time priority.',
      'Broadcast Level 2 market data (the top 10 bid and ask price levels) to participants.',
      'Send execution confirmations and trade reports for settlement.'
    ],
    nonFunctionalRequirements: [
      'Latency: order execution in under 10 microseconds (µs).',
      'Determinism: replaying the input journal must produce exactly the same trades.',
      'No data loss: every order is written to a sequential NVMe journal before it is matched.',
      'Availability: a hot-standby replica that takes over with minimal downtime.'
    ],
    outOfScope: ['Clearing and settlement after the trade (the T+1 process).'],
    capacityEstimations: {
      assumptions: [
        '1 million order messages per second at peak, at market open (9:30 AM Eastern).',
        'A binary order record is 64 bytes (order_id, symbol_id, price, qty, side, timestamp).',
        'Journal write rate: 1M × 64 bytes = 64 MB/s of sequential writes on NVMe SSD.',
        'Market data: about one book update (64 bytes) per order message, sent once per multicast group = 64 MB/s.'
      ],
      metrics: [
        { label: 'Order Execution Latency', value: '< 10 µs', formula: 'In-memory single-threaded matching loop', description: 'Single-threaded matching loop that runs entirely in memory' },
        { label: 'Throughput', value: '1,000,000 orders/s', formula: 'Single-thread core processing with LMAX Disruptor', description: 'Lock-free ring buffer feeding the matching thread' }
      ],
      conclusion: 'Run matching on a single thread per symbol (or per group of symbols), with no locks, in C++ or in Java that avoids garbage collection (such as the Disruptor). One symbol is never split across threads. Each thread is pinned to its own CPU core.'
    },
    architecture: {
      summary: 'Traders send orders in FIX (text) or OUCH (binary) over a 10 GbE network. The gateway checks risk, gives each order a sequence number, and appends it to an NVMe journal. It then puts the order in a lock-free ring buffer (LMAX Disruptor). A single-threaded matching engine matches it against the limit order book (a B-tree of price levels, each with a linked list of orders) and publishes trades with ITCH over UDP multicast.',
      nodes: [
        { id: 'trader', label: 'Trading Firm (HFT / Broker)', type: 'client', x: 8, y: 50, description: 'Sends orders in FIX or OUCH format' },
        { id: 'gateway', label: 'Order Entry Gateway', type: 'gateway', x: 28, y: 50, description: 'Assigns sequence numbers and runs pre-trade risk checks', techStack: ['C++ / Kernel Bypass (Solarflare DPDK)'] },
        { id: 'journal', label: 'Sequential NVMe Journal', type: 'storage', x: 50, y: 15, description: 'Append-only log of every order, so the exact input can be replayed', techStack: ['Direct NVMe I/O (O_DIRECT)'] },
        { id: 'disruptor', label: 'Lock-Free Ring Buffer', type: 'queue', x: 50, y: 50, description: 'LMAX Disruptor queue that passes orders between threads', techStack: ['Memory-Mapped Ring Buffer'] },
        { id: 'matching_core', label: 'Matching Engine Core', type: 'worker', x: 75, y: 50, description: 'Single-threaded matching on a CPU core pinned to one symbol (or group of symbols)', techStack: ['C++ Order Book (B-Tree + Doubly Linked List)'] },
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
        { step: 1, title: 'Kernel-bypass ingestion and risk check', description: 'The order arrives over the 10 GbE network. A kernel-bypass network stack (such as Solarflare Onload or DPDK) hands the packet straight to user-space memory, skipping OS kernel context switches. The gateway runs pre-trade risk checks.', activeNodes: ['trader', 'gateway'], highlightDetails: 'Skipping the kernel avoids system calls and extra copies, so packets reach the application faster.', latencyEstimate: '1.2 µs' },
        { step: 2, title: 'Journal the order', description: 'The gateway appends the order to an append-only NVMe journal, so the exact input can be replayed after a crash.', activeNodes: ['gateway', 'journal'], highlightDetails: 'Sequential appends are the fastest disk write pattern. The 2 µs figure is a target that needs batched writes or fast persistent storage. A separate disk sync (fsync) for every order would take longer.', latencyEstimate: '2 µs' },
        { step: 3, title: 'Lock-free matching on one thread', description: 'The matching thread, pinned to a dedicated CPU core, takes the order from the ring buffer. It walks the limit order book (a B-tree of price levels, each holding a first-in-first-out linked list of orders) and executes the trade.', activeNodes: ['disruptor', 'matching_core'], highlightDetails: 'The matching thread uses no locks and has no context switches.', latencyEstimate: '1.5 µs' },
        { step: 4, title: 'Broadcast the trade over UDP multicast', description: 'The engine builds a binary ITCH trade message and sends it over UDP multicast, so all market participants receive it at the same time.', activeNodes: ['matching_core', 'multicast', 'trader'], highlightDetails: 'One multicast send reaches every subscriber. UDP can drop packets, so feeds carry sequence numbers and offer a retransmission channel.', latencyEstimate: '1.8 µs' }
      ]
    },
    apiDesign: [
      {
        method: 'POST',
        path: '/v1/orders/enter',
        description: 'Enter a new limit buy order. Real exchanges use binary OUCH over TCP; JSON is shown here for readability.',
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
          { name: 'price_level', type: 'INT', isPrimary: true, notes: 'Price as integer cents (for example 18550)' },
          { name: 'head_order_ptr', type: 'POINTER', notes: 'Linked list (first in, first out) of resting orders at this price' },
          { name: 'total_volume', type: 'BIGINT' }
        ],
        notes: 'In-memory C++ B-tree structure, aligned to CPU cache lines.'
      }
    ],
    deepDives: [
      {
        title: 'The limit order book data structure: B-tree plus doubly linked list',
        subtitle: 'How to make order insert, cancel and match fast',
        content: `A limit order book must support three operations:\n1. Insert an order: O(1) if the price level exists, O(log P) to create a new price level (P is the number of price levels).\n2. Cancel an order: this must be O(1), because traders cancel huge numbers of orders when the price moves.\n3. Match an order: O(1) at the top of the book, then the next level as needed.\n\nData structures:\n- Price level map: a balanced B-tree (or a sparse array) that maps each price to a price level.\n- Order queue per price level: a doubly linked list of orders (head = oldest, tail = newest).\n- Global order lookup: a hash map from order_id to a direct pointer to the order node in its linked list.\n\nWhy this works:\n- To cancel, the hash map finds the node in O(1), and the node removes itself from the doubly linked list in O(1) (node->prev->next = node->next). No list walk is needed. If that was the last order at the price, the empty level is removed from the tree in O(log P).`,
        keyTakeaways: [
          'A doubly linked list lets a cancel run in O(1) at any depth in the book.',
          'Prices are stored as integers, which avoids floating-point rounding errors.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'OS context switches and lock contention',
        impact: 'When threads contend for a lock, a thread can be put to sleep and wait many microseconds, which is far above the 10 µs target.',
        mitigation: 'Use the LMAX Disruptor pattern: a single-threaded loop pinned to an isolated CPU core (for example isolcpus=4) fed by a lock-free ring buffer. Pad the data to CPU cache lines to prevent false sharing (two cores invalidating each other cache lines because their data sits on the same line).'
      }
    ],
    interviewQA: [
      {
        question: 'Why is a single-threaded matching engine faster than a 64-thread multi-threaded matching engine for a single stock?',
        hint: 'Cache coherency and cache-line bouncing (the MESI protocol).',
        goodAnswer: 'In a multi-threaded engine, several threads change the same order book. Their CPU cores keep invalidating each other cache lines (the MESI protocol), and the threads need locks. Orders for one symbol must still be processed in strict sequence, so extra threads add little useful parallelism. A single thread pinned to one core keeps the active order book in its L1 and L2 caches (a few nanoseconds or less per access) and needs no locks.',
        pitfalls: 'Assuming more CPU threads always means faster execution.'
      }
    ],
    similarSystems: ['Nasdaq INET', 'NYSE Pillar', 'LMAX Exchange', 'Binance Matching Engine', 'Coinbase Engine'],
    tags: ['Matching Engine', 'LMAX Disruptor', 'Kernel Bypass', 'Limit Order Book', 'Low Latency']
  }
];
