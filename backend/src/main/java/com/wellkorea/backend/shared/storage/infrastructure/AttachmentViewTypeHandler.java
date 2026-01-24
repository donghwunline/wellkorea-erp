package com.wellkorea.backend.shared.storage.infrastructure;

import com.wellkorea.backend.shared.storage.api.dto.AttachmentView;
import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;
import org.apache.ibatis.type.MappedTypes;

import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

/**
 * MyBatis TypeHandler for AttachmentView.
 * 
 * This handler always returns null because AttachmentView is enriched
 * in the service layer (e.g., DeliveryQueryService) after the mapper query.
 * The mapper selects NULL as a placeholder, and this handler converts it to null.
 */
@MappedTypes(AttachmentView.class)
public class AttachmentViewTypeHandler extends BaseTypeHandler<AttachmentView> {

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, AttachmentView parameter, JdbcType jdbcType)
            throws SQLException {
        // Not used - AttachmentView is read-only from DB perspective
        throw new UnsupportedOperationException("AttachmentView cannot be set as a parameter");
    }

    @Override
    public AttachmentView getNullableResult(ResultSet rs, String columnName) throws SQLException {
        // Always return null - photo is enriched in service layer
        return null;
    }

    @Override
    public AttachmentView getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        // Always return null - photo is enriched in service layer
        return null;
    }

    @Override
    public AttachmentView getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        // Always return null - photo is enriched in service layer
        return null;
    }
}
