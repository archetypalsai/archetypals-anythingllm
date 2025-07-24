

# Clone the repository
git clone https://github.com/archetypalsai/archetypals-anythingllm.git
cd okr-agent-platform

# Install dependencies
npm install      # or yarn install

Configuration
Duplicate the example environment file:
cp .env.example .env.local
Open .env.local and define:
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
ANYTHINGLLM_API_KEY= your_anythingllm_api_key
ANYTHINGLLM_BASE_URL=your_anythingllm_base_url

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

