# AIC (AI Commit)

AIC is a powerful CLI tool that leverages AI to help you create meaningful git commit messages and understand code changes. It supports multiple AI providers and offers a seamless git workflow integration.

## Features

- Multiple AI Provider Support: OpenAI, Claude, Groq, Phind, and Ollama integration
- Conventional Commit Message Generation
- Code Change Analysis and Explanation
- Interactive Commit History Browser
- Intelligent Context-Based Suggestions 
- High-Performance Local Processing via Ollama

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
- mdcat (optional, for better markdown rendering)
- Ollama (optional, for local AI processing)

## Technical Stack

- TypeScript
- Commander.js (CLI framework)
- Ora (Elegant terminal spinners)
- Various AI Provider APIs

## Error Handling

AIC provides detailed error messages and hints:

- Missing dependencies (e.g., fzf, mdcat)
- Git repository issues
- API authentication problems
- Network connectivity issues
- Invalid commit hashes

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
