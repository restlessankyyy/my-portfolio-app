# Contributing

> This file has moved to [docs/contributing.md](docs/contributing.md).

## Development Setup

```bash
# Prerequisites: Node.js 24+, npm 11+
git clone https://github.com/restlessankyyy/my-portfolio-app.git
cd my-portfolio-app
npm install
npm start  # → http://localhost:3000
```

## Workflow

We use [GitHub Flow](https://guides.github.com/introduction/flow/index.html):

1. Fork the repo and create your branch from `main`
2. Make your changes
3. Ensure lint + format + tests pass: `npm run validate`
4. If you've changed APIs, update the documentation
5. Open a Pull Request

## Code Quality

Before committing, run the full validation:

```bash
npm run validate   # lint + format check + tests
```

Individual checks:

| Command | Purpose |
|---------|---------|
| `npm run lint` | ESLint (JS files) |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run format` | Format with Prettier |
| `npm test` | Run unit tests (8 cases) |

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
- Gitleaks runs in CI to catch leaked secrets
- CodeQL + npm audit check for vulnerabilities
- Dependabot keeps dependencies updated

## Reporting Bugs

Use [GitHub Issues](https://github.com/restlessankyyy/my-portfolio-app/issues/new) with:

- Steps to reproduce
- Expected vs actual behavior
- Browser/Node version
- Screenshots if applicable

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
