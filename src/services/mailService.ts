import {provideSingleton} from '../inversify/ioc';
import {ContactUsMessage} from '../models/contactus';
import {EnvironmentVariablesService} from './environmentVariablesService';
import {inject} from 'inversify';


const nodemailer = require('nodemailer');

@provideSingleton(MailService)
export class MailService {
    private transporter: any;

    public constructor(
        @inject(EnvironmentVariablesService) private envService: EnvironmentVariablesService
    ) {
        this.transporter = nodemailer.createTransport({
            auth: {
                pass: this.envService.getSmtpPass(),
                user: this.envService.getSmtpUser()
            },
            host: this.envService.getSmtpHost(),
            port: this.envService.getSmtpPort(),
            secure: true

        });
    }

    public sendMessageFromContactUsFormToOurMailServer(message: ContactUsMessage) {
        const mailOptions = {
            from: 'no-reply@theduvernaytest.org',
            html: `<h1>Message from ${message.email} [${message.first_name} ${message.last_name}]</h1><div>${message.message}</div>`,
            subject: 'Message from Contact Us Form',
            text: `Message from ${message.email} <${message.first_name} ${message.last_name}>. The message is ${message.message}`,
            to: 'info@theduvernaytest.org',
        };

        this.transporter.sendMail(mailOptions);
    }
}
