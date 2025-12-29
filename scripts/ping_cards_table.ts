import { CardCatalogORM } from '../src/sdk/database/orm/orm_cards';

async function ping() {
  const orm = CardCatalogORM.getInstance();
  const res = await orm.ping();
  console.log('cards table ping:', res);
}

if (require.main === module) {
  ping().catch((e) => { console.error('ping error', e); process.exit(1); });
}