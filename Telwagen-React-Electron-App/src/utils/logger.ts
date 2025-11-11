/**
 * Sistema de Logging Condicional
 * Solo muestra logs en desarrollo, errores siempre visibles
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  component?: string;
  action?: string;
  data?: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const component = context?.component ? `[${context.component}]` : '';
    const action = context?.action ? `[${context.action}]` : '';
    
    return `${timestamp} ${level.toUpperCase()} ${component} ${action} ${message}`;
  }
  
  private log(level: LogLevel, message: string, context?: LogContext, data?: any) {
    const formattedMessage = this.formatMessage(level, message, context);
    
    switch (level) {
      case 'debug':
        if (this.isDevelopment) {
          console.log(`🔧 ${formattedMessage}`, data || '');
        }
        break;
      case 'info':
        if (this.isDevelopment) {
          console.info(`ℹ️ ${formattedMessage}`, data || '');
        }
        break;
      case 'warn':
        console.warn(`⚠️ ${formattedMessage}`, data || '');
        break;
      case 'error':
        console.error(`❌ ${formattedMessage}`, data || '');
        break;
    }
  }
  
  debug(message: string, context?: LogContext, data?: any) {
    this.log('debug', message, context, data);
  }
  
  info(message: string, context?: LogContext, data?: any) {
    this.log('info', message, context, data);
  }
  
  warn(message: string, context?: LogContext, data?: any) {
    this.log('warn', message, context, data);
  }
  
  error(message: string, context?: LogContext, data?: any) {
    this.log('error', message, context, data);
  }
  
  // Métodos específicos para componentes
  useCoches = {
    debug: (message: string, data?: any) => this.debug(message, { component: 'useCoches' }, data),
    info: (message: string, data?: any) => this.info(message, { component: 'useCoches' }, data),
    warn: (message: string, data?: any) => this.warn(message, { component: 'useCoches' }, data),
    error: (message: string, data?: any) => this.error(message, { component: 'useCoches' }, data)
  };
  
  cochesScreen = {
    debug: (message: string, data?: any) => this.debug(message, { component: 'CochesScreen' }, data),
    info: (message: string, data?: any) => this.info(message, { component: 'CochesScreen' }, data),
    warn: (message: string, data?: any) => this.warn(message, { component: 'CochesScreen' }, data),
    error: (message: string, data?: any) => this.error(message, { component: 'CochesScreen' }, data)
  };
  
  formularioCoche = {
    debug: (message: string, data?: any) => this.debug(message, { component: 'FormularioCoche' }, data),
    info: (message: string, data?: any) => this.info(message, { component: 'FormularioCoche' }, data),
    warn: (message: string, data?: any) => this.warn(message, { component: 'FormularioCoche' }, data),
    error: (message: string, data?: any) => this.error(message, { component: 'FormularioCoche' }, data)
  };
}

// Exportar instancia singleton
export const logger = new Logger();
export default logger;

