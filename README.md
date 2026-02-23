# ME-IA Backend

An intelligent chatbot that simulates being Kevin Garzón, a Full-Stack developer, using RAG (Retrieval-Augmented Generation) to answer questions about his professional experience.

## 🚀 Features

- **RAG System**: Combines vector search with LLM for contextual responses
- **Vector Database**: Uses Pinecone to store CV and FAQ embeddings
- **LLM Integration**: Powered by Groq (Llama 3.3 70B) for natural responses
- **Rate Limiting**: Request rate control to prevent abuse
- **TypeScript**: Fully typed code with strict configuration

## 🛠️ Tech Stack

- **Backend**: Node.js + Express + TypeScript
- **Vector DB**: Pinecone
- **LLM**: Groq (Llama 3.3 70B Versatile)
- **Embeddings**: OpenAI text-embedding-3-small
- **Linting**: ESLint with strict TypeScript rules

## 📁 Project Structure

```
src/
├── config/          # Configurations (Groq, Pinecone, Embeddings)
├── controllers/     # Route controllers
├── middleware/      # Rate limiting and other middlewares
├── routes/          # Route definitions
├── services/        # Business logic (RAG, LLM, search)
├── types/           # TypeScript type definitions
├── utils/           # Utilities (processing, embeddings)
└── index.ts         # Entry point

data/
├── RESUME.json      # Kevin's structured CV
├── FAQS.json        # Categorized frequently asked questions
└── embeddings.json  # Pre-calculated embeddings
```

## 🔧 Installation

1. **Clone the repository**
```bash
git clone <repo-url>
cd me-ia-backend
```

2. **Install dependencies**
```bash
yarn install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Configure in `.env`:
```
PORT=3000
GROQ_API_KEY=your_groq_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX=your_index_name
OPENAI_API_KEY=your_openai_api_key
```

4. **Prepare data (optional)**
```bash
yarn run prepare-data
```

## 🚀 Usage

### Development
```bash
yarn dev
```

### Production
```bash
yarn build
yarn start
```

### Linting
```bash
yarn lint
yarn lint:fix
```

## 📡 API Endpoints

### POST `/chat`
Send a message to the chatbot and receive a contextual response.

**Request:**
```json
{
  "message": "How many years of experience do you have?"
}
```

**Response:**
```json
{
  "success": true,
  "results": "I have over 6 years of professional experience in full-stack development...",
  "timestamp": "2025-01-XX"
}
```

## 🧠 How RAG Works

1. **Indexing**: CV and FAQ data is converted to embeddings and stored in Pinecone
2. **Search**: When a question arrives, its embedding is generated and the most similar chunks are searched
3. **Generation**: Relevant chunks are sent as context to the LLM along with the question
4. **Response**: The LLM generates a natural response as if it were Kevin

## 📊 Included Data

- **Complete CV**: Work experience, education, technical skills
- **30+ FAQs**: Categorized by experience, technical, projects, culture, etc.
- **Rich Context**: Specific achievements, technologies, impact metrics

## 🔒 Security

- Configured rate limiting
- Input validation
- Environment variables for credentials
- Strict typing with TypeScript

## 🤝 Contributing

1. Fork the project
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

MIT License - see LICENSE file for details.