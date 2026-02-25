import { onSnapshot } from 'firebase/firestore';
import { Observable } from 'rxjs';

export function collection$<T>(ref: any): Observable<T[]> {
  return new Observable((observer) => {
    const unsub = onSnapshot(
      ref,
      (snap: any) => observer.next(snap.docs.map((d: any) => d.data() as T)),
      (err: any) => observer.error(err),
    );
    return () => unsub();
  });
}

export function doc$<T>(ref: any): Observable<T | null> {
  return new Observable((observer) => {
    const unsub = onSnapshot(
      ref,
      (snap: any) => observer.next(snap.exists() ? (snap.data() as T) : null),
      (err: any) => observer.error(err),
    );
    return () => unsub();
  });
}
