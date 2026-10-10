import gsap from 'gsap';

type Target = gsap.TweenTarget;

export const show = (el: Target) => gsap.set(el, { autoAlpha: 1 });
export const hide = (el: Target) => gsap.set(el, { autoAlpha: 0 });

export const isVisible = (el: HTMLElement) => getComputedStyle(el).visibility !== 'hidden';
