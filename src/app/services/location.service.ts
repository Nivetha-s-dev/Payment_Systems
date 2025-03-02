import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class LocationService {
    private baseUrl = 'https://countriesnow.space/api/v0.1';

    constructor(private http: HttpClient) {}

    getCountries(): Observable<string[]> {
        return this.http.get<any>(`${this.baseUrl}/countries`)
            .pipe(map(response => response.data.map((item: any) => item.country)));
    }

    getStates(country: string): Observable<string[]> {
        return this.http.post<any>(`${this.baseUrl}/countries/states`, { country })
            .pipe(map(response => response.data.states.map((state: any) => state.name)));
    }

    getCities(country: string, state: string): Observable<string[]> {
        return this.http.post<any>(`${this.baseUrl}/countries/state/cities`, {
            country,
            state
        }).pipe(map(response => response.data));
    }

    getCurrencies(): Observable<string[]> {
        return this.http.get<any>(`${this.baseUrl}/currencies`)
            .pipe(map(response => response.data));
    }
}
