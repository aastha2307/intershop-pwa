import { Observable } from 'rxjs/Observable';
import { LocalizeRouterService } from './routes-parser-locale-currency/localize-router.service';
import { Injector } from '@angular/core';
import { getTestBed, TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { CustomErrorHandler } from './custom-error-handler';
import { MockApiService } from '../services/mock-api-service';
import { ApiService } from './api.service';

class DummyCustomErrorHandler {
}

class DummyTraslateService {
  parser = {
    currentLocale: { lang: 'en', currency: 'USD' }
  };
}

class DummyHttpClient {
  get(url: string, options: {}): Observable<any> {
    return Observable.of({ 'type': 'get' });
  }

  put(path: string, body: {}): Observable<any> {
    return Observable.of({ 'type': 'put' });
  }

  post(path: string, body: {}): Observable<any> {
    return Observable.of({ 'type': 'post' });
  }

  delete(path: string): Observable<any> {
    return Observable.of({ 'type': 'delete' });
  }
}

class MockApiStub {
  get(path, headers, url) {
    return Observable.of('1');
  }
}

describe('ApiService', () => {
  let injector: Injector;
  let localizeRouterService: LocalizeRouterService;
  let apiService: ApiService;
  let customErrorHandler: CustomErrorHandler;
  let httpClient: HttpClient;
  let mockApi: MockApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: HttpClient, useClass: DummyHttpClient },
        { provide: CustomErrorHandler, useClass: DummyCustomErrorHandler },
        { provide: LocalizeRouterService, useClass: DummyTraslateService },
        { provide: MockApiService, useClass: MockApiStub },
      ]
    });

    injector = getTestBed();
    localizeRouterService = injector.get(LocalizeRouterService);
    customErrorHandler = injector.get(CustomErrorHandler);
    httpClient = injector.get(HttpClient);
    mockApi = injector.get(MockApiService);


    apiService = new ApiService(httpClient, customErrorHandler, mockApi, localizeRouterService);
  });

  afterEach(() => {
    injector = void 0;
    localizeRouterService = void 0;
    apiService = void 0;
  });

  it('should return an observable on calling of GET().', () => {


    let returnVal;
    apiService.get('', null).subscribe((res) => {
      returnVal = res;
    });

    expect(returnVal).toEqual('1');
  });

  it('should return an observable on calling of PUT().', () => {
    let returnVal;
    apiService.put('', null).subscribe((res) => {
      returnVal = res;
    });
    expect(returnVal.type).toEqual('put');
  });

  it('should return an observable on calling of POST().', () => {
    let returnVal;
    apiService.post('', null).subscribe((res) => {
      returnVal = res;
    });
    expect(returnVal.type).toEqual('post');
  });

  it('should return an observable on calling of DELETE().', () => {
    let returnVal;
    apiService.delete('').subscribe((res) => {
      returnVal = res;
    });
    expect(returnVal.type).toEqual('delete');
  });
});
