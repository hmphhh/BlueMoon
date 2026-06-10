package com.bluemoon.backend.repository;

import java.util.List;

import com.bluemoon.backend.entity.InvoiceBillSnapshotEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvoiceBillSnapshotRepository extends JpaRepository<InvoiceBillSnapshotEntity, Long> {

    List<InvoiceBillSnapshotEntity> findByInvoiceId(Long invoiceId);
}
