package com.wellkorea.erp.domain.document;

import com.wellkorea.erp.domain.customer.Customer;
import com.wellkorea.erp.domain.jobcode.JobCode;
import com.wellkorea.erp.domain.product.Product;
import com.wellkorea.erp.domain.user.User;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Document metadata entity with polymorphic ownership support
 */
@Entity
@Table(name = "documents", indexes = {
        @Index(name = "idx_documents_owner", columnList = "owner_type,owner_id"),
        @Index(name = "idx_documents_jobcode", columnList = "jobcode_id"),
        @Index(name = "idx_documents_product", columnList = "product_id"),
        @Index(name = "idx_documents_type", columnList = "document_type"),
        @Index(name = "idx_documents_archived", columnList = "is_archived")
})
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "filename", nullable = false)
    private String filename;

    @Column(name = "original_filename", nullable = false)
    private String originalFilename;

    @Column(name = "file_type", length = 50)
    private String fileType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "storage_path", nullable = false, length = 500)
    private String storagePath;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", length = 50)
    private DocumentType documentType;

    @Column(name = "owner_type", length = 50)
    private String ownerType;

    @Column(name = "owner_id")
    private UUID ownerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "jobcode_id")
    private JobCode jobcode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @Column(name = "version")
    private Integer version = 1;

    @Column(name = "is_archived")
    private boolean archived = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by")
    private User uploadedBy;

    @Column(name = "uploaded_at", nullable = false)
    private Instant uploadedAt;

    protected Document() {
        // JPA requires default constructor
    }

    public Document(String filename, String originalFilename, String storagePath) {
        this.filename = filename;
        this.originalFilename = originalFilename;
        this.storagePath = storagePath;
        this.uploadedAt = Instant.now();
    }

    public void archive() {
        this.archived = true;
    }

    public void incrementVersion() {
        this.version++;
    }

    // Getters and setters
    public UUID getId() {
        return id;
    }

    public String getFilename() {
        return filename;
    }

    public void setFilename(String filename) {
        this.filename = filename;
    }

    public String getOriginalFilename() {
        return originalFilename;
    }

    public void setOriginalFilename(String originalFilename) {
        this.originalFilename = originalFilename;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public String getStoragePath() {
        return storagePath;
    }

    public void setStoragePath(String storagePath) {
        this.storagePath = storagePath;
    }

    public DocumentType getDocumentType() {
        return documentType;
    }

    public void setDocumentType(DocumentType documentType) {
        this.documentType = documentType;
    }

    public String getOwnerType() {
        return ownerType;
    }

    public void setOwnerType(String ownerType) {
        this.ownerType = ownerType;
    }

    public UUID getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(UUID ownerId) {
        this.ownerId = ownerId;
    }

    public JobCode getJobcode() {
        return jobcode;
    }

    public void setJobcode(JobCode jobcode) {
        this.jobcode = jobcode;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(Customer customer) {
        this.customer = customer;
    }

    public Integer getVersion() {
        return version;
    }

    public void setVersion(Integer version) {
        this.version = version;
    }

    public boolean isArchived() {
        return archived;
    }

    public void setArchived(boolean archived) {
        this.archived = archived;
    }

    public User getUploadedBy() {
        return uploadedBy;
    }

    public void setUploadedBy(User uploadedBy) {
        this.uploadedBy = uploadedBy;
    }

    public Instant getUploadedAt() {
        return uploadedAt;
    }
}
