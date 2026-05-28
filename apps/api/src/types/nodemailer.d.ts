declare module 'nodemailer' {
  export interface SendMailOptions {
    to?: string;
    from?: string;
    subject?: string;
    text?: string;
    html?: string;
  }

  export interface SentMessageInfo {
    accepted?: string[];
    messageId?: string;
  }

  export interface Transporter {
    sendMail(options: SendMailOptions): Promise<SentMessageInfo>;
  }

  export interface TransportOptions {
    service?: string;
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: {
      user: string;
      pass: string;
    };
  }

  const nodemailer: {
    createTransport(options: TransportOptions): Transporter;
  };

  export = nodemailer;
}
