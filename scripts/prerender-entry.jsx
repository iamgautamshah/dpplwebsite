import { renderToString } from 'react-dom/server';
import Site from '../src/components/Site.jsx';
import { Privacy, Terms } from '../src/components/Legal.jsx';

export const render = () => renderToString(<Site />);
export const renderPrivacy = () => renderToString(<Privacy />);
export const renderTerms = () => renderToString(<Terms />);
