import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public user$: Observable<any>;  // This observable emits the user with their role

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private router: Router
  ) {
    // Track authentication state and get user role from Firestore
    this.user$ = this.afAuth.authState.pipe(
      switchMap((user) => {
        if (user) {
          // Get additional user data (like role) from Firestore
          return this.firestore.doc(`users/${user.uid}`).valueChanges();
        } else {
          return of(null);  // No user is logged in
        }
      }),
      tap((user) => {
        if (user) {
          console.log('User logged in:', user);
        } else {
          console.log('No user logged in.');
        }
      })
    );
  }

  async login(email: string, password: string) {
    const userCredential = await this.afAuth.signInWithEmailAndPassword(
      email,
      password
    );
    const user = userCredential.user;
    console.log('Logged in as:', user);
    if (user) {
      const userDoc:any = await this.firestore.doc(`users/${user.uid}`).ref.get();
      const role = userDoc.data()?.['role'];

      if (role === 'admin') {
        this.router.navigate(['/admin']);
      } else if (role === 'staff') {
        this.router.navigate(['/user']);
      } else {
        throw new Error('Unauthorized access');
      }
    }
  }

  async logout() {
    await this.afAuth.signOut();
    this.router.navigate(['/login']);
  }
}