import { Injectable, Logger } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import * as Handlebars from 'handlebars';

@Injectable()
export class TemplateRenderingProvider {
  private readonly logger = new Logger(TemplateRenderingProvider.name);
  private readonly templateCache = new Map<string, string>();
  private readonly templateDirectories = [
    join(process.cwd(), 'src', 'shared', 'templates'),
    join(process.cwd(), 'dist', 'shared', 'templates'),
    resolve(__dirname, '..', '..', 'shared', 'templates'),
  ];

  constructor() {
    // Register custom Handlebars helpers
    this.registerHelpers();
  }

  private registerHelpers(): void {
    // Helper for formatting dates
    Handlebars.registerHelper('formatDate', (date: Date, format?: string) => {
      if (!date) return '';
      const d = new Date(date);

      if (format === 'short') {
        return d.toLocaleDateString();
      } else if (format === 'long') {
        return d.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      } else if (format === 'time') {
        return d.toLocaleTimeString();
      }

      return d.toLocaleString();
    });

    // Helper for formatting currency
    Handlebars.registerHelper(
      'formatCurrency',
      (amount: number, currency = 'USD') => {
        if (amount === null || amount === undefined) return '';

        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency,
        }).format(amount);
      },
    );

    // Helper for conditional logic
    Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
    Handlebars.registerHelper('ne', (a: any, b: any) => a !== b);
    Handlebars.registerHelper('gt', (a: number, b: number) => a > b);
    Handlebars.registerHelper('lt', (a: number, b: number) => a < b);

    // Helper for uppercase
    Handlebars.registerHelper('uppercase', (str: string) => {
      return str ? str.toUpperCase() : '';
    });

    // Helper for lowercase
    Handlebars.registerHelper('lowercase', (str: string) => {
      return str ? str.toLowerCase() : '';
    });
  }

  loadTemplateFromFile(templateName: string): string {
    const normalizedTemplateName = this.normalizeTemplateName(templateName);
    const cachedTemplate = this.templateCache.get(normalizedTemplateName);

    if (cachedTemplate) {
      return cachedTemplate;
    }

    const templatePath = this.resolveTemplatePath(normalizedTemplateName);
    const template = readFileSync(templatePath, 'utf8');

    this.templateCache.set(normalizedTemplateName, template);

    return template;
  }

  render(template: string, data: Record<string, any>): string {
    try {
      const compiledTemplate = Handlebars.compile(template);
      return compiledTemplate(data);
    } catch (error: unknown) {
      this.logger.error('Template rendering failed:', error);
      throw new Error(`Failed to render template: ${this.getErrorMessage(error)}`);
    }
  }

  renderFile(templateName: string, data: Record<string, any>): string {
    try {
      const template = this.loadTemplateFromFile(templateName);
      return this.render(template, data);
    } catch (error: unknown) {
      this.logger.error(
        `Template file rendering failed for ${templateName}:`,
        error,
      );
      throw new Error(
        `Failed to render template file ${this.normalizeTemplateName(templateName)}: ${this.getErrorMessage(error)}`,
      );
    }
  }

  renderWithSubject(
    subjectTemplate: string | null,
    bodyTemplate: string,
    data: Record<string, any>,
  ): { subject: string; body: string } {
    try {
      const subject = subjectTemplate ? this.render(subjectTemplate, data) : '';
      const body = this.render(bodyTemplate, data);

      return { subject, body };
    } catch (error: unknown) {
      this.logger.error('Template rendering with subject failed:', error);
      throw error;
    }
  }

  renderFileWithSubject(
    subjectTemplate: string | null,
    templateName: string,
    data: Record<string, any>,
  ): { subject: string; body: string } {
    try {
      const body = this.renderFile(templateName, data);
      const subject = subjectTemplate ? this.render(subjectTemplate, data) : '';

      return { subject, body };
    } catch (error: unknown) {
      this.logger.error('Template file rendering with subject failed:', error);
      throw error;
    }
  }

  validateTemplate(template: string): { valid: boolean; error?: string } {
    try {
      Handlebars.compile(template);
      return { valid: true };
    } catch (error: unknown) {
      return {
        valid: false,
        error: this.getErrorMessage(error),
      };
    }
  }

  validateTemplateFile(templateName: string): { valid: boolean; error?: string } {
    try {
      const template = this.loadTemplateFromFile(templateName);
      return this.validateTemplate(template);
    } catch (error: unknown) {
      return {
        valid: false,
        error: this.getErrorMessage(error),
      };
    }
  }

  extractPlaceholders(template: string): string[] {
    const placeholders = new Set<string>();
    const regex = /\{\{([^{}]+)\}\}/g;
    let match;

    while ((match = regex.exec(template)) !== null) {
      // Extract the variable name, removing helpers and whitespace
      const placeholder = match[1].trim().split(' ')[0];
      placeholders.add(placeholder);
    }

    return Array.from(placeholders);
  }

  extractPlaceholdersFromFile(templateName: string): string[] {
    const template = this.loadTemplateFromFile(templateName);
    return this.extractPlaceholders(template);
  }

  private normalizeTemplateName(templateName: string): string {
    return templateName.endsWith('.hbs') ? templateName : `${templateName}.hbs`;
  }

  private resolveTemplatePath(templateName: string): string {
    for (const directory of this.templateDirectories) {
      const templatePath = join(directory, templateName);

      if (existsSync(templatePath)) {
        return templatePath;
      }
    }

    throw new Error(`Template file not found: ${templateName}`);
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
