#!/bin/bash

echo "🎙️ AI Call Assistant - Quick Setup"
echo "===================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo ""
    echo "Creating .env file from template..."
    cat > .env << EOL
# AI API Keys
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Database (if needed)
DATABASE_URL=your_database_url_here

# Clerk Authentication (if needed)
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here
EOL
    echo "✅ .env file created!"
    echo ""
    echo "📝 Please edit .env and add your API keys:"
    echo "   - ELEVENLABS_API_KEY: Get from https://elevenlabs.io/"
    echo "   - GEMINI_API_KEY: Get from https://makersuite.google.com/app/apikey"
    echo ""
else
    echo "✅ .env file found"
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo ""
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed!"
else
    echo "✅ Dependencies already installed"
fi

# Create uploads directory if it doesn't exist
if [ ! -d uploads ]; then
    mkdir uploads
    echo "✅ Created uploads directory"
fi

echo ""
echo "🚀 Setup complete!"
echo ""
echo "To start the development server, run:"
echo "   npm run dev"
echo ""
echo "Then open http://localhost:5173 in your browser"
echo ""
