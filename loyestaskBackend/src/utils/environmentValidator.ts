import colors from 'colors';

interface EnvironmentValidation {
  variable: string;
  value: string | undefined;
  required: boolean;
  description: string;
  validationRegex?: RegExp;
  isValid?: boolean;
}

export class EnvironmentValidator {
  private static validations: EnvironmentValidation[] = [
    // Base de datos
    {
      variable: 'DATABASE_URL',
      value: process.env.DATABASE_URL,
      required: true,
      description: 'URL de conexión a MongoDB',
      validationRegex: /^mongodb(\+srv)?:\/\/.+/
    },

    // Autenticación
    {
      variable: 'JWT_SECRET',
      value: process.env.JWT_SECRET,
      required: true,
      description: 'Clave secreta para JWT (mínimo 32 caracteres)',
      validationRegex: /^.{32,}$/
    },

    // Brevo Email API
    {
      variable: 'BREVO_API_KEY',
      value: process.env.BREVO_API_KEY,
      required: true,
      description: 'API Key de Brevo para envío de emails',
      validationRegex: /^xkeysib-.+/
    },

    // Email Configuration
    {
      variable: 'FROM_EMAIL',
      value: process.env.FROM_EMAIL,
      required: true,
      description: 'Email remitente principal',
      validationRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    {
      variable: 'EMAIL_FROM_NAME',
      value: process.env.EMAIL_FROM_NAME,
      required: false,
      description: 'Nombre del remitente',
    },

    // Frontend
    {
      variable: 'FRONTEND_URL',
      value: process.env.FRONTEND_URL,
      required: true,
      description: 'URL del frontend desplegado',
      validationRegex: /^https?:\/\/.+/
    },

    // Server
    {
      variable: 'NODE_ENV',
      value: process.env.NODE_ENV,
      required: true,
      description: 'Entorno de ejecución',
      validationRegex: /^(development|production|test)$/
    },
    {
      variable: 'PORT',
      value: process.env.PORT,
      required: false,
      description: 'Puerto del servidor (Railway lo asigna automáticamente)',
    },

    // Notifications
    {
      variable: 'DAILY_REMINDER_HOUR',
      value: process.env.DAILY_REMINDER_HOUR,
      required: false,
      description: 'Hora para recordatorios diarios (0-23)',
      validationRegex: /^([0-1]?[0-9]|2[0-3])$/
    },
    {
      variable: 'SPECIFIC_REMINDER_HOUR',
      value: process.env.SPECIFIC_REMINDER_HOUR,
      required: false,
      description: 'Hora para recordatorios específicos (0-23)',
      validationRegex: /^([0-1]?[0-9]|2[0-3])$/
    },

    // Security & Performance
    {
      variable: 'BCRYPT_SALT_ROUNDS',
      value: process.env.BCRYPT_SALT_ROUNDS,
      required: false,
      description: 'Rounds de salt para bcrypt',
      validationRegex: /^[1-9][0-9]*$/
    },
    {
      variable: 'MAX_DAILY_EMAILS',
      value: process.env.MAX_DAILY_EMAILS,
      required: false,
      description: 'Límite máximo de emails por día',
      validationRegex: /^[1-9][0-9]*$/
    },

    // Admin User (Opcional)
    {
      variable: 'ADMIN_EMAIL',
      value: process.env.ADMIN_EMAIL,
      required: false,
      description: 'Email del usuario administrador inicial',
      validationRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    {
      variable: 'ADMIN_PASSWORD',
      value: process.env.ADMIN_PASSWORD,
      required: false,
      description: 'Contraseña del usuario administrador inicial',
    },

    // Development SMTP (Solo para desarrollo)
    {
      variable: 'SMTP_HOST',
      value: process.env.SMTP_HOST,
      required: false,
      description: 'Host SMTP para desarrollo (Mailtrap)',
    },
    {
      variable: 'SMTP_PORT',
      value: process.env.SMTP_PORT,
      required: false,
      description: 'Puerto SMTP para desarrollo',
    },
    {
      variable: 'SMTP_USER',
      value: process.env.SMTP_USER,
      required: false,
      description: 'Usuario SMTP para desarrollo',
    },
    {
      variable: 'SMTP_PASS',
      value: process.env.SMTP_PASS,
      required: false,
      description: 'Contraseña SMTP para desarrollo',
    },
  ];

  public static validateEnvironment(): boolean {
    console.log(colors.cyan.bold('\n🔍 VALIDANDO VARIABLES DE ENTORNO\n'));

    let allValid = true;
    const isProduction = process.env.NODE_ENV === 'production';

    this.validations.forEach(validation => {
      // Validar que exista si es requerida
      if (validation.required && !validation.value) {
        validation.isValid = false;
        allValid = false;
        console.log(colors.red(`❌ ${validation.variable}`));
        console.log(colors.gray(`   ${validation.description}`));
        console.log(colors.red('   REQUERIDA pero no está configurada\n'));
        return;
      }

      // Si no es requerida y no existe, marcar como válida
      if (!validation.required && !validation.value) {
        validation.isValid = true;
        console.log(colors.yellow(`⚠️  ${validation.variable}`));
        console.log(colors.gray(`   ${validation.description}`));
        console.log(colors.yellow('   Opcional - no configurada\n'));
        return;
      }

      // Validar formato si existe regex
      if (validation.validationRegex && validation.value) {
        const regexValid = validation.validationRegex.test(validation.value);
        validation.isValid = regexValid;
        
        if (!regexValid) {
          allValid = false;
          console.log(colors.red(`❌ ${validation.variable}`));
          console.log(colors.gray(`   ${validation.description}`));
          console.log(colors.red(`   Formato inválido: ${validation.value}\n`));
          return;
        }
      }

      // Si llegamos aquí, la variable es válida
      validation.isValid = true;
      const maskedValue = this.maskSensitiveValue(validation.variable, validation.value || '');
      console.log(colors.green(`✅ ${validation.variable}`));
      console.log(colors.gray(`   ${validation.description}`));
      console.log(colors.blue(`   ${maskedValue}\n`));
    });

    // Validaciones especiales para producción
    if (isProduction) {
      console.log(colors.cyan.bold('🏭 VALIDACIONES ADICIONALES PARA PRODUCCIÓN:\n'));
      
      // Verificar que no se usen variables de desarrollo en producción
      const devVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
      devVars.forEach(varName => {
        if (process.env[varName]) {
          console.log(colors.yellow(`⚠️  ${varName} configurada en producción`));
          console.log(colors.gray('   Debería usar Brevo API en lugar de SMTP\n'));
        }
      });

      // Verificar Brevo en producción
      if (!process.env.BREVO_API_KEY) {
        console.log(colors.red('❌ BREVO_API_KEY requerida en producción'));
        allValid = false;
      }
    }

    // Resumen final
    console.log(colors.cyan.bold('📊 RESUMEN DE VALIDACIÓN:\n'));
    
    const requiredCount = this.validations.filter(v => v.required).length;
    const validRequired = this.validations.filter(v => v.required && v.isValid).length;
    const optionalCount = this.validations.filter(v => !v.required).length;
    const validOptional = this.validations.filter(v => !v.required && v.isValid).length;

    console.log(`Variables requeridas: ${colors.green(validRequired.toString())}/${requiredCount}`);
    console.log(`Variables opcionales: ${colors.blue(validOptional.toString())}/${optionalCount}`);
    console.log(`Entorno: ${colors.yellow(process.env.NODE_ENV || 'unknown')}`);

    if (allValid) {
      console.log(colors.green.bold('\n🎉 TODAS LAS VARIABLES SON VÁLIDAS\n'));
    } else {
      console.log(colors.red.bold('\n💥 HAY VARIABLES INVÁLIDAS O FALTANTES\n'));
    }

    return allValid;
  }

  private static maskSensitiveValue(variable: string, value: string): string {
    const sensitivePatterns = ['SECRET', 'PASSWORD', 'KEY', 'PASS'];
    
    if (sensitivePatterns.some(pattern => variable.includes(pattern))) {
      if (value.length <= 8) {
        return '*'.repeat(value.length);
      }
      return value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4);
    }
    
    return value;
  }

  public static getRequiredVariablesForRailway(): string[] {
    return this.validations
      .filter(v => v.required)
      .map(v => v.variable);
  }

  public static printRailwayCommands(): void {
    console.log(colors.cyan.bold('\n🚀 COMANDOS PARA CONFIGURAR EN RAILWAY:\n'));
    
    const requiredVars = this.validations.filter(v => v.required);
    
    requiredVars.forEach(validation => {
      const example = this.getExampleValue(validation.variable);
      console.log(colors.white(`railway variables set ${validation.variable}="${example}"`));
    });
    
    console.log(colors.yellow.bold('\n📝 Variables opcionales recomendadas:\n'));
    
    const recommendedOptional = [
      'EMAIL_FROM_NAME',
      'DAILY_REMINDER_HOUR',
      'SPECIFIC_REMINDER_HOUR',
      'ADMIN_EMAIL',
      'ADMIN_PASSWORD'
    ];
    
    recommendedOptional.forEach(varName => {
      const validation = this.validations.find(v => v.variable === varName);
      if (validation) {
        const example = this.getExampleValue(varName);
        console.log(colors.gray(`railway variables set ${varName}="${example}"`));
      }
    });
  }

  private static getExampleValue(variable: string): string {
    const examples: Record<string, string> = {
      'DATABASE_URL': 'mongodb+srv://user:password@cluster.mongodb.net/loyestask',
      'JWT_SECRET': 'tu_jwt_secret_muy_seguro_de_al_menos_32_caracteres',
      'BREVO_API_KEY': 'xkeysib-tu-api-key-de-brevo-aqui',
      'FROM_EMAIL': 'notifications@tudominio.com',
      'EMAIL_FROM_NAME': 'LoyesTask Notifications',
      'FRONTEND_URL': 'https://tu-frontend.up.railway.app',
      'NODE_ENV': 'production',
      'DAILY_REMINDER_HOUR': '8',
      'SPECIFIC_REMINDER_HOUR': '9',
      'ADMIN_EMAIL': 'admin@tudominio.com',
      'ADMIN_PASSWORD': 'password_muy_seguro_aqui'
    };
    
    return examples[variable] || 'valor_aqui';
  }
}
