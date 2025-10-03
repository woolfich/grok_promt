import Dexie from 'dexie';

const db = new Dexie('WelderAppDB');

db.version(1).stores({
  welders: '++id, name',
  articles: '++id, welderId, article, quantity, month, date',
  norms: '++id, article',
  articleHistory: '++id, welderId, articleId, article, quantity, action, date',
});

export default db;