import { ComponentFixture } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ProductTileComponent } from './productTile.component';
import { ProductTileService } from './productTileService/productTile.service';
import { DataEmitterService } from '../../../shared/services/dataEmitter.service';
import { async, inject } from '@angular/core/testing';

describe('ProductTile Component', () => {
    let fixture: ComponentFixture<ProductTileComponent>,
        component: ProductTileComponent,
        element: HTMLElement,
        debugEl: DebugElement;

    class DataEmitterServiceStub {
        addToCart(itemToAdd) {

        }
        addToWishList(itemToAdd) {

        }
        addToCompare(itemToAdd) {

        }
    }
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ProductTileComponent],
            providers: [ProductTileService,
                { provide: DataEmitterService, useClass: DataEmitterServiceStub }
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ProductTileComponent);
        component = fixture.componentInstance;
        debugEl = fixture.debugElement;
        element = fixture.nativeElement;
    });

    it('should call ngOnInit', () => {
        component.ngOnInit();
        expect(component.mockData).not.toBeNull();
    });

    it('should call addToCart method of DataEmitterService', async(inject([DataEmitterService], (dataEmitterService: DataEmitterService) => {
        const spy = spyOn(dataEmitterService, 'addToCart');
        component.addToCart('add to cart');
        expect(spy).toHaveBeenCalled();
    })
    ))

    it('should call addToWishList method of DataEmitterService', async(inject([DataEmitterService], (dataEmitterService: DataEmitterService) => {
        const spy = spyOn(dataEmitterService, 'addToWishList');
        component.addToWishList('add to wishList');
        expect(spy).toHaveBeenCalled();
    })
    ))

    it('should call addToCompare method of DataEmitterService', async(inject([DataEmitterService], (dataEmitterService: DataEmitterService) => {
        const spy = spyOn(dataEmitterService, 'addToCompare');
        component.addToCompare('add to Compare');
        expect(spy).toHaveBeenCalled();
    })
    ))

    it('should call calculateAverageRating and satisfy all conditions', () => {
        component.ngOnInit();
        component.mockData.averagRating = 0.5;
        component.calculateAverageRating();
        expect(component.mockData.averageRatingClass).toEqual('rating-one');

        component.mockData.averagRating = 2.0;
        component.calculateAverageRating();
        expect(component.mockData.averageRatingClass).toEqual('rating-two');

        component.mockData.averagRating = 3.0;
        component.calculateAverageRating();
        expect(component.mockData.averageRatingClass).toEqual('rating-three');

        component.mockData.averagRating = 4.0;
        component.calculateAverageRating();
        expect(component.mockData.averageRatingClass).toEqual('rating-four');

        component.mockData.averagRating = 4.6;
        component.calculateAverageRating();
        expect(component.mockData.averageRatingClass).toEqual('rating-five');

        component.mockData.averagRating = -3.5;
        component.calculateAverageRating();
        expect(component.mockData.averageRatingClass).toEqual('');
    });


    it('should call calculatePriceParameters and satisfy all conditions', () => {
        component.ngOnInit();
        component.mockData.showInformationalPrice = true;
        component.mockData.listPrice.value = 12;
        component.mockData.salePrice.value = 10;
        component.calculatePriceParameters();
        expect(component.finalPrice).toEqual(0);
        expect(component.greaterPrice).toEqual(0);

        component.mockData.listPrice.value = 10;
        component.mockData.salePrice.value = 12;
        component.calculatePriceParameters();
        expect(component.displayCondition).toEqual(false);

        component.mockData.listPrice.range = {};
        component.mockData.listPrice.range.minimumPrice = 100;
        component.mockData.listPrice.range.maximumPrice = 200;
        component.calculatePriceParameters();
        expect(component.oldPrice).toBe(100);

        component.mockData.listPrice.range = {};
        component.mockData.listPrice.range.minimumPrice = 100;
        component.mockData.listPrice.range.maximumPrice = 100;
        component.mockData.listPrice.value = 15;
        component.mockData.isProductMaster = true;
        component.calculatePriceParameters();
        expect(component.oldPrice).toBe('100');

        component.mockData.listPrice.range = {};
        component.mockData.listPrice.range.minimumPrice = 100;
        component.mockData.listPrice.range.maximumPrice = 100;
        component.mockData.listPrice.value = 15;
        component.mockData.isProductMaster = true;
        component.calculatePriceParameters();
        expect(component.oldPrice).toBe('100');

        component.mockData.listPrice.range = {};
        component.mockData.listPrice.range.minimumPrice = 100;
        component.mockData.listPrice.range.maximumPrice = 100;
        component.mockData.listPrice.value = 15;
        component.mockData.isProductMaster = false;
        component.calculatePriceParameters();
        expect(component.oldPrice).toBe('15');

        component.mockData.listPrice.range = {};
        component.mockData.listPrice.range.minimumPrice = 100;
        component.mockData.listPrice.range.maximumPrice = 100;
        component.mockData.listPrice.value = null;
        component.mockData.isProductMaster = false;
        component.calculatePriceParameters();
        expect(component.oldPrice).toBe('N/A');
    });

    it('should test if the tags are getting rendered', () => {
        fixture.detectChanges();
        expect(element.getElementsByTagName('img')).toBeDefined();
        const elem = element.getElementsByClassName('rating-display clearfix');
        expect(elem[0].children.length).toBe(7);
    });
});
