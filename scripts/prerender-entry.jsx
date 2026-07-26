import { renderToString } from 'react-dom/server';
import Site from '../src/components/Site.jsx';

export const render = () => renderToString(<Site />);
