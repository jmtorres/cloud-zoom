//////////////////////////////////////////////////////////////////////////////////
// Cloud Zoom V1.0.3
// Rev 201209181857
// (c) 2010-2012 by R Cecco. <http://www.professorcloud.com>
// MIT License
//
// Please retain this copyright header in all versions of the software
//
//////////////////////////////////////////////////////////////////////////////////
(function ($) {


    $(document).ready(function () {
        $('.cloud-zoom, .cloud-zoom-gallery').CloudZoom();
    });

    function CloudZoom($jWin, opts) {
        var $sImg = $('img', $jWin);
        var img1;
        var img2;
        var $zoomDiv = null;
        var $mouseTrap = null;
        var $lens = null;
        var $tint = null;
        var $softFocus = null;
        var $ie6Fix = null;
        var zoomImage;
        var controlTimer = 0;
        var cw, ch;
        var destU = 0;
        var destV = 0;
        var currV = 0;
        var currU = 0;
        var filesLoaded = 0;
        var mx, my;
        var ctx = this, zw;
        // Display an image loading message. This message gets deleted when the images have loaded and the zoom init function is called.
        // We add a small delay before the message is displayed to avoid the message flicking on then off again virtually immediately if the
        // images load really fast, e.g. from the cache.
        //var ctx = this;
        setTimeout(function () {
            if ($mouseTrap === null) {
                var w = $jWin.width();
                $zoomLoading = $('<div class="cloud-zoom-loading" >Loading...</div>');
                $zoomLoading.css({
                  'position': 'absolute',
                  'text-align': 'center',
                  'opacity': 0.5,
                  'top': '75%',
                  'left': (w / 2) - (w / 6) + 'px',
                  'width': w / 3 + 'px'
                });
                $jWin.parent().append($zoomLoading);
            }
        }, 200);


        var ie6FixRemove = function () {

            if ($ie6Fix !== null) {
                $ie6Fix.remove();
                $ie6Fix = null;
            }
        };

        // Removes cursor, tint layer, blur layer etc.
        this.removeBits = function () {
            //$mouseTrap.unbind();
            if ($lens) {
                $lens.remove();
                $lens = null;
            }
            if ($tint) {
                $tint.remove();
                $tint = null;
            }
            if ($softFocus) {
                $softFocus.remove();
                $softFocus = null;
            }
            ie6FixRemove();

            $('.cloud-zoom-loading', $jWin.parent()).remove();
        };


        this.destroy = function () {
            $jWin.data('zoom', null);

            if ($mouseTrap) {
                $mouseTrap.unbind();
                $mouseTrap.remove();
                $mouseTrap = null;
            }
            if ($zoomDiv) {
                $zoomDiv.remove();
                $zoomDiv = null;
            }
            //ie6FixRemove();
            this.removeBits();
            // DON'T FORGET TO REMOVE JQUERY 'DATA' VALUES
        };


        // This is called when the zoom window has faded out so it can be removed.
        this.fadedOut = function () {
            if ($zoomDiv) {
                $zoomDiv.remove();
                $zoomDiv = null;
            }
            this.removeBits();
            //ie6FixRemove();
        };

        this.controlLoop = function () {
            ctx.positionLens();
            controlTimer = setTimeout(function () {
                ctx.controlLoop();
            }, 30);
        };

        this.positionLens = function () {
            if ($lens) {
                var x = (mx - $sImg.offset().left - (cw * 0.5)) >> 0;
                var y = (my - $sImg.offset().top - (ch * 0.5)) >> 0;

                if (x < 0) {
                    x = 0;
                }
                else if (x > ($sImg.outerWidth() - cw)) {
                    x = ($sImg.outerWidth() - cw);
                }
                if (y < 0) {
                    y = 0;
                }
                else if (y > ($sImg.outerHeight() - ch)) {
                    y = ($sImg.outerHeight() - ch);
                }

                $lens.css({
                    left: x,
                    top: y
                });
                $lens.css('background-position', (-x) + 'px ' + (-y) + 'px');

                destU = (((x) / $sImg.outerWidth()) * zoomImage.width) >> 0;
                destV = (((y) / $sImg.outerHeight()) * zoomImage.height) >> 0;
                currU += (destU - currU) / opts.smoothMove;
                currV += (destV - currV) / opts.smoothMove;

                $zoomDiv.css('background-position', (-(currU >> 0) + 'px ') + (-(currV >> 0) + 'px'));
            }
        }

        this.init2 = function (img, id) {

            filesLoaded++;
            //console.log(img.src + ' ' + id + ' ' + img.width);
            if (id === 1) {
                zoomImage = img;
            }
            //this.images[id] = img;
            if (filesLoaded === 2) {
                this.init();
            }
        };

        /* Init function start.  */
        this.init = function () {
            // Remove loading message (if present);
            $('.cloud-zoom-loading', $jWin.parent()).remove();


            /* Add a box (mouseTrap) over the small image to trap mouse events.
               It has priority over zoom window to avoid issues with inner zoom.
               We need the dummy background image as IE does not trap mouse events on
               transparent parts of a div.
            */
            var $mouseTrap = $("<div class='mousetrap'/>");
            $mouseTrap.css({
                //'background-image': url(),
                'width': $sImg.outerWidth(),
                'height': $sImg.outerHeight(),
                'top': 0,
                'left': 0,
                'position': 'absolute',
                'z-index': 9999
            });
            $jWin.parent().append($mouseTrap);
            //////////////////////////////////////////////////////////////////////
            /* Do as little as possible in mousemove event to prevent slowdown. */
            $mouseTrap.bind('mousemove touchmove', this, function (event) {
                // Just update the mouse position
                if(event.originalEvent.touches && event.originalEvent.touches.length){
                    mx = event.originalEvent.touches[0].pageX;
                    my = event.originalEvent.touches[0].pageY;
                }
                else {
                    mx = event.pageX;
                    my = event.pageY;
                }
            });
            //////////////////////////////////////////////////////////////////////
            $mouseTrap.bind('mouseleave touchend', this, function (event) {
                clearTimeout(controlTimer);
                //event.data.removeBits();
                if($lens) {
                    $lens.fadeOut('fast');
                }
                if($tint) {
                    $tint.fadeOut('fast');
                }
                if($softFocus) {
                    $softFocus.fadeOut('fast');
                }
                $zoomDiv.hide('scale', 'fast', function () {
                    ctx.fadedOut();
                });
                $jWin.fadeTo('fast', 1);
                return false;
            });
            //////////////////////////////////////////////////////////////////////
            $mouseTrap.bind('mouseenter touchstart', this, function (event) {
                if(!!('ontouchstart' in document.documentElement)){
                    event.preventDefault();
                }
                if(event.originalEvent.touches && event.originalEvent.touches.length){
                    mx = event.originalEvent.touches[0].pageX;
                    my = event.originalEvent.touches[0].pageY;
                }
                else {
                    mx = event.pageX;
                    my = event.pageY;
                }
                zw = event.data;
                if ($zoomDiv) {
                    $zoomDiv.stop(true, false);
                    $zoomDiv.remove();
                }

                var xPos = opts.adjustX,
                    yPos = opts.adjustY;

                var siw = $sImg.outerWidth();
                var sih = $sImg.outerHeight();

                var w = opts.zoomWidth;
                var h = opts.zoomHeight;
                if (opts.zoomWidth == 'auto') {
                    w = siw;
                }
                if (opts.zoomHeight == 'auto') {
                    h = sih;
                }
                //$('#info').text( xPos + ' ' + yPos + ' ' + siw + ' ' + sih );
                var $appendTo = $jWin.parent(); // attach to the wrapper
                switch (opts.position) {
                    case 'top':
                        yPos -= h; // + opts.adjustY;
                        break;
                    case 'right':
                        xPos += siw; // + opts.adjustX;
                        break;
                    case 'bottom':
                        yPos += sih; // + opts.adjustY;
                        break;
                    case 'left':
                        xPos -= w; // + opts.adjustX;
                        break;
                    case 'inside':
                        w = siw;
                        h = sih;
                        break;
                    // All other values, try and find an id in the dom to attach to.
                    default:
                        $appendTo = $('#' + opts.position);
                        // If dom element doesn't exit, just use 'right' position as default.
                        if (!$appendTo.length) {
                            $appendTo = $jWin;
                            xPos += siw; //+ opts.adjustX;
                            yPos += sih; // + opts.adjustY;
                        } else {
                            w = $appendTo.innerWidth();
                            h = $appendTo.innerHeight();
                        }
                }

                $zoomDiv = $('<div id="cloud-zoom-big" class="cloud-zoom-big"/>');
                $zoomDiv.css({
                    'display': 'none',
                    'position': 'absolute',
                    'z-index': 99,
                    'left': xPos + 'px',
                    'top': yPos + 'px',
                    'width': w + 'px',
                    'height': h + 'px',
                    'background-image': 'url(' + zoomImage.src + ')'
                });
                $appendTo.append($zoomDiv);
                // Add the title from title tag.
                if (opts.showTitle && $sImg.attr('title')) {
                    $zoomDivTitle = $('<div class="cloud-zoom-title"/>');
                    $zoomDivTitle
                        .text($sImg.attr('title'))
                        .css('opacity', opts.titleOpacity);
                    $zoomDiv.append($zoomDivTitle);
                }

                // Fix ie6 select elements wrong z-index bug. Placing an iFrame over the select element solves the issue...
                if ($.browser.msie && $.browser.version < 7) {
                    $ie6Fix = $('<iframe frameborder="0" src="#"></iframe>').css({
                        position: "absolute",
                        left: xPos,
                        top: yPos,
                        zIndex: 99,
                        width: w,
                        height: h
                    }).insertBefore($zoomDiv);
                }

                if ($lens) {
                    $lens.remove();
                    $lens = null;
                } /* Work out size of cursor */
                cw = ($sImg.outerWidth() / zoomImage.width) * $zoomDiv.width();
                ch = ($sImg.outerHeight() / zoomImage.height) * $zoomDiv.height();

                // Attach mouse, initially invisible to prevent first frame glitch
                $lens = $('<div class="cloud-zoom-lens"/>');
                $lens.css({
                  'display': 'none',
                  'position': 'absolute',
                  'z-index': 98,
                  'width': cw + 'px',
                  'height': ch + 'px'
                });
                $jWin.append($lens);
                $mouseTrap.css('cursor', $lens.css('cursor'));

                zw.positionLens();

                $jWin.fadeTo('fast', 0.5);

                $zoomDiv.show('scale', {fade: true}, 'fast', function(){
                    var noTrans = false;

                    // Init tint layer if needed. (Not relevant if using inside mode)
                    if (opts.tint) {
                        $lens.css('background-image', 'url(' + $sImg.attr('src') + ')');
                        $tint = $('<div class="cloud-zoom-tint"/>');
                        $tint.css({
                          'display': 'none',
                          'position': 'absolute',
                          'left': 0,
                          'top': 0,
                          'width': $sImg.outerWidth(),
                          'height': $sImg.outerHeight(),
                          'background-color': opts.tint,
                          'opacity': opts.tintOpacity
                        });
                        $jWin.append($tint);

                        noTrans = true;
                        $tint.fadeIn('fast');
                    }
                    if (opts.softFocus) {
                        $lens.css('background-image', 'url(' + $sImg.attr('src') + ')');
                        $softFocus = $('<div class="cloud-zoom-soft"/>')
                        $softFocus.css({
                          'position': 'absolute',
                          'display': 'none',
                          'top': '2px',
                          'left': '2px',
                          'width': ($sImg.outerWidth() - 2) + 'px',
                          'height': ($sImg.outerHeight() - 2) + 'px',
                          'background-image': 'url(' + $sImg.attr('src') + ')',
                          'opacity': 0.5
                        });
                        noTrans = true;
                        $softFocus.fadeIn('fast');
                    }

                    if (!noTrans) {
                        $lens.css('opacity', opts.lensOpacity);
                    }
                    if ( opts.position !== 'inside' ) {
                        $lens.fadeIn('fast');
                    }

                    // Start processing.
                    zw.controlLoop();
                });

                return; // Don't return false here otherwise opera will not detect change of the mouse pointer type.
            });
        };

        img1 = new Image();
        $(img1).load(function () {
            ctx.init2(this, 0);
        });
        img1.src = $sImg.attr('src');

        img2 = new Image();
        $(img2).load(function () {
            ctx.init2(this, 1);
        });
        img2.src = $jWin.attr('href');
    }

    $.fn.CloudZoom = function (options) {
        // IE6 background image flicker fix
        try {
            document.execCommand("BackgroundImageCache", false, true);
        } catch (e) {}
        this.each(function () {
            var relOpts, opts;
            var $this = $(this);
            // Hmm...eval...slap on wrist.
            eval('var a = {' + $this.attr('rel') + '}');
            relOpts = a;
            if ($this.is('.cloud-zoom')) {
                $this.css({
                    'position': 'relative',
                    'display': 'block'
                });
                $('img', $this).css({
                    'display': 'block'
                });
                // Wrap an outer div around the link so we can attach things without them becoming part of the link.
                // But not if wrap already exists.
                if ($this.parent().attr('id') != 'wrap') {
                  $this.wrap('<div id="wrap" style="top:0px;z-index:9999;position:relative;"></div>');
                }
                opts = $.extend({}, $.fn.CloudZoom.defaults, options);
                opts = $.extend({}, opts, relOpts);
                $this.data('zoom', new CloudZoom($this, opts));

            } else if ($this.is('.cloud-zoom-gallery')) {
                opts = $.extend({}, relOpts, options);
                $this.data('relOpts', opts);
                $this.bind('click', $this, function (event) {
                    var data = event.data.data('relOpts');
                    // Destroy the previous zoom
                    $('#' + data.useZoom).data('zoom').destroy();
                    // Change the biglink to point to the new big image.
                    $('#' + data.useZoom).attr('href', event.data.attr('href'));
                    // Change the small image to point to the new small image.
                    $('#' + data.useZoom + ' img').attr('src', event.data.data('relOpts').smallImage);
                    // Init a new zoom with the new images.
                    $('#' + event.data.data('relOpts').useZoom).CloudZoom();
                    return false;
                });
            }
        });
        return this;
    };

    $.fn.CloudZoom.defaults = {
        zoomWidth: 'auto',
        zoomHeight: 'auto',
        position: 'right',
        tint: false,
        tintOpacity: 0.5,
        lensOpacity: 0.5,
        softFocus: false,
        smoothMove: 3,
        showTitle: true,
        titleOpacity: 0.5,
        adjustX: 0,
        adjustY: 0
    };

})(jQuery);
