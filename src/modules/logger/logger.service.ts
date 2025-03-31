import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import { join } from 'path';
import * as fs from 'fs';

@Injectable()
export class AppLoggerService implements LoggerService {
    private logger: winston.Logger;

    constructor() {
        const logDirectory = join(process.cwd(), 'logs');

        // Ensure log directory exists
        if (!fs.existsSync(logDirectory)) {
            fs.mkdirSync(logDirectory);
        }

        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ 
                    filename: join(logDirectory, 'error.log'), 
                    level: 'error' 
                }),
                new winston.transports.File({ 
                    filename: join(logDirectory, 'info.log'), 
                    level: 'info' 
                }),
                new winston.transports.File({ 
                    filename: join(logDirectory, 'warn.log'), 
                    level: 'warn' 
                }),
                new winston.transports.File({ 
                    filename: join(logDirectory, 'combined.log') 
                }),
                new winston.transports.File({
                    filename: join(logDirectory, 'debug.log'),
                    level: 'debug'
                }),
            ],
            exceptionHandlers: [
                new winston.transports.File({ 
                    filename: join(logDirectory, 'exceptions.log')
                })
            ],
            rejectionHandlers: [
                new winston.transports.File({ 
                    filename: join(logDirectory, 'rejections.log')
                })
            ]
        });
    }

    log(message: string, context?: string) {
        this.logger.info(message, { context });
    }

    error(message: string, trace?: string, context?: string) {
        this.logger.error(message, { trace, context });
    }

    warn(message: string, context?: string) {
        this.logger.warn(message, { context });
    }

    debug(message: string, context?: string) {
        this.logger.debug(message, { context });
    }

    verbose(message: string, context?: string) {
        this.logger.verbose(message, { context });
    }
}
