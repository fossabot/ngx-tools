<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Getting started](#getting-started)
  - [Step 1: The Module](#step-1-the-module)
  - [Step 2: Setup your claim map](#step-2-setup-your-claim-map)
  - [Step 3: Start collecting you token](#step-3-start-collecting-you-token)
  - [Step 4: Use the token for a service.](#step-4-use-the-token-for-a-service)
  - [Step 5: Request token escalation and retry](#step-5-request-token-escalation-and-retry)
  - [Step 6: Escalate a token when requested](#step-6-escalate-a-token-when-requested)
  - [Step 7: Profit!](#step-7-profit)
- [Other common patterns](#other-common-patterns)
  - [Renewal of a token](#renewal-of-a-token)
  - [Take action when all tokens expire](#take-action-when-all-tokens-expire)
  - [Pre-escalation of a token](#pre-escalation-of-a-token)
- [Testing Mocks](#testing-mocks)
  - [RetryWithEscalationMock](#retrywithescalationmock)
  - [TokenExtractorMock](#tokenextractormock)
  - [The Default Token](#the-default-token)
- [Selectors](#selectors)
  - [tokenFor<ClaimMap, ServiceName>(serviceName)](#tokenforclaimmap-servicenameservicename)
    - [Inputs](#inputs)
    - [Return Value](#return-value)
  - [claimsFor<ClaimMap, ServiceName>(serviceName)](#claimsforclaimmap-servicenameservicename)
    - [Inputs](#inputs-1)
    - [Return Value](#return-value-1)
  - [claimValue<ClaimMap, ServiceName, ClaimName>(serviceName, claimName)](#claimvalueclaimmap-servicename-claimnameservicename-claimname)
    - [Inputs](#inputs-2)
    - [Return Value](#return-value-2)
- [Actions](#actions)
- [StoreToken<ClaimMap>](#storetokenclaimmap)
  - [claimsFor<ClaimMap, ServiceName>(serviceName)](#claimsforclaimmap-servicenameservicename-1)
    - [Inputs](#inputs-3)
  - [Inputs / Properties](#inputs--properties)
- [TokenNearingExpiration<ClaimMap>](#tokennearingexpirationclaimmap)
  - [Inputs / Properties](#inputs--properties-1)
- [EscalateToken<ClaimMap>](#escalatetokenclaimmap)
  - [Inputs / Properties](#inputs--properties-2)
- [EscalationSuccess<ClaimMap>](#escalationsuccessclaimmap)
  - [Inputs / Properties](#inputs--properties-3)
- [EscalationFailed<ClaimMap>](#escalationfailedclaimmap)
  - [Inputs / Properties](#inputs--properties-4)
- [Claim Map](#claim-map)
  - [Example](#example)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->


# Getting started

This JWT management module provides everything you will need for the common JWT
use case in NGRX.


## Step 1: The Module

Import the module into your main application:

```typescript
import { JwtTokenManagementModule } from '@terminus/ngx-tools';

@NgModule({
  imports: [
    JwtTokenManagementModule.forRoot(),
  ],
})
export class AppModule {}
```

Check out your Redux Dev tools, you should now see the tokens store content and
effects have been setup.


## Step 2: Setup your claim map

The claim map provides strong types for your JWT token interaction.

In `app.claims.ts`

```typescript
export interface ClaimMap {
  'Service 1': {
    sub: string;
    exp: number;
  }
}
```

## Step 3: Start collecting you token

In `user-login.effects.ts`
```typescript
import { TokenExtractor } from '@terminus/ngx-tools';

  // ..snip
  @Effect()
  performLogin$ = this.actions$.ofType<Actions.LoginRequest>(Actions.ActionTypes.LoginRequest).pipe(
    switchMap((a) => {
      return this.http.post('/api/login', {
        username: a.username,
        password: a.password
      }, {
        observe: 'response' // extractJwtToken takes two return values:
                            //  1. A body of { token: 'new token' }. If this is the expected
                            //     return, this observe 'response' should be omitted.
                            //  2. A new token in the `Authorization` header.
                            //     in order to parse this response, `observe: 'response'` is require
      }).pipe(
          tokenName: 'Service 1',    // Will thrown TS error if not in ClaimMap
          isDefaultToken: true,      // Uses this token as the base escalation point
        }),
        map(() => new LoginSucceeded()),
        catchError((e) => new LoginFailed()),
      )
    })
  );

  constructor(
    public http: HttpClient, // Only works with HttpClient
    public tokenExtractor: TokenExtractor<ClaimMap>,
  ) { }
```

After you perform this login, you will see that the new token is stored in your state.

## Step 4: Use the token for a service.

In `some-service-related.effects.ts`

```typescript
import { tokenFor } from '@terminus/ngx-tools';

  // ..snip
  @Effect()
  performLogin$ = this.actions$.ofType<Actions.LoginRequest>(Actions.ActionTypes.LoginRequest).pipe(
    switchMap((a) => {
      return this.store.select(tokenFor<ClaimMap, 'Service 1'>('Service 1'))
        .pipe(
          switchMap( (token) => this.http.post('/do_something', {}, {
              headers: new HttpHeaders({
                Authorization: `Bearer ${token}`
              })
            }).pipe(
              this.retryer.retryWithEscalation('Service 1'),
              // Do stuff with the response
            )
          )
        )
    })
  );

  constructor(
    public http: HttpClient, // Only works with HttpClient
  ) { }
```

Now you will be making HTTP requests with the current token for the named service,
or the default token is no specific token is known.


## Step 5: Request token escalation and retry

In the normal flow for token escalation, un-escalated tokens will trigger a 403 response.
After a 403 the client is expected to reach out to an endpoint typically `/authorize` and
get a new token.

Continuation of the snippet above

```typescript
import { RetryWithEscalation } from '@terminus/ngx-tools';

  // ...snip
  .pipe(
    this.retryer.retryWithEscalation('Service 1'),
  )

  constructor(
    public http: HttpClient, // Only works with HttpClient
    public retryer: RetryWithEscalation<ClaimMap>, // Only works with HttpClient
  ) { }
```

This has the effect of catching 403, requesting escalation and waiting for escalation
success.

*If escalation is successful*, the stream the retry is attached to will be restarted.

Don't forget how RxJS handles retries, it will retry the entire observable stream
as is. That means that if your stream needs to fetch a new token for each retry.

We also provided a `regenerateOnRetry(() => Observable<any>)` method which can
be used to create a new observable on every retry.


*If escalation fails* an error with be thrown.

It will wait for a maximum of 30 seconds for success, then it will throw.

*Note:* You are using an [http retryer too right?](https://github.com/GetTerminus/ngx-tools/blob/master/ngx-tools/src/README.md#httpretryer)


## Step 6: Escalate a token when requested

After the first 403 is received, you need to provide instructions on how to escalate
the token.

In an effect file which makes sense for your application

```typescript
import { TokenEscalator } from '@terminus/ngx-tools';

@Effect()
public escalateService1$ = this.tokenEscalator.escalateToken({
  tokenName: 'Service 1',
  authorizeUrl: this.envService.pipe(                      // AuthorizeURL requires an observable,
    map((env) => `${env.SERVICE_1_HOSTNAME}/v1/authorize`),  // but can be a single omission observable
  ),                                                       // if that makes sense for your usage
})

constructor(
  public tokenEscalator: TokenEscalator,
  public envService: EnvService,
) { }
```


## Step 7: Profit!

At this point you have a full suite of helpers to manage JWT Escalation.


# Other common patterns

## Renewal of a token

```typescript
import {
  tokenFor,
  TokenEscalator,
  JwtTokenNearingExpiration,
  JwtTokenManagementActionTypes,
} from '@terminus/ngx-tools';

@Effect()
public renewService$ = this.actions$
  .ofType<JwtTokenNearingExpiration<ClaimMap>>(JwtTokenManagementActionTypes.TokenNearingExpiration)
  .pipe(
    filter((a) => a.tokenName === 'Service1'), // Limit work to only  the service we care about
    withLatestFrom(this.store.select(tokenFor<ClaimMap, 'Service1'>('Service1'))),
    filter(([a, existingToken]) => a.token === existingToken), // If the token nearing expiration isn't the current one
                                                               // don't waste time on it
    switchMap(([_, existingToken]) => this.http.get(
      '/new_token',
      {
        headers: new HttpHeaders({
          Authorization: `Bearer ${existingToken}`
        })
      })
      .pipe(
        this.tokenExtractor.extractJwtToken({tokenName: 'Service1'}),
      )
      .pipe(catchError(() => of(NullAction))), // What a failure means is unique to your
                                               // application
    ),
  )
```


## Take action when all tokens expire

```typescript
import {
  tokenFor,
  TokenEscalator,
  AllJwtTokensExpired,
  JwtTokenManagementActionTypes,
} from '@terminus/ngx-tools';

@Effect()
public logoutWhenAllTokensExpire$ = this.actions$
  .ofType<AllJwtTokensExpired>(JwtTokenManagementActionTypes.AllTokensExpired)
  .pipe(
    mergeMap(() => [
      new Logout(), // Take any actions required to log the user out
    ]),
  )
```


## Pre-escalation of a token

```typescript
import {
  tokenForWithoutDefault,
  JwtTokenManagementActions,
} from '@terminus/ngx-tools';

@Effect()
preescalateToken$ = this.actions$.ofType<SomeAction>(SomeActionType)
 .pipe(
   withLatestFrom(this.store.select(tokenForWithoutDefault('Service1'))),
   filter(([_, token]) => !token),
   map(() => new JwtTokenManagementActions<ClaimMap>.EscalateToken('Service1'))
 )
```

# Testing Mocks

Some testing mocks are included to provide quick hooks into captured tokens.


## RetryWithEscalationMock

This mock will track all token names which have had escalation requested in the
array `tokenEscalationsRequested`. You may also simulate failure and success (the default)
by triggering `escalationSuccessful`.

```typescript
import { RetryWithEscalationMock } from '@terminus/ngx-tools';

TestBed.configureTestingModule({
  providers: [
    // ..
    RetryWithEscalationMock.forTestBed(),
  ],
});

retryMock = TestBed.get(RetryWithEscalation);
```


## TokenExtractorMock

This mock will run through the process of extracting a token and store found tokens
in the array `extractedTokens`. It will throw if it fails to find a token.

```typescript
import { TokenExtractorMock } from '@terminus/ngx-tools';

TestBed.configureTestingModule({
  providers: [
    // ..
    TokenExtractorMock.forTestBed(),
  ],
});

extractorMock = TestBed.get(TokenExtractor);
```


## The Default Token

A default token is not required, but is recommended. When no token is present for
the token named, the default (un-escalated token) will be used.


# Selectors

JwtTokenManagmentModule provides selectors for inspecting the current token for
a given named token.


## tokenFor<ClaimMap, ServiceName>(serviceName)

Provides the specific token for the provided service name, or the default token
if no specific token is known.


### Inputs

* `serviceName` - Must be a known key of `ClaimMap`


### Return Value

String of the token, or undefined if no default token is known.


## claimsFor<ClaimMap, ServiceName>(serviceName)

Provides the specific token for the provided service name, or the default token
if no specific token is known.


### Inputs

* `serviceName` - Must be a known key of `ClaimMap`


### Return Value

If the token is valid: The data shape of the `ClaimMap[ServiceName]` interface definition.
If the token is invalid: `null`

A valid token is one that can be decoded without respect to expiration date.


## claimValue<ClaimMap, ServiceName, ClaimName>(serviceName, claimName)

Provides the specific token for the provided service name, or the default token
if no specific token is known.


### Inputs

* `serviceName` - Must be a known key of `ClaimMap`
* `claimName` - Must be a known key of `ClaimMap[ServiceName]`


### Return Value

If the token is valid: The data shape of the `ClaimMap[ServiceName][ClaimName]` interface definition.
If the token is invalid: `null`

A valid token is one that can be decoded without respect to expiration date.


# Actions

# StoreToken<ClaimMap>

Provides a new token for storage in the JWT Managment system.


## claimsFor<ClaimMap, ServiceName>(serviceName)

Provides the specific token for the provided service name, or the default token
if no specific token is known.


### Inputs

* `serviceName` - Must be a known key of `ClaimMap`


## Inputs / Properties

* `tokenName` - Must be a key of the [ClaimMap](#claim_map)
* `token` - string of the encoded token
* `isDefaultToken` - indicates that this token is to be used as the default token

# TokenNearingExpiration<ClaimMap>

This action is emitted when the named token is nearing expiration.


## Inputs / Properties

* `tokenName` - Must be a key of the [ClaimMap](#claim_map)
* `token` - string of the encoded token


# EscalateToken<ClaimMap>

This action is emitted when escalation has been determined to be necessary.


## Inputs / Properties

* `tokenName` - Must be a key of the [ClaimMap](#claim_map)


# EscalationSuccess<ClaimMap>

This action is emitted when escalation has been completed successfully.


## Inputs / Properties

* `tokenName` - Must be a key of the [ClaimMap](#claim_map)


# EscalationFailed<ClaimMap>

This action is emitted when escalation has failed.


## Inputs / Properties

* `tokenName` - Must be a key of the [ClaimMap](#claim_map)


# Claim Map

The claim map provides typings for all of the known tokens your application uses.
These typings are used to verify consistent and limited naming.

The use of a single claim map is recommended across the entire application.

**NOTE:** Consider the token life cycle during the escalation process. Ensure
claims that are to be added after hitting the `/authorize` endpoint are listed
as potentially undefined.


## Example

```typescript
import { ClaimMap } from '@ngx-tools/jwt-token-manament';

export interface AppClaimMap implements ClaimMap {
  'Application': {
    'sub': string;
    'claim_foo'?: boolean;
  };
  'Other Application': {
    'sub': string;
    'other thing'?: number;
  }

}
```
