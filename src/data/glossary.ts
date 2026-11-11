// Plain-language definitions for the jargon used across fundamentals and case studies.
// The reader UI underlines these terms and shows the definition on hover or keyboard focus.

export interface GlossaryEntry {
  /** Display name of the term. */
  term: string;
  /** Other spellings that point to the same definition. */
  aliases?: string[];
  /** One or two short sentences in plain language. */
  definition: string;
  /** Match only the exact letter case (use for acronyms such as "TTL" so "ttl" in code is ignored). */
  caseSensitive?: boolean;
}

export const GLOSSARY: GlossaryEntry[] = [
  // Load and scale
  { term: 'QPS', definition: 'Queries per second. The number of requests the system receives each second.', caseSensitive: true },
  { term: 'DAU', definition: 'Daily active users. The number of different people who use the product on one day.', caseSensitive: true },
  { term: 'MAU', definition: 'Monthly active users. The number of different people who use the product in one month.', caseSensitive: true },
  { term: 'Latency', definition: 'The time between sending a request and getting the response.' },
  { term: 'P99', aliases: ['p99', 'P95', 'p95', 'P50', 'p50'], definition: 'A percentile latency. P99 = 10 ms means 99 of every 100 requests finish in 10 ms or less.', caseSensitive: true },
  { term: 'TTFB', definition: 'Time to first byte. The time until the first byte of the response reaches the user.', caseSensitive: true },
  { term: 'Throughput', definition: 'How much work the system finishes per unit of time, for example requests or megabytes per second.' },
  { term: 'Bandwidth', definition: 'How much data moves over the network per second.' },
  { term: 'Ingress', definition: 'Network traffic that comes into the system.' },
  { term: 'Egress', definition: 'Network traffic that goes out of the system. Cloud providers usually charge for it.' },
  { term: 'SLA', aliases: ['SLAs'], definition: 'Service level agreement. A promised quality target, for example 99.99% uptime or P99 latency below 100 ms.', caseSensitive: true },
  { term: 'Back-of-the-Envelope', aliases: ['back-of-the-envelope'], definition: 'A quick estimate with round numbers. It shows the order of magnitude, not an exact value.' },
  { term: 'Horizontal Scaling', aliases: ['scale horizontally', 'scale out'], definition: 'Add more machines to share the load, instead of buying one bigger machine (vertical scaling).' },
  { term: 'Single Point of Failure', aliases: ['SPOF'], definition: 'One part that stops the whole system when it fails.' },
  { term: 'Hot Key', aliases: ['hotspot', 'Hotspot', 'hot partition'], definition: 'One key or partition that gets much more traffic than the others and overloads its server.' },
  { term: 'Write Amplification', definition: 'One logical write that causes many physical writes, for example one post copied into millions of timelines.' },
  { term: 'Fanout', aliases: ['Fan-out', 'fan-out', 'Fanout-on-Write', 'Fanout-on-Read'], definition: 'Sending one event to many receivers. Fanout-on-write copies data at write time. Fanout-on-read collects it at read time.' },

  // Networking and edge
  { term: 'DNS', definition: 'Domain Name System. It translates a name such as example.com into an IP address.', caseSensitive: true },
  { term: 'TTL', definition: 'Time to live. How long a cached value (for example a DNS record) stays valid before it must be fetched again.', caseSensitive: true },
  { term: 'CDN', definition: 'Content delivery network. Servers around the world that keep copies of content close to users.', caseSensitive: true },
  { term: 'PoP', aliases: ['PoPs', 'Point of Presence', 'Points of Presence'], definition: 'Point of presence. One CDN location (a group of edge servers) in a city or region.', caseSensitive: true },
  { term: 'Edge', definition: 'Servers close to the user, at the outside border of the network, usually run by a CDN.', caseSensitive: true },
  { term: 'Origin', aliases: ['Origin Server'], definition: 'The main server that holds the real content. The CDN asks it when the edge has no copy.', caseSensitive: true },
  { term: 'Anycast', definition: 'Many servers announce the same IP address. The network sends each user to the nearest one.' },
  { term: 'BGP', definition: 'Border Gateway Protocol. The routing system that tells networks on the internet how to reach each other.', caseSensitive: true },
  { term: 'GeoDNS', definition: 'DNS that returns a different IP address based on where the user is.' },
  { term: 'TLS', definition: 'Transport Layer Security. The encryption behind HTTPS.', caseSensitive: true },
  { term: 'QUIC', aliases: ['HTTP/3'], definition: 'A fast transport protocol over UDP, used by HTTP/3. It sets up connections in fewer round trips than TCP + TLS.', caseSensitive: true },
  { term: 'gRPC', definition: 'A fast remote procedure call framework from Google. Services call each other with typed messages over HTTP/2.', caseSensitive: true },
  { term: 'WebSocket', aliases: ['WebSockets'], definition: 'A connection that stays open so the server and the client can send messages at any time.' },

  // Traffic management
  { term: 'Load Balancer', definition: 'A component that spreads incoming requests over many servers.' },
  { term: 'L4', definition: 'Layer 4 (transport layer). An L4 load balancer routes by IP address and port, without reading the request.', caseSensitive: true },
  { term: 'L7', definition: 'Layer 7 (application layer). An L7 load balancer reads the HTTP request (path, headers) to route it.', caseSensitive: true },
  { term: 'Reverse Proxy', definition: 'A server in front of your services that receives client requests and forwards them.' },
  { term: 'API Gateway', definition: 'One entry point for all API calls. It handles routing, authentication and rate limits.' },
  { term: 'Rate Limiting', aliases: ['Rate Limiter', 'rate limiter'], definition: 'Limiting how many requests one client can send in a time window, to protect the system.' },
  { term: 'Token Bucket', definition: 'A rate limit algorithm. Tokens refill at a fixed speed. Each request uses one token. No token means the request is rejected.' },
  { term: 'Circuit Breaker', definition: 'A guard that stops calls to a failing service for a short time, so failures do not spread.' },
  { term: 'Back-pressure', aliases: ['Backpressure', 'backpressure'], definition: 'A signal from a slow consumer that tells producers to send less data.' },

  // Caching
  { term: 'Cache', definition: 'Fast storage (usually memory) that keeps copies of frequently read data.' },
  { term: 'Cache Hit', aliases: ['cache hit'], definition: 'The requested data is in the cache, so the slow source is not needed.' },
  { term: 'Cache Miss', aliases: ['cache miss'], definition: 'The requested data is not in the cache, so the system must read the slower source.' },
  { term: 'Cache Invalidation', aliases: ['cache invalidation'], definition: 'Removing or updating cached copies when the source data changes.' },
  { term: 'LRU', definition: 'Least recently used. A cache eviction rule that removes the item unused for the longest time.', caseSensitive: true },
  { term: 'Cache-Aside', aliases: ['cache-aside', 'Lazy Loading'], definition: 'The application reads the cache first, and on a miss reads the database and fills the cache.' },
  { term: 'Write-Through', aliases: ['write-through'], definition: 'Every write goes to the cache and the database at the same time.' },
  { term: 'Write-Back', aliases: ['write-back', 'Write-Behind'], definition: 'Writes go to the cache first and reach the database later. Fast, but data can be lost on a crash.' },

  // Data storage
  { term: 'Sharding', aliases: ['Shard', 'shard', 'Partitioning', 'partitioning'], definition: 'Splitting one large dataset over many databases. Each part (shard) holds a subset of the rows.' },
  { term: 'Sharding Key', aliases: ['Shard Key', 'Partition Key', 'partition key', 'sharding key'], definition: 'The field that decides which shard stores a row, for example user_id.' },
  { term: 'Replication', aliases: ['Replica', 'replica', 'Read Replica', 'read replica'], definition: 'Keeping copies of the same data on several servers, for safety and for more read capacity.' },
  { term: 'Consistent Hashing', definition: 'A way to map keys to servers so that adding or removing a server moves only a small share of keys.' },
  { term: 'CAP Theorem', aliases: ['CAP'], definition: 'During a network split, a distributed database must choose: stay consistent or stay available. It cannot do both.', caseSensitive: true },
  { term: 'Eventual Consistency', aliases: ['eventually consistent', 'eventual consistency'], definition: 'Copies of data can differ for a short time but become the same if no new writes arrive.' },
  { term: 'Strong Consistency', aliases: ['strong consistency', 'strongly consistent'], definition: 'Every read returns the latest write, on every copy.' },
  { term: 'Quorum', definition: 'The minimum number of replicas that must agree before a read or write counts as successful.' },
  { term: 'Idempotency', aliases: ['Idempotent', 'idempotent', 'idempotency'], definition: 'Doing the same operation twice has the same result as doing it once. This makes retries safe.' },
  { term: 'Denormalization', aliases: ['denormalized', 'Denormalized'], definition: 'Storing the same data in more than one place so reads need fewer joins.' },
  { term: 'Write-Ahead Log', aliases: ['WAL'], definition: 'A log where every change is written first, so the database can recover after a crash.', caseSensitive: true },
  { term: 'Object Storage', aliases: ['Blob Storage', 'S3'], definition: 'Storage for large files (images, video, backups) addressed by a key, for example Amazon S3.', caseSensitive: true },
  { term: 'Inverted Index', aliases: ['inverted index'], definition: 'A search index that maps each word to the list of documents that contain it.' },
  { term: 'Bloom Filter', aliases: ['bloom filter'], definition: 'A small structure that answers "maybe in the set" or "surely not in the set". It saves lookups.' },
  { term: 'Geohash', aliases: ['geohash', 'Geohashing'], definition: 'A short string that encodes a map area. Nearby places share the same prefix.' },
  { term: 'Snowflake', aliases: ['Snowflake ID'], definition: 'A 64-bit unique ID made of a timestamp, a machine number and a counter. IDs sort by time.', caseSensitive: true },
  { term: 'Base62', definition: 'Writing numbers with 62 characters (a-z, A-Z, 0-9). It makes short, URL-safe keys.', caseSensitive: true },

  // Messaging and coordination
  { term: 'Message Queue', aliases: ['message queue', 'Queue'], definition: 'A buffer where producers put messages and consumers take them later. It decouples services.', caseSensitive: true },
  { term: 'Kafka', definition: 'A distributed log for event streams. Consumers read events in order and can replay them.', caseSensitive: true },
  { term: 'Pub/Sub', definition: 'Publish and subscribe. Publishers send messages to a topic. Every subscriber of that topic gets a copy.' },
  { term: 'Dead Letter Queue', aliases: ['DLQ'], definition: 'A separate queue for messages that failed too many times, so they can be checked later.', caseSensitive: true },
  { term: 'At-Least-Once', aliases: ['at-least-once'], definition: 'Delivery promise: every message arrives, but some can arrive twice.' },
  { term: 'Exactly-Once', aliases: ['exactly-once'], definition: 'Delivery promise: every message takes effect one time only. Usually built from at-least-once plus idempotency.' },
  { term: 'Consensus', definition: 'Agreement between servers on one value or one leader, even if some servers fail.' },
  { term: 'Raft', definition: 'A consensus algorithm. Servers elect a leader and copy its log to the followers.', caseSensitive: true },
  { term: 'Paxos', definition: 'An older consensus algorithm with the same goal as Raft. It is harder to understand and build.', caseSensitive: true },
  { term: 'Vector Search', aliases: ['vector search', 'Embedding', 'embeddings'], definition: 'Search by meaning. Items become number lists (embeddings), and the search finds the closest lists.' },
  { term: 'Transactional Outbox', aliases: ['transactional outbox', 'Outbox', 'outbox'], definition: 'Save the business change and the event to publish in the same database transaction, then publish the event from that table.', caseSensitive: true },
  { term: 'Dual-Write', aliases: ['dual-write', 'dual write'], definition: 'Writing to two systems (for example a database and a queue) separately. If one write fails, the two disagree.' },
  { term: 'Change Data Capture', aliases: ['CDC', 'change data capture'], definition: 'Reading every change from the database log and streaming it to other systems.', caseSensitive: true },
  { term: 'Consumer Group', aliases: ['consumer group'], definition: 'A set of consumers that share the work of reading a topic. Each partition goes to one member of the group.' },
  { term: 'Offset', aliases: ['offsets'], definition: 'A consumer group’s position in a partition of the log: the next event it will read.', caseSensitive: true },
  { term: 'Pre-signed URL', aliases: ['pre-signed URL', 'Pre-Signed URL', 'presigned URL'], definition: 'A URL with a built-in signature that allows one specific upload or download for a short time, with no other credentials.' },
  { term: 'Multipart Upload', aliases: ['multipart upload'], definition: 'Uploading a large file as separate parts that S3 joins at the end. Parts can go in parallel and be retried alone.' },
  { term: 'Erasure Coding', aliases: ['erasure coding'], definition: 'Splitting data into pieces plus extra parity pieces, so the data survives the loss of some pieces with less storage than full copies.' },
  { term: 'Deduplication', aliases: ['deduplication'], definition: 'Storing identical data only once and pointing every copy to it.' },
  { term: 'Split Brain', aliases: ['split brain', 'Split-Brain', 'split-brain'], definition: 'Two parts of a cluster each believe they are in charge, so both accept writes and the data diverges.' },
  { term: 'Lease', aliases: ['lease'], definition: 'A lock that expires unless its holder renews it in time.', caseSensitive: true },
  { term: 'Fencing Token', aliases: ['fencing token', 'Fencing token'], definition: 'A number that grows with every lock grant. Storage rejects writes with an older number, so a holder that lost its lock cannot write.' },
  { term: 'Linearizable', aliases: ['linearizable', 'Linearizability'], definition: 'Strongest consistency: the system behaves as if there were one copy of the data and every operation happened at one instant.' },
  { term: 'BM25', definition: 'A keyword ranking formula. It favors terms that are frequent in the document, rare in the collection, and in documents of normal length.', caseSensitive: true },
  { term: 'HNSW', definition: 'Hierarchical navigable small world: a graph index that finds approximately nearest vectors quickly.', caseSensitive: true },
  { term: 'Posting List', aliases: ['posting list'], definition: 'In an inverted index, the sorted list of documents that contain one term.' },
  { term: 'Stemming', aliases: ['stemming', 'stem'], definition: 'Reducing a word to its root so different forms match, for example "running" and "runs" to "run".' },
  { term: 'Reciprocal Rank Fusion', aliases: ['RRF', 'reciprocal rank fusion'], definition: 'Merging several ranked lists by giving each result 1 / (k + its rank) in every list and adding the scores.', caseSensitive: true },
  { term: 'Jitter', aliases: ['jitter'], definition: 'A random offset added to a delay or TTL so many clients or keys do not act at the same moment.' },
  { term: 'Exponential Backoff', aliases: ['exponential backoff'], definition: 'Waiting longer after each failed retry, for example 100 ms, 200 ms, 400 ms.' },
  { term: 'Bulkhead', aliases: ['bulkhead'], definition: 'Separate thread and connection pools per dependency, so one failing dependency cannot use up all resources.' },
  { term: 'Distributed Tracing', aliases: ['distributed tracing', 'Trace ID', 'trace ID'], definition: 'Following one request across many services with a shared trace ID, and timing each step (span).' },
];

interface CompiledGlossary {
  regex: RegExp;
  byAlias: Map<string, GlossaryEntry>;
}

let compiled: CompiledGlossary | null = null;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
}

function getCompiledGlossary(): CompiledGlossary {
  if (compiled) return compiled;
  const byAlias = new Map<string, GlossaryEntry>();
  const spellings: string[] = [];
  for (const entry of GLOSSARY) {
    for (const spelling of [entry.term, ...(entry.aliases ?? [])]) {
      spellings.push(spelling);
      byAlias.set(spelling.toLowerCase(), entry);
    }
  }
  // Longest spellings first so "Cache Miss" wins over "Cache".
  spellings.sort((a, b) => b.length - a.length);
  const pattern = `(?<![A-Za-z0-9_])(?:${spellings.map(escapeRegex).join('|')})(?:e?s)?(?![A-Za-z0-9_])`;
  compiled = { regex: new RegExp(pattern, 'gi'), byAlias };
  return compiled;
}

export interface GlossaryMatch {
  start: number;
  end: number;
  text: string;
  entry: GlossaryEntry;
}

function resolveMatch(text: string, byAlias: Map<string, GlossaryEntry>): GlossaryEntry | undefined {
  const candidates = [text, text.replace(/es$/i, ''), text.replace(/s$/i, '')];
  for (const candidate of candidates) {
    const entry = byAlias.get(candidate.toLowerCase());
    if (!entry) continue;
    if (!entry.caseSensitive) return entry;
    const spellings = [entry.term, ...(entry.aliases ?? [])];
    if (spellings.includes(candidate)) return entry;
  }
  return undefined;
}

/** Finds glossary terms in a text. Returns each term only once (its first appearance). */
export function findGlossaryMatches(text: string): GlossaryMatch[] {
  const { regex, byAlias } = getCompiledGlossary();
  const matches: GlossaryMatch[] = [];
  const seen = new Set<GlossaryEntry>();
  regex.lastIndex = 0;
  for (const m of text.matchAll(regex)) {
    const entry = resolveMatch(m[0], byAlias);
    if (!entry || seen.has(entry)) continue;
    seen.add(entry);
    matches.push({ start: m.index ?? 0, end: (m.index ?? 0) + m[0].length, text: m[0], entry });
  }
  return matches;
}

/** Lists the distinct glossary entries that appear in a group of texts, in reading order. */
export function collectGlossaryTerms(texts: string[], limit = 12): GlossaryEntry[] {
  const result: GlossaryEntry[] = [];
  const seen = new Set<GlossaryEntry>();
  for (const text of texts) {
    for (const match of findGlossaryMatches(text)) {
      if (seen.has(match.entry)) continue;
      seen.add(match.entry);
      result.push(match.entry);
      if (result.length >= limit) return result;
    }
  }
  return result;
}
