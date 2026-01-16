/*
 * Entry Box Block
 * Display a card with image, title, and description from an EDS page's metadata.
 */

import {
  createOptimizedPicture,
} from '../../scripts/aem.js';

/**
 * Fetches metadata from an EDS page.
 * @param {string} path The path to the page
 * @returns {Promise<object>} The metadata object with title, description, and image
 */
async function fetchPageMetadata(path) {
  if (!path || !path.startsWith('/')) {
    return null;
  }

  try {
    const resp = await fetch(path);
    if (!resp.ok) {
      return null;
    }

    const html = await resp.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const getMetaContent = (name) => {
      const attr = name.includes(':') ? 'property' : 'name';
      const meta = doc.head.querySelector(`meta[${attr}="${name}"]`);
      return meta ? meta.content : '';
    };

    return {
      title: getMetaContent('og:title') || doc.title || '',
      description: getMetaContent('og:description') || getMetaContent('description') || '',
      image: getMetaContent('og:image') || '',
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch page metadata:', error);
    return null;
  }
}

/**
 * Creates the card HTML structure.
 * @param {object} metadata The metadata object
 * @param {string} path The page path for the link
 * @returns {HTMLElement} The card element
 */
function createCard(metadata, path) {
  const card = document.createElement('a');
  card.className = 'entry-box-card';
  card.href = path;

  if (metadata.image) {
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'entry-box-image';
    const picture = createOptimizedPicture(metadata.image, metadata.title, false);
    imageWrapper.appendChild(picture);
    card.appendChild(imageWrapper);
  }

  const content = document.createElement('div');
  content.className = 'entry-box-content';

  if (metadata.title) {
    const title = document.createElement('h3');
    title.className = 'entry-box-title';
    title.textContent = metadata.title;
    content.appendChild(title);
  }

  if (metadata.description) {
    const description = document.createElement('p');
    description.className = 'entry-box-description';
    description.textContent = metadata.description;
    content.appendChild(description);
  }

  card.appendChild(content);
  return card;
}

export default async function decorate(block) {
  const link = block.querySelector('a');
  const path = link ? link.getAttribute('href') : block.textContent.trim();

  const metadata = await fetchPageMetadata(path);

  block.textContent = '';

  if (metadata) {
    const card = createCard(metadata, path);
    block.appendChild(card);
  } else {
    block.textContent = 'Failed to load entry';
    block.classList.add('entry-box-error');
  }
}
