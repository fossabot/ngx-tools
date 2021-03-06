import {
  Component,
  OnInit,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

import {
  retryWithBackoff,
  exponentialBackoffDelayCalculator,
  DelayCalculator,
  TsWindowService,
  TsDocumentService,
} from '@terminus/ngx-tools';

import { emailRegex } from '@terminus/ngx-tools/regex';
console.log('emailRegex: ', emailRegex.test('foo@bar.com'), emailRegex.test('foo'));

import { ZERO } from '@terminus/ngx-tools/keycodes';
console.log('ZERO: ', ZERO);

import { coerceBooleanProperty } from '@terminus/ngx-tools/coercion';
console.log('coerceBooleanProperty: ', coerceBooleanProperty(''));




export interface GithubApi {
  items: GithubIssue[];
  total_count: number;
}

export interface GithubIssue {
  created_at: string;
  number: string;
  state: string;
  title: string;
}

/**
 * An example database that the data source uses to retrieve data for the table.
 */
export class ExampleHttpDao {
  tries: number = 0;

  constructor(private http: HttpClient) {}

  getRepoIssues(): any {
    const href = 'https://api.github.com/search/issues?q=repo:GetTerminus/terminus-ui';
    this.tries = 0;
    return this.http.get<GithubApi>(`${href}`)
      .pipe(
        map((i) => {
          console.log('in API: this.tries: ', this.tries);
          this.tries++;
          if (this.tries < 3) {
            throw new Error('no soup for you');
          }
          return i;
        }),
      );
  }
}




@Component({
  selector: 'demo-home',
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  exampleDatabase: ExampleHttpDao;
  issues$: any;
  totalCount: number | undefined;
  window: Window;
  document: Document;


  constructor(
    private http: HttpClient,
    private windowService: TsWindowService,
    private documentService: TsDocumentService,
  ) {
    this.exampleDatabase = new ExampleHttpDao(this.http);
    this.window = this.windowService.nativeWindow;
    this.document = this.documentService.document;

    /*
     *console.log('this.document: ', this.document);
     *console.log('this.window: ', this.window);
     */
  }

  public ngOnInit() {
    console.log('HOME: ngOnInit');

    this.issues$ = this.getIssues();
    this.issues$.subscribe((v: any) => {
      this.totalCount = v.total_count;
    });
  }

  public getIssues(): Observable<GithubApi | null> {
    const calcOpts: DelayCalculator = {
      jitter: true,
      jitterFactor: .3,
      backOffFactor: 2,
      baseWaitTime: 100,
    };

    return this.exampleDatabase.getRepoIssues()
      .pipe(
        map((res: GithubApi) => {
          if (res) {
            console.log('getIssues: res: ', res);
            return res;

          } else {
            console.log('getIssues: no res');
            return null;
          }
        }),
        retryWithBackoff({retries: 3, delayCalculator: exponentialBackoffDelayCalculator(calcOpts)}),
      )
    ;
  }
}

