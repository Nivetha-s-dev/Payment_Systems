import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PaymentService } from '../../services/payment.service';
import { LocationService } from '../../services/location.service';
import { Payment, PaymentStatus } from '../../models/payment.interface';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
    selector: 'app-payment-form',
    templateUrl: './payment-form.component.html',
    styleUrls: ['./payment-form.component.scss']
})
export class PaymentFormComponent implements OnInit {
    paymentForm: FormGroup;
    isEditMode: boolean = false;
    PaymentStatus = PaymentStatus;
    selectedFile: File | null = null;
    countries: string[] = [];
    states: string[] = [];
    cities: string[] = [];
    currencies: string[] = [];
    filteredCountries: Observable<string[]>;
    filteredCurrencies: Observable<string[]>;

    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<PaymentFormComponent>,
        private paymentService: PaymentService,
        private locationService: LocationService,
        @Inject(MAT_DIALOG_DATA) public data: Payment
    ) {
        this.isEditMode = !!data;
        this.createForm();
    }

    ngOnInit() {
        this.loadLocationData();
        this.setupAutoComplete();
    }

    get showEvidenceUpload(): boolean {
        return this.paymentForm.get('status')?.value === PaymentStatus.COMPLETED;
    }

    get evidenceRequired(): boolean {
        return this.showEvidenceUpload && !this.selectedFile && !this.data?.evidence_file;
    }

    private createForm() {
        this.paymentForm = this.fb.group({
            payee_name: ['', Validators.required],
            due_date: ['', Validators.required],
            due_amount: ['', [Validators.required, Validators.min(0)]],
            status: [this.isEditMode ? this.data.status : PaymentStatus.PENDING],
            country: ['', Validators.required],
            state: ['', Validators.required],
            city: ['', Validators.required],
            currency: ['', Validators.required]
        });

        if (this.isEditMode) {
            this.paymentForm.patchValue({
                ...this.data,
                country: this.data.address.country,
                state: this.data.address.state,
                city: this.data.address.city
            });
        }
    }

    private loadLocationData() {
        this.locationService.getCountries().subscribe(countries => {
            this.countries = countries;
        });

        this.locationService.getCurrencies().subscribe(currencies => {
            this.currencies = currencies;
        });

        this.paymentForm.get('country')?.valueChanges.subscribe(country => {
            if (country) {
                this.locationService.getStates(country).subscribe(states => {
                    this.states = states;
                });
            }
        });

        this.paymentForm.get('state')?.valueChanges.subscribe(state => {
            const country = this.paymentForm.get('country')?.value;
            if (country && state) {
                this.locationService.getCities(country, state).subscribe(cities => {
                    this.cities = cities;
                });
            }
        });
    }

    private setupAutoComplete() {
        this.filteredCountries = this.paymentForm.get('country')!.valueChanges.pipe(
            startWith(''),
            map(value => this._filter(this.countries, value))
        );

        this.filteredCurrencies = this.paymentForm.get('currency')!.valueChanges.pipe(
            startWith(''),
            map(value => this._filter(this.currencies, value))
        );
    }

    private _filter(options: string[], value: string): string[] {
        const filterValue = value.toLowerCase();
        return options.filter(option => option.toLowerCase().includes(filterValue));
    }

    onFileSelected(event: any) {
        this.selectedFile = event.target.files[0];
    }

    onSubmit() {
        if (this.paymentForm.valid && !this.evidenceRequired) {
            const formValue = this.paymentForm.value;
            const payment: Partial<Payment> = {
                payee_name: formValue.payee_name,
                due_date: formValue.due_date,
                due_amount: formValue.due_amount,
                status: formValue.status,
                address: {
                    country: formValue.country,
                    state: formValue.state,
                    city: formValue.city
                },
                currency: formValue.currency
            };

            const savePayment = () => {
                if (this.isEditMode) {
                    this.paymentService.updatePayment(this.data._id, payment).subscribe({
                        next: () => this.dialogRef.close(true)
                    });
                } else {
                    this.paymentService.createPayment(payment).subscribe({
                        next: () => this.dialogRef.close(true)
                    });
                }
            };

            if (this.selectedFile && this.showEvidenceUpload) {
                this.paymentService.uploadEvidence(this.data._id, this.selectedFile)
                    .subscribe({
                        next: () => savePayment()
                    });
            } else {
                savePayment();
            }
        }
    }

    onCancel() {
        this.dialogRef.close();
    }
}
