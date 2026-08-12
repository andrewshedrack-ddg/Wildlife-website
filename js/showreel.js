/* WildGuard showreel — a single square autoplay player that cycles field
   footage clips one by one. Starts muted (browser autoplay policy), with a
   middle-pitched volume (0.5) once the user unmutes from the control. */
(function () {
  'use strict';
  if (window.WildGuardShowreel) return;
  window.WildGuardShowreel = {};

  function init() {
    var root = document.getElementById('wildguard-showreel');
    if (!root || !root.dataset.clips) return;

    var clips = [];
    try { clips = JSON.parse(root.dataset.clips) || []; } catch (e) { clips = []; }
    if (!clips.length) return;

    var video = root.querySelector('video');
    if (!video) return;

    var titleEl = document.getElementById('showreel-title');
    var counterEl = document.getElementById('showreel-counter');
    var liveEl = document.getElementById('showreel-live');
    var muteBtn = document.getElementById('showreel-mute');
    var index = 0;
    var volume = 0.5;
    var userInteracted = false;

    function load(i) {
      index = ((i % clips.length) + clips.length) % clips.length;
      var clip = clips[index];
      video.src = clip.src;
      video.load();
      if (titleEl) titleEl.textContent = clip.title;
      if (counterEl) counterEl.textContent = (index + 1) + ' / ' + clips.length;
      if (liveEl) liveEl.textContent = 'Now Playing';
    }

    function tryUnmute() {
      if (!userInteracted) return;
      video.muted = false;
      video.volume = volume;
      if (muteBtn) {
        muteBtn.classList.add('active');
        muteBtn.querySelector('.sg-mute-off').style.display = 'block';
        muteBtn.querySelector('.sg-mute-on').style.display = 'none';
      }
    }

    function syncMuteUI() {
      if (!muteBtn) return;
      var muted = video.muted;
      muteBtn.classList.toggle('active', !muted);
      muteBtn.querySelector('.sg-mute-off').style.display = muted ? 'none' : 'block';
      muteBtn.querySelector('.sg-mute-on').style.display = muted ? 'block' : 'none';
    }

    video.addEventListener('ended', function () {
      load(index + 1);
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    });

    if (muteBtn) {
      muteBtn.addEventListener('click', function () {
        userInteracted = true;
        if (video.muted) {
          tryUnmute();
        } else {
          video.muted = true;
        }
        syncMuteUI();
      });
    }

    if (root) {
      root.addEventListener('pointerdown', function () {
        userInteracted = true;
        tryUnmute();
      }, { once: true });
    }

    video.volume = volume;
    video.muted = true;
    load(0);
    var p = video.play();
    if (p && p.catch) p.catch(function () {
      root.classList.add('sg-await-interaction');
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();