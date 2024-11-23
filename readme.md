# AIC (AI Commit)

AIC is a powerful CLI tool that leverages AI to help you create meaningful git commit messages and understand code changes. It supports multiple AI providers and offers a seamless git workflow integration.

## Features

- 🤖 Multiple AI Provider Support: OpenAI, Claude, Groq, Phind, and Ollama integration
- 📝 Conventional Commit Message Generation
- 🔍 Code Change Analysis and Explanation
- 🎯 Interactive Commit History Browser
- 💡 Intelligent Context-Based Suggestions 
- 🚀 High-Performance Local Processing via Ollama
- ✨ Automatic Change Categorization and Batch Commits
- 📋 Automatic Clipboard Support

## Installation

```bash
# Using npm
npm install -g @eudalabs/aic

# Using yarn
yarn global add @eudalabs/aic

# Using pnpm
pnpm add -g @eudalabs/aic
```

## Usage

### Generate Commit Message

```bash
# Generate message for staged changes
aic draft

# Add context for better understanding
aic draft --context "Fixing the login timeout issue"
```

### Explain Changes

```bash
# Explain current changes
aic explain --diff

# Explain staged changes
aic explain --diff --staged

# Explain a specific commit
aic explain abc123f

# Ask specific questions about changes
aic explain --diff --query "What files were modified?"
```

### Batch Commit Changes

```bash
# Automatically categorize and commit changes
aic batch

# With specific provider
aic --provider ollama --model qwen2.5-coder:7b batch
```

### Browse and Explain Commits

```bash
# Interactive commit browser (requires fzf)
aic list
```

## Configuration

### Environment Variables

```bash
# Set default provider
export AIC_AI_PROVIDER=openai

# Set API key
export AIC_API_KEY=your_api_key

# Set specific model
export AIC_MODEL=gpt-4
```

### Command Line Options

```bash
# Use specific provider
aic --provider openai draft

# Use specific model
aic --model gpt-4 explain --diff

# Provide API key directly
aic --api-key your_key explain --diff

# Enable debug mode
aic --debug batch
```

## Supported Providers

| Provider | Authentication | Default Model | Local/Cloud |
|----------|---------------|---------------|-------------|
| OpenAI   | API Key       | gpt-4-turbo   | Cloud       |
| Claude   | API Key       | claude-3-sonnet| Cloud       |
| Groq     | API Key       | mixtral-8x7b  | Cloud       |
| Phind    | None          | Phind-70B     | Cloud       |
| Ollama   | None          | (Required)    | Local       |

## Requirements

- Node.js >= 18.0.0
- Git
- fzf (required for `list` command)
  - Windows: Install via Chocolatey (`choco install fzf`)
  - macOS: Install via Homebrew (`brew install fzf`)
  - Linux: Use your package manager (`apt install fzf` or equivalent)
- Ollama (optional, for local AI processing)

## Features in Detail

### Batch Commit
The `batch` command automatically:
- Analyzes all changes in your repository
- Groups related files together
- Generates appropriate commit messages for each group
- Creates separate commits with proper conventional commit format
- Handles complex changes intelligently

### Smart Categorization
Files are automatically grouped by:
- API endpoints
- Core services
- AI providers
- Type definitions
- Configuration files
- Documentation
- And more...

## Technical Stack

- TypeScript
- Commander.js (CLI framework)
- nanospinner (Elegant terminal spinners)
- Various AI Provider APIs

## Error Handling

AIC provides detailed error messages and hints:
- Missing dependencies
- Git repository issues
- API authentication problems
- Network connectivity issues
- Invalid commit hashes
- GPG signing issues
- Provider-specific errors

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

## Acknowledgments

- Built with TypeScript and modern Node.js features
- Uses various AI models for intelligent suggestions
- Inspired by conventional commit standards
