/* Railphoto — compatibility stub for old map loaders.
   The DSP page does not contain a map, but older modules may try to load this file.
   Keep the file present so that this optional load never produces a visible error. */
(function(){
  'use strict';
  window.__railphotoMapLoaded = true;
  window.__railphotoMapReady = true;
})();
