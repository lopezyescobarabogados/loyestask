import { EmailService } from "../services/EmailService"

interface IEmail {
    email: string
    name: string
    token: string
}

export class AuthEmail {
    static sendConfirmationEmail = async (user : IEmail ) => {
        await EmailService.sendConfirmationEmail(user);
    }

    static sendPasswordResetToken = async (user : IEmail ) => {
        await EmailService.sendPasswordResetToken(user);
    }
}