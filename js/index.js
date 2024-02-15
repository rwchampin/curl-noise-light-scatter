import { Sketch } from './Sketch';

const init = () => {
  new Sketch({
    dom: document.getElementById('container')
  });
};

if (document.readyState === 'complete') {
  init();
} else {
  document.addEventListener('DOMContentLoaded', init);
}