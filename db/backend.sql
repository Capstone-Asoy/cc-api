-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 29, 2024 at 04:43 AM
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
  `book_id` varchar(255) DEFAULT NULL,
  `time` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bookmarks`
--

INSERT INTO `bookmarks` (`bookmark_id`, `user_id`, `book_id`, `time`) VALUES
('dua', 'FeVOO7kJ', '3', '2024-05-26 02:01:46'),
('empat', 'gWq79lHH', '3', '2024-05-26 02:01:46'),
('lima', 'gWq79lHH', '4', '2024-05-26 02:03:38'),
('satu', 'FeVOO7kJ', '1', '2024-05-26 02:01:46'),
('tiga', 'gWq79lHH', '5', '2024-05-26 02:01:46');

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
  `time` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `history`
--

INSERT INTO `history` (`history_id`, `user_id`, `book_id`, `time`) VALUES
('dua', 'FeVOO7kJ', '3', '2024-05-26 01:41:21'),
('empat', 'gWq79lHH', '3', '2024-05-26 01:41:21'),
('satu', 'FeVOO7kJ', '1', '2024-05-26 01:41:21'),
('tiga', 'gWq79lHH', '5', '2024-05-26 01:41:21');

-- --------------------------------------------------------

--
-- Table structure for table `rating`
--

CREATE TABLE `rating` (
  `rating_id` varchar(255) NOT NULL,
  `user_id` varchar(255) DEFAULT NULL,
  `books_id` varchar(255) DEFAULT NULL,
  `rating` int(11) DEFAULT NULL,
  `review` varchar(255) DEFAULT NULL,
  `date` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rating`
--

INSERT INTO `rating` (`rating_id`, `user_id`, `books_id`, `rating`, `review`, `date`) VALUES
('7D08eJoI', 'gWq79lHH', '3', 3, 'yahh lumayan lahh', '2024-05-28 18:51:19'),
('9PJ9rhno', '10ifHb7k', '3', 4, 'ini bagus banget bjirr lah', '2024-05-28 18:53:00');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `user_id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `username` varchar(255) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`user_id`, `name`, `password`, `username`, `image`, `email`) VALUES
('10ifHb7k', 'freya', '$2a$05$VRG/tt8e9vKfa3BIl8nqEODLklld5KayugGuozo56JkO8yvg0JcL6', 'freya', 'FVkSVDXaIAApP56.jfif', 'freya@gmail.com'),
('FeVOO7kJ', 'erlangga', '$2a$05$jNI8VptG1b.Tmx36hxPLOO8zqBhHzmuZ440LXKFiFjz06/PU4SdDa', 'erlangga bang', 'grimreaper.jpeg', 'erlangga@gmail.com'),
('gWq79lHH', 'ezra bucin', '$2a$05$MFKsM3zpEwf6ZQuhHSoC8eKbrPHVZFRMgNGQskOi6SKj4QN4hVGqu', 'ezra bucin', 'owen.jpeg', 'ezra@gmail.com'),
('hTTDpBrx', 'cepio', '$2a$05$IXig35YHXeWedS8h5ckEDuc1ThI/BdTOKHATwe6d2TwhoPJeLp7bO', 'cepio', 'owen.jpeg', 'freya@gmail.com'),
('nQebWy8x', 'jayawardana', '$2a$05$1e3auItaTADDYiHbbj945O3ywp3JjxgcLSMuaUTbd5H3iTUc.mgBG', 'jayawardana', '↝????????????????????????.jfif', 'freya@gmail.com'),
('p5mLb-KP', 'seviola', '$2a$05$AJx/lJusHIlcRzpSMxC4v.OcEQI.VTca3pngFoU6JCsbpOrs8HoWS', 'seviola', 'vinny.jpg', 'piyo@gmail.com');

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
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
