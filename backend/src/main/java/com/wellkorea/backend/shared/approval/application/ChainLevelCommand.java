package com.wellkorea.backend.shared.approval.application;

/**
 * Command for chain level configuration.
 */
public record ChainLevelCommand(
        int levelOrder,
        String levelName,
        Long approverUserId,
        boolean isRequired
) {
}
