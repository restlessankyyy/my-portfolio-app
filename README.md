# 🚀 Ankit Raj - Portfolio

[![CI/CD Pipeline](https://github.com/restlessankyyy/my-portfolio-app/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/restlessankyyy/my-portfolio-app/actions/workflows/ci-cd.yml)
[![Security Scan](https://github.com/restlessankyyy/my-portfolio-app/actions/workflows/security-scan.yml/badge.svg)](https://github.com/restlessankyyy/my-portfolio-app/actions/workflows/security-scan.yml)
[![Node.js](https://img.shields.io/badge/Node.js-22-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Modern, serverless portfolio website for **Ankit Raj** - Multi-Cloud Solution Architect specializing in AWS, Azure, and GCP.

🌐 **Live Site:** [https://www.ankitraj.cloud](https://www.ankitraj.cloud)

## ✨ Features

- 🎨 **Modern UI** - Glassmorphism design with smooth animations
- 🌙 **Dark/Light Mode** - Toggle between themes
- 📱 **Fully Responsive** - Mobile-first design
- ⚡ **Serverless** - AWS Lambda + API Gateway
- 🔒 **Secure** - HTTPS, DKIM, SPF, DMARC configured
- 📧 **Contact Form** - AWS SES integration
- 🚀 **CI/CD** - Automated deployments via GitHub Actions
- 🏗️ **Infrastructure as Code** - Terraform for AWS & Cloudflare

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Backend** | Node.js 22, Express.js |
| **Cloud** | AWS Lambda, API Gateway, SES, ACM |
| **DNS/CDN** | Cloudflare (DNS, SSL, Page Rules) |
| **IaC** | Terraform |
| **CI/CD** | GitHub Actions |
| **Security** | Gitleaks, Trivy, CodeQL |

## 📁 Project Structure

```
my-portfolio-app/
├── public/                 # Static assets
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript files
│   ├── img/               # Images
│   └── index.html         # Main HTML
├── terraform/             # Infrastructure as Code
│   ├── main.tf            # AWS resources
│   ├── cloudflare/        # Cloudflare DNS config
│   └── backend/           # Remote state config
├── .github/workflows/     # CI/CD pipelines
├── scripts/               # Build & deploy scripts
├── tests/                 # Unit tests
├── server.js              # Express server
└── lambda.js              # Lambda handler
```

## 🚀 Quick Start

### Prerequisites

- Node.js 22+ (use `nvm use` with `.nvmrc`)
- npm 10+
- AWS CLI configured
- Terraform 1.5+

### Local Development

```bash
# Clone the repository
git clone https://github.com/restlessankyyy/my-portfolio-app.git
cd my-portfolio-app

# Install dependencies
npm install

# Start development server
npm start

# Open http://localhost:3000
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start with hot reload (nodemon) |
| `npm test` | Run unit tests |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run validate` | Run lint + format check + tests |

## 🏗️ Infrastructure

### AWS Resources

- **Lambda Function**: `portfolio-ankit-prod-*`
- **API Gateway**: HTTP API v2
- **ACM Certificate**: SSL for custom domain
- **SES**: Email sending with DKIM verified

### Cloudflare

- **DNS**: A, CNAME, TXT records
- **SSL**: Full (strict) mode
- **Page Rules**: Root domain redirect to www

### Remote State

Terraform state is stored in S3 with DynamoDB locking:
- **Bucket**: `portfolio-ankit-terraform-state`
- **Lock Table**: `portfolio-ankit-terraform-locks`

## 🔄 CI/CD Pipeline

The pipeline runs on every push to `main`:

```
Code Quality → Security Scan → Tests → Terraform Validate → Build → Deploy → Smoke Tests → Notify
```

### Stages

1. **Code Quality** - ESLint, Prettier, npm audit
2. **Security Scan** - Gitleaks (secrets), Trivy (vulnerabilities)
3. **Tests** - Unit tests + health check
4. **Terraform Validate** - Format check, init, validate, plan
5. **Build** - Create Lambda deployment package
6. **Deploy** - Apply Terraform, update Lambda
7. **Smoke Tests** - Verify endpoints after deploy
8. **Notify** - Email notification via SES

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

```
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
                    │  (Node.js)  │
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
# Run all tests
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

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Ankit Raj**
- Website: [ankitraj.cloud](https://www.ankitraj.cloud)
- GitHub: [@restlessankyyy](https://github.com/restlessankyyy)
- LinkedIn: [Ankit Raj](https://www.linkedin.com/in/ankit-raj/)

---

⭐ Star this repo if you find it helpful!
