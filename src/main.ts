import './styles/index.scss';
import { mountApp } from './app';
import { startRouter } from './router/router';

startRouter();
mountApp(document.body);
