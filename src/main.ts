import './styles/tokens.css';
import './styles/base.css';
import './styles/board.css';
import './styles/hud.css';
import gsap from 'gsap';
import { buildBoard } from './board';
import { $, $$, mountAvatars } from './ui/dom';
import { ICON } from './ui/icons';

mountAvatars();
for (const crown of $$('.crown')) crown.innerHTML = ICON.crown;

gsap.set('#menu', { autoAlpha: 0 });
gsap.set(['.hero', '.vs'], { autoAlpha: 0 });
gsap.set('#game', { autoAlpha: 1 });
buildBoard($('#board'));
