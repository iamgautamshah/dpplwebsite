import { renderToString } from 'react-dom/server';
import Site from '../src/components/Site.jsx';
import { Privacy, Terms } from '../src/components/Legal.jsx';
import { ArticlesIndex, ArticlePage } from '../src/components/Journal.jsx';
import { ARTICLES } from '../src/content/articles.js';

export const render = () => renderToString(<Site />);
export const renderPrivacy = () => renderToString(<Privacy />);
export const renderTerms = () => renderToString(<Terms />);
export const renderJournal = () => renderToString(<ArticlesIndex />);
export const renderArticle = (slug) => renderToString(<ArticlePage slug={slug} />);
export const articles = ARTICLES;
