import {
  Transporter,
  createTransport,
  getTestMessageUrl,
  createTestAccount,
} from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs';

interface SendEmailParams {
  to: string;
  subject: string;
  variables: Record<string, unknown>;
  path: string;
}

class SendMailService {
  private client: Transporter;
  constructor() {
    this.client = createTransport({
      port: Number(process.env.SMTP_PORT),
      host: process.env.SMTP_HOST,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      debug: true,
    });
  }

  async execute({ to, subject, variables, path }: SendEmailParams) {
    const isProduction = !['development', 'test'].includes(
      process.env.NODE_ENV as string
    );

    if (!isProduction) {
      await createTestAccount().then((account) => {
        const transporter = createTransport({
          host: account.smtp.host,
          port: account.smtp.port,
          secure: account.smtp.secure,
          auth: {
            user: account.user,
            pass: account.pass,
          },
        });

        this.client = transporter;
      });
    }

    const templateFileContent = fs.readFileSync(path).toString('utf-8');

    const mailTemplateParse = handlebars.compile(templateFileContent);

    const html = mailTemplateParse(variables);

    const message = await this.client.sendMail({
      to,
      subject,
      html,
      from: 'rodrigo_gonn@hotmail.com',
    });

    if (!isProduction) {
      console.log('Message sent. Preview URL: %s', getTestMessageUrl(message));
    }
  }
}

export default new SendMailService();
