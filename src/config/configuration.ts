export default () => ({
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    backendUrl: process.env.BACKEND_URL || `http://localhost:${process.env.PORT || '3001'}`,
    database: {
        url: process.env.DATABASE_URL,
    },
    security: {
        cookieSecret: process.env.COOKIE_SECRET,
        jwtSecret: process.env.JWT_SECRET,
        jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
        refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
    },
    rateLimit: {
        ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
        limit: parseInt(process.env.RATE_LIMIT_LIMIT || '10', 10),
    },
    cors: {
        origin: process.env.CORS_ORIGIN
         ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
         : null,
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
    },
    email: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'false',
        user: process.env.SMTP_USER,
        password: process.env.SMTP_PASS,
        from: process.env.SMTP_FROM || 'no-reply@darahauls.com',
    },
})