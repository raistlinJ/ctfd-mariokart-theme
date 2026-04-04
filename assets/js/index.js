import Alpine from 'alpinejs';
import CTFd from '@ctfdio/ctfd-js';
import * as bootstrap from 'bootstrap';

window.Alpine = Alpine;
window.CTFd = CTFd;
window.bootstrap = bootstrap;

CTFd.init(window.init);
Alpine.start();

console.log('Mario Kart Theme Loaded!');

// Alpine component for drifting effect
Alpine.data('kart', () => ({
  isDrifting: false,
  startDrift() { this.isDrifting = true; },
  stopDrift() { this.isDrifting = false; }
}));
