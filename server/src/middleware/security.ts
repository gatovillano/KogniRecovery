/**
 * Security Middleware - HTTPS enforcement and security headers
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import { Request, Response, NextFunction } from 'express';
import { isProduction, isDevelopment } from '../config/index.js';

/**
 * Helmet middleware configuration for security headers
 */
import helmet from 'helmet';

export const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"], // React Native needs unsafe-inline for styles
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "wss:", "https:"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    hsts: isProduction() ? {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
    } : false,
    referrerPolicy: 'strict-origin-when-cross-origin',
    noSniff: true,
    hidePoweredBy: true,
    xssFilter: true,
});

/**
 * Enforces HTTPS in production environment
 */
export const enforceHttps = (req: Request, res: Response, next: NextFunction): void => {
    if (isProduction()) {
        const protocol = req.protocol;

        if (protocol !== 'https') {
            const httpsUrl = `https://${req.hostname}${req.originalUrl}`;
            res.redirect(301, httpsUrl);
            return;
        }
    }
    next();
};

/**
 * Prevents clickjacking attacks
 */
export const preventClickjacking = (req: Request, res: Response, next: NextFunction): void => {
    res.setHeader('X-Frame-Options', 'DENY');
    next();
};

/**
 * Adds additional security headers
 */
export const additionalSecurityHeaders = (req: Request, res: Response, next: NextFunction): void => {
    // Strict Transport Security is handled by Helmet
    // X-Content-Type-Options is handled by Helmet (noSniff)

    // Permissions Policy for browser features
    res.setHeader(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), payment=()'
    );

    // Cache control for sensitive data
    if (req.path.includes('/api/')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }

    next();
};

/**
 * Rate limiting headers
 */
export const rateLimitHeaders = (req: Request, res: Response, next: NextFunction): void => {
    // Add rate limit info to headers
    // This is typically handled by express-rate-limit but we add basic headers here
    next();
};

/**
 * Combined security middleware
 */
export const securityMiddleware = [
    securityHeaders,
    enforceHttps,
    preventClickjacking,
    additionalSecurityHeaders,
    rateLimitHeaders,
];

export default securityMiddleware;