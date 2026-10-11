import './styles/index.scss';
import { mountApp } from './app';
import { installAuthGuard } from './auth/authGuard';
import { initSession } from './auth/authState';
import { startRouter } from './router/router';

initSession();
installAuthGuard();
startRouter();
mountApp(document.body);
