-- Domaine Prestige - database schema + sample data
-- Run once in MySQL:  mysql -u <user> -p < backend/schema.sql

SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS domaine_prestige
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE domaine_prestige;

DROP TABLE IF EXISTS registration;
DROP TABLE IF EXISTS event;
DROP TABLE IF EXISTS member;

CREATE TABLE member (
    id      INT AUTO_INCREMENT PRIMARY KEY,
    name    VARCHAR(100) NOT NULL,
    title   ENUM('Sommelier', 'Patron', 'Connoisseur') NOT NULL,
    details VARCHAR(500),
    level   ENUM('Cellar', 'Reserve', 'Grand Cru') NOT NULL,
    region  VARCHAR(100),
    email   VARCHAR(150) NOT NULL
);

CREATE TABLE event (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    name     VARCHAR(150) NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    level    ENUM('Cellar', 'Reserve', 'Grand Cru') NOT NULL,
    date     DATE NOT NULL UNIQUE,          -- one event per day
    location VARCHAR(150) NOT NULL
);

CREATE TABLE registration (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    event_id  INT NOT NULL,
    member_id INT NOT NULL,
    UNIQUE (event_id, member_id),           -- no double registrations
    FOREIGN KEY (event_id)  REFERENCES event(id)  ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE
);

-- Sample data
INSERT INTO member (name, title, details, level, region, email) VALUES
('Isabelle Laurent', 'Connoisseur', 'Collects Bordeaux first growths', 'Grand Cru', 'Napa Valley', 'isabelle@example.com'),
('Marcus Chen',      'Sommelier',   'Certified sommelier, Pinot Noir lover', 'Reserve', 'Willamette Valley', 'marcus@example.com'),
('Ava Robinson',     'Patron',      'New member, enjoys rosé', 'Cellar', 'Hill Country', 'ava@example.com');

INSERT INTO event (name, capacity, level, date, location) VALUES
('Spring Rosé Tasting',      40, 'Cellar',    '2026-04-18', 'Tasting Room'),
('Harvest Dinner',           20, 'Reserve',   '2026-09-26', 'Vineyard Terrace'),
('Grand Cru Barrel Tour',     8, 'Grand Cru', '2026-11-07', 'Barrel Cellar');

INSERT INTO registration (event_id, member_id) VALUES (1, 1), (1, 3), (2, 2), (3, 1);
