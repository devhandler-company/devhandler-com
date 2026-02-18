/* eslint-disable no-console */
/* eslint-disable func-names */
/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
/* eslint-disable no-use-before-define */
const tns = (function () {
  const win = window;

  const raf = win.requestAnimationFrame
    || win.webkitRequestAnimationFrame
    || win.mozRequestAnimationFrame
    || win.msRequestAnimationFrame
    || function (cb) { return setTimeout(cb, 16); };

  const win$1 = window;

  const caf = win$1.cancelAnimationFrame
    || win$1.mozCancelAnimationFrame
    || function (id) { clearTimeout(id); };

  function extend(...args) {
    const target = args[0] || {};
    let i = 1;
    const { length } = args;

    for (; i < length; i += 1) {
      const obj = args[i];
      if (obj !== null) {
        Object.keys(obj).forEach((name) => {
          const copy = obj[name];
          // console.log(copy);
          if (target !== copy && copy !== undefined) {
            target[name] = copy;
          }
        });
      }
    }
    return target;
  }

  function checkStorageValue(value) {
    return ['true', 'false'].indexOf(value) >= 0 ? JSON.parse(value) : value;
  }

  function setLocalStorage(storage, key, value, access) {
    if (access) {
      try { storage.setItem(key, value); } catch (e) { /* empty */ }
    }
    return value;
  }

  function getSlideId() {
    const id = window.tnsId;
    window.tnsId = !id ? 1 : id + 1;

    return `tns${window.tnsId}`;
  }

  function getBody() {
    const doc = document;
    let { body } = doc;

    if (!body) {
      body = doc.createElement('body');
      body.fake = true;
    }

    return body;
  }

  // get css-calc

  function calc() {
    const doc = document;
    const body = getBody();
    const div = doc.createElement('div');
    let result = false;

    body.appendChild(div);
    try {
      const str = '(10px * 10)';
      const vals = [`calc${str}`, `-moz-calc${str}`, `-webkit-calc${str}`];
      let val;
      for (let i = 0; i < 3; i += 1) {
        val = vals[i];
        div.style.width = val;
        if (div.offsetWidth === 100) {
          result = val.replace(str, '');
          break;
        }
      }
    } catch (e) { /* empty */ }

    div.remove();

    return result;
  }

  // get subpixel support value

  function percentageLayout() {
    // check subpixel layout supporting
    const doc = document;
    const body = getBody();
    const wrapper = doc.createElement('div');
    const outer = doc.createElement('div');
    let str = '';
    const count = 70;
    const perPage = 3;
    let supported = false;

    wrapper.className = 'tns-t-subp2';
    outer.className = 'tns-t-ct';

    for (let i = 0; i < count; i += 1) {
      str += '<div></div>';
    }

    outer.innerHTML = str;
    wrapper.appendChild(outer);
    body.appendChild(wrapper);

    supported = Math.abs(wrapper.getBoundingClientRect()
      .left - outer.children[count - perPage].getBoundingClientRect().left) < 2;
    wrapper.remove();

    return supported;
  }

  function mediaquerySupport() {
    const doc = document;
    const body = getBody();
    const div = doc.createElement('div');
    const style = doc.createElement('style');
    const rule = '@media all and (min-width:1px){.tns-mq-test{position:absolute}}';

    style.type = 'text/css';
    div.className = 'tns-mq-test';

    body.appendChild(style);
    body.appendChild(div);

    if (style.styleSheet) {
      style.styleSheet.cssText = rule;
    } else {
      style.appendChild(doc.createTextNode(rule));
    }

    const position = window.getComputedStyle
      ? window.getComputedStyle(div).position : div.currentStyle.position;

    div.remove();

    return position === 'absolute';
  }

  // create and append style sheet
  function createStyleSheet(media) {
    // Create the <style> tag
    const style = document.createElement('style');
    if (media) { style.setAttribute('media', media); }

    // Add the <style> element to the page
    document.querySelector('head').appendChild(style);

    return style.sheet ? style.sheet : style.styleSheet;
  }

  // cross browsers addRule method
  function addCSSRule(sheet, selector, rules, index) {
    // return raf(function() {
    if ('insertRule' in sheet) {
      sheet.insertRule(`${selector}{${rules}}`, index);
    } else {
      sheet.addRule(selector, rules, index);
    }
  }

  function getCssRulesLength(sheet) {
    const rule = ('insertRule' in sheet) ? sheet.cssRules : sheet.rules;
    return rule.length;
  }

  function toDegree(y, x) {
    return Math.atan2(y, x) * (180 / Math.PI);
  }

  function getTouchDirection(angle, range) {
    let direction = false;
    const gap = Math.abs(90 - Math.abs(angle));

    if (gap >= 90 - range) {
      direction = 'horizontal';
    } else if (gap <= range) {
      direction = 'vertical';
    }

    return direction;
  }

  // https://toddmotto.com/ditch-the-array-foreach-call-nodelist-hack/
  function forEach(arr, callback, scope) {
    for (let i = 0, l = arr.length; i < l; i += 1) {
      callback.call(scope, arr[i], i);
    }
  }

  const classListSupport = 'classList' in document.createElement('_');

  const hasClass = classListSupport
    ? function (el, str) { return el.classList.contains(str); }
    : function (el, str) { return el.className.indexOf(str) >= 0; };

  const addClass = classListSupport
    && function (el, str) {
      if (!hasClass(el, str)) { el.classList.add(str); }
    };

  const removeClass = classListSupport
    && function (el, str) {
      if (hasClass(el, str)) { el.classList.remove(str); }
    };

  function hasAttr(el, attr) {
    return el.hasAttribute(attr);
  }

  function isNodeList(el) {
    // Only NodeList has the "item()" function
    return typeof el.item !== 'undefined';
  }

  function setAttrs(els, attrs) {
    els = (isNodeList(els) || els instanceof Array) ? els : [els];
    if (Object.prototype.toString.call(attrs) !== '[object Object]') { return; }

    for (let i = els.length; i--;) {
      Object.keys(attrs).forEach((key) => {
        els[i].setAttribute(key, attrs[key]);
      });
    }
  }

  function removeAttrs(els, attrs) {
    els = (isNodeList(els) || els instanceof Array) ? els : [els];
    attrs = (attrs instanceof Array) ? attrs : [attrs];

    const attrLength = attrs.length;
    for (let i = els.length; i--;) {
      for (let j = attrLength; j--;) {
        els[i].removeAttribute(attrs[j]);
      }
    }
  }

  function isVisible(el) {
    return window.getComputedStyle(el).display !== 'none';
  }

  function whichProperty(props) {
    if (typeof props === 'string') {
      const arr = [props];
      const Props = props.charAt(0).toUpperCase() + props.substr(1);
      const prefixes = ['Webkit', 'Moz', 'ms', 'O'];

      prefixes.forEach((prefix) => {
        if (prefix !== 'ms' || props === 'transform') {
          arr.push(prefix + Props);
        }
      });

      props = arr;
    }

    const el = document.createElement('fakeelement');
    for (let i = 0; i < props.length; i += 1) {
      const prop = props[i];
      if (el.style[prop] !== undefined) { return prop; }
    }

    return false; // explicit for ie9-
  }

  function has3DTransforms(tf) {
    if (!tf) { return false; }
    if (!window.getComputedStyle) { return false; }

    const doc = document;
    const body = getBody();
    const el = doc.createElement('p');
    let cssTF = tf.length > 9 ? `-${tf.slice(0, -9).toLowerCase()}-` : '';

    cssTF += 'transform';

    // Add it to the body to get the computed style
    body.insertBefore(el, null);

    el.style[tf] = 'translate3d(1px,1px,1px)';
    const has3d = window.getComputedStyle(el).getPropertyValue(cssTF);

    el.remove();

    return (has3d !== undefined && has3d.length > 0 && has3d !== 'none');
  }

  // get transitionend, animationend based on transitionDuration
  // @propin: string
  // @propOut: string, first-letter uppercase
  // Usage: getEndProperty('WebkitTransitionDuration', 'Transition') => webkitTransitionEnd
  function getEndProperty(propIn, propOut) {
    let endProp = false;
    if (/^Webkit/.test(propIn)) {
      endProp = `webkit${propOut}End`;
    } else if (/^O/.test(propIn)) {
      endProp = `o${propOut}End`;
    } else if (propIn) {
      endProp = `${propOut.toLowerCase()}end`;
    }
    return endProp;
  }

  // Test via a getter in the options object to see if the passive property is accessed
  let supportsPassive = false;
  try {
    const opts = Object.defineProperty({}, 'passive', {
      // eslint-disable-next-line getter-return
      get() {
        supportsPassive = true;
      },
    });
    window.addEventListener('test', null, opts);
  } catch (e) { /* empty */ }
  const passiveOption = supportsPassive ? { passive: true } : false;

  function addEvents(el, obj, preventScrolling) {
    Object.keys(obj).forEach((prop) => {
      const option = ['touchstart', 'touchmove'].indexOf(prop) >= 0 && !preventScrolling ? passiveOption : false;
      el.addEventListener(prop, obj[prop], option);
    });
  }

  function removeEvents(el, obj) {
    Object.keys(obj).forEach((prop) => {
      const option = ['touchstart', 'touchmove'].indexOf(prop) >= 0 ? passiveOption : false;
      el.removeEventListener(prop, obj[prop], option);
    });
  }

  function Events() {
    return {
      topics: {},
      on(eventName, fn) {
        this.topics[eventName] = this.topics[eventName] || [];
        this.topics[eventName].push(fn);
      },
      emit(eventName, data) {
        data.type = eventName;
        if (this.topics[eventName]) {
          this.topics[eventName].forEach((fn) => {
            fn(data, eventName);
          });
        }
      },
    };
  }

  const tinySlider = function (options) {
    options = extend({
      container: '.slider',
      mode: 'carousel',
      axis: 'horizontal',
      items: 1,
      gutter: 0,
      edgePadding: 0,
      fixedWidth: false,
      autoWidth: false,
      viewportMax: false,
      slideBy: 1,
      center: false,
      controls: true,
      controlsPosition: 'top',
      controlsText: ['prev', 'next'],
      controlsContainer: false,
      prevButton: false,
      nextButton: false,
      nav: true,
      navPosition: 'top',
      navContainer: false,
      navAsThumbnails: false,
      arrowKeys: false,
      speed: 300,
      loop: true,
      rewind: false,
      autoHeight: false,
      responsive: false,
      // lazyload: false,
      lazyloadSelector: '.tns-lazy-img',
      touch: true,
      mouseDrag: false,
      swipeAngle: 15,
      nested: false,
      preventActionWhenRunning: false,
      preventScrollOnTouch: false,
      freezable: true,
      onInit: false,
      useLocalStorage: true,
    }, options || {});

    const doc = document;
    let tnsStorage = {};
    let localStorageAccess = options.useLocalStorage;

    if (localStorageAccess) {
      // check browser version and local storage access
      const browserInfo = navigator.userAgent;
      const uid = new Date();

      try {
        tnsStorage = win.localStorage;
        if (tnsStorage) {
          tnsStorage.setItem(uid, uid);
          localStorageAccess = tnsStorage.getItem(uid) === uid;
          tnsStorage.removeItem(uid);
        } else {
          localStorageAccess = false;
        }
        if (!localStorageAccess) { tnsStorage = {}; }
      } catch (e) {
        localStorageAccess = false;
      }

      if (localStorageAccess) {
        // remove storage when browser version changes
        if (tnsStorage.tnsApp && tnsStorage.tnsApp !== browserInfo) {
          ['tC', 'tPL', 'tMQ', 'tTf', 't3D', 'tTDu', 'tTDe', 'tADu', 'tADe', 'tTE', 'tAE'].forEach((item) => { tnsStorage.removeItem(item); });
        }
        // update browserInfo
        localStorage.tnsApp = browserInfo;
      }
    }

    const CALC = tnsStorage.tC ? checkStorageValue(tnsStorage.tC) : setLocalStorage(tnsStorage, 'tC', calc(), localStorageAccess);
    const PERCENTAGELAYOUT = tnsStorage.tPL ? checkStorageValue(tnsStorage.tPL) : setLocalStorage(tnsStorage, 'tPL', percentageLayout(), localStorageAccess);
    const CSSMQ = tnsStorage.tMQ ? checkStorageValue(tnsStorage.tMQ) : setLocalStorage(tnsStorage, 'tMQ', mediaquerySupport(), localStorageAccess);
    const TRANSFORM = tnsStorage.tTf ? checkStorageValue(tnsStorage.tTf) : setLocalStorage(tnsStorage, 'tTf', whichProperty('transform'), localStorageAccess);
    const HAS3DTRANSFORMS = tnsStorage.t3D ? checkStorageValue(tnsStorage.t3D) : setLocalStorage(tnsStorage, 't3D', has3DTransforms(TRANSFORM), localStorageAccess);
    const TRANSITIONDURATION = tnsStorage.tTDu ? checkStorageValue(tnsStorage.tTDu) : setLocalStorage(tnsStorage, 'tTDu', whichProperty('transitionDuration'), localStorageAccess);
    const TRANSITIONDELAY = tnsStorage.tTDe ? checkStorageValue(tnsStorage.tTDe) : setLocalStorage(tnsStorage, 'tTDe', whichProperty('transitionDelay'), localStorageAccess);
    const ANIMATIONDELAY = tnsStorage.tADe ? checkStorageValue(tnsStorage.tADe) : setLocalStorage(tnsStorage, 'tADe', whichProperty('animationDelay'), localStorageAccess);
    const TRANSITIONEND = tnsStorage.tTE ? checkStorageValue(tnsStorage.tTE) : setLocalStorage(tnsStorage, 'tTE', getEndProperty(TRANSITIONDURATION, 'Transition'), localStorageAccess);

    // get element nodes from selectors
    const supportConsoleWarn = win.console && typeof win.console.warn === 'function';
    const tnsList = ['container', 'controlsContainer', 'prevButton', 'nextButton', 'navContainer'];
    const optionsElements = {};

    tnsList.forEach((item) => {
      if (typeof options[item] === 'string') {
        const str = options[item];
        const el = doc.querySelector(str);
        optionsElements[item] = str;

        if (el && el.nodeName) {
          options[item] = el;
        } else if (supportConsoleWarn) {
          console.warn('Can\'t find', options[item]);
        }
      }
    });

    // make sure at least 1 slide
    if (options.container.children.length < 1) {
      if (supportConsoleWarn) { console.warn('No slides found in', options.container); }
      return;
    }

    // update options
    let { responsive } = options;
    const { nested } = options;
    const carousel = options.mode === 'carousel';

    if (responsive) {
      // apply responsive[0] to options and remove it
      if (0 in responsive) {
        options = extend(options, responsive[0]);
        delete responsive[0];
      }

      let responsiveTem = {};
      Object.keys(responsive).forEach((key) => {
        let val = responsive[key];
        val = typeof val === 'number' ? { items: val } : val;
        responsiveTem[key] = val;
      });
      responsive = responsiveTem;
      responsiveTem = null;
    }

    // === define and set variables ===
    if (!carousel) {
      options.axis = 'horizontal';
      options.slideBy = 'page';
      options.edgePadding = false;
    }

    const horizontal = options.axis === 'horizontal';
    const outerWrapper = doc.createElement('div');
    const innerWrapper = doc.createElement('div');
    let middleWrapper;
    const { container } = options;
    const containerParent = container.parentNode;
    let slideItems = container.children;
    const slideCount = slideItems.length;
    let breakpointZone;
    let windowWidth = getWindowWidth();
    let isOn = false;
    if (responsive) { setBreakpointZone(); }
    if (carousel) { container.className += ' tns-vpfix'; }

    const { autoWidth } = options;
    let fixedWidth = getOption('fixedWidth');
    let edgePadding = getOption('edgePadding');
    let gutter = getOption('gutter');
    let viewport = getViewportWidth();
    let center = getOption('center');
    let items = !autoWidth ? Math.floor(getOption('items')) : 1;
    let slideBy = getOption('slideBy');
    const viewportMax = options.viewportMax || options.fixedWidthViewportWidth;
    let speed = getOption('speed');
    const { rewind } = options;
    const loop = rewind ? false : options.loop;
    let autoHeight = getOption('autoHeight');
    let controls = getOption('controls');
    let controlsText = getOption('controlsText');
    // eslint-disable-next-line no-unused-vars
    let nav = getOption('nav');
    let touch = getOption('touch');
    let mouseDrag = getOption('mouseDrag');
    const sheet = createStyleSheet();
    let slidePositions; // collection of slide position
    const slideItemsOut = [];
    const cloneCount = loop ? getCloneCountForLoop() : 0;
    const slideCountNew = !carousel ? slideCount + cloneCount : slideCount + cloneCount * 2;
    const hasRightDeadZone = !!((fixedWidth || autoWidth) && !loop);
    const rightBoundary = null;
    const updateIndexBeforeTransform = !!((!carousel || !loop));
    // transfor;
    let transformAttr = horizontal ? 'left' : 'top';
    let transformPrefix = '';
    let transformPostfix = '';
    // index
    const getIndexMax = (function () {
      return () => {
        if (center && carousel && !loop) {
          return slideCount - 1;
        }
        return loop || carousel ? Math.max(0, slideCountNew - Math.ceil(items)) : slideCountNew - 1;
      };
    }());
    let index = getStartIndex(getOption('startIndex'));
    let indexCached = index;
    const indexMin = 0;
    let indexMax = !autoWidth ? getIndexMax() : null;
    const { preventActionWhenRunning } = options;
    const { swipeAngle } = options;
    let moveDirectionExpected = swipeAngle ? '?' : true;
    let running = false;
    const { onInit } = options;
    const events = new Events();
    // id, clas;
    let newContainerClasses = ` tns-slider tns-${options.mode}`;
    const slideId = container.id || getSlideId();
    let disable = getOption('disable');
    const { freezable } = options;
    let freeze = freezable && !autoWidth ? getFreeze() : false;
    const controlsEvents = {
      click: onControlsClick,
    };
    const touchEvents = {
      touchstart: onPanStart,
      touchmove: onPanMove,
      touchend: onPanEnd,
      touchcancel: onPanEnd,
    };
    const dragEvents = {
      mousedown: onPanStart,
      mousemove: onPanMove,
      mouseup: onPanEnd,
      mouseleave: onPanEnd,
    };
    const hasControls = hasOption('controls');
    const hasTouch = hasOption('touch');
    const hasMouseDrag = hasOption('mouseDrag');
    const slideActiveClass = 'tns-slide-active';

    let preventScroll = options.preventScrollOnTouch === 'force';

    let controlsContainer;
    let prevButton;
    let nextButton;
    if (hasControls) {
      controlsContainer = options.controlsContainer;
      prevButton = options.prevButton;
      nextButton = options.nextButton;
    }

    const initPosition = {};
    const lastPosition = {};
    let translateInit;
    let panStart;
    let rafIndex;
    let getDist;
    if (hasTouch || hasMouseDrag) {
      panStart = false;
      getDist = function (a, b) { return a.x - b.x; };
    }
    if (!autoWidth) { resetVariblesWhenDisable(disable || freeze); }

    if (TRANSFORM) {
      transformAttr = TRANSFORM;
      transformPrefix = 'translate';

      if (HAS3DTRANSFORMS) {
        transformPrefix += horizontal ? '3d(' : '3d(0px, ';
        transformPostfix = horizontal ? ', 0px, 0px)' : ', 0px)';
      } else {
        transformPrefix += horizontal ? 'X(' : 'Y(';
        transformPostfix = ')';
      }
    }

    if (carousel) { container.className = container.className.replace('tns-vpfix', ''); }
    initStructure();
    initSheet();
    initSliderTransform();

    // === COMMON FUNCTIONS === //
    function resetVariblesWhenDisable(condition) {
      if (condition) {
        controls = false;
        nav = false;
        touch = false;
        mouseDrag = false;
      }
    }

    function getCurrentSlide() {
      let tem = carousel ? index - cloneCount : index;
      while (tem < 0) { tem += slideCount; }
      return (tem % slideCount) + 1;
    }

    function getStartIndex(ind) {
      const startIndex = ind
        ? Math.max(0, Math.min(loop ? slideCount - 1 : slideCount - items, ind))
        : 0;
      return carousel ? startIndex + cloneCount : startIndex;
    }

    function getItemsMax() {
      // fixedWidth or autoWidth while viewportMax is not available
      if (autoWidth || (fixedWidth && !viewportMax)) {
        return slideCount - 1;
      // most cases
      }
      const str = fixedWidth ? 'fixedWidth' : 'items';
      const arr = [];

      if (fixedWidth || options[str] < slideCount) { arr.push(options[str]); }

      if (responsive) {
        Object.keys(responsive).forEach((bp) => {
          const tem = responsive[bp][str];
          if (tem && (fixedWidth || tem < slideCount)) { arr.push(tem); }
        });
      }

      if (!arr.length) { arr.push(0); }

      return Math.ceil(fixedWidth ? viewportMax / Math.min.apply(null, arr)
        : Math.max.apply(null, arr));
    }

    function getCloneCountForLoop() {
      const itemsMax = getItemsMax();
      let result = carousel ? Math.ceil((itemsMax * 5 - slideCount) / 2)
        : (itemsMax * 4 - slideCount);
      result = Math.max(itemsMax, result);

      return hasOption('edgePadding') ? result + 1 : result;
    }

    function getWindowWidth() {
      return win.innerWidth || doc.documentElement.clientWidth || doc.body.clientWidth;
    }

    function getInsertPosition(pos) {
      return pos === 'top' ? 'afterbegin' : 'beforeend';
    }

    function getClientWidth(el) {
      const div = doc.createElement('div'); // , rect, width;
      el.appendChild(div);
      const rect = div.getBoundingClientRect();
      const width = rect.right - rect.left;
      div.remove();
      return width || getClientWidth(el.parentNode);
    }

    function getViewportWidth() {
      const gap = edgePadding ? edgePadding * 2 - gutter : 0;
      return getClientWidth(containerParent) - gap;
    }

    function hasOption(item) {
      if (options[item]) {
        return true;
      }
      if (responsive) {
        Object.keys(responsive).forEach((bp) => {
          if (responsive[bp][item]) {
            return true;
          }
          return false;
        });
      }
      return false;
    }

    // get option:
    // fixed width: viewport, fixedWidth, gutter => items
    // others: window width => all variables
    // all: items => slideBy
    function getOption(item, ww) {
      if (ww == null) { ww = windowWidth; }

      if (item === 'items' && fixedWidth) {
        return Math.floor((viewport + gutter) / (fixedWidth + gutter)) || 1;
      }
      let result = options[item];

      if (responsive) {
        Object.keys(responsive).forEach((bp) => {
          // bp: convert string to number
          if (ww >= parseInt(bp, 10)) {
            if (item in responsive[bp]) { result = responsive[bp][item]; }
          }
        });
      }

      if (item === 'slideBy' && result === 'page') { result = getOption('items'); }
      if (!carousel && (item === 'slideBy' || item === 'items')) { result = Math.floor(result); }

      return result;
    }

    function getInnerWrapperStyles(
      edgePaddingTem,
      gutterTem,
      fixedWidthTem,
      speedTem,
      autoHeightBP,
    ) {
      let str = '';

      if (edgePaddingTem !== undefined) {
        let gap = edgePaddingTem;
        if (gutterTem) { gap -= gutterTem; }
        str = horizontal
          ? `margin: 0 ${gap}px 0 ${edgePaddingTem}px;`
          : `margin: ${edgePaddingTem}px 0 ${gap}px 0;`;
      } else if (gutterTem && !fixedWidthTem) {
        const gutterTemUnit = `-${gutterTem}px`;
        const dir = horizontal ? `${gutterTemUnit} 0 0` : `0 ${gutterTemUnit} 0`;
        str = `margin: 0 ${dir};`;
      }

      if (!carousel && autoHeightBP && TRANSITIONDURATION && speedTem) {
        str += getTransitionDurationStyle(speedTem);
      }
      return str;
    }

    function getContainerWidth(fixedWidthTem, gutterTem, itemsTem) {
      if (fixedWidthTem) {
        return `${(fixedWidthTem + gutterTem) * slideCountNew}px`;
      }
      return CALC
        ? `${CALC}(${slideCountNew * 100}% / ${itemsTem})`
        : `${(slideCountNew * 100) / itemsTem}%`;
    }

    function getSlideWidthStyle(fixedWidthTem, gutterTem, itemsTem) {
      let width;

      if (fixedWidthTem) {
        width = `${fixedWidthTem + gutterTem}px`;
      } else {
        if (!carousel) { itemsTem = Math.floor(itemsTem); }
        const dividend = carousel ? slideCountNew : itemsTem;
        width = CALC
          ? `${CALC}(100% / ${dividend})`
          : `${100 / dividend}%`;
      }

      width = `width:${width}`;

      // inner slider: overwrite outer slider styles
      return nested !== 'inner' ? `${width};` : `${width} !important;`;
    }

    function getCSSPrefix(name, num) {
      let prefix = name.substring(0, name.length - num).toLowerCase();
      if (prefix) { prefix = `-${prefix}-`; }

      return prefix;
    }

    function getTransitionDurationStyle(transitionSpeed) {
      return `${getCSSPrefix(TRANSITIONDURATION, 18)}transition-duration:${transitionSpeed / 1000}s;`;
    }

    function initStructure() {
      const classOuter = 'tns-outer';
      const classInner = 'tns-inner';

      outerWrapper.className = classOuter;
      innerWrapper.className = classInner;
      outerWrapper.id = `${slideId}-ow`;
      innerWrapper.id = `${slideId}-iw`;

      // set container properties
      if (container.id === '') { container.id = slideId; }
      newContainerClasses += PERCENTAGELAYOUT || autoWidth ? ' tns-subpixel' : ' tns-no-subpixel';
      newContainerClasses += CALC ? ' tns-calc' : ' tns-no-calc';
      if (autoWidth) { newContainerClasses += ' tns-autowidth'; }
      newContainerClasses += ` tns-${options.axis}`;
      container.className += newContainerClasses;

      // add constrain layer for carousel
      if (carousel) {
        middleWrapper = doc.createElement('div');
        middleWrapper.id = `${slideId}-mw`;
        middleWrapper.className = 'tns-ovh';

        outerWrapper.appendChild(middleWrapper);
        middleWrapper.appendChild(innerWrapper);
      } else {
        outerWrapper.appendChild(innerWrapper);
      }

      if (autoHeight) {
        const wp = middleWrapper || innerWrapper;
        wp.className += ' tns-ah';
      }

      containerParent.insertBefore(outerWrapper, container);
      innerWrapper.appendChild(container);

      // add id, class, aria attributes
      // before clone slides
      forEach(slideItems, (item, i) => {
        addClass(item, 'tns-item');
        if (!item.id) { item.id = `${slideId}-item${i}`; }
        setAttrs(item, {
          'aria-hidden': 'true',
          tabindex: '-1',
        });
      });

      // ## clone slides
      // carousel: n + slides + n
      // gallery:      slides + n
      if (cloneCount) {
        const fragmentBefore = doc.createDocumentFragment();
        const fragmentAfter = doc.createDocumentFragment();

        for (let j = cloneCount; j--;) {
          const num = j % slideCount;
          const cloneFirst = slideItems[num].cloneNode(true);
          removeAttrs(cloneFirst, 'id');
          fragmentAfter.insertBefore(cloneFirst, fragmentAfter.firstChild);

          if (carousel) {
            const cloneLast = slideItems[slideCount - 1 - num].cloneNode(true);
            removeAttrs(cloneLast, 'id');
            fragmentBefore.appendChild(cloneLast);
          }
        }

        container.insertBefore(fragmentBefore, container.firstChild);
        container.appendChild(fragmentAfter);
        slideItems = container.children;
      }
    }

    function initSliderTransform() {
      // ## images loaded/failed
      if (!(hasOption('autoHeight') || autoWidth || !horizontal)) {
        // set container transform property
        if (carousel) { doContainerTransformSilent(); }

        // update slider tools and events
        initTools();
        initEvents();
      }
    }

    function initSheet() {
      // gallery:
      // set animation classes and left value for gallery slider
      if (!carousel) {
        for (let i = index, l = index + Math.min(slideCount, items); i < l; i += 1) {
          const item = slideItems[i];
          item.style.left = `${((i - index) * 100) / items}%`;
        }
      }

      // #### LAYOUT

      // ## INLINE-BLOCK VS FLOAT

      // ## PercentageLayout:
      // slides: inline-block
      // remove blank space between slides by set font-size: 0

      // ## Non PercentageLayout:
      // slides: float
      //         margin-right: -100%
      //         margin-left: ~

      // Resource: https://docs.google.com/spreadsheets/d/147up245wwTXeQYve3BRSAD4oVcvQmuGsFteJOeA5xNQ/edit?usp=sharing
      if (horizontal) {
        if (PERCENTAGELAYOUT || autoWidth) {
          addCSSRule(sheet, `#${slideId} > .tns-item`, `font-size:${win.getComputedStyle(slideItems[0]).fontSize};`, getCssRulesLength(sheet));
          addCSSRule(sheet, `#${slideId}`, 'font-size:0;', getCssRulesLength(sheet));
        }
      }

      // ## BASIC STYLES
      if (CSSMQ) {
        let str;
        // middle wrapper style
        if (TRANSITIONDURATION) {
          str = middleWrapper && options.autoHeight ? getTransitionDurationStyle(options.speed) : '';
          addCSSRule(sheet, `#${slideId}-mw`, str, getCssRulesLength(sheet));
        }

        // inner wrapper styles
        str = getInnerWrapperStyles(
          options.edgePadding,
          options.gutter,
          options.fixedWidth,
          options.speed,
          options.autoHeight,
        );
        addCSSRule(sheet, `#${slideId}-iw`, str, getCssRulesLength(sheet));

        // container styles
        if (carousel) {
          str = horizontal && !autoWidth ? `width:${getContainerWidth(options.fixedWidth, options.gutter, options.items)};` : '';
          if (TRANSITIONDURATION) { str += getTransitionDurationStyle(speed); }
          addCSSRule(sheet, `#${slideId}`, str, getCssRulesLength(sheet));
        }

        // slide styles
        str = horizontal && !autoWidth ? getSlideWidthStyle(options.fixedWidth, options.gutter, options.items) : '';
        // set gallery items transition-duration
        if (!carousel) {
          if (TRANSITIONDURATION) { str += getTransitionDurationStyle(speed); }
          // if (ANIMATIONDURATION) { str += getAnimationDurationStyle(speed); }
        }
        if (str) { addCSSRule(sheet, `#${slideId} > .tns-item`, str, getCssRulesLength(sheet)); }

        // non CSS mediaqueries: IE8
        // ## update inner wrapper, container, slides if needed
        // set inline styles for inner wrapper & container
        // insert stylesheet (one line) for slides only (since slides are many)
      } else {
        // middle wrapper styles
        // update_carousel_transition_duration();

        // inner wrapper styles
        innerWrapper.style.cssText = getInnerWrapperStyles(
          edgePadding,
          gutter,
          fixedWidth,
          autoHeight,
        );

        // container styles
        if (carousel && horizontal && !autoWidth) {
          container.style.width = getContainerWidth(fixedWidth, gutter, items);
        }

        // slide styles
        const str = horizontal && !autoWidth ? getSlideWidthStyle(fixedWidth, gutter, items) : '';

        // append to the last line
        if (str) { addCSSRule(sheet, `#${slideId} > .tns-item`, str, getCssRulesLength(sheet)); }
      }

      // ## MEDIAQUERIES
      if (responsive && CSSMQ) {
        Object.keys(responsive).forEach((bp) => {
          // bp: convert string to number
          bp = parseInt(bp, 10);

          const opts = responsive[bp];
          let str = '';
          let middleWrapperStr = '';
          let innerWrapperStr = '';
          let containerStr = '';
          let slideStr = '';
          const itemsBP = !autoWidth ? getOption('items', bp) : null;
          const fixedWidthBP = getOption('fixedWidth', bp);
          const speedBP = getOption('speed', bp);
          const edgePaddingBP = getOption('edgePadding', bp);
          const autoHeightBP = getOption('autoHeight', bp);
          const gutterBP = getOption('gutter', bp);

          // middle wrapper string
          if (TRANSITIONDURATION && middleWrapper && getOption('autoHeight', bp) && 'speed' in opts) {
            middleWrapperStr = `#${slideId}-mw{${getTransitionDurationStyle(speedBP)}}`;
          }

          // inner wrapper string
          if ('edgePadding' in opts || 'gutter' in opts) {
            innerWrapperStr = `#${slideId}-iw{${getInnerWrapperStyles(edgePaddingBP, gutterBP, fixedWidthBP, speedBP, autoHeightBP)}}`;
          }

          // container string
          if (carousel && horizontal && !autoWidth && ('fixedWidth' in opts || 'items' in opts || (fixedWidth && 'gutter' in opts))) {
            containerStr = `width:${getContainerWidth(fixedWidthBP, gutterBP, itemsBP)};`;
          }
          if (TRANSITIONDURATION && 'speed' in opts) {
            containerStr += getTransitionDurationStyle(speedBP);
          }
          if (containerStr) {
            containerStr = `#${slideId}{${containerStr}}`;
          }

          // slide string
          if ('fixedWidth' in opts || (fixedWidth && 'gutter' in opts) || (!carousel && 'items' in opts)) {
            slideStr += getSlideWidthStyle(fixedWidthBP, gutterBP, itemsBP);
          }
          // set gallery items transition-duration
          if (!carousel && 'speed' in opts) {
            if (TRANSITIONDURATION) { slideStr += getTransitionDurationStyle(speedBP); }
          }
          if (slideStr) { slideStr = `#${slideId} > .tns-item{${slideStr}}`; }

          // add up
          str = middleWrapperStr + innerWrapperStr + containerStr + slideStr;

          if (str) {
            sheet.insertRule(`@media (min-width: ${bp / 16}em) {${str}}`, sheet.cssRules.length);
          }
        });
      }
    }

    function initTools() {
      // == slides ==
      updateSlideStatus();

      // == controlsInit ==
      if (hasControls) {
        if (!controlsContainer && (!prevButton || !nextButton)) {
          outerWrapper.insertAdjacentHTML(getInsertPosition(options.controlsPosition), `<div class="tns-controls" aria-label="Carousel Navigation" tabindex="0"><button data-controls="prev" tabindex="-1" aria-controls="${slideId}">${controlsText[0]}</button><button data-controls="next" tabindex="-1" aria-controls="${slideId}">${controlsText[1]}</button></div>`);

          controlsContainer = outerWrapper.querySelector('.tns-controls');
        }

        if (!prevButton || !nextButton) {
          const { children } = controlsContainer;
          ({ 0: prevButton } = children);
          ({ 1: nextButton } = children);
        }

        if (options.controlsContainer) {
          setAttrs(controlsContainer, {
            'aria-label': 'Carousel Navigation',
            tabindex: '0',
          });
        }

        if (options.controlsContainer || (options.prevButton && options.nextButton)) {
          setAttrs([prevButton, nextButton], {
            'aria-controls': slideId,
            tabindex: '-1',
          });
        }

        if (options.controlsContainer || (options.prevButton && options.nextButton)) {
          setAttrs(prevButton, { 'data-controls': 'prev' });
          setAttrs(nextButton, { 'data-controls': 'next' });
        }

        // add events
        if (controlsContainer) {
          addEvents(controlsContainer, controlsEvents);
        } else {
          addEvents(prevButton, controlsEvents);
          addEvents(nextButton, controlsEvents);
        }
      }
    }

    function initEvents() {
      // add events
      if (carousel && TRANSITIONEND) {
        const eve = {};
        eve[TRANSITIONEND] = onTransitionEnd;
        addEvents(container, eve);
      }

      if (touch) { addEvents(container, touchEvents, options.preventScrollOnTouch); }
      if (mouseDrag) { addEvents(container, dragEvents); }

      if (responsive || fixedWidth || autoWidth || autoHeight || !horizontal) {
        addEvents(win, { resize: onResize });
      }

      if (autoHeight) {
        if (nested === 'outer') {
          //
        }
      }

      events.on('indexChanged', additionalUpdates);
      if (nested === 'inner') { events.emit('innerLoaded', info()); }
      if (typeof onInit === 'function') { onInit(info()); }
      isOn = true;
    }

    // === ON RESIZE ===
    function onResize(e) {
      raf(() => { resizeTasks(getEvent(e)); });
    }

    function resizeTasks(e) {
      if (!isOn) { return; }
      if (nested === 'outer') { events.emit('outerResized', info(e)); }
      windowWidth = getWindowWidth();
      let bpChanged;
      const breakpointZoneTem = breakpointZone;
      let needContainerTransform = false;

      if (responsive) {
        setBreakpointZone();
        bpChanged = breakpointZoneTem !== breakpointZone;
        if (bpChanged) { events.emit('newBreakpointStart', info(e)); }
      }

      let itemsChanged;
      const itemsTem = items;
      const freezeTem = freeze;
      const touchTem = touch;
      const indexTem = index;

      let fixedWidthTem;
      let autoHeightTem;
      let controlsTextTem;
      let centerTem;
      let gutterTem;
      let edgePaddingTem;

      if (bpChanged) {
        fixedWidthTem = fixedWidth;
        autoHeightTem = autoHeight;
        controlsTextTem = controlsText;
        centerTem = center;

        if (!CSSMQ) {
          gutterTem = gutter;
          edgePaddingTem = edgePadding;
        }
      }

      // get option:
      // fixed width: viewport, fixedWidth, gutter => items
      // others: window width => all variables
      // all: items => slideBy
      controls = getOption('controls');
      nav = getOption('nav');
      touch = getOption('touch');
      center = getOption('center');
      mouseDrag = getOption('mouseDrag');

      if (bpChanged) {
        disable = getOption('disable');
        fixedWidth = getOption('fixedWidth');
        speed = getOption('speed');
        autoHeight = getOption('autoHeight');
        controlsText = getOption('controlsText');

        if (!CSSMQ) {
          edgePadding = getOption('edgePadding');
          gutter = getOption('gutter');
        }
      }
      // update options
      resetVariblesWhenDisable(disable);

      viewport = getViewportWidth(); // <= edgePadding, gutter

      if (fixedWidth || autoWidth) {
        indexMax = getIndexMax(); // autoWidth: <= rightBoundary, slidePositions
        // fixedWidth: <= rightBoundary, fixedWidth, gutter
      }

      if (bpChanged || fixedWidth) {
        items = getOption('items');
        slideBy = getOption('slideBy');
        itemsChanged = items !== itemsTem;

        if (itemsChanged) {
          if (!fixedWidth && !autoWidth) { indexMax = getIndexMax(); } // <= items
          // check index before transform in case
          // slider reach the right edge then items become bigger
          updateIndex();
        }
      }

      if (freezable && (bpChanged || fixedWidth || autoWidth)) {
        freeze = getFreeze(); // <= autoWidth: slidePositions, gutter, viewport, rightBoundary
        // <= fixedWidth: fixedWidth, gutter, rightBoundary
        // <= others: items

        if (freeze !== freezeTem) {
          if (freeze) {
            doContainerTransform(getContainerTransformValue(getStartIndex(0)));
          } else {
            needContainerTransform = true;
          }
        }
      }

      resetVariblesWhenDisable(disable || freeze); // controls, nav, touch, mouseDrag, arrowKeys

      if (touch !== touchTem) {
        if (touch) {
          addEvents(container, touchEvents, options.preventScrollOnTouch);
        } else {
          removeEvents(container, touchEvents);
        }
      }

      if (bpChanged) {
        if (fixedWidth !== fixedWidthTem || center !== centerTem) { needContainerTransform = true; }

        if (autoHeight !== autoHeightTem) {
          if (!autoHeight) { innerWrapper.style.height = ''; }
        }

        if (controls && controlsText !== controlsTextTem) {
          ({ 0: prevButton.innerHTML } = controlsText);
          ({ 1: nextButton.innerHTML } = controlsText);
        }
      } else if (center && (fixedWidth || autoWidth)) { needContainerTransform = true; }

      const indChanged = index !== indexTem;
      if (indChanged) {
        events.emit('indexChanged', info());
        needContainerTransform = true;
      } else if (itemsChanged) {
        if (!indChanged) { additionalUpdates(); }
      } else if (fixedWidth || autoWidth) {
        updateSlideStatus();
      }

      if (!disable && !freeze) {
        // non-meduaqueries: IE8
        if (bpChanged && !CSSMQ) {
          // inner wrapper styles
          if (edgePadding !== edgePaddingTem || gutter !== gutterTem) {
            innerWrapper.style.cssText = getInnerWrapperStyles(
              edgePadding,
              gutter,
              fixedWidth,
              speed,
              autoHeight,
            );
          }

          if (horizontal) {
            // container styles
            if (carousel) {
              container.style.width = getContainerWidth(fixedWidth, gutter, items);
            }

            // slide styles
            const str = getSlideWidthStyle(fixedWidth, gutter, items);

            // remove the last line and
            // add new styles
            addCSSRule(sheet, `#${slideId} > .tns-item`, str, getCssRulesLength(sheet));
          }
        }

        if (needContainerTransform) {
          doContainerTransformSilent();
          indexCached = index;
        }
      }

      if (bpChanged) { events.emit('newBreakpointEnd', info(e)); }
    }

    // === INITIALIZATION FUNCTIONS === //
    function getFreeze() {
      if (!fixedWidth && !autoWidth) {
        const a = center ? items - (items - 1) / 2 : items;
        return slideCount <= a;
      }

      const width = fixedWidth ? (fixedWidth + gutter) * slideCount : slidePositions[slideCount];
      let vp = edgePadding ? viewport + edgePadding * 2 : viewport + gutter;

      if (center) {
        vp -= fixedWidth ? (viewport - fixedWidth) / 2
          : (viewport - (slidePositions[index + 1] - slidePositions[index] - gutter)) / 2;
      }

      return width <= vp;
    }

    function setBreakpointZone() {
      breakpointZone = 0;
      Object.keys(responsive).forEach((bp) => {
        bp = parseInt(bp, 10); // convert string to number
        if (windowWidth >= bp) { breakpointZone = bp; }
      });
    }

    let updateIndex = (function () {
      return loop
        && carousel
          && function () {
            let leftEdge = indexMin;
            let rightEdge = indexMax;

            leftEdge += slideBy;
            rightEdge -= slideBy;

            // adjust edges when has edge paddings
            // or fixed-width slider with extra space on the right side
            if (edgePadding) {
              leftEdge += 1;
              rightEdge -= 1;
            } else if (fixedWidth) {
              if ((viewport + gutter) % (fixedWidth + gutter)) { rightEdge -= 1; }
            }

            if (cloneCount) {
              if (index > rightEdge) {
                index -= slideCount;
              } else if (index < leftEdge) {
                index += slideCount;
              }
            }
          };
    }());

    function getVisibleSlideRange(val) {
      if (val == null) { val = getContainerTransformValue(); }
      let start = index; let end; let rangestart; let
        rangeend;

      // get range start, range end for autoWidth and fixedWidth
      if (center || edgePadding) {
        if (autoWidth || fixedWidth) {
          rangestart = -(parseFloat(val) + edgePadding);
          rangeend = rangestart + viewport + edgePadding * 2;
        }
      } else if (autoWidth) {
        rangestart = slidePositions[index];
        rangeend = rangestart + viewport;
      }

      if (fixedWidth) {
        const cell = fixedWidth + gutter;
        if (center || edgePadding) {
          start = Math.floor(rangestart / cell);
          end = Math.ceil(rangeend / cell - 1);
        } else {
          end = start + Math.ceil(viewport / cell) - 1;
        }
      } else if (center || edgePadding) {
        const a = items - 1;
        if (center) {
          start -= a / 2;
          end = index + a / 2;
        } else {
          end = index + a;
        }

        if (edgePadding) {
          const b = (edgePadding * items) / viewport;
          start -= b;
          end += b;
        }

        start = Math.floor(start);
        end = Math.ceil(end);
      } else {
        end = start + items - 1;
      }

      start = Math.max(start, 0);
      end = Math.min(end, slideCountNew - 1);

      return [start, end];
    }

    function additionalUpdates() {
      updateSlideStatus();
    }

    // update slide
    function updateSlideStatus() {
      const range = getVisibleSlideRange();
      const start = range[0];
      const end = range[1];

      forEach(slideItems, (item, i) => {
        // show slides
        if (i >= start && i <= end) {
          if (hasAttr(item, 'aria-hidden')) {
            removeAttrs(item, ['aria-hidden', 'tabindex']);
            addClass(item, slideActiveClass);
          }
          // hide slides
        } else if (!hasAttr(item, 'aria-hidden')) {
          setAttrs(item, {
            'aria-hidden': 'true',
            tabindex: '-1',
          });
          removeClass(item, slideActiveClass);
        }
      });
    }

    function getLowerCaseNodeName(el) {
      return el.nodeName.toLowerCase();
    }

    // set duration
    function resetDuration(el, str) {
      if (TRANSITIONDURATION) { el.style[TRANSITIONDURATION] = str; }
    }

    function getContainerTransformValue(num) {
      if (num == null) { num = index; }
      num += 0.8;
      let val;
      if (horizontal && !autoWidth) {
        if (fixedWidth) {
          val = -(fixedWidth + gutter) * num;
        } else {
          const denominator = TRANSFORM ? slideCountNew : items;
          val = (-num * 100) / denominator;
        }
      } else {
        val = -slidePositions[num];
      }

      if (hasRightDeadZone) { val = Math.max(val, rightBoundary); }

      val += (horizontal && !autoWidth && !fixedWidth) ? '%' : 'px';

      return val;
    }

    function doContainerTransformSilent(val) {
      resetDuration(container, '0s');
      doContainerTransform(val);
    }

    function doContainerTransform(val) {
      if (val == null) { val = getContainerTransformValue(); }
      container.style[transformAttr] = transformPrefix + val + transformPostfix;
    }

    // make transfer after click/drag:
    // 1. change 'transform' property for mordern browsers
    // 2. change 'left' property for legacy browsers
    const transformCore = (function () {
      return carousel
        && function () {
          resetDuration(container, '');
          if (TRANSITIONDURATION || !speed) {
            // for morden browsers with non-zero duration or
            // zero duration for all browsers
            doContainerTransform();
            // run fallback function manually
            // when duration is 0 / container is hidden
            if (!speed || !isVisible(container)) { onTransitionEnd(); }
          }
        };
    }());

    function render(e, sliderMoved) {
      if (updateIndexBeforeTransform) { updateIndex(); }

      // render when slider was moved (touch or drag) even though index may not change
      if (index !== indexCached || sliderMoved) {
        // events
        events.emit('indexChanged', info());
        events.emit('transitionStart', info());

        running = true;
        transformCore();
      }
    }

    /*
       * Transfer prefixed properties to the same format
       * CSS: -Webkit-Transform => webkittransform
       * JS: WebkitTransform => webkittransform
       * @param {string} str - property
       *
       */
    function strTrans(str) {
      return str.toLowerCase().replace(/-/g, '');
    }

    // AFTER TRANSFORM
    // Things need to be done after a transfer:
    // 1. check index
    // 2. add classes to visible slide
    // 3. disable controls buttons when reach the first/last slide in non-loop slider
    // 4. update nav status
    // 5. lazyload images
    // 6. update container height
    function onTransitionEnd(event) {
      // check running on gallery mode
      // make sure trantionend/animationend events run only once
      if (carousel || running) {
        events.emit('transitionEnd', info(event));

        if (!carousel && slideItemsOut.length > 0) {
          for (let i = 0; i < slideItemsOut.length; i++) {
            const item = slideItemsOut[i];
            // set item positions
            item.style.left = '';

            if (ANIMATIONDELAY && TRANSITIONDELAY) {
              item.style[ANIMATIONDELAY] = '';
              item.style[TRANSITIONDELAY] = '';
            }
          }
        }

        /* update slides, nav, controls after checking ...
           * => legacy browsers who don't support 'event'
           *    have to check event first, otherwise event.target will cause an error
           * => or 'gallery' mode:
           *   + event target is slide item
           * => or 'carousel' mode:
           *   + event target is container,
           *   + event.property is the same with transform attribute
           */
        if (!event
              || (!carousel && event.target.parentNode === container)
              || (event.target === container
                && strTrans(event.propertyName) === strTrans(transformAttr))) {
          if (!updateIndexBeforeTransform) {
            const indexTem = index;
            updateIndex();
            if (index !== indexTem) {
              events.emit('indexChanged', info());

              doContainerTransformSilent();
            }
          }

          if (nested === 'inner') { events.emit('innerLoaded', info()); }
          running = false;
          indexCached = index;
        }
      }
    }

    // on controls click
    function onControlsClick(e, dir) {
      if (running) {
        if (preventActionWhenRunning) { return; } onTransitionEnd();
      }
      let passEventObject;

      if (!dir) {
        e = getEvent(e);
        let target = getTarget(e);

        while (target !== controlsContainer && [prevButton, nextButton]
          .indexOf(target) < 0) { target = target.parentNode; }

        const targetIn = [prevButton, nextButton].indexOf(target);
        if (targetIn >= 0) {
          passEventObject = true;
          dir = targetIn === 0 ? -1 : 1;
        }
      }

      if (dir) {
        index += Math.floor(slideBy) * dir;
        // pass e when click control buttons or keydown
        render((passEventObject || (e && e.type === 'keydown')) ? e : null);
      }
    }

    function getEvent(e) {
      e = e || win.event;
      return isTouchEvent(e) ? e.changedTouches[0] : e;
    }
    function getTarget(e) {
      return e.target || win.event.srcElement;
    }

    function isTouchEvent(e) {
      return e.type.indexOf('touch') >= 0;
    }

    function preventDefaultBehavior(e) {
      if (e.preventDefault) {
        e.preventDefault();
      } else {
        e.returnValue = false;
      }
    }

    function getMoveDirectionExpected() {
      return getTouchDirection(
        toDegree(
          lastPosition.y - initPosition.y,
          lastPosition.x - initPosition.x,
        ),
        swipeAngle,
      ) === options.axis;
    }

    function onPanStart(e) {
      if (running) {
        if (preventActionWhenRunning) { return; } onTransitionEnd();
      }

      panStart = true;
      if (rafIndex) {
        caf(rafIndex);
        rafIndex = null;
      }

      const $ = getEvent(e);
      events.emit(isTouchEvent(e) ? 'touchStart' : 'dragStart', info(e));

      if (!isTouchEvent(e) && ['img', 'a', 'div', 'p', 'span', 'strong'].indexOf(getLowerCaseNodeName(getTarget(e))) >= 0) {
        preventDefaultBehavior(e);
      }

      lastPosition.x = $.clientX;
      initPosition.x = $.clientX;
      lastPosition.y = $.clientY;
      initPosition.y = $.clientY;
      if (carousel) {
        translateInit = parseFloat(container.style[transformAttr].replace(transformPrefix, ''));
        resetDuration(container, '0s');
      }
    }

    function onPanMove(e) {
      if (panStart) {
        const $ = getEvent(e);
        lastPosition.x = $.clientX;
        lastPosition.y = $.clientY;

        if (carousel) {
          if (!rafIndex) { rafIndex = raf(() => { panUpdate(e); }); }
        } else {
          if (moveDirectionExpected === '?') { moveDirectionExpected = getMoveDirectionExpected(); }
          if (moveDirectionExpected) { preventScroll = true; }
        }

        if (preventScroll) { e.preventDefault(); }
      }
    }

    function panUpdate(e) {
      if (!moveDirectionExpected) {
        panStart = false;
        return;
      }
      caf(rafIndex);
      if (panStart) { rafIndex = raf(() => { panUpdate(e); }); }

      if (moveDirectionExpected === '?') { moveDirectionExpected = getMoveDirectionExpected(); }
      if (moveDirectionExpected) {
        if (!preventScroll && isTouchEvent(e)) { preventScroll = true; }

        try {
          if (e.type) { events.emit(isTouchEvent(e) ? 'touchMove' : 'dragMove', info(e)); }
        } catch (err) {
          console.warn('');
        }

        let x = translateInit;
        const dist = getDist(lastPosition, initPosition);
        if (!horizontal || fixedWidth || autoWidth) {
          x += dist;
          x += 'px';
        } else {
          const percentageX = TRANSFORM
            ? (dist * items * 100) / ((viewport + gutter) * slideCountNew)
            : (dist * 100) / (viewport + gutter);
          x += percentageX;
          x += '%';
        }

        container.style[transformAttr] = transformPrefix + x + transformPostfix;
      }
    }

    function onPanEnd(e) {
      if (panStart) {
        if (rafIndex) {
          caf(rafIndex);
          rafIndex = null;
        }
        if (carousel) { resetDuration(container, ''); }
        panStart = false;

        const $ = getEvent(e);
        lastPosition.x = $.clientX;
        lastPosition.y = $.clientY;
        const dist = getDist(lastPosition, initPosition);

        if (Math.abs(dist)) {
          // drag vs click
          if (!isTouchEvent(e)) {
            // prevent "click"
            const target = getTarget(e);
            addEvents(target, {
              click: function preventClick(event) {
                preventDefaultBehavior(event);
                removeEvents(target, { click: preventClick });
              },
            });
            const closestA = target.closest('a');
            if (closestA) {
              addEvents(closestA, {
                click: function preventClick(event) {
                  console.log('preventClosestAClick');
                  preventDefaultBehavior(event);
                  removeEvents(closestA, { click: preventClick });
                },
              });
            }
          }

          if (carousel) {
            rafIndex = raf(() => {
              if (horizontal && !autoWidth) {
                let indexMoved = (-dist * items) / (viewport + gutter);
                indexMoved = dist > 0 ? Math.floor(indexMoved) : Math.ceil(indexMoved);
                index += indexMoved;
              } else {
                const moved = -(translateInit + dist);
                if (moved <= 0) {
                  index = indexMin;
                } else if (moved >= slidePositions[slideCountNew - 1]) {
                  index = indexMax;
                } else {
                  let i = 0;
                  while (i < slideCountNew && moved >= slidePositions[i]) {
                    index = i;
                    if (moved > slidePositions[i] && dist < 0) { index += 1; }
                    i++;
                  }
                }
              }

              render(e, dist);
              events.emit(isTouchEvent(e) ? 'touchEnd' : 'dragEnd', info(e));
            });
          } else if (moveDirectionExpected) {
            onControlsClick(e, dist > 0 ? -1 : 1);
          }
        }
      }

      // reset
      if (options.preventScrollOnTouch === 'auto') { preventScroll = false; }
      if (swipeAngle) { moveDirectionExpected = '?'; }
    }

    function info(e) {
      return {
        container,
        slideItems,
        controlsContainer,
        hasControls,
        prevButton,
        nextButton,
        items,
        slideBy,
        cloneCount,
        slideCount,
        slideCountNew,
        index,
        indexCached,
        displayIndex: getCurrentSlide(),
        sheet,
        isOn,
        event: e || {},
      };
    }
  };

  return tinySlider;
}());

export default tns;
