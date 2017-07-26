define(['jquery'], function(require, exports, module) {
    var $ = require('jquery');

    // ==================== 组件主体 =====================
    var Excroll = function(opt) {
        var self = this;
        self._opt = $.extend({
            wrap: '.excroll', // 容器元素
            item: '.item', // 子元素过滤
            slider: 'none', // 切换效果
            timing: 'ease', // 切换缓动函数
            activeClass: 'active', // 当前元素类
            duration: 1000, // 切换过程时长
            loop: 'none', // 是否可循环，可选值none/prev/next/both，非none会拷贝子元素使元素个数至少5个
            swipeDirection: 'horizon|vertical', // 绑定手势，可选值horizon/vertical/horizon|vertical
            swipeArea: 'global', // 手势范围，全屏或容器元素，可选值global/local，不填则不绑定手势
            beforeScroll: null, // callback(oldPage, newPage)
            afterScroll: null   // callback(oldPage, newPage)
        }, opt);

        self._$wrap = $(self._opt.wrap || 'document').eq(0);
        self._$item = self._$wrap.children(self._opt.item);
        self._total = self._$item.size();
        if (self._total === 0) {return;}

        if (self._opt.loop != 'none' && self._total < 5) {
            // 拷贝至至少5个元素
            var copyCount = Math.ceil(5 / self._total) - 1;
            while (copyCount--) {
                self._$wrap.append(self._$item.clone());
            }
            self._$item = self._$wrap.children(self._opt.item);
            self._total = self._$item.size();
        }

        self._$item.hide();
        self._cur = 0;

        // 初始化样式
        self._$wrap.css({
            'height': '100%',
            'width': '100%',
            'position': 'relative'
        });
        self._$item.css({
            'height': '100%',
            'width': '100%',
            'position': 'absolute',
            'top': '0',
            'left': '0',
            'transition-property': 'none',
            'transition-duration': +self._opt.duration + 'ms',
            'transition-timing-function': self._opt.timing
        });

        self._slider = Object.prototype.toString.call(self._opt.slider) === '[object Object]'
            ? $.extend({}, ExcrollSlider['none'], self._opt.slider)
            : ExcrollSlider[self._opt.slider || 'none'] || ExcrollSlider['none'];

        setTimeout(function() {
            self._render(-1);
        }, 0);

        // 是否需要绑定滑动事件
        if (self._opt.swipeDirection && self._opt.swipeArea) {
            self.bindSwipeEvent();
        }
    };

    Excroll.prototype._getIndex = function(index) {
        var self = this;
        return index % self._total;
    };

    Excroll.prototype._getItem = function(index) {
        var self = this;
        if (self._opt.loop === 'none' && (index < 0 || index > self._total - 1)) {
            return null;
        }
        return self._$item.eq(self._getIndex(index));
    };

    Excroll.prototype._render = function(oldPage) {
        var self = this;
        if (self._rendering) {return;}
        self._rendering = true;

        var $curItem = self._getItem(self._cur),
            $prevItem = self._getItem(self._cur - 1),
            $nextItem = self._getItem(self._cur + 1),
            $beforePrevItem = self._getItem(self._cur - 2),
            $afterNextItem = self._getItem(self._cur + 2);

        $curItem.css('transition-property', 'all').css(self._slider.cur);
        $prevItem && $prevItem.css('transition-property', 'all').css(self._slider.prev);
        $nextItem && $nextItem.css('transition-property', 'all').css(self._slider.next);
        $beforePrevItem && $beforePrevItem.css('transition-property', 'all').css(self._slider.beforePrev);
        $afterNextItem && $afterNextItem.css('transition-property', 'all').css(self._slider.afterNext);

        $curItem.addClass(self._opt.activeClass);
        setTimeout(function() {
            $prevItem && $prevItem.removeClass(self._opt.activeClass);
            $nextItem && $nextItem.removeClass(self._opt.activeClass);
            self._rendering = false;
            oldPage !== -1 && self._opt.afterScroll && self._opt.afterScroll.call(self, oldPage, self._cur);
        }, self._opt.duration);

        // 隐藏除本页及上下页的其他页
        self._cur - 3 >= 0 && self._$item.eq(self._cur - 3).css('transition-property', 'none').hide();
        self._cur + 3 <= self._total - 1 && self._$item.eq(self._cur + 3).css('transition-property', 'none').hide();
    };

    Excroll.prototype._scrollTo = function(newPage) {
        var self = this;
        if (self._rendering) {return;}
        if (newPage > self._total - 1 && self._opt.loop !== 'next' && self._opt.loop !== 'both') {
            return;
        } else if (newPage < 0 && self._opt.loop !== 'prev' && self._opt.loop !== 'both') {
            return;
        } else {
            newPage = self._getIndex(newPage);
        }

        var lastPage = self._cur;
        if (self._opt.beforeScroll && false === self._opt.beforeScroll.call(self, lastPage, newPage)) {return;}
        self._cur = newPage;
        self._render(lastPage);
    };

    Excroll.prototype.scrollNext = function() {
        var self = this;
        self._scrollTo(self._cur + 1);
    };

    Excroll.prototype.scrollPrev = function() {
        var self = this;
        self._scrollTo(self._cur - 1);
    };

    // ==================== 滑动事件 =====================
    Excroll.prototype.bindSwipeEvent = function() {
        var self = this;
        var start, delta;
        var events = {
            start: function(evt) {
                evt = evt.originalEvent;
                var touches = evt.touches && evt.touches[0] || evt;
                // 起始坐标以及时间戳
                start = {
                    x: touches.pageX,
                    y: touches.pageY,
                    time: +new Date()
                };
                delta = {
                    x: 0,
                    y: 0
                }
            },
            move: function(evt) {
                evt.preventDefault();
                evt = evt.originalEvent;
                // 避免双指操作
                if (evt.touches && evt.touches.length > 1 || evt.scale && evt.scale !== 1) {return;}
                var touches = evt.touches && evt.touches[0] || evt;
                delta = {
                    x: touches.pageX - start.x,
                    y: touches.pageY - start.y
                }
            },
            end: function(evt) {
                start = {};
                // 时间大于250毫秒
                if (+new Date() - start.time > 250) {return;}
                var absDeltaX = Math.abs(delta.x),
                    absDeltaY = Math.abs(delta.y);
                // 横向纵向距离均小于20像素
                if (absDeltaX < 20 && absDeltaY < 20) {return;}

                if (absDeltaX > absDeltaY && self._opt.swipeDirection.indexOf('horizon') !== -1) {
                    delta.x > 0 ? self.scrollPrev() : self.scrollNext();
                } else if (absDeltaX < absDeltaY && self._opt.swipeDirection.indexOf('vertical') !== -1) {
                    delta.y > 0 ? self.scrollPrev() : self.scrollNext();
                }
            }
        };

        var $node = self._opt.swipeArea === 'global' ? $(document) : self._$wrap;
        $node.on('touchstart', function(evt) {
            events.start.call(this, evt);
            $node.on('touchmove', events.move);
            $node.on('touchend touchcancel', function(evt) {
                events.end.call(this, evt);
                $node.off('touchmove', events.move);
                $node.off('touchend touchcancel', arguments.callee);
            });
        });
        $node.on('mousedown', function(evt) {
            if (evt.which !== 1) {return;}
            events.start.call(this, evt);
            $node.on('mousemove', events.move);
            $node.on('mouseup', function(evt) {
                events.end.call(this, evt);
                $node.off('mousemove', events.move);
                $node.off('mouseup', arguments.callee);
            });
        });
    }

    // ==================== 切换器 =====================
    var ExcrollSlider = {};
    Excroll.registSlider = function(name, slider) {
        ExcrollSlider[name] = $.extend({}, ExcrollSlider['none'], slider);
    };
    // 无特效
    Excroll.registSlider('none', {
        beforePrev: {
            'display': 'none'
        },
        prev: {
            'display': 'none'
        },
        cur: {
            'display': 'block'
        },
        next: {
            'display': 'none'
        },
        afterNext: {
            'display': 'none'
        }
    });
    // 上下滚动
    Excroll.registSlider('scrollUpDown', {
        prev: {
            'display': 'block',
            '-webkit-transform': 'translateY(-100%)',
            'transform': 'translateY(-100%)',
            '-webkit-backface-visibility': 'hidden',
            'backface-visibility': 'hidden'
        },
        cur: {
            'display': 'block',
            '-webkit-transform': 'translateY(0)',
            'transform': 'translateY(0)',
            '-webkit-backface-visibility': 'hidden',
            'backface-visibility': 'hidden'
        },
        next: {
            'display': 'block',
            '-webkit-transform': 'translateY(100%)',
            'transform': 'translateY(100%)',
            '-webkit-backface-visibility': 'hidden',
            'backface-visibility': 'hidden'
        }
    });
    // 左右滚动
    Excroll.registSlider('scrollLeftRight', {
        prev: {
            'display': 'block',
            '-webkit-transform': 'translateX(-100%)',
            'transform': 'translateX(-100%)',
            '-webkit-backface-visibility': 'hidden',
            'backface-visibility': 'hidden'
        },
        cur: {
            'display': 'block',
            '-webkit-transform': 'translateX(0)',
            'transform': 'translateX(0)',
            'backface-visibility': 'hidden'
        },
        next: {
            'display': 'block',
            '-webkit-transform': 'translateX(100%)',
            'transform': 'translateX(100%)',
            '-webkit-backface-visibility': 'hidden',
            'backface-visibility': 'hidden'
        }
    });
    // 淡入淡出
    Excroll.registSlider('fadeInOut', {
        prev: {
            'display': 'block',
            'opacity': '0',
            '-webkit-backface-visibility': 'hidden',
            'backface-visibility': 'hidden'
        },
        cur: {
            'display': 'block',
            'opacity': '1',
            '-webkit-backface-visibility': 'hidden',
            'backface-visibility': 'hidden'
        },
        next: {
            'display': 'block',
            'opacity': '0',
            '-webkit-backface-visibility': 'hidden',
            'backface-visibility': 'hidden'
        }
    });
    // 滑入
    Excroll.registSlider('slideIn', {
        prev: {
            'display': 'block',
            '-webkit-transform': 'translateY(0)',
            'transform': 'translateY(0)',
            '-webkit-backface-visibility': 'hidden',
            'backface-visibility': 'hidden'
        },
        cur: {
            'display': 'block',
            '-webkit-transform': 'translateY(0)',
            'transform': 'translateY(0)',
            '-webkit-backface-visibility': 'hidden',
            'backface-visibility': 'hidden'
        },
        next: {
            'display': 'block',
            '-webkit-transform': 'translateY(100%)',
            'transform': 'translateY(100%)',
            '-webkit-backface-visibility': 'hidden',
            'backface-visibility': 'hidden'
        }
    });

    Excroll.init = function(opt) {
        var instance = new Excroll(opt);
        Excroll.instance = instance;
        return instance;
    };

    Excroll.scrollPrev = function() {
        Excroll.instance && Excroll.instance.scrollPrev();
    };

    Excroll.scrollNext = function() {
        Excroll.instance && Excroll.instance.scrollNext();
    };

    return Excroll;
});