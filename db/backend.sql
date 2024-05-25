-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 25, 2024 at 01:00 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `backend`
--

-- --------------------------------------------------------

--
-- Table structure for table `bookmarks`
--

CREATE TABLE `bookmarks` (
  `bookmark_id` varchar(255) NOT NULL,
  `user_id` varchar(255) DEFAULT NULL,
  `book_id` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `books`
--

CREATE TABLE `books` (
  `books_id` varchar(255) NOT NULL,
  `judul` varchar(255) NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `penulis` varchar(255) NOT NULL,
  `penerbit` varchar(255) NOT NULL,
  `tahun_terbit` int(11) NOT NULL,
  `jml_halaman` int(11) NOT NULL,
  `ISBN` varchar(255) NOT NULL,
  `genre` varchar(255) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `books`
--

INSERT INTO `books` (`books_id`, `judul`, `deskripsi`, `penulis`, `penerbit`, `tahun_terbit`, `jml_halaman`, `ISBN`, `genre`, `image`) VALUES
('1', 'Sang Alkemis', 'Novel inspiratif tentang seorang penggembala muda yang mencari harta karun.', 'Paulo Coelho', 'Gramedia Pustaka Utama', 2008, 320, '978-979-22-5292-2', 'Fiksi, Petualangan', 'https://random.com'),
('2', 'Laskar Pelangi', 'Novel tentang persahabatan dan semangat anak-anak di Belitung.', 'Andrea Hirata', 'Bentang Pustaka', 2008, 328, '978-602-8202-21-6', 'Fiksi, Indonesia', 'https://random.com'),
('3', 'Harry Potter dan Batu Bertuah', 'Novel fantasi tentang petualangan seorang penyihir muda.', 'J.K. Rowling', 'Gramedia Pustaka Utama', 2000, 312, '978-602-9352-2', 'Fiksi, Fantasi', 'https://random.com'),
('4', 'Sapiens: Riwayat Singkat Umat Manusia', 'Buku non-fiksi tentang sejarah umat manusia.', 'Yuval Noah Harari', 'PT Nalar Populer', 2011, 600, '978-602-392-200-8', 'Non-Fiksi, Sejarah', 'https://random.com'),
('5', 'Tetralogi Buru Serigala', 'Seri novel fantasi tentang sekelompok pemburu serigala.', 'Maggie Stiefvater', 'Gramedia Pustaka Utama', 2011, 1528, '978-602-03-3491-7', 'Fiksi, Fantasi', 'https://random.com');

-- --------------------------------------------------------

--
-- Table structure for table `history`
--

CREATE TABLE `history` (
  `history_id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `book_id` varchar(255) NOT NULL,
  `time` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rating`
--

CREATE TABLE `rating` (
  `rating_id` varchar(255) NOT NULL,
  `user_id` varchar(255) DEFAULT NULL,
  `books_id` varchar(255) DEFAULT NULL,
  `rating` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `review_id` varchar(255) NOT NULL,
  `user_id` varchar(255) DEFAULT NULL,
  `books_id` varchar(255) DEFAULT NULL,
  `isi_review` text DEFAULT NULL,
  `tanggal` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `user_id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `minat_genre` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`user_id`, `name`, `password`, `minat_genre`) VALUES
('-tROWojb', 'baru', '$2a$05$Sp3C/uWfoLsFNcNthoFyjupBzlhQUOS2oFp9dtlrJBnMzUZ1h.X6K', 'Fantasy'),
('408GhtRh', 'wiwid', '$2a$05$3z/UvWwk2pDPag.hnRCwU.QWSlct2N9Eh2A7HLbBZ9BsPnaUu6D9C', 'fantasi'),
('44F_Tcg8', 'erlangga', '$2a$05$L7gkmcvLJWBe03HshiDf4eCNpoUk4hppMwfVvWWXJFXOcuPeBBwX2', 'OverPower'),
('BpO9Rk-R', 'amri', '$2a$05$z2MaZicKiqcaoijcfhIlT.rU871L3T3Hys7B.a4dGbylCs9XE717C', 'amri'),
('dOY7Brcz', 'yolaa', '$2a$05$Ap87Gtm6cwlbq2TpI52cwOzzanLwXHISDkJ2mL5HVsUznAfIWcYS2', 'Voly'),
('iDms6hXM', 'viola', '$2a$04$cwUnBf7PxYlxojq2UHlU0u0mgPZhgGHY5CoAdEXmS1xlInDaylPcm', 'Music'),
('jN5LXJ3k', 'amri', '$2a$05$/BwTP5WGTnnBZctPSB6iIOwCfvpolJmp.IaySVQbafc864LOAzhge', 'amri'),
('rTsp_zER', 'ezra', '$2a$05$OrnO.H0vZGCPAPf.aUy0TOVFWAV9hZDCzKDAfsAGrxZnc/XVCoIcu', 'Main'),
('Si_jnXq0', 'baru lagi bang', '$2a$05$ADwPvuhNJlpMt2ICXhtpZuuoQKi2ZUlUf/tckD34koiMeHmWk9gmS', 'Rock'),
('WeznOhYL', 'cynthia', '$2a$05$tzd7ERxyrvMKbKTqbIO20u3tnB7uE3iayu6iqJgtGKOEY8Ef10Ua2', 'FL'),
('zf8C4eLF', 'tomo', '$2a$05$bSBXig1iKtXaBrOjjuZlOeVJuviXe1TIZKB6A3ucqdaATqf6D9kX6', 'Main');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bookmarks`
--
ALTER TABLE `bookmarks`
  ADD PRIMARY KEY (`bookmark_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `book_id` (`book_id`);

--
-- Indexes for table `books`
--
ALTER TABLE `books`
  ADD PRIMARY KEY (`books_id`);

--
-- Indexes for table `history`
--
ALTER TABLE `history`
  ADD PRIMARY KEY (`history_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `book_id` (`book_id`);

--
-- Indexes for table `rating`
--
ALTER TABLE `rating`
  ADD PRIMARY KEY (`rating_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `books_id` (`books_id`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`review_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `books_id` (`books_id`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`user_id`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bookmarks`
--
ALTER TABLE `bookmarks`
  ADD CONSTRAINT `bookmarks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
  ADD CONSTRAINT `bookmarks_ibfk_2` FOREIGN KEY (`book_id`) REFERENCES `books` (`books_id`);

--
-- Constraints for table `history`
--
ALTER TABLE `history`
  ADD CONSTRAINT `history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
  ADD CONSTRAINT `history_ibfk_2` FOREIGN KEY (`book_id`) REFERENCES `books` (`books_id`);

--
-- Constraints for table `rating`
--
ALTER TABLE `rating`
  ADD CONSTRAINT `rating_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
  ADD CONSTRAINT `rating_ibfk_2` FOREIGN KEY (`books_id`) REFERENCES `books` (`books_id`);

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`books_id`) REFERENCES `books` (`books_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
