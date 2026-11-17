import { AppDatabase, getDatabase } from './database';

export const SEEDED_PERSONAS = [
  { id: 'u_buyer_aiko', name: 'Aiko Tanaka', role: 'buyer', lang: 'ja', avatar: '/av/aiko.png' },
  { id: 'u_seller_marco', name: 'Marco Rossi', role: 'seller', lang: 'es', avatar: '/av/marco.png' },
  { id: 'u_seller_liwei', name: 'Li Wei', role: 'seller', lang: 'zh', avatar: '/av/liwei.png' },
  { id: 'u_buyer_sofia', name: 'Sofia Morales', role: 'buyer', lang: 'es', avatar: '/av/sofia.png' },
  { id: 'u_agent_priya', name: 'Priya Sharma', role: 'agent', lang: 'en', avatar: '/av/priya.png' },
  { id: 'u_supervisor_dan', name: 'Dan Miller', role: 'supervisor', lang: 'en', avatar: '/av/dan.png' },
  { id: 'u_dg_arbitrator', name: 'DisputeGuard Bot', role: 'bot', lang: 'en', avatar: '/av/bot.png' },
];

export function seedDatabase(appDb?: AppDatabase) {
  const dbInstance = appDb || getDatabase();
  const db = dbInstance.db;

  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  // Insert users
  const insertUser = db.prepare(`
    INSERT OR REPLACE INTO users (id, name, role, lang, avatar)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const p of SEEDED_PERSONAS) {
    insertUser.run(p.id, p.name, p.role, p.lang, p.avatar);
  }

  // Insert orders
  const insertOrder = db.prepare(`
    INSERT OR REPLACE INTO orders (id, title, image, amount_minor, currency, status, delivered_at, buyer_id, seller_id, category)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertOrder.run(
    'ord_1042',
    'Ceramic pour-over set',
    '/img/ord_1042.jpg',
    8400,
    'USD',
    'delivered',
    now - 3 * oneDayMs,
    'u_buyer_aiko',
    'u_seller_marco',
    'home'
  );

  insertOrder.run(
    'ord_1043',
    'Wireless earbuds',
    '/img/ord_1043.jpg',
    12900,
    'USD',
    'delivered',
    now - 2 * oneDayMs,
    'u_buyer_sofia',
    'u_seller_liwei',
    'electronics'
  );

  insertOrder.run(
    'ord_1044',
    'Silk scarf, size M ordered, L sent',
    '/img/ord_1044.jpg',
    5600,
    'USD',
    'delivered',
    now - 1 * oneDayMs,
    'u_buyer_aiko',
    'u_seller_liwei',
    'apparel'
  );

  insertOrder.run(
    'ord_1045',
    'Olive oil gift set, not received',
    '/img/ord_1045.jpg',
    4200,
    'USD',
    'delivered',
    now - 4 * oneDayMs,
    'u_buyer_sofia',
    'u_seller_marco',
    'food'
  );
}

// When run directly from CLI
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  console.log('Seeding DisputeGuard database...');
  seedDatabase();
  console.log('Database seeded successfully.');
}
