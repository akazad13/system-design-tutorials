import { CaseStudy } from '../types/system-design';

export const ECOMMERCE_CASE_STUDIES: CaseStudy[] = [
  {
    id: 'amazon-flash-sale',
    title: 'Design Amazon Flash Sale & High-Concurrency Inventory System',
    slug: 'flash-sale-inventory',
    tagline: 'Handling 1,000,000 users competing for 1,000 items with zero overselling, Redis Lua scripts, and distributed locks.',
    category: 'E-Commerce & Marketplaces',
    difficulty: 'Advanced',
    readTime: '24 min read',
    scaleSummary: {
      dau: '50 Million Sale Participants',
      qps: '500,000 Checkout Requests/sec at t=0 / 1,000 Stock Units',
      storage: '100% ACID Audit Ledger',
      bandwidth: '50 GB/s Ingress'
    },
    overview: 'A flash sale system manages high-concurrency order placement where hundreds of thousands of users attempt to purchase a limited inventory item at the exact second the sale goes live. The system must prevent overselling (inventory must never drop below 0), avoid database row lock crashes, and ensure fair queue processing.',
    keyChallenges: [
      'The "Overselling" Race Condition: 100,000 concurrent SQL UPDATE queries decrementing stock on a single row cause deadlocks or negative inventory',
      'The "Thundering Herd" at t=0: Traffic spikes from 1,000 QPS to 500,000 QPS in 1 second',
      'Inventory Reservation with TTL: Holding stock for 10 minutes during payment checkout and auto-releasing if payment fails',
      'Bot & Cheating Mitigation: Preventing scripts from draining inventory before human users'
    ],
    functionalRequirements: [
      'Users view flash sale countdown timer and item details',
      'Users click "Buy Now" at launch time to reserve stock',
      'Reserve stock atomically for 10 minutes during payment authorization',
      'If payment succeeds, confirm order and deduct permanent inventory',
      'If payment fails or times out, release reserved stock back into available pool'
    ],
    nonFunctionalRequirements: [
      'Strict Consistency: Zero overselling (Stock Available >= 0 at all times)',
      'Sub-50ms reservation response time during 500,000 QPS traffic burst',
      'High Availability and resilience to payment gateway outages',
      'Fairness: FIFO / Tokenized queue order'
    ],
    outOfScope: ['Physical warehouse package robotic dispatch logistics'],
    capacityEstimations: {
      assumptions: [
        'Flash Sale: 1,000 PlayStation 5 consoles available at 50% off at 12:00:00 PM',
        'Active users on product page: 2,000,000 users clicking "Buy Now" simultaneously',
        'Peak QPS: 500,000 requests/sec hitting reservation endpoint'
      ],
      metrics: [
        { label: 'Burst QPS', value: '500,000 / sec', formula: 'Simultaneous purchase clicks at t=0', description: 'Peak reservation throughput' },
        { label: 'Inventory Units', value: '1,000 units', formula: 'Total stock to allocate', description: 'Zero overselling tolerance' },
        { label: 'Reservation Hold Time', value: '10 Minutes', formula: 'Checkout window before auto-rollback', description: 'TTL on reserved inventory locks' }
      ],
      conclusion: 'Direct SQL database updates will instantly crash; in-memory Redis atomic Lua script reservation is mandatory.'
    },
    architecture: {
      summary: 'Clients query CDN/Static Pages -> Rate Limited by API Gateway -> Ingress Queue (Kafka) -> Flash Sale Worker Cluster executing atomic Redis Lua scripts for stock decrement -> If reserved, issues signed Checkout Token -> Order Service processes payment -> Outbox event confirms DB inventory deduction.',
      nodes: [
        { id: 'client', label: 'Flash Sale Buyers', type: 'client', x: 8, y: 50, description: 'Spam clicks Buy Now at 12:00:00 PM' },
        { id: 'cdn', label: 'CDN Static Edge', type: 'cdn', x: 26, y: 70, description: 'Serves static product page & countdown timer', techStack: ['Cloudflare'] },
        { id: 'gateway', label: 'API Gateway & Token Bucket', type: 'gateway', x: 26, y: 30, description: 'Filters duplicate clicks & bot signatures', techStack: ['Envoy / Kong'] },
        { id: 'queue', label: 'Order Ingestion Queue', type: 'queue', x: 48, y: 30, description: 'Buffers spikes and flattens traffic curve', techStack: ['Kafka / RabbitMQ'] },
        { id: 'reserve_srv', label: 'Inventory Reservation Engine', type: 'service', x: 70, y: 30, description: 'Executes atomic stock decrement', techStack: ['Go / Rust Workers'] },
        { id: 'redis_stock', label: 'Redis Stock Cache', type: 'cache', x: 90, y: 30, description: 'Atomic stock counter with Lua scripts', techStack: ['Redis Cluster'], scaleMetric: 'Single-thread atomic ops' },
        { id: 'order_db', label: 'Order & Inventory DB', type: 'database', x: 70, y: 75, description: 'ACID PostgreSQL order ledger', techStack: ['PostgreSQL'] },
        { id: 'payment_srv', label: 'Payment Service', type: 'service', x: 90, y: 75, description: 'Integrates with Stripe/Bank APIs', techStack: ['Stripe API'] }
      ],
      edges: [
        { id: 'e1', from: 'client', to: 'gateway', label: '1. POST /reserve', protocol: 'HTTPS' },
        { id: 'e2', from: 'gateway', to: 'queue', label: '2. Enqueue Request', protocol: 'Async Queue', isAsync: true },
        { id: 'e3', from: 'queue', to: 'reserve_srv', label: '3. Worker Pop Job', protocol: 'Internal RPC', isAsync: true },
        { id: 'e4', from: 'reserve_srv', to: 'redis_stock', label: '4. Execute Lua Decrement', protocol: 'TCP' },
        { id: 'e5', from: 'reserve_srv', to: 'client', label: '5. Return Purchase Token', protocol: 'WebSocket' },
        { id: 'e6', from: 'client', to: 'payment_srv', label: '6. Submit Payment Token', protocol: 'HTTPS' },
        { id: 'e7', from: 'payment_srv', to: 'order_db', label: '7. Commit Final Order', protocol: 'SQL' }
      ],
      flowSteps: [
        { step: 1, title: 'Traffic Flattening & Bot Shielding', description: 'When 500k requests arrive at 12:00:00 PM, API Gateway validates CAPTCHA tokens, deduplicates repeat clicks per user_id, and pushes to Kafka.', activeNodes: ['client', 'gateway', 'queue'], highlightDetails: 'Flattens sudden 500k QPS burst into a steady 20k QPS stream.', latencyEstimate: '10ms' },
        { step: 2, title: 'Atomic In-Memory Lua Stock Deduction', description: 'Workers execute an atomic Redis Lua script: if stock > 0, decrement by 1, generate a unique Reservation Token with 10-min TTL, and record user_id in Reserved Set.', activeNodes: ['queue', 'reserve_srv', 'redis_stock'], highlightDetails: 'Redis executes single-threaded Lua script with 0% race condition risk in < 1ms.', latencyEstimate: '2ms' },
        { step: 3, title: 'Issue Purchase Token to Winner', description: 'The first 1,000 successful users receive a signed JWT Purchase Token over WebSocket/SSE. Remaining 499,000 users immediately receive "Sold Out" response.', activeNodes: ['reserve_srv', 'client'], highlightDetails: 'Users are notified of outcome within 200ms.', latencyEstimate: '30ms' },
        { step: 4, title: 'Payment Processing & Stock Auto-Rollback', description: 'User submits payment with Purchase Token within 10 minutes. If payment fails or times out, a background worker increments Redis stock back up for next buyer.', activeNodes: ['client', 'payment_srv', 'order_db', 'redis_stock'], highlightDetails: 'Guarantees zero inventory leakage or dead stock.', latencyEstimate: '1500ms' }
      ]
    },
    apiDesign: [
      {
        method: 'POST',
        path: '/api/v1/flash-sale/reserve',
        description: 'Attempt to reserve stock for a flash sale item',
        requestBody: '{\n  "item_id": "ps5_sale_99",\n  "user_id": "usr_48291",\n  "idempotency_key": "btn_click_102938"\n}',
        responseBody: '{\n  "status": "RESERVED",\n  "purchase_token": "eyJhbGciOi...",\n  "expires_at": 1724000600\n}'
      }
    ],
    databaseDesign: [
      {
        tableName: 'inventory_ledger',
        type: 'SQL',
        shardingKey: 'item_id',
        fields: [
          { name: 'id', type: 'BIGINT', isPrimary: true },
          { name: 'item_id', type: 'VARCHAR(32)', isIndex: true },
          { name: 'order_id', type: 'UUID' },
          { name: 'delta', type: 'INT', notes: '-1 for sold, +1 for return/cancel' },
          { name: 'balance_after', type: 'INT' },
          { name: 'created_at', type: 'TIMESTAMP' }
        ],
        notes: 'Immutable double-entry inventory ledger preventing update anomalies.'
      }
    ],
    deepDives: [
      {
        title: 'The Atomic Lua Script: Zero-Race Condition Stock Deduction',
        subtitle: 'Why SQL Transactions fail under 500k QPS and how Redis solves it',
        content: `In standard SQL: UPDATE inventory SET stock = stock - 1 WHERE id = 1 AND stock > 0;\nAt 100,000 concurrent requests, every single transaction tries to acquire an exclusive row lock on row ID 1. Result: MySQL InnoDB lock table overflows, CPU hits 100%, and connection pools exhaust in 2 seconds.\n\nRedis Lua Script Solution:\nBecause Redis executes Lua scripts as a single atomic unit on its main event loop, no other command can run concurrently during execution:\n\n\`\`\`lua\nlocal stockKey = KEYS[1]\nlocal userSetKey = KEYS[2]\nlocal userId = ARGV[1]\n\n-- 1. Check if user already bought\nif redis.call('SISMEMBER', userSetKey, userId) == 1 then\n    return -1 -- Already purchased error\nend\n\n-- 2. Check stock\nlocal stock = tonumber(redis.call('GET', stockKey) or 0)\nif stock <= 0 then\n    return 0 -- Sold out\nend\n\n-- 3. Atomic Decrement\nredis.call('DECR', stockKey)\nredis.call('SADD', userSetKey, userId)\nreturn 1 -- Success! Stock reserved.\n\`\`\``,
        keyTakeaways: [
          'Redis Lua scripts execute in < 0.2ms with guaranteed atomicity.',
          'Stock check, decrement, and duplicate user guard happen in a single operation.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Single Redis Master CPU Saturation (Max ~100k ops/sec)',
        impact: 'A single Redis instance maxes out at ~100,000 QPS, bottlenecking a 500k QPS sale.',
        mitigation: 'Stock Sharding / Partitioning: Divide 1,000 stock units across 10 independent Redis keys (item:ps5:shard:0 to item:ps5:shard:9 with 100 units each) and hash users to shards.'
      }
    ],
    interviewQA: [
      {
        question: 'What happens if a user reserves stock, closes the browser, and never pays?',
        hint: 'TTL and automated inventory rollback.',
        goodAnswer: 'The reservation is created in Redis with a 10-minute TTL. A delayed task (using Redis Key Expiration notification or a Kafka delayed queue) checks order payment status after 10 minutes. If unpaid, it cancels the order and executes INCR on the Redis stock key, putting the item back on sale.',
        pitfalls: 'Permanently holding stock without automated timeout rollback.'
      }
    ],
    similarSystems: ['Ticketmaster Concert Drops', 'Nike SNKRS App', 'Shopee Flash Sales'],
    tags: ['Redis Lua', 'Distributed Lock', 'Thundering Herd', 'Kafka', 'PostgreSQL Ledger']
  },
  {
    id: 'uber-ride-hailing',
    title: 'Design Uber / Lyft (Real-Time Ride Hailing & Driver Matching)',
    slug: 'uber-ride-hailing',
    tagline: 'High-frequency geospatial indexing, Uber H3 Hexagonal spatial partitions, driver-rider matching, and dynamic surge pricing.',
    category: 'E-Commerce & Marketplaces',
    difficulty: 'Advanced',
    readTime: '26 min read',
    scaleSummary: {
      dau: '150 Million Active Riders / 5 Million Active Drivers',
      qps: '1,000,000 Location Pings/sec / 50,000 Trip Dispatches/sec',
      storage: '50 TB / day GPS trajectory telemetry',
      bandwidth: '20 GB/s Real-time WebSocket Ingress'
    },
    overview: 'Uber connects riders with nearby drivers in real-time. Active drivers stream GPS coordinates every 4 seconds. When a rider requests a trip, the dispatch engine locates candidate drivers within a 3km radius, ranks them by ETA, and dispatches the ride request with sub-second matching.',
    keyChallenges: [
      'High-Frequency Geospatial Writes: 5 Million drivers sending GPS location pings every 4 seconds = 1,250,000 writes/sec',
      'Fast Spatial Proximity Queries: Finding all available drivers in a bounding box in < 15ms',
      'Choosing between Geohash vs QuadTree vs Uber H3 Hexagonal Spatial Indexing',
      'Dynamic Surge Pricing Engine: Calculating local supply vs demand imbalances in real time'
    ],
    functionalRequirements: [
      'Drivers stream real-time GPS location (latitude, longitude) every 4 seconds',
      'Riders view real-time nearby drivers on a map with smooth movement animations',
      'Rider requests a ride -> System matches with closest optimal driver',
      'Driver accepts/declines trip; if declined, dispatch to next nearest driver',
      'Calculate dynamic surge pricing multiplier based on local supply/demand'
    ],
    nonFunctionalRequirements: [
      'Sub-second driver matching (< 1000ms dispatch time)',
      'Sub-50ms nearby driver map query latency',
      'High Availability (99.99%) across global metropolitan cities',
      'Zero double-booking: A driver can never be matched to 2 rides simultaneously'
    ],
    outOfScope: ['Autonomous vehicle sensor fusion processing', 'Fleet vehicle maintenance scheduling'],
    capacityEstimations: {
      assumptions: [
        '5M active drivers sending GPS every 4s = 1,250,000 location writes/sec globally',
        'Payload per ping: 64 bytes (driver_id, lat, lng, bearing, timestamp, status)',
        'Write Ingress = 1.25M * 64 bytes = 80 MB/sec',
        'Rider app polls nearby drivers every 5 seconds (20M active app opens = 4M read queries/sec)'
      ],
      metrics: [
        { label: 'Location Ingress QPS', value: '1,250,000 / sec', formula: '5M drivers / 4 second interval', description: 'High-frequency GPS pings' },
        { label: 'Dispatch Match QPS', value: '50,000 / sec', formula: 'Peak global ride requests', description: 'Matching engine lookups' },
        { label: 'In-Memory Spatial Index', value: '12 GB RAM', formula: '5M drivers * 2.4 KB per H3 index entry in Redis', description: 'RAM for global driver spatial index' }
      ],
      conclusion: 'Traditional disk databases cannot handle 1.25M spatial writes/sec; an in-memory spatial index (Redis Geospatial / Uber H3 in RAM) is mandatory.'
    },
    architecture: {
      summary: 'Drivers emit GPS pings over WebSockets/gRPC -> Location Ingestion Service updates in-memory H3 spatial index in Redis. Rider requests trip -> Dispatch Engine queries Hexagonal cells around rider -> Dispatches offer to highest-ranked driver -> Manages state machine via Saga pattern.',
      nodes: [
        { id: 'driver', label: 'Driver App (iOS/Android)', type: 'client', x: 8, y: 30, description: 'Emits GPS coordinates every 4s' },
        { id: 'rider', label: 'Rider App', type: 'client', x: 8, y: 70, description: 'Requests ride & views live map' },
        { id: 'lb', label: 'L4 Network Load Balancer', type: 'load_balancer', x: 26, y: 50, description: 'Distributes persistent TCP/WebSocket connections', techStack: ['AWS NLB'] },
        { id: 'location_srv', label: 'Location Ingestion Service', type: 'service', x: 48, y: 30, description: 'Buffers and indexes driver coordinates', techStack: ['Go / Netty'] },
        { id: 'dispatch_srv', label: 'Dispatch & Matching Engine', type: 'service', x: 48, y: 70, description: 'Matches rider with optimal driver', techStack: ['Java / Ringpop DAG'] },
        { id: 'h3_index', label: 'H3 Spatial Index (Redis)', type: 'cache', x: 75, y: 30, description: 'Hexagonal cell-based driver location store', techStack: ['Redis Geospatial / H3'], scaleMetric: 'Sub-millisecond radial lookup' },
        { id: 'trip_db', label: 'Trip & Ledger Database', type: 'database', x: 75, y: 70, description: 'Durable trip state and payment records', techStack: ['PostgreSQL / Docstore'] },
        { id: 'surge_engine', label: 'Surge Pricing Engine', type: 'worker', x: 92, y: 50, description: 'Calculates H3 hex cell supply vs demand', techStack: ['Apache Flink'] }
      ],
      edges: [
        { id: 'e1', from: 'driver', to: 'location_srv', label: '1. GPS Ping (lat, lng, status)', protocol: 'WebSocket' },
        { id: 'e2', from: 'location_srv', to: 'h3_index', label: '2. GEOADD driver_locations', protocol: 'TCP' },
        { id: 'e3', from: 'rider', to: 'dispatch_srv', label: '3. Request Ride (pickup, dropoff)', protocol: 'HTTPS' },
        { id: 'e4', from: 'dispatch_srv', to: 'h3_index', label: '4. GEORADIUS 3km (Find Drivers)', protocol: 'TCP' },
        { id: 'e5', from: 'dispatch_srv', to: 'surge_engine', label: '5. Query Surge Multiplier', protocol: 'Internal RPC' },
        { id: 'e6', from: 'dispatch_srv', to: 'driver', label: '6. Push Ride Offer (15s timer)', protocol: 'WebSocket' },
        { id: 'e7', from: 'dispatch_srv', to: 'trip_db', label: '7. Create Trip Record', protocol: 'SQL' }
      ],
      flowSteps: [
        { step: 1, title: 'High-Frequency Driver GPS Ingestion', description: 'Driver sends location ping over persistent WebSocket. Location Service converts (lat, lng) to an Uber H3 Resolution 8 Hexagon ID (~460m radius) and updates Redis.', activeNodes: ['driver', 'location_srv', 'h3_index'], highlightDetails: 'Sub-2ms update using Redis GEOADD / H3 Bitsets.', latencyEstimate: '15ms' },
        { step: 2, title: 'Rider Request & Proximity Search', description: 'Rider requests ride at 5th Ave, NY. Dispatch Service computes H3 cell for pickup location and queries Redis for all "AVAILABLE" drivers in the current cell and 6 neighboring hexagonal cells (k-ring = 1).', activeNodes: ['rider', 'dispatch_srv', 'h3_index'], highlightDetails: 'Hexagons have equidistant neighbors, eliminating corner distortions of square grids.', latencyEstimate: '10ms' },
        { step: 3, title: 'Driver Ranking & Offer Dispatch', description: 'Dispatch Engine calculates true road ETA for candidate drivers via routing graph (OSRM), applies surge multiplier, and pushes ride offer to top-ranked driver with a 15-second countdown timer.', activeNodes: ['dispatch_srv', 'surge_engine', 'driver'], highlightDetails: 'Driver lock is placed in Redis to prevent another rider from matching same driver.', latencyEstimate: '80ms' },
        { step: 4, title: 'Trip Acceptance & Real-Time Tracking', description: 'Driver taps "Accept". Dispatch creates Trip record in PostgreSQL and establishes bidirectional WebSocket channel streaming driver real-time progress to rider map.', activeNodes: ['driver', 'dispatch_srv', 'trip_db', 'rider'], highlightDetails: 'Map interpolates car movement smoothly along route polyline.', latencyEstimate: '40ms' }
      ]
    },
    apiDesign: [
      {
        method: 'POST',
        path: '/api/v1/trips/request',
        description: 'Request a new ride',
        requestBody: '{\n  "rider_id": "r_1029",\n  "pickup": { "lat": 40.7128, "lng": -74.0060 },\n  "dropoff": { "lat": 40.7589, "lng": -73.9851 },\n  "vehicle_type": "UBER_X"\n}',
        responseBody: '{\n  "trip_id": "trip_9876",\n  "status": "SEARCHING_FOR_DRIVER",\n  "estimated_fare": 24.50,\n  "surge_multiplier": 1.2\n}'
      }
    ],
    databaseDesign: [
      {
        tableName: 'trips',
        type: 'SQL',
        shardingKey: 'trip_id',
        fields: [
          { name: 'trip_id', type: 'UUID', isPrimary: true },
          { name: 'rider_id', type: 'UUID', isIndex: true },
          { name: 'driver_id', type: 'UUID', isIndex: true },
          { name: 'status', type: 'VARCHAR(32)', notes: 'REQUESTED, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED' },
          { name: 'fare_amount', type: 'DECIMAL(10,2)' },
          { name: 'created_at', type: 'TIMESTAMP' }
        ],
        notes: 'PostgreSQL sharded by city_id with strict ACID transaction guarantees.'
      }
    ],
    deepDives: [
      {
        title: 'Geospatial Indexing Comparison: Geohash vs QuadTree vs Uber H3 Hexagonal Grid',
        subtitle: 'Why Uber invented and open-sourced the H3 Hexagonal Hierarchical Spatial Index',
        content: `1. Geohash (Base32 encoded rectangular bounding boxes):\n- Interleaves latitude and longitude bits into a string (e.g. "9q8yy").\n- Cons: Rectangles have severe edge distortion near poles and variable distance to diagonal neighbors (a square has 8 neighbors: 4 orthogonal at distance D, 4 diagonal at distance D*sqrt(2)).\n\n2. QuadTree (Hierarchical 4-way tree spatial partition):\n- Cons: Rebalancing trees in memory under 1.25 Million writes/sec creates lock contention.\n\n3. Uber H3 (Hexagonal Grid):\n- Earth is partitioned into 122 base icosahedron cells, subdivided into hexagons across 16 resolution levels.\n- Why Hexagons are Superior:\n  - Every hexagon has exactly 6 neighbors, and every neighbor is at the EXACT SAME distance!\n  - Finding all neighbors at radius K is a constant-time k-ring expansion: H3.kRing(h3Index, 2).\n  - Hexagons model human city movement and road networks with minimal geometric distortion.`,
        keyTakeaways: [
          'H3 indexes are compact 64-bit integers, fitting effortlessly into CPU registers and Redis Bitsets.',
          'Surge pricing is calculated per H3 hexagonal cell (Resolution 7 / ~1.2 km²).'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Double Dispatch Race Condition',
        impact: 'Two riders requesting at the same millisecond are both matched to the same driver.',
        mitigation: 'Use Redis Distributed Lock (SET driver:lock:id 1 NX EX 15) when dispatching an offer. If locked, skip to next driver candidate.'
      }
    ],
    interviewQA: [
      {
        question: 'How do you calculate Surge Pricing in real time without lagging the dispatch engine?',
        hint: 'Stream processing with Apache Flink.',
        goodAnswer: 'Rider app opens emit "demand events" while driver pings emit "supply events". Apache Flink computes supply/demand ratios for every H3 cell in a 15-second sliding window and writes the resulting surge multiplier table to Redis, allowing the dispatch service to read surge rates in O(1) time.',
        pitfalls: 'Running heavy COUNT(*) SQL queries across live tables on every trip request.'
      }
    ],
    similarSystems: ['Lyft', 'Grab', 'DiDi', 'Bolt'],
    tags: ['Geospatial H3', 'Redis Geospatial', 'WebSockets', 'Dispatch Engine', 'Flink']
  },
  {
    id: 'airbnb-booking',
    title: 'Design Airbnb / Hotel Booking & Availability Calendar',
    slug: 'airbnb-booking-calendar',
    tagline: 'High-performance date-range inventory indexing, calendar availability search, and two-phase commit booking workflows.',
    category: 'E-Commerce & Marketplaces',
    difficulty: 'Advanced',
    readTime: '22 min read',
    scaleSummary: {
      dau: '50 Million Active Guests / 7 Million Property Listings',
      qps: '80,000 Search QPS / 5,000 Booking Attempts/sec',
      storage: '10 TB active listing and reservation calendar records',
      bandwidth: '15 GB/s Search Egress'
    },
    overview: 'Airbnb allows guests to search millions of unique homes worldwide by destination, guest count, price, and exact check-in/check-out dates. The system must query date-range availability in milliseconds and execute zero-double-booking reservations.',
    keyChallenges: [
      'Date-Range Availability Search: Searching 7M listings for available windows (e.g. July 10 to July 17) in < 100ms',
      'Preventing Double Bookings on the exact same property across concurrent checkout sessions',
      'Search Ranking with dynamic pricing, reviews, and host response rate filters',
      'Two-Phase Payment & Host Acceptance Workflow'
    ],
    functionalRequirements: [
      'Hosts publish property listings and configure calendar pricing/availability',
      'Guests search for listings by city, dates (check-in/check-out), and amenities',
      'Instant booking and request-to-book reservation flows',
      'Hold calendar dates during guest payment processing',
      'Manage cancellation policies and refund calculations'
    ],
    nonFunctionalRequirements: [
      'Search query latency < 100ms globally',
      'Strict Consistency: Zero double-booking for the same property on overlapping dates',
      'High Availability for search and browsing (99.99%)',
      'PCI-DSS compliance for payment token handling'
    ],
    outOfScope: ['Host-guest damage dispute insurance claims workflow'],
    capacityEstimations: {
      assumptions: [
        '7 Million active listings; each listing has 365 days of calendar state = ~2.55 Billion calendar day records',
        '80,000 search QPS during peak holiday travel booking seasons',
        '5,000 concurrent checkout bookings/sec peak'
      ],
      metrics: [
        { label: 'Search Query QPS', value: '80,000 QPS', formula: 'Peak location + date range searches', description: 'Elasticsearch / Inverted Index' },
        { label: 'Calendar Records', value: '2.55 Billion Days', formula: '7M listings * 365 days', description: 'Bitset / Date Range Index' },
        { label: 'Booking Write QPS', value: '5,000 QPS', formula: 'Peak reservation attempts', description: 'ACID PostgreSQL booking engine' }
      ],
      conclusion: 'A bitset-based calendar availability index in Elasticsearch/Redis delivers sub-50ms date-range filtering.'
    },
    architecture: {
      summary: 'Guests query Search Service -> Filtered by Elasticsearch (Location + Date Range Availability Bitset) -> Listing Details from Redis/PostgreSQL -> Booking Service places pessimistic date lock in PostgreSQL -> Payment Service processes charge -> Emits Kafka event to confirm reservation.',
      nodes: [
        { id: 'client', label: 'Guest Web / Mobile App', type: 'client', x: 8, y: 50, description: 'Searches homes and books stays' },
        { id: 'gateway', label: 'API Gateway', type: 'gateway', x: 26, y: 50, description: 'Routes search and checkout requests', techStack: ['Envoy'] },
        { id: 'search_srv', label: 'Search & Ranking Service', type: 'service', x: 50, y: 30, description: 'Filters listings by geo, price, amenities, dates', techStack: ['Java / Kotlin'] },
        { id: 'booking_srv', label: 'Booking & Reservation Service', type: 'service', x: 50, y: 70, description: 'Coordinates ACID reservation locks', techStack: ['Go / Rails'] },
        { id: 'es_search', label: 'Elasticsearch Cluster', type: 'search', x: 75, y: 20, description: 'Indexes listing tags & availability bitsets', techStack: ['Elasticsearch 8'] },
        { id: 'listing_db', label: 'Listing & Calendar DB', type: 'database', x: 75, y: 50, description: 'PostgreSQL with date exclusion constraints', techStack: ['PostgreSQL with btree_gist'] },
        { id: 'payment_srv', label: 'Payment Gateway Broker', type: 'service', x: 75, y: 80, description: 'Executes credit card authorizations', techStack: ['Stripe / Braintree'] }
      ],
      edges: [
        { id: 'e1', from: 'client', to: 'gateway', label: '1. GET /search?city=Paris&checkin=..', protocol: 'HTTPS' },
        { id: 'e2', from: 'gateway', to: 'search_srv', label: '2. Route Search', protocol: 'Internal RPC' },
        { id: 'e3', from: 'search_srv', to: 'es_search', label: '3. Query Inverted Index', protocol: 'Internal RPC' },
        { id: 'e4', from: 'client', to: 'gateway', label: '4. POST /bookings/reserve', protocol: 'HTTPS' },
        { id: 'e5', from: 'gateway', to: 'booking_srv', label: '5. Initiate Booking', protocol: 'Internal RPC' },
        { id: 'e6', from: 'booking_srv', to: 'listing_db', label: '6. Check Exclusion Constraint', protocol: 'SQL' },
        { id: 'e7', from: 'booking_srv', to: 'payment_srv', label: '7. Authorize Payment', protocol: 'HTTPS' }
      ],
      flowSteps: [
        { step: 1, title: 'Fast Date-Range Search', description: 'Guest searches for "Paris, July 10-15". Search service queries Elasticsearch using pre-indexed 365-day availability bitsets, returning 500 matching listing IDs.', activeNodes: ['client', 'gateway', 'search_srv', 'es_search'], highlightDetails: 'Bitwise AND operations across date bitmasks filter 7M listings in < 30ms.', latencyEstimate: '35ms' },
        { step: 2, title: 'Pessimistic Date Lock & Reservation', description: 'Guest clicks "Reserve". Booking service inserts tentative reservation with status="PENDING" into PostgreSQL using a range exclusion constraint (EXCLUDE USING gist (listing_id WITH =, date_range WITH &&)).', activeNodes: ['client', 'booking_srv', 'listing_db'], highlightDetails: 'Database engine physically prevents overlapping dates from being committed.', latencyEstimate: '15ms' },
        { step: 3, title: 'Payment Capture & Confirmation', description: 'Booking service contacts Payment Gateway. Once authorized, order status is updated to "CONFIRMED" and CDC pipeline asynchronously updates Elasticsearch availability bitset.', activeNodes: ['booking_srv', 'payment_srv', 'listing_db', 'es_search'], highlightDetails: 'Ensures strict ACID correctness with eventual consistency for search index.', latencyEstimate: '800ms' }
      ]
    },
    apiDesign: [
      {
        method: 'POST',
        path: '/api/v1/reservations',
        description: 'Reserve property dates with idempotency protection',
        requestBody: '{\n  "listing_id": "list_8921",\n  "check_in": "2026-07-10",\n  "check_out": "2026-07-17",\n  "guests": 2,\n  "idempotency_key": "res_a89x20"\n}',
        responseBody: '{\n  "reservation_id": "res_55410",\n  "status": "CONFIRMED",\n  "total_price": 1420.00\n}'
      }
    ],
    databaseDesign: [
      {
        tableName: 'reservations',
        type: 'SQL',
        shardingKey: 'listing_id',
        fields: [
          { name: 'id', type: 'UUID', isPrimary: true },
          { name: 'listing_id', type: 'UUID', isIndex: true },
          { name: 'guest_id', type: 'UUID', isIndex: true },
          { name: 'stay_range', type: 'DATERANGE', notes: '[2026-07-10, 2026-07-17)' },
          { name: 'status', type: 'VARCHAR(20)', notes: 'PENDING, CONFIRMED, CANCELLED' }
        ],
        notes: 'PostgreSQL table with CONSTRAINT no_overlap EXCLUDE USING gist (listing_id WITH =, stay_range WITH &&) WHERE (status = "CONFIRMED").'
      }
    ],
    deepDives: [
      {
        title: 'PostgreSQL Range Types & Exclusion Constraints: The Zero Double-Booking Guarantee',
        subtitle: 'How mathematical set intervals replace fragile application-level locks',
        content: `Traditional approach: Application queries SELECT * FROM bookings WHERE check_in < end AND check_out > start; if empty, execute INSERT. Under concurrent race conditions, two requests both see 0 rows and both insert overlapping bookings (Double Booking disaster!).\n\nPostgreSQL DATERANGE with GiST Index Solution:\n\`\`\`sql\nCREATE EXTENSION btree_gist;\nCREATE TABLE reservations (\n    id UUID PRIMARY KEY,\n    listing_id UUID NOT NULL,\n    stay_range DATERANGE NOT NULL,\n    status VARCHAR(20) NOT NULL,\n    EXCLUDE USING gist (\n        listing_id WITH =,\n        stay_range WITH &&\n    ) WHERE (status IN ('CONFIRMED', 'PENDING_PAYMENT'))\n);\n\`\`\`\nThe PostgreSQL storage engine enforces non-overlapping interval geometry at the index level. Any conflicting write fails with error 23P01 (exclusion_violation) deterministically!`,
        keyTakeaways: [
          'Exclusion constraints eliminate race conditions at the database kernel level.',
          'No complex distributed Redis locks required for reservation integrity.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Search Index Drift on Rapid Bookings',
        impact: 'A listing booked 5 seconds ago still appears available in search results.',
        mitigation: 'Search Service performs a fast secondary availability check on candidate listings before rendering the checkout page, and Debezium CDC syncs DB commits to Elasticsearch in < 500ms.'
      }
    ],
    interviewQA: [
      {
        question: 'How do you handle host pricing rules (e.g. Weekend surge, Holiday discount, Cleaning fees)?',
        hint: 'Dynamic price calculation engine.',
        goodAnswer: 'Store base listing price and structured pricing rules (JSON) in PostgreSQL. When generating the checkout invoice, a Price Calculation Engine executes a deterministic rule pipeline: Base Rate * Nights + Weekend Deltas + Cleaning Fee + Service Fee + Local Occupancy Tax.',
        pitfalls: 'Storing hardcoded static daily prices without structured rules.'
      }
    ],
    similarSystems: ['Booking.com', 'Expedia', 'Vrbo', 'Hotels.com'],
    tags: ['PostgreSQL GiST', 'Elasticsearch', 'Availability Bitset', 'Date Range', 'Stripe']
  },
  {
    id: 'doordash-food-delivery',
    title: 'Design DoorDash / Deliveroo (Multi-Party Delivery & Routing)',
    slug: 'doordash-food-delivery',
    tagline: 'Three-sided marketplace orchestration (Customer, Restaurant, Courier), real-time order dispatch, and ETA prediction.',
    category: 'E-Commerce & Marketplaces',
    difficulty: 'Advanced',
    readTime: '23 min read',
    scaleSummary: {
      dau: '30 Million Active Diners / 500,000 Restaurants / 1 Million Couriers',
      qps: '35,000 Orders/sec peak / 500,000 Live Tracking Sockets',
      storage: '15 TB / year order and trajectory data',
      bandwidth: '10 GB/s WebSocket Live Tracking'
    },
    overview: 'A three-sided food delivery marketplace coordinates customers ordering food, restaurants preparing meals, and mobile couriers (drivers/bikers) delivering food. The system optimizes courier batching, kitchen preparation prep times, and live GPS map tracking.',
    keyChallenges: [
      'Three-Party Distributed State Machine (Order Placed -> Kitchen Accepted -> Food Cooking -> Courier Dispatched -> Food Picked Up -> Delivered)',
      'Multi-Stop Route Batching: Assigning 2 orders from adjacent restaurants to 1 courier without food getting cold',
      'Dynamic ETA Prediction Engine: Factoring in restaurant kitchen queue depth, traffic congestion, and parking search time',
      'Real-Time Live Courier Tracking on Customer Mobile Map'
    ],
    functionalRequirements: [
      'Customer browses restaurant menus, customizes items, and places orders',
      'Restaurant merchant portal receives orders, adjusts prep time, and marks food ready',
      'Courier app receives dispatch offer with route details and earnings',
      'Customer and restaurant track courier live location on map in real time',
      'Automated dispatch optimization matching courier arrival with food readiness'
    ],
    nonFunctionalRequirements: [
      'Live tracking GPS updates rendered in < 1 second on customer device',
      'Strict order state transitions: Zero orphaned or lost orders',
      'High Availability 99.99%',
      'Accurate ETAs (+/- 3 minutes precision)'
    ],
    outOfScope: ['Kitchen inventory ingredient automated supplier procurement'],
    capacityEstimations: {
      assumptions: [
        '30M active diners; 5M meals ordered per day (Peak dinner window 6-8 PM = 35,000 orders/sec)',
        '1M active couriers transmitting GPS coordinates every 5 seconds = 200,000 location pings/sec',
        '500,000 concurrent active orders tracked simultaneously'
      ],
      metrics: [
        { label: 'Order Placement QPS', value: '35,000 QPS', formula: 'Peak dinner rush order creations', description: 'Order Service Transactional Engine' },
        { label: 'Courier GPS Stream', value: '200,000 pings/sec', formula: '1M couriers / 5s ping interval', description: 'Location Ingestion Pipeline' },
        { label: 'Active Tracking Sockets', value: '500,000 Sockets', formula: 'Open customer tracking WebSocket sessions', description: 'Real-Time Gateway Fleet' }
      ],
      conclusion: 'The Dispatch Engine must optimize courier assignments using mixed-integer linear programming (MILP) or simulated annealing in worker batches.'
    },
    architecture: {
      summary: 'Customers place order via API Gateway -> Order Service manages Temporal Workflow state machine -> Dispatch Engine matches courier based on kitchen food prep timer -> Courier location streamed via Redis to Customer Tracking Gateway via WebSockets.',
      nodes: [
        { id: 'customer', label: 'Customer App', type: 'client', x: 8, y: 20, description: 'Places order and tracks live delivery' },
        { id: 'restaurant', label: 'Merchant Tablet App', type: 'client', x: 8, y: 50, description: 'Confirms order & sets prep duration' },
        { id: 'courier', label: 'Courier App (Dasher)', type: 'client', x: 8, y: 80, description: 'Receives delivery route & streams GPS' },
        { id: 'gateway', label: 'API Gateway & WS Hub', type: 'gateway', x: 30, y: 50, description: 'Routes orders & WebSocket tracking', techStack: ['Envoy / Go'] },
        { id: 'order_srv', label: 'Order State Workflow Engine', type: 'service', x: 55, y: 20, description: 'Orchestrates 3-sided state transitions', techStack: ['Temporal / Go'] },
        { id: 'dispatch_srv', label: 'Dispatch & Batching Optimizer', type: 'service', x: 55, y: 60, description: 'Calculates multi-stop courier routes', techStack: ['C++ / Python OSRM'] },
        { id: 'redis_geo', label: 'Live Location & Session Cache', type: 'cache', x: 80, y: 60, description: 'Stores live courier coordinates', techStack: ['Redis Cluster'] },
        { id: 'db', label: 'Orders & Payments DB', type: 'database', x: 80, y: 20, description: 'ACID transactional order records', techStack: ['PostgreSQL'] }
      ],
      edges: [
        { id: 'e1', from: 'customer', to: 'gateway', label: '1. Place Order', protocol: 'HTTPS' },
        { id: 'e2', from: 'gateway', to: 'order_srv', label: '2. Start Workflow', protocol: 'Internal RPC' },
        { id: 'e3', from: 'order_srv', to: 'restaurant', label: '3. Notify Kitchen (WebSocket)', protocol: 'WebSocket' },
        { id: 'e4', from: 'restaurant', to: 'order_srv', label: '4. Accept (Prep: 15 min)', protocol: 'HTTPS' },
        { id: 'e5', from: 'order_srv', to: 'dispatch_srv', label: '5. Schedule Courier Dispatch', protocol: 'Internal RPC' },
        { id: 'e6', from: 'dispatch_srv', to: 'courier', label: '6. Push Delivery Offer', protocol: 'WebSocket' },
        { id: 'e7', from: 'courier', to: 'gateway', label: '7. Stream GPS Ping (5s)', protocol: 'WebSocket' },
        { id: 'e8', from: 'gateway', to: 'customer', label: '8. Push Courier Position', protocol: 'WebSocket' }
      ],
      flowSteps: [
        { step: 1, title: 'Order Placement & Kitchen Notification', description: 'Customer submits cart. Order Service creates order record in PostgreSQL and pushes instant audio alert to Restaurant Merchant tablet over WebSocket.', activeNodes: ['customer', 'gateway', 'order_srv', 'db', 'restaurant'], highlightDetails: 'Temporal workflow manages order timeout timers.', latencyEstimate: '45ms' },
        { step: 2, title: 'Smart Kitchen Prep-Aware Dispatch', description: 'Merchant sets "Prep Time = 18 minutes". Dispatch Engine does NOT dispatch a courier immediately (which causes courier to wait idle at restaurant). It calculates courier travel time (e.g. 6 mins) and triggers dispatch offer at minute 12.', activeNodes: ['restaurant', 'order_srv', 'dispatch_srv'], highlightDetails: 'Minimizes courier idle wait time and food temperature degradation.', latencyEstimate: '100ms' },
        { step: 3, title: 'Courier Acceptance & Navigation', description: 'Courier accepts job. Dispatch routes courier to restaurant, notifies kitchen when courier is 2 minutes away, and transitions order state to "FOOD_PICKED_UP".', activeNodes: ['dispatch_srv', 'courier', 'order_srv'], highlightDetails: 'OSRM routing calculates optimal turn-by-turn navigation.', latencyEstimate: '30ms' },
        { step: 4, title: 'Live Tracking Push to Customer Map', description: 'As courier rides to customer, GPS updates stream to Gateway -> Redis -> Pushed directly down customer WebSocket channel, rendering smooth bike animation.', activeNodes: ['courier', 'gateway', 'redis_geo', 'customer'], highlightDetails: 'Sub-second real-time position updates.', latencyEstimate: '150ms' }
      ]
    },
    apiDesign: [
      {
        method: 'POST',
        path: '/api/v1/orders',
        description: 'Create food order',
        requestBody: '{\n  "restaurant_id": "rest_992",\n  "items": [{ "item_id": "burger_1", "qty": 2, "options": ["NO_ONION"] }],\n  "delivery_address": "123 Main St, Apt 4B"\n}',
        responseBody: '{\n  "order_id": "ord_88192",\n  "status": "SENT_TO_RESTAURANT",\n  "estimated_delivery_time": "19:25:00"\n}'
      }
    ],
    databaseDesign: [
      {
        tableName: 'delivery_orders',
        type: 'SQL',
        shardingKey: 'order_id',
        fields: [
          { name: 'order_id', type: 'UUID', isPrimary: true },
          { name: 'customer_id', type: 'UUID', isIndex: true },
          { name: 'restaurant_id', type: 'UUID', isIndex: true },
          { name: 'courier_id', type: 'UUID', isIndex: true },
          { name: 'state', type: 'VARCHAR(32)' },
          { name: 'quoted_eta', type: 'TIMESTAMP' },
          { name: 'actual_delivered_at', type: 'TIMESTAMP' }
        ],
        notes: 'PostgreSQL database with strict state machine transition constraints.'
      }
    ],
    deepDives: [
      {
        title: 'Order Fulfillment State Machine: Temporal Workflow Orchestration',
        subtitle: 'Why Sagas and Workflows are essential for multi-party distributed systems',
        content: `A delivery order involves 3 independent human actors and multiple asynchronous events across 45 minutes.\n\nFailure Modes:\n- Restaurant rejects order after payment authorization.\n- No courier accepts dispatch offer within 10 minutes.\n- Courier vehicle breaks down mid-delivery.\n\nSolution: Temporal / Cadence Durable Workflow:\n- The entire delivery lifecycle is coded as a deterministic workflow with automated retry policies, timers, and compensation actions (e.g. refund credit card if no courier found within 15 minutes).\n- Workflow state persists across server crashes and network partitions automatically.`,
        keyTakeaways: [
          'Durable execution frameworks eliminate manual distributed state recovery code.',
          'Compensating transactions ensure customers are never charged for unfulfilled orders.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Dinner Rush Restaurant Bottlenecks',
        impact: 'A popular burger joint receives 200 orders in 10 minutes, resulting in 90-minute kitchen delays.',
        mitigation: 'Implement Dynamic Kitchen Throttling: Algorithmically pause restaurant listing or extend quoted prep times when active kitchen ticket queue depth exceeds capacity.'
      }
    ],
    interviewQA: [
      {
        question: 'How do you batch two orders to the same courier efficiently?',
        hint: 'Multi-stop Traveling Salesperson Problem (TSP).',
        goodAnswer: 'When Order B is placed near Restaurant A with dropoff near Customer A, calculate incremental detour time: Detour Time = (Route A+B duration) - (Route A duration). If detour < 8 minutes and food temperature constraints are satisfied, batch the orders and discount delivery fees.',
        pitfalls: 'Batching orders with opposite geographical trajectories.'
      }
    ],
    similarSystems: ['Uber Eats', 'Grubhub', 'Instacart', 'Zomato'],
    tags: ['Temporal Workflow', 'Geospatial', 'State Machine', 'WebSockets', 'PostgreSQL']
  },
  {
    id: 'stripe-payment-gateway',
    title: 'Design Stripe / Distributed Payment Gateway & Ledger',
    slug: 'stripe-payment-gateway',
    tagline: 'High-reliability financial ledger architecture, double-entry bookkeeping, idempotency keys, and 99.999% ACID payment execution.',
    category: 'Financial & High Throughput',
    difficulty: 'Advanced',
    readTime: '26 min read',
    scaleSummary: {
      dau: '100 Million Transactions / day',
      qps: '15,000 Transactions/sec (Peak 40,000)',
      storage: '100% Immutable Append-Only Financial Ledger (Zero data loss tolerance)',
      bandwidth: '5 GB/s Encrypted Traffic'
    },
    overview: 'A global payment platform enables merchants to accept credit cards, digital wallets, and bank transfers worldwide. The system demands strict idempotency, absolute ACID transactional consistency, double-entry immutable ledgers, and fault-tolerant third-party bank integration.',
    keyChallenges: [
      'Strict Idempotency: Network retries must NEVER charge a customer twice',
      'The Dual-Write Problem: Coordinating local database balance commits with external bank API HTTP calls',
      'Immutable Double-Entry Accounting: Every financial transaction must debit one account and credit another (Sum of all entries = $0.00)',
      'Zero-Downtime Multi-Region Database Replication without cross-region split-brain'
    ],
    functionalRequirements: [
      'Process credit card charges with external banking networks (Visa, Mastercard, Amex)',
      'Idempotent API: Safe client retries using Idempotency-Key headers',
      'Double-entry balance ledger tracking merchant balances and platform fees',
      'Automated payout engine settling funds to merchant bank accounts (T+2 days)',
      'Webhook notification dispatcher delivering payment events to merchant servers'
    ],
    nonFunctionalRequirements: [
      '100% Consistency: Zero money lost, zero double charges',
      'High Availability: 99.999% uptime for payment API endpoints',
      'End-to-End Latency < 1.5 seconds for complete card authorization',
      'Strict PCI-DSS compliance (Card numbers tokenized via HSM / Vault)'
    ],
    outOfScope: ['Physical POS terminal hardware firmware flashing'],
    capacityEstimations: {
      assumptions: [
        '100M transactions processed per day (~1,160 tx/sec avg, 40,000 peak QPS during Black Friday)',
        'Average transaction ledger entry: 1 KB (Debit entry, Credit entry, Metadata, Audit Hash)',
        'Storage: 100M * 1 KB = 100 GB/day = 36.5 TB/year of immutable ledger records'
      ],
      metrics: [
        { label: 'Peak Transaction QPS', value: '40,000 QPS', formula: 'Black Friday peak authorization attempts', description: 'Idempotent Payment Engine' },
        { label: 'Ledger Audit Volume', value: '36.5 TB / year', formula: '100% append-only immutable accounting entries', description: 'Distributed Spanner / PostgreSQL' },
        { label: 'Card Authorization Latency', value: '< 1,200 ms', formula: 'Includes 2 bank roundtrips over Visa/Mastercard networks', description: 'P99 Execution SLA' }
      ],
      conclusion: 'A distributed ACID database (Google Cloud Spanner or CockroachDB) with Raft/Paxos consensus is required for the ledger.'
    },
    architecture: {
      summary: 'Merchant calls API Gateway with Idempotency-Key -> Idempotency Filter locks key in Redis/DB -> Card Tokenization Vault generates token -> Payment Orchestrator contacts Bank Acquiring Network -> Double-Entry Ledger commits ACID transaction in Spanner -> Webhook Service fires async event.',
      nodes: [
        { id: 'merchant', label: 'Merchant App / Client', type: 'client', x: 8, y: 50, description: 'Calls POST /v1/charges with Idempotency-Key' },
        { id: 'gateway', label: 'Payment API Gateway', type: 'gateway', x: 28, y: 50, description: 'Validates API keys, rate limits, TLS termination', techStack: ['Envoy'] },
        { id: 'idemp_filter', label: 'Idempotency Layer (Redis + DB)', type: 'cache', x: 48, y: 20, description: 'Locks idempotency key & caches completed response', techStack: ['Redis / Spanner'] },
        { id: 'vault', label: 'PCI Card Token Vault', type: 'service', x: 48, y: 80, description: 'Encrypts raw credit cards with HSM', techStack: ['Hardware Security Module'] },
        { id: 'pay_orchestrator', label: 'Payment Orchestration Engine', type: 'service', x: 68, y: 50, description: 'Coordinates auth, capture, and ledger entries', techStack: ['Java / Rust'] },
        { id: 'bank_network', label: 'Banking & Card Network (Visa)', type: 'service', x: 92, y: 20, description: 'External Visa / Mastercard Acquiring Bank', techStack: ['ISO 8583 Banking Protocol'] },
        { id: 'ledger_db', label: 'Double-Entry Ledger (Spanner)', type: 'database', x: 92, y: 60, description: 'Immutable append-only financial journal', techStack: ['Google Cloud Spanner / CockroachDB'] },
        { id: 'webhook_srv', label: 'Webhook Dispatcher', type: 'worker', x: 68, y: 85, description: 'Delivers charge.succeeded events with retries', techStack: ['Kafka + Worker Cluster'] }
      ],
      edges: [
        { id: 'e1', from: 'merchant', to: 'gateway', label: '1. POST /v1/charges (Idemp Key)', protocol: 'HTTPS' },
        { id: 'e2', from: 'gateway', to: 'idemp_filter', label: '2. Acquire Idempotency Lock', protocol: 'TCP' },
        { id: 'e3', from: 'gateway', to: 'vault', label: '3. Tokenize Card Data', protocol: 'Internal RPC' },
        { id: 'e4', from: 'gateway', to: 'pay_orchestrator', label: '4. Execute Charge', protocol: 'Internal RPC' },
        { id: 'e5', from: 'pay_orchestrator', to: 'bank_network', label: '5. Authorize Card ($100)', protocol: 'HTTPS' },
        { id: 'e6', from: 'pay_orchestrator', to: 'ledger_db', label: '6. Commit Double-Entry Ledger', protocol: 'SQL' },
        { id: 'e7', from: 'idemp_filter', to: 'idemp_filter', label: '7. Save Cached Response', protocol: 'TCP' },
        { id: 'e8', from: 'pay_orchestrator', to: 'webhook_srv', label: '8. Publish Webhook Event', protocol: 'Async Queue', isAsync: true }
      ],
      flowSteps: [
        { step: 1, title: 'Idempotency Key Check & Locking', description: 'Merchant sends request with header Idempotency-Key: "order_99a_retry". System checks Redis/DB. If key exists with completed status, immediately returns cached JSON response (0ms bank call). If key is currently processing, rejects duplicate with 409 Conflict.', activeNodes: ['merchant', 'gateway', 'idemp_filter'], highlightDetails: 'Eliminates accidental double charges on client network timeouts.', latencyEstimate: '10ms' },
        { step: 2, title: 'Card Tokenization & Vault Encryption', description: 'Raw PAN (Primary Account Number) is replaced with an opaque token (tok_18923). Card details are stored in an isolated, PCI-DSS Level 1 Hardware Security Module (HSM).', activeNodes: ['gateway', 'vault'], highlightDetails: 'Application services never touch raw credit card numbers.', latencyEstimate: '25ms' },
        { step: 3, title: 'External Bank Authorization', description: 'Payment Orchestrator translates payload into ISO 8583 message and routes to Acquiring Bank -> Visa/Mastercard -> Issuing Bank. Bank responds with "00 - Approved" and authorization code.', activeNodes: ['pay_orchestrator', 'bank_network'], highlightDetails: 'Handles timeouts with automated reversal/void queries.', latencyEstimate: '650ms' },
        { step: 4, title: 'Atomic Double-Entry Ledger Commit', description: 'Orchestrator writes immutable journal entries in Google Cloud Spanner:\n- Debit: User Card Receivable ($100.00)\n- Credit: Merchant Balance ($97.10)\n- Credit: Stripe Processing Fee ($2.90)\nSum of transaction = $0.00.', activeNodes: ['pay_orchestrator', 'ledger_db', 'idemp_filter', 'webhook_srv'], highlightDetails: 'Mathematical guarantee of balanced financial books.', latencyEstimate: '20ms' }
      ]
    },
    apiDesign: [
      {
        method: 'POST',
        path: '/v1/charges',
        description: 'Create a credit card charge',
        headers: ['Idempotency-Key: req_982837482', 'Authorization: Bearer sk_live_...'],
        requestBody: '{\n  "amount": 10000,\n  "currency": "usd",\n  "source": "tok_visa_1234",\n  "description": "Order #48291"\n}',
        responseBody: '{\n  "id": "ch_3M92837482",\n  "amount": 10000,\n  "status": "succeeded",\n  "paid": true\n}'
      }
    ],
    databaseDesign: [
      {
        tableName: 'ledger_entries',
        type: 'SQL',
        shardingKey: 'account_id',
        fields: [
          { name: 'id', type: 'UUID', isPrimary: true },
          { name: 'transaction_id', type: 'UUID', isIndex: true },
          { name: 'account_id', type: 'UUID', isIndex: true },
          { name: 'direction', type: 'VARCHAR(6)', notes: 'DEBIT or CREDIT' },
          { name: 'amount', type: 'BIGINT', notes: 'In integer cents (e.g. 10000 = $100.00)' },
          { name: 'currency', type: 'CHAR(3)' },
          { name: 'created_at', type: 'TIMESTAMP' }
        ],
        notes: 'Append-only ledger table in Spanner. Updates and deletes are strictly prohibited by DB permissions.'
      }
    ],
    deepDives: [
      {
        title: 'Double-Entry Bookkeeping & Integer Currency Modeling',
        subtitle: 'Why floating-point numbers are forbidden in financial software and how ledgers work',
        content: `Two Iron Rules of Financial Engineering:\n1. Never Use Floats: In programming, 0.1 + 0.2 = 0.30000000000000004. In a payment system with 100M transactions, rounding errors lose millions of dollars. Always store money as integer cents (e.g. $100.00 -> 10000 BIGINT) or arbitrary-precision DECIMAL(20, 4).\n\n2. Double-Entry Accounting Rule:\n- Every transaction is composed of at least two balanced ledger entries.\n- Total Debits MUST EQUAL Total Credits.\n- For a $100 charge with a 2.9% fee:\n  - Entry 1: DEBIT  Customer_Card_Account  $100.00\n  - Entry 2: CREDIT Merchant_Payout_Account $97.10\n  - Entry 3: CREDIT Stripe_Revenue_Account   $2.90\n- Total Debits ($100.00) == Total Credits ($97.10 + $2.90).\n- If the database sum ever deviates from zero, an automated reconciliation alarm triggers immediately!`,
        keyTakeaways: [
          'Integer cents eliminate floating-point precision loss.',
          'Double-entry ledgers make balance tampering and phantom money creation mathematically detectable.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Bank API Network Timeout (Dual-Write Failure)',
        impact: 'Payment service sends charge request to Bank, but network connection drops before receiving response. Did the bank charge the customer or not?',
        mitigation: 'Implement Reconciliation Reversal Workflow: Send an automated Status Inquiry / Void request to bank with original transaction ID. If bank confirms charge, commit ledger; if not, cancel order safely.'
      }
    ],
    interviewQA: [
      {
        question: 'How do you guarantee that a network retry with the same Idempotency-Key never charges twice even if two instances receive it simultaneously?',
        hint: 'Database unique constraints and atomic distributed locks.',
        goodAnswer: 'Insert the Idempotency Key into an idempotency_keys table with a UNIQUE constraint (or Redis SET NX). The first thread acquires the lock and enters status="PROCESSING". The second concurrent thread gets a unique key violation, waits, and polls for the completed response payload saved by the first thread.',
        pitfalls: 'Checking idempotency key without atomic locking, causing a race condition where both threads charge the bank.'
      }
    ],
    similarSystems: ['PayPal', 'Adyen', 'Square', 'Braintree'],
    tags: ['Double-Entry Ledger', 'Idempotency', 'Spanner', 'PCI-DSS', 'ACID']
  }
];
