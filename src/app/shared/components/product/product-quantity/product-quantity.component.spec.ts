import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { instance, mock, when } from 'ts-mockito';

import { ProductContextFacade } from 'ish-core/facades/product-context.facade';
import { ProductView } from 'ish-core/models/product-view/product-view.model';

import { ProductQuantityComponent } from './product-quantity.component';

describe('Product Quantity Component', () => {
  let component: ProductQuantityComponent;
  let fixture: ComponentFixture<ProductQuantityComponent>;
  let element: HTMLElement;
  let context: ProductContextFacade;

  beforeEach(async () => {
    context = mock(ProductContextFacade);
    when(context.select('product')).thenReturn(of({ sku: 'SKU' } as ProductView));
    when(context.select('displayProperties', 'quantity')).thenReturn(of(true));

    await TestBed.configureTestingModule({
      declarations: [ProductQuantityComponent],
      providers: [{ provide: ProductContextFacade, useFactory: () => instance(context) }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductQuantityComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
    expect(element).toBeTruthy();
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('should not render when display is false', () => {
    when(context.select('displayProperties', 'quantity')).thenReturn(of(false));
    fixture.detectChanges();
    expect(element.querySelector('input')).toBeFalsy();
  });

  it('should display number input when type is not select', () => {
    fixture.detectChanges();
    expect(element.querySelector('input')).toBeTruthy();
  });
});
