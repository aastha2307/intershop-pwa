import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { RecaptchaModule } from 'ng-recaptcha';

import { SharedModule } from '../shared/shared.module';

import { FormControlFeedbackComponent } from './shared/components/form-control-feedback/form-control-feedback.component';
import { CaptchaComponent } from './shared/components/form-controls/captcha/captcha.component';
import { CheckboxComponent } from './shared/components/form-controls/checkbox/checkbox.component';
import { InputBirthdayComponent } from './shared/components/form-controls/input-birthday/input-birthday.component';
import { InputComponent } from './shared/components/form-controls/input/input.component';
import { selectComponents } from './shared/components/form-controls/select';
import { ShowFormFeedbackDirective } from './shared/directives/show-form-feedback.directive';

@NgModule({
  imports: [SharedModule, RecaptchaModule, TranslateModule, CommonModule, ReactiveFormsModule],
  declarations: [
    FormControlFeedbackComponent,
    ShowFormFeedbackDirective,
    CheckboxComponent,
    InputComponent,
    ...selectComponents,
    InputBirthdayComponent,
    CaptchaComponent,
  ],
  exports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    FormControlFeedbackComponent,
    ShowFormFeedbackDirective,
    CheckboxComponent,
    InputComponent,
    ...selectComponents,
    InputBirthdayComponent,
    CaptchaComponent,
  ],
})
export class FormsSharedModule {}
