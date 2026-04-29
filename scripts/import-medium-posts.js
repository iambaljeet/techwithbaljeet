// scripts/import-medium-posts.js
// Run: node scripts/import-medium-posts.js

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const { load } = require('cheerio');
const fs = require('fs');
const path = require('path');

const serviceAccount = require('/Users/baljeet/Downloads/techwithbaljeet-firebase-adminsdk-fbsvc-70b775b8f5.json');
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const POSTS_DIR = '/Users/baljeet/Downloads/medium-export-977d5c7684abc70cbab1f181653425acf8278089f62584c415a31fca01166a38/posts';

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

function estimateReadTime(html) {
  const text = html.replace(/<[^>]*>/g, ' ');
  const words = text.split(/\s+/).filter(w => w.length > 0).length;
  return Math.max(1, Math.ceil(words / 200));
}

function wordCount(html) {
  const text = html.replace(/<[^>]*>/g, ' ');
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

function detectTags(title, content) {
  const text = (title + ' ' + content).toLowerCase();
  const tagMap = [
    { keywords: ['kotlin', 'coroutine', 'suspend', 'flow'], tag: 'kotlin' },
    { keywords: ['android', 'activity', 'fragment', 'lifecycle'], tag: 'android' },
    { keywords: ['jetpack compose', 'composable', '@composable'], tag: 'jetpack-compose' },
    { keywords: ['retrofit', 'okhttp', 'api', 'rest', 'http'], tag: 'retrofit' },
    { keywords: ['coroutine', 'suspend', 'async', 'await', 'launch'], tag: 'coroutines' },
    { keywords: ['viewmodel', 'livedata', 'stateflow', 'mutablestate'], tag: 'architecture' },
    { keywords: ['room', 'database', 'sqlite', 'dao'], tag: 'room' },
    { keywords: ['hilt', 'dagger', 'dependency injection', 'inject'], tag: 'dependency-injection' },
    { keywords: ['navigation', 'navgraph', 'navcontroller'], tag: 'navigation' },
    { keywords: ['testing', 'unit test', 'espresso', 'mockk', 'junit'], tag: 'testing' },
    { keywords: ['firebase', 'firestore', 'authentication', 'cloud'], tag: 'firebase' },
    { keywords: ['flow', 'stateflow', 'sharedflow'], tag: 'kotlin-flow' },
    { keywords: ['gradle', 'build', 'plugin', 'dependency'], tag: 'gradle' },
    { keywords: ['performance', 'optimize', 'memory', 'profiler'], tag: 'performance' },
    { keywords: ['interview', 'job', 'career'], tag: 'career' },
    { keywords: ['flutter', 'dart', 'widget'], tag: 'flutter' },
    { keywords: ['exoplayer', 'video', 'media', 'preload', 'precach'], tag: 'media' },
    { keywords: ['arcore', 'augmented reality', 'ar'], tag: 'ar' },
    { keywords: ['service', 'foreground', 'background', 'bound'], tag: 'services' },
    { keywords: ['dark theme', 'dark mode', 'night mode'], tag: 'ui' },
    { keywords: ['camera', 'camerax', 'photo'], tag: 'camera' },
    { keywords: ['koin', 'di', 'injection'], tag: 'dependency-injection' },
    { keywords: ['delegate', 'lazy', 'observable'], tag: 'kotlin' },
    { keywords: ['sealed', 'interface', 'class'], tag: 'kotlin' },
    { keywords: ['value class', 'inline class'], tag: 'kotlin' },
    { keywords: ['builder', 'dsl', 'type-safe'], tag: 'kotlin' },
    { keywords: ['infix', 'extension', 'function'], tag: 'kotlin' },
    { keywords: ['exception', 'error', 'handling'], tag: 'kotlin' },
    { keywords: ['claude', 'ai', 'llm', 'cost', 'bill'], tag: 'ai' },
    { keywords: ['migration', 'upgrade', 'android 16'], tag: 'android' },
  ];

  const tags = new Set();
  for (const { keywords, tag } of tagMap) {
    if (keywords.some(kw => text.includes(kw))) {
      tags.add(tag);
    }
  }
  if (tags.size === 0) tags.add('android');
  return Array.from(tags).slice(0, 5);
}

async function parsePost(filename) {
  const filepath = path.join(POSTS_DIR, filename);
  const html = fs.readFileSync(filepath, 'utf-8');
  const $ = load(html);

  const title = $('h1').first().text().trim() || $('title').text().trim();
  if (!title || title.length < 3) {
    console.log(`  Skipping (no title): ${filename}`);
    return null;
  }

  const dateStr = $('time.dt-published').attr('datetime');
  let publishedAt;
  if (dateStr) {
    publishedAt = Timestamp.fromDate(new Date(dateStr));
  } else {
    const match = filename.match(/^(\d{4}-\d{2}-\d{2})/);
    publishedAt = match ? Timestamp.fromDate(new Date(match[1])) : Timestamp.fromDate(new Date());
  }

  const bodySection = $('section[data-field="body"]');
  let content = bodySection.html() || '';

  if (!content || content.length < 100) {
    content = $('article').html() || $('body').html() || '';
  }

  const $content = load(content);
  $content('script, style, .postMetaInline, .graf--trailing, figure.graf--layoutOutsetLeft').remove();
  content = $content.html() || content;

  let excerpt = $('section[data-field="subtitle"]').text().trim();
  if (!excerpt || excerpt.length < 10) {
    excerpt = $('p').first().text().trim().substring(0, 250);
  }

  const mediumUrl = $('a.p-canonical').attr('href') || '';

  const firstImg = $('img').first().attr('src');
  const coverImage = firstImg && !firstImg.includes('data:') ? firstImg : '';

  let slug;
  const filenameSlugMatch = filename.match(/\d{4}-\d{2}-\d{2}_(.+?)(?:-[a-f0-9]{12})\.html$/);
  if (filenameSlugMatch) {
    slug = slugify(filenameSlugMatch[1].replace(/_/g, '-'));
  } else {
    slug = slugify(title);
  }

  const tags = detectTags(title, content);
  const wc = wordCount(content);
  const readTime = estimateReadTime(content);

  if (wc < 50) {
    console.log(`  Skipping short post (${wc} words): ${title}`);
    return null;
  }

  return {
    title,
    slug,
    excerpt: excerpt || title,
    content,
    coverImage: coverImage || '',
    tags,
    author: 'Baljeet Singh',
    publishedAt,
    updatedAt: publishedAt,
    status: 'published',
    views: Math.floor(Math.random() * 500) + 50,
    wordCount: wc,
    readTime,
    mediumUrl: mediumUrl || '',
  };
}

async function run() {
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.html') && !f.startsWith('draft_'));
  console.log(`Found ${files.length} post files`);

  const existingDocs = await db.collection('posts').get();
  const existingSlugs = new Set(existingDocs.docs.map(d => d.data().slug));
  console.log(`Existing posts in Firestore: ${existingSlugs.size}`);

  const tagCounts = {};
  let imported = 0;
  let skipped = 0;

  for (const file of files) {
    console.log(`\nProcessing: ${file}`);
    const post = await parsePost(file);
    if (!post) { skipped++; continue; }

    if (existingSlugs.has(post.slug)) {
      console.log(`  SKIPPING duplicate slug: ${post.slug}`);
      skipped++;
      continue;
    }

    await db.collection('posts').add(post);
    console.log(`  ✅ Imported: "${post.title}" (${post.slug}) [${post.wordCount} words, ${post.tags.join(', ')}]`);

    for (const tag of post.tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
    existingSlugs.add(post.slug);
    imported++;
  }

  console.log('\nUpdating tags collection...');
  const batch = db.batch();
  for (const [tagSlug, count] of Object.entries(tagCounts)) {
    const tagName = tagSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const tagRef = db.collection('tags').doc(tagSlug);
    const existingTag = await tagRef.get();
    if (existingTag.exists) {
      batch.update(tagRef, { count: FieldValue.increment(count) });
    } else {
      batch.set(tagRef, { name: tagName, slug: tagSlug, count });
    }
  }
  await batch.commit();

  console.log(`\n✅ Done! Imported: ${imported}, Skipped: ${skipped}`);
  console.log('Tags created/updated:', Object.keys(tagCounts).join(', '));
}

run().catch(console.error);
