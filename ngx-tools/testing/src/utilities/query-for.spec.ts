import {
  TestBed,
  async,
} from '@angular/core/testing';
import {
  Component,
  DebugElement,
} from '@angular/core';

import { queryFor } from './query-for';


@Component({
  template: `
    <div class="foo"></div>
    <div id="bar" class="baz"></div>
  `,
})
class TestComponent {}


describe(`queryFor`, () => {

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        TestComponent,
      ],
    }).compileComponents();
  }));


  test(`should return a DebugElement`, () => {
    const fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();
    const div1: DebugElement = queryFor(fixture, '.foo');
    const div2: DebugElement = queryFor(fixture, '#bar');

    expect(div1).toBeTruthy();
    expect(div1.nativeElement.classList).toContain('foo');

    expect(div2).toBeTruthy();
    expect(div2.nativeElement.classList).toContain('baz');
  });

});
