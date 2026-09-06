import { CaseStudy } from '../types/system-design';

export const MESSAGING_CASE_STUDIES: CaseStudy[] = [
  {
    id: 'whatsapp-chat',
    title: 'Design WhatsApp / WeChat (Global Messaging Service)',
    slug: 'whatsapp-messaging',
    tagline: 'Ultra-low latency 1:1 and group chat supporting billions of active WebSocket connections, message statuses, and offline queues.',
    category: 'Messaging & Real-time',
    difficulty: 'Advanced',
    readTime: '24 min read',
    scaleSummary: {
      dau: '2 Billion Daily Active Users',
      qps: '1,500,000 Messages / sec (Peak 3,000,000 msg/sec)',
      storage: '100 Billion messages / day (Temporary buffer & durable archive)',
      bandwidth: '50 GB/s Real-Time WebSocket Egress'
    },
    overview: 'WhatsApp provides instant peer-to-peer messaging, group chats, delivery status receipts (sent, delivered, read), and offline message queuing. The system maintains millions of concurrent persistent bidirectional TCP/WebSocket connections per server using Erlang/Go/Netty architectures.',
    keyChallenges: [
      'Maintaining 500M+ persistent bidirectional TCP / WebSocket connections simultaneously without memory exhaustion',
      'Reliable message delivery with exactly-once perception and offline queue delivery upon reconnection',
      'Group Chat message fanout (e.g. 1 message sent to a 1,024-member group) without cascading gateway lag',
      'End-to-End Encryption (Signal Protocol) key exchange and multi-device state synchronization'
    ],
    functionalRequirements: [
      '1:1 real-time text, voice note, and media messaging',
      'Group chats with up to 1,024 participants',
      'Message status receipts (Single tick = Sent, Double grey = Delivered to device, Double blue = Read)',
      'Offline message storage and replay upon reconnecting',
      'User online presence status and typing indicators'
    ],
    nonFunctionalRequirements: [
      'Sub-100ms end-to-end delivery latency over mobile 4G/5G',
      'Zero message loss under network disconnections',
      'End-to-End Encryption (E2EE) ensuring zero server-side plaintext visibility',
      '99.999% Gateway Availability'
    ],
    outOfScope: ['VoIP Group Calling SFU', 'In-App Payment Gateway'],
    capacityEstimations: {
      assumptions: [
        '2 Billion DAU; 100 Billion messages sent per day = ~1.15M msg/sec avg (3M peak msg/sec)',
        'Active persistent connections: 500 Million concurrent connections',
        'Average message size: 200 bytes text / 100 KB media thumbnail',
        'RAM per open WebSocket connection: ~10 KB (500M * 10KB = 5 TB Gateway RAM total across 500 servers)'
      ],
      metrics: [
        { label: 'Message Ingestion Rate', value: '3,000,000 msg/sec', formula: '100B / 86,400 * 2.5x peak burst', description: 'Peak incoming chat messages' },
        { label: 'Concurrent Connections', value: '500,000,000', formula: 'Active mobile sockets maintained', description: 'Distributed Gateway Connection Pool' },
        { label: 'Temporary Offline Store', value: '20 TB RAM/SSD', formula: 'Undelivered messages buffered for 30 days', description: 'Redis / Cassandra offline inbox' }
      ],
      conclusion: 'A stateful Gateway Cluster tracking User ID -> Gateway Server IP mappings in a distributed Redis session registry is required.'
    },
    architecture: {
      summary: 'Clients maintain TLS WebSocket connections to Chat Gateway Servers (Erlang/Go). When User A sends a message to User B, Gateway checks Redis Session Store for User B Gateway IP. If online, routes via internal gRPC to User B Gateway. If offline, stores in Cassandra/Redis Offline Inbox. Media is uploaded to S3 and sent as encrypted thumbnail pointers.',
      nodes: [
        { id: 'client_a', label: 'User A (Sender)', type: 'client', x: 8, y: 30, description: 'Maintains long-lived WebSocket connection' },
        { id: 'client_b', label: 'User B (Recipient)', type: 'client', x: 8, y: 70, description: 'Receives real-time push message' },
        { id: 'lb', label: 'Layer 4 Load Balancer', type: 'load_balancer', x: 26, y: 50, description: 'TCP NLB distributing WebSocket handshakes', techStack: ['AWS NLB / IPVS'] },
        { id: 'chat_gw_1', label: 'Chat Gateway #1', type: 'gateway', x: 45, y: 30, description: 'Holds active socket for User A', techStack: ['Erlang / Go / Netty'], scaleMetric: '1M sockets / node' },
        { id: 'chat_gw_2', label: 'Chat Gateway #2', type: 'gateway', x: 45, y: 70, description: 'Holds active socket for User B', techStack: ['Erlang / Go / Netty'] },
        { id: 'session_store', label: 'Session Registry (Redis)', type: 'cache', x: 68, y: 50, description: 'Maps user_id -> gateway_server_ip:port', techStack: ['Redis Cluster'], scaleMetric: '500M keys in RAM' },
        { id: 'msg_service', label: 'Message & Group Service', type: 'service', x: 68, y: 20, description: 'Handles group fanout and deduplication', techStack: ['Java / Go'] },
        { id: 'offline_store', label: 'Offline Message Inbox', type: 'database', x: 88, y: 50, description: 'Buffers messages for disconnected devices', techStack: ['Apache Cassandra / RocksDB'] },
        { id: 'push_service', label: 'Push Notification Engine', type: 'worker', x: 88, y: 80, description: 'Triggers Apple APNs / Google FCM when offline', techStack: ['APNs / FCM Gateway'] }
      ],
      edges: [
        { id: 'e1', from: 'client_a', to: 'chat_gw_1', label: '1. Send Message', protocol: 'WebSocket' },
        { id: 'e2', from: 'chat_gw_1', to: 'session_store', label: '2. Lookup User B Session', protocol: 'TCP' },
        { id: 'e3', from: 'chat_gw_1', to: 'chat_gw_2', label: '3. Internal gRPC Route', protocol: 'gRPC' },
        { id: 'e4', from: 'chat_gw_2', to: 'client_b', label: '4. Deliver Real-Time', protocol: 'WebSocket' },
        { id: 'e5', from: 'client_b', to: 'chat_gw_2', label: '5. ACK Delivered', protocol: 'WebSocket' },
        { id: 'e6', from: 'chat_gw_1', to: 'offline_store', label: 'If Offline: Buffer Msg', protocol: 'NoSQL' },
        { id: 'e7', from: 'chat_gw_1', to: 'push_service', label: 'If Offline: Trigger Push', protocol: 'Internal RPC', isAsync: true }
      ],
      flowSteps: [
        { step: 1, title: 'Client WebSocket Connection', description: 'Client establishes secure WSS connection via L4 Load Balancer to Chat Gateway. Gateway registers user_id -> gateway_ip in Redis Session Store with a 60s heartbeat lease.', activeNodes: ['client_a', 'lb', 'chat_gw_1', 'session_store'], highlightDetails: 'L4 NLB passes TCP connection transparently to gateway nodes.', latencyEstimate: '30ms' },
        { step: 2, title: 'Session Lookup & gRPC Hop', description: 'User A sends encrypted message to User B. Chat Gateway #1 queries Redis: User B is connected to Chat Gateway #2. Gateway #1 forwards payload via high-speed internal gRPC.', activeNodes: ['chat_gw_1', 'session_store', 'chat_gw_2'], highlightDetails: 'Sub-millisecond internal routing hop between gateway pods.', latencyEstimate: '2ms' },
        { step: 3, title: 'Real-Time Delivery & ACK Loop', description: 'Gateway #2 pushes packet down User B WebSocket. User B client receives packet and sends back ACK payload. Gateway #2 routes ACK back to Gateway #1 -> User A sees Double Grey Ticks.', activeNodes: ['chat_gw_2', 'client_b', 'chat_gw_1', 'client_a'], highlightDetails: 'Guarantees reliable at-least-once delivery with client de-duplication.', latencyEstimate: '45ms' },
        { step: 4, title: 'Offline Fallback & Apple/Google Push', description: 'If User B has no active session, message is saved to Cassandra Offline Inbox with a 30-day TTL, and a silent push notification is dispatched via Apple APNs / Google FCM.', activeNodes: ['chat_gw_1', 'offline_store', 'push_service'], highlightDetails: 'When User B wakes up and reconnects, client pulls all unread messages in order.', latencyEstimate: '15ms' }
      ]
    },
    apiDesign: [
      {
        method: 'WS',
        path: '/ws/v1/chat',
        description: 'Persistent bidirectional WebSocket channel',
        requestBody: '{\n  "action": "SEND_MSG",\n  "msg_id": "m_102938475",\n  "recipient_id": "usr_8821",\n  "encrypted_payload": "a8x9z...[E2EE Ciphertext]",\n  "timestamp": 1724000000\n}',
        responseBody: '{\n  "action": "ACK_SERVER",\n  "msg_id": "m_102938475",\n  "status": "SENT_TO_SERVER"\n}'
      }
    ],
    databaseDesign: [
      {
        tableName: 'offline_messages',
        type: 'Wide-Column',
        shardingKey: 'recipient_id (Partition Key), message_id (Clustering Key ASC)',
        fields: [
          { name: 'recipient_id', type: 'UUID', isPrimary: true },
          { name: 'message_id', type: 'BIGINT', isPrimary: true },
          { name: 'sender_id', type: 'UUID' },
          { name: 'encrypted_content', type: 'BLOB' },
          { name: 'created_at', type: 'TIMESTAMP' }
        ],
        notes: 'Cassandra table storing transient undelivered messages. Once delivered, rows are deleted.'
      }
    ],
    deepDives: [
      {
        title: 'Group Chat Fanout Architecture: Client Fanout vs Server Fanout',
        subtitle: 'How WhatsApp handles groups with 1,024 members efficiently',
        content: `When a message is posted in a group with 500 members:\n1. Client Fanout: Sender device encrypts and transmits 500 individual messages over cellular network. Result: Terrible sender battery and mobile data usage!\n2. Server Fanout with Sender Keys (WhatsApp Architecture):\n   - The sender encrypts the message ONCE using a symmetric Group Sender Key and transmits 1 single packet to the Chat Gateway.\n   - The Message Service queries Group Membership in Redis, resolves the Gateway IP for each of the 500 members, and fans out 500 internal packets over high-speed 100Gbps datacenter networks.\n   - Each recipient decrypts the message locally using their cached Group Sender Key.`,
        keyTakeaways: [
          'Server-side fanout minimizes client bandwidth to a single upload.',
          'Sender Keys preserve end-to-end encryption without requiring 500 separate client encryptions.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Gateway Node Crash / Thundering Herd on Reconnection',
        impact: 'If a gateway node holding 1M connections restarts, 1M mobile clients attempt to reconnect simultaneously, overwhelming auth servers.',
        mitigation: 'Implement exponential backoff with full jitter on mobile reconnection logic (e.g. sleep rand(1, 30) seconds before reconnecting).'
      }
    ],
    interviewQA: [
      {
        question: 'How do you prevent duplicate messages if a mobile client disconnects before receiving the server ACK?',
        hint: 'Client retries on network reconnect.',
        goodAnswer: 'The client assigns a client-generated UUID (idempotency key) to every message. When the client retries, the server checks if that UUID was already recorded in the deduplication cache for that conversation. If yes, it discards the duplicate write and re-sends the ACK.',
        pitfalls: 'Relying on server-generated auto-increment IDs for deduplication.'
      }
    ],
    similarSystems: ['Signal', 'Telegram', 'WeChat', 'LINE'],
    tags: ['WebSockets', 'Erlang', 'Cassandra', 'E2EE', 'Redis Session Store']
  },
  {
    id: 'discord-slack-chat',
    title: 'Design Discord / Slack (Scalable Channels & Voice Gateways)',
    slug: 'discord-slack-architecture',
    tagline: 'Real-time guild channels, presence broadcast rings, Elixir/Rust Gateway clusters, and distributed voice routing.',
    category: 'Messaging & Real-time',
    difficulty: 'Advanced',
    readTime: '22 min read',
    scaleSummary: {
      dau: '200 Million Daily Active Users',
      qps: '850,000 Channel Messages/sec / 5 Million Presence Events/sec',
      storage: '2 Trillion historical messages in ScyllaDB',
      bandwidth: '120 GB/s Real-time WebSocket Egress'
    },
    overview: 'Discord and Slack support massive servers (guilds) with hundreds of thousands of members, structured voice and text channels, persistent message history, role-based access control, and real-time presence indicators (online/idle/dnd/mobile).',
    keyChallenges: [
      'Presence Broadcast Storm: In a 500k-member guild, 1 user going online triggers 500,000 WebSocket presence updates',
      'High-Throughput Chat Persistence: Writing millions of messages/sec with deterministic channel ordering',
      'Gateway Connection Clustering: Scaling stateful Elixir/Erlang BEAM / Rust gateways to handle 40M concurrent connections',
      'Voice Channel Routing: WebRTC selective forwarding units (SFUs) routing real-time audio with < 30ms latency'
    ],
    functionalRequirements: [
      'Create guilds/workspaces, channels (text and voice), and roles',
      'Send text, mentions (@here, @channel), and attachments in channels',
      'Real-time user presence status (Online, Away, Do Not Disturb, Offline, Game Activity)',
      'Infinite scroll channel message history',
      'Real-time low-latency voice channels'
    ],
    nonFunctionalRequirements: [
      'Message latency in channel < 50ms (P99)',
      'Zero message loss with persistent historical archive',
      'Voice audio latency < 40ms end-to-end',
      'High availability 99.99%'
    ],
    outOfScope: ['Screen share 4K 120fps transcoding', 'Custom enterprise audit log compliance integrations'],
    capacityEstimations: {
      assumptions: [
        '200M DAU; 40M peak concurrent users connected via WebSockets',
        '850,000 messages/sec peak across all global channels',
        'Presence updates: 5,000,000 state transitions/sec',
        'ScyllaDB cluster storing 2 Trillion messages (~500 TB partitioned storage)'
      ],
      metrics: [
        { label: 'Concurrent Sockets', value: '40,000,000', formula: 'Active mobile & desktop gateway sessions', description: 'Elixir/Rust Gateway Cluster' },
        { label: 'Message Write QPS', value: '850,000 / sec', formula: 'Peak channel message ingestion', description: 'ScyllaDB write throughput' },
        { label: 'Presence Fanout Ops', value: '5,000,000 / sec', formula: 'User status changes distributed to active viewers', description: 'Presence Gateway Fanout' }
      ],
      conclusion: 'Presence updates must be lazy-loaded and throttled to only visible channel lists, rather than broadcast blindly to all 500k server members.'
    },
    architecture: {
      summary: 'Clients connect via WebSocket to Rust/Elixir Gateway. Messages pass to Guild Service -> ScyllaDB for persistence -> RabbitMQ/Kafka for channel pub/sub fanout. Presence Service batches state changes and only syncs for users actively visible in the client sidebar viewport.',
      nodes: [
        { id: 'client', label: 'Discord Desktop/Mobile App', type: 'client', x: 8, y: 50, description: 'Maintains persistent gateway connection' },
        { id: 'gateway_cluster', label: 'Discord Gateway (Elixir / Rust)', type: 'gateway', x: 30, y: 50, description: 'Manages 40M active WebSocket connections', techStack: ['Rust / Elixir BEAM'], scaleMetric: '40M Concurrent Sockets' },
        { id: 'guild_srv', label: 'Guild & Channel Service', type: 'service', x: 55, y: 30, description: 'Validates roles, channels, and mentions', techStack: ['Python / Rust'] },
        { id: 'presence_srv', label: 'Presence Service', type: 'service', x: 55, y: 70, description: 'Aggregates online statuses & rich activity', techStack: ['Elixir / Redis Cluster'] },
        { id: 'msg_queue', label: 'Channel Event Bus (RabbitMQ)', type: 'queue', x: 75, y: 30, description: 'Pub/sub routing for channel events', techStack: ['RabbitMQ / Kafka'] },
        { id: 'scylladb', label: 'Message Store (ScyllaDB)', type: 'database', x: 90, y: 30, description: 'Stores partitioned chat history', techStack: ['ScyllaDB (C++ Cassandra rewrite)'] },
        { id: 'voice_sfu', label: 'Voice Routing Cluster (SFU)', type: 'service', x: 55, y: 90, description: 'Routes WebRTC UDP voice streams', techStack: ['Rust WebRTC SFU'] }
      ],
      edges: [
        { id: 'e1', from: 'client', to: 'gateway_cluster', label: '1. WS Connect & Send Msg', protocol: 'WebSocket' },
        { id: 'e2', from: 'gateway_cluster', to: 'guild_srv', label: '2. Check Permissions', protocol: 'Internal RPC' },
        { id: 'e3', from: 'guild_srv', to: 'scylladb', label: '3. Save Snowflake Msg', protocol: 'NoSQL' },
        { id: 'e4', from: 'guild_srv', to: 'msg_queue', label: '4. Publish Channel Event', protocol: 'Async Queue', isAsync: true },
        { id: 'e5', from: 'msg_queue', to: 'gateway_cluster', label: '5. Fanout to Subscribed Sockets', protocol: 'Internal RPC', isAsync: true },
        { id: 'e6', from: 'gateway_cluster', to: 'client', label: '6. Push MESSAGE_CREATE', protocol: 'WebSocket' },
        { id: 'e7', from: 'client', to: 'presence_srv', label: 'Presence Heartbeat', protocol: 'WebSocket' }
      ],
      flowSteps: [
        { step: 1, title: 'Message Dispatch & Authorization', description: 'Client sends MESSAGE_CREATE JSON payload over WebSocket. Gateway forwards to Guild Service to verify user has "SEND_MESSAGES" role in channel.', activeNodes: ['client', 'gateway_cluster', 'guild_srv'], highlightDetails: 'Permissions cached in Gateway memory for sub-millisecond validation.', latencyEstimate: '8ms' },
        { step: 2, title: 'ScyllaDB Write with Snowflake ID', description: 'Message is assigned a 64-bit Snowflake ID and written to ScyllaDB partitioned by channel_id and bucketed by time.', activeNodes: ['guild_srv', 'scylladb'], highlightDetails: 'ScyllaDB handles 850k writes/sec with consistent sub-5ms latency.', latencyEstimate: '4ms' },
        { step: 3, title: 'RabbitMQ Fanout to Active Gateway Pods', description: 'Guild Service publishes event to channel-specific RabbitMQ exchange. Gateway servers holding connections for active channel members receive event and push to clients.', activeNodes: ['guild_srv', 'msg_queue', 'gateway_cluster', 'client'], highlightDetails: 'End-to-end message latency under 40ms globally.', latencyEstimate: '20ms' }
      ]
    },
    apiDesign: [
      {
        method: 'POST',
        path: '/api/v9/channels/{channel_id}/messages',
        description: 'Send a message to a text channel',
        requestBody: '{\n  "content": "Meeting started in voice channel!",\n  "tts": false\n}',
        responseBody: '{\n  "id": "109283746501928374",\n  "channel_id": "890123456789012345",\n  "author": { "id": "1234", "username": "alex" },\n  "timestamp": "2026-08-28T10:00:00.000Z"\n}'
      }
    ],
    databaseDesign: [
      {
        tableName: 'messages',
        type: 'Wide-Column',
        shardingKey: 'channel_id, bucket (Partition Key), message_id (Clustering Key DESC)',
        fields: [
          { name: 'channel_id', type: 'BIGINT', isPrimary: true },
          { name: 'bucket', type: 'INT', isPrimary: true, notes: 'Time bucket (e.g. 10 days of messages) to prevent huge partitions' },
          { name: 'message_id', type: 'BIGINT', isPrimary: true, notes: 'Snowflake ID' },
          { name: 'author_id', type: 'BIGINT' },
          { name: 'content', type: 'TEXT' },
          { name: 'attachments', type: 'JSON' }
        ],
        notes: 'ScyllaDB data model ensuring partition size stays strictly under 100MB.'
      }
    ],
    deepDives: [
      {
        title: 'Solving the Presence Storm: Guild Member List Subscriptions',
        subtitle: 'Why broadcasting presence to 500,000 members brings down networks',
        content: `In a Discord server with 500,000 members (like Minecraft or Midjourney), if 100 users change status every second, naive broadcasting generates 100 * 500,000 = 50 Million WebSocket messages per second for a single server!\n\nDiscord Solution (Guild Subscriptions / Lazy Loading):\n1. The client only renders ~30-50 members in the visible right-hand sidebar viewport.\n2. When user scrolls the sidebar, client sends GUILD_SUBSCRIPTIONS { ranges: [[0, 99]] } to Gateway.\n3. The Presence Gateway only pushes presence updates for users inside the active [0, 99] index range.\n4. When a user minimizes the app or switches channels, presence subscriptions are paused immediately.\n5. Result: 99.8% reduction in presence broadcast bandwidth!`,
        keyTakeaways: [
          'Viewport-based subscriptions eliminate broadcast amplification in massive groups.',
          'Gateway processes presence diffs in memory rather than persisting every transient status switch to disk.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Massive ScyllaDB Partition Growth on Active Channels',
        impact: 'A channel with 10M messages causes partition size to exceed 2GB, slowing down compaction and queries.',
        mitigation: 'Bucket channels by time (e.g. bucket = message_id >> 22 / (1000 * 60 * 60 * 24 * 10)) so each partition holds max 50,000 messages.'
      }
    ],
    interviewQA: [
      {
        question: 'Why did Discord migrate from MongoDB to Cassandra and then to ScyllaDB and Rust?',
        hint: 'GC pauses in JVM and compaction bottlenecks.',
        goodAnswer: 'MongoDB failed under high write concurrency; Cassandra (JVM) suffered from unpredictable Java Garbage Collection pauses that spiked P99 latency. ScyllaDB (written in C++ with shared-nothing seastar framework) delivered 10x lower P99 latency and eliminated GC pauses completely.',
        pitfalls: 'Attributing the migration purely to raw storage cost rather than tail latency consistency.'
      }
    ],
    similarSystems: ['Slack', 'Microsoft Teams', 'Guilded', 'Mattermost'],
    tags: ['WebSockets', 'ScyllaDB', 'Rust', 'Presence System', 'RabbitMQ']
  },
  {
    id: 'google-docs-collaboration',
    title: 'Design Google Docs (Real-Time Collaborative Editor)',
    slug: 'google-docs-collab',
    tagline: 'Multiplayer document editing with concurrent conflict resolution, Operational Transformation (OT), and CRDTs.',
    category: 'Messaging & Real-time',
    difficulty: 'Advanced',
    readTime: '25 min read',
    scaleSummary: {
      dau: '100 Million Daily Active Users',
      qps: '150,000 Character Edits/sec / 500,000 Active Collab Sessions',
      storage: '50 TB / day document revision history',
      bandwidth: '10 GB/s WebSocket Sync Egress'
    },
    overview: 'Google Docs enables dozens of users to concurrently edit the same document with sub-50ms keystroke synchronization, cursor positions, offline reconciliation, and full historical revision playback.',
    keyChallenges: [
      'Concurrent Editing Conflicts: User A inserts "X" at pos 5 while User B deletes char at pos 4 simultaneously',
      'Choosing between Operational Transformation (OT) vs Conflict-free Replicated Data Types (CRDTs)',
      'Sub-50ms keystroke replication latency with local optimistic UI rendering',
      'Scalable document snapshotting and delta revision history storage'
    ],
    functionalRequirements: [
      'Real-time collaborative rich-text editing for multiple users',
      'Real-time visual cursor positions and user selections',
      'Undo/Redo stack that respects global collaborative edits',
      'Offline editing with automatic synchronization upon reconnecting',
      'Document version history with point-in-time restore'
    ],
    nonFunctionalRequirements: [
      'Zero convergence divergence: All clients MUST reach the exact same document state',
      'Keystroke synchronization latency < 50ms',
      'High availability 99.99%',
      'Data durability: No typed character should ever be lost'
    ],
    outOfScope: ['Spreadsheet multi-cell formula recalculation DAG engine', 'Automated language translation'],
    capacityEstimations: {
      assumptions: [
        '100M DAU; 10M documents actively edited daily',
        'Average active collaborators per document: 3 users; Peak document: 100 concurrent editors',
        'Keystrokes: 150,000 operations/sec across the globe',
        'Operations batched every 50-100ms on the client to reduce WebSocket packet overhead'
      ],
      metrics: [
        { label: 'Edit Operation QPS', value: '150,000 ops/sec', formula: 'Concurrent character inserts/deletes', description: 'OT / CRDT coordination engine' },
        { label: 'Active Collab Rooms', value: '500,000 rooms', formula: 'Simultaneously active documents', description: 'Document Session Coordinators' }
      ],
      conclusion: 'A single-leader Document Coordinator per active document is necessary for central OT sequencing.'
    },
    architecture: {
      summary: 'Clients communicate via WebSockets to Document Gateway -> Routed to Document Session Coordinator (Leader per document). The Coordinator applies Operational Transformation (OT), establishes global revision sequence numbers, and broadcasts transformed operations to all collaborating clients -> Periodically saves snapshots to S3 and deltas to DynamoDB.',
      nodes: [
        { id: 'client_1', label: 'Collaborator 1 (User A)', type: 'client', x: 8, y: 30, description: 'Types text with optimistic local UI' },
        { id: 'client_2', label: 'Collaborator 2 (User B)', type: 'client', x: 8, y: 70, description: 'Concurrent editor' },
        { id: 'gateway', label: 'Collab Gateway (WS)', type: 'gateway', x: 30, y: 50, description: 'Terminates WebSockets and routes by doc_id', techStack: ['Envoy / Go'] },
        { id: 'doc_coordinator', label: 'Document Session Coordinator', type: 'service', x: 55, y: 50, description: 'Single-leader OT sequencing engine in memory', techStack: ['Java / C++ Server'], scaleMetric: '1 Actor per active doc' },
        { id: 'redis_coord', label: 'Doc-to-Coordinator Registry', type: 'cache', x: 55, y: 15, description: 'Consistent hashing mapping doc_id -> server_ip', techStack: ['Redis / etcd'] },
        { id: 'delta_db', label: 'Revision Delta Store', type: 'database', x: 82, y: 35, description: 'Stores ordered append-only edit log', techStack: ['DynamoDB / Cassandra'] },
        { id: 'snapshot_s3', label: 'Document Snapshots (S3)', type: 'storage', x: 82, y: 70, description: 'Compressed snapshot every 100 revisions', techStack: ['AWS S3'] }
      ],
      edges: [
        { id: 'e1', from: 'client_1', to: 'gateway', label: '1. Send Op(Insert "X", pos 5, rev 10)', protocol: 'WebSocket' },
        { id: 'e2', from: 'gateway', to: 'doc_coordinator', label: '2. Forward to Doc Leader', protocol: 'Internal RPC' },
        { id: 'e3', from: 'doc_coordinator', to: 'doc_coordinator', label: '3. Transform & Assign Rev 11', protocol: 'Internal RPC' },
        { id: 'e4', from: 'doc_coordinator', to: 'gateway', label: '4. Broadcast Transformed Op', protocol: 'Internal RPC' },
        { id: 'e5', from: 'gateway', to: 'client_2', label: '5. Push Op to Collab 2', protocol: 'WebSocket' },
        { id: 'e6', from: 'doc_coordinator', to: 'delta_db', label: '6. Append Delta Log', protocol: 'NoSQL', isAsync: true },
        { id: 'e7', from: 'doc_coordinator', to: 'snapshot_s3', label: '7. Periodic Snapshot', protocol: 'HTTPS', isAsync: true }
      ],
      flowSteps: [
        { step: 1, title: 'Optimistic Local Execution', description: 'User A types "H". The client applies the character immediately to the local UI (0ms perceived latency) and places operation in an unacknowledged buffer.', activeNodes: ['client_1'], highlightDetails: 'Keeps typing smooth regardless of network latency.', latencyEstimate: '0ms' },
        { step: 2, title: 'Operation Sent to Document Coordinator', description: 'Client sends Op(Insert "H", pos 5, rev 10) over WebSocket. Gateway routes to the assigned Document Coordinator server.', activeNodes: ['client_1', 'gateway', 'doc_coordinator'], highlightDetails: 'Consistent hashing ensures all editors for doc_id 42 hit the exact same server.', latencyEstimate: '20ms' },
        { step: 3, title: 'Central Operational Transformation (OT)', description: 'Coordinator checks if other operations were committed since rev 10. If User B committed an edit at rev 11, Coordinator transforms User A op against rev 11, produces transformed op, assigns rev 12, and commits.', activeNodes: ['doc_coordinator'], highlightDetails: 'Guarantees mathematical convergence across all participants.', latencyEstimate: '1ms' },
        { step: 4, title: 'Broadcast & Local Reconciliation', description: 'Coordinator broadcasts transformed op to all collaborators. Clients adjust their pending buffer positions and update document state.', activeNodes: ['doc_coordinator', 'gateway', 'client_2', 'client_1'], highlightDetails: 'All clients converge to the exact same text buffer.', latencyEstimate: '25ms' }
      ]
    },
    apiDesign: [
      {
        method: 'WS',
        path: '/ws/collab/v1/{doc_id}',
        description: 'Bidirectional collaborative OT editing channel',
        requestBody: '{\n  "type": "OP",\n  "client_id": "c_982",\n  "base_rev": 42,\n  "ops": [{ "action": "INSERT", "pos": 15, "text": "scalable " }]\n}',
        responseBody: '{\n  "type": "ACK_OP",\n  "server_rev": 43,\n  "applied_op": { "action": "INSERT", "pos": 15, "text": "scalable " }\n}'
      }
    ],
    databaseDesign: [
      {
        tableName: 'document_deltas',
        type: 'Wide-Column',
        shardingKey: 'doc_id (Partition Key), revision_number (Clustering Key ASC)',
        fields: [
          { name: 'doc_id', type: 'UUID', isPrimary: true },
          { name: 'revision_number', type: 'BIGINT', isPrimary: true },
          { name: 'author_id', type: 'UUID' },
          { name: 'operation_json', type: 'TEXT' },
          { name: 'created_at', type: 'TIMESTAMP' }
        ],
        notes: 'Append-only log of every single keystroke operation.'
      }
    ],
    deepDives: [
      {
        title: 'Operational Transformation (OT) vs Conflict-free Replicated Data Types (CRDTs)',
        subtitle: 'The two foundational paradigms of collaborative computing',
        content: `1. Operational Transformation (OT - used by Google Docs):\n- Operations (Insert/Delete at index) are transformed relative to concurrent operations: T(OpA, OpB) -> (OpA', OpB').\n- Pros: Memory efficient (plain string buffer on client, tiny JSON packets).\n- Cons: Requires a centralized server leader to establish total ordering of revisions.\n\n2. CRDTs (used by Figma, Apple Notes, Yjs, Automerge):\n- Every single character is assigned a unique fractional ID with logical timestamp (e.g. Lamport timestamp).\n- Pros: Truly decentralized (works peer-to-peer without central server; offline merges are commutative without transformation algorithms).\n- Cons: High memory overhead (each character carries metadata; 100KB text can balloon to 5MB memory).`,
        keyTakeaways: [
          'OT is ideal for client-server architectures with high performance and low memory overhead.',
          'CRDTs are ideal for P2P, local-first, or decentralized offline-heavy applications.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Document Loading Time for Old Documents with 50,000 Revisions',
        impact: 'Replaying 50,000 deltas from revision 0 takes seconds to load when opening a document.',
        mitigation: 'Snapshotting: Every 100 revisions, write a complete serialized snapshot of the document tree to S3. To open a document, load latest snapshot (e.g. rev 49,900) and only replay the last 100 deltas.'
      }
    ],
    interviewQA: [
      {
        question: 'How do you handle a Document Coordinator server crashing mid-session?',
        hint: 'Actor model recovery and distributed state reconstruction.',
        goodAnswer: 'When the coordinator node dies, etcd detects missed heartbeats and re-assigns the document to a standby node. The new node loads the latest snapshot from S3, replays committed deltas from DynamoDB, and requests connected clients to re-send any unacknowledged operations.',
        pitfalls: 'Storing state exclusively in server memory without durable append-only delta logging.'
      }
    ],
    similarSystems: ['Figma Multiplayer', 'Notion Collab', 'Miro Canvas', 'Overleaf'],
    tags: ['Operational Transformation', 'CRDT', 'WebSockets', 'Actor Model', 'DynamoDB']
  },
  {
    id: 'zoom-video-conferencing',
    title: 'Design Zoom / Google Meet (Video Conferencing Platform)',
    slug: 'zoom-video-conferencing',
    tagline: 'Global real-time audio/video routing, WebRTC media servers, Selective Forwarding Units (SFUs), and bandwidth adaptation.',
    category: 'Messaging & Real-time',
    difficulty: 'Advanced',
    readTime: '24 min read',
    scaleSummary: {
      dau: '300 Million Meeting Participants / day',
      qps: '50 Million Concurrent Meeting Streams',
      storage: 'Cloud Recordings in S3 (100 PB Archive)',
      bandwidth: '50 Terabits / sec Global Real-Time UDP Egress'
    },
    overview: 'A real-time video conferencing system provides low-latency (< 150ms) interactive audio/video calls for 2 to 1,000 participants per room, dynamic speaker switching, screen sharing, and cloud recording.',
    keyChallenges: [
      'Global End-to-End Latency < 150ms: Audio delays above 200ms make human conversation clunky',
      'Media Routing Architecture: Peer-to-Peer vs Multipoint Control Unit (MCU) vs Selective Forwarding Unit (SFU)',
      'Packet Loss & Jitter: Handling 5-20% cellular packet loss using Forward Error Correction (FEC) and NACK retransmissions',
      'Simulcast & SVC (Scalable Video Coding): Sending multiple video resolutions simultaneously to accommodate varying client bandwidths'
    ],
    functionalRequirements: [
      'Create and join video meeting rooms with short meeting ID or link',
      'Real-time audio, HD video, and screen sharing for up to 500 participants',
      'Active Speaker Detection (highlight current speaker automatically)',
      'In-meeting text chat and reactions',
      'Cloud meeting recording with MP4 output'
    ],
    nonFunctionalRequirements: [
      'Ultra Low Latency: Mouth-to-Ear delay < 150ms globally',
      'Smooth audio under 10% packet loss (audio prioritization over video)',
      'High Scalability: Spin up SFU media routing nodes dynamically across 50+ global cloud regions',
      'End-to-End Encryption support for private rooms'
    ],
    outOfScope: ['PSTN telephone dial-in telephony hardware PBX integration'],
    capacityEstimations: {
      assumptions: [
        '300M daily meeting participants; Peak concurrent: 20 Million active video participants',
        'Average video stream: 720p @ 1.2 Mbps; Audio: Opus @ 40 kbps',
        'SFU Bandwidth: A 50-person room with 1 speaker and 49 viewers requires 1 incoming stream forwarded to 49 clients = 50 Mbps egress per room'
      ],
      metrics: [
        { label: 'Global Media Egress', value: '50 Tbps', formula: '20M streams * average 600 kbps (Simulcast adjusted)', description: 'Total UDP Media Relay Throughput' },
        { label: 'SFU Server Fleet', value: '2,500 Nodes', formula: '50 Tbps / 20 Gbps per dedicated bare-metal media server', description: 'Global Media Edge Infrastructure' }
      ],
      conclusion: 'Media routing must use UDP / RTP rather than TCP/HTTP to prevent Head-of-Line blocking.'
    },
    architecture: {
      summary: 'Clients initiate call via HTTPS/WebSocket Signaling Server -> Negotiate ICE/SDP candidates -> Stream encrypted audio/video via WebSockets/UDP (SRTP) to nearest Selective Forwarding Unit (SFU) Media Server -> SFU forwards selected video bitrates (Simulcast) to room participants.',
      nodes: [
        { id: 'client_speaker', label: 'Active Speaker Client', type: 'client', x: 8, y: 30, description: 'Publishes 3 video simulcast layers (720p, 360p, 180p)' },
        { id: 'client_viewer', label: 'Meeting Viewers', type: 'client', x: 8, y: 70, description: 'Subscribes to audio and active video feeds' },
        { id: 'signaling_srv', label: 'Signaling Service (WebSocket)', type: 'service', x: 30, y: 50, description: 'Handles SDP offer/answer & ICE candidate exchange', techStack: ['Node.js / Go'] },
        { id: 'sfu_cluster', label: 'Media Routing Cluster (SFU)', type: 'service', x: 55, y: 50, description: 'Forwards UDP/SRTP packets without decoding', techStack: ['C++ mediasoup / Pion WebRTC'], scaleMetric: '20 Gbps / server' },
        { id: 'meeting_db', label: 'Meeting Coordinator DB', type: 'database', x: 55, y: 15, description: 'Room state, participant roster, auth', techStack: ['Redis / DynamoDB'] },
        { id: 'recorder', label: 'Cloud Recording Worker', type: 'worker', x: 80, y: 50, description: 'Composites audio/video streams into MP4 file', techStack: ['FFmpeg + GStreamer'] },
        { id: 's3_records', label: 'Recording Storage (S3)', type: 'storage', x: 95, y: 50, description: 'Stores recorded meetings', techStack: ['AWS S3 Standard'] }
      ],
      edges: [
        { id: 'e1', from: 'client_speaker', to: 'signaling_srv', label: '1. SDP Offer & Join', protocol: 'WebSocket' },
        { id: 'e2', from: 'signaling_srv', to: 'sfu_cluster', label: '2. Allocate Room Port', protocol: 'Internal RPC' },
        { id: 'e3', from: 'client_speaker', to: 'sfu_cluster', label: '3. Stream SRTP (UDP)', protocol: 'TCP' },
        { id: 'e4', from: 'sfu_cluster', to: 'client_viewer', label: '4. Forward Selected Stream', protocol: 'TCP' },
        { id: 'e5', from: 'sfu_cluster', to: 'recorder', label: '5. Mirror Stream for Recording', protocol: 'Internal RPC', isAsync: true },
        { id: 'e6', from: 'recorder', to: 's3_records', label: '6. Upload Final MP4', protocol: 'HTTPS', isAsync: true }
      ],
      flowSteps: [
        { step: 1, title: 'WebRTC Signaling & SDP Handshake', description: 'Clients connect to Signaling Server over WebSocket, exchanging Session Description Protocol (SDP) parameters and ICE candidates (NAT traversal via STUN/TURN).', activeNodes: ['client_speaker', 'signaling_srv', 'meeting_db'], highlightDetails: 'Selects the topologically nearest regional SFU media server.', latencyEstimate: '40ms' },
        { step: 2, title: 'Simulcast UDP Media Ingestion', description: 'Speaker publishes audio via Opus codec and video in 3 simulcast streams (High: 720p@1.5Mbps, Med: 360p@500kbps, Low: 180p@150kbps) over SRTP (Secure UDP).', activeNodes: ['client_speaker', 'sfu_cluster'], highlightDetails: 'UDP avoids TCP retransmission latency delays.', latencyEstimate: '20ms' },
        { step: 3, title: 'Selective Forwarding Unit (SFU) Routing', description: 'SFU does NOT transcode or decode video (zero CPU load). It inspects packet headers and forwards High quality to the participant with active screen focus, and Low quality thumbnail streams to gallery view participants.', activeNodes: ['sfu_cluster', 'client_viewer'], highlightDetails: 'SFU can serve 1,000 participants on a single 16-core server.', latencyEstimate: '5ms' },
        { step: 4, title: 'Packet Loss Concealment & Audio Prioritization', description: 'If a client experiences network packet loss, SFU drops video frames first to keep Opus audio crystal clear and jitter-free.', activeNodes: ['sfu_cluster', 'client_viewer'], highlightDetails: 'FEC (Forward Error Correction) recovers lost audio packets without waiting for retransmission.', latencyEstimate: '10ms' }
      ]
    },
    apiDesign: [
      {
        method: 'POST',
        path: '/api/v1/meetings/create',
        description: 'Create a new meeting room',
        requestBody: '{\n  "topic": "Architecture Review",\n  "e2ee": true\n}',
        responseBody: '{\n  "meeting_id": "892-482-1092",\n  "join_url": "https://meet.example.com/892-482-1092",\n  "signaling_endpoint": "wss://signal-us-west.meet.example.com/ws"\n}'
      }
    ],
    databaseDesign: [
      {
        tableName: 'active_meetings',
        type: 'NoSQL Key-Value',
        shardingKey: 'meeting_id',
        fields: [
          { name: 'meeting_id', type: 'VARCHAR(32)', isPrimary: true },
          { name: 'host_id', type: 'UUID' },
          { name: 'sfu_node_ip', type: 'VARCHAR(45)' },
          { name: 'participants_count', type: 'INT' },
          { name: 'created_at', type: 'TIMESTAMP' }
        ],
        notes: 'Redis cluster tracking active meeting state with 10-second heartbeat expiration.'
      }
    ],
    deepDives: [
      {
        title: 'Media Architectures: Mesh vs MCU vs SFU',
        subtitle: 'Why SFU is the undisputed standard for modern video calling',
        content: `1. Peer-to-Peer Mesh:\n- Every client sends audio/video to every other client.\n- Bandwidth for N participants: N-1 uploads per client (O(N^2) network traffic).\n- Max scale: 4-6 people before home uplink saturates.\n\n2. MCU (Multipoint Control Unit):\n- All clients send 1 stream to central server.\n- Server decodes all video, composites them into a single "Brady Bunch" grid video, re-encodes, and sends 1 stream to each client.\n- Pros: Tiny client download bandwidth.\n- Cons: Massive server CPU and GPU cost; adds 100-250ms transcoding latency!\n\n3. SFU (Selective Forwarding Unit - Zoom / Meet Architecture):\n- Clients send Simulcast streams to SFU.\n- SFU acts as an intelligent UDP packet router, forwarding raw packets to participants without decoding.\n- Scales to 1,000+ participants with sub-10ms server processing latency!`,
        keyTakeaways: [
          'SFUs provide the ideal balance of server efficiency and client video quality adaptability.',
          'Simulcast allows sending high/low bitrates simultaneously to match viewer screen sizes.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Cellular Jitter & Random Packet Drops',
        impact: 'Audio clips and robotic voice artifacts occur when UDP packets arrive out of order.',
        mitigation: 'Implement Adaptive Jitter Buffer (holds 20-50ms of audio packets to re-order) + Opus Codec In-Band FEC (Forward Error Correction).'
      }
    ],
    interviewQA: [
      {
        question: 'Why is TCP not used for real-time video conferencing media packets?',
        hint: 'Head-of-line blocking in TCP.',
        goodAnswer: 'TCP guarantees delivery by retransmitting lost packets. In real-time video, an audio packet from 400ms ago is completely useless. Waiting for TCP retransmission stalls the entire buffer (Head-of-Line blocking), destroying real-time conversation. UDP allows dropping late packets and continuing immediately.',
        pitfalls: 'Suggesting HTTP/2 or WebSockets for raw video stream transport.'
      }
    ],
    similarSystems: ['Google Meet', 'Microsoft Teams', 'FaceTime', 'Cisco Webex'],
    tags: ['WebRTC', 'SFU', 'UDP / RTP', 'Simulcast', 'Opus Codec']
  }
];
