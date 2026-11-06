-- Import the eight existing portfolio gallery entries into the editable projects table.
-- Safe to re-run: existing project rows (including later admin edits) are left untouched.
begin;

insert into public.projects
  (slug, title, summary, description, website_url, repository_url, category, status, is_published, sort_order, metadata)
values
  (
    'jpn',
    'JPN',
    'A connectivity platform with account tools, dashboards and project features, designed to help people stay connected wherever they are.',
    'JPN is a connectivity platform with account tools, dashboards and project features.',
    'https://jigar1234nob.github.io/JPN/',
    'https://github.com/Jigar1234Nob/JPN',
    'Web & Platforms',
    'live',
    true,
    10,
    '{"tags":["Web","Dashboard","Connectivity"],"visual_class":"jpn-visual","glyph":"JPN."}'::jsonb
  ),
  (
    'spcitclub-mc-server',
    'SPCITCLUB MC Server',
    'A Minecraft community server with Java and Bedrock cross-play, community spaces and ongoing server administration.',
    'A Minecraft community server with Java and Bedrock cross-play, community spaces and ongoing server administration.',
    'https://spcitclub.me',
    'https://discord.gg/spcitclubmc',
    'Community & Games',
    'live',
    true,
    20,
    '{"tags":["Minecraft","Java + Bedrock","Community"],"visual_class":"spc-visual","glyph":"SPC"}'::jsonb
  ),
  (
    'personal-portfolio',
    'Personal Portfolio',
    'This portfolio: a responsive home for projects, creative work, technology interests and links to explore more.',
    'A responsive portfolio website built with HTML, CSS and JavaScript.',
    'https://jigar.au',
    'https://github.com/Jigar1234Nob/site',
    'Web & Platforms',
    'live',
    true,
    30,
    '{"tags":["HTML","CSS","JavaScript"],"visual_class":"code-visual","glyph":"J."}'::jsonb
  ),
  (
    'web-app-development',
    'Web & App Development',
    'Exploring interfaces, account flows, practical tools and app ideas, with a focus on learning through implementation.',
    'Exploring interfaces, account flows, practical tools and app ideas, with a focus on learning through implementation.',
    'https://github.com/Jigar1234Nob',
    null,
    'Software & Apps',
    'in_progress',
    true,
    40,
    '{"tags":["UI/UX","Apps","Web"],"visual_class":"code-visual","glyph":"</>"}'::jsonb
  ),
  (
    'home-lab-virtualisation',
    'Home Lab & Virtualisation',
    'Learning by working with servers, virtual machines, containers, self-hosted services and different operating systems.',
    'Learning by working with servers, virtual machines, containers, self-hosted services and different operating systems.',
    'https://github.com/Jigar1234Nob',
    null,
    'IT & Systems',
    'in_progress',
    true,
    50,
    '{"tags":["Linux","Virtualisation","Servers"],"visual_class":"lab-visual","glyph":"⌘"}'::jsonb
  ),
  (
    'linux-windows-systems',
    'Linux & Windows Systems',
    'Exploring operating systems, system configuration, hardware, networking and the troubleshooting that makes everything work.',
    'Exploring operating systems, system configuration, hardware, networking and the troubleshooting that makes everything work.',
    'https://github.com/Jigar1234Nob',
    null,
    'IT & Systems',
    'in_progress',
    true,
    60,
    '{"tags":["Linux","Windows","Hardware"],"visual_class":"lab-visual","glyph":"01"}'::jsonb
  ),
  (
    'music-side-project',
    'Music · Side Project',
    'Music is a personal creative hobby alongside my main focus on IT, systems and software.',
    'A personal creative hobby alongside the main focus on IT, systems and software.',
    'https://open.spotify.com/artist/1ihmgGU9tknCs3DzSl9rHp?si=26b432162ead4dad',
    null,
    'Music & Media',
    'live',
    true,
    70,
    '{"tags":["Music","Artist","Spotify"],"visual_class":"music-visual","glyph":"♫"}'::jsonb
  ),
  (
    'versatile-foundation-media',
    'Versatile Foundation Media',
    'Video and streaming spaces for creative content, with channels on YouTube and Twitch.',
    'Video and streaming spaces for creative content, with channels on YouTube and Twitch.',
    'https://www.youtube.com/@VersatileFoundation',
    'https://twitch.tv/versatilefoundation',
    'Music & Media',
    'live',
    true,
    80,
    '{"tags":["YouTube","Twitch","Media"],"visual_class":"media-visual","glyph":"▶"}'::jsonb
  )
on conflict (slug) do nothing;

commit;
