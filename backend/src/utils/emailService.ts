/**
 * Email Service Utility
 * Handles email sending functionality
 */

import nodemailer from 'nodemailer';

// Email configuration interface
interface EmailConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
}

// Email data interface
interface EmailData {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

// Create transporter based on environment variables
const createTransporter = () => {
  const config: EmailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
  };

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    config.auth = {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    };
  }

  return nodemailer.createTransport(config);
};

/**
 * Send email using configured SMTP settings
 */
export async function sendEmail(data: EmailData): Promise<void> {
  try {
    const transporter = createTransporter();
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@ikf.com';

    const mailOptions = {
      from,
      to: Array.isArray(data.to) ? data.to.join(', ') : data.to,
      subject: data.subject,
      text: data.text,
      html: data.html || data.text, // Use HTML if provided, otherwise use text
    };

    const info = await transporter.sendMail(mailOptions);
    const { logger } = await import('./logger');
    logger.info('Email sent successfully:', info.messageId);
  } catch (error) {
    const { logger } = await import('./logger');
    logger.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
}

/**
 * Replace template variables in email content
 * Supports simple {{variable}} syntax
 * Also removes Handlebars-style conditionals ({{#if}}, {{/if}}) if variables are not provided
 */
export function replaceTemplateVariables(
  content: string,
  variables: Record<string, string | number | null | undefined>
): string {
  let result = content;
  
  // Remove Handlebars-style conditionals if variable doesn't exist
  // Remove {{#if variableName}}...{{/if}} blocks
  result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, varName, content) => {
    if (variables[varName] !== null && variables[varName] !== undefined && variables[varName] !== '') {
      return content; // Keep content if variable exists
    }
    return ''; // Remove block if variable doesn't exist
  });
  
  // Replace all variables
  Object.keys(variables).forEach((key) => {
    const value = variables[key]?.toString() || '';
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, value);
  });
  
  // Clean up any remaining unreplaced variables (optional - remove {{variable}} that weren't replaced)
  result = result.replace(/\{\{[\w\s]+\}\}/g, '');
  
  return result;
}

/**
 * Send email using a template
 */
export async function sendTemplatedEmail(
  to: string | string[],
  subject: string,
  body: string,
  bodyHtml?: string,
  variables?: Record<string, string | number | null | undefined>
): Promise<void> {
  const processedSubject = variables ? replaceTemplateVariables(subject, variables) : subject;
  const processedBody = variables ? replaceTemplateVariables(body, variables) : body;
  const processedBodyHtml = bodyHtml && variables
    ? replaceTemplateVariables(bodyHtml, variables)
    : bodyHtml || processedBody;

  await sendEmail({
    to,
    subject: processedSubject,
    text: processedBody,
    html: processedBodyHtml,
  });
}

