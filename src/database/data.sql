INSERT INTO authors (name, about, profession, profile_photo_url, email, password_hash)
VALUES
  ('Jane Doe', 'Environmental journalist focusing on Uttarakhand', 'Journalist', '/avatars/jane.jpg', 'jane@example.com', '$2a$10$ABC123fakeHashHereJane'),
  ('John Smith', 'Writes about Himalayan tourism and weather', 'Columnist', '/avatars/john.png', 'john@example.com', '$2a$10$ABC123fakeHashHereJohn');


INSERT INTO admins (username, email, password_hash, role)
VALUES
  ('admin1', 'admin1@example.com', '$2a$10$ABC123fakeAdminHash1', 'super'),
  ('editor1', 'editor1@example.com', '$2a$10$ABC123fakeAdminHash2', 'editor');


INSERT INTO tags (name)
VALUES
  ('culture'),
  ('heritage'),
  ('weather'),
  ('eco-tourism');


INSERT INTO articles (author_id, title, description, content, category, region, status, is_top_news, publish_date)
VALUES
  (1, 'Char Dham Yatra: Record Pilgrims in 2025', 'Massive rise in Char Dham footfall this year...', 'Full article body here...', 'Culture & Heritage', 'Uttarakhand', 'approved', TRUE, '2025-05-22 08:00:00'),
  (2, 'Heavy Rainfall Alert for Garhwal Region', 'IMD issues orange alert for high rainfall', 'Detailed weather update...', 'Weather', 'Garhwal', 'approved', FALSE, '2025-05-22 14:30:00');


INSERT INTO article_tags (article_id, tag_id)
VALUES
  (1, 1), -- culture
  (1, 2), -- heritage
  (2, 3); -- weather


INSERT INTO web_stories (author_id, title, status, region)
VALUES
  (1, 'Eco Projects in the Hills', 'published', 'Chamoli'),
  (2, 'Wildlife Sanctuaries of Uttarakhand', 'draft', 'Nainital');


INSERT INTO slides (web_story_id, image_url, caption, slide_order)
VALUES
  (1, '/stories/eco1.jpg', 'Starting the initiative', 1),
  (1, '/stories/eco2.jpg', 'Forest guards in action', 2),
  (2, '/stories/wild1.jpg', 'The lush Nainital forest', 1);


INSERT INTO ads (type, image_url, title, link_url, description, created_by_admin_id)
VALUES
  ('google', NULL, 'Google Ad Slot A', NULL, NULL, NULL),
  ('admin', '/ads/sponsor1.jpg', 'Himalayan Travel Partner', 'https://himalaya-travel.com', 'Book Char Dham packages at great rates!', 1),
  ('admin', '/ads/event1.jpg', 'Nainital Festival 2025', 'https://nainitalfest.com', 'Don’t miss the cultural events this June', 2);
