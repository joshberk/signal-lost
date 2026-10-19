CREATE INDEX IF NOT EXISTS `idx_rooms_expires` ON `rooms` (`expires`);
CREATE INDEX IF NOT EXISTS `idx_rate_limits_reset_at` ON `rate_limits` (`reset_at`);
