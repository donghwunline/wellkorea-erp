package com.wellkorea.backend.shared.storage.infrastructure.persistence;

import com.wellkorea.backend.shared.storage.domain.Attachment;
import com.wellkorea.backend.shared.storage.domain.AttachmentOwnerType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Attachment entities.
 */
@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, Long> {

    /**
     * Find all attachments for a specific owner.
     *
     * @param ownerType Type of the owning entity
     * @param ownerId   ID of the owning entity
     * @return List of attachments
     */
    List<Attachment> findByOwnerTypeAndOwnerId(AttachmentOwnerType ownerType, Long ownerId);

    /**
     * Find first attachment for a specific owner.
     * Useful when owner is expected to have only one attachment (e.g., delivery photo).
     *
     * @param ownerType Type of the owning entity
     * @param ownerId   ID of the owning entity
     * @return Optional attachment
     */
    Optional<Attachment> findFirstByOwnerTypeAndOwnerId(AttachmentOwnerType ownerType, Long ownerId);

    /**
     * Check if an attachment exists for a specific owner.
     *
     * @param ownerType Type of the owning entity
     * @param ownerId   ID of the owning entity
     * @return true if at least one attachment exists
     */
    boolean existsByOwnerTypeAndOwnerId(AttachmentOwnerType ownerType, Long ownerId);

    /**
     * Delete all attachments for a specific owner.
     *
     * @param ownerType Type of the owning entity
     * @param ownerId   ID of the owning entity
     */
    void deleteByOwnerTypeAndOwnerId(AttachmentOwnerType ownerType, Long ownerId);
}
