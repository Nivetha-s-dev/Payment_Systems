// payment-list.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PaymentService } from '../../services/payment.service';
import { ErrorHandlingService } from '../../services/error-handling.service';
import { Payment, PaymentStatus } from '../../models/payment.interface';
import { PaymentFormComponent } from '../payment-form/payment-form.component';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { FormControl } from '@angular/forms';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
    selector: 'app-payment-list',
    templateUrl: './payment-list.component.html',
    styleUrls: ['./payment-list.component.scss']
})
export class PaymentListComponent implements OnInit {
    payments: Payment[] = [];
    totalPayments = 0;
    pageSize = 10;
    searchControl = new FormControl('');
    displayedColumns = ['payee_name', 'due_date', 'due_amount', 'status', 'total_due', 'actions'];
    private destroy$ = new Subject<void>();

    @ViewChild(MatPaginator) paginator!: MatPaginator;

    constructor(
        private paymentService: PaymentService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private errorHandler: ErrorHandlingService
    ) {}

    ngOnInit() {
        this.loadPayments();
        this.setupSearchSubscription();
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private setupSearchSubscription() {
        this.searchControl.valueChanges
            .pipe(
                debounceTime(300),
                takeUntil(this.destroy$)
            )
            .subscribe(() => {
                if (this.paginator) {
                    this.paginator.firstPage();
                }
                this.loadPayments();
            });
    }

    loadPayments() {
        const filters = {
            search: this.searchControl.value
        };

        this.paymentService.getPayments(
            this.paginator?.pageIndex || 0,
            this.pageSize,
            filters
        ).subscribe({
            next: (response) => {
                this.payments = response.data;
                this.totalPayments = response.total;
            },
            error: (error) => this.errorHandler.handleError(error)
        });
    }

    openPaymentDialog(payment?: Payment) {
        const dialogRef = this.dialog.open(PaymentFormComponent, {
            width: '600px',
            data: payment,
            disableClose: true
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadPayments();
                this.snackBar.open(
                    `Payment successfully ${payment ? 'updated' : 'created'}`,
                    'Close',
                    { duration: 3000 }
                );
            }
        });
    }

    deletePayment(payment: Payment) {
        const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
            width: '400px',
            data: {
                title: 'Confirm Deletion',
                message: `Are you sure you want to delete the payment for ${payment.payee_name}?`
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.paymentService.deletePayment(payment._id).subscribe({
                    next: () => {
                        this.loadPayments();
                        this.snackBar.open('Payment deleted successfully', 'Close', {
                            duration: 3000
                        });
                    },
                    error: (error) => this.errorHandler.handleError(error)
                });
            }
        });
    }

    downloadEvidence(payment: Payment) {
        this.paymentService.downloadEvidence(payment._id).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `evidence_${payment._id}${this.getFileExtension(blob)}`;
                link.click();
                window.URL.revokeObjectURL(url);
            },
            error: (error) => this.errorHandler.handleError(error)
        });
    }

    private getFileExtension(blob: Blob): string {
        switch (blob.type) {
            case 'application/pdf':
                return '.pdf';
            case 'image/jpeg':
                return '.jpg';
            case 'image/png':
                return '.png';
            default:
                return '';
        }
    }
}
