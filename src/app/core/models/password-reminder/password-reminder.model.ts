import { Captcha } from 'ish-core/models/captcha/captcha.model';

export interface PasswordReminder extends Captcha {
  email: string;
  firstName: string;
  lastName: string;
  answer?: string;
}
