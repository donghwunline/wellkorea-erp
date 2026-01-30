package com.wellkorea.backend.purchasing.infrastructure.service;

import com.wellkorea.backend.company.domain.Company;
import com.wellkorea.backend.company.domain.vo.RoleType;
import com.wellkorea.backend.company.infrastructure.persistence.CompanyRepository;
import com.wellkorea.backend.purchasing.domain.service.RfqItemFactory;
import com.wellkorea.backend.purchasing.domain.vo.RfqItem;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Infrastructure implementation of RfqItemFactory.
 * <p>
 * Validates that companies exist and have VENDOR or OUTSOURCE role
 * before creating RfqItems.
 */
@Service
public class RfqItemFactoryImpl implements RfqItemFactory {

    private final CompanyRepository companyRepository;

    public RfqItemFactoryImpl(CompanyRepository companyRepository) {
        this.companyRepository = companyRepository;
    }

    @Override
    public List<RfqItem> createRfqItems(List<Long> vendorIds) {
        List<RfqItem> items = new ArrayList<>();
        for (Long vendorId : vendorIds) {
            Company vendor = companyRepository.findById(vendorId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Vendor not found with ID: " + vendorId));

            if (!vendor.hasRole(RoleType.VENDOR) && !vendor.hasRole(RoleType.OUTSOURCE)) {
                throw new IllegalArgumentException(
                        "Company with ID " + vendorId + " is not a vendor");
            }
            // RfqItem constructor: vendorOfferingId=null (future: link to pre-configured offerings)
            items.add(new RfqItem(vendorId, null));
        }
        return items;
    }
}
