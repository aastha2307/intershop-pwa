import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store, select } from '@ngrx/store';
import { intersection } from 'lodash-es';
import { concatMap, filter, map, mapTo, tap, withLatestFrom } from 'rxjs/operators';

import {
  BasketValidationResultType,
  BasketValidationScopeType,
} from 'ish-core/models/basket-validation/basket-validation.model';
import { BasketService } from 'ish-core/services/basket/basket.service';
import { createOrder } from 'ish-core/store/customer/orders';
import { getServerConfigParameter } from 'ish-core/store/general/server-config';
import { loadProduct } from 'ish-core/store/shopping/products';
import { mapErrorToAction, mapToPayload, mapToPayloadProperty, whenTruthy } from 'ish-core/utils/operators';

import {
  continueCheckout,
  continueCheckoutFail,
  continueCheckoutSuccess,
  continueCheckoutWithIssues,
  loadBasketEligiblePaymentMethods,
  loadBasketEligibleShippingMethods,
  startCheckout,
  startCheckoutFail,
  startCheckoutSuccess,
  submitBasket,
  validateBasket,
} from './basket.actions';
import { getCurrentBasket } from './basket.selectors';

@Injectable()
export class BasketValidationEffects {
  constructor(
    private actions$: Actions,
    private store: Store,
    private router: Router,
    private basketService: BasketService
  ) {}

  private validationSteps: { scopes: BasketValidationScopeType[]; route: string }[] = [
    { scopes: ['Products', 'Value'], route: '/basket' },
    { scopes: ['InvoiceAddress', 'ShippingAddress', 'Addresses'], route: '/checkout/address' },
    { scopes: ['Shipping'], route: '/checkout/shipping' },
    { scopes: ['Payment'], route: '/checkout/payment' },
    { scopes: ['All'], route: '/checkout/review' },
    { scopes: ['All'], route: 'auto' }, // targetRoute will be calculated in dependence of the validation result
  ];

  /**
   * Jumps to the first checkout step (no basket acceleration)
   */
  startCheckoutWithoutAcceleration$ = createEffect(() =>
    this.actions$.pipe(
      ofType(startCheckout),
      withLatestFrom(this.store.pipe(select(getServerConfigParameter<boolean>('basket.acceleration')))),
      filter(([, acc]) => !acc),
      mapTo(continueCheckout({ targetStep: 1 }))
    )
  );

  /**
   * Check the basket before starting the basket acceleration
   */
  startCheckoutWithAcceleration$ = createEffect(() =>
    this.actions$.pipe(
      ofType(startCheckout),
      withLatestFrom(this.store.pipe(select(getServerConfigParameter<boolean>('basket.acceleration')))),
      filter(([, acc]) => acc),
      concatMap(() =>
        this.basketService.validateBasket(this.validationSteps[0].scopes).pipe(
          map(basketValidation => startCheckoutSuccess({ basketValidation })),
          mapErrorToAction(startCheckoutFail)
        )
      )
    )
  );

  /**
   * Validates the basket and jumps to the next possible checkout step (basket acceleration)
   */
  continueCheckoutWithAcceleration$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(startCheckoutSuccess),
        mapToPayload(),
        map(payload => payload.basketValidation.results),
        filter(results => results.valid && !results.adjusted),
        concatMap(() =>
          this.basketService.validateBasket(this.validationSteps[4].scopes).pipe(
            tap(basketValidation => {
              if (basketValidation?.results?.valid) {
                this.router.navigate([this.validationSteps[4].route]);
              }
              this.jumpToTargetRoute('auto', basketValidation?.results);
            })
          )
        )
      ),
    { dispatch: false }
  );

  /**
   * validates the basket but doesn't change the route
   */
  validateBasket$ = createEffect(() =>
    this.actions$.pipe(
      ofType(validateBasket),
      mapToPayloadProperty('scopes'),
      whenTruthy(),
      concatMap(scopes =>
        this.basketService.validateBasket(scopes).pipe(
          map(basketValidation =>
            basketValidation.results.valid
              ? continueCheckoutSuccess({ targetRoute: undefined, basketValidation })
              : continueCheckoutWithIssues({ targetRoute: undefined, basketValidation })
          ),
          mapErrorToAction(continueCheckoutFail)
        )
      )
    )
  );

  /**
   * Validates the basket before the user is allowed to jump to the next basket step
   */
  validateBasketAndContinueCheckout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(continueCheckout),
      mapToPayloadProperty('targetStep'),
      whenTruthy(),
      concatMap(targetStep => {
        const targetRoute = this.validationSteps[targetStep].route;

        return this.basketService.validateBasket(this.validationSteps[targetStep - 1].scopes).pipe(
          withLatestFrom(this.store.pipe(select(getCurrentBasket))),
          concatMap(([basketValidation, basket]) =>
            basketValidation.results.valid
              ? targetStep === 5 && !basketValidation.results.adjusted
                ? basket.approval?.approvalRequired
                  ? [continueCheckoutSuccess({ targetRoute: undefined, basketValidation }), submitBasket()]
                  : [continueCheckoutSuccess({ targetRoute: undefined, basketValidation }), createOrder()]
                : [continueCheckoutSuccess({ targetRoute, basketValidation })]
              : [continueCheckoutWithIssues({ targetRoute, basketValidation })]
          ),
          mapErrorToAction(continueCheckoutFail)
        );
      })
    )
  );

  /**
   * Jumps to the next checkout step after basket validation. In case of adjustments related data like product data, eligible shipping methods etc. are loaded.
   */
  jumpToNextCheckoutStep$ = createEffect(() =>
    this.actions$.pipe(
      ofType(continueCheckoutSuccess, continueCheckoutWithIssues),
      mapToPayload(),
      tap(payload => {
        this.jumpToTargetRoute(payload.targetRoute, payload.basketValidation && payload.basketValidation.results);
      }),

      filter(
        payload =>
          payload.basketValidation &&
          payload.basketValidation.results.adjusted &&
          !!payload.basketValidation.results.infos
      ),
      map(payload => payload.basketValidation),
      concatMap(validation => {
        // Load eligible shipping methods if shipping infos are available
        if (validation.scopes.includes('Shipping')) {
          return [loadBasketEligibleShippingMethods()];
          // Load eligible payment methods if payment infos are available
        } else if (validation.scopes.includes('Payment')) {
          return [loadBasketEligiblePaymentMethods()];
        } else {
          // Load products if product related infos are available
          return validation.results.infos
            .filter(info => info.parameters && info.parameters.productSku)
            .map(info => loadProduct({ sku: info.parameters.productSku }));
        }
      })
    )
  );

  /**
   * Navigates to the target route, in case targetRoute equals 'auto' the target route will be calculated based on the calculation result
   */
  private jumpToTargetRoute(targetRoute: string, results: BasketValidationResultType) {
    if (!targetRoute || !results) {
      return;
    }

    if (targetRoute === 'auto') {
      let scopes = [];
      results.errors?.forEach(error => (scopes = scopes.concat(error?.parameters?.scopes)));
      if (!scopes?.length) {
        results.infos?.forEach(info => (scopes = scopes.concat(info?.parameters?.scopes)));
      }

      this.validationSteps.every(step => {
        if (intersection(step.scopes, scopes)?.length) {
          this.router.navigate([step.route], { queryParams: { error: true } });
          return false;
        }
        return true;
      });
      // otherwise stay on the current page
    } else if (results.valid && !results.adjusted) {
      this.router.navigate([targetRoute]);
    }
  }
}
