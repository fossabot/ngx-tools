/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */


/**
 * Creates a browser MouseEvent with the specified options.
 *
 * @example
 * createMouseEvent('click');
 * createMouseEvent('click', 212, 433);
 *
 * @param type - The event type
 * @param x - The location on the X axis
 * @param y - The location on the Y axis
 * @return The event
 */
export function createMouseEvent(type: string, x: number = 0, y: number = 0): MouseEvent {
  const event: MouseEvent = document.createEvent('MouseEvent');

  event.initMouseEvent(type,
    false, // canBubble
    false, // cancelable
    window, // view
    0, // detail
    x, // screenX
    y, // screenY
    x, // clientX
    y, // clientY
    false, // ctrlKey
    false, // altKey
    false, // shiftKey
    false, // metaKey
    0, // button
    null, // relatedTarget
  );

  return event;
}


/**
 * Creates a browser TouchEvent with the specified pointer coordinates.
 *
 * @example
 * createTouchEvent('touchstart');
 * createTouchEvent('touchstart', 212, 433);
 *
 * @param type - The touch event type
 * @param pageX - The location on the X axis
 * @param pageY - The location on the Y axis
 */
export function createTouchEvent(type: string, pageX: number = 0, pageY: number = 0): UIEvent {
  // In favor of creating events that work for most of the browsers, the event is created
  // as a basic UI Event. The necessary details for the event will be set manually.
  const event: UIEvent = document.createEvent('UIEvent');
  const touchDetails = {pageX, pageY};

  event.initUIEvent(type, true, true, window, 0);

  // Most of the browsers don't have a "initTouchEvent" method that can be used to define
  // the touch details.
  Object.defineProperties(event, {
    touches: {value: [touchDetails]},
  });

  return event;
}


/**
 * Dispatches a keydown event from an element.
 *
 * @example
 * createKeyboardEvent('keydown', ENTER, myInputNativeElement);
 *
 * @param type - The event type
 * @param keyCode - The event key code
 * @param target - The target element
 * @param key - The key
 * @return The event
 */
export function createKeyboardEvent(
  type: string,
  keyCode: number,
  target?: Element,
  key?: string,
): KeyboardEvent {
  // NOTE: Cannot 'type' the event here due to the note about FireFox below
  const event = document.createEvent('KeyboardEvent') as any;
  // Firefox does not support `initKeyboardEvent`, but supports `initKeyEvent`.
  const initEventFn = (event.initKeyEvent || event.initKeyboardEvent).bind(event);
  const originalPreventDefault = event.preventDefault;

  initEventFn(type, true, true, window, 0, 0, 0, 0, 0, keyCode);

  // Webkit Browsers don't set the keyCode when calling the init function.
  // See related bug https://bugs.webkit.org/show_bug.cgi?id=16735
  Object.defineProperties(event, {
    keyCode: { get: () => keyCode },
    key: { get: () => key },
    target: { get: () => target },
  });

  // IE won't set `defaultPrevented` on synthetic events so we need to do it manually.
  event.preventDefault = function() {
    Object.defineProperty(event, 'defaultPrevented', { get: () => true });
    return originalPreventDefault.apply(this, arguments);
  };

  return event as KeyboardEvent;
}


/**
 * Creates a fake event object with any desired event type.
 *
 * @example
 * createFakeEvent('focus');
 *
 * @param type - The event type
 * @param canBubble - Define if the event can bubble up the DOM
 * @param type - Define if the event is cancelable
 * @return The event
 */
export function createFakeEvent(
  type: string,
  canBubble: boolean = true,
  cancelable: boolean = true,
): Event {
  const event: Event = document.createEvent('Event');
  event.initEvent(type, canBubble, cancelable);

  return event;
}
