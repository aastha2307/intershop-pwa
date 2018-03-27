import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UUID } from 'angular2-uuid';
import { CustomValidators } from 'ng2-validation';
import { Subscription } from 'rxjs/Subscription';
import { AddressFormService } from '../../../forms/address';
import { SpecialValidators } from '../../../forms/shared/validators/special-validators';
import { Country } from '../../../models/country/country.model';
import { Region } from '../../../models/region/region.model';
import { markAsDirtyRecursive, updateValidatorsByDataLength } from '../../../utils/form-utils';

@Component({
  selector: 'ish-registration-form',
  templateUrl: './registration-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class RegistrationFormComponent implements OnInit, OnChanges, OnDestroy {

  @Input() countries: Country[];
  @Input() regions: Region[];
  @Input() languages: any[]; // TODO: insert type
  @Input() titles: any[]; // TODO: insert type
  @Input() error: HttpErrorResponse;

  @Output() create = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<any>();
  @Output() countryChange = new EventEmitter<string>();

  form: FormGroup;
  formCountrySwitchSubscription: Subscription;
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private afs: AddressFormService
  ) { }

  ngOnInit() {
    this.form = this.fb.group({
      credentials: this.fb.group({
        login: ['', [Validators.required, CustomValidators.email]],
        loginConfirmation: ['', [Validators.required, CustomValidators.email]],
        password: ['', [Validators.required, SpecialValidators.password]],
        passwordConfirmation: ['', [Validators.required, SpecialValidators.password]],
        securityQuestion: ['', [Validators.required]],
        securityQuestionAnswer: ['', [Validators.required]]
      }),
      countryCodeSwitch: ['', [Validators.required]],
      preferredLanguage: ['en_US', [Validators.required]],
      birthday: [''],
      captcha: [false, [Validators.required]],
      address: this.afs.getFactory('default').getGroup(), // filled dynamically when country code changes
    });

    // build and register new address form when country code changed
    this.formCountrySwitchSubscription = this.form.get('countryCodeSwitch').valueChanges
      .subscribe(countryCodeSwitch => this.handleCountryChange(countryCodeSwitch));

    // set validators for credentials form
    const credForm = this.form.get('credentials');
    credForm.get('loginConfirmation').setValidators(CustomValidators.equalTo(credForm.get('login')));
    credForm.get('passwordConfirmation').setValidators(CustomValidators.equalTo(credForm.get('password')));
  }

  ngOnChanges(c: SimpleChanges) {
    // update validators for "state" control in address form according to regions
    const stateControl = this.form && this.form.get('address.state');
    if (c.regions && stateControl) {
      updateValidatorsByDataLength(
        stateControl,
        this.regions,
        Validators.required,
        true
      );
    }
  }

  ngOnDestroy() {
    this.formCountrySwitchSubscription.unsubscribe();
  }

  cancelForm() {
    this.cancel.emit();
  }

  /**
   * Submits form and throws create event when form is valid
   */
  submitForm() {
    if (this.form.invalid) {
      this.submitted = true;
      markAsDirtyRecursive(this.form);
      return;
    }

    // clone form value
    const customer = JSON.parse(JSON.stringify(this.form.value));

    if (customer.birthday === '') { customer.birthday = null; }   // TODO: see IS-22276

    // assign a customer number
    // TODO: customerNo should be generated by the server
    customer.customerNo = customer.customerNo || UUID.UUID();

    // create and assign a new credentials object
    customer.email = customer.email || customer.credentials.login;

    // copy address entries to the customer, if empty
    customer.firstName = customer.firstName || customer.address.firstName;
    customer.lastName = customer.lastName || customer.address.lastName;
    customer.phoneHome = customer.phoneHome || customer.address.phoneHome;
    if (customer.title || customer.address.title) {
      customer.title = customer.title || customer.address.title;
    }

    this.create.emit(customer);
  }

  private handleCountryChange(countryCode: string) {
    const oldFormValue = this.form.get('address').value;
    const group = this.afs.getFactory(countryCode).getGroup({
      ...oldFormValue,
      countryCode
    });
    this.form.setControl('address', group);

    this.countryChange.emit(countryCode);
  }

  get formDisabled() {
    return this.form.invalid && this.submitted;
  }

  get countryCode() {
    return this.form.get('countryCodeSwitch').value;
  }
}
