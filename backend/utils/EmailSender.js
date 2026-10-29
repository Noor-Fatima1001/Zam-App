const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');
require('dotenv').config();

class EmailSender {
    constructor(config) {
        this.config = {
            host: config.host,
            port: config.port,
            secure: false,
            auth: {
                user: config.auth.user,
                pass: config.auth.pass
            },
            from: config.from,
            tls: {
                rejectUnauthorized: false
            },
            debug: true, 
            logger: true  
        };

        this.transporter = nodemailer.createTransport(this.config);
        this.templateCache = new Map();
    }

    async loadTemplate(templateName) {
        if (this.templateCache.has(templateName)) {
            return this.templateCache.get(templateName);
        }

        const templatePath = path.join(__dirname, '..', 'templates', `${templateName}.hbs`);
        // const templatePath = path.join(process.cwd(), process.env.ROOT_FOLDER || '', 'templates', `${templateName}.hbs`);

        const templateContent = await fs.readFile(templatePath, 'utf-8');
        const template = handlebars.compile(templateContent);
        this.templateCache.set(templateName, template);
        return template;
    }

    async verifyConnection() {
        try {
            await this.transporter.verify();
            console.log('SMTP connection verified successfully');
            return true;
        } catch (error) {
            console.error('SMTP connection verification failed:', error);
            return false;
        }
    }

    parseEmailList(emails) {
        if (!emails) return [];
        return emails.split(',').map(email => email.trim()).filter(email => email);
    }

    async sendDynamicEmail(emailData) {
        try {
            await this.verifyConnection();

            const template = await this.loadTemplate(emailData.templateName || 'order-confirmation');
            const htmlContent = template(emailData.templateData);

            const toEmails = this.parseEmailList(emailData.to);
            const ccEmails = this.parseEmailList(emailData.cc);

            if (toEmails.length === 0) {
                throw new Error('No valid recipient email addresses provided');
            }

            const mailOptions = {
                from: this.config.from,
                to: toEmails.join(', '),
                cc: ccEmails.length > 0 ? ccEmails.join(', ') : undefined,
                subject: emailData.subject,
                html: htmlContent
            };

            console.log('Attempting to send email with options:', {
                to: mailOptions.to,
                cc: mailOptions.cc,
                from: mailOptions.from,
                subject: mailOptions.subject
            });

            const result = await this.transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', result.messageId);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('Detailed error in sendDynamicEmail:', error);
            return { success: false, error: error.message };
        }
    }

    async sendBulkDynamicEmails(emailsData) {
        const results = [];
        for (const emailData of emailsData) {
            console.log(`Attempting to send email with subject: ${emailData.subject}`);
            const result = await this.sendDynamicEmail(emailData);
            results.push({
                subject: emailData.subject,
                to: emailData.to,
                cc: emailData.cc,
                ...result
            });
        }
        return results;
    }
}

module.exports = EmailSender;