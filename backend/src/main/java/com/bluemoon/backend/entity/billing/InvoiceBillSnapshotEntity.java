package com.bluemoon.backend.entity.billing;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Historical snapshot of which bills were included in an invoice at creation time.
 * Once created, these records must never be modified or deleted.
 */
@Entity
@Table(name = "invoice_bill_snapshots")
@Getter
@Setter
@NoArgsConstructor
public class InvoiceBillSnapshotEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long invoiceId;

    @Column(nullable = false)
    private Long billId;

    public InvoiceBillSnapshotEntity(Long invoiceId, Long billId) {
        this.invoiceId = invoiceId;
        this.billId = billId;
    }
}
