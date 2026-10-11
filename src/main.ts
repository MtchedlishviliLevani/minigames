import './styles/index.scss';
import { mountApp } from './app';
import { initSession } from './auth/authState';
import { startRouter } from './router/router';

startRouter();
initSession();
mountApp(document.body);
