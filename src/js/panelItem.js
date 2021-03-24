export class PanelItem {
    constructor(el) {
        this.DOM = {el: el};
        this.DOM.imgWrap = this.DOM.el.querySelector('.panel__item-imgwrap');
        this.DOM.img = this.DOM.imgWrap.querySelector('img');
        this.DOM.title = this.DOM.el.querySelector('.panel__item-title');
        this.DOM.titleTexts = [...this.DOM.title.querySelectorAll('span')];
        this.DOM.subtitle = this.DOM.el.querySelector('.panel__item-subtitle');
        // Splitting will run on this
        this.DOM.subtitleText = this.DOM.subtitle.querySelector('h4');
        // all subtitle chars 
        this.DOM.subtitleChars = [...this.DOM.subtitleText.querySelectorAll('.char')];
        this.DOM.subtitleHeader = this.DOM.subtitle.querySelector('span');
        this.DOM.closeCtrl = this.DOM.el.querySelector('.panel__item-close');
    }
    killActiveTimeline() {
        if( this.timelineOut ) this.timelineOut.kill();
        if( this.timelineIn ) this.timelineIn.kill();
    }
}