# Ankit Raj Portfolio

A modern, professional portfolio website showcasing cloud development expertise and DevOps skills. Built with cutting-edge web technologies and deployed using serverless architecture on AWS.

🌐 **Live Site**: [ankitraj.cloud](https://ankitraj.cloud)

## 🎯 Overview

This portfolio demonstrates full-stack development capabilities, cloud architecture expertise, and Infrastructure as Code (IaC) proficiency. The application features a modern, responsive design with smooth animations, interactive components, and a serverless backend.

## ✨ Features

- **Modern UI/UX**: Sleek, responsive design with smooth animations and transitions
- **Interactive Components**: Dynamic project showcases, skill visualizations, and contact forms
- **Progressive Web App**: Service worker implementation for offline capabilities
- **Serverless Architecture**: AWS Lambda + API Gateway deployment
- **Infrastructure as Code**: Terraform-managed AWS infrastructure
- **CI/CD Integration**: GitHub Actions for automated testing and deployment
- **Email Integration**: Contact form with AWS SES integration
- **Performance Optimized**: Minified assets, lazy loading, and CDN-ready
- **SEO Optimized**: Meta tags, structured data, and semantic HTML

## 🚀 Quick Start

### Prerequisites

- Node.js >= 22.0.0
- npm >= 10.0.0
- AWS CLI (for deployment)
- Terraform >= 1.0 (for infrastructure management)

### Local Development

```bash
# Clone the repository
git clone https://github.com/restlessankyyy/my-portfolio-app.git
cd my-portfolio-app

# Install dependencies
npm install

# Start development server
npm start

# Visit http://localhost:3000
```

### Development with Auto-reload

```bash
npm run dev
```

## 📦 Project Structure

```
my-portfolio-app/
├── public/              # Static assets
│   ├── css/            # Stylesheets
│   ├── js/             # Client-side JavaScript
│   ├── img/            # Images and icons
│   └── index.html      # Main HTML file
├── terraform/          # Infrastructure as Code
│   ├── main.tf         # Main Terraform configuration
│   ├── variables.tf    # Variable definitions
│   └── outputs.tf      # Output values
├── scripts/            # Deployment and utility scripts
├── tests/              # Test suite
├── server.js           # Express.js server
├── lambda.js           # AWS Lambda handler
└── package.json        # Project dependencies and scripts
```

## 🛠️ Available Scripts

### Development
- `npm start` - Start the Express server locally
- `npm run dev` - Start with nodemon for auto-reload
- `npm run serve` - Serve static files with http-server

### Build & Optimization
- `npm run build` - Minify CSS and JavaScript
- `npm run minify:css` - Minify CSS files
- `npm run minify:js` - Minify JavaScript files

### Quality Assurance
- `npm test` - Run test suite
- `npm run test:ci` - Run tests in CI environment
- `npm run lint` - Check code quality with ESLint
- `npm run lint:fix` - Auto-fix linting issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run validate` - Run all quality checks (lint + format + test)

### Deployment
- `npm run deploy` - Deploy to AWS Lambda via Terraform
- `npm run deploy:destroy` - Destroy AWS infrastructure
- `npm run terraform:init` - Initialize Terraform
- `npm run terraform:plan` - Preview infrastructure changes
- `npm run terraform:apply` - Apply infrastructure changes

## 🏗️ Architecture

### Tech Stack

**Frontend**
- HTML5, CSS3, JavaScript (ES6+)
- Responsive design with CSS Grid and Flexbox
- Service Worker for PWA functionality
- EmailJS for contact form integration

**Backend**
- Node.js with Express.js
- AWS Lambda for serverless compute
- AWS SES for email notifications
- API Gateway for HTTP routing

**Infrastructure**
- Terraform for IaC
- AWS Lambda, API Gateway, CloudWatch
- GitHub Actions for CI/CD
- Docker support for containerization

### Cloud Architecture

The application uses a serverless architecture on AWS:
- **AWS Lambda**: Runs the Express.js application
- **API Gateway**: Routes HTTP requests to Lambda
- **CloudWatch**: Centralized logging and monitoring
- **IAM**: Secure role-based access control

For detailed architecture information, see [DEPLOYMENT.md](DEPLOYMENT.md).

## 🚢 Deployment

### Automated Deployment

```bash
# Configure AWS credentials
aws configure

# Deploy to AWS
npm run deploy
```

### Manual Terraform Deployment

```bash
# Initialize Terraform
cd terraform
terraform init

# Review planned changes
terraform plan

# Apply infrastructure
terraform apply

# Deploy application code
cd ..
npm run deploy
```

For comprehensive deployment instructions, refer to [DEPLOYMENT.md](DEPLOYMENT.md).

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with validation
npm run validate
```

Test coverage includes:
- Server functionality tests
- Route handling tests
- Static file serving tests
- Health check endpoint tests

## 🎨 Customization

### Content Updates
Edit `public/index.html` to update:
- Personal information and bio
- Projects and portfolio items
- Skills and technologies
- Contact information

### Styling
Modify `public/css/modern-style.css` for:
- Color schemes and themes
- Typography and fonts
- Layout and spacing
- Animations and transitions

### Functionality
Update `public/js/modern-portfolio.js` and `public/js/enhanced-portfolio.js` for:
- Interactive behaviors
- Form handling
- Service worker configuration
- Analytics integration

## 🔒 Security

- No hardcoded credentials or secrets
- IAM roles with least privilege principle
- API Gateway throttling and rate limiting
- CloudWatch monitoring and alerting
- CORS configuration for API security
- Environment-based configuration

## 📊 Performance

- Minified CSS and JavaScript
- Lazy loading for images
- Service worker caching
- CDN-ready static assets
- Optimized Lambda cold starts
- CloudWatch performance metrics

## 🤝 Contributing

Contributions are welcome! Please read [Contributing.md](Contributing.md) for details on the code of conduct and the process for submitting pull requests.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run quality checks (`npm run validate`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👤 Author

**Ankit Raj**
- Cloud Developer & DevOps Engineer
- Multi-Cloud Solution Architect (AWS, Azure)
- Email: rajankit749@gmail.com
- Portfolio: [ankitraj.cloud](https://ankitraj.cloud)
- GitHub: [@restlessankyyy](https://github.com/restlessankyyy)

## 🙏 Acknowledgments

- AWS for serverless infrastructure
- Terraform for Infrastructure as Code
- EmailJS for contact form services
- GitHub for hosting and CI/CD

## 📞 Support

For issues, questions, or contributions:
- Open an issue on [GitHub Issues](https://github.com/restlessankyyy/my-portfolio-app/issues)
- Email: rajankit749@gmail.com

---

**Built with ❤️ using Node.js, Express, AWS Lambda, and Terraform**