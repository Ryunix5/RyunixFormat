import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vite plugin to handle catalog file updates via API endpoint
 */
export function catalogUpdatePlugin() {
  return {
    name: 'catalog-update-api',
    configureServer(server) {
      server.middlewares.use('/api/update-catalog', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const { archetypeName, rating, price } = JSON.parse(body);
            
            // Read catalog file
            const catalogPath = path.join(__dirname, '../../src/data/yugioh-catalog.ts');
            let content = fs.readFileSync(catalogPath, 'utf-8');
            
            // Update the archetype
            const escapedName = archetypeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const pattern = new RegExp(
              `(\\{\\s*name:\\s*"${escapedName}"\\s*,\\s*rating:\\s*)"[^"]*"(\\s*,\\s*price:\\s*)\\d+`,
              'g'
            );
            
            const updated = content.replace(pattern, `$1"${rating}"$2${price}`);
            
            if (updated !== content) {
              fs.writeFileSync(catalogPath, updated, 'utf-8');
              console.log(`✅ Updated ${archetypeName}: rating=${rating}, price=${price}`);
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, message: 'Catalog updated' }));
            } else {
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, message: 'No changes needed' }));
            }
          } catch (e) {
            console.error('Failed to update catalog:', e);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      });
    }
  };
}
