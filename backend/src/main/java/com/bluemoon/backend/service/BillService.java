package com.bluemoon.backend.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.bluemoon.backend.dtos.request.CreateBillRequest;
import com.bluemoon.backend.entity.ApartmentEntity;
import com.bluemoon.backend.entity.BillEntity;
import com.bluemoon.backend.entity.UserEntity;
import com.bluemoon.backend.enums.BillStatus;
import com.bluemoon.backend.enums.BillType;
import com.bluemoon.backend.exceptions.InvalidOperationException;
import com.bluemoon.backend.exceptions.ResourceNotFoundException;
import com.bluemoon.backend.repository.ApartmentRepository;
import com.bluemoon.backend.repository.BillRepository;

@Service
public class BillService {

    @Autowired
    private BillRepository billRepository;

    @Autowired
    private ApartmentRepository apartmentRepository;

    /**
     * Create a new bill for an apartment.
     */
    public BillEntity createBill(CreateBillRequest request, UserEntity createdBy) {
        // Validate apartment exists
        ApartmentEntity apartment = apartmentRepository
                .findByApartmentNumber(request.getApartmentNumber())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Apartment not found: " + request.getApartmentNumber()));

        // Parse bill type
        BillType billType;
        try {
            billType = BillType.valueOf(request.getBillType().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new InvalidOperationException("Invalid bill type: " + request.getBillType());
        }

        BillEntity bill = new BillEntity();
        bill.setApartment(apartment);
        bill.setBillType(billType);
        bill.setAmount(request.getAmount());
        bill.setDescription(request.getDescription());
        bill.setDueDate(request.getDueDate());
        bill.setStatus(BillStatus.UNPAID);
        bill.setCreatedBy(createdBy);

        return billRepository.save(bill);
    }

    /**
     * Get all bills (for admin).
     */
    public List<BillEntity> getAllBills() {
        return billRepository.findAllByOrderByCreatedAtDesc();
    }

    /**
     * Get bills for a specific apartment (for resident).
     */
    public List<BillEntity> getBillsByApartment(String apartmentNumber) {
        return billRepository.findByApartment_ApartmentNumberOrderByCreatedAtDesc(apartmentNumber);
    }

    /**
     * Update bill status (e.g. mark as paid).
     */
    public BillEntity updateBillStatus(Long billId, BillStatus status) {
        BillEntity bill = billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with id: " + billId));
        bill.setStatus(status);
        return billRepository.save(bill);
    }
}
