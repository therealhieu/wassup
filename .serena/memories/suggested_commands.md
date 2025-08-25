# Essential Development Commands

## Core Development Commands

### Development Server
- `bun run dev` - Start development server with Turbopack (Next.js 15)
- `bun run start` - Start production server
- `bun run build` - Build for production with linting
- `bun run build-no-lint` - Build for production without linting (faster builds)

### Testing
- `bun test` - Run unit tests with Vitest
- `bun run storybook` - Start Storybook development server on port 6006
- `bun run build-storybook` - Build Storybook for production

### Code Quality
- `bun run lint` - Run ESLint on codebase

### Configuration Management
- `bun run watch-config` - Watch configuration changes

## Package Management (Bun)
- `bun install` - Install dependencies (faster than npm)
- `bun add <package>` - Add new dependency
- `bun add -d <package>` - Add dev dependency
- `bun update` - Update all dependencies
- `bun update <package>` - Update specific package
- `bun outdated` - Check for outdated packages
- `bun pm ls` - List installed packages

## System Commands (Darwin/macOS specific)

### File Operations
- `ls -la` - List files with permissions and hidden files
- `find . -name "*.ts" -type f` - Find TypeScript files
- `grep -r "pattern" src/` - Search for patterns in source code
- `fd pattern` - Fast file finding (if fd is installed)
- `rg pattern` - Fast text search with ripgrep (if installed)

### Git Operations
- `git status` - Check repository status
- `git add .` - Stage all changes
- `git commit -m "message"` - Commit changes
- `git log --oneline` - View commit history
- `git branch` - List branches
- `git checkout -b branch-name` - Create and switch to new branch

### Process Management
- `ps aux | grep node` - Find Node.js processes
- `lsof -ti:3000` - Find process using port 3000
- `kill -9 PID` - Kill process by PID
- `pkill node` - Kill all Node.js processes

### Development Utilities
- `code .` - Open project in VS Code
- `open .` - Open current directory in Finder
- `which bun` - Find Bun binary location
- `bun --version` - Check Bun version
- `node --version` - Check Node.js version

## URL Endpoints (Development)
- `http://localhost:3000` - Main application
- `http://localhost:6006` - Storybook server
- `http://localhost:3000/api/ping` - API health check

## Quick Development Workflow
1. `bun run dev` - Start development server
2. Make changes to code
3. `bun run lint` - Check code quality
4. `bun test` - Run tests
5. `git add . && git commit -m "description"` - Commit changes
6. `bun run build` - Verify production build

## Bun Advantages
- ⚡ **25x faster** installs compared to npm
- 🧠 **Smart caching** with better dependency resolution
- 🔧 **Built-in bundler** reduces toolchain complexity
- 🧪 **Native test runner** with Vitest compatibility
- 📦 **Better workspace support** for monorepos