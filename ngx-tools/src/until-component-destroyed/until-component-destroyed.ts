import {
  Observable,
  ReplaySubject,
} from 'rxjs';
import { takeUntil } from 'rxjs/operators';


/**
 * An interface that requires ngOnDestroy
 */
export interface WithOnDestroy {
  ngOnDestroy(): void;
  [key: string]: any;
}


/**
 * Patch the component with unsubscribe behavior
 *
 * @param component - The component class (`this` context)
 * @return An observable representing the unsubscribe event
 */
export function componentDestroyed(component: WithOnDestroy): Observable<true> {
  if (component.componentDestroyed$) {
    return component.componentDestroyed$;
  }

  const oldNgOnDestroy: Function | undefined = component.ngOnDestroy;
  const stop$: ReplaySubject<true> = new ReplaySubject<true>();

  component.ngOnDestroy = () => {
    // istanbul ignore else
    if (oldNgOnDestroy) {
      oldNgOnDestroy.apply(component);
    }

    stop$.next(true);
    stop$.complete();
  };

  return component.componentDestroyed$ = stop$.asObservable();
}


/**
 * A pipe-able operator to unsubscribe during OnDestroy lifecycle event
 *
 * @param component - The component class (`this` context)
 * @return The component wrapped in an Observable
 */
export function untilComponentDestroyed<T>(component: WithOnDestroy): (source: Observable<T>) => Observable<T> {
  return (source: Observable<T>) => source.pipe(takeUntil(componentDestroyed(component)));
}
