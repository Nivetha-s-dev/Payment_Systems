import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Payment } from '../models/payment.interface';

@Injectable({
    providedIn: 'root'
})
export class PaymentService {
    private apiUrl = 'api/payments';

    constructor(private http: HttpClient) {}

    getPayments(page: number, limit: number, filters?: any): Observable<{data: Payment[], total: number}> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        if (filters) {
            Object.keys(filters).forEach(key => {
                if (filters[key]) {
                    params = params.set(key, filters[key]);
                }
            });
        }

        return this.http.get<{data: Payment[], total: number}>(this.apiUrl, { params });
    }

    createPayment(payment: Partial<Payment>): Observable<Payment> {
        return this.http.post<Payment>(this.apiUrl, payment);
    }

    updatePayment(id: string, payment: Partial<Payment>): Observable<Payment> {
        return this.http.put<Payment>(`${this.apiUrl}/${id}`, payment);
    }

    deletePayment(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    uploadEvidence(paymentId: string, file: File): Observable<any> {
        const formData = new FormData();
        formData.append('evidence', file);
        return this.http.post(`${this.apiUrl}/${paymentId}/evidence`, formData);
    }

    downloadEvidence(paymentId: string): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/${paymentId}/evidence`, {
            responseType: 'blob'
        });
    }
}
