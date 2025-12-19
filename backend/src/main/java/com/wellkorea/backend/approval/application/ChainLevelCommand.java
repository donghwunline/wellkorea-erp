package com.wellkorea.backend.approval.application;

/**
 * Command for chain level configuration.
 */
public record ChainLevelCommand(
        int levelOrder,
        String levelName,
        Long approverUserId,
        boolean isRequired
) {}
