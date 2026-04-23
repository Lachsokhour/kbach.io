export default function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Return the API key from environment variables
  // Note: On Vercel, you must set GEMINI_API_KEY in the project settings
  res.status(200).json({
    apiKey: process.env.GEMINI_API_KEY || ''
  });
}
