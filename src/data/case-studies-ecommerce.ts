import { CaseStudy } from '../types/system-design';

export const ECOMMERCE_CASE_STUDIES: CaseStudy[] = [
  {
    id: 'amazon-flash-sale',
    title: 'Design Amazon Flash Sale & High-Concurrency Inventory System',
    slug: 'flash-sale-inventory',
    tagline: 'Sell 1,000 items to millions of buyers who all click at the same second, without ever overselling.',
    category: 'E-Commerce & Marketplaces',
    difficulty: 'Advanced',
    readTime: '24 min read',
    scaleSummary: {
      dau: '50 Million Sale Participants',
      qps: '500,000 Checkout Requests/sec at t=0 / 1,000 Stock Units',
      storage: '100% ACID Audit Ledger',
      bandwidth: '500 MB/s Peak Ingress'
    },
    overview: 'In a flash sale, a very large crowd tries to buy a small, fixed stock of one item at the moment the sale opens. The system has three jobs. It must never sell more units than it has (overselling). It must not let the traffic spike crash the database. And it must treat buyers fairly. The main idea is to count stock in Redis with one atomic script, and to keep the SQL database out of the hot path.',
    keyChallenges: [
      'Overselling race condition: when 100,000 requests try to lower the stock on one database row at once, they queue on a row lock. The result is slow requests, deadlocks, or a stock count that goes below zero if the code checks and updates in two steps.',
      'Thundering herd at t=0: traffic jumps from about 1,000 requests per second to 500,000 in about a second, and no autoscaler can react that fast.',
      'Reservations with a time limit: a buyer holds the item for 10 minutes while paying. If payment fails or the buyer leaves, the stock must go back on sale.',
      'Bots: scripts can click faster than people and drain the stock before real buyers get a chance.'
    ],
    functionalRequirements: [
      'Show the sale countdown and item details.',
      'Let users click "Buy Now" at launch time to reserve one unit.',
      'Reserve the unit atomically for 10 minutes while the payment is authorized.',
      'If payment succeeds, confirm the order and make the stock deduction permanent.',
      'If payment fails or times out, return the unit to the available stock.'
    ],
    nonFunctionalRequirements: [
      'Strict consistency: never oversell. Available stock must never drop below 0.',
      'Fast reservation check: the Redis step answers in under 50 ms, even during the burst. The queue in front adds some waiting time at peak.',
      'High availability: the sale keeps working if the payment provider is down. Reservations do not depend on payment.',
      'Fairness: requests are handled roughly in arrival order, and each user can reserve only one unit.'
    ],
    outOfScope: ['Warehouse picking, packing and delivery logistics.'],
    capacityEstimations: {
      assumptions: [
        'Flash sale: 1,000 PlayStation 5 consoles at 50% off, starting at 12:00:00 PM.',
        'About 2,000,000 users are on the product page and click "Buy Now" at about the same time.',
        'Peak load: 500,000 requests per second hit the reservation endpoint.',
        'Request size: about 1 KB per reservation call (HTTPS headers plus JSON body). 500,000 × 1 KB = 500 MB/s of peak incoming traffic.'
      ],
      metrics: [
        { label: 'Burst QPS', value: '500,000 / sec', formula: 'Simultaneous purchase clicks at t=0', description: 'Peak rate of reservation requests' },
        { label: 'Inventory Units', value: '1,000 units', formula: 'Total stock to allocate', description: 'The stock can never be oversold' },
        { label: 'Reservation Hold Time', value: '10 Minutes', formula: 'Checkout window before auto-rollback', description: 'Time to live (TTL) on a reservation. After it expires, the unit is released.' }
      ],
      conclusion: 'A single SQL row cannot absorb 500,000 competing updates per second. The stock counter lives in Redis, and one atomic Lua script (a small program that Redis runs as one uninterruptible step) checks and lowers it. Only the roughly 1,000 winners ever reach the SQL database.'
    },
    architecture: {
      summary: 'Static pages come from the CDN. API requests pass the gateway, which rate-limits and blocks bots, and then go into a Kafka queue. Workers read the queue and run an atomic Redis Lua script that lowers the stock. A winner gets a signed checkout token. The Order Service takes the payment, then writes the result to PostgreSQL. A transactional outbox (an event written in the same transaction as the order) then confirms the stock deduction.',
      nodes: [
        { id: 'client', label: 'Flash Sale Buyers', type: 'client', x: 8, y: 50, description: 'Buyers who click Buy Now as soon as the sale starts' },
        { id: 'cdn', label: 'CDN Static Edge', type: 'cdn', x: 26, y: 70, description: 'Serves the static product page and the countdown timer, so these requests never reach the origin', techStack: ['Cloudflare'] },
        { id: 'gateway', label: 'API Gateway & Token Bucket', type: 'gateway', x: 26, y: 30, description: 'Rate-limits each user, drops duplicate clicks and blocks bot traffic', techStack: ['Envoy / Kong'] },
        { id: 'queue', label: 'Order Ingestion Queue', type: 'queue', x: 48, y: 30, description: 'Holds the burst of requests so workers can process them at a steady pace', techStack: ['Kafka / RabbitMQ'] },
        { id: 'reserve_srv', label: 'Inventory Reservation Engine', type: 'service', x: 70, y: 30, description: 'Runs the atomic stock decrement for each queued request', techStack: ['Go / Rust Workers'] },
        { id: 'redis_stock', label: 'Redis Stock Cache', type: 'cache', x: 90, y: 30, description: 'Holds the live stock counter. A Lua script checks and lowers it in one step.', techStack: ['Redis Cluster'], scaleMetric: 'Single-thread atomic ops' },
        { id: 'order_db', label: 'Order & Inventory DB', type: 'database', x: 70, y: 75, description: 'PostgreSQL. Durable source of truth for orders and the inventory ledger.', techStack: ['PostgreSQL'] },
        { id: 'payment_srv', label: 'Payment Service', type: 'service', x: 90, y: 75, description: 'Charges the buyer through the payment provider', techStack: ['Stripe API'] }
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
        { step: 1, title: 'Absorb the burst and block bots', description: 'At 12:00:00 PM, 500,000 requests per second arrive. The gateway checks CAPTCHA tokens, drops repeat clicks from the same user_id, and puts the rest into Kafka.', activeNodes: ['client', 'gateway', 'queue'], highlightDetails: 'The queue absorbs the spike. Workers drain it at a steady rate that Redis can handle. The cost is a short wait for some buyers.', latencyEstimate: '10ms' },
        { step: 2, title: 'Lower the stock atomically in Redis', description: 'A worker runs a Redis Lua script. If the user has not bought yet and stock is above 0, the script lowers the stock by 1 and records the user_id in a "reserved" set. The worker then creates a reservation token that expires after 10 minutes.', activeNodes: ['queue', 'reserve_srv', 'redis_stock'], highlightDetails: 'Redis runs commands one at a time, so no other command can run in the middle of the script. Two buyers can never take the same last unit.', latencyEstimate: '2ms' },
        { step: 3, title: 'Tell each user the result', description: 'The first 1,000 successful users get a signed purchase token (a JWT) over WebSocket or server-sent events. Everyone else gets a "Sold Out" response right away.', activeNodes: ['reserve_srv', 'client'], highlightDetails: 'The signature lets the Payment Service check the token without calling Redis again.', latencyEstimate: '30ms' },
        { step: 4, title: 'Take payment, or release the stock', description: 'The winner submits payment with the token within 10 minutes. If payment fails or the time runs out, a background worker adds 1 back to the Redis stock and removes the user from the reserved set, so the unit can be sold again.', activeNodes: ['client', 'payment_srv', 'order_db', 'redis_stock'], highlightDetails: 'Every reservation either becomes an order or is released, so no stock is stuck in limbo.', latencyEstimate: '1500ms' }
      ]
    },
    apiDesign: [
      {
        method: 'POST',
        path: '/api/v1/flash-sale/reserve',
        description: 'Try to reserve one unit of a flash sale item. The idempotency_key makes a repeated click return the same result.',
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
          { name: 'delta', type: 'INT', notes: '-1 for a sale, +1 for a return or cancel' },
          { name: 'balance_after', type: 'INT' },
          { name: 'created_at', type: 'TIMESTAMP' }
        ],
        notes: 'Append-only ledger of every stock change. Rows are inserted, never updated, so the history is complete and Redis can be rebuilt from it after a crash.'
      }
    ],
    deepDives: [
      {
        title: 'The Atomic Lua Script: Deducting Stock Without Race Conditions',
        subtitle: 'Why SQL row updates struggle at 500k requests per second, and why Redis does not',
        content: `In SQL, the usual way to take one unit is: UPDATE inventory SET stock = stock - 1 WHERE id = 1 AND stock > 0;\nThis statement is correct, but it is slow under heavy contention. Every transaction needs an exclusive lock on the same row, so they run one after another. With 100,000 concurrent requests, queries wait on the lock, CPU climbs, and the connection pool fills up with waiting requests.\n\nRedis Lua script solution:\nRedis runs a Lua script as one unit on its main thread. No other command runs while the script runs, so the check and the decrement cannot be split apart:\n\n\`\`\`lua\nlocal stockKey = KEYS[1]\nlocal userSetKey = KEYS[2]\nlocal userId = ARGV[1]\n\n-- 1. Check if user already bought\nif redis.call('SISMEMBER', userSetKey, userId) == 1 then\n    return -1 -- Already purchased error\nend\n\n-- 2. Check stock\nlocal stock = tonumber(redis.call('GET', stockKey) or 0)\nif stock <= 0 then\n    return 0 -- Sold out\nend\n\n-- 3. Atomic Decrement\nredis.call('DECR', stockKey)\nredis.call('SADD', userSetKey, userId)\nreturn 1 -- Success! Stock reserved.\n\`\`\`\n\nTwo cautions. First, Redis can lose its last few writes if the primary fails before the replica catches up. So the SQL ledger stays the source of truth, and the Redis count is rebuilt from it if needed. Second, in Redis Cluster a script may only touch keys in the same hash slot. Give both keys the same hash tag, for example {item:ps5}:stock and {item:ps5}:users.`,
        keyTakeaways: [
          'A Lua script runs as one step, so the stock check, the decrement and the duplicate-buyer check cannot interleave with other requests.',
          'The script is fast because it works in memory on a few keys. A single call typically takes well under a millisecond.',
          'Redis is the fast path. The SQL ledger is the durable record.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'One Redis primary runs out of CPU',
        impact: 'One Redis instance handles very roughly 100,000 operations per second, depending on hardware. A 500,000 per second burst is more than one instance can take.',
        mitigation: 'Split the stock across shards. For example, put 100 units in each of 10 keys (item:ps5:shard:0 to item:ps5:shard:9) and hash each user to one shard. The catch is that a user whose shard sells out first sees "Sold Out" while other shards still have stock. To fix this, retry on another shard before answering, or move the leftover stock to the shards still in use.'
      }
    ],
    interviewQA: [
      {
        question: 'What happens if a user reserves stock, closes the browser, and never pays?',
        hint: 'Reservations expire. A timer gives the stock back.',
        goodAnswer: 'The reservation has a 10-minute expiry. A delayed job checks the payment status when the time is up. A Kafka delayed topic, a scheduler, or a sorted set of expiry times in Redis all work for this. If the order is unpaid, the job cancels it, adds 1 back to the Redis stock with INCR, and removes the user from the reserved set. Do not rely on Redis key-expiry notifications alone, because they are not guaranteed to be delivered.',
        pitfalls: 'Holding stock forever with no timeout. Relying only on Redis expiry events, which can be missed. Giving the unit back but forgetting to clear the duplicate-buyer record.'
      }
    ],
    similarSystems: ['Ticketmaster Concert Drops', 'Nike SNKRS App', 'Shopee Flash Sales'],
    tags: ['Redis Lua', 'Distributed Lock', 'Thundering Herd', 'Kafka', 'PostgreSQL Ledger']
  },
  {
    id: 'uber-ride-hailing',
    title: 'Design Uber / Lyft (Real-Time Ride Hailing & Driver Matching)',
    slug: 'uber-ride-hailing',
    tagline: 'Track millions of moving drivers, find the nearest ones in milliseconds, and match each rider to exactly one driver.',
    category: 'E-Commerce & Marketplaces',
    difficulty: 'Advanced',
    readTime: '26 min read',
    scaleSummary: {
      dau: '150 Million Active Riders / 5 Million Active Drivers',
      qps: '1,250,000 Location Pings/sec / 50,000 Trip Dispatches/sec',
      storage: '6.9 TB / day GPS trajectory telemetry',
      bandwidth: '80 MB/s Real-time GPS Ingress'
    },
    overview: 'Uber connects riders with nearby drivers in real time. Each active driver app sends its GPS position every 4 seconds. When a rider asks for a trip, the dispatch engine finds available drivers close to the pickup point, ranks them by estimated arrival time (ETA), and offers the trip to the best one. The goals are a match in under a second and no driver ever assigned to two trips.',
    keyChallenges: [
      'Constant location writes: 5 million drivers sending a ping every 4 seconds is 1,250,000 writes per second.',
      'Fast nearby-driver queries: finding the available drivers near a point in under 15 ms.',
      'Picking a spatial index: Geohash, QuadTree or Uber H3 (a hexagon grid), each with different trade-offs.',
      'Surge pricing: measuring supply and demand in each area as it changes, and turning that into a price multiplier.'
    ],
    functionalRequirements: [
      'Drivers send their GPS position (latitude, longitude) every 4 seconds.',
      'Riders see nearby drivers on a map, with smooth movement.',
      'A rider requests a ride and the system offers it to a good nearby driver.',
      'A driver accepts or declines. After a decline or a timeout, the offer goes to the next driver.',
      'Compute a surge price multiplier from local supply and demand.'
    ],
    nonFunctionalRequirements: [
      'Matching in under 1,000 ms.',
      'Nearby-driver map queries in under 50 ms.',
      'High availability (99.99%) in every city.',
      'No double-booking: a driver is never matched to two rides at the same time.'
    ],
    outOfScope: ['Self-driving vehicle sensor processing.', 'Vehicle maintenance scheduling.'],
    capacityEstimations: {
      assumptions: [
        '5M active drivers sending a GPS ping every 4 s gives 1,250,000 location writes per second worldwide.',
        'Each ping is about 64 bytes (driver_id, lat, lng, bearing, timestamp, status).',
        'Incoming traffic: 1.25M × 64 bytes = 80 MB/s.',
        'The rider app asks for nearby drivers every 5 seconds. With 20M app sessions open, that is 4M read queries per second.',
        'Trajectory storage: 1.25M pings × 64 bytes × 86,400 s = 6.9 TB per day, as raw data in a single copy before replication.'
      ],
      metrics: [
        { label: 'Location Ingress QPS', value: '1,250,000 / sec', formula: '5M drivers / 4 second interval', description: 'GPS pings arriving each second' },
        { label: 'Dispatch Match QPS', value: '50,000 / sec', formula: 'Peak global ride requests', description: 'Matching lookups at peak' },
        { label: 'In-Memory Spatial Index', value: '12 GB RAM', formula: '5M drivers * 2.4 KB per H3 index entry in Redis', description: 'Memory for the worldwide index of current driver positions' }
      ],
      conclusion: 'A disk-based database is a poor fit for 1.25M position updates per second. The index only needs each driver\'s latest position, so it fits in memory (about 12 GB). Keep it in Redis or a similar in-memory store. Send the full GPS history to a log such as Kafka and to cheap storage.'
    },
    architecture: {
      summary: 'Drivers send GPS pings over WebSocket or gRPC. The Location Service converts each ping to an H3 cell (a hexagon on a map grid) and updates the in-memory index in Redis. When a rider requests a trip, the Dispatch Engine looks up drivers in the pickup cell and its neighbors, ranks them by ETA, and offers the trip to the best driver. The trip then moves through its states (offered, accepted, in progress, completed), and a saga (a sequence of steps with an undo step for each) handles failures.',
      nodes: [
        { id: 'driver', label: 'Driver App (iOS/Android)', type: 'client', x: 8, y: 30, description: 'Sends GPS coordinates every 4 seconds and receives ride offers' },
        { id: 'rider', label: 'Rider App', type: 'client', x: 8, y: 70, description: 'Requests rides and shows the live map' },
        { id: 'lb', label: 'L4 Network Load Balancer', type: 'load_balancer', x: 26, y: 50, description: 'Spreads long-lived TCP and WebSocket connections across servers', techStack: ['AWS NLB'] },
        { id: 'location_srv', label: 'Location Ingestion Service', type: 'service', x: 48, y: 30, description: 'Receives driver pings, groups them in batches and updates the index', techStack: ['Go / Netty'] },
        { id: 'dispatch_srv', label: 'Dispatch & Matching Engine', type: 'service', x: 48, y: 70, description: 'Finds candidate drivers, ranks them and sends offers', techStack: ['Java / Ringpop DAG'] },
        { id: 'h3_index', label: 'H3 Spatial Index (Redis)', type: 'cache', x: 75, y: 30, description: 'In-memory map from each H3 cell to the available drivers inside it', techStack: ['Redis Geospatial / H3'], scaleMetric: 'Sub-millisecond radial lookup' },
        { id: 'trip_db', label: 'Trip & Ledger Database', type: 'database', x: 75, y: 70, description: 'Durable store for trip state and payment records', techStack: ['PostgreSQL / Docstore'] },
        { id: 'surge_engine', label: 'Surge Pricing Engine', type: 'worker', x: 92, y: 50, description: 'Computes supply and demand for each H3 cell and publishes the surge multiplier', techStack: ['Apache Flink'] }
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
        { step: 1, title: 'Driver sends a GPS ping', description: 'The driver app sends its position over a persistent WebSocket. The Location Service converts (lat, lng) to an H3 resolution 8 cell (a hexagon about 460 m along each edge) and moves the driver into that cell in Redis.', activeNodes: ['driver', 'location_srv', 'h3_index'], highlightDetails: 'Only the latest position is kept in the index. Each update is a few small in-memory writes, so it is fast.', latencyEstimate: '15ms' },
        { step: 2, title: 'Rider requests a ride and the system searches nearby', description: 'A rider requests a ride at 5th Ave, New York. Dispatch computes the H3 cell of the pickup point and reads the "AVAILABLE" drivers in that cell and its 6 neighbors (a k-ring of 1, which is 7 cells in total).', activeNodes: ['rider', 'dispatch_srv', 'h3_index'], highlightDetails: 'All 6 neighbors of a hexagon are the same distance from its center. A square grid has near and far neighbors. If the search finds too few drivers, widen it to k-ring 2.', latencyEstimate: '10ms' },
        { step: 3, title: 'Rank drivers and send an offer', description: 'Dispatch estimates the road ETA for each candidate with a routing engine (OSRM), applies the surge multiplier, and sends an offer to the top driver with a 15-second countdown. It first sets a lock on that driver in Redis.', activeNodes: ['dispatch_srv', 'surge_engine', 'driver'], highlightDetails: 'The lock stops a second rider from being offered the same driver while this offer is open.', latencyEstimate: '80ms' },
        { step: 4, title: 'Driver accepts and the trip is tracked', description: 'The driver taps "Accept". Dispatch writes the trip to PostgreSQL and opens a live channel that streams the driver position to the rider map.', activeNodes: ['driver', 'dispatch_srv', 'trip_db', 'rider'], highlightDetails: 'The rider app moves the car smoothly along the route between pings, which arrive every few seconds.', latencyEstimate: '40ms' }
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
        notes: 'PostgreSQL, sharded by trip_id, with ACID transactions. A trip changes state through a conditional update (for example, set ACCEPTED only if the status is still REQUESTED), so two writers cannot both win.'
      }
    ],
    deepDives: [
      {
        title: 'Geospatial Indexing Comparison: Geohash vs QuadTree vs Uber H3 Hexagonal Grid',
        subtitle: 'Why Uber built the H3 hexagonal index, and what each option costs',
        content: `1. Geohash (rectangular cells named by a base-32 string):\n- It interleaves the bits of latitude and longitude into a string such as "9q8yy". Cells that share a prefix are close together.\n- Cons: a square cell has 8 neighbors, 4 sharing an edge at distance D and 4 at the corners at distance D*sqrt(2), so "neighbors" are not all equally near. Cells also get narrower near the poles, and two nearby points can have very different prefixes when they sit on opposite sides of a cell border.\n\n2. QuadTree (a tree that splits a map area into four smaller areas when it holds too many points):\n- Pros: it adapts to density, with small cells in busy cities and large cells in empty areas.\n- Cons: with 1.25 million moves per second, drivers constantly cross cell borders. Splitting, merging and rebalancing the tree while many threads update it causes lock contention.\n\n3. Uber H3 (hexagonal grid):\n- H3 divides the Earth into 122 base cells, based on an icosahedron (a 20-sided solid). Each base cell is split into smaller hexagons across 16 resolution levels (0 to 15).\n- Why hexagons work well:\n  - Each hexagon has 6 neighbors, all at the same distance from its center. (H3 also has 12 pentagon cells, which have 5 neighbors.)\n  - Finding all cells within k steps is a simple k-ring lookup, for example H3.kRing(h3Index, 2).\n  - Distance in every direction is more uniform than on a square grid, which suits a radius search.\n\nNote on Redis: the built-in Redis GEO commands (GEOADD, GEOSEARCH) use a geohash-style encoding, not H3. To use H3 with Redis, compute the cell ID in the app and keep one set of driver IDs per cell, for example a key like drivers:cell:<h3Index>.`,
        keyTakeaways: [
          'An H3 cell ID is a 64-bit integer. It is small, cheap to compare and easy to use as a key in Redis or Kafka.',
          'Pick the cell size for the job. Resolution 8 (about 0.7 km² per cell) suits driver matching. Surge pricing can use a coarser level, such as resolution 7 (about 5 km² per cell), so each cell has enough trips to measure.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Double dispatch race condition',
        impact: 'Two riders who request in the same millisecond can both be offered the same driver.',
        mitigation: 'Take a Redis lock on the driver before sending the offer: SET driver:lock:<id> <trip_id> NX EX 15. If the lock is already held, skip to the next candidate. Release the lock if the driver declines. A Redis lock can be lost during a failover, so the final check is the conditional update in the trips database, which allows only one trip to claim the driver.'
      }
    ],
    interviewQA: [
      {
        question: 'How do you calculate Surge Pricing in real time without lagging the dispatch engine?',
        hint: 'Compute it in a stream processor, off the request path.',
        goodAnswer: 'Ride requests and app opens are demand events. Driver pings are supply events. Apache Flink counts both for each H3 cell over a sliding window (for example, the last few minutes, updated every 15 seconds). It divides demand by supply, turns the ratio into a multiplier, and writes the multiplier table to Redis. Dispatch then reads the multiplier for a cell with one key lookup. Smooth the values over time and between neighboring cells so prices do not jump.',
        pitfalls: 'Running COUNT(*) queries on live tables for each trip request. Letting prices swing from one window to the next.'
      }
    ],
    similarSystems: ['Lyft', 'Grab', 'DiDi', 'Bolt'],
    tags: ['Geospatial H3', 'Redis Geospatial', 'WebSockets', 'Dispatch Engine', 'Flink']
  },
  {
    id: 'airbnb-booking',
    title: 'Design Airbnb / Hotel Booking & Availability Calendar',
    slug: 'airbnb-booking-calendar',
    tagline: 'Search millions of homes by date range, and make sure the same dates are never booked twice.',
    category: 'E-Commerce & Marketplaces',
    difficulty: 'Advanced',
    readTime: '22 min read',
    scaleSummary: {
      dau: '50 Million Active Guests / 7 Million Property Listings',
      qps: '80,000 Search QPS / 5,000 Booking Attempts/sec',
      storage: '10 TB active listing and reservation calendar records',
      bandwidth: '15 GB/s Search Egress'
    },
    overview: 'Airbnb lets guests search millions of homes by destination, number of guests, price and exact check-in and check-out dates. The system has two different jobs. Search must be fast and can be slightly out of date. Booking must be exactly correct, so two guests can never hold the same property on overlapping dates.',
    keyChallenges: [
      'Date-range search: find the listings that are free for a window such as July 10 to July 17, out of 7 million listings, in under 100 ms.',
      'Double bookings: two guests may try to book the same property at the same moment.',
      'Ranking: order results using price, reviews and host response rate, as well as availability.',
      'A multi-step booking: hold the dates, take payment, and in request-to-book flows wait for the host to accept.'
    ],
    functionalRequirements: [
      'Hosts publish listings and set calendar prices and availability.',
      'Guests search by city, dates (check-in and check-out) and amenities.',
      'Support instant booking and request-to-book.',
      'Hold the dates while the guest pays.',
      'Apply cancellation policies and compute refunds.'
    ],
    nonFunctionalRequirements: [
      'Search latency under 100 ms worldwide.',
      'Strict consistency for bookings: no two bookings for one property can overlap in dates.',
      'High availability for search and browsing (99.99%).',
      'PCI-DSS compliance (the card industry security standard) for handling payment tokens.'
    ],
    outOfScope: ['Insurance claims and damage disputes between host and guest.'],
    capacityEstimations: {
      assumptions: [
        '7 million active listings, each with 365 days of calendar state, gives about 2.55 billion calendar day records.',
        'Search peaks at 80,000 queries per second in busy holiday booking seasons.',
        'Booking peaks at 5,000 attempts per second.'
      ],
      metrics: [
        { label: 'Search Query QPS', value: '80,000 QPS', formula: 'Peak location + date range searches', description: 'Peak searches by place and dates, served by Elasticsearch' },
        { label: 'Calendar Records', value: '2.55 Billion Days', formula: '7M listings * 365 days', description: 'One state per listing per day. A bitmap of 365 bits (about 46 bytes) holds one listing.' },
        { label: 'Booking Write QPS', value: '5,000 QPS', formula: 'Peak reservation attempts', description: 'Booking attempts handled by PostgreSQL with ACID transactions' }
      ],
      conclusion: 'Keep search and booking separate. A per-listing availability bitmap in the search index, combined with a location filter, narrows the results quickly. PostgreSQL decides the final answer about which dates are taken. The search index may be a moment out of date, so the booking step always checks the database again.'
    },
    architecture: {
      summary: 'A guest search goes to the Search Service, which queries Elasticsearch on location and a date availability bitmap. Listing details come from Redis or PostgreSQL. To book, the Booking Service inserts a pending reservation in PostgreSQL, and an exclusion constraint rejects any date overlap. The Payment Service then authorizes the charge. After the reservation is confirmed, a Kafka event updates the search index.',
      nodes: [
        { id: 'client', label: 'Guest Web / Mobile App', type: 'client', x: 8, y: 50, description: 'Searches for homes and books stays' },
        { id: 'gateway', label: 'API Gateway', type: 'gateway', x: 26, y: 50, description: 'Routes search and checkout requests', techStack: ['Envoy'] },
        { id: 'search_srv', label: 'Search & Ranking Service', type: 'service', x: 50, y: 30, description: 'Filters listings by location, price, amenities and dates, then ranks them', techStack: ['Java / Kotlin'] },
        { id: 'booking_srv', label: 'Booking & Reservation Service', type: 'service', x: 50, y: 70, description: 'Creates reservations and coordinates payment', techStack: ['Go / Rails'] },
        { id: 'es_search', label: 'Elasticsearch Cluster', type: 'search', x: 75, y: 20, description: 'Indexes listing attributes and availability bitmaps for fast filtering', techStack: ['Elasticsearch 8'] },
        { id: 'listing_db', label: 'Listing & Calendar DB', type: 'database', x: 75, y: 50, description: 'PostgreSQL. Its date exclusion constraint stops overlapping reservations.', techStack: ['PostgreSQL with btree_gist'] },
        { id: 'payment_srv', label: 'Payment Gateway Broker', type: 'service', x: 75, y: 80, description: 'Authorizes card payments with the payment provider', techStack: ['Stripe / Braintree'] }
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
        { step: 1, title: 'Search by location and dates', description: 'A guest searches "Paris, July 10-15". The Search Service queries Elasticsearch, which filters on location and on each listing availability bitmap for those dates, and returns about 500 matching listing IDs.', activeNodes: ['client', 'gateway', 'search_srv', 'es_search'], highlightDetails: 'The location filter cuts the candidates first. A bitmap check (one bit per day) is then cheap for each remaining listing.', latencyEstimate: '35ms' },
        { step: 2, title: 'Hold the dates in the database', description: 'The guest clicks "Reserve". The Booking Service inserts a reservation with status "PENDING_PAYMENT" into PostgreSQL. A range exclusion constraint (EXCLUDE USING gist (listing_id WITH =, stay_range WITH &&)) rejects the insert if the dates overlap another active reservation for that listing.', activeNodes: ['client', 'booking_srv', 'listing_db'], highlightDetails: 'The database itself rejects overlapping dates, even when two requests arrive at the same instant.', latencyEstimate: '15ms' },
        { step: 3, title: 'Authorize payment and confirm', description: 'The Booking Service asks the payment provider to authorize the charge. If it succeeds, the reservation becomes "CONFIRMED". A change data capture (CDC) pipeline then updates the Elasticsearch availability bitmap. If payment fails, the reservation is cancelled and the dates are free again.', activeNodes: ['booking_srv', 'payment_srv', 'listing_db', 'es_search'], highlightDetails: 'The booking is strongly consistent. The search index catches up a little later (eventual consistency).', latencyEstimate: '800ms' }
      ]
    },
    apiDesign: [
      {
        method: 'POST',
        path: '/api/v1/reservations',
        description: 'Reserve property dates. The idempotency_key makes a retried request safe.',
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
          { name: 'stay_range', type: 'DATERANGE', notes: 'Check-in is included and check-out is excluded: [2026-07-10, 2026-07-17)' },
          { name: 'status', type: 'VARCHAR(20)', notes: 'PENDING_PAYMENT, CONFIRMED, CANCELLED' }
        ],
        notes: 'The exclusion constraint is EXCLUDE USING gist (listing_id WITH =, stay_range WITH &&) WHERE (status IN (\'CONFIRMED\', \'PENDING_PAYMENT\')). Cancelled rows do not block dates. Shard by listing_id so all rows for one listing are on one shard, because the constraint only works inside one database. A job cancels PENDING_PAYMENT rows that are not paid in time.'
      }
    ],
    deepDives: [
      {
        title: 'PostgreSQL Range Types & Exclusion Constraints: Preventing Double Bookings',
        subtitle: 'Let the database enforce the rule instead of application-level locks',
        content: `The common approach: the app runs SELECT * FROM bookings WHERE check_in < end AND check_out > start, and inserts the booking only if no rows come back. Under concurrency this fails. Two requests can both see 0 rows and both insert, which produces a double booking.\n\nPostgreSQL fix: a DATERANGE column with a GiST index and an exclusion constraint:\n\`\`\`sql\nCREATE EXTENSION btree_gist;\nCREATE TABLE reservations (\n    id UUID PRIMARY KEY,\n    listing_id UUID NOT NULL,\n    stay_range DATERANGE NOT NULL,\n    status VARCHAR(20) NOT NULL,\n    EXCLUDE USING gist (\n        listing_id WITH =,\n        stay_range WITH &&\n    ) WHERE (status IN ('CONFIRMED', 'PENDING_PAYMENT'))\n);\n\`\`\`\nThe database checks the constraint as part of the insert, using the index, so two overlapping inserts cannot both commit. The loser fails with error 23P01 (exclusion_violation). The app catches that error and tells the guest the dates are gone.\n\nThree things to remember:\n- The constraint only sees rows in the same database, so all reservations for one listing must live on the same shard.\n- Only PENDING_PAYMENT and CONFIRMED rows block the dates. Setting a reservation to CANCELLED frees them.\n- A guest who starts checkout and leaves would hold the dates forever. A scheduled job must cancel PENDING_PAYMENT rows after a time limit.`,
        keyTakeaways: [
          'An exclusion constraint turns "no overlapping dates" into a rule the database enforces on every write.',
          'You do not need a distributed lock in Redis for this. The constraint and the row insert are one transaction.',
          'Holds need an expiry, or abandoned checkouts block the calendar.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Search index lag after fast bookings',
        impact: 'A listing booked a few seconds ago can still show as available in search results.',
        mitigation: 'Before showing the checkout page, check the candidate listing in the database. Also stream database commits to Elasticsearch with Debezium (a CDC tool), which usually brings the index up to date within about a second. The database insert is the final guard, so a stale search result never causes a double booking. At worst a guest sees a "dates no longer available" message.'
      }
    ],
    interviewQA: [
      {
        question: 'How do you handle host pricing rules (e.g. Weekend surge, Holiday discount, Cleaning fees)?',
        hint: 'A price calculation step driven by stored rules.',
        goodAnswer: 'Store the base price and the pricing rules as structured data (for example JSON) in PostgreSQL. At checkout, a pricing service runs the rules in a fixed order: base rate × nights, plus weekend or holiday adjustments, plus cleaning fee, plus service fee, plus local occupancy tax. Save the final price breakdown with the reservation so later rule changes do not alter existing bookings.',
        pitfalls: 'Storing one fixed price per day with no rules behind it. Recomputing the price of an existing booking from today\'s rules.'
      }
    ],
    similarSystems: ['Booking.com', 'Expedia', 'Vrbo', 'Hotels.com'],
    tags: ['PostgreSQL GiST', 'Elasticsearch', 'Availability Bitset', 'Date Range', 'Stripe']
  },
  {
    id: 'doordash-food-delivery',
    title: 'Design DoorDash / Deliveroo (Multi-Party Delivery & Routing)',
    slug: 'doordash-food-delivery',
    tagline: 'Coordinate customers, restaurants and couriers, so the food is ready when the courier arrives and the customer can follow the delivery live.',
    category: 'E-Commerce & Marketplaces',
    difficulty: 'Advanced',
    readTime: '23 min read',
    scaleSummary: {
      dau: '30 Million Active Diners / 500,000 Restaurants / 1 Million Couriers',
      qps: '350 Orders/sec peak / 500,000 Live Tracking Sockets',
      storage: '407 TB / year order and trajectory data (GPS 404 TB + orders 3.65 TB)',
      bandwidth: '20 MB/s WebSocket Live Tracking Egress'
    },
    overview: 'A food delivery marketplace has three sides: customers who order, restaurants that cook, and couriers who deliver. Each order moves through all three over about 45 minutes. The system must keep the order state correct, send a courier at the right time, estimate arrival times, and show the courier live on the customer map.',
    keyChallenges: [
      'A state machine shared by three parties: order placed, kitchen accepted, cooking, courier dispatched, picked up, delivered. Each step can fail or time out.',
      'Batching: giving one courier two orders from nearby restaurants without letting the food go cold.',
      'ETA prediction: use the restaurant queue, traffic and parking time, not only distance.',
      'Live tracking: show the courier position on the customer phone with little delay.'
    ],
    functionalRequirements: [
      'Customers browse menus, customize items and place orders.',
      'Restaurants get orders on a merchant portal, adjust prep time and mark food ready.',
      'Couriers receive offers with route details and earnings.',
      'Customers and restaurants see the courier live on a map.',
      'Dispatch times the courier arrival to match when the food is ready.'
    ],
    nonFunctionalRequirements: [
      'Live position updates shown on the customer device in under 1 second after they reach the server.',
      'Strict order state transitions: no order is lost or left in a stuck state.',
      'High availability (99.99%).',
      'ETAs accurate to within about 3 minutes.'
    ],
    outOfScope: ['Restaurant ingredient purchasing and supplier ordering.'],
    capacityEstimations: {
      assumptions: [
        '30M active diners and 5M meals per day. About half land in the 6-8 PM window, so 2.5M / 7,200 s is about 350 orders per second.',
        '1M active couriers send a GPS ping every 5 seconds, which is 200,000 pings per second.',
        '500,000 active orders are tracked at the same time.',
        'Sizes: a GPS ping is 64 bytes, an order record is 2 KB, and a tracking push is 200 bytes per active order every 5 s. Storage figures are raw, a single copy before replication.'
      ],
      metrics: [
        { label: 'Order Placement QPS', value: '350 QPS', formula: '2.5M dinner orders / 7,200 s (6-8 PM window)', description: 'Peak orders per second handled by the Order Service' },
        { label: 'Courier GPS Stream', value: '200,000 pings/sec', formula: '1M couriers / 5s ping interval', description: 'Location pings per second entering the system' },
        { label: 'Active Tracking Sockets', value: '500,000 Sockets', formula: 'Open customer tracking WebSocket sessions', description: 'Open WebSocket connections to customers, held by the real-time gateways' }
      ],
      conclusion: 'Order volume is modest (350 per second). The hard parts are the long-running order workflow and the courier assignment. Assigning couriers is an optimization problem. Dispatch collects orders and couriers over a short window (a few seconds) and solves the assignment for the whole batch, using methods such as mixed-integer linear programming (MILP) or simulated annealing.'
    },
    architecture: {
      summary: 'Customers place orders through the API gateway. The Order Service runs each order as a Temporal workflow (a durable program that keeps its state across crashes). The Dispatch Engine picks a courier so that arrival matches the restaurant prep time. Courier GPS pings are stored in Redis and pushed to the customer app over WebSocket.',
      nodes: [
        { id: 'customer', label: 'Customer App', type: 'client', x: 8, y: 20, description: 'Places the order and tracks the delivery live' },
        { id: 'restaurant', label: 'Merchant Tablet App', type: 'client', x: 8, y: 50, description: 'Accepts the order and sets the prep time' },
        { id: 'courier', label: 'Courier App (Dasher)', type: 'client', x: 8, y: 80, description: 'Shows the delivery route and sends GPS pings' },
        { id: 'gateway', label: 'API Gateway & WS Hub', type: 'gateway', x: 30, y: 50, description: 'Routes order requests and holds the WebSocket connections used for tracking', techStack: ['Envoy / Go'] },
        { id: 'order_srv', label: 'Order State Workflow Engine', type: 'service', x: 55, y: 20, description: 'Runs the order through its states and handles timeouts and failures', techStack: ['Temporal / Go'] },
        { id: 'dispatch_srv', label: 'Dispatch & Batching Optimizer', type: 'service', x: 55, y: 60, description: 'Chooses couriers and plans routes that can include several stops', techStack: ['C++ / Python OSRM'] },
        { id: 'redis_geo', label: 'Live Location & Session Cache', type: 'cache', x: 80, y: 60, description: 'Holds the latest courier positions', techStack: ['Redis Cluster'] },
        { id: 'db', label: 'Orders & Payments DB', type: 'database', x: 80, y: 20, description: 'PostgreSQL. ACID store for orders and payments.', techStack: ['PostgreSQL'] }
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
        { step: 1, title: 'Place the order and alert the kitchen', description: 'The customer submits the cart. The Order Service saves the order in PostgreSQL and sends an alert to the restaurant tablet over WebSocket.', activeNodes: ['customer', 'gateway', 'order_srv', 'db', 'restaurant'], highlightDetails: 'The Temporal workflow sets timers. For example, it cancels the order if the restaurant does not respond in time.', latencyEstimate: '45ms' },
        { step: 2, title: 'Dispatch the courier at the right time', description: 'The restaurant sets a prep time of 18 minutes. The Dispatch Engine does not send a courier right away, because the courier would wait at the restaurant. It estimates the courier travel time (for example 6 minutes) and sends the offer at minute 12.', activeNodes: ['restaurant', 'order_srv', 'dispatch_srv'], highlightDetails: 'This cuts courier waiting time and keeps the food from cooling. Real systems add a safety margin because a courier may take time to accept.', latencyEstimate: '100ms' },
        { step: 3, title: 'Courier accepts and picks up the food', description: 'The courier accepts the job. Dispatch routes the courier to the restaurant and tells the kitchen when the courier is about 2 minutes away. When the courier collects the food, the order moves to "FOOD_PICKED_UP".', activeNodes: ['dispatch_srv', 'courier', 'order_srv'], highlightDetails: 'The routing engine (OSRM) gives turn-by-turn directions and the travel time estimate.', latencyEstimate: '30ms' },
        { step: 4, title: 'Show the courier on the customer map', description: 'While the courier rides to the customer, GPS pings go to the gateway and Redis, and are pushed down the customer WebSocket.', activeNodes: ['courier', 'gateway', 'redis_geo', 'customer'], highlightDetails: 'A position reaches the customer within about a second of reaching the server. Pings are 5 seconds apart, so the app animates the movement between them.', latencyEstimate: '150ms' }
      ]
    },
    apiDesign: [
      {
        method: 'POST',
        path: '/api/v1/orders',
        description: 'Create a food order',
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
        notes: 'PostgreSQL with ACID transactions. State changes use conditional updates (for example, set the state to ACCEPTED only if it is still SENT_TO_RESTAURANT), so a late or repeated event cannot move an order to the wrong state.'
      }
    ],
    deepDives: [
      {
        title: 'Order Fulfillment State Machine: Temporal Workflow Orchestration',
        subtitle: 'Why a durable workflow suits a process with three independent parties',
        content: `A delivery order involves three independent parties and many asynchronous events over about 45 minutes.\n\nFailure modes:\n- The restaurant rejects the order after the payment was authorized.\n- No courier accepts the offer within 10 minutes.\n- The courier's vehicle breaks down mid-delivery.\n\nSolution: a durable workflow engine such as Temporal or Cadence:\n- The whole order lifecycle is written as code, with retry policies, timers and compensation steps. A compensation is an action that undoes an earlier step, for example refunding the card if no courier is found within 15 minutes.\n- The engine records every step in an event history. If a server crashes, another worker replays the history and continues from where the workflow stopped.\n- Workflow code must be deterministic (the same history always gives the same result). Calls to the outside world, such as payment or notifications, go in separate activities that are retried safely, so they should be idempotent.`,
        keyTakeaways: [
          'A durable workflow engine saves you from writing your own code to recover half-finished orders after a crash.',
          'Compensation steps make sure a customer is not charged for an order that could not be delivered.',
          'Activities can run more than once, so make them idempotent.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Dinner-rush overload at one restaurant',
        impact: 'A popular burger place gets 200 orders in 10 minutes, and kitchen delays grow to 90 minutes.',
        mitigation: 'Throttle by kitchen load. When the open-ticket queue grows past what the kitchen can cook, raise the quoted prep time, or pause new orders from that restaurant until the queue shrinks. Customers see an honest ETA, and couriers are not sent too early.'
      }
    ],
    interviewQA: [
      {
        question: 'How do you batch two orders to the same courier efficiently?',
        hint: 'Compare the extra detour with the benefit. This is a small multi-stop routing problem.',
        goodAnswer: 'When order B is placed near the restaurant of order A, compute the extra time: detour time = (route duration with A and B) minus (route duration with A alone). If the detour is small (for example under 8 minutes) and both meals stay within their food-quality time limits, batch them. The customer can be offered a lower delivery fee. A real system checks several stop orders, because there are only a few stops.',
        pitfalls: 'Batching orders whose routes go in opposite directions. Ignoring how long each meal has been waiting.'
      }
    ],
    similarSystems: ['Uber Eats', 'Grubhub', 'Instacart', 'Zomato'],
    tags: ['Temporal Workflow', 'Geospatial', 'State Machine', 'WebSockets', 'PostgreSQL']
  },
  {
    id: 'stripe-payment-gateway',
    title: 'Design Stripe / Distributed Payment Gateway & Ledger',
    slug: 'stripe-payment-gateway',
    tagline: 'Build a payment system that never charges twice, never loses money, and records every movement of funds in a double-entry ledger.',
    category: 'Financial & High Throughput',
    difficulty: 'Advanced',
    readTime: '26 min read',
    scaleSummary: {
      dau: '100 Million Transactions / day',
      qps: '1,160 Transactions/sec avg (Peak 40,000)',
      storage: '100% Immutable Append-Only Financial Ledger (Zero data loss tolerance)',
      bandwidth: '80 MB/s Peak Encrypted Traffic'
    },
    overview: 'A payment platform lets merchants accept credit cards, digital wallets and bank transfers. The system needs four things. Retried requests must be safe (idempotency). Money records must be fully consistent. Every movement of funds must be written in a double-entry ledger. And it must cope with slow or failing banks.',
    keyChallenges: [
      'Idempotency: a network retry must never charge a customer twice.',
      'The dual-write problem: the system must update its own database and call an external bank, and these two actions cannot be made atomic. One can succeed while the other fails.',
      'Double-entry accounting: every transaction debits one account and credits another, and all entries sum to zero.',
      'Multi-region ledger: keep the ledger available across regions without two regions disagreeing about balances (split-brain).'
    ],
    functionalRequirements: [
      'Process card charges through card networks (Visa, Mastercard, Amex).',
      'Safe client retries with an Idempotency-Key header.',
      'A double-entry ledger that tracks merchant balances and platform fees.',
      'A payout engine that sends funds to merchant bank accounts (for example T+2 days, meaning two days after the transaction).',
      'A webhook dispatcher that delivers payment events to merchant servers.'
    ],
    nonFunctionalRequirements: [
      'Strong consistency: no lost money and no double charges.',
      'High availability: 99.999% uptime for the payment API, which is about 5 minutes of downtime per year.',
      'End-to-end latency under 1.5 seconds for a full card authorization.',
      'PCI-DSS compliance: card numbers are tokenized and kept in a vault protected by hardware security modules (HSMs).'
    ],
    outOfScope: ['Firmware for physical point-of-sale terminals.'],
    capacityEstimations: {
      assumptions: [
        '100M transactions per day: about 1,160 per second on average, and 40,000 per second at peak (for example on Black Friday).',
        'Each ledger entry set is about 1 KB (debit entry, credit entry, metadata and audit hash).',
        'Storage: 100M × 1 KB = 100 GB per day, or 36.5 TB per year of immutable ledger records.',
        'API payload: about 2 KB per transaction (request and response over TLS). 40,000 × 2 KB = 80 MB/s at peak. Ledger volume is a single copy before replication.'
      ],
      metrics: [
        { label: 'Peak Transaction QPS', value: '40,000 QPS', formula: 'Black Friday peak authorization attempts', description: 'Peak charge requests per second handled by the payment engine' },
        { label: 'Ledger Audit Volume', value: '36.5 TB / year', formula: '100% append-only immutable accounting entries', description: 'Append-only ledger data per year, stored in a distributed SQL database such as Spanner' },
        { label: 'Card Authorization Latency', value: '< 1,200 ms', formula: 'Includes 2 bank roundtrips over Visa/Mastercard networks', description: 'P99 target (99% of authorizations are faster than this)' }
      ],
      conclusion: 'The ledger needs strongly consistent, multi-row transactions that survive a node or region failure. A distributed SQL database such as Google Cloud Spanner (which uses Paxos) or CockroachDB (which uses Raft) provides this. Sharded PostgreSQL with synchronous replicas is another option. The volume (36.5 TB per year) is large but not the main difficulty. Correctness is.'
    },
    architecture: {
      summary: 'The merchant calls the API gateway with an Idempotency-Key. The idempotency layer records the key, so a duplicate request cannot start a second charge. Card data is already tokenized in the vault. The Payment Orchestrator calls the bank network to authorize the card. The result is committed to the double-entry ledger in one ACID transaction. Webhooks go out afterwards through a queue.',
      nodes: [
        { id: 'merchant', label: 'Merchant App / Client', type: 'client', x: 8, y: 50, description: 'Calls POST /v1/charges with an Idempotency-Key header' },
        { id: 'gateway', label: 'Payment API Gateway', type: 'gateway', x: 28, y: 50, description: 'Checks API keys, applies rate limits and ends TLS', techStack: ['Envoy'] },
        { id: 'idemp_filter', label: 'Idempotency Layer (Redis + DB)', type: 'cache', x: 48, y: 20, description: 'Records each idempotency key and stores the finished response, so a retry gets the same answer', techStack: ['Redis / Spanner'] },
        { id: 'vault', label: 'PCI Card Token Vault', type: 'service', x: 48, y: 80, description: 'Stores card numbers encrypted, with keys protected by an HSM, and hands out tokens instead', techStack: ['Hardware Security Module'] },
        { id: 'pay_orchestrator', label: 'Payment Orchestration Engine', type: 'service', x: 68, y: 50, description: 'Runs the steps of a payment: authorize, capture and write ledger entries', techStack: ['Java / Rust'] },
        { id: 'bank_network', label: 'Banking & Card Network (Visa)', type: 'service', x: 92, y: 20, description: 'The external acquiring bank and card network (Visa, Mastercard)', techStack: ['ISO 8583 Banking Protocol'] },
        { id: 'ledger_db', label: 'Double-Entry Ledger (Spanner)', type: 'database', x: 92, y: 60, description: 'Append-only journal of every debit and credit', techStack: ['Google Cloud Spanner / CockroachDB'] },
        { id: 'webhook_srv', label: 'Webhook Dispatcher', type: 'worker', x: 68, y: 85, description: 'Sends events such as charge.succeeded to merchants and retries on failure. Delivery is at least once, so merchants must ignore repeats by event ID.', techStack: ['Kafka + Worker Cluster'] }
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
        { step: 1, title: 'Check and lock the idempotency key', description: 'The merchant sends the header Idempotency-Key: "order_99a_retry". The system looks the key up. If it finished before, the system returns the saved response without calling the bank. If the same key is still being processed, the system rejects the duplicate with 409 Conflict.', activeNodes: ['merchant', 'gateway', 'idemp_filter'], highlightDetails: 'A client that times out and retries gets the original result instead of a second charge. The system also compares the new request to the saved one, and rejects the key if the parameters differ. Keys are kept for a limited time, for example 24 hours.', latencyEstimate: '10ms' },
        { step: 2, title: 'Tokenize the card and store it in the vault', description: 'The raw card number (PAN, the Primary Account Number) is replaced by an opaque token such as tok_18923. The vault stores the card encrypted, with keys protected by an HSM, in a separate, tightly controlled environment.', activeNodes: ['gateway', 'vault'], highlightDetails: 'Only the vault handles raw card numbers. In practice, the customer browser sends the card straight to the vault, so the merchant servers never see it. This keeps most systems out of PCI-DSS scope.', latencyEstimate: '25ms' },
        { step: 3, title: 'Authorize with the bank', description: 'The Payment Orchestrator builds an ISO 8583 message (the standard card network message format) and sends it through the acquiring bank and the card network to the issuing bank. The bank replies with code "00" (approved) and an authorization code.', activeNodes: ['pay_orchestrator', 'bank_network'], highlightDetails: 'If the call times out, the system does not know the result. It then asks the bank for the status or sends a reversal (a request to cancel the authorization).', latencyEstimate: '650ms' },
        { step: 4, title: 'Commit the ledger entries in one transaction', description: 'The Orchestrator writes immutable journal entries to the ledger in one transaction. For a $100 charge with an example 2.9% fee:\n- Debit: User Card Receivable ($100.00)\n- Credit: Merchant Balance ($97.10)\n- Credit: Stripe Processing Fee ($2.90)\nDebits equal credits, so the entries sum to zero.', activeNodes: ['pay_orchestrator', 'ledger_db', 'idemp_filter', 'webhook_srv'], highlightDetails: 'Because debits must equal credits, a missing or altered entry shows up as an imbalance when the books are checked.', latencyEstimate: '20ms' }
      ]
    },
    apiDesign: [
      {
        method: 'POST',
        path: '/v1/charges',
        description: 'Create a credit card charge. Amounts are in the smallest currency unit (cents), so 10000 means $100.00.',
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
          { name: 'amount', type: 'BIGINT', notes: 'Integer cents, for example 10000 = $100.00' },
          { name: 'currency', type: 'CHAR(3)' },
          { name: 'created_at', type: 'TIMESTAMP' }
        ],
        notes: 'Append-only table. Database permissions allow inserts but forbid updates and deletes. To fix a mistake, add a new reversing entry. The entries of one transaction may sit on different shards, so the database must support distributed transactions.'
      }
    ],
    deepDives: [
      {
        title: 'Double-Entry Bookkeeping & Integer Currency Modeling',
        subtitle: 'Why money is never stored as a float, and how a double-entry ledger works',
        content: `Two basic rules of financial software:\n1. Never use floating-point numbers for money. In most languages, 0.1 + 0.2 = 0.30000000000000004. Small errors like this add up across millions of transactions and make the books stop matching. Store money as integer cents (for example $100.00 is 10000 in a BIGINT) or as an exact DECIMAL type such as DECIMAL(20, 4).\n\n2. Double-entry accounting:\n- Every transaction has at least two balanced ledger entries.\n- Total debits must equal total credits.\n- For a $100 charge with an example 2.9% fee:\n  - Entry 1: DEBIT  Customer_Card_Account  $100.00\n  - Entry 2: CREDIT Merchant_Payout_Account $97.10\n  - Entry 3: CREDIT Stripe_Revenue_Account   $2.90\n- Total debits ($100.00) equal total credits ($97.10 + $2.90).\n- A reconciliation job checks that the entries of each transaction balance. If they ever do not, it raises an alarm.\n\nBecause entries are never edited, the ledger is also an audit trail. A refund is a new set of entries, not a change to the old ones.`,
        keyTakeaways: [
          'Integer cents avoid floating-point rounding errors.',
          'A double-entry ledger makes missing or invented money visible, because the entries stop balancing.',
          'An append-only ledger keeps a full history. Corrections are new entries.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Bank API timeout (dual-write failure)',
        impact: 'The Payment Service sends a charge to the bank, and the connection drops before the reply arrives. The system cannot tell whether the bank charged the customer.',
        mitigation: 'Save the payment attempt (with its idempotency key and a pending status) before calling the bank. If the call times out, mark the payment "unknown" and send a status inquiry to the bank with the original transaction ID. If the bank says it approved the charge, write the ledger entries. If the bank has no record, or the charge cannot be confirmed, send a reversal or void, then cancel the order. A periodic reconciliation job compares our records with the bank daily files and flags any difference.'
      }
    ],
    interviewQA: [
      {
        question: 'How do you guarantee that a network retry with the same Idempotency-Key never charges twice even if two instances receive it simultaneously?',
        hint: 'A unique constraint or an atomic insert makes only one request the winner.',
        goodAnswer: 'Insert the key into an idempotency_keys table that has a UNIQUE constraint, together with a hash of the request and the status "PROCESSING". A Redis SET NX with an expiry also works as a fast first check, but the database is the durable record. The first request wins the insert and does the work. The second gets a unique violation, so it returns 409 or waits for the first to finish, and then returns the saved response. Store the final response with the key when the work is done. If the first request crashes, an expiry or a recovery job lets a retry take over.',
        pitfalls: 'Reading the key and then writing it as two separate steps, which lets both requests pass. Using a lock with no expiry, so a crash blocks the key forever. Not comparing request parameters when a key is reused.'
      }
    ],
    similarSystems: ['PayPal', 'Adyen', 'Square', 'Braintree'],
    tags: ['Double-Entry Ledger', 'Idempotency', 'Spanner', 'PCI-DSS', 'ACID']
  }
];
