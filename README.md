# 🚀 Ankit Raj — Portfolio

[![CI/CD Pipeline](https://github.com/restlessankyyy/my-portfolio-app/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/restlessankyyy/my-portfolio-app/actions/workflows/ci-cd.yml)
[![CodeQL](https://github.com/restlessankyyy/my-portfolio-app/actions/workflows/codeql.yml/badge.svg)](https://github.com/restlessankyyy/my-portfolio-app/actions/workflows/codeql.yml)
[![Node.js](https://img.shields.io/badge/Node.js-24-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Premium cinematic portfolio website for **Ankit Raj** — Lead Solution Architect & Multi-Cloud Engineer specializing in AWS, Azure, and GCP.

🌐 **Live Site:** [https://www.ankitraj.cloud](https://www.ankitraj.cloud)

## ✨ Features

- 🎬 **Cinematic Dark Theme** — Premium design inspired by zoox.com with grain overlay & parallax
- 🖱️ **Custom Cursor** — Animated dot + ring cursor that reacts to interactive elements
- ✍️ **Typing Effect** — Dynamic hero text cycling through roles & specialties
- 🎨 **Glassmorphism Nav** — Frosted glass navigation with scroll progress indicator
- 🌙 **Dark/Light Mode** — Persistent theme toggle with smooth transitions
- 🏷️ **Project Filters** — Filter 9 showcase projects by Enterprise / Open Source / AI
- 📜 **Experience Timeline** — Staggered animated career timeline
- 🎓 **Certifications Marquee** — Auto-scrolling certification badges
- 📄 **AI Resume** — Auto-generated PDF from HTML via Puppeteer + GitHub Actions
- 📱 **Fully Responsive** — Breakpoints at 1024 / 768 / 480px
- ⚡ **Serverless** — AWS Lambda + API Gateway deployment
- 🔒 **Secure** — HTTPS, DKIM, SPF, DMARC, CodeQL, Dependabot
- 📧 **Contact Form** — EmailJS + AWS SES fallback
- 🚀 **CI/CD** — Automated deployments, security scans, resume generation
- 🏗️ **Infrastructure as Code** — Terraform for AWS & Cloudflare

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | HTML5, CSS3 (custom properties, glassmorphism), Vanilla JS (ES6+ classes) |
| **Fonts** | Space Grotesk, JetBrains Mono |
| **Icons** | Font Awesome 6.5.0 |
| **Backend** | Node.js 24, Express.js |
| **PDF Gen** | Puppeteer (HTML → PDF) |
| **Cloud** | AWS Lambda, API Gateway, SES, ACM, S3 |
| **DNS/CDN** | Cloudflare (DNS, SSL, Page Rules) |
| **IaC** | Terraform |
| **CI/CD** | GitHub Actions (6 workflows) |
| **Security** | CodeQL, Dependabot, npm audit, Gitleaks, Trivy |

## 📁 Project Structure

```text
my-portfolio-app/
├── public/                     # Static assets
│   ├── index.html              # Main HTML — cinematic portfolio
│   ├── assets/
│   │   ├── Profile.pdf         # Primary resume (AWS SA variant)
│   │   └── Profile-Nordic.pdf  # Nordic photo resume variant
│   ├── css/
│   │   └── modern-style.css    # Full styling (dark/light themes, animations)
│   ├── js/
│   │   ├── modern-portfolio.js # Core: cursor, typing, filters, theme, nav
│   │   ├── enhanced-portfolio.js # Perf: lazy load, a11y, parallax
│   │   └── emailjs-config.js   # EmailJS integration
│   └── img/
│       └── ankit.png           # Profile photo
├── scripts/
│   ├── resume-aws-sa.html      # Primary resume HTML (AWS Solutions Architect)
│   ├── resume-photo.html       # Nordic resume with photo
│   ├── generate-pdf-aws-sa.js  # Puppeteer: resume-aws-sa.html → Profile.pdf
│   ├── generate-pdf-photo.js   # Puppeteer: resume-photo.html → Profile-Nordic.pdf
│   ├── generate-pdf.js         # Alias (also generates Profile.pdf)
│   ├── build-lambda.sh         # Lambda package builder
│   ├── deploy.sh               # Deployment script
│   └── destroy.sh              # Teardown script
├── terraform/                  # Infrastructure as Code
│   ├── main.tf                 # AWS resources (Lambda, API GW, IAM, S3)
│   ├── variables.tf            # Input variables
│   ├── outputs.tf              # Output values
│   ├── cloudflare/             # Cloudflare DNS config
│   └── backend/                # S3 remote state config
├── .github/
│   ├── dependabot.yml          # Weekly npm + Actions dependency updates
│   └── workflows/
│       ├── ci-cd.yml           # Full CI/CD pipeline
│       ├── codeql.yml          # CodeQL security scanning
│       ├── security-scan.yml   # Gitleaks + Trivy scheduled scan
│       ├── security-audit.yml  # npm audit + outdated check
│       ├── resume-pdf.yml      # Auto-regenerate resume PDF
│       └── dependency-update.yml # Dependency update checks
├── tests/
│   └── server.test.js          # Unit tests (8 test cases)
├── server.js                   # Express server (port 3000)
├── lambda.js                   # AWS Lambda handler
├── Dockerfile                  # Docker image (node:24-alpine)
├── package.json                # Dependencies + npm overrides
└── _config.yml                 # GitHub Pages config
```

## 🚀 Quick Start

### Prerequisites

- Node.js 24+ (`nvm install 24`)
- npm 10+
- AWS CLI configured (for deployment)
- Terraform 1.0+ (for infrastructure)

### Local Development

```bash
# Clone the repository
git clone https://github.com/restlessankyyy/my-portfolio-app.git
cd my-portfolio-app

# Install dependencies
npm install

# Start development server
npm start
# → http://localhost:3000

# Start with hot reload
npm run dev
```

### Generate Resume PDFs

```bash
# Generate primary resume (AWS SA variant)
node scripts/generate-pdf-aws-sa.js
# → Output: public/assets/Profile.pdf

# Generate Nordic photo resume
node scripts/generate-pdf-photo.js
# → Output: public/assets/Profile-Nordic.pdf
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start production server on port 3000 |
| `npm run dev` | Start with hot reload (nodemon) |
| `npm test` | Run unit tests (8 test cases) |
| `npm run lint` | Run ESLint on JS files |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run format` | Format with Prettier |
| `npm run format:check` | Check formatting |
| `npm run validate` | Run lint + format check + tests |
| `npm run build` | Minify CSS + JS for production |
| `npm run deploy` | Deploy to AWS via Terraform |
| `npm run deploy:destroy` | Tear down AWS infrastructure |

## 🏗️ Infrastructure

### AWS Resources

- **Lambda Function** — `portfolio-ankit-prod-*` (Node.js 24.x, 512MB, 30s timeout)
- **API Gateway** — HTTP API v2 with CORS
- **ACM Certificate** — SSL for custom domain
- **SES** — Email sending with DKIM verified
- **S3** — Static assets + Terraform state
- **CloudWatch** — Logs (14-day retention) + metrics

### Cloudflare

- **DNS** — A, CNAME, TXT records
- **SSL** — Full (strict) mode
- **Page Rules** — Root domain redirect to www

### Remote State

Terraform state stored in S3 with DynamoDB locking:

- **Bucket**: `portfolio-ankit-terraform-state`
- **Lock Table**: `portfolio-ankit-terraform-locks`

## 🔄 CI/CD Pipeline

### Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **ci-cd.yml** | Push to `main` | Full pipeline: lint → scan → test → build → deploy → smoke test |
| **codeql.yml** | Push/PR to `main` + weekly | CodeQL security analysis for JavaScript |
| **security-scan.yml** | Weekly + manual | Gitleaks (secrets) + Trivy (vulnerabilities) |
| **security-audit.yml** | Push/PR (package changes) | npm audit + outdated packages report |
| **resume-pdf.yml** | Push (resume HTML changes) + manual | Auto-regenerate Profile.pdf |
| **resume-nordic-pdf.yml** | Push (resume-photo.html changes) + manual | Auto-regenerate Profile-Nordic.pdf |
| **dependency-update.yml** | Scheduled | Check for dependency updates |

### Dependabot

- **npm** — Weekly Monday updates, grouped by dev/prod
- **GitHub Actions** — Weekly Monday updates, grouped
- **Labels** — `dependencies`, `ci`
- **PR Limit** — 10 open PRs max

### CI/CD Stages

```text
Code Quality → Security Scan → Tests → Terraform Validate → Build → Deploy → Smoke Tests → Notify
```

### Required Secrets

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS IAM access key |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token |
| `CLOUDFLARE_ZONE_ID` | Cloudflare zone ID |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |
| `NOTIFICATION_EMAIL` | Email for deploy notifications |

## 📊 Architecture

```text
                    ┌─────────────┐
                    │  Cloudflare │
                    │    DNS/SSL  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ API Gateway │
                    │  (HTTP API) │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   Lambda    │
                    │ (Node.js 24)│
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──────┐ ┌───▼───┐ ┌─────▼─────┐
       │    SES      │ │  S3   │ │CloudWatch │
       │  (Email)    │ │(State)│ │  (Logs)   │
       └─────────────┘ └───────┘ └───────────┘
```

## 🧪 Testing

```bash
npm test

# Expected output:
# 🧪 Running Server Tests...
# ✅ Health endpoint returns 200
# ✅ Health endpoint returns JSON
# ✅ Homepage returns HTML
# ✅ Static CSS is served
# ✅ Static JS is served
# ✅ Contact API requires fields
# ✅ Contact API validates email
# ✅ Unknown routes return index.html (SPA)
# 📊 Results: 8 passed, 0 failed
```

## 🛡️ Security

- **CodeQL** — Static analysis for JavaScript vulnerabilities
- **Dependabot** — Automated dependency updates
- **npm audit** — CI check for known CVEs (0 vulnerabilities)
- **Gitleaks** — Secret detection in commits
- **Trivy** — Container vulnerability scanning
- **npm overrides** — Pinned `fast-xml-parser >=5.3.8` to patch CVEs
- **IAM** — Least privilege roles for Lambda
- **API Gateway** — Throttling configured
- **HTTPS** — Full strict SSL via Cloudflare

## 🚢 Manual Deployment

```bash
# Build Lambda package
./scripts/build-lambda.sh

# Deploy with Terraform
cd terraform
terraform init
terraform plan
terraform apply

# Or use the deploy script
./scripts/deploy.sh
```

## 📝 Contributing

See [Contributing.md](Contributing.md) for guidelines.

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Ankit Raj** — Lead Solution Architect & Multi-Cloud Engineer

- 🌐 Website: [ankitraj.cloud](https://www.ankitraj.cloud)
- 💻 GitHub: [@restlessankyyy](https://github.com/restlessankyyy)
- 💼 LinkedIn: [Ankit Raj](https://www.linkedin.com/in/ankit-raj/)
- 📧 Email: <rajankit749@gmail.com>

---

⭐ Star this repo if you find it helpful!
