
DROP DATABASE IF EXISTS english_practice;
CREATE DATABASE english_practice CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE english_practice;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NULL,
  phone VARCHAR(20) NULL,
  google_id VARCHAR(255) NULL,
  facebook_id VARCHAR(255) NULL,
  display_name VARCHAR(255) NULL,
  role ENUM('superadmin', 'admin', 'teacher', 'student', 'user') NOT NULL DEFAULT 'user',
  avatar VARCHAR(255) NULL,
  is_premium TINYINT(1) DEFAULT 0,
  learning_goal TEXT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255) NULL,
  reset_password_token VARCHAR(255) NULL,
  reset_password_expires DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    exam_type ENUM('listening', 'reading', 'writing', 'speaking', 'full_test') NOT NULL,
    duration INT,
    total_questions INT DEFAULT 0,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    question_type ENUM('multiple_choice', 'matching', 'fill_blanks', 'essay', 'short_answer') NOT NULL,
    question_text TEXT NOT NULL,
    question_order INT NOT NULL,
    audio_url VARCHAR(255),
    image_url VARCHAR(255),
    options JSON,
    correct_answer JSON,
    points INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_exam_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    exam_id INT NOT NULL,
    score DECIMAL(5,2),
    time_spent INT,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    user_answer JSON,
    is_correct BOOLEAN,
    points_earned DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attempt_id) REFERENCES user_exam_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `grammar_topics` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `level` ENUM('beginner','intermediate','advanced') NOT NULL,
  `display_order` INT DEFAULT 0,
  `created_by` INT NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_grammar_topics_created_by` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `grammar_lessons` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `topic_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `explanation` TEXT NOT NULL,
  `structure` TEXT,
  `usage` TEXT,
  `pronunciation_audio` VARCHAR(255),
  `example_sentence` TEXT,
  `example_image` VARCHAR(255),
  `meaning` TEXT,
  `tags` JSON,
  `difficulty_level` ENUM('easy','medium','hard') DEFAULT 'medium',
  `display_order` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_by` INT NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_grammar_lessons_topic` FOREIGN KEY (`topic_id`) REFERENCES `grammar_topics`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_grammar_lessons_created_by` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `grammar_exercises` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `lesson_id` INT NOT NULL,
  `question_type` ENUM('multiple_choice','fill_blank','sentence_correction','matching') NOT NULL,
  `question_text` TEXT NOT NULL,
  `options` JSON,
  `correct_answer` JSON,
  `explanation` TEXT,
  `points` INT DEFAULT 1,
  `display_order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_grammar_exercises_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `grammar_lessons`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `grammar_examples` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `lesson_id` INT NOT NULL,
  `example_sentence` TEXT NOT NULL,
  `meaning` TEXT,
  `pronunciation_audio` VARCHAR(255),
  `example_image` VARCHAR(255),
  `notes` TEXT,
  `display_order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_grammar_examples_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `grammar_lessons`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `grammar_practices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `lesson_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `instructions` TEXT NOT NULL,
  `content` JSON,
  `practice_type` ENUM('sentence_building', 'translation', 'fill_blank', 'conversation') NOT NULL,
  `difficulty_level` ENUM('easy','medium','hard') DEFAULT 'medium',
  `time_limit` INT,
  `points` INT DEFAULT 10,
  `display_order` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_grammar_practices_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `grammar_lessons`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_grammar_practice` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `practice_id` INT NOT NULL,
  `answers` JSON,
  `score` DECIMAL(5,2),
  `time_spent` INT,
  `completed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`practice_id`) REFERENCES `grammar_practices`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_grammar_progress` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `lesson_id` INT NOT NULL,
  `score` DECIMAL(5,2) NOT NULL,
  `time_spent` INT,
  `completed` BOOLEAN DEFAULT FALSE,
  `completed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`lesson_id`) REFERENCES `grammar_lessons`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_user_lesson` (`user_id`, `lesson_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `vocabulary_collections` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `level` ENUM('beginner', 'intermediate', 'advanced') NOT NULL,
  `category` VARCHAR(100),
  `tags` JSON,
  `is_public` BOOLEAN DEFAULT TRUE,
  `display_order` INT DEFAULT 0,
  `created_by` INT NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_vocab_collections_created_by` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `vocabulary_flashcards` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `collection_id` INT NOT NULL,
  `word` VARCHAR(255) NOT NULL,
  `meaning` TEXT NOT NULL,
  `pronunciation` VARCHAR(255),
  `pronunciation_audio` VARCHAR(255),
  `example_sentence` TEXT,
  `example_meaning` TEXT,
  `example_image` VARCHAR(255),
  `part_of_speech` ENUM('noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'interjection') NOT NULL,
  `synonyms` JSON,
  `antonyms` JSON,
  `tags` JSON,
  `difficulty_level` ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  `is_active` TINYINT(1) DEFAULT 1,
  `display_order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_vocab_flashcards_collection` FOREIGN KEY (`collection_id`) REFERENCES `vocabulary_collections`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `vocabulary_questions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `collection_id` INT NOT NULL,
  `flashcard_id` INT NULL DEFAULT NULL,
  `question_type` ENUM('multiple_choice', 'fill_in_the_blank', 'translation') NOT NULL,
  `question_text` TEXT NOT NULL,
  `options` JSON,
  `correct_answer` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_vocab_questions_collection` FOREIGN KEY (`collection_id`) REFERENCES `vocabulary_collections`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_vocab_questions_flashcard` FOREIGN KEY (`flashcard_id`) REFERENCES `vocabulary_flashcards`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_vocabulary_learning` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `flashcard_id` INT NOT NULL,
  `collection_id` INT NOT NULL,
  `status` ENUM('new', 'learning', 'review', 'mastered') DEFAULT 'new',
  `confidence_level` INT DEFAULT 0,
  `next_review_date` DATE,
  `review_count` INT DEFAULT 0,
  `last_reviewed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`flashcard_id`) REFERENCES `vocabulary_flashcards`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`collection_id`) REFERENCES `vocabulary_collections`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_user_flashcard` (`user_id`, `flashcard_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_vocabulary_progress` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `collection_id` INT NOT NULL,
  `total_cards` INT DEFAULT 0,
  `learned_cards` INT DEFAULT 0,
  `mastered_cards` INT DEFAULT 0,
  `total_reviews` INT DEFAULT 0,
  `average_confidence` DECIMAL(5,2) DEFAULT 0,
  `last_studied_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`collection_id`) REFERENCES `vocabulary_collections`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_user_collection` (`user_id`, `collection_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `exam_results` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `exam_id` int NOT NULL,
  `score` decimal(10,2) NOT NULL,
  `total_points` int NOT NULL,
  `correct_answers` int NOT NULL,
  `total_questions` int NOT NULL,
  `time_spent` int DEFAULT NULL,
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `exam_id` (`exam_id`),
  CONSTRAINT `exam_results_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `exam_results_ibfk_2` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `exam_submissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `result_id` int NOT NULL,
  `question_id` int NOT NULL,
  `user_answer` text,
  `is_correct` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `result_id` (`result_id`),
  KEY `question_id` (`question_id`),
  CONSTRAINT `exam_submissions_ibfk_1` FOREIGN KEY (`result_id`) REFERENCES `exam_results` (`id`) ON DELETE CASCADE,
  CONSTRAINT `exam_submissions_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- INSERT DATA
-- =============================================

-- Admin account (password: Admin@123)
INSERT INTO users (email, password, display_name, role, is_verified) VALUES
('admin@englishmaster.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'superadmin', TRUE);

-- =============================================
-- GRAMMAR TOPICS (Tiếng Việt)
-- =============================================
INSERT INTO grammar_topics (title, description, level, display_order) VALUES
('Thì Hiện Tại Đơn', 'Học cách sử dụng thì hiện tại đơn để diễn tả thói quen, sự thật hiển nhiên và lịch trình', 'beginner', 1),
('Thì Hiện Tại Tiếp Diễn', 'Học cách sử dụng thì hiện tại tiếp diễn để diễn tả hành động đang xảy ra', 'beginner', 2),
('Thì Quá Khứ Đơn', 'Học cách sử dụng thì quá khứ đơn để diễn tả hành động đã xảy ra trong quá khứ', 'beginner', 3),
('Thì Hiện Tại Hoàn Thành', 'Học cách sử dụng thì hiện tại hoàn thành với already, just, yet, ever, never', 'intermediate', 4),
('Câu Điều Kiện', 'Học các loại câu điều kiện: loại 1, loại 2, loại 3', 'intermediate', 5);

-- =============================================
-- GRAMMAR LESSONS
-- =============================================
INSERT INTO grammar_lessons (topic_id, title, explanation, `structure`, `usage`, example_sentence, difficulty_level, display_order) VALUES
-- Topic 1: Simple Present
(1, 'Thì Hiện Tại Đơn - Động từ TO BE',
 'Thì hiện tại đơn với động từ TO BE dùng để diễn tả trạng thái, nghề nghiệp hoặc đặc điểm hiện tại của chủ ngữ.',
 'S + am/is/are + (complement)',
 'Dùng với: I → am | He/She/It → is | You/We/They → are',
 'I am a student. She is a doctor. They are happy.',
 'easy', 1),

(1, 'Thì Hiện Tại Đơn - Động Từ Thường',
 'Thì hiện tại đơn với động từ thường dùng để diễn tả thói quen, hành động lặp đi lặp lại hoặc sự thật hiển nhiên.',
 'S + V(s/es) + O (khẳng định) | S + do/does + not + V + O (phủ định)',
 'Thêm s/es với chủ ngữ ngôi 3 số ít (He/She/It). Dùng với: always, usually, often, sometimes, never',
 'He goes to school every day. She does not like coffee. Do you speak English?',
 'easy', 2),

-- Topic 2: Present Continuous
(2, 'Thì Hiện Tại Tiếp Diễn',
 'Thì hiện tại tiếp diễn dùng để diễn tả hành động đang xảy ra tại thời điểm nói hoặc một xu hướng trong thời gian gần.',
 'S + am/is/are + V-ing + O',
 'Dùng với: now, at the moment, at present, currently, Look!, Listen!',
 'She is reading a book now. They are playing football at the moment.',
 'easy', 1),

-- Topic 3: Simple Past
(3, 'Thì Quá Khứ Đơn - Động Từ Có Quy Tắc',
 'Thì quá khứ đơn với động từ có quy tắc dùng để diễn tả hành động đã xảy ra và kết thúc trong quá khứ.',
 'S + V-ed + O (khẳng định) | S + did not + V + O (phủ định)',
 'Thêm -ed vào sau động từ. Dùng với: yesterday, last week, last year, ago, in 1990',
 'She walked to school yesterday. He did not watch TV last night.',
 'easy', 1),

(3, 'Thì Quá Khứ Đơn - Động Từ Bất Quy Tắc',
 'Nhiều động từ trong tiếng Anh có dạng quá khứ bất quy tắc, không thêm -ed mà thay đổi hoàn toàn.',
 'S + V2 (past form) + O',
 'Các động từ bất quy tắc phổ biến: go → went, have → had, see → saw, come → came, get → got',
 'I went to the cinema last Saturday. She had a great time at the party.',
 'medium', 2),

-- Topic 4: Present Perfect
(4, 'Thì Hiện Tại Hoàn Thành - Cơ Bản',
 'Thì hiện tại hoàn thành dùng để diễn tả hành động đã xảy ra trong quá khứ nhưng có liên quan đến hiện tại.',
 'S + have/has + V3 (past participle)',
 'Dùng với: already, just, yet, ever, never, recently, so far, since, for',
 'I have already finished my homework. She has never been to Japan. Have you ever tried sushi?',
 'medium', 1),

-- Topic 5: Conditional
(5, 'Câu Điều Kiện Loại 1 - Có Thể Xảy Ra',
 'Câu điều kiện loại 1 dùng để diễn tả điều kiện có thể xảy ra trong tương lai và kết quả của nó.',
 'If + S + V(present), S + will + V(bare)',
 'Dùng khi điều kiện hoàn toàn có thể xảy ra trong thực tế',
 'If it rains tomorrow, I will stay at home. If you study hard, you will pass the exam.',
 'medium', 1),

(5, 'Câu Điều Kiện Loại 2 - Không Có Thật Ở Hiện Tại',
 'Câu điều kiện loại 2 dùng để diễn tả điều kiện không có thật hoặc khó xảy ra ở hiện tại.',
 'If + S + V-ed (past simple), S + would + V(bare)',
 'Dùng để nói về tình huống giả định, không có thật hoặc rất khó xảy ra',
 'If I had a million dollars, I would travel around the world. If she were taller, she could be a model.',
 'hard', 2);

-- =============================================
-- GRAMMAR EXAMPLES (English sentences + Vietnamese meaning)
-- =============================================
INSERT INTO grammar_examples (lesson_id, example_sentence, meaning, display_order) VALUES
-- Lesson 1: TO BE present
(1, 'I am a student at university.', 'Tôi là sinh viên đại học.', 1),
(1, 'She is a talented doctor.', 'Cô ấy là một bác sĩ tài năng.', 2),
(1, 'They are my best friends.', 'Họ là những người bạn thân nhất của tôi.', 3),
(1, 'The weather is beautiful today.', 'Thời tiết hôm nay thật đẹp.', 4),

-- Lesson 2: Simple present (regular verbs)
(2, 'He plays football every Sunday.', 'Anh ấy chơi bóng đá mỗi Chủ nhật.', 1),
(2, 'She studies English for two hours a day.', 'Cô ấy học tiếng Anh hai tiếng mỗi ngày.', 2),
(2, 'Water boils at 100 degrees Celsius.', 'Nước sôi ở 100 độ C.', 3),
(2, 'I do not drink coffee in the evening.', 'Tôi không uống cà phê vào buổi tối.', 4),

-- Lesson 3: Present continuous
(3, 'She is reading a book in her room right now.', 'Cô ấy đang đọc sách trong phòng ngay lúc này.', 1),
(3, 'They are playing basketball at the moment.', 'Họ đang chơi bóng rổ vào lúc này.', 2),
(3, 'Look! The cat is chasing the mouse.', 'Nhìn kìa! Con mèo đang đuổi theo con chuột.', 3),

-- Lesson 4: Simple past regular
(4, 'She walked to the park yesterday morning.', 'Cô ấy đã đi bộ đến công viên sáng hôm qua.', 1),
(4, 'He cooked dinner for the whole family last night.', 'Anh ấy đã nấu bữa tối cho cả gia đình tối qua.', 2),
(4, 'We visited the museum two weeks ago.', 'Chúng tôi đã tham quan bảo tàng hai tuần trước.', 3),

-- Lesson 5: Simple past irregular
(5, 'I went to Paris last summer.', 'Tôi đã đến Paris mùa hè năm ngoái.', 1),
(5, 'She saw a wonderful movie last weekend.', 'Cô ấy đã xem một bộ phim tuyệt vời cuối tuần trước.', 2),
(5, 'He got a promotion at work last month.', 'Anh ấy đã được thăng chức vào tháng trước.', 3),

-- Lesson 6: Present perfect
(6, 'I have already finished my assignment.', 'Tôi đã hoàn thành bài tập rồi.', 1),
(6, 'She has never eaten Thai food before.', 'Cô ấy chưa bao giờ ăn đồ Thái trước đây.', 2),
(6, 'Have you ever visited the Great Wall of China?', 'Bạn đã từng thăm Vạn Lý Trường Thành chưa?', 3),
(6, 'He has just arrived at the airport.', 'Anh ấy vừa mới đến sân bay.', 4),

-- Lesson 7: Conditional type 1
(7, 'If it rains tomorrow, I will cancel the picnic.', 'Nếu trời mưa ngày mai, tôi sẽ hủy chuyến dã ngoại.', 1),
(7, 'If you exercise regularly, you will stay healthy.', 'Nếu bạn tập thể dục đều đặn, bạn sẽ khỏe mạnh.', 2),
(7, 'If she studies hard, she will pass the exam.', 'Nếu cô ấy học chăm chỉ, cô ấy sẽ vượt qua kỳ thi.', 3),

-- Lesson 8: Conditional type 2
(8, 'If I had more time, I would learn to play the piano.', 'Nếu tôi có nhiều thời gian hơn, tôi sẽ học chơi đàn piano.', 1),
(8, 'If she were the president, she would change many things.', 'Nếu cô ấy là tổng thống, cô ấy sẽ thay đổi nhiều thứ.', 2),
(8, 'If I won the lottery, I would donate to charity.', 'Nếu tôi trúng xổ số, tôi sẽ quyên góp cho từ thiện.', 3);

-- =============================================
-- GRAMMAR EXERCISES (English questions + English options)
-- =============================================
INSERT INTO grammar_exercises (lesson_id, question_type, question_text, options, correct_answer, explanation, points, display_order) VALUES
-- Lesson 1: TO BE
(1, 'multiple_choice', 'Choose the correct form: She ___ a nurse at the city hospital.',
 '["am","is","are","be"]', '"is"',
 'She (ngôi 3 số ít) dùng "is"', 1, 1),

(1, 'multiple_choice', 'Choose the correct form: We ___ very excited about the trip.',
 '["am","is","are","was"]', '"are"',
 'We (số nhiều) dùng "are"', 1, 2),

(1, 'multiple_choice', 'Choose the correct form: I ___ not ready for the exam yet.',
 '["am","is","are","be"]', '"am"',
 'I dùng "am"', 1, 3),

-- Lesson 2: Simple present regular verbs
(2, 'multiple_choice', 'Choose the correct form: He ___ to school by bicycle every morning.',
 '["go","goes","going","gone"]', '"goes"',
 'He (ngôi 3 số ít) thêm "es" → goes', 1, 1),

(2, 'multiple_choice', 'Choose the correct form: She ___ not like watching horror movies.',
 '["do","does","did","is"]', '"does"',
 'She (ngôi 3 số ít) dùng "does" trong câu phủ định', 1, 2),

(2, 'multiple_choice', 'Choose the correct form: ___ your brother play any musical instruments?',
 '["Do","Does","Did","Is"]', '"Does"',
 'Your brother (ngôi 3 số ít) dùng "Does" trong câu hỏi', 1, 3),

-- Lesson 3: Present continuous
(3, 'multiple_choice', 'Choose the correct form: Listen! The birds ___ outside.',
 '["sing","sings","are singing","were singing"]', '"are singing"',
 '"Listen!" là dấu hiệu nhận biết thì HTTD. They → "are singing"', 1, 1),

(3, 'multiple_choice', 'Choose the correct form: She ___ her homework at the moment.',
 '["does","is doing","did","has done"]', '"is doing"',
 '"at the moment" → thì hiện tại tiếp diễn', 1, 2),

-- Lesson 4: Simple past regular
(4, 'multiple_choice', 'Choose the correct form: She ___ her keys on the table last night.',
 '["leave","leaves","left","has left"]', '"left"',
 '"last night" → thì quá khứ đơn. leave → left (bất quy tắc)', 1, 1),

(4, 'multiple_choice', 'Choose the correct form: He ___ not finish his work before the deadline yesterday.',
 '["does","did","do","was"]', '"did"',
 '"yesterday" → thì quá khứ đơn. Phủ định dùng "did not"', 1, 2),

-- Lesson 6: Present perfect
(6, 'multiple_choice', 'Choose the correct form: I have ___ seen that movie before.',
 '["already","yet","since","ago"]', '"already"',
 '"already" dùng trong câu khẳng định của thì HTHT', 1, 1),

(6, 'multiple_choice', 'Choose the correct form: She ___ lived in this city for ten years.',
 '["have","has","had","is"]', '"has"',
 'She (ngôi 3 số ít) dùng "has" trong thì HTHT', 1, 2),

(6, 'multiple_choice', 'Choose the correct form: Have you finished your assignment ___?',
 '["already","just","yet","ever"]', '"yet"',
 '"yet" dùng trong câu hỏi và câu phủ định của thì HTHT', 1, 3),

-- Lesson 7: Conditional type 1
(7, 'multiple_choice', 'Choose the correct form: If it ___ tomorrow, we will stay indoors.',
 '["rain","rains","rained","will rain"]', '"rains"',
 'Mệnh đề If dùng thì hiện tại đơn trong câu điều kiện loại 1', 1, 1),

(7, 'multiple_choice', 'Choose the correct form: If you work hard, you ___ succeed.',
 '["will","would","could","should"]', '"will"',
 'Mệnh đề chính dùng "will + V" trong câu điều kiện loại 1', 1, 2),

-- Lesson 8: Conditional type 2
(8, 'multiple_choice', 'Choose the correct form: If I ___ a car, I would drive to work.',
 '["have","had","has","will have"]', '"had"',
 'Câu điều kiện loại 2: mệnh đề If dùng quá khứ đơn', 1, 1),

(8, 'multiple_choice', 'Choose the correct form: She would travel more if she ___ more money.',
 '["has","have","had","would have"]', '"had"',
 'Câu điều kiện loại 2: mệnh đề If dùng quá khứ đơn', 1, 2);

-- =============================================
-- VOCABULARY COLLECTIONS
-- =============================================
INSERT INTO vocabulary_collections (title, description, level, category, is_public, display_order) VALUES
('Everyday Greetings & Phrases', 'Common English greetings and phrases used in daily conversations', 'beginner', 'Communication', TRUE, 1),
('Common Verbs - Action Words', 'Essential action verbs used in everyday English', 'beginner', 'Grammar', TRUE, 2),
('Food & Drinks', 'Vocabulary related to food, drinks and dining', 'beginner', 'Daily Life', TRUE, 3),
('Office & Business', 'Professional vocabulary used in workplace and business settings', 'intermediate', 'Business', TRUE, 4),
('Travel & Tourism', 'Useful vocabulary for traveling and tourism', 'intermediate', 'Travel', TRUE, 5),
('Academic English', 'Advanced vocabulary used in academic writing and research', 'advanced', 'Academic', TRUE, 6);

-- =============================================
-- VOCABULARY FLASHCARDS
-- =============================================
INSERT INTO vocabulary_flashcards (collection_id, word, meaning, pronunciation, example_sentence, example_meaning, part_of_speech, difficulty_level, display_order) VALUES
-- Collection 1: Greetings
(1, 'Hello', 'Xin chào', '/həˈloʊ/', 'Hello! How are you doing today?', 'Xin chào! Hôm nay bạn thế nào?', 'interjection', 'easy', 1),
(1, 'Goodbye', 'Tạm biệt', '/ɡʊdˈbaɪ/', 'Goodbye! See you tomorrow at school.', 'Tạm biệt! Hẹn gặp bạn ở trường vào ngày mai.', 'interjection', 'easy', 2),
(1, 'Thank you', 'Cảm ơn', '/θæŋk juː/', 'Thank you very much for your help.', 'Cảm ơn bạn rất nhiều vì sự giúp đỡ.', 'interjection', 'easy', 3),
(1, 'Sorry', 'Xin lỗi', '/ˈsɒri/', 'I am sorry for being late to the meeting.', 'Tôi xin lỗi vì đến họp muộn.', 'interjection', 'easy', 4),
(1, 'Please', 'Làm ơn / Xin hãy', '/pliːz/', 'Please help me carry these heavy boxes.', 'Làm ơn giúp tôi khiêng những hộp nặng này.', 'adverb', 'easy', 5),
(1, 'Excuse me', 'Xin lỗi / Cho hỏi', '/ɪkˈskjuːz miː/', 'Excuse me, could you tell me the way to the station?', 'Xin lỗi, bạn có thể chỉ đường đến nhà ga không?', 'interjection', 'easy', 6),

-- Collection 2: Common Verbs
(2, 'Run', 'Chạy', '/rʌn/', 'She runs five kilometers every morning for exercise.', 'Cô ấy chạy năm kilomet mỗi sáng để tập thể dục.', 'verb', 'easy', 1),
(2, 'Eat', 'Ăn', '/iːt/', 'We usually eat dinner together as a family at 7 pm.', 'Chúng tôi thường ăn tối cùng nhau lúc 7 giờ tối.', 'verb', 'easy', 2),
(2, 'Sleep', 'Ngủ', '/sliːp/', 'Children need to sleep at least eight hours a night.', 'Trẻ em cần ngủ ít nhất tám tiếng mỗi đêm.', 'verb', 'easy', 3),
(2, 'Study', 'Học', '/ˈstʌdi/', 'He studies English for two hours every evening.', 'Anh ấy học tiếng Anh hai tiếng mỗi buổi tối.', 'verb', 'easy', 4),
(2, 'Work', 'Làm việc', '/wɜːrk/', 'My father works at a large company in the city center.', 'Bố tôi làm việc ở một công ty lớn ở trung tâm thành phố.', 'verb', 'easy', 5),
(2, 'Speak', 'Nói / Nói chuyện', '/spiːk/', 'She speaks three languages: Vietnamese, English and French.', 'Cô ấy nói được ba thứ tiếng: tiếng Việt, tiếng Anh và tiếng Pháp.', 'verb', 'easy', 6),

-- Collection 3: Food & Drinks
(3, 'Breakfast', 'Bữa sáng', '/ˈbrekfəst/', 'I always have breakfast before going to work.', 'Tôi luôn ăn sáng trước khi đi làm.', 'noun', 'easy', 1),
(3, 'Delicious', 'Ngon (đồ ăn)', '/dɪˈlɪʃəs/', 'This pho is absolutely delicious! I love it.', 'Món phở này ngon tuyệt vời! Tôi rất thích.', 'adjective', 'easy', 2),
(3, 'Hungry', 'Đói', '/ˈhʌŋɡri/', 'I am very hungry because I skipped lunch today.', 'Tôi rất đói vì hôm nay tôi đã bỏ bữa trưa.', 'adjective', 'easy', 3),
(3, 'Menu', 'Thực đơn', '/ˈmenjuː/', 'Could you bring us the menu, please?', 'Bạn có thể mang thực đơn cho chúng tôi không?', 'noun', 'easy', 4),
(3, 'Recipe', 'Công thức nấu ăn', '/ˈresɪpi/', 'My grandmother has a secret recipe for this traditional dish.', 'Bà tôi có công thức bí mật cho món ăn truyền thống này.', 'noun', 'medium', 5),

-- Collection 4: Office & Business
(4, 'Meeting', 'Cuộc họp', '/ˈmiːtɪŋ/', 'We have an important meeting with the clients at 9 am.', 'Chúng tôi có cuộc họp quan trọng với khách hàng lúc 9 giờ sáng.', 'noun', 'medium', 1),
(4, 'Deadline', 'Hạn chót', '/ˈdedlaɪn/', 'The deadline for submitting the report is this Friday.', 'Hạn chót nộp báo cáo là thứ Sáu này.', 'noun', 'medium', 2),
(4, 'Colleague', 'Đồng nghiệp', '/ˈkɒliːɡ/', 'My colleagues are very supportive and friendly.', 'Các đồng nghiệp của tôi rất hỗ trợ và thân thiện.', 'noun', 'medium', 3),
(4, 'Negotiate', 'Đàm phán', '/nɪˈɡoʊʃieɪt/', 'We need to negotiate the terms of the contract carefully.', 'Chúng tôi cần đàm phán các điều khoản hợp đồng một cách cẩn thận.', 'verb', 'hard', 4),
(4, 'Presentation', 'Bài thuyết trình', '/ˌprezənˈteɪʃən/', 'She gave an excellent presentation to the board of directors.', 'Cô ấy đã thuyết trình xuất sắc trước hội đồng quản trị.', 'noun', 'medium', 5),

-- Collection 5: Travel
(5, 'Passport', 'Hộ chiếu', '/ˈpæspɔːrt/', 'Do not forget to bring your passport when traveling abroad.', 'Đừng quên mang theo hộ chiếu khi đi du lịch nước ngoài.', 'noun', 'medium', 1),
(5, 'Destination', 'Điểm đến', '/ˌdestɪˈneɪʃən/', 'Paris is one of the most popular tourist destinations in the world.', 'Paris là một trong những điểm đến du lịch phổ biến nhất thế giới.', 'noun', 'medium', 2),
(5, 'Itinerary', 'Lịch trình chuyến đi', '/aɪˈtɪnəreri/', 'Our travel itinerary includes visits to five different countries.', 'Lịch trình du lịch của chúng tôi bao gồm thăm quan năm quốc gia khác nhau.', 'noun', 'hard', 3),
(5, 'Accommodation', 'Chỗ ở', '/əˌkɒməˈdeɪʃən/', 'We booked a comfortable accommodation near the beach.', 'Chúng tôi đã đặt chỗ ở thoải mái gần bãi biển.', 'noun', 'hard', 4),

-- Collection 6: Academic
(6, 'Analyze', 'Phân tích', '/ˈænəlaɪz/', 'The researchers analyzed the data from over a thousand participants.', 'Các nhà nghiên cứu đã phân tích dữ liệu từ hơn một nghìn người tham gia.', 'verb', 'hard', 1),
(6, 'Hypothesis', 'Giả thuyết', '/haɪˈpɒθɪsɪs/', 'The scientist proposed a new hypothesis to explain the phenomenon.', 'Nhà khoa học đã đề xuất một giả thuyết mới để giải thích hiện tượng đó.', 'noun', 'hard', 2),
(6, 'Significant', 'Đáng kể / Có ý nghĩa', '/sɪɡˈnɪfɪkənt/', 'The study found a significant difference between the two groups.', 'Nghiên cứu phát hiện ra sự khác biệt đáng kể giữa hai nhóm.', 'adjective', 'hard', 3),
(6, 'Methodology', 'Phương pháp luận', '/ˌmeθəˈdɒlədʒi/', 'The research methodology was carefully designed to ensure accuracy.', 'Phương pháp luận nghiên cứu được thiết kế cẩn thận để đảm bảo độ chính xác.', 'noun', 'hard', 4),
(6, 'Conclusion', 'Kết luận', '/kənˈkluːʒən/', 'The conclusion of the paper summarizes all the key findings.', 'Phần kết luận của bài báo tóm tắt tất cả các phát hiện chính.', 'noun', 'medium', 5);

-- =============================================
-- VOCABULARY QUESTIONS (English questions + English options)
-- =============================================
INSERT INTO vocabulary_questions (collection_id, flashcard_id, question_type, question_text, options, correct_answer) VALUES
-- Collection 1: Greetings
(1, 1, 'multiple_choice', 'What does "Hello" mean in Vietnamese?',
 '["Tạm biệt","Xin chào","Cảm ơn","Xin lỗi"]', 'Xin chào'),

(1, 2, 'multiple_choice', 'Which word means "Tạm biệt" in English?',
 '["Hello","Sorry","Goodbye","Please"]', 'Goodbye'),

(1, 3, 'multiple_choice', 'When do you say "Thank you"?',
 '["When you meet someone","When you are grateful","When you leave","When you need help"]', 'When you are grateful'),

(1, 4, 'multiple_choice', 'What is the correct meaning of "Sorry"?',
 '["Hello","Thank you","Goodbye","Xin lỗi"]', 'Xin lỗi'),

-- Collection 2: Common Verbs
(2, 7, 'multiple_choice', 'What does the verb "Run" mean?',
 '["Đi bộ","Chạy","Nhảy","Bơi"]', 'Chạy'),

(2, 10, 'multiple_choice', 'Which verb means "Học" in English?',
 '["Work","Sleep","Study","Speak"]', 'Study'),

(2, 12, 'multiple_choice', 'Choose the correct meaning of "Speak":',
 '["Nghe","Đọc","Viết","Nói / Nói chuyện"]', 'Nói / Nói chuyện'),

-- Collection 3: Food
(3, 13, 'multiple_choice', 'What does "Breakfast" mean?',
 '["Bữa trưa","Bữa tối","Bữa sáng","Bữa ăn nhẹ"]', 'Bữa sáng'),

(3, 14, 'multiple_choice', 'If food tastes very good, we say it is ___.',
 '["Hungry","Delicious","Menu","Recipe"]', 'Delicious'),

-- Collection 4: Business
(4, 18, 'multiple_choice', 'What does "Meeting" mean in a business context?',
 '["Bữa ăn","Cuộc họp","Văn phòng","Hợp đồng"]', 'Cuộc họp'),

(4, 19, 'multiple_choice', 'The last day to complete a task is called the ___.',
 '["Meeting","Colleague","Deadline","Presentation"]', 'Deadline'),

-- Collection 5: Travel
(5, 23, 'multiple_choice', 'Which document is required when traveling internationally?',
 '["Ticket","Passport","Visa card","ID card"]', 'Passport'),

(5, 24, 'multiple_choice', 'The place you are traveling to is called the ___.',
 '["Itinerary","Accommodation","Passport","Destination"]', 'Destination'),

-- Collection 6: Academic
(6, 27, 'multiple_choice', 'What does "Analyze" mean?',
 '["Tổng hợp","Phân tích","Đánh giá","Mô tả"]', 'Phân tích'),

(6, 29, 'multiple_choice', 'If something is very important or noticeable, we say it is ___.',
 '["Hypothesis","Methodology","Significant","Conclusion"]', 'Significant');

-- =============================================
-- EXAMS
-- =============================================
INSERT INTO exams (title, description, exam_type, duration, total_questions, difficulty) VALUES
('Basic Grammar Test - Present Tenses', 'Test your knowledge of Simple Present and Present Continuous tenses', 'reading', 20, 10, 'easy'),
('Vocabulary Test - Beginner Level', 'Test your English vocabulary at beginner level', 'reading', 15, 10, 'easy'),
('Intermediate Grammar Challenge', 'A challenging test covering Past Simple, Present Perfect and Conditionals', 'reading', 30, 10, 'medium'),
('Business English Test', 'Test your knowledge of business and office vocabulary', 'reading', 20, 8, 'medium'),
('Full English Proficiency Test', 'Comprehensive test covering grammar, vocabulary and reading comprehension', 'full_test', 60, 15, 'hard');

-- =============================================
-- QUESTIONS FOR EXAM 1: Basic Grammar
-- =============================================
INSERT INTO questions (exam_id, question_type, question_text, question_order, options, correct_answer, points) VALUES
(1, 'multiple_choice', 'Choose the correct verb form: She ___ to school every day by bus.',
 1, '["go","goes","going","gone"]', '"goes"', 1),

(1, 'multiple_choice', 'Choose the correct verb form: They ___ football in the park right now.',
 2, '["play","plays","are playing","played"]', '"are playing"', 1),

(1, 'multiple_choice', 'Choose the correct verb form: Water ___ at 100 degrees Celsius.',
 3, '["boil","boils","is boiling","boiled"]', '"boils"', 1),

(1, 'multiple_choice', 'Choose the correct verb form: Look! It ___ outside. Bring an umbrella.',
 4, '["rain","rains","is raining","rained"]', '"is raining"', 1),

(1, 'multiple_choice', 'Choose the correct verb form: He ___ not like spicy food at all.',
 5, '["do","does","did","is"]', '"does"', 1),

(1, 'multiple_choice', 'Choose the correct verb form: ___ you usually have breakfast before work?',
 6, '["Do","Does","Are","Is"]', '"Do"', 1),

(1, 'multiple_choice', 'Choose the correct verb form: She ___ her homework at the moment, so please be quiet.',
 7, '["does","is doing","did","has done"]', '"is doing"', 1),

(1, 'multiple_choice', 'Choose the correct verb form: The sun ___ in the east and sets in the west.',
 8, '["rise","rises","is rising","rose"]', '"rises"', 1),

(1, 'multiple_choice', 'Choose the correct verb form: Listen! Someone ___ at the door.',
 9, '["knock","knocks","is knocking","knocked"]', '"is knocking"', 1),

(1, 'multiple_choice', 'Choose the correct verb form: My father ___ to work very early every morning.',
 10, '["go","goes","is going","went"]', '"goes"', 1);

-- =============================================
-- QUESTIONS FOR EXAM 2: Vocabulary Test
-- =============================================
INSERT INTO questions (exam_id, question_type, question_text, question_order, options, correct_answer, points) VALUES
(2, 'multiple_choice', 'What is the meaning of the word "Delicious"?',
 1, '["Đắt tiền","Ngon","Đẹp","To lớn"]', '"Ngon"', 1),

(2, 'multiple_choice', 'Which word means "Tạm biệt" in English?',
 2, '["Hello","Sorry","Thank you","Goodbye"]', '"Goodbye"', 1),

(2, 'multiple_choice', 'Fill in the blank: "Could you bring us the ___, please? We would like to order food."',
 3, '["recipe","menu","breakfast","meal"]', '"menu"', 1),

(2, 'multiple_choice', 'Choose the correct synonym for "Hungry":',
 4, '["Full","Tired","Starving","Happy"]', '"Starving"', 1),

(2, 'multiple_choice', 'What does "Excuse me" mean?',
 5, '["Xin lỗi / Cho hỏi","Cảm ơn","Tạm biệt","Xin chào"]', '"Xin lỗi / Cho hỏi"', 1),

(2, 'multiple_choice', 'The word "Recipe" refers to:',
 6, '["A type of food","Instructions for cooking a dish","A restaurant menu","A cooking tool"]', '"Instructions for cooking a dish"', 1),

(2, 'multiple_choice', 'Choose the correct meaning of "Please":',
 7, '["Làm ơn / Xin hãy","Xin lỗi","Cảm ơn","Không có gì"]', '"Làm ơn / Xin hãy"', 1),

(2, 'multiple_choice', 'What part of speech is the word "Run"?',
 8, '["Noun","Adjective","Verb","Adverb"]', '"Verb"', 1),

(2, 'multiple_choice', 'Choose the correct sentence using "Breakfast":',
 9, '["I always have breakfast after lunch.","She skipped breakfast and felt hungry all morning.","Breakfast is usually eaten in the evening.","We ordered breakfast at the restaurant for dinner."]',
 '"She skipped breakfast and felt hungry all morning."', 1),

(2, 'multiple_choice', 'Which word is a synonym for "Speak"?',
 10, '["Listen","Talk","Read","Write"]', '"Talk"', 1);

-- =============================================
-- QUESTIONS FOR EXAM 3: Intermediate Grammar
-- =============================================
INSERT INTO questions (exam_id, question_type, question_text, question_order, options, correct_answer, points) VALUES
(3, 'multiple_choice', 'Choose the correct form: She ___ never been to Japan before.',
 1, '["have","has","had","is"]', '"has"', 1),

(3, 'multiple_choice', 'Choose the correct form: If it ___ tomorrow, we will cancel the outdoor event.',
 2, '["rain","rains","rained","will rain"]', '"rains"', 1),

(3, 'multiple_choice', 'Choose the correct form: They ___ in this city for over ten years.',
 3, '["live","lived","have lived","are living"]', '"have lived"', 1),

(3, 'multiple_choice', 'Choose the correct form: He ___ his car keys last Monday and could not find them.',
 4, '["lose","loses","lost","has lost"]', '"lost"', 1),

(3, 'multiple_choice', 'Choose the correct form: If I ___ more money, I would travel to Europe.',
 5, '["have","has","had","would have"]', '"had"', 1),

(3, 'multiple_choice', 'Choose the correct form: Have you ___ your homework yet?',
 6, '["finish","finished","finishing","finishes"]', '"finished"', 1),

(3, 'multiple_choice', 'Choose the correct form: She ___ her job three months ago and is still looking for a new one.',
 7, '["lose","loses","lost","has lost"]', '"lost"', 1),

(3, 'multiple_choice', 'Choose the correct form: If you exercise regularly, you ___ healthier.',
 8, '["feel","feels","will feel","would feel"]', '"will feel"', 1),

(3, 'multiple_choice', 'Choose the correct form: I have just ___ a very interesting book about artificial intelligence.',
 9, '["read","reads","reading","readed"]', '"read"', 1),

(3, 'multiple_choice', 'Choose the correct form: If she ___ the president, she would improve the education system.',
 10, '["is","was","were","will be"]', '"were"', 1);

-- =============================================
-- QUESTIONS FOR EXAM 4: Business English
-- =============================================
INSERT INTO questions (exam_id, question_type, question_text, question_order, options, correct_answer, points) VALUES
(4, 'multiple_choice', 'The final date by which a task must be completed is called a ___.',
 1, '["meeting","deadline","presentation","agenda"]', '"deadline"', 1),

(4, 'multiple_choice', 'People who work together in the same office are called ___.',
 2, '["customers","clients","colleagues","competitors"]', '"colleagues"', 1),

(4, 'multiple_choice', 'Choose the correct meaning of "Negotiate" in a business context:',
 3, '["To give a presentation","To discuss terms to reach an agreement","To send an email","To attend a meeting"]',
 '"To discuss terms to reach an agreement"', 1),

(4, 'multiple_choice', 'A formal talk given to an audience, often with visual aids, is called a ___.',
 4, '["discussion","interview","presentation","negotiation"]', '"presentation"', 1),

(4, 'multiple_choice', 'Which sentence uses "Meeting" correctly?',
 5, '["The meeting was cancelled due to bad weather.","She meeting with her boss tomorrow.","We have a meeting at the restaurant for dinner.","I will going to the meeting at 9am."]',
 '"The meeting was cancelled due to bad weather."', 1),

(4, 'multiple_choice', 'Choose the word that best fits: "We need to ___ the price before signing the contract."',
 6, '["negotiate","meeting","present","deadline"]', '"negotiate"', 1),

(4, 'multiple_choice', 'What does "Agenda" mean in a business meeting context?',
 7, '["A list of topics to be discussed","A type of business card","An office supply","A financial report"]',
 '"A list of topics to be discussed"', 1),

(4, 'multiple_choice', 'Fill in the blank: "Please submit your report before the ___ on Friday."',
 8, '["meeting","colleague","deadline","presentation"]', '"deadline"', 1);

-- =============================================
-- QUESTIONS FOR EXAM 5: Full Test
-- =============================================
INSERT INTO questions (exam_id, question_type, question_text, question_order, options, correct_answer, points) VALUES
(5, 'multiple_choice', 'Grammar: Choose the correct form: She ___ to the gym three times a week to stay fit.',
 1, '["go","goes","going","gone"]', '"goes"', 1),

(5, 'multiple_choice', 'Grammar: Choose the correct form: They ___ dinner when the phone rang.',
 2, '["have","were having","had","are having"]', '"were having"', 1),

(5, 'multiple_choice', 'Grammar: Choose the correct form: He has ___ visited this beautiful temple twice.',
 3, '["ever","already","yet","just"]', '"already"', 1),

(5, 'multiple_choice', 'Grammar: Choose the correct form: If she ___ harder, she would get better grades.',
 4, '["studies","studied","will study","has studied"]', '"studied"', 1),

(5, 'multiple_choice', 'Vocabulary: What does "Destination" mean?',
 5, '["Phương tiện di chuyển","Điểm đến","Hành lý","Vé máy bay"]', '"Điểm đến"', 1),

(5, 'multiple_choice', 'Vocabulary: Which word means "Phân tích" in English?',
 6, '["Summarize","Evaluate","Analyze","Describe"]', '"Analyze"', 1),

(5, 'multiple_choice', 'Vocabulary: Choose the correct meaning of "Hypothesis":',
 7, '["Kết luận","Dữ liệu","Giả thuyết","Thí nghiệm"]', '"Giả thuyết"', 1),

(5, 'multiple_choice', 'Reading: Which sentence is grammatically CORRECT?',
 8, '["She don''t like coffee.","He goes to school every day.","They is playing football.","I are a student."]',
 '"He goes to school every day."', 1),

(5, 'multiple_choice', 'Reading: Choose the word that does NOT belong to the group: breakfast, lunch, dinner, passport.',
 9, '["breakfast","lunch","dinner","passport"]', '"passport"', 1),

(5, 'multiple_choice', 'Grammar: Choose the correct form: ___ you ever tried Vietnamese pho before?',
 10, '["Do","Did","Have","Are"]', '"Have"', 1),

(5, 'multiple_choice', 'Vocabulary: What is the opposite of "Delicious"?',
 11, '["Tasty","Yummy","Disgusting","Fresh"]', '"Disgusting"', 1),

(5, 'multiple_choice', 'Grammar: Fill in the blank: "If you ___ to the party, you will have a great time."',
 12, '["come","came","will come","would come"]', '"come"', 1),

(5, 'multiple_choice', 'Vocabulary: A document required for international travel is called a ___.',
 13, '["Ticket","Visa","Passport","ID card"]', '"Passport"', 1),

(5, 'multiple_choice', 'Grammar: Choose the correct form: She has been working at this company ___ five years.',
 14, '["since","for","ago","before"]', '"for"', 1),

(5, 'multiple_choice', 'Vocabulary: Which word best describes something very important or noticeable?',
 15, '["Significant","Ordinary","Common","Regular"]', '"Significant"', 1);