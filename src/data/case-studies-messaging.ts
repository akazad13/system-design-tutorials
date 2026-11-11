import { CaseStudy } from '../types/system-design';

export const MESSAGING_CASE_STUDIES: CaseStudy[] = [
  {
    id: 'whatsapp-chat',
    title: 'Design WhatsApp / WeChat (Global Messaging Service)',
    slug: 'whatsapp-messaging',
    tagline: 'Deliver 1:1 and group messages in real time to hundreds of millions of connected phones, track delivery receipts, and hold messages for phones that are offline.',
    category: 'Messaging & Real-time',
    difficulty: 'Advanced',
    readTime: '24 min read',
    scaleSummary: {
      dau: '2 Billion Daily Active Users',
      qps: '1,160,000 Messages / sec avg (Peak 3,000,000 msg/sec)',
      storage: '100 Billion messages / day (Temporary buffer & durable archive)',
      bandwidth: '50 GB/s Real-Time WebSocket Egress'
    },
    overview: 'A messaging service sends 1:1 and group messages, shows delivery receipts (sent, delivered, read), and holds messages for people who are offline. Every online phone keeps one long-lived connection open to a gateway server, so the server can push a message the moment it arrives. Each gateway server holds a very large number of these idle connections, so it needs a runtime built for that job, such as Erlang (which WhatsApp uses), Go or Netty.',
    keyChallenges: [
      'Hold about 500 million long-lived connections at once. Each connection uses memory, so the design must keep per-connection cost small.',
      'Deliver every message reliably. The network can drop a message, so the system delivers at least once and the receiving app removes duplicates. Messages for offline users wait in a queue until the phone reconnects.',
      'Send one message to a large group (up to 1,024 members) without overloading the gateways.',
      'Keep messages end-to-end encrypted (Signal Protocol), which means the server cannot read them. Keys must also work across a user\'s several devices.'
    ],
    functionalRequirements: [
      'Send 1:1 text, voice notes and media in real time.',
      'Support group chats with up to 1,024 participants.',
      'Show message receipts: one tick means the server has it, two grey ticks mean it reached the recipient\'s device, two blue ticks mean it was read.',
      'Store messages for offline users and deliver them when they reconnect.',
      'Show online presence and typing indicators.'
    ],
    nonFunctionalRequirements: [
      'Low delivery latency: a message to an online user should arrive in well under a second on a mobile network.',
      'No lost messages: a message is kept until the recipient\'s device confirms it, even if connections drop.',
      'End-to-end encryption (E2EE): servers carry only ciphertext and never see message content.',
      'Very high availability of the gateway layer (a target of 99.999%).'
    ],
    outOfScope: ['Group voice and video calling (SFU media servers)', 'In-app payments'],
    capacityEstimations: {
      assumptions: [
        '2 billion daily users send 100 billion messages per day. That is about 1.15 million messages/s on average and about 3 million/s at peak.',
        'Concurrent connections: 500 million.',
        'Average message size: 200 bytes of text. A media message carries only a small thumbnail (about 100 KB) and a pointer. The file itself goes to object storage.',
        'Each open WebSocket needs about 10 KB of RAM. 500M × 10 KB = 5 TB of RAM across the gateway fleet, or about 500 servers at 1 million connections each.'
      ],
      metrics: [
        { label: 'Message Ingestion Rate', value: '3,000,000 msg/sec', formula: '100B / 86,400 * 2.5x peak burst', description: 'Peak rate of incoming messages' },
        { label: 'Concurrent Connections', value: '500,000,000', formula: 'Active mobile sockets maintained', description: 'Connections spread across the gateway fleet' },
        { label: 'Temporary Offline Store', value: '20 TB RAM/SSD', formula: 'Undelivered messages buffered for 30 days', description: 'Offline inbox in Cassandra or Redis for undelivered messages' }
      ],
      conclusion: 'The gateways are stateful, because each one holds live sockets. A fast shared session registry (Redis) must record which gateway each user is connected to, so any gateway can find the right one for a recipient.'
    },
    architecture: {
      summary: 'Each phone keeps a TLS WebSocket connection to a chat gateway. When User A sends a message to User B, A\'s gateway looks up B\'s gateway in the Redis session registry. If B is online, A\'s gateway forwards the message to B\'s gateway over internal gRPC, and B\'s gateway pushes it down B\'s socket. If B is offline, the message goes to the offline inbox (Cassandra) and a push notification wakes B\'s phone. Media files go to object storage (S3), and the message carries only an encrypted pointer and thumbnail.',
      nodes: [
        { id: 'client_a', label: 'User A (Sender)', type: 'client', x: 8, y: 30, description: 'Keeps one long-lived WebSocket connection open' },
        { id: 'client_b', label: 'User B (Recipient)', type: 'client', x: 8, y: 70, description: 'Receives pushed messages over its own socket' },
        { id: 'lb', label: 'Layer 4 Load Balancer', type: 'load_balancer', x: 26, y: 50, description: 'Spreads new TCP connections across gateways. It does not read the traffic.', techStack: ['AWS NLB / IPVS'] },
        { id: 'chat_gw_1', label: 'Chat Gateway #1', type: 'gateway', x: 45, y: 30, description: 'Holds the open socket for User A', techStack: ['Erlang / Go / Netty'], scaleMetric: '1M sockets / node' },
        { id: 'chat_gw_2', label: 'Chat Gateway #2', type: 'gateway', x: 45, y: 70, description: 'Holds the open socket for User B', techStack: ['Erlang / Go / Netty'] },
        { id: 'session_store', label: 'Session Registry (Redis)', type: 'cache', x: 68, y: 50, description: 'Maps user_id to the gateway (ip:port) that holds the user\'s socket', techStack: ['Redis Cluster'], scaleMetric: '500M keys in RAM' },
        { id: 'msg_service', label: 'Message & Group Service', type: 'service', x: 68, y: 20, description: 'Expands group messages to each member and removes duplicates', techStack: ['Java / Go'] },
        { id: 'offline_store', label: 'Offline Message Inbox', type: 'database', x: 88, y: 50, description: 'Holds messages for devices that are not connected', techStack: ['Apache Cassandra / RocksDB'] },
        { id: 'push_service', label: 'Push Notification Engine', type: 'worker', x: 88, y: 80, description: 'Sends a push through Apple APNs or Google FCM when the user is offline', techStack: ['APNs / FCM Gateway'] }
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
        { step: 1, title: 'Client opens a WebSocket connection', description: 'The phone opens a secure WSS connection through the Layer 4 load balancer to a chat gateway. The gateway records user_id to gateway_ip in the Redis session registry. The entry expires after 60 seconds unless heartbeats renew it.', activeNodes: ['client_a', 'lb', 'chat_gw_1', 'session_store'], highlightDetails: 'The Layer 4 load balancer forwards the TCP connection without reading it. After that, the phone talks to its gateway directly.', latencyEstimate: '30ms' },
        { step: 2, title: 'Find the recipient and forward', description: 'User A sends an encrypted message for User B. Gateway #1 asks Redis where B is connected and learns it is Gateway #2. Gateway #1 forwards the message to Gateway #2 over internal gRPC.', activeNodes: ['chat_gw_1', 'session_store', 'chat_gw_2'], highlightDetails: 'The hop between gateways stays inside the datacenter, so it adds only a few milliseconds.', latencyEstimate: '2ms' },
        { step: 3, title: 'Deliver to B and return the receipt', description: 'Gateway #2 pushes the message down B\'s WebSocket. B\'s app sends an ACK (acknowledgment). Gateway #2 passes the ACK back to Gateway #1, and User A sees two grey ticks.', activeNodes: ['chat_gw_2', 'client_b', 'chat_gw_1', 'client_a'], highlightDetails: 'If an ACK is lost, the sender retries. That gives at-least-once delivery, and the receiving app drops duplicates by message ID.', latencyEstimate: '45ms' },
        { step: 4, title: 'Store the message if the recipient is offline', description: 'If B has no active session, the gateway saves the message in the Cassandra offline inbox with a 30-day TTL (time to live) and asks the push engine to send an Apple APNs or Google FCM notification.', activeNodes: ['chat_gw_1', 'offline_store', 'push_service'], highlightDetails: 'When B reconnects, the app pulls its waiting messages in order. The server deletes each one after the device confirms it.', latencyEstimate: '15ms' }
      ]
    },
    apiDesign: [
      {
        method: 'WS',
        path: '/ws/v1/chat',
        description: 'One long-lived two-way WebSocket channel. The client sends messages and ACKs here, and the server pushes messages back.',
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
        notes: 'Cassandra table for messages not yet delivered. One partition per recipient, ordered by message_id, so a reconnecting phone reads its whole inbox in one query. Rows are deleted after delivery.'
      }
    ],
    deepDives: [
      {
        title: 'Group chat fanout: client fanout vs server fanout',
        subtitle: 'How groups of up to 1,024 members stay cheap for the sender',
        content: `Fanout means turning one message into one copy per recipient. Take a group of 500 members.\n\n1. Client fanout: the sender's phone encrypts and uploads 500 separate copies. This drains the sender's battery and mobile data.\n2. Server fanout with Sender Keys (the approach WhatsApp uses for groups):\n   - Each member first shares a Sender Key (a symmetric key for that member's messages in the group) with every other member, through the existing encrypted 1:1 sessions.\n   - To send, the phone encrypts the message once with its Sender Key and uploads one packet to its gateway.\n   - The Message Service reads the group's member list, finds each member's gateway through the session registry, and sends one internal copy per member. The internal network inside the datacenter is far faster and cheaper than a phone's cellular link.\n   - Each recipient decrypts with the sender's Sender Key that they stored earlier.\n\nThe cost is key management. When a member leaves, the remaining members must create new Sender Keys, or the departed member could keep decrypting new messages.`,
        keyTakeaways: [
          'Server fanout means the sender uploads once, whatever the group size.',
          'Sender Keys keep groups end-to-end encrypted without encrypting separately for every member.',
          'Sender Keys must be rotated when membership changes.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'A gateway crashes and every client reconnects at once (thundering herd)',
        impact: 'If a gateway holding 1 million connections restarts, 1 million phones try to reconnect at the same moment. That can overload the load balancers and the authentication service.',
        mitigation: 'Make clients wait a random time before reconnecting, and make the wait grow after each failure (exponential backoff with full jitter, for example a random 1 to 30 seconds). This spreads the reconnects over time.'
      }
    ],
    interviewQA: [
      {
        question: 'How do you prevent duplicate messages if a mobile client disconnects before receiving the server ACK?',
        hint: 'The client will resend after it reconnects, so the server must recognize a repeat.',
        goodAnswer: 'The client creates a unique ID (a UUID) for each message before it sends it. On a retry, the client sends the same ID. The server keeps recently seen IDs per conversation (for example in a cache with a TTL). If the ID is already there, the server skips the second write and sends the ACK again. Delivery is therefore at-least-once on the wire, but the user sees each message once.',
        pitfalls: 'Using IDs that the server generates (such as auto-increment) for deduplication. The server cannot tell a retry from a new message, because the retry has no server ID yet.'
      }
    ],
    similarSystems: ['Signal', 'Telegram', 'WeChat', 'LINE'],
    tags: ['WebSockets', 'Erlang', 'Cassandra', 'E2EE', 'Redis Session Store']
  },
  {
    id: 'discord-slack-chat',
    title: 'Design Discord / Slack (Scalable Channels & Voice Gateways)',
    slug: 'discord-slack-architecture',
    tagline: 'Real-time channels for servers with hundreds of thousands of members: send messages, show who is online without flooding the network, and run voice channels.',
    category: 'Messaging & Real-time',
    difficulty: 'Advanced',
    readTime: '22 min read',
    scaleSummary: {
      dau: '200 Million Daily Active Users',
      qps: '850,000 Channel Messages/sec / 5 Million Presence Events/sec',
      storage: '2 Trillion historical messages in ScyllaDB',
      bandwidth: '120 GB/s Real-time WebSocket Egress'
    },
    overview: 'Discord and Slack group people into servers (Discord calls them guilds, Slack calls them workspaces). A server can have hundreds of thousands of members, text and voice channels, permission roles, saved message history, and live presence (online, idle, do not disturb). The hard part is fanout: one event, such as a message or a user coming online, may need to reach many connected clients.',
    keyChallenges: [
      'Presence storms: in a 500,000-member server, one user going online could trigger 500,000 presence updates if every member were notified.',
      'Storing messages at a very high write rate while keeping them in order within each channel.',
      'Running stateful gateway clusters (Elixir on the Erlang VM, or Rust) that hold about 40 million concurrent connections.',
      'Voice channels: WebRTC selective forwarding units (SFUs, servers that relay each speaker\'s audio to listeners) must keep audio delay low enough for natural conversation.'
    ],
    functionalRequirements: [
      'Create servers (workspaces), text and voice channels, and roles.',
      'Send text, mentions (@here, @channel) and attachments in channels.',
      'Show real-time presence: online, away, do not disturb, offline, and game activity.',
      'Let users scroll back through the full history of a channel.',
      'Provide real-time voice channels.'
    ],
    nonFunctionalRequirements: [
      'Fast delivery: a new channel message should reach online members within tens of milliseconds at P99 (the slowest 1% of messages).',
      'Durable history: once a message is acknowledged, it is stored and not lost.',
      'Low voice delay: low enough for natural conversation (a common target is about 150 ms one way or less).',
      'High availability (a target of 99.99%).'
    ],
    outOfScope: ['4K 120 fps screen-share transcoding', 'Enterprise audit-log and compliance integrations'],
    capacityEstimations: {
      assumptions: [
        '200M daily users, with 40M connected over WebSockets at peak.',
        '850,000 messages/s at peak across all channels worldwide.',
        'Presence updates: 5,000,000 state changes/s.',
        'ScyllaDB holds 2 trillion messages, about 500 TB of partitioned data.'
      ],
      metrics: [
        { label: 'Concurrent Sockets', value: '40,000,000', formula: 'Active mobile & desktop gateway sessions', description: 'Connections held by the Elixir/Rust gateway cluster' },
        { label: 'Message Write QPS', value: '850,000 / sec', formula: 'Peak channel message ingestion', description: 'Write rate the ScyllaDB cluster must absorb' },
        { label: 'Presence Fanout Ops', value: '5,000,000 / sec', formula: 'User status changes distributed to active viewers', description: 'Presence updates the gateways deliver to clients that are viewing those users' }
      ],
      conclusion: 'Send presence only for members a client is actually showing, and batch the updates. Broadcasting every change to all 500,000 members of a server would cost far too much.'
    },
    architecture: {
      summary: 'Clients connect to a Rust or Elixir gateway over WebSocket. The gateway passes a new message to the Guild Service, which checks permissions and writes the message to ScyllaDB. The Guild Service then publishes a channel event on a message bus (RabbitMQ or Kafka), and the gateways that hold connections for channel members push it to their clients. The Presence Service batches status changes and sends them only to clients that currently show those users in the member list.',
      nodes: [
        { id: 'client', label: 'Discord Desktop/Mobile App', type: 'client', x: 8, y: 50, description: 'Keeps one persistent gateway connection' },
        { id: 'gateway_cluster', label: 'Discord Gateway (Elixir / Rust)', type: 'gateway', x: 30, y: 50, description: 'Holds the 40M WebSocket connections and pushes events to them', techStack: ['Rust / Elixir BEAM'], scaleMetric: '40M Concurrent Sockets' },
        { id: 'guild_srv', label: 'Guild & Channel Service', type: 'service', x: 55, y: 30, description: 'Checks roles, channel permissions and mentions', techStack: ['Python / Rust'] },
        { id: 'presence_srv', label: 'Presence Service', type: 'service', x: 55, y: 70, description: 'Tracks online status and activity, and decides who needs each update', techStack: ['Elixir / Redis Cluster'] },
        { id: 'msg_queue', label: 'Channel Event Bus (RabbitMQ)', type: 'queue', x: 75, y: 30, description: 'Publish/subscribe routing of channel events to gateways', techStack: ['RabbitMQ / Kafka'] },
        { id: 'scylladb', label: 'Message Store (ScyllaDB)', type: 'database', x: 90, y: 30, description: 'Stores chat history, partitioned by channel and time bucket', techStack: ['ScyllaDB (C++ Cassandra rewrite)'] },
        { id: 'voice_sfu', label: 'Voice Routing Cluster (SFU)', type: 'service', x: 55, y: 90, description: 'Relays WebRTC voice streams over UDP', techStack: ['Rust WebRTC SFU'] }
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
        { step: 1, title: 'Send the message and check permissions', description: 'The client sends a MESSAGE_CREATE JSON payload over its WebSocket. The gateway passes it to the Guild Service, which checks that the user has the SEND_MESSAGES permission in that channel.', activeNodes: ['client', 'gateway_cluster', 'guild_srv'], highlightDetails: 'Caching permission data close to the gateway keeps this check fast. The trade-off is that a cached role change can take a moment to apply.', latencyEstimate: '8ms' },
        { step: 2, title: 'Assign a Snowflake ID and write to ScyllaDB', description: 'The message gets a 64-bit Snowflake ID. A Snowflake ID starts with a timestamp, so IDs sort by creation time. The message is written to ScyllaDB, partitioned by channel_id and a time bucket.', activeNodes: ['guild_srv', 'scylladb'], highlightDetails: 'The cluster as a whole absorbs the 850,000 writes/s. Each write goes to one partition, so the load spreads across many nodes.', latencyEstimate: '4ms' },
        { step: 3, title: 'Publish the event and fan out to gateways', description: 'The Guild Service publishes the event to the channel\'s exchange on the message bus. Gateways that hold connections for members of that channel receive it and push it to those clients.', activeNodes: ['guild_srv', 'msg_queue', 'gateway_cluster', 'client'], highlightDetails: 'Only gateways with a subscribed member receive the event. The target is delivery within tens of milliseconds.', latencyEstimate: '20ms' }
      ]
    },
    apiDesign: [
      {
        method: 'POST',
        path: '/api/v9/channels/{channel_id}/messages',
        description: 'Send a message to a text channel. Other members receive it through their gateway connections.',
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
          { name: 'bucket', type: 'INT', isPrimary: true, notes: 'Time bucket (for example 10 days of messages), so no partition grows without limit' },
          { name: 'message_id', type: 'BIGINT', isPrimary: true, notes: 'Snowflake ID' },
          { name: 'author_id', type: 'BIGINT' },
          { name: 'content', type: 'TEXT' },
          { name: 'attachments', type: 'JSON' }
        ],
        notes: 'One partition holds one channel for one time bucket. Messages sort newest first, so loading recent history reads one partition. Bucketing limits partition size, but a very busy channel can still produce a large bucket, so the bucket length must match the busiest channels.'
      }
    ],
    deepDives: [
      {
        title: 'Solving the presence storm: member list subscriptions',
        subtitle: 'Why telling 500,000 members about every status change overloads the network',
        content: `Take a server with 500,000 members. If 100 users change status every second and each change goes to every member, the server sends 100 × 500,000 = 50 million WebSocket messages per second. That is far too much.\n\nThe fix is lazy loading (subscribe only to what is on screen):\n1. A client shows only about 30 to 50 members in the visible part of the member list.\n2. As the user scrolls, the client tells the gateway which range it is looking at, for example GUILD_SUBSCRIPTIONS { ranges: [[0, 99]] }.\n3. The gateway sends presence updates only for users inside that range.\n4. When the user minimizes the app or switches channels, the subscription pauses.\n5. Each status change now reaches only the few clients whose visible range contains that user, not all 500,000 members.\n\nThe cost is complexity: the server tracks one range per client, and the client may show slightly stale presence for members it is not looking at.`,
        keyTakeaways: [
          'Subscribing only to what is visible removes the broadcast amplification in very large groups.',
          'Presence is short-lived state. The gateways keep it in memory and do not write every status change to disk.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Partitions grow too large in busy channels',
        impact: 'A channel with 10 million messages can reach several GB in one partition. Large partitions make compaction (background merging of data files) and reads slow.',
        mitigation: 'Split each channel into time buckets, for example bucket = (message_id >> 22) / (1000 × 60 × 60 × 24 × 10). The Snowflake ID shifted right by 22 bits is a millisecond timestamp, so this gives 10-day buckets. A bucket limits partition size by time, not by message count, so pick the bucket length from the busiest channels\' message rates, or use shorter buckets for very active channels.'
      }
    ],
    interviewQA: [
      {
        question: 'Why did Discord migrate from MongoDB to Cassandra and then to ScyllaDB and Rust?',
        hint: 'Think about data that no longer fits in memory, garbage collection pauses, compaction, and hot partitions.',
        goodAnswer: 'Discord first stored messages in MongoDB. As the data grew past what memory could hold, latency became unpredictable, so it moved to Cassandra, which scales out well. At larger scale, Cassandra ran on the JVM (Java Virtual Machine), and garbage collection pauses and compaction caused latency spikes at P99, along with problems from hot partitions (a few partitions getting most of the traffic). Discord then moved to ScyllaDB, a Cassandra-compatible database written in C++ with a shared-nothing design and no garbage collector. It also put a Rust data service in front, which merges identical concurrent reads into one query, so hot partitions are hit less often.',
        pitfalls: 'Saying the move was only about cost, or only about raw throughput. The main reasons were tail latency and operational pain at scale.'
      }
    ],
    similarSystems: ['Slack', 'Microsoft Teams', 'Guilded', 'Mattermost'],
    tags: ['WebSockets', 'ScyllaDB', 'Rust', 'Presence System', 'RabbitMQ']
  },
  {
    id: 'google-docs-collaboration',
    title: 'Design Google Docs (Real-Time Collaborative Editor)',
    slug: 'google-docs-collab',
    tagline: 'Let many people edit one document at the same time and make sure everyone ends up with exactly the same text, using Operational Transformation (OT) or CRDTs.',
    category: 'Messaging & Real-time',
    difficulty: 'Advanced',
    readTime: '25 min read',
    scaleSummary: {
      dau: '100 Million Daily Active Users',
      qps: '150,000 Character Edits/sec / 500,000 Active Collab Sessions',
      storage: '1.3 TB / day document revision history',
      bandwidth: '45 MB/s WebSocket Sync Egress'
    },
    overview: 'A collaborative editor lets several people edit the same document at once and see each other\'s changes and cursors within a fraction of a second. Edits made offline merge in when the user reconnects, and users can browse and restore earlier versions. The core problem is that two people can edit the same spot at the same moment, and everyone must still end up with the same document.',
    keyChallenges: [
      'Concurrent edits conflict. For example, User A inserts "X" at position 5 while User B deletes the character at position 4 at the same time. Each edit changes what the other one means.',
      'Choosing between Operational Transformation (OT, which rewrites each edit to fit the edits that happened before it) and Conflict-free Replicated Data Types (CRDTs, data structures built so that edits merge in any order).',
      'Showing each keystroke instantly on the typist\'s screen (optimistic local rendering) while still getting it to other users quickly, with a target under 50 ms.',
      'Storing the edit history and periodic snapshots so documents open fast and old versions can be restored.'
    ],
    functionalRequirements: [
      'Real-time collaborative rich-text editing for several users.',
      'Show other users\' cursors and selections live.',
      'An undo and redo stack that handles other people\'s edits correctly.',
      'Offline editing that syncs when the user reconnects.',
      'Version history with restore to an earlier point in time.'
    ],
    nonFunctionalRequirements: [
      'Convergence: after all edits are delivered, every client must show exactly the same document.',
      'Low latency: other users should see a keystroke within about 50 ms.',
      'High availability (a target of 99.99%).',
      'Durability: once the system accepts an edit, it must not be lost.'
    ],
    outOfScope: ['Spreadsheet formula recalculation (dependency-graph engine)', 'Automatic language translation'],
    capacityEstimations: {
      assumptions: [
        '100M daily users; 10M documents are edited each day.',
        'An active document has 3 collaborators on average. The busiest documents have about 100 editors at once.',
        'Edits: 150,000 operations/s worldwide.',
        'Clients batch edits every 50 to 100 ms to cut the number of WebSocket packets.',
        'Each operation is about 100 bytes. It is stored once (13B ops/day = 1.3 TB/day before replication) and sent to all 3 collaborators (150,000 × 100 bytes × 3 = 45 MB/s).'
      ],
      metrics: [
        { label: 'Edit Operation QPS', value: '150,000 ops/sec', formula: 'Concurrent character inserts/deletes', description: 'Edits that the OT or CRDT layer must process' },
        { label: 'Active Collab Rooms', value: '500,000 rooms', formula: 'Simultaneously active documents', description: 'Documents with a live coordinator at the same time' }
      ],
      conclusion: 'With OT, one coordinator per active document puts all edits into a single order. That is the simplest way to get everyone to the same result. A coordinator handles only one document, so the load spreads across many servers.'
    },
    architecture: {
      summary: 'Clients connect over WebSocket to a collaboration gateway. The gateway routes each document\'s traffic to that document\'s coordinator, a single server process that owns the document. The coordinator applies Operational Transformation (OT), gives each edit a revision number, and sends the result to all collaborators. It saves each edit to a delta log (DynamoDB or Cassandra) and writes a snapshot to S3 every so often.',
      nodes: [
        { id: 'client_1', label: 'Collaborator 1 (User A)', type: 'client', x: 8, y: 30, description: 'Shows typed text at once, before the server confirms it' },
        { id: 'client_2', label: 'Collaborator 2 (User B)', type: 'client', x: 8, y: 70, description: 'Edits the same document at the same time' },
        { id: 'gateway', label: 'Collab Gateway (WS)', type: 'gateway', x: 30, y: 50, description: 'Ends WebSocket connections and routes by doc_id', techStack: ['Envoy / Go'] },
        { id: 'doc_coordinator', label: 'Document Session Coordinator', type: 'service', x: 55, y: 50, description: 'Holds the document in memory and puts every edit into one order (OT)', techStack: ['Java / C++ Server'], scaleMetric: '1 Actor per active doc' },
        { id: 'redis_coord', label: 'Doc-to-Coordinator Registry', type: 'cache', x: 55, y: 15, description: 'Records which server owns each doc_id, using a lease so only one server owns it at a time', techStack: ['Redis / etcd'] },
        { id: 'delta_db', label: 'Revision Delta Store', type: 'database', x: 82, y: 35, description: 'Append-only log of every edit, in revision order', techStack: ['DynamoDB / Cassandra'] },
        { id: 'snapshot_s3', label: 'Document Snapshots (S3)', type: 'storage', x: 82, y: 70, description: 'Compressed full copy of the document every 100 revisions', techStack: ['AWS S3'] }
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
        { step: 1, title: 'Apply the edit locally at once', description: 'User A types "H". The client shows it immediately and keeps the edit in a buffer of operations the server has not yet acknowledged.', activeNodes: ['client_1'], highlightDetails: 'The typist never waits for the network, so typing feels instant even on a slow connection.', latencyEstimate: '0ms' },
        { step: 2, title: 'Send the edit to the document coordinator', description: 'The client sends Op(Insert "H", pos 5, rev 10) over WebSocket. The gateway looks up the document\'s coordinator and forwards the edit to it.', activeNodes: ['client_1', 'gateway', 'doc_coordinator'], highlightDetails: 'The registry names one owner per document, so all editors of doc 42 reach the same server. A lease ensures that two servers never own one document at once.', latencyEstimate: '20ms' },
        { step: 3, title: 'Transform the edit on the server (OT)', description: 'The coordinator checks which edits were committed after rev 10. Suppose User B\'s edit became rev 11. The coordinator rewrites User A\'s edit so it still means the same thing after B\'s edit, gives it rev 12, and commits it.', activeNodes: ['doc_coordinator'], highlightDetails: 'Because the server decides one order, all clients converge, as long as the transform rules are correct. Those rules are the hard part of OT.', latencyEstimate: '1ms' },
        { step: 4, title: 'Broadcast and reconcile on the clients', description: 'The coordinator sends the transformed edit to the other collaborators and an acknowledgment to the author. Each client applies it and adjusts any edits it has not yet had acknowledged, so its text matches the server.', activeNodes: ['doc_coordinator', 'gateway', 'client_2', 'client_1'], highlightDetails: 'Once all edits are delivered, every client holds the same text.', latencyEstimate: '25ms' }
      ]
    },
    apiDesign: [
      {
        method: 'WS',
        path: '/ws/collab/v1/{doc_id}',
        description: 'Two-way WebSocket channel for sending and receiving OT edits on one document',
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
        notes: 'Append-only log with one row per committed edit (clients batch keystrokes, so a row may hold several). Rows are never changed. Replaying them in revision order rebuilds the document.'
      }
    ],
    deepDives: [
      {
        title: 'Operational Transformation (OT) vs Conflict-free Replicated Data Types (CRDTs)',
        subtitle: 'Two ways to make concurrent edits converge',
        content: `1. Operational Transformation (OT, used by Google Docs):\n- An edit is an operation such as insert or delete at an index. When two operations happen at the same time, each is rewritten to fit the other: T(OpA, OpB) gives (OpA', OpB').\n- Pros: the client holds plain text, and operations are small JSON messages.\n- Cons: it needs a central server to put revisions in one order. The transform rules are also easy to get wrong, especially for rich text and for designs without a central server.\n\n2. CRDTs (used by libraries such as Yjs and Automerge, and in Apple Notes):\n- Each character or element gets a unique ID, and the structure is designed so that applying the same edits in any order gives the same result. Different CRDTs build these IDs in different ways (for example logical clocks and links to neighboring elements).\n- Pros: no central server is needed. Peers can merge edits directly, and offline edits merge cleanly.\n- Cons: each element carries metadata, so memory use is higher than for plain text. Modern libraries reduce this with compression, but it never goes away.\n\nFigma is often listed with CRDTs, but it uses a central server as the authority and takes only some ideas from CRDTs.`,
        keyTakeaways: [
          'OT fits client-server products with a central server, small messages and plain-text clients.',
          'CRDTs fit peer-to-peer, local-first and offline-heavy products.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Slow loading of old documents with 50,000 revisions',
        impact: 'Replaying 50,000 edits from revision 0 can take seconds when someone opens the document.',
        mitigation: 'Take snapshots. Every 100 revisions, write a full copy of the document to S3. To open the document, load the latest snapshot (for example at rev 49,900) and replay only the edits after it.'
      }
    ],
    interviewQA: [
      {
        question: 'How do you handle a Document Coordinator server crashing mid-session?',
        hint: 'Recover the state from storage, and let clients resend what was not acknowledged.',
        goodAnswer: 'The registry (etcd) notices that the coordinator\'s lease has expired and assigns the document to another server. The new server loads the latest snapshot from S3 and replays the committed edits from the delta log. Clients reconnect, and each one resends any edits the server never acknowledged. For this to be safe, the coordinator must write an edit to the delta log before it acknowledges the edit. Then an acknowledged edit survives a crash, and an unacknowledged edit is still held by its client.',
        pitfalls: 'Keeping the document only in server memory with no durable log. Another mistake is acknowledging an edit before it is stored, which can lose it.'
      }
    ],
    similarSystems: ['Figma Multiplayer', 'Notion Collab', 'Miro Canvas', 'Overleaf'],
    tags: ['Operational Transformation', 'CRDT', 'WebSockets', 'Actor Model', 'DynamoDB']
  },
  {
    id: 'zoom-video-conferencing',
    title: 'Design Zoom / Google Meet (Video Conferencing Platform)',
    slug: 'zoom-video-conferencing',
    tagline: 'Send live audio and video between many people around the world with low delay, using WebRTC and Selective Forwarding Units (SFUs) that adapt to each viewer\'s bandwidth.',
    category: 'Messaging & Real-time',
    difficulty: 'Advanced',
    readTime: '24 min read',
    scaleSummary: {
      dau: '300 Million Meeting Participants / day',
      qps: '20 Million Concurrent Meeting Streams',
      storage: 'Cloud Recordings in S3 (100 PB Archive)',
      bandwidth: '12 Terabits / sec Global Real-Time UDP Egress'
    },
    overview: 'A video conferencing service carries live audio and video for rooms of 2 to 1,000 participants. It also handles speaker switching, screen sharing and cloud recording. People notice delay quickly in a conversation, so the design aims for under about 150 ms of one-way audio delay.',
    keyChallenges: [
      'Keep delay low. When one-way audio delay passes roughly 150 to 200 ms, people start talking over each other.',
      'Choose how media flows: peer-to-peer mesh, a Multipoint Control Unit (MCU, which mixes everyone into one video), or a Selective Forwarding Unit (SFU, which forwards streams without mixing them).',
      'Cope with packet loss and jitter (uneven packet arrival times), which are common on cellular and Wi-Fi. The tools are Forward Error Correction (FEC, extra data that lets the receiver rebuild lost packets) and NACK (the receiver asks the sender to resend a lost packet).',
      'Send each video in several qualities at once (simulcast) or in layers (Scalable Video Coding, SVC), so each viewer gets a stream that fits their bandwidth.'
    ],
    functionalRequirements: [
      'Create and join a room with a short meeting ID or a link.',
      'Real-time audio, HD video and screen sharing for rooms of up to 1,000 participants. Only a few videos are shown at full size at once.',
      'Detect the active speaker and highlight them.',
      'In-meeting text chat and reactions.',
      'Cloud recording that produces an MP4 file.'
    ],
    nonFunctionalRequirements: [
      'Low delay: a one-way mouth-to-ear delay of about 150 ms or less.',
      'Clear audio under heavy packet loss (about 10%), by protecting audio before video.',
      'Scalable: start and stop SFU servers as needed across many cloud regions.',
      'Optional end-to-end encryption for private rooms. This mode limits server features such as cloud recording.'
    ],
    outOfScope: ['Phone dial-in (PSTN) and PBX hardware integration'],
    capacityEstimations: {
      assumptions: [
        '300M daily meeting participants. At peak, 20 million streams are active at the same time.',
        'Average video stream: 720p at 1.2 Mbps. Audio: Opus codec at 40 kbps.',
        'SFU bandwidth: in a 50-person room with 1 speaker and 49 viewers, the SFU receives 1 stream and sends a copy to 49 clients. That is about 59 Mbps of egress for the room (49 × 1.2 Mbps).'
      ],
      metrics: [
        { label: 'Global Media Egress', value: '12 Tbps', formula: '20M streams * average 600 kbps (Simulcast adjusted)', description: 'Total media traffic sent by SFUs. The 600 kbps average is below 1.2 Mbps because many viewers receive a lower-quality layer.' },
        { label: 'SFU Server Fleet', value: '600 Nodes', formula: '12 Tbps / 20 Gbps per dedicated bare-metal media server', description: 'Media servers needed around the world, with room to add more for peaks' }
      ],
      conclusion: 'Send media over UDP with RTP (the real-time media packet format), not over TCP or HTTP. TCP resends lost packets and holds back everything behind them (head-of-line blocking), which adds delay that live media cannot afford.'
    },
    architecture: {
      summary: 'A client contacts the signaling server over HTTPS and WebSocket to join a meeting. The two sides exchange connection details (SDP and ICE candidates), and the client then sends its audio and video as SRTP (encrypted RTP) over UDP to a nearby SFU. The SFU forwards the right quality level of each stream to every other participant. The SFU does not mix streams. With normal SRTP, the SFU decrypts each packet on arrival and encrypts it again for each receiver. True end-to-end encryption needs the clients to encrypt the media themselves.',
      nodes: [
        { id: 'client_speaker', label: 'Active Speaker Client', type: 'client', x: 8, y: 30, description: 'Publishes 3 video simulcast layers (720p, 360p, 180p)' },
        { id: 'client_viewer', label: 'Meeting Viewers', type: 'client', x: 8, y: 70, description: 'Receives audio and the video streams it chooses to watch' },
        { id: 'signaling_srv', label: 'Signaling Service (WebSocket)', type: 'service', x: 30, y: 50, description: 'Carries the SDP offer/answer and ICE candidates between client and server', techStack: ['Node.js / Go'] },
        { id: 'sfu_cluster', label: 'Media Routing Cluster (SFU)', type: 'service', x: 55, y: 50, description: 'Forwards media packets without decoding or re-encoding the video', techStack: ['C++ mediasoup / Pion WebRTC'], scaleMetric: '20 Gbps / server' },
        { id: 'meeting_db', label: 'Meeting Coordinator DB', type: 'database', x: 55, y: 15, description: 'Stores room state, participant list and access control', techStack: ['Redis / DynamoDB'] },
        { id: 'recorder', label: 'Cloud Recording Worker', type: 'worker', x: 80, y: 50, description: 'Decodes the streams and combines them into one MP4 file', techStack: ['FFmpeg + GStreamer'] },
        { id: 's3_records', label: 'Recording Storage (S3)', type: 'storage', x: 95, y: 50, description: 'Stores finished recordings', techStack: ['AWS S3 Standard'] }
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
        { step: 1, title: 'Signaling and the SDP handshake', description: 'The client connects to the signaling server over WebSocket. The two sides exchange Session Description Protocol (SDP) messages, which list codecs and settings, and ICE candidates, which are possible network paths. STUN helps a client learn its public address, and TURN relays media when a direct path is blocked.', activeNodes: ['client_speaker', 'signaling_srv', 'meeting_db'], highlightDetails: 'The service picks an SFU close to the client, usually by network distance, to keep delay low.', latencyEstimate: '40ms' },
        { step: 2, title: 'Publish audio and simulcast video over UDP', description: 'The speaker sends audio with the Opus codec and video in 3 simulcast layers: high (720p, about 1.2 Mbps), medium (360p, about 500 kbps) and low (180p, about 150 kbps). All are sent as SRTP (encrypted RTP) over UDP.', activeNodes: ['client_speaker', 'sfu_cluster'], highlightDetails: 'UDP does not resend late packets, so a lost packet does not stall the packets behind it.', latencyEstimate: '20ms' },
        { step: 3, title: 'The SFU routes streams', description: 'The SFU does not decode or re-encode the video, so it uses little CPU. It reads packet headers and forwards the high layer to viewers who show the speaker large, and the low layer to viewers who show small gallery tiles.', activeNodes: ['sfu_cluster', 'client_viewer'], highlightDetails: 'A server can handle many rooms because forwarding is cheap. The limit is network bandwidth (about 20 Gbps per server in these estimates), not CPU.', latencyEstimate: '5ms' },
        { step: 4, title: 'Protect audio when the network gets bad', description: 'When a viewer has packet loss or low bandwidth, the SFU sends that viewer a lower video layer, or pauses video, so the audio keeps flowing.', activeNodes: ['sfu_cluster', 'client_viewer'], highlightDetails: 'Opus in-band FEC lets the receiver rebuild a lost audio packet from the next one, without waiting for a resend.', latencyEstimate: '10ms' }
      ]
    },
    apiDesign: [
      {
        method: 'POST',
        path: '/api/v1/meetings/create',
        description: 'Create a meeting room and return the join link and the signaling server address',
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
        notes: 'Redis cluster holding the state of live meetings. Each entry expires after 10 seconds unless the SFU renews it with a heartbeat, so ended or crashed meetings disappear on their own.'
      }
    ],
    deepDives: [
      {
        title: 'Media architectures: mesh vs MCU vs SFU',
        subtitle: 'Why most modern video calling uses an SFU',
        content: `1. Peer-to-peer mesh:\n- Every client sends its audio and video directly to every other client.\n- Each client uploads N-1 streams, so total traffic grows as O(N^2).\n- It works only for small calls. A home internet uplink runs out of bandwidth with a handful of people.\n\n2. MCU (Multipoint Control Unit):\n- Each client sends one stream to a central server.\n- The server decodes every video, combines them into one grid picture, re-encodes it and sends one stream to each client.\n- Pros: each client needs little download bandwidth and little processing.\n- Cons: decoding and encoding every call needs a lot of server CPU and GPU, which costs money. It also adds delay, and the layout is fixed by the server.\n\n3. SFU (Selective Forwarding Unit, the approach behind most WebRTC services such as Meet):\n- Each client sends its stream, in several simulcast qualities, to the SFU.\n- The SFU forwards packets to the right participants without decoding them.\n- Server cost is low because the SFU only copies packets. The price is higher download bandwidth for each client, because it receives one stream per visible participant.`,
        keyTakeaways: [
          'An SFU balances server cost against video quality that adapts to each viewer.',
          'Simulcast sends several qualities at once, so the SFU can match each viewer\'s screen size and bandwidth.'
        ]
      }
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: 'Jitter and dropped packets on cellular networks',
        impact: 'Packets arrive late or out of order, so audio cuts out or sounds robotic.',
        mitigation: 'Use an adaptive jitter buffer, which holds audio for a short time (often 20 to 50 ms, adjusted to the network) so packets can be put back in order. Add Opus in-band FEC to rebuild lost packets without a resend.'
      }
    ],
    interviewQA: [
      {
        question: 'Why is TCP not used for real-time video conferencing media packets?',
        hint: 'Think about head-of-line blocking.',
        goodAnswer: 'TCP delivers every byte in order, so after a loss it resends the missing packet and holds back everything behind it (head-of-line blocking). In a live call, a packet that is 400 ms late is useless, and waiting for it delays all later audio and video. UDP lets the receiver skip a late packet and play the next one, and the codec hides the gap. WebRTC adds its own congestion control and loss recovery on top of UDP. Some networks block UDP, so WebRTC can fall back to TCP or TLS through a TURN relay, at the cost of higher delay.',
        pitfalls: 'Suggesting WebSockets or HTTP/2 as the main transport for live media. Both run on TCP and have the same head-of-line blocking problem.'
      }
    ],
    similarSystems: ['Google Meet', 'Microsoft Teams', 'FaceTime', 'Cisco Webex'],
    tags: ['WebRTC', 'SFU', 'UDP / RTP', 'Simulcast', 'Opus Codec']
  }
];
