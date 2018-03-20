<h1>Coercion</h1>

**Import from:** `@terminus/ngx-tools/coercion`

```typescript
// Example usage:
import { coerceBooleanProperty } from '@terminus/ngx-tools/coercion';

coerceBooleanProperty('true'); // Returns: true
```


<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [`coerceArray`](#coercearray)
- [`coerceBooleanProperty`](#coercebooleanproperty)
- [`coerceNumberProperty`](#coercenumberproperty)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->


### `coerceArray`

Wraps the provided value in an array, unless the provided value is an array.

```typescript
import { coerceArray } from '@terminus/ngx-tools/coercion';

coerceArray('foo'); // Returns: ['foo']
```


### `coerceBooleanProperty`

Coerces a value to a boolean.

```typescript
import { coerceBooleanProperty } from '@terminus/ngx-tools/coercion';

coerceBooleanProperty('true'); // Returns: true
```


### `coerceNumberProperty`

Coerces a value to a number.

```typescript
import { coerceNumberProperty } from '@terminus/ngx-tools/coercion';

coerceBooleanProperty('12'); // Returns: 12
```