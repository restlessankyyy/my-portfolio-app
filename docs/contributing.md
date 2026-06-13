# Contributing

## Setup

```bash
git clone https://github.com/restlessankyyy/my-portfolio-app.git
cd my-portfolio-app
npm install
npm start  # → http://localhost:3000
```

## Workflow

We use [GitHub Flow](https://guides.github.com/introduction/flow/index.html):

1. Fork the repo and create your branch from `main`
2. Make your changes
3. Run `npm run validate` (lint + format + tests)
4. Open a Pull Request

## Code Quality

```bash
npm run validate   # lint + format check + tests
```

| Command | Purpose |
|---------|---------|
| `npm run lint` | ESLint (JS files) |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run format` | Format with Prettier |
| `npm test` | Run unit tests |

## Branch Naming

- `feat/description` — New features
- `fix/description` — Bug fixes
- `docs/description` — Documentation
- `ci/description` — CI/CD changes

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat: add project filter animation
fix: resolve typing effect ID mismatch
docs: update README with new workflows
ci: add CodeQL security scanning
```

## Security

- Never commit secrets or API keys
- GitHub Secret Scanning + Push Protection catch leaked secrets
- CodeQL + npm audit check for vulnerabilities

## Reporting Bugs

Use [GitHub Issues](https://github.com/restlessankyyy/my-portfolio-app/issues/new) with steps to reproduce, expected vs actual behavior, and browser/Node version.

## License

By contributing, you agree your contributions will be licensed under the [MIT License](../LICENSE).
