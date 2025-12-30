import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { archetypeName, rating, price } = req.body;

  if (!archetypeName || !rating || price === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const githubToken = process.env.GITHUB_TOKEN;
    const owner = 'Ryunix5';
    const repo = 'RyunixFormat';
    const filePath = 'src/data/yugioh-catalog.ts';
    const branch = 'main';

    if (!githubToken) {
      console.warn('GITHUB_TOKEN not configured - skipping file update');
      return res.status(200).json({ success: true, message: 'Database updated (file sync disabled)' });
    }

    // Get current file content and SHA
    const getFileResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!getFileResponse.ok) {
      throw new Error(`GitHub API error: ${getFileResponse.statusText}`);
    }

    const fileData = await getFileResponse.json() as any;
    const currentContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
    const fileSha = fileData.sha;

    // Update the archetype rating/price
    const escapedName = archetypeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(
      `(\\{\\s*name:\\s*"${escapedName}"\\s*,\\s*rating:\\s*)"[^"]*"(\\s*,\\s*price:\\s*)\\d+`,
      'g'
    );

    const updatedContent = currentContent.replace(pattern, `$1"${rating}"$2${price}`);

    if (updatedContent === currentContent) {
      return res.status(200).json({ success: true, message: 'No changes needed' });
    }

    // Commit updated file back to GitHub
    const updateResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Update ${archetypeName} rating to ${rating}`,
          content: Buffer.from(updatedContent).toString('base64'),
          sha: fileSha,
          branch: branch,
        }),
      }
    );

    if (!updateResponse.ok) {
      const error = await updateResponse.json();
      throw new Error(`Failed to update file: ${JSON.stringify(error)}`);
    }

    console.log(`✅ Updated ${archetypeName} in yugioh-catalog.ts via GitHub API`);
    return res.status(200).json({ 
      success: true, 
      message: `Updated ${archetypeName} to ${rating} (${price} coins)` 
    });
  } catch (error) {
    console.error('Catalog update error:', error);
    return res.status(500).json({ 
      error: 'Failed to update catalog',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
