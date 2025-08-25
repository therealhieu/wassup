# Task Completion Procedures

## Pre-Completion Quality Checks

### 1. Code Quality Validation
```bash
bun run lint         # ESLint validation
```
**Requirements**: All linting errors must be resolved before task completion.

### 2. Type Safety Verification
```bash
bunx tsc --noEmit    # TypeScript compilation check
```
**Requirements**: No TypeScript errors allowed.

### 3. Test Execution
```bash
bun test             # Run Vitest unit tests
```
**Requirements**: All existing tests must pass, new functionality should have tests.

### 4. Component Story Validation
```bash
bun run storybook    # Start Storybook server
```
**Requirements**: New components must have stories, existing stories should work.

### 5. Build Verification
```bash
bun run build        # Production build test
```
**Requirements**: Application must build successfully for production.

## Task Completion Workflow

### Standard Completion Process
1. **Code Implementation** - Complete the requested feature/fix
2. **Quality Gates** - Run all pre-completion checks above
3. **Manual Testing** - Test functionality in development mode (`bun run dev`)
4. **Documentation** - Update relevant documentation if needed
5. **Component Stories** - Add/update Storybook stories for new components
6. **Configuration Updates** - Update schemas and configuration if applicable

### Feature Addition Workflow (for new widgets)
1. **Domain Layer** - Create entities and repository interfaces
2. **Infrastructure Layer** - Implement config schemas and repositories  
3. **Presentation Layer** - Create components with stories and skeletons
4. **Service Layer** - Implement server actions
5. **Configuration Integration** - Add to master config schema
6. **Testing** - Add repository and service tests
7. **Quality Validation** - Complete standard completion process

### Bug Fix Workflow
1. **Root Cause Analysis** - Identify the source of the issue
2. **Fix Implementation** - Address the underlying problem
3. **Regression Testing** - Ensure fix doesn't break existing functionality
4. **Test Addition** - Add tests to prevent regression
5. **Quality Validation** - Complete standard completion process

## Required Commands After Task Completion
```bash
# Essential validation commands (run in order):
bun run lint         # Code quality
bun test             # Unit tests  
bun run build        # Production build

# Optional but recommended:
bun run storybook    # Component validation
bun run dev          # Manual testing
```

## Configuration Schema Updates
When adding new widgets or modifying existing ones:
1. Update feature-specific schema in `src/features/{widget}/infrastructure/config.schemas.ts`
2. Export schema in master config `src/infrastructure/config.schemas.ts`
3. Update default configuration in `src/lib/constants.ts`
4. Validate configuration changes with `bun run watch-config`

## Error Resolution Priority
1. **Type Errors** - TypeScript compilation issues (highest priority)
2. **Lint Errors** - ESLint rule violations
3. **Test Failures** - Broken unit tests
4. **Build Failures** - Production build issues
5. **Runtime Errors** - Application errors during development

## Documentation Requirements
- **New Features**: Update CLAUDE.md if architectural changes are made
- **API Changes**: Update relevant component stories
- **Configuration Changes**: Document in configuration schemas
- **Breaking Changes**: Note in commit messages and documentation

## Success Criteria
A task is considered complete when:
- ✅ All quality checks pass
- ✅ Functionality works as intended
- ✅ No regressions introduced
- ✅ Appropriate tests added/updated
- ✅ Documentation updated if needed
- ✅ Production build succeeds

## Bun-Specific Advantages
- ⚡ **Faster execution** - All commands run significantly faster with Bun
- 🧠 **Better caching** - Bun's smart caching reduces redundant operations
- 🔧 **Integrated tooling** - Less context switching between different tools
- 📦 **Consistent package management** - Single tool for all development needs