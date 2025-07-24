

# Clone the repository
git clone https://github.com/your-org/okr-agent-platform.git
cd okr-agent-platform

# Install dependencies
npm install      # or yarn install

Configuration
Duplicate the example environment file:
cp .env.example .env.local
Open .env.local and define:
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
VECTOR_DB_URL=https://your-vector-db.endpoint
VECTOR_DB_API_KEY=your_vector_db_api_key

Development

# Start the Next.js development server
npm run dev      # or yarn dev

Open http://localhost:3000 in your browser to explore the app.

Production Build & Start

# Build the application
npm run build    # or yarn build

# Start in production mode
npm start        # or yarn start

Deployment
This project is optimized for deployment on Vercel:
Push your changes to GitHub.
Import the repository into Vercel.
Set environment variables in Vercel’s dashboard (OPENAI_API_KEY, VECTOR_DB_URL, etc.).
Alternatively, you can deploy to any Node.js‑compatible hosting provider.
Contributing
We welcome contributions! Please review CONTRIBUTING.md for guidelines on issues, features, and pull requests.

