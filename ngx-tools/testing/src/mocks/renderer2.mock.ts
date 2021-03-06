import { Renderer2 } from '@angular/core';


/**
 * A mock of the Angular Renderer2
 */
export class Renderer2Mock implements Renderer2 {
  _data: any;
  addClass() {}
  appendChild() {}
  createComment() {}
  set data(v: any) { this._data = v; }
  get data(): any { return this._data; }
  destroy() {}
  destroyNode() {}
  insertBefore() {}
  nextSibling() {}
  parentNode() {}
  removeAttribute() {}
  removeChild() {}
  removeClass() {}
  removeStyle() {}
  setAttribute() {}
  setProperty() {}
  setStyle() {}
  setValue() {}
  animate() {}
  attachViewAfter() {}
  createElement() {}
  createTemplateAnchor() {}
  createText() {}
  createViewRoot() {}
  destroyView() {}
  detachView() {}
  invokeElementMethod() {}
  listen() { return () => {}; }
  listenGlobal() { return () => {}; }
  projectNodes() {}
  selectRootElement() {}
  setBindingDebugInfo() {}
  setElementAttribute() {}
  setElementClass() {}
  setElementProperty() {}
  setElementStyle() {}
  setText() {}
}
