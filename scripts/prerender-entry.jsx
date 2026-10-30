import { renderToString } from 'react-dom/server';
import Site, { FAQS } from '../src/components/Site.jsx';
import { NotFound, Privacy, Terms } from '../src/components/Legal.jsx';
import { ArticlesIndex, ArticlePage } from '../src/components/Journal.jsx';
import { ARTICLES } from '../src/content/articles.js';
import { AboutPage, ContactPage, ProductsPage, RatesPage } from '../src/components/Pages.jsx';

export const renderAbout = () => renderToString(<AboutPage />);
export const renderContact = () => renderToString(<ContactPage />);
export const renderProducts = () => renderToString(<ProductsPage />);
export const renderRates = () => renderToString(<RatesPage />);

export const render = () => renderToString(<Site />);
export const renderPrivacy = () => renderToString(<Privacy />);
export const renderTerms = () => renderToString(<Terms />);
export const renderNotFound = () => renderToString(<NotFound />);
export const renderJournal = () => renderToString(<ArticlesIndex />);
export const renderArticle = (slug) => renderToString(<ArticlePage slug={slug} />);
export const articles = ARTICLES;
export const faqs = FAQS;
