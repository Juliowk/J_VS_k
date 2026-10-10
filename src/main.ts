import './styles/tokens.css';
import './styles/base.css';
import { $$, mountAvatars } from './ui/dom';
import { ICON } from './ui/icons';

mountAvatars();
for (const crown of $$('.crown')) crown.innerHTML = ICON.crown;
