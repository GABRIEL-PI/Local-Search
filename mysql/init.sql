-- LocalReach AI Database Initialization
CREATE DATABASE IF NOT EXISTS localreach_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON localreach_db.* TO 'localreach'@'%';
FLUSH PRIVILEGES;
