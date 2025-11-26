package com.wellkorea.erp.domain.product;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for ProductType entity
 */
@Repository
public interface ProductTypeRepository extends JpaRepository<ProductType, UUID> {

    Optional<ProductType> findByName(String name);

    List<ProductType> findByActiveTrue();

    boolean existsByName(String name);
}
