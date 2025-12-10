// EmailJS Configuration for Portfolio Contact Form
// Replace these with your actual EmailJS credentials

class EmailJSHandler {
  constructor() {
    // EmailJS credentials configured
    this.serviceId = "service_lwb1ipq";
    this.templateId = "template_sx2bogd";
    this.publicKey = "P1pp_sysjRWvgNrlo";

    this.isConfigured = true;
  }

  init() {
    // Initialize EmailJS
    if (window.emailjs) {
      emailjs.init(this.publicKey);
      console.log("EmailJS initialized successfully");
    } else {
      console.error("EmailJS not loaded");
    }
  }

  async sendEmail(formData) {
    try {
      // Prepare template parameters
      const templateParams = {
        from_name: formData.name,
        from_email: formData.email,
        message: formData.message,
        to_email: "rajankit749@gmail.com", // Your email
        reply_to: formData.email,
      };

      // Send email via EmailJS
      const response = await emailjs.send(
        this.serviceId,
        this.templateId,
        templateParams,
      );

      console.log("Email sent successfully:", response);
      return { success: true, response };
    } catch (error) {
      console.error("Email sending failed:", error);
      return { success: false, error };
    }
  }

  // Setup instructions for EmailJS
  static getSetupInstructions() {
    return `
        📧 EmailJS Setup Instructions:
        
        1. Go to https://www.emailjs.com/ and create a free account
        
        2. Create an Email Service:
           - Click "Add New Service"
           - Choose Gmail (or your preferred email provider)
           - Connect your Gmail account
           - Note the Service ID
        
        3. Create an Email Template:
           - Click "Create New Template"
           - Use these variables in your template:
             {{from_name}} - Sender's name
             {{from_email}} - Sender's email
             {{message}} - Message content
             {{to_email}} - Your email (rajankit749@gmail.com)
           - Note the Template ID
        
        4. Get your Public Key:
           - Go to Integration page
           - Copy your Public Key
        
        5. Update emailjs-config.js:
           - Replace YOUR_PUBLIC_KEY with your actual public key
           - Replace YOUR_SERVICE_ID with your service ID
           - Replace YOUR_TEMPLATE_ID with your template ID
        
        6. Sample Email Template:
        
        Subject: New Portfolio Contact - {{from_name}}
        
        Hello Ankit,
        
        You have received a new message from your portfolio website:
        
        Name: {{from_name}}
        Email: {{from_email}}
        
        Message:
        {{message}}
        
        Best regards,
        Portfolio Contact Form
        `;
  }
}

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = EmailJSHandler;
} else {
  window.EmailJSHandler = EmailJSHandler;
}

// Log setup instructions to console
console.log(EmailJSHandler.getSetupInstructions());
