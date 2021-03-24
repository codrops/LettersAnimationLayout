import { gsap } from 'gsap';
import { PanelItem } from './panelItem';

import "splitting/dist/splitting.css";
import "splitting/dist/splitting-cells.css";
import Splitting from "splitting";

// initialize Splitting
const splitting = Splitting();

Array.prototype.except = function(val) {
    return this.filter(function(x) { return x !== val; });        
}; 

export class Panel {
    constructor(el) {
        this.DOM = {el: el};
        this.DOM.items = [...this.DOM.el.querySelectorAll('.panel__item')];
        // array of Item
        this.items = [];
        this.DOM.items.forEach(item => this.items.push(new PanelItem(item)));
        // position the images and the subtitle chars (centered on top of the image)
        this.layout();
        // Init events
        this.initEvents();
    }
    calcImgPosition(imgWrap) {
        const imgRect = imgWrap.getBoundingClientRect();
        // the second image will be in the center of the panel, while the first and third will be left and right aligned to the panel
        const centeredVal = this.rect.width/2 - imgRect.width/2;
        let tx = 0;
        switch (this.DOM.items.indexOf(imgWrap.parentNode)) {
            case 0: 
                tx = centeredVal - imgRect.width - this.marginImages;
                break;
            case 2: 
                tx = centeredVal + imgRect.width + this.marginImages;
                break;
            default: 
                tx = centeredVal;
                break;
        }
        return {tx: tx};
    }
    positionItemChars(item) {
        const imgRect = item.DOM.imgWrap.getBoundingClientRect();
        for (const [_,char] of item.DOM.subtitleChars.entries()) {
            // reset values (for resize purposes)
            gsap.set(char, {x: 0, y: 0});
            // translate the char
            const subtitleCharRect = char.getBoundingClientRect();
            const charPosition = {
                x: imgRect.left + imgRect.width/2 - subtitleCharRect.left - subtitleCharRect.width/2 + gsap.utils.random(-150,150),
                y: imgRect.top + imgRect.height/2 - subtitleCharRect.top - subtitleCharRect.height/2 + gsap.utils.random(-250,250)
            };
            gsap.set(char, charPosition);
            char.dataset.tx = charPosition.x;
            char.dataset.ty = charPosition.y;
        }
    }
    layout() {
        //if ( this.isOpen ) return;

        this.rect = this.DOM.el.getBoundingClientRect();
        // margin between the images
        this.marginImages = parseInt(getComputedStyle(document.body).getPropertyValue('--margin-images'), 10);

        for (const [index,item] of this.items.entries()) {
            if ( this.isOpen && index === this.currentItemIdx ) {
                continue;
            }
            
            // how much to translate the image
            // initially all the images are stacked and left aligned with the main "".panel"
            const imgPosition = this.calcImgPosition(item.DOM.imgWrap);
            // set the new position
            gsap.set(item.DOM.imgWrap, {x: imgPosition.tx});
            // now let's center all the panel item's subtitle chars on top of the image
            this.positionItemChars(item);
        }
    }
    initEvents() {
        // resize
        window.addEventListener('resize', () => this.layout());

        // mouseenter/mouseleave/click/close
        for (const item of this.items) {
            item.DOM.imgWrap.addEventListener('mouseenter', () => this.showItemChars(item));
            item.DOM.imgWrap.addEventListener('mouseleave', () => this.hideItemChars(item));
            item.DOM.imgWrap.addEventListener('click', () => this.openItem(item));
            item.DOM.closeCtrl.addEventListener('click', () => this.closeItem(item));
        }
    }
    showItemChars(item) {
        if ( this.isOpen ) return;

        item.killActiveTimeline();

        // reset
        this.positionItemChars(item);

        item.timelineIn = gsap.timeline()
        .addLabel('start', 0)
        .set(item.DOM.subtitleText, {
            opacity: 1
        }, 'start')
        // random value for the scale
        .set(item.DOM.subtitleChars, {
            opacity: 0,
            scale: () => gsap.utils.random(1.1,2.1)
        }, 'start')
        // add/subtract a random value to the current translation value of each char
        .to(item.DOM.subtitleChars, {
            duration: 0.2,
            ease: 'power2.in',
            x: i => `+=${i%2 ? 0 : gsap.utils.random(-40,40)}`,
            y: i => `+=${i%2 ? gsap.utils.random(-40,40) : 0}`,
            opacity: 1,
            stagger: 0.01
        }, 'start')
        // also scale up the image and its parent
        .to(item.DOM.img, {
            duration: 1,
            ease: 'power4',
            scale: 1.1
        }, 'start')
        .to(item.DOM.imgWrap, {
            duration: 1,
            ease: 'power4',
            scale: 0.95
        }, 'start');
    }
    hideItemChars(item) {
        if ( this.isOpen ) return;

        item.killActiveTimeline();

        item.timelineOut = gsap.timeline()
        .addLabel('start', 0)
        .to(item.DOM.subtitleChars, {
            duration: 0.3,
            ease: 'power3.inOut',
            x: i => `+=${i%2 ? gsap.utils.random(-20,20) : 0}`,
            y: i => `+=${i%2 ? 0 : gsap.utils.random(-20,20)}`,
            opacity: 0,
            stagger: 0.01
        }, 'start')
        .to([item.DOM.img,item.DOM.imgWrap], {
            duration: 1,
            ease: 'power4',
            scale: 1
        }, 'start')
        .set(item.DOM.subtitleChars, {
            x: (_,t) => t.dataset.tx,
            y: (_,t) => t.dataset.ty,
            scale: 1
        })
        .set(item.DOM.subtitleText, {
            opacity: 0
        })
    }
    openItem(item) {
        if ( this.isOpen ) return;
        this.isOpen = true;

        this.currentItemIdx = this.items.indexOf(item);

        //item.killActiveTimeline();

        // all other items (the .imgWrap element)
        const otherImgWrap = this.items.except(item).map(item => item.DOM.imgWrap);

        gsap.timeline({
            onStart: () => item.DOM.el.classList.add('panel__item--open')
        })
        .addLabel('start', 0)
        // translate and fade out all other items (the .imgWrap element)
        .to(otherImgWrap, {
            duration: 1,
            ease: 'power4.inOut',
            x: '+=20%',
            opacity: 0
        }, 'start')
        // translate the .imgWrap element of the clicked item to 0
        .to(item.DOM.imgWrap, {
            duration: 1,
            ease: 'power4.inOut',
            x: 0
        }, 'start')
        // scale both the image and its parent down to 1
        .to([item.DOM.img,item.DOM.imgWrap], {
            duration: 1,
            ease: 'power4.inOut',
            scale: 1
        }, 'start')
        // show/animate the subtitle header element
        .to(item.DOM.subtitleHeader, {
            duration: 1,
            ease: 'power4.inOut',
            startAt: {x: 20},
            opacity: 1,
            x: 0
        }, 'start')
        // show/animate the close button
        .to(item.DOM.closeCtrl, {
            duration: 1,
            ease: 'power4.inOut',
            startAt: {scale: 0},
            opacity: 1,
            scale: 1
        }, 'start')
        // chars translate back to 0 and scale down to 1
        .to(item.DOM.subtitleChars, {
            duration: 0.4,
            ease: 'power4.inOut',
            x: 0,
            y: 0,
            scale: 1,
            opacity: 1,
            stagger: 0.03
        }, 'start+=0.1')
        // animate in the title
        .to(item.DOM.titleTexts, {
            duration: 0.8,
            ease: 'power4',
            startAt: {x: i => i ? 100 : -100},
            opacity: 1,
            x: 0,
            rotation: 0.001,
            stagger: -0.05
        }, 'start+=0.6')
    }
    closeItem(item) {
        if ( !this.isOpen ) return;

        this.currentItemIdx = -1;

        //item.killActiveTimeline();

        gsap.timeline({
            onComplete: () => {
                item.DOM.el.classList.remove('panel__item--open');
                this.isOpen = false;
            }
        })
        .addLabel('start', 0)
        .to(item.DOM.closeCtrl, {
            duration: 0.7,
            ease: 'power3',
            opacity: 0,
            scale: 0.5
        }, 'start')
        .to(item.DOM.titleTexts, {
            duration: 0.7,
            ease: 'power4.inOut',
            opacity: 0,
            x: i => i ? 100 : -100,
            rotation: 0.001
        }, 'start')
        .to(item.DOM.subtitleHeader, {
            duration: 0.7,
            ease: 'power4.inOut',
            opacity: 0,
            x: 20
        }, 'start')
        .to(item.DOM.imgWrap, {
            duration: 0.7,
            ease: 'power4.inOut',
            x: (_,t) => this.calcImgPosition(t).tx
        }, 'start')
        .to(this.items.except(item).map(item => item.DOM.imgWrap), {
            duration: 0.7,
            ease: 'power4.inOut',
            startAt: {x: '+=20%'},
            x: (_,t) => this.calcImgPosition(t).tx,
            opacity: 1
        }, 'start')
        .to(item.DOM.subtitleChars, {
            duration: 0.4,
            ease: 'power4.inOut',
            x: i => gsap.utils.random(-100,100),
            y: i => gsap.utils.random(-100,100),
            scale: () => gsap.utils.random(1.1,2.1),
            opacity: 0,
            stagger: -0.01
        }, 'start')
    }
}